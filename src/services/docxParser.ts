import mammoth from 'mammoth'

/**
 * Extract text from a Word document (.docx)
 * @param file - The Word document to parse
 * @returns Promise with extracted text
 */
export async function extractTextFromDocx(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer()

    const result = await mammoth.extractRawText({ arrayBuffer })

    if (result.messages && result.messages.length > 0) {
      console.warn('Word document parsing warnings:', result.messages)
    }

    return result.value.trim()
  } catch (error) {
    console.error('Error parsing Word document:', error)
    throw new Error('Kunne ikke lese Word-dokumentet. Sørg for at det er en gyldig .docx fil.')
  }
}

export default {
  extractTextFromDocx
}
