import { describe, expect, it } from "vitest";
import type { PublicListing } from "@/server/modules/listings/types";
import { summarize } from "./public-listings";

const listing = (rating: number | undefined, reviewCount: number) =>
  ({ rating, reviewCount }) as PublicListing;

describe("summarize", () => {
  it("returns zeros for no listings", () => {
    expect(summarize([])).toEqual({ listingCount: 0, reviewCount: 0, rating: 0 });
  });

  it("weights the rating by the number of reviews", () => {
    const stats = summarize([listing(5, 1), listing(4, 3)]);
    expect(stats.listingCount).toBe(2);
    expect(stats.reviewCount).toBe(4);
    expect(stats.rating).toBeCloseTo(4.25);
  });

  it("ignores listings without reviews in the rating", () => {
    expect(summarize([listing(undefined, 0), listing(4.5, 2)]).rating).toBeCloseTo(4.5);
  });
});
