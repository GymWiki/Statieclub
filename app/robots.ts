import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

/**
 * `/admin`, `/club`, `/status` en `/donateren/bedankt` bevatten
 * dashboards, teamweergaven en persoonlijke betaalstatus — geen
 * content die in zoekresultaten hoort. Deze staan óók per pagina op
 * `robots: noindex` (zie `metadata`-exports), maar disallow hier
 * voorkomt bovendien dat Google ze überhaupt crawlt.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/club", "/status", "/donateren/bedankt", "/api"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
