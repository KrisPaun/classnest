// Ги извршува SQL миграциите од ./drizzle. Чист Node (без TypeScript), па работи и на серверот преку SSH:
//   npm run db:migrate
// Врската: DATABASE_URL од околината, а ако ја нема, од .env.local.

import mysql from "mysql2/promise";
import { describeDbError } from "../src/server/db/describe-error.mjs";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";

if (!process.env.DATABASE_URL) {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // нема .env.local, па подолу ќе пријавиме дека недостасува DATABASE_URL
  }
}

const url = process.env.DATABASE_URL;
if (!url || !url.startsWith("mysql://")) {
  console.error("DATABASE_URL недостасува или не почнува со mysql://");
  process.exit(1);
}

const pool = mysql.createPool({ uri: url, connectionLimit: 1, charset: "utf8mb4", timezone: "Z" });

try {
  await migrate(drizzle(pool), { migrationsFolder: "drizzle" });
  console.log("Миграциите се извршени.");
} catch (error) {
  // Не ја печатиме целата грешка со URL, за да не протече лозинка.
  console.error("Миграцијата не успеа:", describeDbError(error));
  process.exitCode = 1;
} finally {
  await pool.end();
}
