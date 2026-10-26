import { and, eq, gt, lt } from "drizzle-orm";
import { getDb } from "../../db/client";
import { isDuplicateKeyError } from "../../db/errors";
import { uuidv7 } from "../../platform/ids.mjs";
import { accountRoles, accounts, authSessions, hosts } from "../../db/schema";
import { Account, EmailTakenError } from "./types";

// Само SQL: сите деловни правила се во service.ts.

type AccountRowLike = {
  id: string;
  email: string;
  fullName: string;
  legacyHostSlug: string | null;
  hostSlug?: string | null; // од табелата hosts (hosts.account_id), ако сметката има профил
  createdAt: Date;
};

// Профилот на домаќинот се наоѓа преку hosts.account_id. legacy_host_slug се користи само за вградените
// демо домаќини (hosts.ts), кои немаат ред во базата.
const toAccount = (row: AccountRowLike): Account => ({
  id: row.id,
  email: row.email,
  name: row.fullName,
  hostSlug: row.hostSlug ?? row.legacyHostSlug ?? "",
  createdAt: row.createdAt,
});

export async function insertAccount(input: {
  email: string;
  fullName: string;
  passwordHash: string;
  legacyHostSlug?: string;
  role: "HOST" | "GUEST" | "ADMIN";
}): Promise<Account> {
  const db = getDb();
  try {
    return await db.transaction(async (tx) => {
      const id = uuidv7();
      await tx.insert(accounts).values({
        id,
        email: input.email,
        fullName: input.fullName,
        passwordHash: input.passwordHash,
        legacyHostSlug: input.legacyHostSlug ?? null,
      });
      await tx.insert(accountRoles).values({ accountId: id, role: input.role });
      const [row] = await tx.select().from(accounts).where(eq(accounts.id, id));
      return toAccount(row);
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) throw new EmailTakenError();
    throw error;
  }
}

export async function findCredentialsByEmail(email: string) {
  const [row] = await getDb().select().from(accounts).where(eq(accounts.email, email)).limit(1);
  return row ? { account: toAccount(row), passwordHash: row.passwordHash, status: row.status } : null;
}

export async function touchLogin(accountId: string, at: Date) {
  await getDb().update(accounts).set({ lastLoginAt: at }).where(eq(accounts.id, accountId));
}

export async function insertSession(input: {
  accountId: string;
  tokenHash: string;
  expiresAt: Date;
  ip?: string;
  userAgent?: string;
}) {
  await getDb()
    .insert(authSessions)
    .values({
      accountId: input.accountId,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
      ip: input.ip?.slice(0, 45) ?? null,
      userAgent: input.userAgent?.slice(0, 255) ?? null,
    });
}

/** Сметката за валидна (неистечена) сесија, заедно со статусот и кога последен пат е виден. */
export async function findSessionAccount(tokenHash: string, now: Date) {
  const [row] = await getDb()
    .select({
      sessionId: authSessions.id,
      lastSeenAt: authSessions.lastSeenAt,
      status: accounts.status,
      id: accounts.id,
      email: accounts.email,
      fullName: accounts.fullName,
      legacyHostSlug: accounts.legacyHostSlug,
      hostSlug: hosts.slug,
      createdAt: accounts.createdAt,
    })
    .from(authSessions)
    .innerJoin(accounts, eq(accounts.id, authSessions.accountId))
    // Само читање: кој е профилот на домаќинот за оваа сметка (еден SQL повик на барање).
    .leftJoin(hosts, eq(hosts.accountId, accounts.id))
    .where(and(eq(authSessions.tokenHash, tokenHash), gt(authSessions.expiresAt, now)))
    .limit(1);

  return row
    ? { account: toAccount(row), status: row.status, sessionId: row.sessionId, lastSeenAt: row.lastSeenAt }
    : null;
}

export async function touchSession(sessionId: string, at: Date) {
  await getDb().update(authSessions).set({ lastSeenAt: at }).where(eq(authSessions.id, sessionId));
}

export async function deleteSessionByHash(tokenHash: string) {
  await getDb().delete(authSessions).where(eq(authSessions.tokenHash, tokenHash));
}

export async function deleteExpiredSessions(now: Date) {
  await getDb().delete(authSessions).where(lt(authSessions.expiresAt, now));
}

/** Се користи за „враќање назад“ ако следниот чекор од регистрацијата не успее. */
export async function deleteAccountById(accountId: string) {
  await getDb().delete(accounts).where(eq(accounts.id, accountId));
}

export async function hasRole(accountId: string, role: "HOST" | "GUEST" | "ADMIN"): Promise<boolean> {
  const [row] = await getDb()
    .select({ role: accountRoles.role })
    .from(accountRoles)
    .where(and(eq(accountRoles.accountId, accountId), eq(accountRoles.role, role)))
    .limit(1);
  return Boolean(row);
}
