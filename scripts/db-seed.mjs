// Ги полни градовите и категориите во базата. Прво мора да се извршат миграциите:
//   npm run db:migrate && npm run db:seed
// Безбедно е да се врти повеќепати.

import mysql from "mysql2/promise";
import { describeDbError } from "../src/server/db/describe-error.mjs";
import { seedReference } from "../src/server/db/seed.mjs";

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
  const result = await seedReference(pool);
  console.log(`Готово: ${result.cities} града и ${result.categories} категории.`);
} catch (error) {
  console.error("Полнењето не успеа:", describeDbError(error));
  process.exitCode = 1;
} finally {
  await pool.end();
}
