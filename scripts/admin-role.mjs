// Администраторска улога. Единствен начин да се стане админ (нема веб-екран за ова).
//   npm run admin:role -- create <email> "<Име и презиме>"   нова сметка само за админ (лозинка се внесува скриено)
//   npm run admin:role -- grant <email>                      дава улога на веќе постоечка сметка
//   npm run admin:role -- revoke <email>                     одзема улога
// Препорака: посебна сметка само за админ, не личната или сметката на домаќин.

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

const [action, rawEmail, rawName] = process.argv.slice(2);
const email = String(rawEmail ?? "").trim().toLowerCase();
const fullName = String(rawName ?? "").trim();
const usage = 'Употреба: npm run admin:role -- create <email> "<Име>" | grant <email> | revoke <email>';

if (!["create", "grant", "revoke"].includes(action) || !email.includes("@") || email.length > 254) {
  console.error(usage);
  process.exit(1);
}
if (action === "create" && (fullName.length < 2 || fullName.length > 100)) {
  console.error(`Наведете име (2 до 100 знаци). ${usage}`);
  process.exit(1);
}

const pool = mysql.createPool({ uri: url, connectionLimit: 1, charset: "utf8mb4", timezone: "Z" });
const audit = (connection, auditAction, accountId, diff = {}) =>
  connection.execute(
    "INSERT INTO audit_log (id, actor_account_id, action, entity_type, entity_id, diff, created_at) VALUES (?, NULL, ?, 'account', ?, ?, ?)",
    [uuidv7(), auditAction, accountId, JSON.stringify({ via: "cli", ...diff }), new Date()],
  );

try {
  await pool.query("SET time_zone = '+00:00'");
  const [rows] = await pool.execute("SELECT id FROM accounts WHERE email = ?", [email]);

  if (action === "create") {
    if (rows.length > 0) {
      console.error(`Сметка со е-пошта ${email} веќе постои. Користете: npm run admin:role -- grant ${email}`);
      process.exitCode = 1;
    } else {
      const passwordHash = await hashPassword(await askNewPassword(email));
      const accountId = uuidv7();
      const now = new Date();
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        await connection.execute(
          `INSERT INTO accounts (id, email, full_name, password_hash, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?)`,
          [accountId, email, fullName, passwordHash, now, now],
        );
        await connection.execute("INSERT INTO account_roles (account_id, role) VALUES (?, 'ADMIN')", [accountId]);
        await audit(connection, "admin.create", accountId);
        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
      console.log(`Создадена админ сметка: ${email}. Најавете се на /host/login, па отворете /admin.`);
    }
  } else if (rows.length === 0) {
    console.error(`Нема сметка со е-пошта ${email}. За нова админ сметка: npm run admin:role -- create ${email} "<Име>"`);
    process.exitCode = 1;
  } else {
    const accountId = rows[0].id;
    if (action === "grant") {
      await pool.execute("INSERT IGNORE INTO account_roles (account_id, role) VALUES (?, 'ADMIN')", [accountId]);
    } else {
      await pool.execute("DELETE FROM account_roles WHERE account_id = ? AND role = 'ADMIN'", [accountId]);
    }
    await audit(pool, `admin.${action}`, accountId);
    console.log(action === "grant" ? `${email} е администратор.` : `${email} повеќе не е администратор.`);
  }
} catch (error) {
  console.error("Не успеа:", error instanceof Error && !("code" in error) ? error.message : describeDbError(error));
  process.exitCode = 1;
} finally {
  await pool.end();
}
