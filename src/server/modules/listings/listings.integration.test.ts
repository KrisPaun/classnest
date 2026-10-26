import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Availability } from "@/lib/availability";
import { seedReference } from "../../db/seed.mjs";
import { UnknownReferenceError } from "../hosts/types";
import type { ListingInput } from "./types";

// Интеграциски тестови со вистинска MySQL (види db.integration.test.ts за како се вклучуваат).
const testUrl = process.env.TEST_DATABASE_URL;

const unique = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const classInput = (overrides: Partial<ListingInput> = {}): ListingInput => ({
  type: "class",
  title: "Домашна паста и тирамису",
  category: "gotvenje",
  description: "Научете да правите свежа паста на рака и кремаст тирамису, чекор по чекор.",
  price: 1500,
  durationMinutes: 150,
  maxPeople: 8,
  city: "skopje",
  address: "Ул. Македонија 1",
  cancellation: { mode: "flexible", days: 7 },
  ...overrides,
});

const productInput = (): ListingInput => ({
  type: "product",
  title: "Рачно изработена чинија",
  category: "keramika",
  description: "Рачно изработена керамичка чинија, секоја е уникатна и безбедна за миење.",
  price: 2500,
  fulfilment: "pickup",
});

const availability = (overrides: Partial<Availability> = {}): Availability => ({
  flexibility: "flexible",
  parallelBookings: false,
  slots: [
    { day: 3, from: 600, to: 720 },
    { day: 1, from: 540, to: 1200 },
  ],
  ...overrides,
});

describe.skipIf(!testUrl)("listings module (real MySQL)", () => {
  let client: typeof import("../../db/client");
  let schema: typeof import("../../db/schema");
  let service: typeof import("./service");
  let hostService: typeof import("../hosts/service");
  let identity: typeof import("../identity/service");
  let pool: mysql.Pool;
  const created: { hostId?: string; accountId: string }[] = [];

  const makeHost = async () => {
    const account = await identity.registerAccount({
      email: `${unique("lst")}@example.com`,
      fullName: "Тест Домаќин",
      password: "dobra-lozinka-123",
    });
    const entry: { hostId?: string; accountId: string } = { accountId: account.id };
    created.push(entry);
    const host = await hostService.createHost({
      accountId: account.id,
      name: "Тест Домаќин",
      citySlug: "skopje",
      about: "Предавам веќе десет години.",
    });
    entry.hostId = host.id;
    return host;
  };

  beforeAll(async () => {
    process.env.DATABASE_URL = testUrl;
    client = await import("../../db/client");
    schema = await import("../../db/schema");
    service = await import("./service");
    hostService = await import("../hosts/service");
    identity = await import("../identity/service");
    pool = mysql.createPool({ uri: testUrl!, connectionLimit: 2, charset: "utf8mb4", timezone: "Z" });
    await migrate(client.getDb(), { migrationsFolder: "drizzle" });
    await seedReference(pool);
  });

  afterAll(async () => {
    for (const { hostId, accountId } of created) {
      if (hostId) {
        await client.getDb().delete(schema.listings).where(eq(schema.listings.hostId, hostId)); // cascade: достапност
        await hostService.removeHost(hostId);
      }
      await identity.removeAccount(accountId);
    }
    await pool.end();
    await client.closeDb();
  });

  it("creates an in-person listing: whole denars in the app, minor units in the database", async () => {
    const host = await makeHost();

    const listing = await service.saveListing(host.slug, classInput());

    expect(listing?.price).toBe(1500);
    expect(listing).toMatchObject({
      hostSlug: host.slug,
      type: "class",
      category: "gotvenje",
      city: "skopje",
      durationMinutes: 150,
      maxPeople: 8,
      status: "IN_REVIEW",
      visibility: "active",
      cancellation: { mode: "flexible", days: 7 },
    });
    expect(listing?.slug).toMatch(/^domasna-pasta-i-tiramisu-[0-9a-f]{4}$/);

    const [row] = await client.getDb().select().from(schema.listings).where(eq(schema.listings.id, listing!.id));
    expect(row.priceMinor).toBe(150000);
    expect(row.currency).toBe("MKD");
  });

  it("updates the same listing when saved again, and drops fields of the old type", async () => {
    const host = await makeHost();
    const first = await service.saveListing(host.slug, classInput());
    await service.saveAvailability(host.slug, availability());

    const second = await service.saveListing(host.slug, productInput());

    expect(second?.id).toBe(first?.id);
    expect(second?.slug).toBe(first?.slug); // slug-от не се менува
    expect(second?.type).toBe("product");
    expect(second?.price).toBe(2500);
    expect(second?.fulfilment).toBe("pickup");
    expect(second?.address).toBeUndefined(); // старите полиња од „час“ се исчистени
    expect(second?.durationMinutes).toBeUndefined();
    expect(second?.cancellation).toBeUndefined();
    expect(second?.availability?.slots).toHaveLength(2); // достапноста од чекор 3 остана

    expect(await service.listHostListings(host.slug)).toHaveLength(1);
  });

  it("refuses an unknown category and a host that does not exist", async () => {
    const host = await makeHost();

    await expect(service.saveListing(host.slug, classInput({ category: "nema-takva" }))).rejects.toBeInstanceOf(
      UnknownReferenceError,
    );
    expect(await service.saveListing("nema-takov-domakin", classInput())).toBeNull();
  });

  it("enforces the per-type rules in the database itself", async () => {
    const host = await makeHost();
    const [category] = await client.getDb().select().from(schema.categories).limit(1);
    const base = {
      hostId: host.id,
      title: "Директен тест",
      categoryId: category.id,
      description: "Опис за директен тест на правилата во базата.",
    };
    const insert = (values: Record<string, unknown>) =>
      client.getDb().insert(schema.listings).values({ ...base, slug: unique("direct"), ...values } as never);

    // производ без начин на добивање
    await expect(insert({ type: "product", priceMinor: 1000 })).rejects.toThrow();
    // час во живо без град и адреса
    await expect(insert({ type: "class", priceMinor: 1000, durationMinutes: 60, maxParticipants: 4 })).rejects.toThrow();
    // час без траење
    await expect(insert({ type: "online", priceMinor: 1000 })).rejects.toThrow();
    // цена нула
    await expect(insert({ type: "product", priceMinor: 0, fulfilment: "pickup" })).rejects.toThrow();
    // непознат тип
    await expect(insert({ type: "magija", priceMinor: 1000, fulfilment: "pickup" })).rejects.toThrow();
  });

  it("stores availability, returns slots in weekday order, and replaces it on the next save", async () => {
    const host = await makeHost();
    await service.saveListing(host.slug, classInput());

    expect(await service.saveAvailability(host.slug, availability({ parallelBookings: true }))).toBe(true);
    const first = (await service.getFirstListing(host.slug))?.availability;
    expect(first?.parallelBookings).toBe(true);
    expect(first?.slots).toEqual([
      { day: 1, from: 540, to: 1200 },
      { day: 3, from: 600, to: 720 },
    ]);

    await service.saveAvailability(host.slug, availability({ flexibility: "strict", slots: [{ day: 5, from: 480, to: 600 }] }));
    const second = (await service.getFirstListing(host.slug))?.availability;
    expect(second?.flexibility).toBe("strict");
    expect(second?.slots).toEqual([{ day: 5, from: 480, to: 600 }]);
  });

  it("rejects an impossible time slot in the database", async () => {
    const host = await makeHost();
    const listing = await service.saveListing(host.slug, classInput());

    await expect(
      client.getDb().insert(schema.availabilitySlots).values({
        listingId: listing!.id,
        weekday: 1,
        startMinute: 600,
        endMinute: 600, // крајот мора да е по почетокот
      }),
    ).rejects.toThrow();
    await expect(
      client.getDb().insert(schema.availabilitySlots).values({
        listingId: listing!.id,
        weekday: 9, // денот мора да е од 1 до 7
        startMinute: 600,
        endMinute: 700,
      }),
    ).rejects.toThrow();
  });

  it("hides and shows a listing through the status", async () => {
    const host = await makeHost();
    await service.saveListing(host.slug, classInput());

    await service.setVisibility(host.slug, "temporary");
    expect(await service.getFirstListing(host.slug)).toMatchObject({ status: "HIDDEN_TEMPORARY", visibility: "temporary" });

    await service.setVisibility(host.slug, "permanent");
    expect(await service.getFirstListing(host.slug)).toMatchObject({ status: "HIDDEN_PERMANENT", visibility: "permanent" });

    await service.setVisibility(host.slug, "active");
    expect(await service.getFirstListing(host.slug)).toMatchObject({ status: "IN_REVIEW", visibility: "active" });
  });

  it("returns false for availability and visibility when the host has no listing", async () => {
    const host = await makeHost();

    expect(await service.saveAvailability(host.slug, availability())).toBe(false);
    expect(await service.setVisibility(host.slug, "temporary")).toBe("not-found");
    expect(await service.getFirstListing(host.slug)).toBeNull();
  });

  it("removes availability together with the listing (cascade)", async () => {
    const host = await makeHost();
    const listing = await service.saveListing(host.slug, classInput());
    await service.saveAvailability(host.slug, availability());

    await client.getDb().delete(schema.listings).where(eq(schema.listings.id, listing!.id));

    const db = client.getDb();
    expect(await db.select().from(schema.availabilitySlots).where(eq(schema.availabilitySlots.listingId, listing!.id))).toHaveLength(0);
    expect(
      await db
        .select()
        .from(schema.listingAvailabilitySettings)
        .where(eq(schema.listingAvailabilitySettings.listingId, listing!.id)),
    ).toHaveLength(0);
  });

  describe("public pages and moderation", () => {
    const published = async (overrides: Partial<ListingInput> = {}) => {
      const host = await makeHost();
      const token = unique("zx").replace(/-/g, "");
      const listing = await service.saveListing(
        host.slug,
        classInput({ title: `Работилница ${token}`, description: `Опис со уникатен збор ${token} за пребарување.`, ...overrides }),
      );
      return { host, token, listing: listing! };
    };

    it("keeps a new listing out of the public pages until a moderator publishes it", async () => {
      const { token, listing } = await published();

      expect(await service.getPublishedListing(listing.slug)).toBeNull();
      expect(await service.searchPublished({ q: token })).toHaveLength(0);
      expect(await service.publishListing(listing.slug)).toBe("ok");

      const found = await service.getPublishedListing(listing.slug);
      expect(found).toMatchObject({ id: listing.id, price: 1500, type: "class", reviewCount: 0 });
      expect(found?.rating).toBeUndefined(); // без рецензии нема оцена
      expect(found?.category.slug).toBe("gotvenje");
      expect(found?.city?.slug).toBe("skopje");
      expect((await service.searchPublished({ q: token })).map((l) => l.slug)).toEqual([listing.slug]);
    });

    it("filters by category and city, and treats % and _ in the search text literally", async () => {
      const { token, listing } = await published();
      await service.publishListing(listing.slug);

      expect(await service.searchPublished({ q: token, category: "gotvenje", city: "skopje" })).toHaveLength(1);
      expect(await service.searchPublished({ q: token, category: "keramika" })).toHaveLength(0);
      expect(await service.searchPublished({ q: token, city: "ohrid" })).toHaveLength(0);
      expect(await service.searchPublished({ q: `${token}%` })).toHaveLength(0);
      expect(await service.searchPublished({ q: `${token.slice(0, 3)}_${token.slice(4)}` })).toHaveLength(0);
    });

    it("never returns the exact address when the host masked the location", async () => {
      const { listing } = await published({ maskLocation: true, address: "Тајна улица 5" });
      await service.publishListing(listing.slug);

      const found = await service.getPublishedListing(listing.slug);
      expect(found?.maskLocation).toBe(true);
      expect(found?.address).toBeUndefined();
      expect(JSON.stringify(found)).not.toContain("Тајна улица");
    });

    it("hides a published listing and brings it back as PUBLISHED, keeping the first publish date", async () => {
      const { host, listing } = await published();
      await service.publishListing(listing.slug);
      const first = (await service.getPublishedListing(listing.slug))!.publishedAt;

      await service.setVisibility(host.slug, "temporary");
      expect(await service.getPublishedListing(listing.slug)).toBeNull();

      await service.setVisibility(host.slug, "active");
      const again = await service.getPublishedListing(listing.slug);
      expect(again).not.toBeNull();
      expect(again!.publishedAt.getTime()).toBe(first.getTime());
    });

    it("brings back a listing that was never published as IN_REVIEW, not public", async () => {
      const { host, listing } = await published();
      await service.setVisibility(host.slug, "permanent");
      await service.setVisibility(host.slug, "active");

      expect((await service.getFirstListing(host.slug))?.status).toBe("IN_REVIEW");
      expect(await service.getPublishedListing(listing.slug)).toBeNull();
    });

    it("follows the moderation rules", async () => {
      const { listing } = await published();

      expect(await service.publishListing("nema-takva-ponuda")).toBe("not-found");
      expect(await service.rejectListing(listing.slug)).toBe("ok");
      expect(await service.rejectListing(listing.slug)).toBe("wrong-status"); // само од IN_REVIEW
      expect(await service.publishListing(listing.slug)).toBe("ok"); // од REJECTED може
      expect(await service.publishListing(listing.slug)).toBe("wrong-status"); // веќе објавена
      expect(await service.rejectListing(listing.slug)).toBe("wrong-status");
    });

    it("records every decision in the audit log, with who and why", async () => {
      const { host, listing } = await published();
      const actor = { accountId: created[created.length - 1].accountId, ip: "203.0.113.7" };

      await service.rejectListing(listing.slug, { actor, reason: "Нејасен опис на активноста." });
      await service.publishListing(listing.slug, { actor });

      const rows = await client.getDb().select().from(schema.auditLog).where(eq(schema.auditLog.entityId, listing.id));
      const byAction = Object.fromEntries(rows.map((r) => [r.action, r]));
      const diff = (r: (typeof rows)[number]) => (typeof r.diff === "string" ? JSON.parse(r.diff) : r.diff);

      expect(rows).toHaveLength(2);
      expect(byAction["listing.reject"].actorAccountId).toBe(actor.accountId);
      expect(byAction["listing.reject"].ip).toBe("203.0.113.7");
      expect(diff(byAction["listing.reject"])).toEqual({ from: "IN_REVIEW", to: "REJECTED", reason: "Нејасен опис на активноста." });
      expect(diff(byAction["listing.publish"])).toEqual({ from: "REJECTED", to: "PUBLISHED" });
      expect(host.id).toBeTruthy();

      await client.getDb().delete(schema.auditLog).where(eq(schema.auditLog.entityId, listing.id));
    });

    it("lets only one of two simultaneous decisions win", async () => {
      const { listing } = await published();

      const results = await Promise.all([service.publishListing(listing.slug), service.rejectListing(listing.slug)]);

      expect(results.filter((r) => r === "ok")).toHaveLength(1);
      expect(results.filter((r) => r === "wrong-status")).toHaveLength(1);
      await client.getDb().delete(schema.auditLog).where(eq(schema.auditLog.entityId, listing.id));
    });

    it("shows the host the rejection reason, and sends the listing back to review when the host edits it", async () => {
      const { host, listing } = await published();
      await service.rejectListing(listing.slug, { reason: "Додајте појасен опис." });

      const rejected = await service.getFirstListing(host.slug);
      expect(rejected).toMatchObject({ status: "REJECTED", moderationNote: "Додајте појасен опис." });
      expect((await service.listForModeration(["REJECTED"])).find((l) => l.slug === listing.slug)?.moderationNote).toBe(
        "Додајте појасен опис.",
      );

      const edited = await service.saveListing(host.slug, classInput({ title: listing.title, price: 1700 }));
      expect(edited?.status).toBe("IN_REVIEW");
      expect(edited?.moderationNote).toBeUndefined();
      expect(edited?.price).toBe(1700);
    });

    it("clears the reason when the listing is published", async () => {
      const { host, listing } = await published();
      await service.rejectListing(listing.slug, { reason: "Недоволно информации." });
      await service.publishListing(listing.slug);

      expect((await service.getFirstListing(host.slug))?.moderationNote).toBeUndefined();
    });

    it("takes a published listing down, locks it for the host, and lets an admin restore it", async () => {
      const { host, listing } = await published();
      expect(await service.takeDownListing(listing.slug, { reason: "Жалба од гостин." })).toBe("wrong-status"); // не е објавена
      await service.publishListing(listing.slug);

      expect(await service.takeDownListing(listing.slug, { reason: "Жалба од гостин." })).toBe("ok");
      expect(await service.getPublishedListing(listing.slug)).toBeNull();
      expect(await service.getFirstListing(host.slug)).toMatchObject({
        status: "TAKEN_DOWN",
        moderationNote: "Жалба од гостин.",
      });

      // домаќинот не може да ја скрие, прикаже, ниту со уредување да ја врати
      expect(await service.setVisibility(host.slug, "active")).toBe("locked");
      expect(await service.setVisibility(host.slug, "temporary")).toBe("locked");
      await service.saveListing(host.slug, classInput({ title: listing.title }));
      expect((await service.getFirstListing(host.slug))?.status).toBe("TAKEN_DOWN");

      expect(await service.publishListing(listing.slug)).toBe("ok"); // админ: врати
      expect(await service.getPublishedListing(listing.slug)).not.toBeNull();
      expect((await service.getFirstListing(host.slug))?.moderationNote).toBeUndefined();
    });

    it("records the takedown in the audit log with the reason", async () => {
      const { listing } = await published();
      const actor = { accountId: created[created.length - 1].accountId };
      await service.publishListing(listing.slug, { actor });
      await service.takeDownListing(listing.slug, { actor, reason: "Прекршување на правилата." });

      const rows = await client.getDb().select().from(schema.auditLog).where(eq(schema.auditLog.entityId, listing.id));
      const takedown = rows.find((r) => r.action === "listing.takedown");
      const diff = typeof takedown?.diff === "string" ? JSON.parse(takedown.diff) : takedown?.diff;
      expect(diff).toEqual({ from: "PUBLISHED", to: "TAKEN_DOWN", reason: "Прекршување на правилата." });

      await client.getDb().delete(schema.auditLog).where(eq(schema.auditLog.entityId, listing.id));
    });

    it("lists pending listings for review", async () => {
      const { listing } = await published();

      expect((await service.listForModeration(["IN_REVIEW"])).map((l) => l.slug)).toContain(listing.slug);
      await service.publishListing(listing.slug);
      expect((await service.listForModeration(["IN_REVIEW"])).map((l) => l.slug)).not.toContain(listing.slug);
    });

    it("hides the listings of a suspended host", async () => {
      const { host, listing } = await published();
      await service.publishListing(listing.slug);

      await client.getDb().update(schema.hosts).set({ status: "SUSPENDED" }).where(eq(schema.hosts.id, host.id));
      expect(await service.getPublishedListing(listing.slug)).toBeNull();
      expect(await service.listPublishedForHost(host.slug)).toHaveLength(0);
    });

    it("returns the rating from listing_stats only when there are reviews", async () => {
      const { host, listing } = await published();
      await service.publishListing(listing.slug);
      await client
        .getDb()
        .insert(schema.listingStats)
        .values({ listingId: listing.id, ratingAvg: "4.50", reviewCount: 2 });

      const found = await service.getPublishedListing(listing.slug);
      expect(found).toMatchObject({ rating: 4.5, reviewCount: 2 });
      expect((await service.listPublishedForHost(host.slug)).map((l) => l.slug)).toEqual([listing.slug]);
    });
  });
});
