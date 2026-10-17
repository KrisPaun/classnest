import { createSession, sameOrigin } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { DUMMY_HASH, verifyPassword } from "@/lib/password.mjs";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const fail = (error: string, status = 400) => Response.json({ error }, { status });

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("Недозволено барање.", 403);

  const body = await req.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");
  if (!email || !password || email.length > 254 || password.length > 128) {
    return fail("Внесете е-пошта и лозинка.");
  }

  if (!rateLimit(`login:${clientIp(req)}:${email}`, 8, 15 * 60 * 1000)) {
    return fail("Премногу обиди. Обидете се за 15 минути.", 429);
  }

  const db = await readDb();
  const account = db.accounts.find((a) => a.email === email);
  // Проверката се извршува секогаш (и за непостоечки корисник) за да трае исто.
  const ok = await verifyPassword(password, account?.passwordHash ?? DUMMY_HASH);
  if (!account || !ok) return fail("Погрешна е-пошта или лозинка.", 401);

  await createSession(account.id);
  return Response.json({ ok: true });
}
