/** Кратко резиме за meta description: без нови редови, најмногу 155 знаци. */
export function summary(text: string, max = 155): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  return `${flat.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
}
