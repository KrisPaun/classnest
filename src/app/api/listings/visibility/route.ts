import { revalidatePath } from "next/cache";
import { getAccount, sameOrigin } from "@/lib/auth";
import { mutate } from "@/lib/db";

const MODES = ["active", "temporary", "permanent"] as const;
type Mode = (typeof MODES)[number];

const fail = (error: string, status = 400) => Response.json({ error }, { status });

/** Скриј или прикажи ја понудата на најавениот домаќин. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("Недозволено барање.", 403);
  const account = await getAccount();
  if (!account) return fail("Најавете се.", 401);

  const body = await req.json().catch(() => null);
  const mode = String(body?.mode ?? "") as Mode;
  if (!MODES.includes(mode)) return fail("Невалиден избор.");

  const saved = await mutate((db) => {
    const experience = db.experiences.find((e) => e.hostSlug === account.hostSlug);
    if (!experience) return false;
    experience.visibility = mode;
    experience.updatedAt = new Date().toISOString();
    return true;
  });
  if (!saved) return fail("Понудата не е пронајдена.", 404);

  revalidatePath("/", "layout");
  return Response.json({ ok: true });
}
