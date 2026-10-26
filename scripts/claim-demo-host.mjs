// Прави реална сметка сопственик на еден демо домаќин (со неговите понуди), за да се најавите како него.
//   npm run demo:claim -- <host-slug> <email>
//   на пр.: npm run demo:claim -- nikola-stojanov ema.kachurkova@gmail.com
//
// Ако сметка со таа е-пошта не постои, се создава и лозинката се внесува скриено на терминалот
// (никогаш како аргумент). Ако постои, мора да нема свој профил на домаќин.
// Демо сметката (demo+<slug>@classnest.invalid) се брише. Безбедно: ако нешто не успее, ништо не се менува.

import mysql from "mysql2/promise";
import { describeDbError } from "../src/server/db/describe-error.mjs";
import { uuidv7 } from "../src/server/platform/ids.mjs";
import { hashPassword } from "../src/lib/password.mjs";
import { askNewPassword } from "./prompt.mjs";

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

const [slug, rawEmail] = process.argv.slice(2);
const email = String(rawEmail ?? "").trim().toLowerCase();
if (!slug || !email.includes("@")) {
  console.error("Употреба: npm run demo:claim -- <host-slug> <email>");
  process.exit(1);
}

const pool = mysql.createPool({ uri: url, connectionLimit: 1, charset: "utf8mb4", timezone: "Z" });
const connection = await pool.getConnection();

try {
  await connection.query("SET time_zone = '+00:00'");

  const [hostRows] = await connection.execute(
    `SELECT h.id, h.display_name, a.id AS account_id, a.email AS account_email
       FROM hosts h JOIN accounts a ON a.id = h.account_id WHERE h.slug = ?`,
    [slug],
  );
  if (hostRows.length === 0) throw new Error(`Нема домаќин со slug „${slug}“. Прво: npm run db:seed:demo`);
  const host = hostRows[0];
  if (!host.account_email.endsWith("@classnest.invalid")) {
    throw new Error(`Домаќинот „${slug}“ веќе има вистинска сметка (${host.account_email}).`);
  }

  const [existing] = await connection.execute("SELECT id FROM accounts WHERE email = ?", [email]);
  let accountId = existing[0]?.id;
  let passwordHash = null; // само за нова сметка

  if (accountId) {
    const [own] = await connection.execute("SELECT slug FROM hosts WHERE account_id = ?", [accountId]);
    if (own.length > 0) {
      throw new Error(
        `Сметката ${email} веќе има свој профил на домаќин (${own[0].slug}). Користете друга е-пошта или почнете со нова база.`,
      );
    }
  } else {
    const password = await askNewPassword(email);
    passwordHash = await hashPassword(password);
    accountId = uuidv7();
  }

  const now = new Date();
  await connection.beginTransaction();
  try {
    if (!existing[0]) {
      await connection.execute(
        `INSERT INTO accounts (id, email, full_name, password_hash, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?)`,
        [accountId, email, host.display_name, passwordHash, now, now],
      );
      await connection.execute("INSERT INTO account_roles (account_id, role) VALUES (?, 'HOST')", [accountId]);
    } else {
      await connection.execute("INSERT IGNORE INTO account_roles (account_id, role) VALUES (?, 'HOST')", [accountId]);
    }
    await connection.execute("UPDATE hosts SET account_id = ? WHERE id = ?", [accountId, host.id]);
    await connection.execute("DELETE FROM accounts WHERE id = ?", [host.account_id]); // демо сметката
    await connection.execute(
      "INSERT INTO audit_log (id, actor_account_id, action, entity_type, entity_id, diff, created_at) VALUES (?, NULL, 'host.claim', 'host', ?, ?, ?)",
      [uuidv7(), host.id, JSON.stringify({ via: "cli", slug }), now],
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  }

  console.log(`Готово: ${email} е сопственик на „${host.display_name}“ (${slug}). Најавете се на /host/login.`);
  console.log("Следно ќе ве води низ поставувањето (достапност, исплата) пред да се отвори профилот.");
} catch (error) {
  console.error("Не успеа:", error instanceof Error && !("code" in error) ? error.message : describeDbError(error));
  process.exitCode = 1;
} finally {
  connection.release();
  await pool.end();
}
