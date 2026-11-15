import { Link } from 'react-router-dom'
import AstroAvatar from '../components/AstroAvatar'
import Paper from '../components/Paper'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <Paper tilt={-1.5} innerClassName="flex flex-col items-center gap-5 px-6 py-10 text-center">
        <AstroAvatar className="h-28 w-28 -rotate-12" />
        <h1 className="text-4xl">Lost in space!</h1>
        <p className="text-lg">We couldn&apos;t find that page. It may have drifted off into the void.</p>
        <Link to="/" className="cbtn c-yellow">
          Fly back home
        </Link>
      </Paper>
    </div>
  )
}
