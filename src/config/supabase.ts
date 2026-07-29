import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

// Public client — uses anon key, respects Row Level Security.
// Safe to use for operations that mirror what the frontend would do.
export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey);

// Admin client — uses service role key, bypasses Row Level Security.
// ONLY use server-side for privileged operations (e.g. verifying JWTs, admin tasks).
// Never expose this key to the frontend.
export const supabaseAdmin = createClient(
  env.supabaseUrl,
  env.supabaseServiceRoleKey,
  { auth: { autoRefreshToken: false, persistSession: false } },
);
