import { promises as fs } from "fs";
import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { getClass } from "@/data/classes";
import {
  EXTENSIONS,
  MAX_BYTES,
  MAX_PHOTOS_PER_CLASS,
  classDir,
  detectImageType,
  isValidPhotoName,
  listPhotos,
  photoPath,
} from "@/lib/photos";

// ВНИМАНИЕ (PoC): нема најава. Пред јавно објавување, овде мора да се провери
// дека најавениот домаќин е сопственик на искуството.

const fail = (error: string, status = 400) => Response.json({ error }, { status });

export async function POST(req: Request) {
  const form = await req.formData();
  const slug = String(form.get("slug") ?? "");
  if (!getClass(slug)) return fail("Непознато искуство.", 404);

  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return fail("Изберете барем една фотографија.");

  const existing = await listPhotos(slug);
  if (existing.length + files.length > MAX_PHOTOS_PER_CLASS) {
    return fail(`Максимум ${MAX_PHOTOS_PER_CLASS} фотографии по искуство.`);
  }

  const prepared: { name: string; data: Buffer }[] = [];
  for (const file of files) {
    if (file.size > MAX_BYTES) return fail(`„${file.name}“ е поголема од 5 MB.`);
    const data = Buffer.from(await file.arrayBuffer());
    const type = detectImageType(data);
    if (!type || !EXTENSIONS[type]) return fail(`„${file.name}“ не е JPG, PNG или WebP.`);
    const name = `${Date.now() + prepared.length}-${randomBytes(4).toString("hex")}.${EXTENSIONS[type]}`;
    prepared.push({ name, data });
  }

  await fs.mkdir(classDir(slug), { recursive: true });
  for (const p of prepared) await fs.writeFile(photoPath(slug, p.name), p.data);

  revalidatePath("/", "layout");
  return Response.json({ ok: true, added: prepared.length });
}

export async function DELETE(req: Request) {
  const body = await req.json().catch(() => null);
  const slug = String(body?.slug ?? "");
  const name = String(body?.name ?? "");
  if (!getClass(slug)) return fail("Непознато искуство.", 404);
  if (!isValidPhotoName(name)) return fail("Невалидна фотографија.");

  await fs.unlink(photoPath(slug, name)).catch(() => undefined);
  revalidatePath("/", "layout");
  return Response.json({ ok: true });
}
