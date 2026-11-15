import type { User } from '@supabase/supabase-js'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authConfigured, getSupabase } from '../lib/supabase'
import { AUTH_RETURN_PATH, AuthCtx, friendlyName, type AuthState, type AuthStatus } from './authState'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(authConfigured ? 'loading' : 'disabled')
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    if (!authConfigured) return
    let unsubscribe: (() => void) | undefined
    let alive = true
    getSupabase().then(
      (supabase) => {
        if (!alive) return
        // Fires INITIAL_SESSION once the client has loaded any saved session (and finished a Google
        // redirect by swapping the ?code= in the URL), then again on sign-in, sign-out and token refresh.
        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user ?? null)
          setStatus(session ? 'signed-in' : 'signed-out')
        })
        unsubscribe = () => data.subscription.unsubscribe()
      },
      // The client couldn't load (offline?): treat as signed out rather than spinning forever.
      () => alive && setStatus('signed-out'),
    )
    return () => {
      alive = false
      unsubscribe?.()
    }
  }, [])

  const signInWithGoogle = useCallback(async () => {
    const supabase = await getSupabase()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + AUTH_RETURN_PATH,
        // Always show the account chooser, so a shared family computer doesn't silently reuse the last account.
        queryParams: { prompt: 'select_account' },
      },
    })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    const supabase = await getSupabase()
    // 'local' signs out this browser only, not the grown-up's other devices.
    const { error } = await supabase.auth.signOut({ scope: 'local' })
    if (error) throw error
  }, [])

  const value = useMemo<AuthState>(
    () => ({ status, user, displayName: friendlyName(user), signInWithGoogle, signOut }),
    [status, user, signInWithGoogle, signOut],
  )

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}
