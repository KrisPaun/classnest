import { revalidatePath } from "next/cache";
import { getAccount, sameOrigin } from "@/lib/auth";
import { PAYOUT_FREQUENCIES, PayoutFrequency } from "@/data/payout";
import { normalizeMkIban } from "@/lib/iban";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { encryptSecret, secretBoxConfigured } from "@/lib/secret-box.mjs";
import { normalizeDob } from "@/lib/validation";
import { getOwnerHost, savePayout } from "@/server/modules/hosts/service";
import { getFirstListing } from "@/server/modules/listings/service";

const fail = (error: string, status = 400) => Response.json({ error }, { status });

/** Чекор 4: сметка за исплата, податоци за бизнисот и поставки. IBAN се шифрира и не се враќа. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("Недозволено барање.", 403);
  const account = await getAccount();
  if (!account) return fail("Најавете се.", 401);
  if (!rateLimit(`payout:${account.id}:${clientIp(req)}`, 10, 60 * 60 * 1000)) {
    return fail("Премногу обиди. Обидете се подоцна.", 429);
  }
  if (!secretBoxConfigured()) {
    return fail("Серверот не е конфигуриран за безбедно чување на банкарски податоци (BANK_DATA_KEY).", 500);
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") return fail("Невалидни податоци.");
  const str = (k: string) => (typeof body[k] === "string" ? (body[k] as string).trim() : "");

  const bankName = str("bankName");
  if (bankName.length < 2 || bankName.length > 80) return fail("Внесете име на банката.");

  const holder = str("holder");
  if (holder.length < 2 || holder.length > 100) return fail("Внесете го името на сопственикот на сметката.");

  const tradingName = str("tradingName");
  if (tradingName.length < 2 || tradingName.length > 100) return fail("Внесете назив на бизнисот.");

  if (typeof body.hasTaxNumber !== "boolean") return fail("Одберете дали имате ЕДБ.");

  // Овој профил мора да е регистриран домаќин (не вграден демо домаќин). Ги вклучува и постоечките поставки.
  const existingHost = await getOwnerHost(account.hostSlug);
  if (!existingHost) return fail("Овој профил не може да ги менува овие податоци.", 403);

  let taxNumber: string | undefined;
  let dobEnc: string | undefined;
  if (body.hasTaxNumber) {
    const digits = str("taxNumber").replace(/[\s-]/g, "").toUpperCase().replace(/^MK/, "");
    if (!/^\d{13}$/.test(digits)) return fail("ЕДБ мора да има 13 цифри.");
    taxNumber = digits;
  } else {
    // Без ЕДБ ни треба датум на раѓање. При измена, празно значи „задржи го зачуваниот“.
    const dobRaw = str("dateOfBirth");
    if (dobRaw) {
      const dob = normalizeDob(dobRaw);
      if ("error" in dob) return fail(dob.error);
      dobEnc = encryptSecret(dob.iso);
    } else if (existingHost?.payout?.dobEnc) {
      dobEnc = existingHost.payout.dobEnc;
    } else {
      return fail("Бидејќи немате ЕДБ, внесете го вашиот датум на раѓање.");
    }
  }

  if (typeof body.vatRegistered !== "boolean") return fail("Одберете дали сте регистрирани за ДДВ.");

  const payoutFrequency = str("payoutFrequency") as PayoutFrequency;
  if (!PAYOUT_FREQUENCIES.includes(payoutFrequency)) return fail("Одберете колку често да ви исплаќаме.");

  const existing = existingHost;
  const listing = await getFirstListing(account.hostSlug);
  if (!listing?.availability) return fail("Прво завршете ги претходните чекори.", 403);

  // IBAN: потребен е при прв внес. При измена, празно значи „задржи ја постоечката сметка“.
  const ibanRaw = str("iban");
  let ibanEnc: string;
  let ibanLast4: string;
  if (ibanRaw) {
    const iban = normalizeMkIban(ibanRaw);
    if (!iban) return fail("IBAN не е валиден. Македонски IBAN има 19 знаци и почнува со MK.");
    ibanEnc = encryptSecret(iban);
    ibanLast4 = iban.slice(-4);
  } else if (existing.payout?.bank) {
    ({ ibanEnc, ibanLast4 } = existing.payout.bank);
  } else {
    return fail("Внесете IBAN.");
  }

  const saved = await savePayout(account.hostSlug, {
    bank: { bankName, holder, ibanEnc, ibanLast4 },
    tradingName,
    ...(taxNumber ? { taxNumber } : {}),
    ...(dobEnc ? { dobEnc } : {}),
    vatRegistered: body.vatRegistered as boolean,
    onePublicBookingAtATime: body.onePublicBookingAtATime === true,
    allowSelfServiceChanges: body.allowSelfServiceChanges === true,
    allowPromoUse: body.allowPromoUse === true,
    payoutFrequency,
  });
  if (!saved) return fail("Овој профил не може да ги менува овие податоци.", 403);

  revalidatePath("/", "layout");
  return Response.json({ ok: true });
}
