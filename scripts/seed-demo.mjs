// Ги полни базата со демо домаќини и објавени понуди од src/data/demo.json (за развој и за презентација).
//   npm run db:seed:demo
//
// Редослед: db:migrate, db:seed, па ова. Безбедно е да се врти повторно: домаќин што веќе постои се прескокнува.
// Демо сметките имаат неупотреблива лозинка (никој не може да се најави како нив), а понудите се веднаш PUBLISHED.

import { readFileSync } from "node:fs";
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

const demo = JSON.parse(readFileSync("src/data/demo.json", "utf8"));
const UNUSABLE_HASH = "!demo-account-no-login"; // verifyPassword() секогаш враќа false за ова

const pool = mysql.createPool({ uri: url, connectionLimit: 1, charset: "utf8mb4", timezone: "Z" });
const connection = await pool.getConnection();

const one = async (sql, params) => {
  const [rows] = await connection.execute(sql, params);
  return rows[0];
};

let hostsAdded = 0;
let listingsAdded = 0;
let skipped = 0;

try {
  await connection.query("SET time_zone = '+00:00'");

  for (const host of demo.hosts) {
    if (await one("SELECT id FROM hosts WHERE slug = ?", [host.slug])) {
      skipped++;
      continue;
    }
    const city = await one("SELECT id FROM cities WHERE slug = ?", [host.city]);
    if (!city) throw new Error(`Непознат град „${host.city}“. Прво извршете: npm run db:seed`);

    const now = new Date();
    const accountId = uuidv7();
    const hostId = uuidv7();

    await connection.beginTransaction();
    try {
      await connection.execute(
        `INSERT INTO accounts (id, email, full_name, password_hash, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?)`,
        [accountId, `demo+${host.slug}@classnest.invalid`, host.name, UNUSABLE_HASH, now, now],
      );
      await connection.execute("INSERT INTO account_roles (account_id, role) VALUES (?, 'HOST')", [accountId]);
      await connection.execute(
        `INSERT INTO hosts (id, account_id, slug, display_name, city_id, short_bio, story, status,
                            profile_completed_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?)`,
        [hostId, accountId, host.slug, host.name, city.id, host.about, host.story ?? null, now, now, now],
      );

      for (const l of demo.listings.filter((x) => x.hostSlug === host.slug)) {
        const category = await one("SELECT id FROM categories WHERE slug = ?", [l.category]);
        if (!category) throw new Error(`Непозната категорија „${l.category}“. Прво извршете: npm run db:seed`);
        let cityId = null;
        if (l.city) {
          const c = await one("SELECT id FROM cities WHERE slug = ?", [l.city]);
          if (!c) throw new Error(`Непознат град „${l.city}“. Прво извршете: npm run db:seed`);
          cityId = c.id;
        }

        const listingId = uuidv7();
        await connection.execute(
          `INSERT INTO listings
             (id, host_id, type, slug, title, category_id, description, price_minor, currency, duration_minutes,
              max_participants, city_id, address_line, mask_location, online_platform, fulfilment,
              cancellation_mode, cancellation_days, status, published_at, version, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'MKD', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PUBLISHED', ?, 0, ?, ?)`,
          [
            listingId,
            hostId,
            l.type,
            l.slug,
            l.title,
            category.id,
            l.description,
            Math.round(l.price) * 100,
            l.durationMinutes ?? null,
            l.maxPeople ?? null,
            cityId,
            l.address ?? null,
            l.maskLocation ? 1 : 0,
            l.platform ?? null,
            l.fulfilment ?? null,
            l.cancellation?.mode ?? null,
            l.cancellation?.days ?? null,
            now,
            now,
            now,
          ],
        );
        await connection.execute(
          `INSERT INTO listing_stats (listing_id, rating_avg, review_count, booking_count, created_at, updated_at)
           VALUES (?, ?, ?, 0, ?, ?)`,
          [listingId, (l.rating ?? 0).toFixed(2), l.reviewCount ?? 0, now, now],
        );
        listingsAdded++;
      }

      await connection.commit();
      hostsAdded++;
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  }

  console.log(`Демо домаќини: ${hostsAdded} нови, ${skipped} веќе постоеја. Демо понуди додадени: ${listingsAdded}.`);
} catch (error) {
  console.error("Демо податоците не се внесени:", describeDbError(error));
  process.exitCode = 1;
} finally {
  connection.release();
  await pool.end();
}
