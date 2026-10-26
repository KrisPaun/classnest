import { createSession, sameOrigin } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { authenticate, normalizeEmail } from "@/server/modules/identity/service";

const fail = (error: string, status = 400) => Response.json({ error }, { status });

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("Недозволено барање.", 403);

  const body = await req.json().catch(() => null);
  const email = normalizeEmail(String(body?.email ?? ""));
  const password = String(body?.password ?? "");
  if (!email || !password || email.length > 254 || password.length > 128) {
    return fail("Внесете е-пошта и лозинка.");
  }

  if (!rateLimit(`login:${clientIp(req)}:${email}`, 8, 15 * 60 * 1000)) {
    return fail("Премногу обиди. Обидете се за 15 минути.", 429);
  }

  try {
    const account = await authenticate(email, password);
    if (!account) return fail("Погрешна е-пошта или лозинка.", 401);

    await createSession(account.id);
    return Response.json({ ok: true });
  } catch (error) {
    // Базата не одговара. Не ги откриваме деталите, само пријавуваме привремена недостапност.
    console.error("login failed:", error instanceof Error ? error.message : "unknown error");
    return fail("Услугата е привремено недостапна. Обидете се повторно.", 503);
  }
}
