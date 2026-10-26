import { makeSlug } from "../../platform/slug.mjs";

/** Уникатен slug на домаќин од името, на пр. "ana-trajkovska-9f3a". */
export const makeHostSlug = (name: string, taken: ReadonlySet<string> = new Set()): string =>
  makeSlug(name, "domakin", taken);
