import type { Account } from "@/server/modules/identity/types";
import { listHostListings } from "@/server/modules/listings/service";
import { MAX_PHOTOS_PER_CLASS, MAX_PROFILE_PHOTOS, experiencePhotoKey, hostPhotoKey } from "./photos";

export type PhotoTarget = { key: string; title: string; max: number };

/** Што смее да уредува најавениот домаќин: профилот и фотографиите на сопствените понуди. */
export async function ownedTargets(account: Account): Promise<PhotoTarget[]> {
  const targets: PhotoTarget[] = [
    { key: hostPhotoKey(account.hostSlug), title: "Мојот профил", max: MAX_PROFILE_PHOTOS },
  ];

  for (const listing of await listHostListings(account.hostSlug)) {
    targets.push({ key: experiencePhotoKey(listing.id), title: listing.title, max: MAX_PHOTOS_PER_CLASS });
  }
  return targets;
}

export const findOwnedTarget = async (account: Account, key: string) =>
  (await ownedTargets(account)).find((t) => t.key === key);
