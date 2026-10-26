// Модерација на понуди од командна линија (резервен начин; главниот е /admin).
//   npm run listing:review                     листа на понуди што чекаат одобрување
//   npm run listing:review -- publish <slug>   објави (од IN_REVIEW или REJECTED)
//   npm run listing:review -- reject <slug>    одбиј (само од IN_REVIEW)

import mysql from "mysql2/promise";
import { describeDbError } from "../src/server/db/describe-error.mjs";
import { uuidv7 } from "../src/server/platform/ids.mjs";

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

const [action, slug] = process.argv.slice(2);
if (action && !(["publish", "reject"].includes(action) && slug)) {
  console.error("Употреба: npm run listing:review [-- publish|reject <slug>]");
  process.exit(1);
}

const pool = mysql.createPool({ uri: url, connectionLimit: 1, charset: "utf8mb4", timezone: "Z" });

try {
  await pool.query("SET time_zone = '+00:00'");

  if (!action) {
    const [rows] = await pool.query(
      `SELECT l.slug, l.title, h.slug AS host_slug, l.created_at
         FROM listings l JOIN hosts h ON h.id = l.host_id
        WHERE l.status = 'IN_REVIEW' ORDER BY l.created_at`,
    );
    if (rows.length === 0) console.log("Нема понуди што чекаат одобрување.");
    for (const r of rows) console.log(`${r.slug}\t${r.host_slug}\t${r.title}`);
  } else {
    const [rows] = await pool.execute("SELECT id, status FROM listings WHERE slug = ?", [slug]);
    if (rows.length === 0) {
      console.error(`Нема понуда со slug „${slug}“.`);
      process.exitCode = 1;
    } else {
      const { id, status } = rows[0];
      const allowed = action === "publish" ? ["IN_REVIEW", "REJECTED"] : ["IN_REVIEW"];
      if (!allowed.includes(status)) {
        console.error(`Не може (${action}) од статус ${status}.`);
        process.exitCode = 1;
      } else {
        const next = action === "publish" ? "PUBLISHED" : "REJECTED";
        const now = new Date();
        const [result] = await pool.execute(
          `UPDATE listings SET status = ?, version = version + 1,
                  published_at = IF(? = 'PUBLISHED', COALESCE(published_at, ?), published_at)
            WHERE id = ? AND status = ?`,
          [next, next, now, id, status],
        );
        if (result.affectedRows === 0) {
          console.error("Статусот се променил во меѓувреме. Обидете се повторно.");
          process.exitCode = 1;
        } else {
          await pool.execute(
            "INSERT INTO audit_log (id, actor_account_id, action, entity_type, entity_id, diff, created_at) VALUES (?, NULL, ?, 'listing', ?, ?, ?)",
            [uuidv7(), `listing.${action}`, id, JSON.stringify({ from: status, to: next, via: "cli" }), now],
          );
          console.log(`${slug}: ${status} → ${next}`);
        }
      }
    }
  }
} catch (error) {
  console.error("Не успеа:", describeDbError(error));
  process.exitCode = 1;
} finally {
  await pool.end();
}
