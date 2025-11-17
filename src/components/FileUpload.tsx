import { useRef } from 'react'
import './FileUpload.css'

interface FileUploadProps {
  onFileUpload: (file: File) => void
  disabled?: boolean
}

const FileUpload = ({ onFileUpload, disabled = false }: FileUploadProps) => {
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
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/msword' // .doc (older format)
      ]

      if (validTypes.includes(file.type) || file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
        onFileUpload(file)
      } else {
        alert('Vennligst last opp en PDF eller Word-fil (.pdf, .docx)')
      }
    }
  }

  return (
    <div className="file-upload">
      <button
        className="upload-button"
        onClick={handleClick}
        disabled={disabled}
        style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
      >
        Last opp PDF eller Word
      </button>
      <p className="upload-instruction">Last opp henvisninger først (PDF eller .docx)</p>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx,application/msword,.doc"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        disabled={disabled}
      />
    </div>
  )
}

export default FileUpload
