import { char, decimal, foreignKey, int, mysqlTable, uniqueIndex, varchar } from "drizzle-orm/mysql-core";
import { idColumn, timestamps } from "../columns";

/** Градови (Скопје, Охрид, Битола, …). Првата вистинска табела: ја докажува целата низа до базата. */
export const cities = mysqlTable(
  "cities",
  {
    id: idColumn(),
    slug: varchar("slug", { length: 64 }).notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    countryCode: char("country_code", { length: 2 }).notNull().default("MK"),
    lat: decimal("lat", { precision: 9, scale: 6 }),
    lng: decimal("lng", { precision: 9, scale: 6 }),
    ...timestamps(),
  },
  (t) => [uniqueIndex("cities_slug_uq").on(t.slug)],
);

export type City = typeof cities.$inferSelect;
export type NewCity = typeof cities.$inferInsert;

/** Категории (Готвење, Керамика, …). `parentId` е за поткатегории подоцна. */
export const categories = mysqlTable(
  "categories",
  {
    id: idColumn(),
    slug: varchar("slug", { length: 64 }).notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    emoji: varchar("emoji", { length: 16 }),
    parentId: char("parent_id", { length: 36 }),
    sortOrder: int("sort_order").notNull().default(0),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("categories_slug_uq").on(t.slug),
    foreignKey({ columns: [t.parentId], foreignColumns: [t.id], name: "categories_parent_fk" }),
  ],
);

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
