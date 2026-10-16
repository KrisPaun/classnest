import { promises as fs } from "fs";
import { randomBytes } from "crypto";
import path from "path";

// PoC складиште: фајлови на диск во ./uploads/<key>/.
// <key> е slug на искуство (на пр. "domasna-pasta") или "host-<slug>" за профилни фотографии.
// Во продукција се менува со S3/R2 + база, а останатиот код останува ист.
const ROOT = path.join(process.cwd(), "uploads");

export const MAX_PHOTOS_PER_CLASS = 12;
export const MAX_PROFILE_PHOTOS = 12;
export const MAX_REGISTER_PHOTOS = 6;
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

// Клучевите и имињата се строго валидирани (спречува path traversal).
const KEY_RE = /^[a-z0-9][a-z0-9-]{0,79}$/;
const NAME_RE = /^\d{13}-[a-f0-9]{8}\.(jpg|png|webp)$/;

export const isValidKey = (key: string) => KEY_RE.test(key);
export const isValidPhotoName = (name: string) => NAME_RE.test(name);

export const hostPhotoKey = (hostSlug: string) => `host-${hostSlug}`;
/** Фотографии на искуство што го создал домаќин од чекор 2. */
export const experiencePhotoKey = (id: string) => `exp-${id}`;
/** Профилна фотографија (аватар): една фотографија по домаќин. */
export const avatarKey = (hostSlug: string) => `avatar-${hostSlug}`;

export const photoUrl = (key: string, name: string) => `/api/photos/${key}/${name}`;

export function photoPath(key: string, name: string) {
  if (!isValidKey(key) || !isValidPhotoName(name)) throw new Error("Invalid photo path");
  return path.join(ROOT, key, name);
}

/** Имиња на фотографиите, по редослед на качување. */
export async function listPhotos(key: string): Promise<string[]> {
  if (!isValidKey(key)) return [];
  try {
    const files = await fs.readdir(path.join(ROOT, key));
    return files.filter(isValidPhotoName).sort();
  } catch {
    return [];
  }
}

export async function listPhotoUrls(key: string): Promise<string[]> {
  return (await listPhotos(key)).map((n) => photoUrl(key, n));
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

export type PreparedImage = { name: string; data: Buffer };

/** Ги валидира сите фајлови пред да се зачува било што (сè или ништо). */
export async function prepareImages(
  files: File[],
  existing: number,
  max: number,
): Promise<{ error: string } | { items: PreparedImage[] }> {
  if (files.length === 0) return { error: "Изберете барем една фотографија." };
  if (existing + files.length > max) return { error: `Максимум ${max} фотографии.` };

  const items: PreparedImage[] = [];
  for (const file of files) {
    if (file.size > MAX_BYTES) return { error: `„${file.name}“ е поголема од 5 MB.` };
    const data = Buffer.from(await file.arrayBuffer());
    const type = detectImageType(data);
    if (!type || !EXTENSIONS[type]) return { error: `„${file.name}“ не е JPG, PNG или WebP.` };
    items.push({ name: `${Date.now() + items.length}-${randomBytes(4).toString("hex")}.${EXTENSIONS[type]}`, data });
  }
  return { items };
}

export async function savePhotos(key: string, items: PreparedImage[]) {
  if (!isValidKey(key)) throw new Error("Invalid photo key");
  await fs.mkdir(path.join(ROOT, key), { recursive: true });
  for (const item of items) await fs.writeFile(photoPath(key, item.name), item.data);
}

export async function deletePhoto(key: string, name: string) {
  await fs.unlink(photoPath(key, name)).catch(() => undefined);
}
