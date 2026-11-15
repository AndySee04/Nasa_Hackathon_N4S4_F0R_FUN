import { Link } from 'react-router-dom'
import ArchivePage from '../components/ArchivePage'

export default function MoonArchive() {
  return (
    <ArchivePage
      world="moon"
      eyebrow="Module B · Forgotten Space Explorers"
      title="Moon Archive"
      intro={
        <>
          Landing stages, rovers and robots still sit on the Moon. With no wind or rain, they will stay there for a very long time. Tap any
          machine to hear its story.
          <span className="mt-4 block">
            <Link to="/moon/campaign" className="cbtn c-mint">
              🚀 Play the Moon Explorer Mission
            </Link>
          </span>
        </>
      }
    />
  )
}
