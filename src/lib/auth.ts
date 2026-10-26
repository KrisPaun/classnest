import { cache } from "react";
import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { endSession, isAdmin, resolveSession, startSession } from "@/server/modules/identity/service";
import type { Account } from "@/server/modules/identity/types";
import { isDatabaseConfigured } from "@/server/platform/config";

// Тенок слој околу модулот за идентитет: само колачиња и барања. Правилата се во server/modules/identity.

const COOKIE = "cn_session";

export type { Account };

export async function createSession(accountId: string) {
  const h = await headers();
  const { token, expiresAt } = await startSession(accountId, {
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim(),
    userAgent: h.get("user-agent") ?? undefined,
  });

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

/** Најавената сметка или null. Ако базата не одговара, фрла грешка (за заштитени страници). */
export const getAccount = cache(async (): Promise<Account | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  return resolveSession(token);
});

/**
 * Како getAccount, но никогаш не фрла грешка: ако базата не е подесена или не одговара, враќа null.
 * Се користи за јавните страници и заглавието, за да не падне целиот сајт кога базата е недостапна.
 */
export async function getAccountSafe(): Promise<Account | null> {
  if (!isDatabaseConfigured()) return null;
  try {
    return await getAccount();
  } catch {
    return null;
  }
}

export async function requireAccount(): Promise<Account> {
  const account = await getAccount();
  if (!account) redirect("/host/login");
  return account;
}

/** Најавен администратор или null. За API: секое барање се проверува одново на серверот. */
export async function getAdmin(): Promise<Account | null> {
  const account = await getAccount();
  return account && (await isAdmin(account.id)) ? account : null;
}

/** За админ страниците: без најава води на најава, а за сметка без улога „не постои“ (404, не откриваме дека има админ). */
export async function requireAdmin(): Promise<Account> {
  const account = await requireAccount();
  if (!(await isAdmin(account.id))) notFound();
  return account;
}

/** За заглавието: не фрла грешка ако базата не одговара. */
export async function isAdminSafe(account: Account | null): Promise<boolean> {
  if (!account) return false;
  try {
    return await isAdmin(account.id);
  } catch {
    return false;
  }
}

export async function destroySession() {
  const jar = await cookies();
  await endSession(jar.get(COOKIE)?.value);
  jar.delete(COOKIE);
}

/** CSRF заштита за барања што менуваат состојба: Origin мора да е ист со Host. */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
