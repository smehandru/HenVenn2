import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

/**
 * OCR Service for extracting text from images using Vision AI
 * Supports OpenAI Vision (gpt-4o) and Claude Vision (claude-3.5-sonnet)
 */

/**
 * Extract text from image using OpenAI Vision API
 */
async function extractTextWithOpenAI(imageBase64: string): Promise<string> {
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY

  if (!openaiKey) {
    throw new Error('OpenAI API key not configured')
  }

  const openai = new OpenAI({
    apiKey: openaiKey,
    dangerouslyAllowBrowser: true
  })

  const response = await openai.chat.completions.create({
    model: 'gpt-4o', // Best model for OCR
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Ekstraher all tekst fra dette bildet. Dette er en medisinsk henvisning på norsk. Returner kun teksten, ingen forklaring eller kommentarer. Behold all formatering og struktur.'
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/png;base64,${imageBase64}`
            }
          }
        ]
      }
    ],
    max_tokens: 4096
  })

  return response.choices[0]?.message?.content || ''
}

/**
 * Extract text from image using Claude Vision API
 */
async function extractTextWithClaude(imageBase64: string): Promise<string> {
  const claudeKey = import.meta.env.VITE_ANTHROPIC_API_KEY

  if (!claudeKey) {
    throw new Error('Claude API key not configured')
  }

  const anthropic = new Anthropic({
    apiKey: claudeKey,
    dangerouslyAllowBrowser: true
  })

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: imageBase64
            }
          },
          {
            type: 'text',
            text: 'Ekstraher all tekst fra dette bildet. Dette er en medisinsk henvisning på norsk. Returner kun teksten, ingen forklaring eller kommentarer. Behold all formatering og struktur.'
          }
        ]
      }
    ]
  })

  const content = response.content[0]
  if (content.type === 'text') {
    return content.text
  }

  return ''
}

/**
 * Extract text from image using available Vision AI
 * Tries OpenAI first, then Claude as fallback
 */
export async function extractTextFromImage(imageBase64: string): Promise<string> {
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY
  const claudeKey = import.meta.env.VITE_ANTHROPIC_API_KEY

  // Try OpenAI Vision first (gpt-4o has excellent OCR)
  if (openaiKey) {
    try {
      console.log('Using OpenAI Vision for OCR...')
      return await extractTextWithOpenAI(imageBase64)
    } catch (error) {
      console.error('OpenAI Vision OCR failed:', error)
      // Fall through to Claude
    }
  }

  // Fallback to Claude Vision
  if (claudeKey) {
    try {
      console.log('Using Claude Vision for OCR...')
      return await extractTextWithClaude(imageBase64)
    } catch (error) {
      console.error('Claude Vision OCR failed:', error)
      throw new Error('OCR failed: No vision AI available or both APIs failed')
    }
  }

  throw new Error(
    'OCR ikke tilgjengelig: Legg til VITE_OPENAI_API_KEY eller VITE_ANTHROPIC_API_KEY i .env-filen'
  )
}

export default {
  extractTextFromImage
}
