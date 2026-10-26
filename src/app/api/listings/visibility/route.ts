import { revalidatePath } from "next/cache";
import { getAccount, sameOrigin } from "@/lib/auth";
import { setVisibility } from "@/server/modules/listings/service";
import type { ListingVisibility } from "@/server/modules/listings/types";

const MODES: ListingVisibility[] = ["active", "temporary", "permanent"];

const fail = (error: string, status = 400) => Response.json({ error }, { status });

/** Скриј или прикажи ја понудата на најавениот домаќин. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("Недозволено барање.", 403);
  const account = await getAccount();
  if (!account) return fail("Најавете се.", 401);

  const body = await req.json().catch(() => null);
  const mode = String(body?.mode ?? "") as ListingVisibility;
  if (!MODES.includes(mode)) return fail("Невалиден избор.");

  const result = await setVisibility(account.hostSlug, mode);
  if (result === "not-found") return fail("Понудата не е пронајдена.", 404);
  if (result === "locked") return fail("Оваа понуда е симната од Classnest. Контактирајте не.", 403);

  revalidatePath("/", "layout");
  return Response.json({ ok: true });
}
