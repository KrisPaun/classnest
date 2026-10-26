/** Јавна адреса на сајтот (за sitemap, robots и Open Graph). Подесете SITE_URL во продукција. */
export const siteUrl = () => (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
