// Еднократно префрлање на понудите (experiences) од .data/db.json во MySQL (чекор 6).
//   npm run db:import-experiences
//
// Редослед: db:migrate, db:seed, db:import-accounts, db:import-hosts, па ова.
//
// Што прави (по понуда, во трансакција):
//  - ја вметнува понудата (listings): цената во најмали единици (ден. x 100), статусот од „скриј/прикажи“;
//  - ги вметнува поставките и неделните термини (достапност од чекор 3);
//  - ја преименува папката со фотографии uploads/exp-<старо-id> во uploads/exp-<ново-id>.
// Понуда без домаќин во базата се остава во JSON датотеката. На крај прави резервна копија.
// Безбедно е да се врти повторно: домаќин што веќе има понуда се прескокнува.

import { copyFileSync, existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import mysql from "mysql2/promise";
import { describeDbError } from "../src/server/db/describe-error.mjs";
import { uuidv7 } from "../src/server/platform/ids.mjs";
import { makeSlug } from "../src/server/platform/slug.mjs";

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
const jsonExperiences = Array.isArray(data.experiences) ? data.experiences : [];
if (jsonExperiences.length === 0) {
  console.log("Во .data/db.json нема понуди (веќе се префрлени).");
  process.exit(0);
}

const statusFor = (visibility) =>
  visibility === "temporary" ? "HIDDEN_TEMPORARY" : visibility === "permanent" ? "HIDDEN_PERMANENT" : "IN_REVIEW";
const date = (value) => (value ? new Date(value) : new Date());

const pool = mysql.createPool({ uri: url, connectionLimit: 1, charset: "utf8mb4", timezone: "Z" });
const connection = await pool.getConnection();

let imported = 0;
let alreadyThere = 0;
const orphans = [];
const keepInJson = [];
const movedFolders = [];
const folderProblems = [];

try {
  await connection.query("SET time_zone = '+00:00'");

  for (const e of jsonExperiences) {
    const [hostRows] = await connection.execute("SELECT id FROM hosts WHERE slug = ?", [e.hostSlug]);
    if (hostRows.length === 0) {
      orphans.push(e.hostSlug);
      keepInJson.push(e);
      continue;
    }
    const hostId = hostRows[0].id;

    const [existing] = await connection.execute("SELECT id FROM listings WHERE host_id = ?", [hostId]);
    if (existing.length > 0) {
      alreadyThere++;
      continue;
    }

    const [categories] = await connection.execute("SELECT id FROM categories WHERE slug = ?", [e.category]);
    if (categories.length === 0) throw new Error(`Непозната категорија „${e.category}“. Прво извршете: npm run db:seed`);

    let cityId = null;
    if (e.city) {
      const [cities] = await connection.execute("SELECT id FROM cities WHERE slug = ?", [e.city]);
      if (cities.length === 0) throw new Error(`Непознат град „${e.city}“. Прво извршете: npm run db:seed`);
      cityId = cities[0].id;
    }

    const listingId = uuidv7();
    const durationMinutes = e.durationMinutes ?? (e.durationHours ? Math.round(e.durationHours * 60) : null);
    const created = date(e.createdAt);
    const updated = date(e.updatedAt ?? e.createdAt);

    await connection.beginTransaction();
    try {
      await connection.execute(
        `INSERT INTO listings
           (id, host_id, type, slug, title, category_id, description, price_minor, currency, duration_minutes,
            max_participants, city_id, address_line, mask_location, online_platform, fulfilment,
            cancellation_mode, cancellation_days, status, version, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'MKD', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
        [
          listingId,
          hostId,
          e.type,
          makeSlug(e.title, "ponuda", new Set(), 60),
          e.title,
          categories[0].id,
          e.description,
          Math.round(e.price) * 100,
          durationMinutes,
          e.maxPeople ?? null,
          cityId,
          e.address ?? null,
          e.maskLocation ? 1 : 0,
          e.platform ?? null,
          e.fulfilment ?? null,
          e.cancellation?.mode ?? null,
          e.cancellation?.days ?? null,
          statusFor(e.visibility),
          created,
          updated,
        ],
      );

      if (e.availability) {
        await connection.execute(
          `INSERT INTO listing_availability_settings
             (listing_id, flexibility, allow_parallel_private_bookings, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?)`,
          [listingId, e.availability.flexibility, e.availability.parallelBookings ? 1 : 0, updated, updated],
        );
        for (const slot of e.availability.slots ?? []) {
          await connection.execute(
            `INSERT INTO availability_slots (id, listing_id, weekday, start_minute, end_minute, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [uuidv7(), listingId, slot.day, slot.from, slot.to, updated, updated],
          );
        }
      }

      await connection.commit();
      imported++;
    } catch (error) {
      await connection.rollback();
      throw error;
    }

    // Фотографиите се чуваат под клуч exp-<id>: ги преименуваме во новиот идентификатор.
    const from = `uploads/exp-${e.id}`;
    const to = `uploads/exp-${listingId}`;
    if (existsSync(from) && !existsSync(to)) {
      try {
        renameSync(from, to);
        movedFolders.push(`${from} → ${to}`);
      } catch {
        folderProblems.push(`${from} (рачно преименувајте во ${to})`);
      }
    }
  }

  // Резервна копија, па од JSON остануваат само понудите без домаќин во базата.
  const backup = `${FILE}.bak-before-listings-${Date.now()}`;
  copyFileSync(FILE, backup);
  if (keepInJson.length > 0) data.experiences = keepInJson;
  else delete data.experiences;
  writeFileSync(`${FILE}.tmp`, JSON.stringify(data, null, 2), { mode: 0o600 });
  renameSync(`${FILE}.tmp`, FILE);

  console.log(`Префрлени понуди: ${imported}. Веќе во базата: ${alreadyThere}.`);
  if (movedFolders.length) console.log(`Преименувани папки со фотографии: ${movedFolders.length}.`);
  if (folderProblems.length) console.log(`Папки што не се преименувани: ${folderProblems.join("; ")}`);
  if (orphans.length) {
    console.log(`Без домаќин во базата (останаа во .data/db.json): ${orphans.join(", ")}. Прво извршете: npm run db:import-hosts`);
  }
  console.log(`Резервна копија: ${backup}`);
} catch (error) {
  console.error("Увозот не успеа, .data/db.json не е променет:", describeDbError(error));
  process.exitCode = 1;
} finally {
  connection.release();
  await pool.end();
}
