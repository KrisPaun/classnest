import { describe, expect, it } from "vitest";
import { containsPattern, escapeLike } from "./sql";

describe("LIKE helpers", () => {
  it("escapes the wildcard characters so a visitor cannot search with them", () => {
    expect(escapeLike("100%")).toBe("100\\%");
    expect(escapeLike("a_b")).toBe("a\\_b");
    expect(escapeLike("a\\b")).toBe("a\\\\b");
    expect(escapeLike("%_\\")).toBe("\\%\\_\\\\");
  });

  it("leaves normal text, including Cyrillic, unchanged", () => {
    expect(escapeLike("домашна паста")).toBe("домашна паста");
  });

  it("builds a contains pattern and trims spaces", () => {
    expect(containsPattern("  паста ")).toBe("%паста%");
    expect(containsPattern("50%")).toBe("%50\\%%");
  });
});
