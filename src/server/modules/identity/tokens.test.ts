import { describe, expect, it } from "vitest";
import { hashSessionToken, isValidSessionToken, newSessionToken } from "./tokens";

describe("session tokens", () => {
  it("creates a 64-character hex token that is never repeated", () => {
    const tokens = new Set(Array.from({ length: 1000 }, () => newSessionToken()));

    expect(tokens.size).toBe(1000);
    for (const token of tokens) expect(isValidSessionToken(token)).toBe(true);
  });

  it("hashes to a stable 64-character value that does not contain the token", () => {
    const token = newSessionToken();
    const hash = hashSessionToken(token);

    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hashSessionToken(token)).toBe(hash);
    expect(hash).not.toBe(token);
    expect(hash).not.toContain(token);
  });

  it.each([undefined, null, "", "abc", "g".repeat(64), "A".repeat(64), "a".repeat(63), "a".repeat(65), 12345])(
    "rejects the invalid token %s",
    (value) => {
      expect(isValidSessionToken(value)).toBe(false);
    },
  );
});
