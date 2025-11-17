import './LeftPanel.css'
import TriageGroups from './TriageGroups'
import { Referral, PriorityGroup } from '../types'

interface LeftPanelProps {
  referrals: Referral[]
  onReferralSelect: (referral: Referral) => void
  selectedReferralId?: string
  onRequestRejectionLetter?: (referral: Referral) => void
  groupsLoading?: Record<PriorityGroup, boolean>
}

const LeftPanel = ({
  referrals,
  onReferralSelect,
  selectedReferralId,
  onRequestRejectionLetter,
  groupsLoading
}: LeftPanelProps) => {
  return (
    <div className="left-panel">
      <div className="panel-header">
        <h2>Henvisningstriagering</h2>
      </div>
      <div className="scrollable-content">
        <TriageGroups
          referrals={referrals}
          onReferralSelect={onReferralSelect}
          selectedReferralId={selectedReferralId}
          onRequestRejectionLetter={onRequestRejectionLetter}
          groupsLoading={groupsLoading}
        />
        <div className="left-instruction">
          <p>Henvisninger skal her triageres etter anbefalt inntaksfrist</p>
          <p>Trykk på nedtrekksmenyene for å se anbefalingene</p>
        </div>
      </div>
    </div>
  )
}

export default LeftPanel
