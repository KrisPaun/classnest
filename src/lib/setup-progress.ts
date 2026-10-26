import type { HostRecord } from "@/server/modules/hosts/types";
import { getFirstListing } from "@/server/modules/listings/service";
import type { ListingRecord } from "@/server/modules/listings/types";
import type { Account } from "@/server/modules/identity/types";
import { getDynamicHost } from "./host-directory";

export type SetupProgress = {
  /** false за демо домаќините (поврзани со hosts.ts): тие немаат чекори за поставување */
  hasSetup: boolean;
  host: HostRecord | null;
  experience: ListingRecord | null;
  /** Следен недовршен чекор (1–4) или null ако сè е готово */
  nextStep: 1 | 2 | 3 | 4 | null;
};

export async function getSetupProgress(account: Account): Promise<SetupProgress> {
  const host = await getDynamicHost(account.hostSlug);
  if (!host) return { hasSetup: false, host: null, experience: null, nextStep: null };

  const experience = await getFirstListing(account.hostSlug);

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
