/** Нормализира линк. Враќа null ако не е валиден http(s) линк (на пр. javascript: се одбива). */
export function normalizeWebsite(input: string): string | null {
  const value = input.trim();
  if (!value || value.length > 200 || /\s/.test(value)) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (!url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** Како normalizeWebsite, но линкот мора да е на дозволен домен (на пр. instagram.com). */
export function normalizeSocial(input: string, domains: string[]): string | null {
  const url = normalizeWebsite(input);
  if (!url) return null;
  const host = new URL(url).hostname.replace(/^(www|m)\./, "");
  return domains.includes(host) ? url : null;
}

/** Месец (1–12) и година. Не смее да е во иднина. Враќа null ако е невалидно. */
export function normalizeStart(
  monthRaw: string,
  yearRaw: string,
  now = new Date(),
): { month: number; year: number } | null {
  if (!/^\d{1,2}$/.test(monthRaw) || !/^\d{4}$/.test(yearRaw)) return null;
  const month = Number(monthRaw);
  const year = Number(yearRaw);
  if (month < 1 || month > 12 || year < 1950) return null;
  if (year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth() + 1)) return null;
  return { month, year };
}

/** Датум на раѓање во формат ДД/ММ/ГГГГ. Мора да постои и лицето да има 18 до 110 години. Враќа ISO (ГГГГ-ММ-ДД). */
export function normalizeDob(input: string, now = new Date()): { error: string } | { iso: string } {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(input.trim());
  if (!m) return { error: "Внесете датум во формат ДД/ММ/ГГГГ." };
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);

  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return { error: "Овој датум не постои." };
  }

  let age = now.getFullYear() - year;
  if (now.getMonth() + 1 < month || (now.getMonth() + 1 === month && now.getDate() < day)) age--;
  if (age < 0) return { error: "Датумот на раѓање не може да е во иднина." };
  if (age < 18) return { error: "Мора да имате најмалку 18 години." };
  if (age > 110) return { error: "Внесете валиден датум на раѓање." };

  return { iso: `${m[3]}-${m[2]}-${m[1]}` };
}

/** Прифаќа формат како +389 70 123 456 или 070 123 456. Враќа исчистен број или null. */
export function normalizePhone(input: string): string | null {
  const value = input.trim();
  if (!/^\+?[\d\s()-]{8,20}$/.test(value)) return null;
  const digits = value.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return null;
  return value.replace(/\s+/g, " ");
}
