import OpenAI from 'openai'

/**
 * Chat service for handling conversations with OpenAI Assistant
 * Uses backend API for better security and streaming support
 */
export class ChatService {
  private openai: OpenAI | null = null
  private assistantId: string
  private threadId: string | null = null
  private useBackend: boolean
  private apiBaseUrl: string

  constructor(apiKey: string, assistantId: string, useBackend = true) {
    this.assistantId = assistantId
    this.useBackend = useBackend

    // Use backend API in production, or direct API for fallback
    if (!useBackend) {
      this.openai = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true
      })
    }

    // Determine API base URL
    this.apiBaseUrl = import.meta.env.VITE_API_URL ||
                      (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '')
  }

  /**
   * Initialize or get existing conversation thread (for direct API mode)
   */
  private async getThread(): Promise<string> {
    if (this.threadId) {
      return this.threadId
    }

    if (this.openai) {
      const thread = await this.openai.beta.threads.create()
      this.threadId = thread.id
      return thread.id
    }

    return ''
  }

  /**
   * Send a message to the assistant and get a response (fallback non-streaming method)
   */
  async sendMessage(message: string): Promise<string> {
    try {
      if (!this.openai) {
        throw new Error('OpenAI client not initialized. Use backend mode instead.')
      }

      const threadId = await this.getThread()

      // Add message to thread with instruction for natural conversation
      const conversationalMessage = `${message}

VIKTIG INSTRUKS FOR DETTE SPØRSMÅLET:
- Svar på en naturlig, konversasjonell måte på norsk
- IKKE bruk JSON-format
- IKKE gi strukturerte vurderinger som for henvisninger
- Gi et vennlig, hjelpsomt svar som en ortopedi-ekspert
- Bruk punktlister hvis det gjør svaret klarere
- Vær konsis men informativ`

      await this.openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: conversationalMessage
      })

      // Run the assistant with additional instructions
      const run = await this.openai.beta.threads.runs.create(threadId, {
        assistant_id: this.assistantId,
        additional_instructions:
          'Du er en hjelpsom ortopedi-assistent som svarer på generelle spørsmål. Svar på en vennlig, konversasjonell måte på norsk. IKKE bruk JSON-format. Gi naturlige, lett forståelige svar.'
      })

      // Wait for completion
      let runStatus = await this.openai.beta.threads.runs.retrieve(threadId, run.id)
      let attempts = 0
      const maxAttempts = 60

      while (runStatus.status !== 'completed' && attempts < maxAttempts) {
        if (runStatus.status === 'failed' || runStatus.status === 'cancelled' || runStatus.status === 'expired') {
          throw new Error(`Assistant run failed with status: ${runStatus.status}`)
        }

        await new Promise(resolve => setTimeout(resolve, 1000))
        runStatus = await this.openai.beta.threads.runs.retrieve(threadId, run.id)
        attempts++
      }

      if (runStatus.status !== 'completed') {
        throw new Error('Timeout waiting for assistant response')
      }

      // Get the assistant's response
      const messages = await this.openai.beta.threads.messages.list(threadId)
      const lastMessage = messages.data[0]

      if (lastMessage.role !== 'assistant') {
        throw new Error('No assistant response found')
      }

      // Extract text from message content
      const textContent = lastMessage.content.find(content => content.type === 'text')
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text content in assistant response')
      }

      // Remove OpenAI citation markers like 【4:1†metodebok.pdf】 and replace with "metodebok"
      let responseText = textContent.text.value
      responseText = responseText.replace(/【[^】]*†metodebok\.pdf】/g, '(metodebok)')
      responseText = responseText.replace(/【[^】]*†prioriteringsveileder[^】]*】/g, '(prioriteringsveileder)')
      responseText = responseText.replace(/【[^】]*】/g, '') // Remove any other citations

      return responseText
    } catch (error: any) {
      console.error('Chat service error:', error)
      throw new Error(`Kunne ikke få svar fra assistenten: ${error.message}`)
    }
  }

  /**
   * Send a message with streaming response (word-by-word like ChatGPT)
   * @param message The user's message
   * @param onChunk Callback for each text chunk received (text, shouldReplace?)
   * @param onComplete Callback when streaming is complete
   * @param onError Callback for errors
   * @param referralContext Optional context about uploaded referrals
   */
  async sendMessageStreaming(
    message: string,
    onChunk: (text: string, shouldReplace?: boolean) => void,
    onComplete: () => void,
    onError: (error: Error) => void,
    referralContext?: string
  ): Promise<void> {
    try {
      if (!this.useBackend) {
        // Fallback to non-streaming if not using backend
        const response = await this.sendMessage(message)
        // Simulate streaming by sending chunks
        const words = response.split(' ')
        for (let i = 0; i < words.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 30))
          onChunk(i === 0 ? words[i] : ' ' + words[i])
        }
        onComplete()
        return
      }

      // Prepare message with conversational instructions
      const conversationalMessage = `${message}

VIKTIG INSTRUKS FOR DETTE SPØRSMÅLET:
- Svar på en naturlig, konversasjonell måte på norsk
- IKKE bruk JSON-format
- IKKE gi strukturerte vurderinger som for henvisninger
- Gi et vennlig, hjelpsomt svar som en ortopedi-ekspert
- Bruk punktlister hvis det gjør svaret klarere
- Vær konsis men informativ`

      const additionalInstructions =
        'Du er en hjelpsom ortopedi-assistent som svarer på generelle spørsmål. Svar på en vennlig, konversasjonell måte på norsk. IKKE bruk JSON-format. Gi naturlige, lett forståelige svar.'

      // Call backend streaming endpoint
      const response = await fetch(`${this.apiBaseUrl}/api/openai/assistant/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: conversationalMessage,
          assistantId: this.assistantId,
          threadId: this.threadId,
          additionalInstructions,
          referralContext
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      if (!response.body) {
        throw new Error('Response body is null')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          onComplete()
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')

        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.type === 'threadId') {
                this.threadId = data.threadId
              } else if (data.type === 'delta') {
                onChunk(data.text)
              } else if (data.type === 'replace') {
                // Replace entire message with cleaned text (remove citations)
                onChunk(data.text, true) // true indicates this should replace, not append
              } else if (data.type === 'done') {
                onComplete()
              } else if (data.type === 'error') {
                onError(new Error(data.error))
              }
            } catch (e) {
              console.warn('Failed to parse SSE data:', line, e)
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Streaming chat service error:', error)
      onError(new Error(`Kunne ikke få svar fra assistenten: ${error.message}`))
    }
  }

  /**
   * Clear the conversation thread (start fresh)
   */
  clearThread() {
    this.threadId = null
  }
}

/**
 * Create a chat service instance from environment variables
 */
export function createChatService(): ChatService | null {
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY
  const assistantId = import.meta.env.VITE_OPENAI_ASSISTANT_ID

  if (openaiKey && assistantId) {
    return new ChatService(openaiKey, assistantId)
  }

  return null
}

export default ChatService
