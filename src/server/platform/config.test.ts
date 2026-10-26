import { describe, expect, it } from "vitest";
import { loadConfig } from "./config";

const valid = { DATABASE_URL: "mysql://user:pass@127.0.0.1:3306/classnest" };

describe("loadConfig", () => {
  it("accepts a valid MySQL URL and applies defaults", () => {
    const config = loadConfig(valid);

    expect(config.DATABASE_URL).toBe(valid.DATABASE_URL);
    expect(config.DB_POOL_SIZE).toBe(5);
  });

  it("converts the pool size from text to a number", () => {
    expect(loadConfig({ ...valid, DB_POOL_SIZE: "10" }).DB_POOL_SIZE).toBe(10);
  });

  it("rejects a missing DATABASE_URL", () => {
    expect(() => loadConfig({})).toThrow(/DATABASE_URL/);
  });

  it("rejects a URL that is not mysql://", () => {
    expect(() => loadConfig({ DATABASE_URL: "postgres://u:p@h/db" })).toThrow(/mysql:\/\//);
  });

  it.each(["0", "51", "abc", "2.5"])("rejects the invalid pool size %s", (size) => {
    expect(() => loadConfig({ ...valid, DB_POOL_SIZE: size })).toThrow(/DB_POOL_SIZE/);
  });

  it("never puts the password in the error message", () => {
    let message = "";
    try {
      loadConfig({ DATABASE_URL: "postgres://admin:SuperSecret123@host/db" });
    } catch (error) {
      message = (error as Error).message;
    }

    expect(message).not.toBe("");
    expect(message).not.toContain("SuperSecret123");
  });
});
