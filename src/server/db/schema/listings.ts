import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  char,
  check,
  datetime,
  decimal,
  foreignKey,
  index,
  int,
  mysqlTable,
  smallint,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";
import { idColumn, timestamps } from "../columns";
import { hosts } from "./hosts";
import { categories, cities } from "./reference";

// Понуди (види docs/backend-design.md, секции 5.5 и 5.6). Правилата по тип се проверуваат и во базата (CHECK).

export const listings = mysqlTable(
  "listings",
  {
    id: idColumn(),
    hostId: char("host_id", { length: 36 }).notNull(),
    type: varchar("type", { length: 16 }).notNull(), // class | food | experience | product | online
    slug: varchar("slug", { length: 100 }).notNull(),
    title: varchar("title", { length: 100 }).notNull(),
    categoryId: char("category_id", { length: 36 }).notNull(),
    description: text("description").notNull(),
    priceMinor: bigint("price_minor", { mode: "number" }).notNull(), // 1500 ден. = 150000
    currency: char("currency", { length: 3 }).notNull().default("MKD"),
    durationMinutes: int("duration_minutes"),
    maxParticipants: int("max_participants"),
    cityId: char("city_id", { length: 36 }),
    addressLine: varchar("address_line", { length: 150 }),
    maskLocation: boolean("mask_location").notNull().default(false),
    onlinePlatform: varchar("online_platform", { length: 60 }),
    fulfilment: varchar("fulfilment", { length: 16 }), // pickup | delivery | both (производ)
    cancellationMode: varchar("cancellation_mode", { length: 16 }), // flexible | reschedule | none
    cancellationDays: smallint("cancellation_days"),
    status: varchar("status", { length: 24 }).notNull().default("IN_REVIEW"),
    publishedAt: datetime("published_at", { mode: "date", fsp: 3 }),
    moderationNote: varchar("moderation_note", { length: 500 }), // причина за одбивање или симнување (ја гледа домаќинот)
    version: int("version").notNull().default(0), // за оптимистичко заклучување
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("listings_slug_uq").on(t.slug),
    index("listings_host_idx").on(t.hostId),
    index("listings_browse_idx").on(t.status, t.cityId, t.categoryId),
    foreignKey({ columns: [t.hostId], foreignColumns: [hosts.id], name: "listings_host_fk" }),
    foreignKey({ columns: [t.categoryId], foreignColumns: [categories.id], name: "listings_category_fk" }),
    foreignKey({ columns: [t.cityId], foreignColumns: [cities.id], name: "listings_city_fk" }),
    check("listings_type_chk", sql`${t.type} in ('class', 'food', 'experience', 'product', 'online')`),
    check(
      "listings_status_chk",
      sql`${t.status} in ('DRAFT', 'IN_REVIEW', 'PUBLISHED', 'HIDDEN_TEMPORARY', 'HIDDEN_PERMANENT', 'REJECTED', 'TAKEN_DOWN')`,
    ),
    check("listings_price_chk", sql`${t.priceMinor} > 0`),
    // Час, искуство и онлајн час имаат траење и број на луѓе. Производот нема.
    check(
      "listings_sessions_chk",
      sql`${t.type} = 'product' or (${t.durationMinutes} is not null and ${t.maxParticipants} is not null)`,
    ),
    // Во живо: град и адреса се задолжителни.
    check(
      "listings_in_person_chk",
      sql`${t.type} not in ('class', 'food', 'experience') or (${t.cityId} is not null and ${t.addressLine} is not null)`,
    ),
    // Производ: мора да е јасно како го добива купувачот.
    check("listings_fulfilment_chk", sql`${t.type} <> 'product' or ${t.fulfilment} is not null`),
    check(
      "listings_cancellation_chk",
      sql`${t.cancellationMode} is null or ${t.cancellationMode} in ('flexible', 'reschedule', 'none')`,
    ),
  ],
);

/**
 * Кеширани оценки и бројачи за јавните страници. Се освежува од задача кога ќе постојат рецензии.
 * Нема ред = нема оценка (јавните страници тогаш не прикажуваат ѕвездички).
 */
export const listingStats = mysqlTable(
  "listing_stats",
  {
    listingId: char("listing_id", { length: 36 }).primaryKey(),
    ratingAvg: decimal("rating_avg", { precision: 3, scale: 2 }).notNull().default("0.00"),
    reviewCount: int("review_count").notNull().default(0),
    bookingCount: int("booking_count").notNull().default(0),
    ...timestamps(),
  },
  (t) => [
    foreignKey({ columns: [t.listingId], foreignColumns: [listings.id], name: "listing_stats_listing_fk" }).onDelete(
      "cascade",
    ),
    check("listing_stats_rating_chk", sql`${t.ratingAvg} between 0 and 5`),
    check("listing_stats_counts_chk", sql`${t.reviewCount} >= 0 and ${t.bookingCount} >= 0`),
  ],
);

export const listingAvailabilitySettings = mysqlTable(
  "listing_availability_settings",
  {
    listingId: char("listing_id", { length: 36 }).primaryKey(),
    flexibility: varchar("flexibility", { length: 16 }).notNull(), // flexible | strict
    allowParallelPrivateBookings: boolean("allow_parallel_private_bookings").notNull().default(false),
    ...timestamps(),
  },
  (t) => [
    foreignKey({
      columns: [t.listingId],
      foreignColumns: [listings.id],
      name: "listing_availability_listing_fk",
    }).onDelete("cascade"),
    check("listing_availability_flexibility_chk", sql`${t.flexibility} in ('flexible', 'strict')`),
  ],
);

/** Неделни термини за барања по мерка. Преклопувањето го проверува сервисот во трансакција (MySQL нема EXCLUDE). */
export const availabilitySlots = mysqlTable(
  "availability_slots",
  {
    id: idColumn(),
    listingId: char("listing_id", { length: 36 }).notNull(),
    weekday: smallint("weekday").notNull(), // 1 = понеделник … 7 = недела
    startMinute: smallint("start_minute").notNull(), // минути од полноќ
    endMinute: smallint("end_minute").notNull(),
    ...timestamps(),
  },
  (t) => [
    index("availability_slots_listing_idx").on(t.listingId, t.weekday),
    foreignKey({
      columns: [t.listingId],
      foreignColumns: [listings.id],
      name: "availability_slots_listing_fk",
    }).onDelete("cascade"),
    check("availability_slots_weekday_chk", sql`${t.weekday} between 1 and 7`),
    check(
      "availability_slots_time_chk",
      sql`${t.startMinute} >= 0 and ${t.endMinute} <= 1440 and ${t.startMinute} < ${t.endMinute}`,
    ),
  ],
);
