// Ги копира фотографиите од seed-photos/<slug>/ во uploads/<slug>/
// (истиот формат што го користи качувањето од /host/photos).
// Употреба: npm run seed:photos

import { promises as fs } from "node:fs";
import { randomBytes } from "node:crypto";
import path from "node:path";

const SEED = path.join(process.cwd(), "seed-photos");
const OUT = path.join(process.cwd(), "uploads");
const MAX_PER_CLASS = 12;
const MAX_BYTES = 5 * 1024 * 1024;

const detect = (b) => {
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return "png";
  if (b.length > 12 && b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP")
    return "webp";
  return null;
};

let dirs;
try {
  dirs = (await fs.readdir(SEED, { withFileTypes: true })).filter((d) => d.isDirectory());
} catch {
  console.error("Нема папка seed-photos/. Направете ја и ставете подпапка по искуство.");
  process.exit(1);
}

let total = 0;
for (const dir of dirs) {
  const slug = dir.name;
  const files = (await fs.readdir(path.join(SEED, slug))).sort().slice(0, MAX_PER_CLASS);
  await fs.mkdir(path.join(OUT, slug), { recursive: true });
  let n = 0;
  for (const file of files) {
    const data = await fs.readFile(path.join(SEED, slug, file));
    const ext = detect(data);
    if (!ext || data.length > MAX_BYTES) {
      console.warn(`  прескокнато: ${slug}/${file} (не е JPG/PNG/WebP или е над 5 MB)`);
      continue;
    }
    const name = `${Date.now() + n}-${randomBytes(4).toString("hex")}.${ext}`;
    await fs.writeFile(path.join(OUT, slug, name), data);
    n++;
  }
  total += n;
  console.log(`${slug}: ${n} фотографии`);
}
console.log(`Готово. Вкупно: ${total}.`);
