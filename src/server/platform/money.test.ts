import { describe, expect, it } from "vitest";
import { fromMinor, toMinor } from "./money";

describe("money", () => {
  it("converts whole denars to minor units and back", () => {
    expect(toMinor(1500)).toBe(150000);
    expect(fromMinor(150000)).toBe(1500);
    expect(fromMinor(toMinor(1_000_000))).toBe(1_000_000);
  });

  it("allows zero", () => {
    expect(toMinor(0)).toBe(0);
  });

  it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER])("rejects %s", (value) => {
    expect(() => toMinor(value)).toThrow();
  });

  it("rounds amounts that are not exact multiples", () => {
    expect(fromMinor(150049)).toBe(1500);
    expect(fromMinor(150050)).toBe(1501);
  });
});
