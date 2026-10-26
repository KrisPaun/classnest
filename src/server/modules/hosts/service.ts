import { duplicateKeyName, isDuplicateKeyError } from "../../db/errors";
import * as repo from "./repo";
import { makeHostSlug } from "./slug";
import { HostExistsError, type HostRecord, type PayoutSettings } from "./types";

// Деловни правила за домаќини. Јавните функции (getPublicHost, listPublicHosts) никогаш не враќаат приватни податоци.

/**
 * Креира профил на домаќин за сметка. Slug-от се прави од името (со случаен наставак).
 */
export async function createHost(input: {
  accountId: string;
  name: string;
  citySlug: string;
  categorySlug?: string;
  about: string;
  businessName?: string;
  website?: string;
  phoneEnc?: string;
}): Promise<HostRecord> {
  const taken = new Set<string>();

  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = makeHostSlug(input.name, taken);
    try {
      return await repo.insertHost({ ...input, slug });
    } catch (error) {
      if (!isDuplicateKeyError(error)) throw error;
      const key = duplicateKeyName(error);
      if (key.includes("hosts_account_uq")) throw new HostExistsError();
      if (key.includes("hosts_slug_uq")) {
        taken.add(slug); // редок судир на случајниот наставак: пробај со друг
        continue;
      }
      throw error;
    }
  }
  throw new Error("Could not allocate a unique host slug");
}

/** Јавен поглед: без приватни податоци и без исплата. */
export const getPublicHost = repo.findBySlug;
export const listPublicHosts = repo.listActive;
export const getHostByAccountId = repo.findByAccountId;

/** Поглед за сопственикот: ги вклучува поставките за исплата (шифрирани полиња). Никогаш не оди директно до прелистувач. */
export async function getOwnerHost(slug: string): Promise<HostRecord | null> {
  const host = await repo.findBySlug(slug);
  if (!host) return null;
  return { ...host, payout: await repo.loadPayout(host.id) };
}

/** Чекор 1. Го означува профилот како завршен при прво зачувување. Враќа false ако домаќинот не постои. */
export async function completeProfile(
  slug: string,
  input: {
    story: string;
    website?: string;
    instagram?: string;
    facebook?: string;
    started?: { month: number; year: number };
  },
): Promise<boolean> {
  const host = await repo.findBySlug(slug);
  if (!host) return false;

  await repo.updateProfile(
    host.id,
    {
      story: input.story,
      website: input.website ?? null,
      instagram: input.instagram ?? null,
      facebook: input.facebook ?? null,
      startedMonth: input.started?.month ?? null,
      startedYear: input.started?.year ?? null,
    },
    new Date(),
    Boolean(host.profileCompletedAt),
  );
  return true;
}

/** Чекор 4. Бара веќе шифрирани вредности (шифрирањето е на рабовите). Враќа false ако домаќинот не постои. */
export async function savePayout(slug: string, input: Omit<PayoutSettings, "savedAt">): Promise<boolean> {
  const host = await repo.findBySlug(slug);
  if (!host) return false;
  await repo.upsertPayout(host.id, input, new Date());
  return true;
}

/** „Враќање назад“ при регистрација, ако следниот чекор не успее. */
export const removeHost = repo.deleteHostById;
