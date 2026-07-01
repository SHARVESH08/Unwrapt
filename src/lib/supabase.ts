/* The Supabase client.
 *
 * URL + publishable (public) key come from env. The publishable key is safe to
 * ship in the frontend — Row-Level Security protects the data. If env is not
 * configured, `supabase` is null and `isSupabaseConfigured` is false, so the
 * app can still run the demo player without a backend. */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && key);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, key!)
  : null;

/** Throwing accessor for code paths that require the backend. */
export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env",
    );
  }
  return supabase;
}
