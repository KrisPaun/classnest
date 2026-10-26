import { describe, expect, it } from "vitest";
import { gradientFor } from "./gradient";

describe("gradientFor", () => {
  it("is stable for the same key", () => {
    expect(gradientFor("nikola-stojanov")).toBe(gradientFor("nikola-stojanov"));
  });

  it("always returns a gradient class", () => {
    for (const key of ["", "a", "ана-димитровска", "x".repeat(200)]) {
      expect(gradientFor(key)).toMatch(/^from-\S+ to-\S+$/);
    }
  });
});
