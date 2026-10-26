import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Приватни или бескорисни за пребарувачи: порталот, поставувањето, админ, API, резервации.
        disallow: ["/admin", "/api/", "/host/dashboard", "/host/listings", "/host/setup", "/host/login", "/confirmation", "/classes/*/checkout"],
      },
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
