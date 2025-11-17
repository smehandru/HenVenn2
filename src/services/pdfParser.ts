import * as pdfjsLib from 'pdfjs-dist'
import { extractTextFromImage } from './ocrService'

// Set up PDF.js worker
// Use CDN in production for reliable worker loading
// In development, we try to use local worker but fall back to CDN if it fails
const isProduction = import.meta.env.PROD

if (isProduction) {
  // Production: Always use CDN (most reliable)
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`
} else {
  // Development: Try local worker, fallback to CDN
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString()
  } catch (error) {
    console.warn('Failed to load local worker, using CDN fallback')
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`
  }
}

/**
 * Extract images from a PDF page and convert to base64
 */
async function extractImagesFromPage(page: any): Promise<string[]> {
  const images: string[] = []

  try {
    // Render page to canvas
    const viewport = page.getViewport({ scale: 2.0 }) // Higher scale for better OCR
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')

    if (!context) {
      throw new Error('Could not get canvas context')
    }

    canvas.width = viewport.width
    canvas.height = viewport.height

    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise

    // Convert canvas to base64
    const base64Image = canvas.toDataURL('image/png').split(',')[1]
    images.push(base64Image)
  } catch (error) {
    console.error('Error extracting images from page:', error)
  }

  return images
}

/**
 * Extract text from a PDF file
 * Automatically detects if PDF is scanned (image-based) and uses OCR
 * @param file - The PDF file to parse
 * @returns Promise with extracted text
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

    let fullText = ''
    let totalTextLength = 0
    const pageTexts: string[] = []

    // First pass: Try to extract text normally
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()

      // Combine all text items
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')

      pageTexts.push(pageText)
      totalTextLength += pageText.trim().length
      fullText += pageText + '\n\n'
    }

    // Check if PDF is scanned (very little text extracted)
    const avgTextPerPage = totalTextLength / pdf.numPages
    const isScanned = avgTextPerPage < 50 // Less than 50 chars per page = likely scanned

    if (isScanned) {
      console.log('Scanned PDF detected - using OCR...')
      fullText = '' // Reset

      // Second pass: Extract images and use OCR
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const images = await extractImagesFromPage(page)

        for (const imageBase64 of images) {
          try {
            const ocrText = await extractTextFromImage(imageBase64)
            fullText += ocrText + '\n\n'
          } catch (error) {
            console.error(`OCR failed for page ${pageNum}:`, error)
            // Use whatever text was extracted (if any)
            fullText += pageTexts[pageNum - 1] + '\n\n'
          }
        }
      }
    }

    return fullText.trim()
  } catch (error) {
    console.error('Error parsing PDF:', error)
    throw new Error('Kunne ikke lese PDF-filen. Sørg for at det er en gyldig PDF.')
  }
}

/**
 * Parse referrals from extracted PDF text
 * This assumes the PDF contains numbered referrals
 * @param text - Extracted text from PDF
 * @returns Array of referral texts
 */
export function parseReferralsFromText(text: string): string[] {
  // Split by common referral separators
  // This is a simplified version - you may need to adjust based on actual PDF format

  // Try to split by referral numbers (e.g., "Henvisning 1:", "1.", etc.)
  const referralPattern = /(?:Henvisning\s+\d+|^\d+[\.:)])/gim
  const matches = text.match(referralPattern)

  if (!matches || matches.length === 0) {
    // If no numbered pattern found, try to split by large gaps or page breaks
    return [text] // Return as single referral for now
  }

  // Split text into separate referrals
  const referrals: string[] = []
  let currentIndex = 0

  text.replace(referralPattern, (match, offset) => {
    if (currentIndex > 0) {
      referrals.push(text.substring(currentIndex, offset).trim())
    }
    currentIndex = offset
    return match
  })

  // Add the last referral
  if (currentIndex > 0) {
    referrals.push(text.substring(currentIndex).trim())
  }

  return referrals.filter(r => r.length > 50) // Filter out very short texts
}

/**
 * Extract and structure referrals from a PDF file
 * @param file - The PDF file containing referrals
 * @returns Promise with array of referral texts
 */
export async function extractReferralsFromPDF(file: File): Promise<string[]> {
  const text = await extractTextFromPDF(file)
  return parseReferralsFromText(text)
}

export default {
  extractTextFromPDF,
  parseReferralsFromText,
  extractReferralsFromPDF
}
