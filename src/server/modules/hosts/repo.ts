import { eq } from "drizzle-orm";
import { getDb } from "../../db/client";
import { categories, cities, hostPrivateDetails, hostSettings, hosts, payoutAccounts } from "../../db/schema";
import { uuidv7 } from "../../platform/ids.mjs";
import type { HostRecord, PayoutSettings } from "./types";
import { UnknownReferenceError } from "./types";

// Само SQL. Правилата се во service.ts.

const hostSelect = () =>
  getDb()
    .select({ host: hosts, citySlug: cities.slug, categorySlug: categories.slug })
    .from(hosts)
    .innerJoin(cities, eq(cities.id, hosts.cityId))
    .leftJoin(categories, eq(categories.id, hosts.categoryId));

type HostJoin = Awaited<ReturnType<typeof hostSelect>>[number];

const orUndefined = <T>(value: T | null | undefined): T | undefined => value ?? undefined;

function toRecord({ host, citySlug, categorySlug }: HostJoin): HostRecord {
  return {
    id: host.id,
    accountId: host.accountId,
    slug: host.slug,
    name: host.displayName,
    city: citySlug,
    category: orUndefined(categorySlug),
    about: host.shortBio,
    story: orUndefined(host.story),
    businessName: orUndefined(host.businessName),
    website: orUndefined(host.websiteUrl),
    instagram: orUndefined(host.instagramUrl),
    facebook: orUndefined(host.facebookUrl),
    startedMonth: orUndefined(host.startedMonth),
    startedYear: orUndefined(host.startedYear),
    profileCompletedAt: orUndefined(host.profileCompletedAt),
    createdAt: host.createdAt,
  };
}

export async function findBySlug(slug: string): Promise<HostRecord | null> {
  const [row] = await hostSelect().where(eq(hosts.slug, slug)).limit(1);
  return row ? toRecord(row) : null;
}

export async function findByAccountId(accountId: string): Promise<HostRecord | null> {
  const [row] = await hostSelect().where(eq(hosts.accountId, accountId)).limit(1);
  return row ? toRecord(row) : null;
}

export async function listActive(): Promise<HostRecord[]> {
  const rows = await hostSelect().where(eq(hosts.status, "ACTIVE"));
  return rows.map(toRecord);
}

async function resolveIds(citySlug: string, categorySlug?: string) {
  const db = getDb();
  const [city] = await db.select({ id: cities.id }).from(cities).where(eq(cities.slug, citySlug)).limit(1);
  if (!city) throw new UnknownReferenceError("city", citySlug);

  let categoryId: string | null = null;
  if (categorySlug) {
    const [category] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, categorySlug))
      .limit(1);
    if (!category) throw new UnknownReferenceError("category", categorySlug);
    categoryId = category.id;
  }
  return { cityId: city.id, categoryId };
}

export async function insertHost(input: {
  accountId: string;
  slug: string;
  name: string;
  citySlug: string;
  categorySlug?: string;
  about: string;
  businessName?: string;
  website?: string;
  phoneEnc?: string;
}): Promise<HostRecord> {
  const { cityId, categoryId } = await resolveIds(input.citySlug, input.categorySlug);

  await getDb().transaction(async (tx) => {
    const id = uuidv7();
    await tx.insert(hosts).values({
      id,
      accountId: input.accountId,
      slug: input.slug,
      displayName: input.name,
      businessName: input.businessName ?? null,
      cityId,
      categoryId,
      shortBio: input.about,
      websiteUrl: input.website ?? null,
    });
    if (input.phoneEnc) await tx.insert(hostPrivateDetails).values({ hostId: id, phoneEnc: input.phoneEnc });
  });

  const created = await findBySlug(input.slug);
  if (!created) throw new Error("Host was not saved");
  return created;
}

export async function updateProfile(
  hostId: string,
  input: {
    story: string;
    website: string | null;
    instagram: string | null;
    facebook: string | null;
    startedMonth: number | null;
    startedYear: number | null;
  },
  now: Date,
  alreadyCompleted: boolean,
) {
  await getDb()
    .update(hosts)
    .set({
      story: input.story,
      websiteUrl: input.website,
      instagramUrl: input.instagram,
      facebookUrl: input.facebook,
      startedMonth: input.startedMonth,
      startedYear: input.startedYear,
      ...(alreadyCompleted ? {} : { profileCompletedAt: now }),
    })
    .where(eq(hosts.id, hostId));
}

/** Приватните податоци и поставките за исплата, за еден домаќин. */
export async function loadPayout(hostId: string): Promise<PayoutSettings | undefined> {
  const db = getDb();
  const [settings] = await db.select().from(hostSettings).where(eq(hostSettings.hostId, hostId)).limit(1);
  const [bank] = await db.select().from(payoutAccounts).where(eq(payoutAccounts.hostId, hostId)).limit(1);
  if (!settings || !bank) return undefined;

  const [priv] = await db.select().from(hostPrivateDetails).where(eq(hostPrivateDetails.hostId, hostId)).limit(1);

  return {
    bank: { bankName: bank.bankName, holder: bank.holderName, ibanEnc: bank.ibanEnc, ibanLast4: bank.ibanLast4 },
    tradingName: settings.tradingName,
    taxNumber: orUndefined(priv?.taxNumber),
    dobEnc: orUndefined(priv?.dateOfBirthEnc),
    vatRegistered: priv?.vatRegistered ?? false,
    onePublicBookingAtATime: settings.onePublicBookingAtATime,
    allowSelfServiceChanges: settings.allowSelfServiceChanges,
    allowPromoUse: settings.allowPromoUse,
    payoutFrequency: settings.payoutFrequency as PayoutSettings["payoutFrequency"],
    savedAt: bank.updatedAt,
  };
}

/** Зачувува сè од чекор 4 во една трансакција. Телефонот (во host_private_details) не се допира. */
export async function upsertPayout(hostId: string, input: Omit<PayoutSettings, "savedAt">, now: Date) {
  await getDb().transaction(async (tx) => {
    await tx
      .insert(hostSettings)
      .values({
        hostId,
        tradingName: input.tradingName,
        onePublicBookingAtATime: input.onePublicBookingAtATime,
        allowSelfServiceChanges: input.allowSelfServiceChanges,
        allowPromoUse: input.allowPromoUse,
        payoutFrequency: input.payoutFrequency,
      })
      .onDuplicateKeyUpdate({
        set: {
          tradingName: input.tradingName,
          onePublicBookingAtATime: input.onePublicBookingAtATime,
          allowSelfServiceChanges: input.allowSelfServiceChanges,
          allowPromoUse: input.allowPromoUse,
          payoutFrequency: input.payoutFrequency,
          updatedAt: now,
        },
      });

    await tx
      .insert(payoutAccounts)
      .values({
        hostId,
        bankName: input.bank.bankName,
        holderName: input.bank.holder,
        ibanEnc: input.bank.ibanEnc,
        ibanLast4: input.bank.ibanLast4,
      })
      .onDuplicateKeyUpdate({
        set: {
          bankName: input.bank.bankName,
          holderName: input.bank.holder,
          ibanEnc: input.bank.ibanEnc,
          ibanLast4: input.bank.ibanLast4,
          updatedAt: now,
        },
      });

    await tx
      .insert(hostPrivateDetails)
      .values({
        hostId,
        taxNumber: input.taxNumber ?? null,
        dateOfBirthEnc: input.dobEnc ?? null,
        vatRegistered: input.vatRegistered,
      })
      .onDuplicateKeyUpdate({
        set: {
          taxNumber: input.taxNumber ?? null,
          dateOfBirthEnc: input.dobEnc ?? null,
          vatRegistered: input.vatRegistered,
          updatedAt: now,
        },
      });
  });
}

/** Се користи за „враќање назад“ при регистрација. Приватните табели се бришат автоматски (cascade). */
export async function deleteHostById(hostId: string) {
  await getDb().delete(hosts).where(eq(hosts.id, hostId));
}
