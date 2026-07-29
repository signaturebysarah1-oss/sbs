import { supabaseAdmin } from '../config/supabase.js';
import { findProfileByAuthUserId, createProfile } from '../repositories/profile.repository.js';
import { AppError } from '../utils/AppError.js';
import type { AuthUser } from '../types/api.types.js';

// Verifies the JWT with Supabase, then resolves (or bootstraps) the application profile.
// This is the single entry point for turning a raw Bearer token into an AuthUser.
export async function resolveUserFromToken(token: string): Promise<AuthUser> {
  // Verify the token against Supabase Auth — this validates signature + expiry.
  console.log(process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 20));
  
  const { data, error } = await supabaseAdmin.auth.getUser(token);

  console.log("Supabase getUser error:", error);
  console.log("Supabase user:", data.user);
  
  if (error || !data.user) {
    throw AppError.unauthorized("Invalid or expired token");
  }
  const supabaseUser = data.user;

  // Look up the application profile.
  let profile = await findProfileByAuthUserId(supabaseUser.id);

  // Auto-create profile on first login (e.g. after Google OAuth sign-up).
  if (!profile) {
    const email = supabaseUser.email ?? '';
    const fullName =
      (supabaseUser.user_metadata?.['full_name'] as string | undefined) ??
      email.split('@')[0] ??
      'User';

    const avatarUrl =
      (supabaseUser.user_metadata?.['avatar_url'] as string | undefined) ?? null;

    profile = await createProfile({ authUserId: supabaseUser.id, fullName, avatarUrl });
  }

  if (!profile.isActive) {
    throw AppError.forbidden('Account is disabled');
  }

  return profile;
}

// Returns the profile for an already-resolved auth user ID.
// Used by the /me endpoint after middleware has verified the token.
export async function getMyProfile(authUserId: string): Promise<AuthUser> {
  const profile = await findProfileByAuthUserId(authUserId);

  if (!profile) throw AppError.notFound('Profile not found');

  return profile;
}
