// URL-безбедни slug-ови од текст (кирилицата се транслитерира). Пишано како .mjs за да го користат
// и апликацијата (TypeScript) и Node скриптите (увоз на податоци).
import { randomBytes } from "node:crypto";

/** @type {Record<string, string>} */
const MK = {
  а: "a", б: "b", в: "v", г: "g", д: "d", ѓ: "gj", е: "e", ж: "zh", з: "z", ѕ: "dz", и: "i",
  ј: "j", к: "k", л: "l", љ: "lj", м: "m", н: "n", њ: "nj", о: "o", п: "p", р: "r", с: "s",
  т: "t", ќ: "kj", у: "u", ф: "f", х: "h", ц: "c", ч: "ch", џ: "dzh", ш: "sh",
};

/**
 * Уникатен slug од текст со случаен наставак, на пр. "domasna-pasta-9f3a".
 *
 * @param {string} text извор (име, наслов)
 * @param {string} fallback што се користи ако од текстот не остане ништо употребливо
 * @param {ReadonlySet<string>} [taken] slug-ови што веќе се зафатени
 * @param {number} [maxBase] најмногу знаци пред наставакот
 * @returns {string}
 */
export function makeSlug(text, fallback, taken = new Set(), maxBase = 40) {
  const base =
    [...text.toLowerCase()]
      .map((c) => MK[c] ?? c)
      .join("")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, maxBase)
      .replace(/-+$/g, "") || fallback;

  let slug;
  do {
    slug = `${base}-${randomBytes(2).toString("hex")}`;
  } while (taken.has(slug));
  return slug;
}
