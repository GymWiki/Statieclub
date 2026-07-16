import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Server-client voor Server Components / Route Handlers — gebruikt de
 * anon-key + de cookies van de ingelogde gebruiker (voor auth-gebonden
 * leesacties zoals club_admins/team_members).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Genegeerd: kan alleen worden aangeroepen vanuit een Server
            // Component. Middleware ververst de sessie in dat geval.
          }
        },
      },
    }
  );
}

/**
 * Service-role-client — omzeilt RLS volledig. UITSLUITEND gebruiken in
 * Route Handlers (server-side, nooit naar de client sturen) voor
 * schrijfacties op donateurs/ophaalverzoeken/bonnetjes.
 */
export function createServiceRoleClient() {
  return createSupabaseJsClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
