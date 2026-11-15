import type { SupabaseClient } from '@supabase/supabase-js'

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim()
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined)?.trim()

/** False when sign-in isn't configured. The museum still works; only account features are switched off. */
export const authConfigured = Boolean(url && key)

let client: Promise<SupabaseClient> | null = null

/**
 * The Supabase client, loaded on first use so it stays out of the main bundle.
 * PKCE flow: Google sends back a one-time code (not tokens in the URL), which the client swaps for a session.
 */
export function getSupabase(): Promise<SupabaseClient> {
  if (!url || !key) return Promise.reject(new Error('Supabase is not configured'))
  client ??= import('@supabase/supabase-js').then(({ createClient }) => createClient(url, key, { auth: { flowType: 'pkce' } }))
  return client
}
