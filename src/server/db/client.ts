import mysql from "mysql2/promise";
import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import { getConfig } from "../platform/config";
import * as schema from "./schema";

export type Db = MySql2Database<typeof schema>;

// Еден pool на процес. Во `next dev` модулите се вчитуваат повеќепати (HMR),
// па pool-от се чува на globalThis за да не се исцрпат врските со базата.
const globalForDb = globalThis as unknown as { __classnestPool?: mysql.Pool; __classnestDb?: Db };

function getPool(): mysql.Pool {
  if (!globalForDb.__classnestPool) {
    const config = getConfig();
    globalForDb.__classnestPool = mysql.createPool({
      uri: config.DATABASE_URL,
      connectionLimit: config.DB_POOL_SIZE,
      waitForConnections: true,
      queueLimit: 100,
      enableKeepAlive: true,
      connectTimeout: 10_000,
      charset: "utf8mb4",
      timezone: "Z", // сите датуми се UTC
    });
    // Секоја врска работи на UTC, за да не зависи од поставката на серверот на базата.
    globalForDb.__classnestPool.pool.on("connection", (connection) => {
      connection.query("SET time_zone = '+00:00'");
    });
  }
  return globalForDb.__classnestPool;
}

export function getDb(): Db {
  return (globalForDb.__classnestDb ??= drizzle(getPool(), { schema, mode: "default" }));
}

/** Проверка дека базата одговара. Фрла грешка ако не. */
export async function pingDb(): Promise<void> {
  await getPool().query("SELECT 1");
}

export async function closeDb(): Promise<void> {
  const pool = globalForDb.__classnestPool;
  globalForDb.__classnestPool = undefined;
  globalForDb.__classnestDb = undefined;
  await pool?.end();
}
