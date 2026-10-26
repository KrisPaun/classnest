// Еднократно префрлање на постоечките сметки од .data/db.json во MySQL (чекор 3).
//   npm run db:import-accounts
//
// Што прави:
//  - ги копира сметките (иста лозинка, ист формат), со улога HOST и врска кон профилот на домаќинот;
//  - го шифрира телефонот (ако го има) и го става кај профилот на домаќинот во JSON датотеката;
//  - на крај правило резервна копија на .data/db.json и ги брише „accounts“ и „sessions“ од неа.
// Сесиите не се префрлаат: сите се најавуваат одново. Безбедно е да се врти повторно.

import { copyFileSync, existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import mysql from "mysql2/promise";
import { describeDbError } from "../src/server/db/describe-error.mjs";
import { encryptSecret, secretBoxConfigured } from "../src/lib/secret-box.mjs";
import { uuidv7 } from "../src/server/platform/ids.mjs";

const FILE = ".data/db.json";

if (!process.env.DATABASE_URL) {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // нема .env.local
  }
}
const url = process.env.DATABASE_URL;
if (!url || !url.startsWith("mysql://")) {
  console.error("DATABASE_URL недостасува или не почнува со mysql://");
  process.exit(1);
}
if (!existsSync(FILE)) {
  console.log("Нема .data/db.json, нема што да се префрли.");
  process.exit(0);
}

const data = JSON.parse(readFileSync(FILE, "utf8"));
const accounts = Array.isArray(data.accounts) ? data.accounts : [];
if (accounts.length === 0) {
  console.log("Во .data/db.json нема сметки (веќе се префрлени).");
  process.exit(0);
}

const isUuid = (v) => typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(v);

const pool = mysql.createPool({ uri: url, connectionLimit: 1, charset: "utf8mb4", timezone: "Z" });
const connection = await pool.getConnection();

let imported = 0;
let skipped = 0;
let phonesMoved = 0;
let phonesSkipped = 0;

try {
  for (const account of accounts) {
    const email = String(account.email ?? "").trim().toLowerCase();
    const [existing] = await connection.execute("SELECT id FROM accounts WHERE email = ?", [email]);
    if (existing.length > 0) {
      skipped++;
      continue;
    }

    const id = isUuid(account.id) ? account.id : uuidv7();
    await connection.beginTransaction();
    try {
      await connection.execute(
        `INSERT INTO accounts (id, email, full_name, password_hash, legacy_host_slug, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, email, account.name, account.passwordHash, account.hostSlug ?? null, new Date(account.createdAt ?? Date.now())],
      );
      await connection.execute("INSERT INTO account_roles (account_id, role) VALUES (?, 'HOST')", [id]);
      await connection.commit();
      imported++;
    } catch (error) {
      await connection.rollback();
      throw error;
    }

    // Телефонот (приватен) оди шифриран кај профилот на домаќинот, додека не се префрли во чекор 4.
    if (account.phone) {
      const host = (data.hosts ?? []).find((h) => h.slug === account.hostSlug);
      if (host && secretBoxConfigured()) {
        host.phoneEnc = encryptSecret(account.phone);
        phonesMoved++;
      } else {
        phonesSkipped++;
      }
    }
  }

  // Сè успеа: резервна копија, па чистење на JSON датотеката.
  const backup = `${FILE}.bak-before-mysql-${Date.now()}`;
  copyFileSync(FILE, backup);
  delete data.accounts;
  delete data.sessions;
  writeFileSync(`${FILE}.tmp`, JSON.stringify(data, null, 2), { mode: 0o600 });
  renameSync(`${FILE}.tmp`, FILE);

  console.log(`Префрлени сметки: ${imported}. Прескокнати (веќе постојат): ${skipped}.`);
  if (phonesMoved) console.log(`Шифрирани телефони: ${phonesMoved}.`);
  if (phonesSkipped) console.log(`Телефони што не се префрлени (нема BANK_DATA_KEY или профил): ${phonesSkipped}. Останаа во резервната копија.`);
  console.log(`Резервна копија: ${backup} (содржи хешови на лозинки: чувајте ја приватно или избришете ја).`);
} catch (error) {
  console.error("Увозот не успеа, .data/db.json не е променет:", describeDbError(error));
  process.exitCode = 1;
} finally {
  connection.release();
  await pool.end();
}
