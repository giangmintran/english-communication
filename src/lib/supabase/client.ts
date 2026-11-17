import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let clientInstance: SupabaseClient | null = null;

export function createClient(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  if (typeof window !== 'undefined' && clientInstance) {
    return clientInstance;
  }

  const client = createBrowserClient(supabaseUrl, supabaseAnonKey);

  if (typeof window !== 'undefined') {
    clientInstance = client;
  }

  return client;
}
