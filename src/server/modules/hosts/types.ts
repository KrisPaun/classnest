import type { PayoutFrequency } from "@/data/payout";

/** Поставки за исплата (од чекор 4). IBAN и датумот на раѓање се шифрирани и никогаш не одат до прелистувачот. */
export type PayoutSettings = {
  bank: { bankName: string; holder: string; ibanEnc: string; ibanLast4: string };
  tradingName: string;
  taxNumber?: string; // ЕДБ, 13 цифри
  dobEnc?: string; // шифриран датум на раѓање (ГГГГ-ММ-ДД), само кога нема ЕДБ
  vatRegistered: boolean;
  onePublicBookingAtATime: boolean;
  allowSelfServiceChanges: boolean;
  allowPromoUse: boolean;
  payoutFrequency: PayoutFrequency;
  savedAt: Date;
};

/**
 * Домаќин како што го гледа серверот. `payout` постои САМО во „owner“ погледот (getOwnerHost),
 * никогаш во јавниот (getPublicHost, listPublicHosts).
 */
export type HostRecord = {
  id: string;
  accountId: string; // само за на серверот, не се праќа до прелистувачот
  slug: string;
  name: string;
  city: string; // slug на градот
  category?: string; // slug на категоријата (по желба)
  about: string; // „Што би предавале?“
  story?: string;
  businessName?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  startedMonth?: number;
  startedYear?: number;
  profileCompletedAt?: Date;
  createdAt: Date;
  payout?: PayoutSettings;
};

export class HostExistsError extends Error {
  constructor() {
    super("This account already has a host profile");
    this.name = "HostExistsError";
  }
}

/** Непознат град или категорија: најчесто базата не е пополнета (npm run db:seed). */
export class UnknownReferenceError extends Error {
  constructor(kind: "city" | "category", slug: string) {
    super(`Unknown ${kind}: ${slug}. Run "npm run db:seed".`);
    this.name = "UnknownReferenceError";
  }
}
