import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Account, mutate, readDb } from "./db";

const COOKIE = "cn_session";
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Во базата се чува само хеш на токенот, па протекена база не дава валидни сесии.
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createSession(accountId: string) {
  const token = randomBytes(32).toString("hex");
  await mutate((db) => {
    const now = Date.now();
    db.sessions = db.sessions.filter((s) => s.expiresAt > now);
    db.sessions.push({ tokenHash: hashToken(token), accountId, expiresAt: now + TTL_MS });
  });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TTL_MS / 1000,
  });
}

export async function getAccount(): Promise<Account | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const db = await readDb();
  const hash = hashToken(token);
  const session = db.sessions.find((s) => s.tokenHash === hash && s.expiresAt > Date.now());
  if (!session) return null;
  return db.accounts.find((a) => a.id === session.accountId) ?? null;
}

export async function requireAccount(): Promise<Account> {
  const account = await getAccount();
  if (!account) redirect("/host/login");
  return account;
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    const hash = hashToken(token);
    await mutate((db) => {
      db.sessions = db.sessions.filter((s) => s.tokenHash !== hash);
    });
  }
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
