import { sql } from "drizzle-orm";
import {
  boolean,
  char,
  check,
  datetime,
  foreignKey,
  index,
  mysqlTable,
  smallint,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";
import { idColumn, timestamps } from "../columns";
import { accounts } from "./identity";
import { categories, cities } from "./reference";

// Домаќини (види docs/backend-design.md, секција 5.3).
// Јавните страници читаат САМО од `hosts`. Приватното (телефон, датум на раѓање, ЕДБ, банка) е во посебни табели.

export const hosts = mysqlTable(
  "hosts",
  {
    id: idColumn(),
    accountId: char("account_id", { length: 36 }).notNull(),
    slug: varchar("slug", { length: 80 }).notNull(),
    displayName: varchar("display_name", { length: 100 }).notNull(),
    businessName: varchar("business_name", { length: 100 }),
    cityId: char("city_id", { length: 36 }).notNull(),
    categoryId: char("category_id", { length: 36 }), // по желба, не се бара при регистрација
    shortBio: text("short_bio").notNull(), // „Што би предавале?“ од регистрацијата
    story: text("story"), // подолга приказна од чекор 1
    startedMonth: smallint("started_month"),
    startedYear: smallint("started_year"),
    websiteUrl: varchar("website_url", { length: 255 }),
    instagramUrl: varchar("instagram_url", { length: 255 }),
    facebookUrl: varchar("facebook_url", { length: 255 }),
    status: varchar("status", { length: 16 }).notNull().default("ACTIVE"),
    profileCompletedAt: datetime("profile_completed_at", { mode: "date", fsp: 3 }),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("hosts_slug_uq").on(t.slug),
    uniqueIndex("hosts_account_uq").on(t.accountId),
    index("hosts_city_idx").on(t.cityId),
    foreignKey({ columns: [t.accountId], foreignColumns: [accounts.id], name: "hosts_account_fk" }),
    foreignKey({ columns: [t.cityId], foreignColumns: [cities.id], name: "hosts_city_fk" }),
    foreignKey({ columns: [t.categoryId], foreignColumns: [categories.id], name: "hosts_category_fk" }),
    check("hosts_status_chk", sql`${t.status} in ('PENDING', 'ACTIVE', 'SUSPENDED')`),
  ],
);

/** Приватни податоци: никогаш не се прикажуваат јавно, а чувствителните колони се шифрирани (AES-256-GCM). */
export const hostPrivateDetails = mysqlTable(
  "host_private_details",
  {
    hostId: char("host_id", { length: 36 }).primaryKey(),
    phoneEnc: varchar("phone_enc", { length: 600 }),
    dateOfBirthEnc: varchar("date_of_birth_enc", { length: 600 }),
    taxNumber: varchar("tax_number", { length: 13 }), // ЕДБ
    vatRegistered: boolean("vat_registered"),
    keyId: varchar("key_id", { length: 32 }).notNull().default("env-v1"), // која верзија на клуч е употребена
    ...timestamps(),
  },
  (t) => [
    foreignKey({ columns: [t.hostId], foreignColumns: [hosts.id], name: "host_private_host_fk" }).onDelete("cascade"),
  ],
);

/** Поставки од чекор 4 (назив на бизнис, правила за резервации, фреквенција на исплата). */
export const hostSettings = mysqlTable(
  "host_settings",
  {
    hostId: char("host_id", { length: 36 }).primaryKey(),
    tradingName: varchar("trading_name", { length: 100 }).notNull(),
    onePublicBookingAtATime: boolean("one_public_booking_at_a_time").notNull().default(false),
    allowSelfServiceChanges: boolean("allow_self_service_changes").notNull().default(false),
    allowPromoUse: boolean("allow_promo_use").notNull().default(false),
    payoutFrequency: varchar("payout_frequency", { length: 16 }).notNull(),
    ...timestamps(),
  },
  (t) => [
    foreignKey({ columns: [t.hostId], foreignColumns: [hosts.id], name: "host_settings_host_fk" }).onDelete("cascade"),
    check("host_settings_frequency_chk", sql`${t.payoutFrequency} in ('weekly', 'biweekly', 'monthly')`),
  ],
);

/** Банкарска сметка за исплата. IBAN е шифриран, а во прелистувач се праќаат само последните 4 знаци. */
export const payoutAccounts = mysqlTable(
  "payout_accounts",
  {
    id: idColumn(),
    hostId: char("host_id", { length: 36 }).notNull(),
    bankName: varchar("bank_name", { length: 80 }).notNull(),
    holderName: varchar("holder_name", { length: 100 }).notNull(),
    ibanEnc: varchar("iban_enc", { length: 600 }).notNull(),
    ibanLast4: char("iban_last4", { length: 4 }).notNull(),
    keyId: varchar("key_id", { length: 32 }).notNull().default("env-v1"),
    status: varchar("status", { length: 16 }).notNull().default("ACTIVE"),
    verifiedAt: datetime("verified_at", { mode: "date", fsp: 3 }),
    ...timestamps(),
  },
  (t) => [
    // За сега една сметка по домаќин (се менува во место). Историја на сметки се додава кога ќе треба.
    uniqueIndex("payout_accounts_host_uq").on(t.hostId),
    foreignKey({ columns: [t.hostId], foreignColumns: [hosts.id], name: "payout_accounts_host_fk" }).onDelete("cascade"),
    check("payout_accounts_status_chk", sql`${t.status} in ('ACTIVE', 'DISABLED')`),
  ],
);
