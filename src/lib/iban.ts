/** Чисти го празните места и цртичките и ги прави буквите големи. */
const clean = (input: string) => input.replace(/[\s-]/g, "").toUpperCase();

/** mod-97 проверка (ISO 13616): префрли ги првите 4 знаци на крај, буквите стануваат броеви (A=10…Z=35). */
function mod97(iban: string): number {
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let remainder = 0;
  for (const ch of rearranged) {
    const value = ch >= "A" && ch <= "Z" ? String(ch.charCodeAt(0) - 55) : ch;
    for (const digit of value) remainder = (remainder * 10 + Number(digit)) % 97;
  }
  return remainder;
}

/**
 * Македонски IBAN: MK + 2 контролни цифри + 3 цифри банка + 10 знаци сметка + 2 контролни = 19 знаци.
 * Враќа нормализиран IBAN (без празни места) или null ако не е валиден.
 */
export function normalizeMkIban(input: string): string | null {
  const iban = clean(input);
  if (!/^MK\d{2}\d{3}[A-Z0-9]{10}\d{2}$/.test(iban)) return null;
  return mod97(iban) === 1 ? iban : null;
}

/** За прикажување: MK07 •••• •••• ••84 (само последните 4 знаци се видливи). */
export const maskIban = (last4: string) => `MK•• •••• •••• •••• ${last4}`;
