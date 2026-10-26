import { describe, expect, it } from "vitest";
import reference from "./reference.json";

describe("reference data (cities and categories)", () => {
  it("has unique, URL-safe slugs", () => {
    for (const list of [reference.cities, reference.categories]) {
      const slugs = list.map((item) => item.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
      for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("has a name for every city and category", () => {
    for (const item of [...reference.cities, ...reference.categories]) {
      expect(item.name.trim().length).toBeGreaterThan(0);
    }
  });

  it("keeps city coordinates inside North Macedonia", () => {
    for (const city of reference.cities) {
      expect(city.lat).toBeGreaterThan(40.8);
      expect(city.lat).toBeLessThan(42.4);
      expect(city.lng).toBeGreaterThan(20.4);
      expect(city.lng).toBeLessThan(23.1);
    }
  });

  it("orders categories with unique sort numbers", () => {
    const orders = reference.categories.map((c) => c.sortOrder);
    expect(new Set(orders).size).toBe(orders.length);
    expect([...orders].sort((a, b) => a - b)).toEqual(orders);
  });
});
