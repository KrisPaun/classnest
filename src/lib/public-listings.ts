import { cache } from "react";
import {
  getPublishedListing,
  listPublishedForHost,
  searchPublished,
} from "@/server/modules/listings/service";
import type { ListingSearch, PublicListing } from "@/server/modules/listings/types";
import { readOrFallback } from "./safe-read";

// Читање за посетители. Ако базата не одговара, страниците покажуваат празна состојба наместо да паднат.

export const findListings = (search: ListingSearch = {}) =>
  readOrFallback(() => searchPublished(search), [] as PublicListing[]);

export const findListing = cache((slug: string) => readOrFallback(() => getPublishedListing(slug), null));

export const findHostListings = (hostSlug: string) =>
  readOrFallback(() => listPublishedForHost(hostSlug), [] as PublicListing[]);

export type ListingStats = { listingCount: number; reviewCount: number; rating: number };

/** Збир за домаќин: број на понуди, рецензии и просечна оцена (тежински по рецензии). */
export function summarize(listings: PublicListing[]): ListingStats {
  const reviewCount = listings.reduce((sum, l) => sum + l.reviewCount, 0);
  const rating = reviewCount
    ? listings.reduce((sum, l) => sum + (l.rating ?? 0) * l.reviewCount, 0) / reviewCount
    : 0;
  return { listingCount: listings.length, reviewCount, rating };
}
