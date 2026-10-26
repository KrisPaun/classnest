import { describe, expect, it } from "vitest";
import { formatMinutes } from "./format";

describe("formatMinutes", () => {
  it("shows short durations in minutes", () => {
    expect(formatMinutes(45)).toBe("45 мин.");
  });

  it("shows hours with a decimal comma", () => {
    expect(formatMinutes(60)).toBe("1 ч.");
    expect(formatMinutes(90)).toBe("1,5 ч.");
    expect(formatMinutes(180)).toBe("3 ч.");
    expect(formatMinutes(100)).toBe("1,67 ч.");
  });
});
