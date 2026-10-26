import { describe, expect, it } from "vitest";
import { summary } from "./seo";

describe("summary", () => {
  it("collapses whitespace and keeps short text as is", () => {
    expect(summary("  Научете\n\nпаста   на рака ")).toBe("Научете паста на рака");
  });

  it("cuts long text at a word boundary and adds an ellipsis", () => {
    const text = "збор ".repeat(100);
    const out = summary(text, 50);
    expect(out.length).toBeLessThanOrEqual(50);
    expect(out.endsWith("…")).toBe(true);
    expect(out).not.toMatch(/\s…$/);
  });
});
