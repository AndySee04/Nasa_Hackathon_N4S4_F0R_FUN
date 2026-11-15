import Certificate from '../components/game/Certificate'
import { MARS_CAMPAIGN } from '../data/campaigns/mars'

/** The Mars Explorer badge celebration and a printable, unofficial certificate. */
export default function MarsCertificate() {
  return (
    <Certificate
      campaign={MARS_CAMPAIGN}
      world="Mars"
      codePrefix="MARS"
      campaignPath="/mars/campaign"
      pageContext="mars-campaign"
      sprites={MARS_CAMPAIGN.artifacts.map((a) => a.sprite)}
      lockedText={`Earn all 3 stars on all five Mars machines to get the ${MARS_CAMPAIGN.badge.name} badge and your certificate.`}
      earnedText="You earned every star on all five Mars machines. That was tough!"
    />
  )
}
