import { DUMMY_HASH, hashPassword, verifyPassword } from "@/lib/password.mjs";
import * as repo from "./repo";
import { SESSION_TTL_MS, hashSessionToken, isValidSessionToken, newSessionToken } from "./tokens";
import type { Account } from "./types";

// Деловни правила за идентитет. Не знае ништо за Next.js (колачиња, барања): затоа се тестира директно.

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

/** Креира сметка. Фрла EmailTakenError ако е-поштата веќе постои. */
export async function registerAccount(input: {
  email: string;
  fullName: string;
  password: string;
  legacyHostSlug?: string;
  role?: "HOST" | "GUEST" | "ADMIN";
}): Promise<Account> {
  const passwordHash = await hashPassword(input.password);
  return repo.insertAccount({
    email: normalizeEmail(input.email),
    fullName: input.fullName.trim(),
    passwordHash,
    legacyHostSlug: input.legacyHostSlug,
    role: input.role ?? "HOST",
  });
}

/**
 * Проверка на е-пошта и лозинка. Враќа сметка или null.
 * Проверката на лозинката се извршува секогаш (и за непостоечка е-пошта), за да трае исто.
 */
export async function authenticate(email: string, password: string): Promise<Account | null> {
  const found = await repo.findCredentialsByEmail(normalizeEmail(email));
  const passwordOk = await verifyPassword(password, found?.passwordHash ?? DUMMY_HASH);
  if (!found || !passwordOk || found.status !== "ACTIVE") return null;

  await repo.touchLogin(found.account.id, new Date());
  return found.account;
}

/** Создава сесија. Го враќа токенот што оди во колаче, а во базата се чува само неговиот хеш. */
export async function startSession(
  accountId: string,
  meta: { ip?: string; userAgent?: string } = {},
): Promise<{ token: string; expiresAt: Date }> {
  const token = newSessionToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);

  await repo.deleteExpiredSessions(now); // чистење по пат, без посебна работа
  await repo.insertSession({ accountId, tokenHash: hashSessionToken(token), expiresAt, ...meta });
  return { token, expiresAt };
}

const TOUCH_AFTER_MS = 5 * 60 * 1000; // „последно виден“ се освежува најмногу на 5 минути

/** Сметката за токен од колаче, или null ако е погрешен, истечен или сметката не е активна. */
export async function resolveSession(token: unknown): Promise<Account | null> {
  if (!isValidSessionToken(token)) return null;

  const now = new Date();
  const found = await repo.findSessionAccount(hashSessionToken(token), now);
  if (!found || found.status !== "ACTIVE") return null;

  if (now.getTime() - found.lastSeenAt.getTime() > TOUCH_AFTER_MS) {
    await repo.touchSession(found.sessionId, now);
  }
  return found.account;
}

export async function endSession(token: unknown): Promise<void> {
  if (!isValidSessionToken(token)) return;
  await repo.deleteSessionByHash(hashSessionToken(token));
}

/** „Враќање назад“ при регистрација, ако следниот чекор не успее. */
export const removeAccount = repo.deleteAccountById;

/** Администратор е само сметка со улогата ADMIN (се доделува исклучиво преку `npm run admin:role`). */
export const isAdmin = (accountId: string) => repo.hasRole(accountId, "ADMIN");
