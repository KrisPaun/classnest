import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { categories, cities } from "@/data/classes";
import { hosts } from "@/data/hosts";
import { createSession, sameOrigin } from "@/lib/auth";
import { mutate } from "@/lib/db";
import { makeHostSlug } from "@/lib/host-directory";
import { hashPassword } from "@/lib/password.mjs";
import { MAX_REGISTER_PHOTOS, hostPhotoKey, prepareImages, savePhotos } from "@/lib/photos";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { normalizePhone, normalizeWebsite } from "@/lib/validation";

const fail = (error: string, status = 400) => Response.json({ error }, { status });
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("Недозволено барање.", 403);
  if (!rateLimit(`register:${clientIp(req)}`, 5, 60 * 60 * 1000)) {
    return fail("Премногу обиди. Обидете се подоцна.", 429);
  }

  const form = await req.formData();
  const text = (k: string) => String(form.get(k) ?? "").trim();

  const name = text("name");
  const email = text("email").toLowerCase();
  const password = String(form.get("password") ?? "");
  const city = text("city");
  const about = text("about");
  // Формата повеќе не бара категорија, но ако се испрати, мора да е позната.
  const category = text("category");

  if (name.length < 2 || name.length > 80) return fail("Внесете име (2–80 знаци).");
  if (email.length > 254 || !EMAIL_RE.test(email)) return fail("Внесете валидна е-пошта.");
  if (password.length < 8 || password.length > 128) return fail("Лозинката мора да има најмалку 8 знаци.");
  if (!cities.some((c) => c.slug === city)) return fail("Изберете град.");
  if (category && !categories.some((c) => c.slug === category)) return fail("Непозната категорија.");
  if (about.length < 20 || about.length > 1000) return fail("Опишете што би предавале (20–1000 знаци).");

  // Дополнителни полиња (по желба): се испраќаат само ако е штиклирано.
  const businessName = text("businessName");
  if (businessName.length > 100) return fail("Името на бизнисот е предолго (максимум 100 знаци).");

  const websiteRaw = text("website");
  const website = websiteRaw ? normalizeWebsite(websiteRaw) : undefined;
  if (websiteRaw && !website) return fail("Внесете валиден линк, на пр. instagram.com/vashata.rabotilnica.");

  const phoneRaw = text("phone");
  const phone = phoneRaw ? normalizePhone(phoneRaw) : undefined;
  if (phoneRaw && !phone) return fail("Внесете валиден телефон, на пр. +389 70 123 456.");

  const files = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  let prepared: Awaited<ReturnType<typeof prepareImages>> | null = null;
  if (files.length > 0) {
    prepared = await prepareImages(files, 0, MAX_REGISTER_PHOTOS);
    if ("error" in prepared) return fail(prepared.error);
  }

  const passwordHash = await hashPassword(password);

  const created = await mutate((db) => {
    if (db.accounts.some((a) => a.email === email)) return null;
    const taken = new Set([...hosts.map((h) => h.slug), ...db.hosts.map((h) => h.slug)]);
    const slug = makeHostSlug(name, taken);
    const account = {
      id: randomUUID(),
      email,
      name,
      passwordHash,
      hostSlug: slug,
      ...(phone ? { phone } : {}),
      createdAt: new Date().toISOString(),
    };
    db.accounts.push(account);
    db.hosts.push({
      slug,
      name,
      city,
      ...(category ? { category } : {}),
      about,
      ...(businessName ? { businessName } : {}),
      ...(website ? { website } : {}),
      createdAt: account.createdAt,
    });
    return account;
  });
  if (!created) return fail("Веќе постои профил со оваа е-пошта. Најавете се.", 409);

  if (prepared && "items" in prepared) await savePhotos(hostPhotoKey(created.hostSlug), prepared.items);
  await createSession(created.id);
  revalidatePath("/", "layout");
  return Response.json({ ok: true });
}
