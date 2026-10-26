import { describe, expect, it } from "vitest";
import { uuidv7 } from "./ids.mjs";

const UUID_V7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("uuidv7", () => {
  it("has the UUID version 7 format", () => {
    expect(uuidv7()).toMatch(UUID_V7);
  });

  it("starts with the time in milliseconds", () => {
    const time = Date.UTC(2026, 9, 19, 12, 30, 15, 123);
    const id = uuidv7(time);

    const timePart = id.slice(0, 13).replace("-", ""); // првите 12 hex знаци
    expect(timePart).toBe(time.toString(16).padStart(12, "0"));
  });

  it("sorts by time", () => {
    const earlier = uuidv7(1_700_000_000_000);
    const later = uuidv7(1_800_000_000_000);

    expect(earlier < later).toBe(true);
  });

  it("does not repeat", () => {
    const ids = new Set(Array.from({ length: 5000 }, () => uuidv7()));

    expect(ids.size).toBe(5000);
  });
});
