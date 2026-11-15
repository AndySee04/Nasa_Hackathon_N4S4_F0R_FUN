import type { User } from '@supabase/supabase-js'
import { createContext } from 'react'

/**
 * - `disabled`: Supabase isn't configured, so there is no sign-in at all.
 * - `loading`: checking for a saved session (or finishing a Google redirect).
 */
export type AuthStatus = 'disabled' | 'loading' | 'signed-out' | 'signed-in'

export interface AuthState {
  status: AuthStatus
  user: User | null
  /** A short, friendly name for the header: the first name from Google, else the start of the email. */
  displayName: string | null
  /** The Google profile: full name and photo. Null when signed out or Google didn't share them. */
  profile: Profile | null
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

export const AuthCtx = createContext<AuthState | null>(null)

/** Where Google sends the visitor back to. Must be allowed under Redirect URLs in Supabase. */
export const AUTH_RETURN_PATH = '/account'

export interface Profile {
  fullName: string | null
  /** An https:// photo URL (Google's lh3.googleusercontent.com), or null. */
  avatarUrl: string | null
}

const text = (...values: unknown[]) =>
  values.find((v): v is string => typeof v === 'string' && v.trim() !== '')?.trim().replace(/\s+/g, ' ') ?? null

/** Picks a first name to show. Never shows the full email address. */
export function friendlyName(user: User | null): string | null {
  if (!user) return null
  const meta = user.user_metadata ?? {}
  const full = text(meta.given_name, meta.full_name, meta.name)
  if (full) return full.split(' ')[0]
  return user.email?.split('@')[0] ?? 'Explorer'
}

/** The name and photo Google shared at sign-in (Supabase keeps them in user_metadata). */
export function googleProfile(user: User | null): Profile | null {
  if (!user) return null
  const meta = user.user_metadata ?? {}
  const photo = text(meta.avatar_url, meta.picture)
  // Only https images: never javascript:, data: or plain http URLs from metadata.
  const avatarUrl = photo && /^https:\/\//i.test(photo) ? photo : null
  return { fullName: text(meta.full_name, meta.name), avatarUrl }
}

/** Google photo URLs end in "=s96-c" (96px). Ask for the size we draw, doubled for sharp screens. */
export function sizedAvatar(url: string, px: number): string {
  return /=s\d+(-c)?$/.test(url) ? url.replace(/=s\d+(-c)?$/, `=s${px * 2}-c`) : url
}
