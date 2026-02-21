import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "placeholder-anon-key";
  return createBrowserClient(url, key);
}
