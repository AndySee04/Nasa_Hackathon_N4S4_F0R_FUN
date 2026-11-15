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
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

export const AuthCtx = createContext<AuthState | null>(null)

/** Where Google sends the visitor back to. Must be allowed under Redirect URLs in Supabase. */
export const AUTH_RETURN_PATH = '/account'

/** Picks a first name to show. Never shows the full email address. */
export function friendlyName(user: User | null): string | null {
  if (!user) return null
  const meta = user.user_metadata ?? {}
  const full = [meta.given_name, meta.full_name, meta.name].find((v): v is string => typeof v === 'string' && v.trim() !== '')
  if (full) return full.trim().split(/\s+/)[0]
  return user.email?.split('@')[0] ?? 'Explorer'
}
