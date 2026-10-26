import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { seedReference } from "./seed.mjs";

// Интеграциски тест со вистинска MySQL. Се извршува САМО ако е зададено TEST_DATABASE_URL, на пример:
//   TEST_DATABASE_URL=mysql://classnest:classnest@127.0.0.1:3306/classnest npm test
// Без таа променлива тестот се прескокнува (затоа `npm test` работи и без база).
const testUrl = process.env.TEST_DATABASE_URL;

const unique = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const UUID_V7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe.skipIf(!testUrl)("database layer (real MySQL)", () => {
  let client: typeof import("./client");
  let schema: typeof import("./schema");
  let pool: mysql.Pool;

  beforeAll(async () => {
    process.env.DATABASE_URL = testUrl;
    client = await import("./client");
    schema = await import("./schema");
    pool = mysql.createPool({ uri: testUrl!, connectionLimit: 2, charset: "utf8mb4", timezone: "Z" });
    await migrate(client.getDb(), { migrationsFolder: "drizzle" });
  });

  afterAll(async () => {
    await pool.end();
    await client.closeDb();
  });

  it("answers a ping", async () => {
    await expect(client.pingDb()).resolves.toBeUndefined();
  });

  it("stores and reads a city, with a UUIDv7 id and UTC dates", async () => {
    const db = client.getDb();
    const slug = unique("test");

    await db.insert(schema.cities).values({ slug, name: "Тест град" });
    try {
      const [row] = await db.select().from(schema.cities).where(eq(schema.cities.slug, slug));

      expect(row.id).toMatch(UUID_V7);
      expect(row.name).toBe("Тест град"); // кирилицата се чува правилно (utf8mb4)
      expect(row.countryCode).toBe("MK");
      expect(row.createdAt).toBeInstanceOf(Date);
      // датумот е UTC: не смее да се разликува за повеќе од една минута од сега
      expect(Math.abs(row.createdAt.getTime() - Date.now())).toBeLessThan(60_000);
    } finally {
      await db.delete(schema.cities).where(eq(schema.cities.slug, slug));
    }
  });

  it("rejects a second city with the same slug", async () => {
    const db = client.getDb();
    const slug = unique("dup");

    await db.insert(schema.cities).values({ slug, name: "Прв" });
    try {
      await expect(db.insert(schema.cities).values({ slug, name: "Втор" })).rejects.toThrow();
    } finally {
      await db.delete(schema.cities).where(eq(schema.cities.slug, slug));
    }
  });

  it("seeds the reference data and is safe to run twice", async () => {
    const first = await seedReference(pool);
    const idsBefore = (await client.getDb().select().from(schema.cities)).map((c) => `${c.slug}:${c.id}`).sort();

    const second = await seedReference(pool);
    const rows = await client.getDb().select().from(schema.cities);
    const idsAfter = rows.map((c) => `${c.slug}:${c.id}`).sort();

    expect(second).toEqual(first);
    expect(idsAfter).toEqual(idsBefore); // ид-јата не се менуваат при повторно полнење
    expect(rows.map((c) => c.slug)).toEqual(expect.arrayContaining(["skopje", "ohrid", "bitola"]));

    const categories = await client.getDb().select().from(schema.categories);
    expect(categories.length).toBeGreaterThanOrEqual(first.categories);
    expect(categories.find((c) => c.slug === "gotvenje")?.name).toBe("Готвење");
  });

  it("rejects a category whose parent does not exist (foreign key)", async () => {
    const db = client.getDb();

    await expect(
      db.insert(schema.categories).values({
        slug: unique("orphan"),
        name: "Без родител",
        parentId: "00000000-0000-7000-8000-000000000000",
      }),
    ).rejects.toThrow();
  });

  it("stores an outbox event with a JSON payload and sensible defaults", async () => {
    const db = client.getDb();
    const aggregateId = "11111111-1111-7111-8111-111111111111";

    await db.insert(schema.outboxEvents).values({
      aggregateType: "booking",
      aggregateId,
      eventType: "booking.confirmed",
      payload: { bookingId: aggregateId, guests: 2 },
    });
    try {
      const [row] = await db
        .select()
        .from(schema.outboxEvents)
        .where(eq(schema.outboxEvents.aggregateId, aggregateId));

      const payload = typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload; // MariaDB враќа текст
      expect(payload).toEqual({ bookingId: aggregateId, guests: 2 });
      expect(row.attempts).toBe(0);
      expect(row.processedAt).toBeNull();
      expect(row.nextAttemptAt).toBeInstanceOf(Date);
    } finally {
      await db.delete(schema.outboxEvents).where(eq(schema.outboxEvents.aggregateId, aggregateId));
    }
  });
});
