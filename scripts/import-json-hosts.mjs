// Еднократно префрлање на домаќините од .data/db.json во MySQL (чекор 4).
//   npm run db:import-hosts
//
// Редослед: npm run db:migrate, npm run db:seed, npm run db:import-accounts, па ова.
//
// Што прави (по домаќин, во трансакција):
//  - го вметнува профилот (hosts), приватните податоци (host_private_details: телефон, датум на раѓање,
//    ЕДБ, ДДВ), поставките (host_settings) и банкарската сметка (payout_accounts);
//  - шифрираните вредности (IBAN, датум на раѓање, телефон) се копираат НЕПРОМЕНЕТИ: истиот BANK_DATA_KEY;
//  - ја поврзува сметката преку hosts.account_id и го брише привремената колона accounts.legacy_host_slug.
// Домаќин без сметка (сирак) се остава во JSON датотеката. На крај прави резервна копија.
// Безбедно е да се врти повторно: веќе префрлените се прескокнуваат.

import { copyFileSync, existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import mysql from "mysql2/promise";
import { describeDbError } from "../src/server/db/describe-error.mjs";
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
const jsonHosts = Array.isArray(data.hosts) ? data.hosts : [];
if (jsonHosts.length === 0) {
  console.log("Во .data/db.json нема домаќини (веќе се префрлени).");
  process.exit(0);
}

const pool = mysql.createPool({ uri: url, connectionLimit: 1, charset: "utf8mb4", timezone: "Z" });
const connection = await pool.getConnection();

const date = (value) => (value ? new Date(value) : null);

let imported = 0;
let alreadyThere = 0;
const orphans = [];
const keepInJson = [];

try {
  await connection.query("SET time_zone = '+00:00'");

  for (const host of jsonHosts) {
    const [existing] = await connection.execute("SELECT id FROM hosts WHERE slug = ?", [host.slug]);
    if (existing.length > 0) {
      alreadyThere++;
      continue;
    }

    const [accounts] = await connection.execute("SELECT id FROM accounts WHERE legacy_host_slug = ?", [host.slug]);
    if (accounts.length === 0) {
      orphans.push(host.slug);
      keepInJson.push(host);
      continue;
    }

    const [cities] = await connection.execute("SELECT id FROM cities WHERE slug = ?", [host.city]);
    if (cities.length === 0) {
      throw new Error(`Непознат град „${host.city}“. Прво извршете: npm run db:seed`);
    }

    let categoryId = null;
    if (host.category) {
      const [categories] = await connection.execute("SELECT id FROM categories WHERE slug = ?", [host.category]);
      categoryId = categories[0]?.id ?? null;
    }

    const hostId = uuidv7();
    const created = date(host.createdAt) ?? new Date();
    const payout = host.payout;

    await connection.beginTransaction();
    try {
      await connection.execute(
        `INSERT INTO hosts
           (id, account_id, slug, display_name, business_name, city_id, category_id, short_bio, story,
            started_month, started_year, website_url, instagram_url, facebook_url, status,
            profile_completed_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?)`,
        [
          hostId,
          accounts[0].id,
          host.slug,
          host.name,
          host.businessName ?? null,
          cities[0].id,
          categoryId,
          host.about,
          host.story ?? null,
          host.startedMonth ?? null,
          host.startedYear ?? null,
          host.website ?? null,
          host.instagram ?? null,
          host.facebook ?? null,
          date(host.profileCompletedAt),
          created,
          created,
        ],
      );

      if (host.phoneEnc || payout) {
        await connection.execute(
          `INSERT INTO host_private_details
             (host_id, phone_enc, date_of_birth_enc, tax_number, vat_registered, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            hostId,
            host.phoneEnc ?? null,
            payout?.dobEnc ?? null,
            payout?.taxNumber ?? null,
            payout ? (payout.vatRegistered ? 1 : 0) : null,
            created,
            created,
          ],
        );
      }

      if (payout) {
        const saved = date(payout.savedAt) ?? created;
        await connection.execute(
          `INSERT INTO host_settings
             (host_id, trading_name, one_public_booking_at_a_time, allow_self_service_changes, allow_promo_use,
              payout_frequency, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            hostId,
            payout.tradingName,
            payout.onePublicBookingAtATime ? 1 : 0,
            payout.allowSelfServiceChanges ? 1 : 0,
            payout.allowPromoUse ? 1 : 0,
            payout.payoutFrequency,
            saved,
            saved,
          ],
        );
        await connection.execute(
          `INSERT INTO payout_accounts
             (id, host_id, bank_name, holder_name, iban_enc, iban_last4, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            uuidv7(),
            hostId,
            payout.bank.bankName,
            payout.bank.holder,
            payout.bank.ibanEnc,
            payout.bank.ibanLast4,
            saved,
            saved,
          ],
        );
      }

      // Сега профилот е поврзан преку hosts.account_id, па привремената врска не е потребна.
      await connection.execute("UPDATE accounts SET legacy_host_slug = NULL WHERE id = ?", [accounts[0].id]);
      await connection.commit();
      imported++;
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  }

  // Резервна копија, па од JSON остануваат само сираците (домаќини без сметка).
  const backup = `${FILE}.bak-before-hosts-${Date.now()}`;
  copyFileSync(FILE, backup);
  if (keepInJson.length > 0) data.hosts = keepInJson;
  else delete data.hosts;
  writeFileSync(`${FILE}.tmp`, JSON.stringify(data, null, 2), { mode: 0o600 });
  renameSync(`${FILE}.tmp`, FILE);

  console.log(`Префрлени домаќини: ${imported}. Веќе во базата: ${alreadyThere}.`);
  if (orphans.length > 0) {
    console.log(
      `Без сметка (останаа во .data/db.json): ${orphans.join(", ")}. Прво извршете: npm run db:import-accounts`,
    );
  }
  console.log(`Резервна копија: ${backup} (содржи шифрирани банкарски податоци: чувајте ја приватно или избришете ја).`);
} catch (error) {
  console.error("Увозот не успеа, .data/db.json не е променет:", describeDbError(error));
  process.exitCode = 1;
} finally {
  connection.release();
  await pool.end();
}
