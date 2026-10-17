// Достапност за термини по барање (чекор 3). Чиста логика: ја користат и серверот и формата.

export const FLEXIBILITY = ["flexible", "strict"] as const;
export type Flexibility = (typeof FLEXIBILITY)[number];

/** day: 1 = понеделник … 7 = недела. from/to: минути од полноќ (на секои 15 минути). */
export type Slot = { day: number; from: number; to: number };

export type Availability = {
  flexibility: Flexibility;
  parallelBookings: boolean; // повеќе приватни резервации во исто време
  slots: Slot[];
};

export const weekdays = ["Понеделник", "Вторник", "Среда", "Четврток", "Петок", "Сабота", "Недела"];

export const MAX_SLOTS = 28;

const isInt = (n: unknown): n is number => typeof n === "number" && Number.isInteger(n);

export function parseAvailability(input: unknown): { error: string } | { value: Availability } {
  const body = input as Partial<Availability> | null;
  if (!body || typeof body !== "object") return { error: "Невалидни податоци." };

  if (!FLEXIBILITY.includes(body.flexibility as Flexibility)) return { error: "Изберете флексибилност." };
  const parallelBookings = body.parallelBookings === true;

  if (!Array.isArray(body.slots) || body.slots.length < 1) return { error: "Додајте барем еден термин." };
  if (body.slots.length > MAX_SLOTS) return { error: `Максимум ${MAX_SLOTS} термини.` };

  const slots: Slot[] = [];
  for (const s of body.slots) {
    if (!s || !isInt(s.day) || s.day < 1 || s.day > 7) return { error: "Изберете ден за секој термин." };
    if (!isInt(s.from) || !isInt(s.to) || s.from % 15 !== 0 || s.to % 15 !== 0) {
      return { error: "Времето мора да е на секои 15 минути." };
    }
    if (s.from < 0 || s.to > 1440 || s.to <= s.from) return { error: "Крајот на терминот мора да е по почетокот." };
    slots.push({ day: s.day, from: s.from, to: s.to });
  }

  slots.sort((a, b) => a.day - b.day || a.from - b.from);
  for (let i = 1; i < slots.length; i++) {
    if (slots[i].day === slots[i - 1].day && slots[i].from < slots[i - 1].to) {
      return { error: `Термините во ${weekdays[slots[i].day - 1].toLowerCase()} се преклопуваат.` };
    }
  }

  return { value: { flexibility: body.flexibility as Flexibility, parallelBookings, slots } };
}
