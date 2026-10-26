import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/mysql2/migrator";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { hashSessionToken, newSessionToken } from "./tokens";
import { EmailTakenError } from "./types";

// Интеграциски тестови со вистинска MySQL (види db.integration.test.ts за како се вклучуваат).
const testUrl = process.env.TEST_DATABASE_URL;

const unique = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const newEmail = () => `${unique("test")}@example.com`;
const PASSWORD = "dobra-lozinka-123";

describe.skipIf(!testUrl)("identity module (real MySQL)", () => {
  let client: typeof import("../../db/client");
  let schema: typeof import("../../db/schema");
  let service: typeof import("./service");
  let repo: typeof import("./repo");
  const createdIds: string[] = [];

  /** Креира сметка и ја запишува за чистење по тестот. */
  const makeAccount = async (overrides: Partial<Parameters<typeof service.registerAccount>[0]> = {}) => {
    const account = await service.registerAccount({
      email: newEmail(),
      fullName: "Тест Домаќин",
      password: PASSWORD,
      ...overrides,
    });
    createdIds.push(account.id);
    return account;
  };

  beforeAll(async () => {
    process.env.DATABASE_URL = testUrl;
    client = await import("../../db/client");
    schema = await import("../../db/schema");
    service = await import("./service");
    repo = await import("./repo");
    await migrate(client.getDb(), { migrationsFolder: "drizzle" });
  });

  afterAll(async () => {
    for (const id of createdIds) await repo.deleteAccountById(id); // ги брише и улогите и сесиите (cascade)
    await client.closeDb();
  });

  it("registers an account with the HOST role and a hashed password", async () => {
    const account = await makeAccount({ email: "  Ana.Test@Example.COM ".replace("Ana.Test", unique("ana")) });

    expect(account.email).toBe(account.email.toLowerCase());
    expect(account.name).toBe("Тест Домаќин"); // кирилицата се чува правилно

    const [row] = await client.getDb().select().from(schema.accounts).where(eq(schema.accounts.id, account.id));
    expect(row.passwordHash.startsWith("scrypt$")).toBe(true);
    expect(row.passwordHash).not.toContain(PASSWORD);

    const roles = await client.getDb().select().from(schema.accountRoles).where(eq(schema.accountRoles.accountId, account.id));
    expect(roles.map((r) => r.role)).toEqual(["HOST"]);
  });

  it("rejects a second registration with the same email, even with different capitals", async () => {
    const first = await makeAccount();

    await expect(
      service.registerAccount({ email: first.email.toUpperCase(), fullName: "Друг", password: PASSWORD }),
    ).rejects.toBeInstanceOf(EmailTakenError);
  });

  it("links a legacy host slug and refuses a slug that is already used", async () => {
    const slug = unique("host");
    const account = await makeAccount({ legacyHostSlug: slug });

    expect(account.hostSlug).toBe(slug);
    await expect(
      service.registerAccount({ email: newEmail(), fullName: "Друг", password: PASSWORD, legacyHostSlug: slug }),
    ).rejects.toThrow();
  });

  it("logs in with the right password and refuses a wrong password or an unknown email", async () => {
    const account = await makeAccount();

    expect((await service.authenticate(account.email, PASSWORD))?.id).toBe(account.id);
    expect((await service.authenticate(account.email.toUpperCase(), PASSWORD))?.id).toBe(account.id);
    expect(await service.authenticate(account.email, "pogresna-lozinka")).toBeNull();
    expect(await service.authenticate(newEmail(), PASSWORD)).toBeNull();
  });

  it("stores only the hash of a session token, never the token", async () => {
    const account = await makeAccount();
    const { token } = await service.startSession(account.id, { ip: "203.0.113.7", userAgent: "vitest" });

    const rows = await client.getDb().select().from(schema.authSessions).where(eq(schema.authSessions.accountId, account.id));
    expect(rows).toHaveLength(1);
    expect(rows[0].tokenHash).toBe(hashSessionToken(token));
    expect(JSON.stringify(rows[0])).not.toContain(token);
    expect(rows[0].ip).toBe("203.0.113.7");
  });

  it("resolves a session to its account and stops after logout", async () => {
    const account = await makeAccount();
    const { token } = await service.startSession(account.id);

    expect((await service.resolveSession(token))?.id).toBe(account.id);

    await service.endSession(token);
    expect(await service.resolveSession(token)).toBeNull();
  });

  it("ignores malformed and unknown tokens", async () => {
    expect(await service.resolveSession(undefined)).toBeNull();
    expect(await service.resolveSession("not-a-token")).toBeNull();
    expect(await service.resolveSession(newSessionToken())).toBeNull(); // правилен формат, но непостоечка
  });

  it("ignores an expired session", async () => {
    const account = await makeAccount();
    const token = newSessionToken();
    await repo.insertSession({
      accountId: account.id,
      tokenHash: hashSessionToken(token),
      expiresAt: new Date(Date.now() - 60_000),
    });

    expect(await service.resolveSession(token)).toBeNull();
  });

  it("blocks a suspended account at login and for sessions it already has", async () => {
    const account = await makeAccount();
    const { token } = await service.startSession(account.id);
    expect(await service.resolveSession(token)).not.toBeNull();

    await client.getDb().update(schema.accounts).set({ status: "SUSPENDED" }).where(eq(schema.accounts.id, account.id));

    expect(await service.authenticate(account.email, PASSWORD)).toBeNull();
    expect(await service.resolveSession(token)).toBeNull();
  });

  it("removes roles and sessions together with the account", async () => {
    const account = await makeAccount();
    await service.startSession(account.id);

    await service.removeAccount(account.id);

    const roles = await client.getDb().select().from(schema.accountRoles).where(eq(schema.accountRoles.accountId, account.id));
    const sessions = await client.getDb().select().from(schema.authSessions).where(eq(schema.authSessions.accountId, account.id));
    expect(roles).toHaveLength(0);
    expect(sessions).toHaveLength(0);
  });
});
