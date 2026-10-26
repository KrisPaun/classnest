import { cache } from "react";
import { getOwnerHost, getPublicHost, listPublicHosts } from "@/server/modules/hosts/service";
import type { HostRecord } from "@/server/modules/hosts/types";
import { readOrFallback } from "./safe-read";

/** Јавен профил на домаќин за страниците (без приватни податоци). */
export type HostView = {
  slug: string;
  name: string;
  city: string;
  category?: string;
  businessName?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  startedMonth?: number;
  startedYear?: number;
  since: number;
  languages: string[];
  story: string;
};

function toHostView(h: HostRecord): HostView {
  return {
    slug: h.slug,
    name: h.name,
    city: h.city,
    category: h.category,
    businessName: h.businessName,
    website: h.website,
    instagram: h.instagram,
    facebook: h.facebook,
    startedMonth: h.startedMonth,
    startedYear: h.startedYear,
    since: h.createdAt.getFullYear(),
    languages: ["Македонски"],
    story: h.story?.trim() || h.about,
  };
}

export async function listAllHosts(): Promise<HostView[]> {
  const records = await readOrFallback(listPublicHosts, [] as HostRecord[]);
  return records.map(toHostView);
}

export const getHostAny = cache(async (slug: string): Promise<HostView | undefined> => {
  const record = await readOrFallback(() => getPublicHost(slug), null);
  return record ? toHostView(record) : undefined;
});

/** Профил на домаќинот со приватните поставки за исплата (само за сопственикот). */
export async function getDynamicHost(slug: string): Promise<HostRecord | null> {
  if (!slug) return null;
  return getOwnerHost(slug);
}
