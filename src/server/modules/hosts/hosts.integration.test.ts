import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { seedReference } from "../../db/seed.mjs";
import { HostExistsError, UnknownReferenceError, type HostRecord } from "./types";

// Интеграциски тестови со вистинска MySQL (види db.integration.test.ts за како се вклучуваат).
const testUrl = process.env.TEST_DATABASE_URL;

const unique = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const PHONE_CIPHERTEXT = "v1.AAAAAAAAAAAAAAAA.BBBBBBBBBBBBBBBBBBBBBB==.CCCCCCCC"; // само за тест, не е вистинско шифрирање

const payoutInput = (overrides: Record<string, unknown> = {}) => ({
  bank: { bankName: "Тест банка", holder: "Ана Тестовска", ibanEnc: "v1.iban.cipher.text", ibanLast4: "8984" },
  tradingName: "Керамичарска работилница",
  taxNumber: "1234567890123",
  vatRegistered: false,
  onePublicBookingAtATime: true,
  allowSelfServiceChanges: false,
  allowPromoUse: true,
  payoutFrequency: "monthly" as const,
  ...overrides,
});

describe.skipIf(!testUrl)("hosts module (real MySQL)", () => {
  let client: typeof import("../../db/client");
  let schema: typeof import("../../db/schema");
  let hostService: typeof import("./service");
  let identity: typeof import("../identity/service");
  let pool: mysql.Pool;
  const created: { hostId?: string; accountId: string }[] = [];

  const makeHost = async (overrides: Partial<Parameters<typeof hostService.createHost>[0]> = {}) => {
    const account = await identity.registerAccount({
      email: `${unique("host")}@example.com`,
      fullName: "Ана Тестовска",
      password: "dobra-lozinka-123",
    });
    const entry: { hostId?: string; accountId: string } = { accountId: account.id };
    created.push(entry);

    const host = await hostService.createHost({
      accountId: account.id,
      name: "Ана Тестовска",
      citySlug: "skopje",
      about: "Предавам керамика веќе десет години.",
      ...overrides,
    });
    entry.hostId = host.id;
    return { account, host };
  };

  beforeAll(async () => {
    process.env.DATABASE_URL = testUrl;
    client = await import("../../db/client");
    schema = await import("../../db/schema");
    hostService = await import("./service");
    identity = await import("../identity/service");
    pool = mysql.createPool({ uri: testUrl!, connectionLimit: 2, charset: "utf8mb4", timezone: "Z" });
    await migrate(client.getDb(), { migrationsFolder: "drizzle" });
    await seedReference(pool); // градовите мора да постојат (hosts.city_id е надворешен клуч)
  });

  afterAll(async () => {
    for (const { hostId, accountId } of created) {
      if (hostId) await hostService.removeHost(hostId); // ги брише и приватните табели (cascade)
      await identity.removeAccount(accountId);
    }
    await pool.end();
    await client.closeDb();
  });

  it("creates a host linked to the account, with a generated slug and the city resolved", async () => {
    const { account, host } = await makeHost();

    expect(host.accountId).toBe(account.id);
    expect(host.slug).toMatch(/^ana-testovska-[0-9a-f]{4}$/);
    expect(host.city).toBe("skopje");
    expect(host.about).toContain("керамика");
    expect(host.profileCompletedAt).toBeUndefined();
  });

  it("allows only one host profile per account", async () => {
    const { account } = await makeHost();

    await expect(
      hostService.createHost({ accountId: account.id, name: "Друг", citySlug: "ohrid", about: "Друг опис на профилот." }),
    ).rejects.toBeInstanceOf(HostExistsError);
  });

  it("rejects an unknown city or category", async () => {
    const account = await identity.registerAccount({
      email: `${unique("ref")}@example.com`,
      fullName: "Тест",
      password: "dobra-lozinka-123",
    });
    created.push({ accountId: account.id });

    await expect(
      hostService.createHost({ accountId: account.id, name: "Тест", citySlug: "atlantis", about: "Опис на профилот." }),
    ).rejects.toBeInstanceOf(UnknownReferenceError);
    await expect(
      hostService.createHost({
        accountId: account.id,
        name: "Тест",
        citySlug: "skopje",
        categorySlug: "nema-takva",
        about: "Опис на профилот.",
      }),
    ).rejects.toBeInstanceOf(UnknownReferenceError);
  });

  it("keeps the phone only in the private table, and never in the public view", async () => {
    const { host } = await makeHost({ phoneEnc: PHONE_CIPHERTEXT });

    const [priv] = await client.getDb().select().from(schema.hostPrivateDetails).where(eq(schema.hostPrivateDetails.hostId, host.id));
    expect(priv.phoneEnc).toBe(PHONE_CIPHERTEXT);

    const publicHost = (await hostService.getPublicHost(host.slug)) as HostRecord;
    expect(publicHost.payout).toBeUndefined();
    expect(JSON.stringify(publicHost)).not.toContain(PHONE_CIPHERTEXT);
    expect(JSON.stringify(await hostService.listPublicHosts())).not.toContain(PHONE_CIPHERTEXT);
  });

  it("completes the profile once and keeps the first completion time", async () => {
    const { host } = await makeHost();

    expect(await hostService.completeProfile(host.slug, { story: "Првата приказна.", website: "https://ana.mk/" })).toBe(true);
    const first = await hostService.getPublicHost(host.slug);
    expect(first?.story).toBe("Првата приказна.");
    expect(first?.website).toBe("https://ana.mk/");
    expect(first?.profileCompletedAt).toBeInstanceOf(Date);

    await hostService.completeProfile(host.slug, { story: "Изменета приказна.", started: { month: 3, year: 2019 } });
    const second = await hostService.getPublicHost(host.slug);
    expect(second?.story).toBe("Изменета приказна.");
    expect(second?.website).toBeUndefined(); // празно значи „отстрани“
    expect([second?.startedMonth, second?.startedYear]).toEqual([3, 2019]);
    expect(second?.profileCompletedAt?.getTime()).toBe(first?.profileCompletedAt?.getTime());
  });

  it("reports false for a host that does not exist", async () => {
    expect(await hostService.completeProfile("nema-takov-domakin", { story: "x" })).toBe(false);
    expect(await hostService.savePayout("nema-takov-domakin", payoutInput())).toBe(false);
  });

  it("saves the payout setup in three tables, keeps the phone, and updates in place", async () => {
    const { host } = await makeHost({ phoneEnc: PHONE_CIPHERTEXT });

    expect(await hostService.getOwnerHost(host.slug).then((h) => h?.payout)).toBeUndefined();

    await hostService.savePayout(host.slug, payoutInput());
    const saved = await hostService.getOwnerHost(host.slug);
    expect(saved?.payout?.bank).toEqual({
      bankName: "Тест банка",
      holder: "Ана Тестовска",
      ibanEnc: "v1.iban.cipher.text",
      ibanLast4: "8984",
    });
    expect(saved?.payout?.taxNumber).toBe("1234567890123");
    expect(saved?.payout?.payoutFrequency).toBe("monthly");
    expect(saved?.payout?.allowPromoUse).toBe(true);

    // втор пат: се менува во место (не се додаваат редови), а телефонот останува
    await hostService.savePayout(host.slug, payoutInput({ tradingName: "Ново име", payoutFrequency: "weekly" }));
    const updated = await hostService.getOwnerHost(host.slug);
    expect(updated?.payout?.tradingName).toBe("Ново име");
    expect(updated?.payout?.payoutFrequency).toBe("weekly");

    const accounts = await client.getDb().select().from(schema.payoutAccounts).where(eq(schema.payoutAccounts.hostId, host.id));
    expect(accounts).toHaveLength(1);
    const [priv] = await client.getDb().select().from(schema.hostPrivateDetails).where(eq(schema.hostPrivateDetails.hostId, host.id));
    expect(priv.phoneEnc).toBe(PHONE_CIPHERTEXT);
  });

  it("clears the date of birth when the host switches to having a tax number", async () => {
    const { host } = await makeHost();

    await hostService.savePayout(host.slug, payoutInput({ taxNumber: undefined, dobEnc: "v1.dob.cipher.text" }));
    expect((await hostService.getOwnerHost(host.slug))?.payout?.dobEnc).toBe("v1.dob.cipher.text");

    await hostService.savePayout(host.slug, payoutInput({ taxNumber: "1234567890123", dobEnc: undefined }));
    expect((await hostService.getOwnerHost(host.slug))?.payout?.dobEnc).toBeUndefined();
  });

  it("removes the private, settings and payout rows together with the host", async () => {
    const { host } = await makeHost({ phoneEnc: PHONE_CIPHERTEXT });
    await hostService.savePayout(host.slug, payoutInput());

    await hostService.removeHost(host.id);

    const db = client.getDb();
    expect(await db.select().from(schema.hostPrivateDetails).where(eq(schema.hostPrivateDetails.hostId, host.id))).toHaveLength(0);
    expect(await db.select().from(schema.hostSettings).where(eq(schema.hostSettings.hostId, host.id))).toHaveLength(0);
    expect(await db.select().from(schema.payoutAccounts).where(eq(schema.payoutAccounts.hostId, host.id))).toHaveLength(0);
  });

  it("resolves the host slug for a logged-in account through hosts.account_id", async () => {
    const { account, host } = await makeHost();
    const { token } = await identity.startSession(account.id);

    const resolved = await identity.resolveSession(token);

    expect(resolved?.hostSlug).toBe(host.slug);
  });

  it("lists active hosts and hides suspended ones", async () => {
    const { host } = await makeHost();
    expect((await hostService.listPublicHosts()).map((h) => h.slug)).toContain(host.slug);

    await client.getDb().update(schema.hosts).set({ status: "SUSPENDED" }).where(eq(schema.hosts.id, host.id));

    expect((await hostService.listPublicHosts()).map((h) => h.slug)).not.toContain(host.slug);
  });
});
