import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

/** Where this explorer's stars are kept, in words a child (or grown-up) can trust. */
export default function StarsSavedNote() {
  const { status } = useAuth()
  if (status === 'signed-in') {
    return <p className="text-sm text-dusk">⭐ Your stars are saved to your account, so they follow you to any device.</p>
  }
  if (status === 'disabled') {
    return <p className="text-sm text-dusk">Your stars are saved only in this browser. We never ask for your name.</p>
  }
  return (
    <p className="text-sm text-dusk">
      Your stars are saved in this browser.{' '}
      <Link to="/account" className="link">
        A grown-up can sign in
      </Link>{' '}
      to keep them on any device.
    </p>
  )
}
