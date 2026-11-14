import { Link } from 'react-router-dom'
import AstroAvatar from '../components/AstroAvatar'

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-5 px-4 py-24 text-center">
      <AstroAvatar className="h-28 w-28" />
      <h1 className="text-4xl font-bold">Lost in space!</h1>
      <p className="text-lg text-muted">We couldn&apos;t find that page. It may have drifted off into the void.</p>
      <Link to="/" className="btn btn-primary">
        Fly back home
      </Link>
    </div>
  )
}
