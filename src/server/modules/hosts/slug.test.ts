import { describe, expect, it } from "vitest";
import { makeHostSlug } from "./slug";

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

describe("makeHostSlug", () => {
  it("turns a Cyrillic name into a lower-case Latin slug with a random suffix", () => {
    const slug = makeHostSlug("Ана Трајковска");

    expect(slug).toMatch(/^ana-trajkovska-[0-9a-f]{4}$/);
  });

  it.each([
    ["Ѓорѓи", "gjorgji"],
    ["Љубен", "ljuben"],
    ["Његош", "njegosh"],
    ["Ќиро", "kjiro"],
    ["Џон", "dzhon"],
    ["Ѕвезда", "dzvezda"],
    ["Шаренко", "sharenko"],
    ["Жаба Чавка", "zhaba-chavka"],
  ])("transliterates the special letters in %s", (name, expected) => {
    expect(makeHostSlug(name)).toMatch(new RegExp(`^${expected}-[0-9a-f]{4}$`));
  });

  it("cuts a long name so the slug fits the database column", () => {
    const slug = makeHostSlug("Ѓорѓи Љубен Његош Ќиро Џон Ѕвезда Шаренко");

    expect(slug.startsWith("gjorgji-ljuben-njegosh-kjiro-dzhon-")).toBe(true);
    expect(slug.length).toBeLessThanOrEqual(45);
  });

  it("only produces URL-safe characters, whatever the input", () => {
    for (const name of ["  Мајстор!!  ", "O'Brien & Sons", "A/B\\C", "名前", "<script>alert(1)</script>", "x".repeat(300)]) {
      expect(makeHostSlug(name)).toMatch(SLUG);
    }
  });

  it("falls back to a default when nothing usable is left", () => {
    expect(makeHostSlug("名前")).toMatch(/^domakin-[0-9a-f]{4}$/);
    expect(makeHostSlug("   ")).toMatch(/^domakin-[0-9a-f]{4}$/);
  });

  it("stays short enough for the database column (80)", () => {
    expect(makeHostSlug("м".repeat(500)).length).toBeLessThanOrEqual(80);
  });

  it("never returns a slug that is already taken", () => {
    const first = makeHostSlug("Ана");
    const taken = new Set([first]);

    for (let i = 0; i < 200; i++) expect(taken.has(makeHostSlug("Ана", taken))).toBe(false);
  });
});
