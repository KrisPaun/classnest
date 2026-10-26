// Пари: во базата се чуваат како цел број во најмали единици (ISO 4217: МКД има 2 децимали,
// па 1500 ден. = 150000). Апликацијата работи со цели денари. Никогаш float.

export const MINOR_PER_MAJOR = 100;

/** Цели денари → најмали единици. Фрла грешка ако не е цел, позитивен број. */
export function toMinor(major: number): number {
  if (!Number.isSafeInteger(major) || major < 0) throw new Error("Amount must be a non-negative whole number");
  const minor = major * MINOR_PER_MAJOR;
  // Резултатот исто така мора да е точен цел број (нема губење на прецизност кај огромни износи).
  if (!Number.isSafeInteger(minor)) throw new Error("Amount is too large");
  return minor;
}

/** Најмали единици → цели денари (заокружено). */
export const fromMinor = (minor: number): number => Math.round(minor / MINOR_PER_MAJOR);
