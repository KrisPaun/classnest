import { classes } from "@/data/classes";
import { getHost } from "@/data/hosts";
import { Account, readDb } from "./db";
import { MAX_PHOTOS_PER_CLASS, MAX_PROFILE_PHOTOS, experiencePhotoKey, hostPhotoKey } from "./photos";

export type PhotoTarget = { key: string; title: string; max: number };

/** Што смее да уредува најавениот домаќин: профил, демо искуства и искуства од чекор 2. */
export async function ownedTargets(account: Account): Promise<PhotoTarget[]> {
  const targets: PhotoTarget[] = [
    { key: hostPhotoKey(account.hostSlug), title: "Мојот профил", max: MAX_PROFILE_PHOTOS },
  ];

  const staticHost = getHost(account.hostSlug);
  if (staticHost) {
    for (const c of classes.filter((c) => c.host === staticHost.name)) {
      targets.push({ key: c.slug, title: c.title, max: MAX_PHOTOS_PER_CLASS });
    }
  }

  const db = await readDb();
  for (const e of db.experiences.filter((e) => e.hostSlug === account.hostSlug)) {
    targets.push({ key: experiencePhotoKey(e.id), title: e.title, max: MAX_PHOTOS_PER_CLASS });
  }
  return targets;
}

export const findOwnedTarget = async (account: Account, key: string) =>
  (await ownedTargets(account)).find((t) => t.key === key);
