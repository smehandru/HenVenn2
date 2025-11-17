import './ExportButtons.css'
import { Referral } from '../types'
import { exportToJSON, exportToCSV, exportSummaryReport } from '../services/exportService'

interface ExportButtonsProps {
  referrals: Referral[]
}

const ExportButtons = ({ referrals }: ExportButtonsProps) => {
  const hasReferrals = referrals.length > 0

  const handleExportJSON = () => {
    if (hasReferrals) {
      exportToJSON(referrals)
    }
  }

  const handleExportCSV = () => {
    if (hasReferrals) {
      exportToCSV(referrals)
    }
  }

  const handleExportReport = () => {
    if (hasReferrals) {
      exportSummaryReport(referrals)
    }
  }

  if (!hasReferrals) {
    return null
  }

  return (
    <div className="export-buttons">
      <h3>Eksporter triagering</h3>
      <div className="button-group">
        <button onClick={handleExportJSON} className="export-btn export-json">
          <span className="icon">📄</span>
          <span className="text">JSON</span>
        </button>
        <button onClick={handleExportCSV} className="export-btn export-csv">
          <span className="icon">📊</span>
          <span className="text">CSV</span>
        </button>
        <button onClick={handleExportReport} className="export-btn export-report">
          <span className="icon">📝</span>
          <span className="text">Rapport</span>
        </button>
      </div>
    </div>
  )
}

export default ExportButtons
