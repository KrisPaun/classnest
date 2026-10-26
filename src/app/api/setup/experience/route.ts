import { revalidatePath } from "next/cache";
import { categories, cities } from "@/data/reference";
import {
  CANCELLATION_MODES,
  CancellationMode,
  FULFILMENT,
  Fulfilment,
  getListingType,
} from "@/data/listing-types";
import { getAccount, sameOrigin } from "@/lib/auth";
import { getDynamicHost } from "@/lib/host-directory";
import { experiencePhotoKey, listPhotos, prepareImages, savePhotos } from "@/lib/photos";
import { UnknownReferenceError } from "@/server/modules/hosts/types";
import { getFirstListing, saveListing } from "@/server/modules/listings/service";
import type { ListingInput } from "@/server/modules/listings/types";
import { uuidv7 } from "@/server/platform/ids.mjs";

const MAX_PHOTOS = 12;

const fail = (error: string, status = 400) => Response.json({ error }, { status });

/** Чекор 2: создава (или менува) го првото искуство на домаќинот. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("Недозволено барање.", 403);
  const account = await getAccount();
  if (!account) return fail("Најавете се.", 401);

  const form = await req.formData();
  const text = (k: string) => String(form.get(k) ?? "").trim();
  const num = (k: string) => (text(k) === "" ? NaN : Number(text(k)));

  const listing = getListingType(text("type"));
  if (!listing) return fail("Изберете тип на понуда.");

  const title = text("title");
  if (title.length < 3 || title.length > 100) return fail("Насловот мора да има 3–100 знаци.");

  const category = text("category");
  if (!categories.some((c) => c.slug === category)) return fail("Изберете категорија.");

  const description = text("description");
  if (description.length < 50 || description.length > 2000) {
    return fail("Описот мора да има 50–2000 знаци.");
  }

  const price = num("price");
  if (!Number.isInteger(price) || price < 1 || price > 1_000_000) {
    return fail("Внесете цена во денари (цел број).");
  }

  // Полињата зависат од типот. Непотребните се отфрлаат.
  const extra: Partial<ListingInput> = {};

  if (listing.kind !== "product") {
    // Траење: часови + минути (празно значи 0).
    const wholeOrZero = (k: string) => (text(k) === "" ? 0 : num(k));
    const durH = wholeOrZero("durationHours");
    const durM = wholeOrZero("durationMinutes");
    if (!Number.isInteger(durH) || !Number.isInteger(durM) || durH < 0 || durM < 0 || durM > 59) {
      return fail("Внесете часови и минути (минутите од 0 до 59).");
    }
    const durationMinutes = durH * 60 + durM;
    if (durationMinutes < 15 || durationMinutes > 720) {
      return fail("Траењето мора да е од 15 минути до 12 часа.");
    }
    const maxPeople = num("maxPeople");
    if (!Number.isInteger(maxPeople) || maxPeople < 1 || maxPeople > 100) {
      return fail("Максималниот број луѓе мора да е од 1 до 100.");
    }
    extra.durationMinutes = durationMinutes;
    extra.maxPeople = maxPeople;

    // Политика за откажување и промена на термин (подразбирано: ништо не е дозволено).
    const mode = (text("policyMode") || "none") as CancellationMode;
    if (!CANCELLATION_MODES.includes(mode)) return fail("Непозната политика за откажување.");
    if (mode === "none") {
      extra.cancellation = { mode };
    } else {
      const days = num("policyDays");
      if (!Number.isInteger(days) || days < 1 || days > 60) {
        return fail("Внесете број на денови за откажување (од 1 до 60).");
      }
      extra.cancellation = { mode, days };
    }
  }

  if (listing.kind === "in-person") {
    const city = text("city");
    if (!cities.some((c) => c.slug === city)) return fail("Изберете град.");
    const address = text("address");
    if (address.length < 3 || address.length > 150) return fail("Внесете адреса или локација (3–150 знаци).");
    extra.city = city;
    extra.address = address;
    if (form.get("maskLocation") === "on") extra.maskLocation = true;
  }

  if (listing.kind === "online") {
    const platform = text("platform");
    if (platform.length > 60) return fail("Називот на платформата е предолг.");
    if (platform) extra.platform = platform;
  }

  if (listing.kind === "product") {
    const fulfilment = text("fulfilment") as Fulfilment;
    if (!FULFILMENT.includes(fulfilment)) return fail("Изберете како купувачот го добива производот.");
    extra.fulfilment = fulfilment;
    const city = text("city");
    if (city) {
      if (!cities.some((c) => c.slug === city)) return fail("Непознат град.");
      extra.city = city;
    }
  }

  // Едно прво искуство по домаќин: ако веќе постои, се менува.
  const host = await getDynamicHost(account.hostSlug);
  if (!host) return fail("Овој профил не може да создава искуства.", 403);
  if (!host.profileCompletedAt) return fail("Прво завршете го профилот (чекор 1).", 403);

  const existing = await getFirstListing(account.hostSlug);
  const id = existing?.id ?? uuidv7(); // фотографиите се чуваат под клуч exp-<id>
  const key = experiencePhotoKey(id);

  const files = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  let prepared: Awaited<ReturnType<typeof prepareImages>> | null = null;
  if (files.length > 0) {
    prepared = await prepareImages(files, (await listPhotos(key)).length, MAX_PHOTOS);
    if ("error" in prepared) return fail(prepared.error);
  }

  // Сервисот ги заменува полињата што зависат од типот (старите стануваат празни), а статусот,
  // slug-от и достапноста од чекор 3 остануваат.
  let saved;
  try {
    saved = await saveListing(account.hostSlug, {
      id,
      type: listing.id,
      title,
      category,
      description,
      price,
      ...extra,
    });
  } catch (error) {
    if (error instanceof UnknownReferenceError) {
      console.error("experience save failed:", error.message);
      return fail("Базата не е подготвена (недостасуваат категории или градови). Извршете „npm run db:seed“.", 500);
    }
    throw error;
  }
  if (!saved) return fail("Овој профил не може да создава искуства.", 403);

  if (prepared && "items" in prepared) await savePhotos(key, prepared.items);

  revalidatePath("/", "layout");
  return Response.json({ ok: true });
}
