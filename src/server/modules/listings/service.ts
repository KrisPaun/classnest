import type { Availability } from "@/lib/availability";
import { duplicateKeyName, isDuplicateKeyError } from "../../db/errors";
import { uuidv7 } from "../../platform/ids.mjs";
import { makeSlug } from "../../platform/slug.mjs";
import { getPublicHost } from "../hosts/service";
import * as repo from "./repo";
import { canChangeVisibility, canPublish, canReject, canTakeDown, statusAfterHostEdit, visibilityToStatus } from "./status";
import type { ListingInput, ListingRecord, ListingStatus, ListingVisibility, ModerationActor } from "./types";

// Деловни правила за понуди. Моделот за сега е „една понуда по домаќин“ (чекор 2 од поставувањето).

/** Првата (и за сега единствена) понуда на домаќинот, со неговата достапност. */
export const getFirstListing = repo.findFirstByHostSlug;
export const listHostListings = repo.listByHostSlug;

/**
 * Создава или менува понуда на домаќинот. `id` се користи само при создавање (за клучот на фотографиите).
 * Враќа null ако домаќинот не постои.
 */
export async function saveListing(
  hostSlug: string,
  input: ListingInput & { id?: string },
): Promise<ListingRecord | null> {
  const host = await getPublicHost(hostSlug);
  if (!host) return null;

  const { id, ...data } = input;
  const existing = await repo.findFirstByHostSlug(hostSlug);
  if (existing) {
    // Slug-от и достапноста остануваат. Одбиена понуда оди пак на преглед.
    const next = statusAfterHostEdit(existing.status);
    return repo.update(existing.id, data, next === existing.status ? undefined : next);
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await repo.insert({
        ...data,
        id: id ?? uuidv7(),
        hostId: host.id,
        slug: makeSlug(data.title, "ponuda", new Set(), 60),
      });
    } catch (error) {
      // Редок судир на случајниот наставак на slug-от: пробај со друг.
      if (isDuplicateKeyError(error) && duplicateKeyName(error).includes("listings_slug_uq")) continue;
      throw error;
    }
  }
  throw new Error("Could not allocate a unique listing slug");
}

/** Чекор 3. Враќа false ако домаќинот нема понуда. */
export async function saveAvailability(hostSlug: string, availability: Availability): Promise<boolean> {
  const listing = await repo.findFirstByHostSlug(hostSlug);
  if (!listing) return false;
  await repo.replaceAvailability(listing.id, availability, new Date());
  return true;
}

/** Скриј или прикажи ја понудата. „locked“ значи дека администратор ја симнал, па домаќинот не може да ја менува. */
export async function setVisibility(
  hostSlug: string,
  visibility: ListingVisibility,
): Promise<"ok" | "not-found" | "locked"> {
  const listing = await repo.findFirstByHostSlug(hostSlug);
  if (!listing) return "not-found";
  if (!canChangeVisibility(listing.status)) return "locked";
  await repo.setStatus(listing.id, visibilityToStatus(visibility, listing.status, Boolean(listing.publishedAt)));
  return "ok";
}

// Јавен поглед: само објавени понуди.
export const searchPublished = repo.searchPublished;
export const getPublishedListing = repo.findPublishedBySlug;
export const listPublishedForHost = repo.listPublishedByHostSlug;

// Модерација: админ екранот (/admin) и командната линија.
export const listForModeration = repo.listForModeration;
export const countByStatus = repo.countByStatus;

export type ModerationResult = "ok" | "not-found" | "wrong-status";
type Options = { actor?: ModerationActor; now?: Date };

async function moderate(
  slug: string,
  to: "PUBLISHED" | "REJECTED" | "TAKEN_DOWN",
  allowed: (status: ListingStatus) => boolean,
  options: Options & { reason?: string },
): Promise<ModerationResult> {
  const state = await repo.findModerationState(slug);
  if (!state) return "not-found";
  if (!allowed(state.status)) return "wrong-status";
  const done = await repo.setModeration(state.id, state.status, to, options.now ?? new Date(), {
    ...options.actor,
    reason: options.reason,
  });
  return done ? "ok" : "wrong-status"; // некој друг ја сменил во меѓувреме
}

export const publishListing = (slug: string, options: Options = {}) =>
  moderate(slug, "PUBLISHED", canPublish, options);

export const rejectListing = (slug: string, options: Options & { reason?: string } = {}) =>
  moderate(slug, "REJECTED", canReject, options);

/** Симнува објавена понуда (жалби, прекршување на правила). Домаќинот не може сам да ја врати. */
export const takeDownListing = (slug: string, options: Options & { reason?: string } = {}) =>
  moderate(slug, "TAKEN_DOWN", canTakeDown, options);
