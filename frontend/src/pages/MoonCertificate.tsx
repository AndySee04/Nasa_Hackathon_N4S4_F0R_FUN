import Certificate from '../components/game/Certificate'
import { MOON_CAMPAIGN } from '../data/campaigns/moon'

/** The Moon Explorer badge celebration and a printable, unofficial certificate. */
export default function MoonCertificate() {
  return (
    <Certificate
      campaign={MOON_CAMPAIGN}
      world="Moon"
      codePrefix="MOON"
      campaignPath="/moon/campaign"
      pageContext="moon-campaign"
      sprites={MOON_CAMPAIGN.artifacts.map((a) => a.catcherSprite)}
      lockedText={`Catch all four Moon machines to earn the ${MOON_CAMPAIGN.badge.name} badge and your certificate.`}
      earnedText="You found every machine on the Moon."
    />
  )
}
