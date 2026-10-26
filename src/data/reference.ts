import reference from "./reference.json";

export type Category = { slug: string; name: string; emoji: string };
export type City = { slug: string; name: string };

// Градовите и категориите се во reference.json: истиот фајл го чита и скриптата што ја полни базата (db:seed).
export const categories: Category[] = reference.categories;

export const cities: City[] = reference.cities.map(({ slug, name }) => ({ slug, name }));

export const getCategory = (slug: string) => categories.find((c) => c.slug === slug);
export const getCity = (slug: string) => cities.find((c) => c.slug === slug);
