import { randomBytes } from "crypto";
import { Host, getHost, hosts } from "@/data/hosts";
import { DynamicHost, readDb } from "./db";

const gradients = [
  "from-orange-300 to-amber-400",
  "from-rose-300 to-orange-300",
  "from-sky-300 to-indigo-300",
  "from-emerald-300 to-teal-400",
  "from-violet-300 to-fuchsia-400",
  "from-lime-300 to-green-400",
];

const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

function toHost(d: DynamicHost): Host {
  return {
    slug: d.slug,
    name: d.name,
    city: d.city,
    category: d.category,
    businessName: d.businessName,
    website: d.website,
    instagram: d.instagram,
    facebook: d.facebook,
    startedMonth: d.startedMonth,
    startedYear: d.startedYear,
    since: new Date(d.createdAt).getFullYear(),
    languages: ["Македонски"],
    story: d.story?.trim() || d.about,
    badges: ["Нов домаќин"],
    gradient: gradients[hash(d.slug) % gradients.length],
    reviews: [],
  };
}

/** Статични (демо) домаќини + регистрирани домаќини. */
export async function listAllHosts(): Promise<Host[]> {
  const db = await readDb();
  return [...hosts, ...db.hosts.map(toHost)];
}

export async function getHostAny(slug: string): Promise<Host | undefined> {
  const staticHost = getHost(slug);
  if (staticHost) return staticHost;
  const db = await readDb();
  const dynamic = db.hosts.find((h) => h.slug === slug);
  return dynamic ? toHost(dynamic) : undefined;
}

/** Суров запис за регистриран домаќин (null за демо домаќините). */
export async function getDynamicHost(slug: string): Promise<DynamicHost | null> {
  const db = await readDb();
  return db.hosts.find((h) => h.slug === slug) ?? null;
}

const MK: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", ѓ: "gj", е: "e", ж: "zh", з: "z", ѕ: "dz", и: "i",
  ј: "j", к: "k", л: "l", љ: "lj", м: "m", н: "n", њ: "nj", о: "o", п: "p", р: "r", с: "s",
  т: "t", ќ: "kj", у: "u", ф: "f", х: "h", ц: "c", ч: "ch", џ: "dzh", ш: "sh",
};

/** Уникатен slug од име (кирилица се транслитерира), на пр. "ana-trajkovska-9f3a". */
export function makeHostSlug(name: string, taken: Set<string>): string {
  const base =
    [...name.toLowerCase()]
      .map((c) => MK[c] ?? c)
      .join("")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "domakin";
  let slug: string;
  do {
    slug = `${base}-${randomBytes(2).toString("hex")}`;
  } while (taken.has(slug));
  return slug;
}
