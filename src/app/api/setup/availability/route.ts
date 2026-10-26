import { revalidatePath } from "next/cache";
import { getAccount, sameOrigin } from "@/lib/auth";
import { parseAvailability } from "@/lib/availability";
import { saveAvailability } from "@/server/modules/listings/service";

const fail = (error: string, status = 400) => Response.json({ error }, { status });

/** Чекор 3: достапност за термини по барање на првото искуство. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("Недозволено барање.", 403);
  const account = await getAccount();
  if (!account) return fail("Најавете се.", 401);

  const parsed = parseAvailability(await req.json().catch(() => null));
  if ("error" in parsed) return fail(parsed.error);

  const saved = await saveAvailability(account.hostSlug, parsed.value);
  if (!saved) return fail("Прво додадете искуство (чекор 2).", 403);

  revalidatePath("/", "layout");
  return Response.json({ ok: true });
}
