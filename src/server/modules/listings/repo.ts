import { and, asc, desc, eq, inArray, like, or, sql } from "drizzle-orm";
import type { Availability } from "@/lib/availability";
import type { CancellationPolicy, Fulfilment, ListingType } from "@/data/listing-types";
import { getDb } from "../../db/client";
import {
  auditLog,
  availabilitySlots,
  categories,
  cities,
  hosts,
  listingAvailabilitySettings,
  listingStats,
  listings,
} from "../../db/schema";
import { fromMinor, toMinor } from "../../platform/money";
import { containsPattern } from "../../platform/sql";
import { UnknownReferenceError } from "../hosts/types";
import { statusToVisibility } from "./status";
import type {
  ListingInput,
  ListingRecord,
  ListingSearch,
  ListingStatus,
  ModerationActor,
  ModerationItem,
  PublicListing,
} from "./types";

// Само SQL. Правилата се во service.ts.

const listingSelect = () =>
  getDb()
    .select({ listing: listings, hostSlug: hosts.slug, categorySlug: categories.slug, citySlug: cities.slug })
    .from(listings)
    .innerJoin(hosts, eq(hosts.id, listings.hostId))
    .innerJoin(categories, eq(categories.id, listings.categoryId))
    .leftJoin(cities, eq(cities.id, listings.cityId));

type ListingJoin = Awaited<ReturnType<typeof listingSelect>>[number];

const orUndefined = <T>(value: T | null | undefined): T | undefined => value ?? undefined;

async function loadAvailability(listingId: string): Promise<Availability | undefined> {
  const db = getDb();
  const [settings] = await db
    .select()
    .from(listingAvailabilitySettings)
    .where(eq(listingAvailabilitySettings.listingId, listingId))
    .limit(1);
  if (!settings) return undefined;

  const slots = await db
    .select()
    .from(availabilitySlots)
    .where(eq(availabilitySlots.listingId, listingId))
    .orderBy(asc(availabilitySlots.weekday), asc(availabilitySlots.startMinute));

  return {
    flexibility: settings.flexibility as Availability["flexibility"],
    parallelBookings: settings.allowParallelPrivateBookings,
    slots: slots.map((s) => ({ day: s.weekday, from: s.startMinute, to: s.endMinute })),
  };
}

async function toRecord({ listing, hostSlug, categorySlug, citySlug }: ListingJoin): Promise<ListingRecord> {
  const cancellation: CancellationPolicy | undefined = listing.cancellationMode
    ? {
        mode: listing.cancellationMode as CancellationPolicy["mode"],
        ...(listing.cancellationDays != null ? { days: listing.cancellationDays } : {}),
      }
    : undefined;
  const status = listing.status as ListingStatus;

  return {
    id: listing.id,
    hostSlug,
    slug: listing.slug,
    type: listing.type as ListingType,
    title: listing.title,
    category: categorySlug,
    description: listing.description,
    price: fromMinor(listing.priceMinor),
    durationMinutes: orUndefined(listing.durationMinutes),
    maxPeople: orUndefined(listing.maxParticipants),
    cancellation,
    availability: await loadAvailability(listing.id),
    status,
    visibility: statusToVisibility(status),
    publishedAt: orUndefined(listing.publishedAt),
    moderationNote: orUndefined(listing.moderationNote),
    city: orUndefined(citySlug),
    address: orUndefined(listing.addressLine),
    maskLocation: listing.cityId || listing.addressLine ? listing.maskLocation : undefined,
    platform: orUndefined(listing.onlinePlatform),
    fulfilment: orUndefined(listing.fulfilment) as Fulfilment | undefined,
    createdAt: listing.createdAt,
    updatedAt: listing.updatedAt,
  };
}

export async function findFirstByHostSlug(hostSlug: string): Promise<ListingRecord | null> {
  const [row] = await listingSelect()
    .where(eq(hosts.slug, hostSlug))
    .orderBy(asc(listings.createdAt))
    .limit(1);
  return row ? toRecord(row) : null;
}

export async function listByHostSlug(hostSlug: string): Promise<ListingRecord[]> {
  const rows = await listingSelect().where(eq(hosts.slug, hostSlug)).orderBy(asc(listings.createdAt));
  return Promise.all(rows.map(toRecord));
}

async function findById(id: string): Promise<ListingRecord | null> {
  const [row] = await listingSelect().where(eq(listings.id, id)).limit(1);
  return row ? toRecord(row) : null;
}

async function resolveIds(categorySlug: string, citySlug?: string) {
  const db = getDb();
  const [category] = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, categorySlug)).limit(1);
  if (!category) throw new UnknownReferenceError("category", categorySlug);

  let cityId: string | null = null;
  if (citySlug) {
    const [city] = await db.select({ id: cities.id }).from(cities).where(eq(cities.slug, citySlug)).limit(1);
    if (!city) throw new UnknownReferenceError("city", citySlug);
    cityId = city.id;
  }
  return { categoryId: category.id, cityId };
}

/** Колоните што зависат од типот: непотребните стануваат NULL, за да не остане старо поле од друг тип. */
async function typeColumns(input: ListingInput) {
  const { categoryId, cityId } = await resolveIds(input.category, input.city);
  return {
    type: input.type,
    title: input.title,
    categoryId,
    description: input.description,
    priceMinor: toMinor(input.price),
    durationMinutes: input.durationMinutes ?? null,
    maxParticipants: input.maxPeople ?? null,
    cityId,
    addressLine: input.address ?? null,
    maskLocation: input.maskLocation === true,
    onlinePlatform: input.platform ?? null,
    fulfilment: input.fulfilment ?? null,
    cancellationMode: input.cancellation?.mode ?? null,
    cancellationDays: input.cancellation?.days ?? null,
  };
}

export async function insert(input: ListingInput & { id: string; hostId: string; slug: string }): Promise<ListingRecord> {
  const columns = await typeColumns(input);
  await getDb().insert(listings).values({ id: input.id, hostId: input.hostId, slug: input.slug, ...columns });
  const created = await findById(input.id);
  if (!created) throw new Error("Listing was not saved");
  return created;
}

/** `status` се праќа само кога менувањето го менува статусот (одбиена понуда оди пак на преглед и ја губи причината). */
export async function update(id: string, input: ListingInput, status?: ListingStatus): Promise<ListingRecord> {
  const columns = await typeColumns(input);
  await getDb()
    .update(listings)
    .set({
      ...columns,
      ...(status ? { status, moderationNote: null } : {}),
      version: sql`${listings.version} + 1`,
    })
    .where(eq(listings.id, id));
  const updated = await findById(id);
  if (!updated) throw new Error("Listing not found");
  return updated;
}

export async function setStatus(id: string, status: ListingStatus) {
  await getDb()
    .update(listings)
    .set({ status, version: sql`${listings.version} + 1` })
    .where(eq(listings.id, id));
}

/**
 * Ги заменува поставките и термините. Редот на понудата се заклучува (FOR UPDATE),
 * па две истовремени промени на иста понуда се извршуваат една по друга.
 */
export async function replaceAvailability(listingId: string, availability: Availability, now: Date) {
  await getDb().transaction(async (tx) => {
    await tx.select({ id: listings.id }).from(listings).where(eq(listings.id, listingId)).for("update");

    await tx
      .insert(listingAvailabilitySettings)
      .values({
        listingId,
        flexibility: availability.flexibility,
        allowParallelPrivateBookings: availability.parallelBookings,
      })
      .onDuplicateKeyUpdate({
        set: {
          flexibility: availability.flexibility,
          allowParallelPrivateBookings: availability.parallelBookings,
          updatedAt: now,
        },
      });

    await tx.delete(availabilitySlots).where(eq(availabilitySlots.listingId, listingId));
    if (availability.slots.length > 0) {
      await tx.insert(availabilitySlots).values(
        availability.slots.map((s) => ({
          listingId,
          weekday: s.day,
          startMinute: s.from,
          endMinute: s.to,
        })),
      );
    }

    await tx.update(listings).set({ updatedAt: now }).where(eq(listings.id, listingId));
  });
}

// ---------------------------------------------------------------------------------------------
// Јавен поглед (за посетители): само објавени понуди на активни домаќини.
// ---------------------------------------------------------------------------------------------

const publicSelect = () =>
  getDb()
    .select({
      listing: listings,
      hostSlug: hosts.slug,
      hostName: hosts.displayName,
      hostBusiness: hosts.businessName,
      categorySlug: categories.slug,
      categoryName: categories.name,
      categoryEmoji: categories.emoji,
      citySlug: cities.slug,
      cityName: cities.name,
      ratingAvg: listingStats.ratingAvg,
      reviewCount: listingStats.reviewCount,
    })
    .from(listings)
    .innerJoin(hosts, eq(hosts.id, listings.hostId))
    .innerJoin(categories, eq(categories.id, listings.categoryId))
    .leftJoin(cities, eq(cities.id, listings.cityId))
    .leftJoin(listingStats, eq(listingStats.listingId, listings.id));

type PublicJoin = Awaited<ReturnType<typeof publicSelect>>[number];

const isPublic = () => and(eq(listings.status, "PUBLISHED"), eq(hosts.status, "ACTIVE"));

function toPublic(row: PublicJoin): PublicListing {
  const { listing } = row;
  const reviewCount = row.reviewCount ?? 0;
  const cancellation: CancellationPolicy | undefined = listing.cancellationMode
    ? {
        mode: listing.cancellationMode as CancellationPolicy["mode"],
        ...(listing.cancellationDays != null ? { days: listing.cancellationDays } : {}),
      }
    : undefined;

  return {
    id: listing.id,
    slug: listing.slug,
    type: listing.type as ListingType,
    title: listing.title,
    description: listing.description,
    category: { slug: row.categorySlug, name: row.categoryName, emoji: orUndefined(row.categoryEmoji) },
    city: row.citySlug && row.cityName ? { slug: row.citySlug, name: row.cityName } : undefined,
    // Точната адреса никогаш не излегува од серверот ако домаќинот побарал да ја скрие.
    address: listing.maskLocation ? undefined : orUndefined(listing.addressLine),
    maskLocation: listing.maskLocation,
    price: fromMinor(listing.priceMinor),
    durationMinutes: orUndefined(listing.durationMinutes),
    maxPeople: orUndefined(listing.maxParticipants),
    platform: orUndefined(listing.onlinePlatform),
    fulfilment: orUndefined(listing.fulfilment) as Fulfilment | undefined,
    cancellation,
    rating: reviewCount > 0 ? Number(row.ratingAvg) : undefined,
    reviewCount,
    host: { slug: row.hostSlug, name: row.hostName, businessName: orUndefined(row.hostBusiness) },
    publishedAt: listing.publishedAt ?? listing.createdAt,
  };
}

const newestFirst = [desc(listings.publishedAt), desc(listings.createdAt)] as const;

export async function searchPublished(search: ListingSearch = {}): Promise<PublicListing[]> {
  const conditions = [isPublic()];

  const q = search.q?.trim().slice(0, 100);
  if (q) {
    const pattern = containsPattern(q);
    conditions.push(or(like(listings.title, pattern), like(listings.description, pattern)));
  }
  if (search.category) conditions.push(eq(categories.slug, search.category));
  if (search.city) conditions.push(eq(cities.slug, search.city));

  const rows = await publicSelect()
    .where(and(...conditions))
    .orderBy(...newestFirst)
    .limit(Math.min(Math.max(search.limit ?? 48, 1), 100));
  return rows.map(toPublic);
}

export async function findPublishedBySlug(slug: string): Promise<PublicListing | null> {
  const [row] = await publicSelect().where(and(isPublic(), eq(listings.slug, slug))).limit(1);
  return row ? toPublic(row) : null;
}

export async function listPublishedByHostSlug(hostSlug: string): Promise<PublicListing[]> {
  const rows = await publicSelect()
    .where(and(isPublic(), eq(hosts.slug, hostSlug)))
    .orderBy(...newestFirst);
  return rows.map(toPublic);
}

// ---------------------------------------------------------------------------------------------
// Модерација
// ---------------------------------------------------------------------------------------------

export async function findModerationState(slug: string) {
  const [row] = await getDb()
    .select({ id: listings.id, status: listings.status, publishedAt: listings.publishedAt })
    .from(listings)
    .where(eq(listings.slug, slug))
    .limit(1);
  return row ? { id: row.id, status: row.status as ListingStatus, publishedAt: row.publishedAt } : null;
}

export async function listForModeration(statuses: ListingStatus[]): Promise<ModerationItem[]> {
  const rows = await getDb()
    .select({
      listing: listings,
      hostSlug: hosts.slug,
      hostName: hosts.displayName,
      categoryName: categories.name,
      cityName: cities.name,
    })
    .from(listings)
    .innerJoin(hosts, eq(hosts.id, listings.hostId))
    .innerJoin(categories, eq(categories.id, listings.categoryId))
    .leftJoin(cities, eq(cities.id, listings.cityId))
    .where(inArray(listings.status, statuses))
    .orderBy(asc(listings.createdAt))
    .limit(200);

  return rows.map(({ listing, hostSlug, hostName, categoryName, cityName }) => ({
    id: listing.id,
    slug: listing.slug,
    type: listing.type as ListingType,
    title: listing.title,
    description: listing.description,
    status: listing.status as ListingStatus,
    category: categoryName,
    city: orUndefined(cityName),
    address: orUndefined(listing.addressLine),
    maskLocation: listing.maskLocation,
    price: fromMinor(listing.priceMinor),
    durationMinutes: orUndefined(listing.durationMinutes),
    maxPeople: orUndefined(listing.maxParticipants),
    platform: orUndefined(listing.onlinePlatform),
    fulfilment: orUndefined(listing.fulfilment) as Fulfilment | undefined,
    host: { slug: hostSlug, name: hostName },
    moderationNote: orUndefined(listing.moderationNote),
    createdAt: listing.createdAt,
    publishedAt: orUndefined(listing.publishedAt),
  }));
}

export async function countByStatus(): Promise<Record<string, number>> {
  const rows = await getDb()
    .select({ status: listings.status, total: sql<number>`count(*)` })
    .from(listings)
    .groupBy(listings.status);
  return Object.fromEntries(rows.map((r) => [r.status, Number(r.total)]));
}

/**
 * Одлука на модераторот, во една трансакција со записот во audit_log.
 * Менува САМО ако статусот сè уште е `from` (два модератори не се газат). Враќа false ако не е.
 * Првото објавување го поставува published_at и повеќе не се менува.
 */
export async function setModeration(
  id: string,
  from: ListingStatus,
  to: "PUBLISHED" | "REJECTED" | "TAKEN_DOWN",
  now: Date,
  audit: ModerationActor & { reason?: string },
): Promise<boolean> {
  return getDb().transaction(async (tx) => {
    const [result] = await tx
      .update(listings)
      .set({
        status: to,
        // Причината ја гледа домаќинот. Објавувањето ја брише.
        moderationNote: to === "PUBLISHED" ? null : (audit.reason ?? null),
        version: sql`${listings.version} + 1`,
        ...(to === "PUBLISHED" ? { publishedAt: sql`COALESCE(${listings.publishedAt}, ${now})` } : {}),
      })
      .where(and(eq(listings.id, id), eq(listings.status, from)));
    if (result.affectedRows === 0) return false;

    await tx.insert(auditLog).values({
      actorAccountId: audit.accountId ?? null,
      action: { PUBLISHED: "listing.publish", REJECTED: "listing.reject", TAKEN_DOWN: "listing.takedown" }[to],
      entityType: "listing",
      entityId: id,
      diff: { from, to, ...(audit.reason ? { reason: audit.reason } : {}) },
      ip: audit.ip ?? null,
      createdAt: now,
    });
    return true;
  });
}
