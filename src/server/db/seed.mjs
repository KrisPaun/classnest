// Полнење на референтните податоци (градови и категории) од src/data/reference.json.
// Безбедно е да се врти повеќепати: постоечките редови се освежуваат по slug, а идентификаторите остануваат исти.
// Пишано како .mjs за да го користат и скриптата (npm run db:seed) и тестовите.

import { readFileSync } from "node:fs";
import { uuidv7 } from "../platform/ids.mjs";

const reference = JSON.parse(readFileSync(new URL("../../data/reference.json", import.meta.url), "utf8"));

/**
 * @param {import("mysql2/promise").Pool} pool
 * @returns {Promise<{ cities: number; categories: number }>}
 */
export async function seedReference(pool) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    for (const city of reference.cities) {
      await connection.execute(
        `INSERT INTO cities (id, slug, name, country_code, lat, lng)
         VALUES (?, ?, ?, 'MK', ?, ?)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name), lat = VALUES(lat), lng = VALUES(lng), updated_at = CURRENT_TIMESTAMP(3)`,
        [uuidv7(), city.slug, city.name, city.lat, city.lng],
      );
    }

    for (const category of reference.categories) {
      await connection.execute(
        `INSERT INTO categories (id, slug, name, emoji, sort_order)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name), emoji = VALUES(emoji), sort_order = VALUES(sort_order), updated_at = CURRENT_TIMESTAMP(3)`,
        [uuidv7(), category.slug, category.name, category.emoji, category.sortOrder],
      );
    }

    await connection.commit();
    return { cities: reference.cities.length, categories: reference.categories.length };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
