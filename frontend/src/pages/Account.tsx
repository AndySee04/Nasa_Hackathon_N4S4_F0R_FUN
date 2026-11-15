import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AstroAvatar from '../components/AstroAvatar'
import LoadingScreen from '../components/LoadingScreen'
import Paper from '../components/Paper'
import ProfileAvatar from '../components/ProfileAvatar'
import { useAuth } from '../hooks/useAuth'
import { usePageContext } from '../hooks/usePageContext'

/** Google's "G", as its sign-in branding guidelines ask for on a sign-in button. */
function GoogleG() {
  return (
    <svg viewBox="0 0 48 48" className="h-6 w-6" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}

/**
 * Supabase sends errors back on the return URL (?error=…, or after # for older flows).
 * Read them once and map them to fixed messages, then tidy the address bar so a refresh doesn't show them again.
 */
function readReturnError(): string | null {
  const params = new URLSearchParams(window.location.search)
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const code = params.get('error') ?? hash.get('error')
  if (!code) return null
  if (code === 'access_denied') return 'Sign-in was cancelled. No problem, you can try again any time.'
  // Never echo error_description: anyone can put text in a link, and this is a children's site.
  return "Sign-in didn't work. Please try again."
}

export default function Account() {
  usePageContext('account')
  const { status, user, displayName, profile, signInWithGoogle, signOut } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(readReturnError)
  const [busy, setBusy] = useState(false)

  // Drop ?error=… from the address bar once read. Wait until loading ends: Supabase reads the URL
  // (and removes ?code= itself) asynchronously, so touching it earlier could break a sign-in.
  useEffect(() => {
    if (status === 'loading') return
    if (/[?#&]error=/.test(window.location.search + window.location.hash)) navigate('/account', { replace: true })
  }, [status, navigate])

  const onSignIn = async () => {
    setBusy(true)
    setError(null)
    try {
      await signInWithGoogle() // On success the page leaves for Google, so it stays "busy".
    } catch {
      setError("We couldn't reach Google just now. Please try again.")
      setBusy(false)
    }
  }

  const onSignOut = async () => {
    setBusy(true)
    setError(null)
    try {
      await signOut()
    } catch {
      setError("We couldn't sign you out. Please try again.")
    }
    setBusy(false)
  }

  if (status === 'loading') return <LoadingScreen label="Checking your account…" />

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <Paper tilt={-1} innerClassName="flex flex-col items-center gap-5 px-6 py-10 text-center sm:px-10">
        {status === 'signed-in' ? (
          // The Google photo, printed and glued on like the museum's other pictures.
          <span className="polaroid rounded-full" style={{ '--r': '-4deg' } as React.CSSProperties}>
            <ProfileAvatar px={112} />
          </span>
        ) : (
          <AstroAvatar className="h-24 w-24 -rotate-6" />
        )}

        {status === 'disabled' && (
          <>
            <p className="tape">For grown-ups</p>
            <h1 className="text-4xl">Accounts are switched off</h1>
            <p className="text-lg">
              Sign-in isn&apos;t set up on this copy of the museum yet. Everything else works without an account, so keep exploring!
            </p>
            <Link to="/explore" className="cbtn c-yellow">
              Keep exploring
            </Link>
          </>
        )}

        {status === 'signed-out' && (
          <>
            <p className="tape">For grown-ups</p>
            <h1 className="text-4xl">Sign in</h1>
            <p className="text-lg">
              Kids: ask a grown-up to sign in for you. A grown-up&apos;s Google account lets the museum remember your explorer&apos;s
              progress.
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={() => void onSignIn()}
              className="sticker c-white btn gap-3"
              style={{ '--r': '-1deg' } as React.CSSProperties}
            >
              <GoogleG />
              {busy ? 'Opening Google…' : 'Sign in with Google'}
            </button>
            <p className="inset muted px-4 py-3 text-left text-sm">
              We receive the name, email address and profile picture from the Google account, and use them only to keep this
              account. No advertising, no tracking, and nothing is shared. Astro&apos;s chats are still not saved.
            </p>
          </>
        )}

        {status === 'signed-in' && user && (
          <>
            <p className="tape c-mint">Signed in</p>
            <h1 className="text-4xl">Welcome aboard, {displayName}!</h1>
            <dl className="inset grid w-full grid-cols-[auto_1fr] gap-x-4 gap-y-2 px-5 py-4 text-left">
              {profile?.fullName && (
                <>
                  <dt className="muted font-display">Name</dt>
                  <dd className="min-w-0 break-words font-bold">{profile.fullName}</dd>
                </>
              )}
              {user.email && (
                <>
                  <dt className="muted font-display">Email</dt>
                  <dd className="min-w-0 break-all">{user.email}</dd>
                </>
              )}
              <dt className="muted font-display">Signed in with</dt>
              <dd>Google</dd>
            </dl>
            <p className="muted text-sm">Your name and photo come from Google. To change them, update your Google account.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/explore" className="cbtn c-yellow">
                Keep exploring
              </Link>
              <button
                type="button"
                disabled={busy}
                onClick={() => void onSignOut()}
                className="sticker c-white btn"
                style={{ '--r': '1deg' } as React.CSSProperties}
              >
                {busy ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          </>
        )}

        {error && (
          <p role="alert" className="label c-orange px-4 py-2 text-left">
            {error}
          </p>
        )}
      </Paper>
    </div>
  )
}
