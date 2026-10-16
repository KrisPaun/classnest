export const months = [
  "јануари",
  "февруари",
  "март",
  "април",
  "мај",
  "јуни",
  "јули",
  "август",
  "септември",
  "октомври",
  "ноември",
  "декември",
];

const weekdays = ["нед", "пон", "вто", "сре", "чет", "пет", "саб"];

export const formatPrice = (mkd: number) =>
  `${mkd.toLocaleString("de-DE")} ден.`;

export const formatDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return `${weekdays[date.getDay()]}, ${d} ${months[m - 1]}`;
};

export const formatDuration = (hours: number) =>
  `${String(hours).replace(".", ",")} ч.`;

/** Следни датуми за демо: секој втор ден, почнувајќи од задутре. */
export const upcomingDates = (count = 8): string[] => {
  const result: string[] = [];
  const base = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + 2 + i * 2);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    result.push(`${d.getFullYear()}-${mm}-${dd}`);
  }
  return result;
};
