import { Account, DynamicHost, Experience, readDb } from "./db";

export type SetupProgress = {
  /** false за демо домаќините (поврзани со hosts.ts): тие немаат чекори за поставување */
  hasSetup: boolean;
  host: DynamicHost | null;
  experience: Experience | null;
  /** Следен недовршен чекор (1–4) или null ако сè е готово */
  nextStep: 1 | 2 | 3 | 4 | null;
};

export async function getSetupProgress(account: Account): Promise<SetupProgress> {
  const db = await readDb();
  const host = db.hosts.find((h) => h.slug === account.hostSlug) ?? null;
  const experience = db.experiences.find((e) => e.hostSlug === account.hostSlug) ?? null;

  if (!host) return { hasSetup: false, host: null, experience, nextStep: null };

  const nextStep = !host.profileCompletedAt
    ? 1
    : !experience
      ? 2
      : !experience.availability
        ? 3
        : !host.payout
          ? 4
          : null;

  return { hasSetup: true, host, experience, nextStep };
}
