"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-client — gebruikt de publieke anon-key. Door RLS heeft deze
 * alleen leestoegang tot niet-privacygevoelige tabellen (clubs, teams).
 * Gebruik dit alleen in Client Components (realtime leaderboard etc.).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
