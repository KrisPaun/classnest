import { revalidatePath } from "next/cache";
import { getAdmin, sameOrigin } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { publishListing, rejectListing, takeDownListing } from "@/server/modules/listings/service";

const fail = (error: string, status = 400) => Response.json({ error }, { status });

const MIN_REASON = 5;
const MAX_REASON = 500;

/** Админ: одобри (или врати), одбиј или симни понуда. Улогата се проверува на серверот при секое барање. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("Недозволено барање.", 403);

  try {
    const admin = await getAdmin();
    if (!admin) return fail("Недозволено.", 403);
    if (!rateLimit(`admin-moderate:${admin.id}`, 60, 60_000)) return fail("Премногу барања. Почекајте малку.", 429);

    const body = await req.json().catch(() => null);
    const slug = String(body?.slug ?? "");
    const action = String(body?.action ?? "");
    const reason = String(body?.reason ?? "").trim();
    if (!slug || slug.length > 100 || !["publish", "reject", "takedown"].includes(action)) return fail("Невалидно барање.");
    if (action !== "publish" && (reason.length < MIN_REASON || reason.length > MAX_REASON)) {
      return fail(`Наведете причина (${MIN_REASON} до ${MAX_REASON} знаци).`);
    }

    const actor = { accountId: admin.id, ip: clientIp(req) };
    const result =
      action === "publish"
        ? await publishListing(slug, { actor })
        : action === "reject"
          ? await rejectListing(slug, { actor, reason })
          : await takeDownListing(slug, { actor, reason });

    if (result === "not-found") return fail("Понудата не е пронајдена.", 404);
    if (result === "wrong-status") return fail("Статусот веќе е променет. Освежете ја страницата.", 409);

    revalidatePath("/", "layout");
    return Response.json({ ok: true });
  } catch (error) {
    console.error("moderation failed:", error instanceof Error ? error.message : "unknown error");
    return fail("Услугата е привремено недостапна. Обидете се повторно.", 503);
  }
}
