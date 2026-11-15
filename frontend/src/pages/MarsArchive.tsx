import { Link } from 'react-router-dom'
import ArchivePage from '../components/ArchivePage'

export default function MarsArchive() {
  return (
    <ArchivePage
      world="mars"
      eyebrow="Module B · Forgotten Space Explorers"
      title="Mars Archive"
      intro={
        <>
          From Viking in 1976 to InSight in 2018, these landers and rovers taught us that Mars once had water, and that it still shakes with
          marsquakes. Today they rest where they stopped.
          <span className="mt-4 block">
            <Link to="/mars/campaign" className="cbtn c-orange">
              ⛏️ Play the Mars Explorer Mission
            </Link>
          </span>
        </>
      }
    />
  )
}
