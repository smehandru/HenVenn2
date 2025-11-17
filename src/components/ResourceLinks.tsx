import { useRef } from 'react'
import './ResourceLinks.css'

interface ResourceLinksProps {
  onFileUpload: (file: File) => void
  disabled?: boolean
}

const ResourceLinks = ({ onFileUpload, disabled = false }: ResourceLinksProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const validTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
      ]

      if (validTypes.includes(file.type) || file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
        onFileUpload(file)
      } else {
        alert('Vennligst last opp en PDF eller Word-fil (.pdf, .docx)')
      }
    }
  }

  const openMetodebok = () => {
    window.open('https://metodebok.no/bok/ousortopedi/ortopedi-(ous-ullevål)', '_blank', 'noopener,noreferrer')
  }

  const openPrioriteringsveileder = () => {
    window.open('https://www.helsedirektoratet.no/veiledere/prioriteringsveiledere/ortopedi', '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="resource-links">
      <button
        className="upload-button-primary"
        onClick={handleClick}
        disabled={disabled}
      >
        📄 Last opp PDF eller Word
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx,application/msword,.doc"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        disabled={disabled}
      />
      <button className="resource-button metodebok-button" onClick={openMetodebok}>
        📖 Metodebok
      </button>
      <button className="resource-button veileder-button" onClick={openPrioriteringsveileder}>
        📋 Prioriteringsveileder
      </button>
    </div>
  )
}

export default ResourceLinks
