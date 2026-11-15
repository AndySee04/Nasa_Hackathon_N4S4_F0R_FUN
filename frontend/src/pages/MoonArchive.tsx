import ArchivePage from '../components/ArchivePage'
import MissionTicket from '../components/game/MissionTicket'

export default function MoonArchive() {
  return (
    <ArchivePage
      world="moon"
      eyebrow="Module B · Forgotten Space Explorers"
      title="Moon Archive"
      intro="Landing stages, rovers and robots still sit on the Moon. With no wind or rain, they will stay there for a very long time."
      action={<MissionTicket world="moon" />}
    />
  )
}
