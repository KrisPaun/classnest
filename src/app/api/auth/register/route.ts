import { revalidatePath } from "next/cache";
import { categories, cities } from "@/data/reference";
import { createSession, sameOrigin } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { encryptSecret, secretBoxConfigured } from "@/lib/secret-box.mjs";
import { normalizePhone, normalizeWebsite } from "@/lib/validation";
import { createHost } from "@/server/modules/hosts/service";
import { UnknownReferenceError } from "@/server/modules/hosts/types";
import { registerAccount, removeAccount } from "@/server/modules/identity/service";
import { EmailTakenError } from "@/server/modules/identity/types";

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
  if (phone && !secretBoxConfigured()) {
    return fail("Серверот не е конфигуриран за безбедно чување на телефон (BANK_DATA_KEY).", 500);
  }

  try {
    // 1) Сметката. Единствената е-пошта ја гарантира базата (уникатен индекс).
    let account;
    try {
      account = await registerAccount({ email, fullName: name, password, role: "HOST" });
    } catch (error) {
      if (error instanceof EmailTakenError) return fail("Веќе постои профил со оваа е-пошта. Најавете се.", 409);
      throw error;
    }

    // 2) Профилот на домаќинот. Ако не успее, ја бришеме сметката за да не остане сметка без профил.
    try {
      await createHost({
        accountId: account.id,
        name,
        citySlug: city,
        categorySlug: category || undefined,
        about,
        businessName: businessName || undefined,
        website: website || undefined,
        phoneEnc: phone ? encryptSecret(phone) : undefined,
      });
    } catch (error) {
      await removeAccount(account.id);
      if (error instanceof UnknownReferenceError) {
        console.error("register failed:", error.message);
        return fail("Базата не е подготвена (недостасуваат градови). Извршете „npm run db:seed“.", 500);
      }
      throw error;
    }

    await createSession(account.id);
    revalidatePath("/", "layout");
    return Response.json({ ok: true });
  } catch (error) {
    console.error("register failed:", error instanceof Error ? error.message : "unknown error");
    return fail("Регистрацијата не успеа. Обидете се повторно.", 500);
  }
}
