// Поврзува нов account со постоечки демо домаќин, за да може да се тестира
// управувањето со фотографиите на неговите искуства.
//
// Употреба:
//   npm run host:create -- <email> <лозинка> <host-slug> [Име]
// Пример:
//   npm run host:create -- nikola@example.com "tajna-lozinka-1" nikola-stojanov

import { promises as fs } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { hashPassword } from "../src/lib/password.mjs";

const [email, password, hostSlug, ...nameParts] = process.argv.slice(2);
if (!email || !password || !hostSlug) {
  console.error("Употреба: npm run host:create -- <email> <лозинка> <host-slug> [Име]");
  process.exit(1);
}
if (password.length < 8) {
  console.error("Лозинката мора да има најмалку 8 знаци.");
  process.exit(1);
}
if (!/^[a-z0-9-]+$/.test(hostSlug)) {
  console.error("Невалиден host-slug.");
  process.exit(1);
}

const FILE = path.join(process.cwd(), ".data", "db.json");
let db = { accounts: [], hosts: [], sessions: [] };
try {
  db = { ...db, ...JSON.parse(await fs.readFile(FILE, "utf8")) };
} catch (e) {
  if (e.code !== "ENOENT") throw e;
}

const normalized = email.trim().toLowerCase();
if (db.accounts.some((a) => a.email === normalized)) {
  console.error("Веќе постои account со таа е-пошта.");
  process.exit(1);
}

db.accounts.push({
  id: randomUUID(),
  email: normalized,
  name: nameParts.join(" ") || hostSlug,
  passwordHash: await hashPassword(password),
  hostSlug,
  createdAt: new Date().toISOString(),
});

await fs.mkdir(path.dirname(FILE), { recursive: true });
await fs.writeFile(FILE, JSON.stringify(db, null, 2), { mode: 0o600 });
console.log(`Креиран account ${normalized} за профилот ${hostSlug}.`);
