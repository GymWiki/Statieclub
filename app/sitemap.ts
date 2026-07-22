import type { MetadataRoute } from "next";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { Club } from "@/lib/types";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

/**
 * Statische pagina's + één entry per actieve club (`/clubs/[slug]`) —
 * dezelfde publieke, geïndexeerde content als `robots.ts` toestaat.
 * Gebruikt de service-role-client i.p.v. de cookie-gebonden SSR-client:
 * `sitemap.ts` draait buiten een normale request-cyclus (geen
 * ingelogde gebruiker), en de query zelf is read-only en geeft alleen
 * al-publieke velden (slug/updated_at) van actieve clubs terug.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createServiceRoleClient();
  const { data: clubs } = await supabase
    .from("clubs")
    .select("slug, updated_at")
    .eq("is_actief", true);

  const clubEntries: MetadataRoute.Sitemap = ((clubs as Pick<Club, "slug" | "updated_at">[]) ?? []).map(
    (club) => ({
      url: `${SITE_URL}/clubs/${club.slug}`,
      lastModified: club.updated_at,
      changeFrequency: "weekly",
      priority: 0.7,
    })
  );

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/donateren`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...clubEntries,
  ];
}
