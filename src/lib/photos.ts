import { promises as fs } from "fs";
import path from "path";

// PoC складиште: фајлови на диск во ./uploads/<slug>/.
// Во продукција се менува со S3/R2 + база, а останатиот код останува ист.
const ROOT = path.join(process.cwd(), "uploads");

export const MAX_PHOTOS_PER_CLASS = 12;
export const MAX_BYTES = 5 * 1024 * 1024;

export const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

// Имињата ги генерираме ние, па се строго валидираат (спречува path traversal).
const NAME_RE = /^\d{13}-[a-f0-9]{8}\.(jpg|png|webp)$/;

export const isValidPhotoName = (name: string) => NAME_RE.test(name);

export const photoUrl = (slug: string, name: string) => `/api/photos/${slug}/${name}`;

export const photoPath = (slug: string, name: string) => path.join(ROOT, slug, name);

export const classDir = (slug: string) => path.join(ROOT, slug);

/** Имиња на фотографиите за едно искуство, по редослед на качување. */
export async function listPhotos(slug: string): Promise<string[]> {
  try {
    const files = await fs.readdir(classDir(slug));
    return files.filter(isValidPhotoName).sort();
  } catch {
    return [];
  }
}

export async function listPhotoUrls(slug: string): Promise<string[]> {
  return (await listPhotos(slug)).map((n) => photoUrl(slug, n));
}

/** Проверка на вистинскиот формат преку првите бајти, не само преку MIME од клиентот. */
export function detectImageType(buf: Buffer): string | null {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return "image/png";
  if (
    buf.length > 12 &&
    buf.subarray(0, 4).toString("ascii") === "RIFF" &&
    buf.subarray(8, 12).toString("ascii") === "WEBP"
  )
    return "image/webp";
  return null;
}
