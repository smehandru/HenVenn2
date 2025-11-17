import './RightPanel.css'
import ResourceLinks from './ResourceLinks'
import { Referral } from '../types'

interface RightPanelProps {
  selectedReferral: Referral | null
  onFileUpload: (file: File) => void
  hasUploadedFile: boolean
  isProcessing?: boolean
}

const RightPanel = ({ selectedReferral, onFileUpload, hasUploadedFile, isProcessing = false }: RightPanelProps) => {
  return (
    <div className="right-panel">
      <ResourceLinks onFileUpload={onFileUpload} disabled={isProcessing} />
      <div className="scrollable-content">
        {!hasUploadedFile ? (
          <div className="initial-instruction">
            <p>Last opp henvisninger først (PDF eller .docx)</p>
          </div>
        ) : selectedReferral ? (
          <div className="referral-display">
            <h2>Henvisning #{selectedReferral.referralNumber}</h2>
            <div className="referral-text">
              <h3>Fullstendig henvisningstekst</h3>
              <div className="full-text">
                {selectedReferral.fullText}
              </div>
            </div>
          </div>
        ) : (
          <div className="no-selection">
            <p>Velg en henvisning fra venstre panel for å se detaljer</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default RightPanel
