import { revalidatePath } from "next/cache";
import { getAccount, sameOrigin } from "@/lib/auth";
import { mutate } from "@/lib/db";
import { avatarKey, deletePhoto, listPhotos, prepareImages, savePhotos } from "@/lib/photos";
import { normalizeSocial, normalizeStart, normalizeWebsite } from "@/lib/validation";

const MIN_STORY = 50;
const MAX_STORY = 2000;

const fail = (error: string, status = 400) => Response.json({ error }, { status });

/** Чекор 1 од поставувањето: профилна фотографија (по желба) + приказна. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("Недозволено барање.", 403);
  const account = await getAccount();
  if (!account) return fail("Најавете се.", 401);

  const form = await req.formData();
  const story = String(form.get("story") ?? "").trim();
  if (story.length < MIN_STORY) return fail(`Приказната е прекратка. Напишете најмалку ${MIN_STORY} знаци.`);
  if (story.length > MAX_STORY) return fail(`Приказната е предолга (максимум ${MAX_STORY} знаци).`);

  const text = (k: string) => String(form.get(k) ?? "").trim();

  // Дополнителни полиња (по желба). Празно значи „отстрани“.
  const websiteRaw = text("website");
  const website = websiteRaw ? normalizeWebsite(websiteRaw) : undefined;
  if (websiteRaw && !website) return fail("Веб-страницата не е валиден линк, на пр. www.vasha-stranica.mk.");

  const instagramRaw = text("instagram");
  const instagram = instagramRaw ? normalizeSocial(instagramRaw, ["instagram.com"]) : undefined;
  if (instagramRaw && !instagram) return fail("Внесете линк од Instagram, на пр. instagram.com/vashata.rabotilnica.");

  const facebookRaw = text("facebook");
  const facebook = facebookRaw ? normalizeSocial(facebookRaw, ["facebook.com", "fb.com"]) : undefined;
  if (facebookRaw && !facebook) return fail("Внесете линк од Facebook, на пр. facebook.com/vashata.rabotilnica.");

  const monthRaw = text("startedMonth");
  const yearRaw = text("startedYear");
  let started: { month: number; year: number } | undefined;
  if (monthRaw || yearRaw) {
    const parsed = normalizeStart(monthRaw, yearRaw);
    if (!parsed) return fail("Изберете валиден месец и година кога е започнат бизнисот (не во иднина).");
    started = parsed;
  }

  const avatar = form.get("avatar");
  let prepared: Awaited<ReturnType<typeof prepareImages>> | null = null;
  if (avatar instanceof File && avatar.size > 0) {
    prepared = await prepareImages([avatar], 0, 1);
    if ("error" in prepared) return fail(prepared.error);
  }

  const saved = await mutate((db) => {
    const host = db.hosts.find((h) => h.slug === account.hostSlug);
    if (!host) return false;
    host.story = story;
    host.profileCompletedAt ??= new Date().toISOString();
    host.website = website ?? undefined;
    host.instagram = instagram ?? undefined;
    host.facebook = facebook ?? undefined;
    host.startedMonth = started?.month;
    host.startedYear = started?.year;
    return true;
  });
  if (!saved) return fail("Овој профил не може да се менува.", 403);

  if (prepared && "items" in prepared) {
    const key = avatarKey(account.hostSlug);
    const old = await listPhotos(key);
    await savePhotos(key, prepared.items); // прво новата, па старите (при грешка не остануваме без слика)
    for (const name of old) await deletePhoto(key, name);
  }

  revalidatePath("/", "layout");
  return Response.json({ ok: true });
}
