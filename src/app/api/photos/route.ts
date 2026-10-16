import { revalidatePath } from "next/cache";
import { getAccount, sameOrigin } from "@/lib/auth";
import { findOwnedTarget } from "@/lib/ownership";
import { deletePhoto, isValidPhotoName, listPhotos, prepareImages, savePhotos } from "@/lib/photos";

const fail = (error: string, status = 400) => Response.json({ error }, { status });

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("Недозволено барање.", 403);
  const account = await getAccount();
  if (!account) return fail("Најавете се.", 401);

  const form = await req.formData();
  const key = String(form.get("key") ?? "");
  const target = await findOwnedTarget(account, key);
  if (!target) return fail("Немате пристап до ова.", 403);

  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  const prepared = await prepareImages(files, (await listPhotos(key)).length, target.max);
  if ("error" in prepared) return fail(prepared.error);

  await savePhotos(key, prepared.items);
  revalidatePath("/", "layout");
  return Response.json({ ok: true, added: prepared.items.length });
}

export async function DELETE(req: Request) {
  if (!sameOrigin(req)) return fail("Недозволено барање.", 403);
  const account = await getAccount();
  if (!account) return fail("Најавете се.", 401);

  const body = await req.json().catch(() => null);
  const key = String(body?.key ?? "");
  const name = String(body?.name ?? "");
  if (!(await findOwnedTarget(account, key))) return fail("Немате пристап до ова.", 403);
  if (!isValidPhotoName(name)) return fail("Невалидна фотографија.");

  await deletePhoto(key, name);
  revalidatePath("/", "layout");
  return Response.json({ ok: true });
}
