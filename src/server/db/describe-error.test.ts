import { describe, expect, it } from "vitest";
import { describeDbError } from "./describe-error.mjs";

/** Како што ја прави Drizzle: надворешна грешка „Failed query“, а вистинската е во cause. */
const wrapped = (cause: Record<string, unknown>) =>
  Object.assign(new Error("Failed query: create table x (a int)\n\nparams: secret-param"), { cause });

describe("describeDbError", () => {
  it("shows the real cause, not the Drizzle wrapper", () => {
    const text = describeDbError(wrapped({ code: "ECONNREFUSED", message: "connect ECONNREFUSED 127.0.0.1:3306" }));

    expect(text).toContain("ECONNREFUSED");
    expect(text).toContain("127.0.0.1:3306");
    expect(text).not.toContain("Failed query");
  });

  it("adds a hint in Macedonian for common problems", () => {
    expect(describeDbError(wrapped({ code: "ECONNREFUSED", message: "x" }))).toContain("npm run db:up");
    expect(describeDbError(wrapped({ code: "ER_ACCESS_DENIED_ERROR", sqlMessage: "Access denied" }))).toContain(
      "лозинка",
    );
    expect(describeDbError(wrapped({ code: "ER_BAD_DB_ERROR", sqlMessage: "Unknown database" }))).toContain("не постои");
  });

  it("prefers the message from the database (sqlMessage)", () => {
    const text = describeDbError(wrapped({ code: "ER_CHECK_CONSTRAINT_VIOLATED", sqlMessage: "Check constraint 'x' is violated." }));

    expect(text).toContain("Check constraint 'x' is violated.");
  });

  it("follows a chain of causes down to the root", () => {
    const deep = { cause: { cause: { code: "ETIMEDOUT", message: "connect ETIMEDOUT" } } };

    expect(describeDbError(deep)).toContain("ETIMEDOUT");
  });

  it("never prints query parameters or the query text", () => {
    const onlyWrapper = Object.assign(new Error("Failed query: insert into t values (?)\n\nparams: SuperSecret123"), {});
    const text = describeDbError(onlyWrapper);

    expect(text).not.toContain("SuperSecret123");
    expect(text).not.toContain("insert into");
  });

  it("copes with values that are not errors", () => {
    expect(describeDbError(undefined)).toBe("непозната грешка");
    expect(describeDbError("text")).toBe("непозната грешка");
  });
});
