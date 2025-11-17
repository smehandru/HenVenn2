import express from 'express'
import cors from 'cors'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json({ limit: '50mb' }))

// Serve static files from the dist directory (built frontend)
app.use(express.static(path.join(__dirname, 'dist')))

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'HenVenn API is running' })
})

// Initialize AI clients based on environment variables
const getOpenAIClient = () => {
  const apiKey = process.env.VITE_OPENAI_API_KEY
  if (!apiKey) return null
  return new OpenAI({ apiKey })
}

const getAnthropicClient = () => {
  const apiKey = process.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) return null
  return new Anthropic({ apiKey })
}

// OpenAI Chat endpoint (for chat and assessment)
app.post('/api/openai/chat', async (req, res) => {
  try {
    const { messages, model = 'gpt-4-turbo-preview', max_tokens = 2000 } = req.body

    const openai = getOpenAIClient()
    if (!openai) {
      return res.status(500).json({ error: 'OpenAI API key not configured' })
    }

    const response = await openai.chat.completions.create({
      model,
      messages,
      max_tokens,
      temperature: 0.3
    })

    res.json(response)
  } catch (error) {
    console.error('OpenAI chat error:', error)
    res.status(500).json({ error: error.message })
  }
})

// OpenAI Assistant endpoint (non-streaming)
app.post('/api/openai/assistant', async (req, res) => {
  try {
    const { message, assistantId, threadId } = req.body

    const openai = getOpenAIClient()
    if (!openai) {
      return res.status(500).json({ error: 'OpenAI API key not configured' })
    }

    if (!assistantId) {
      return res.status(400).json({ error: 'Assistant ID required' })
    }

    // Create or use existing thread
    let currentThreadId = threadId
    if (!currentThreadId) {
      const thread = await openai.beta.threads.create()
      currentThreadId = thread.id
    }

    // Add message to thread
    await openai.beta.threads.messages.create(currentThreadId, {
      role: 'user',
      content: message
    })

    // Run the assistant
    const run = await openai.beta.threads.runs.create(currentThreadId, {
      assistant_id: assistantId
    })

    // Wait for completion
    let runStatus = await openai.beta.threads.runs.retrieve(currentThreadId, run.id)
    let attempts = 0
    const maxAttempts = 60

    while (runStatus.status !== 'completed' && attempts < maxAttempts) {
      if (['failed', 'cancelled', 'expired'].includes(runStatus.status)) {
        throw new Error(`Assistant run failed with status: ${runStatus.status}`)
      }
      await new Promise(resolve => setTimeout(resolve, 1000))
      runStatus = await openai.beta.threads.runs.retrieve(currentThreadId, run.id)
      attempts++
    }

    if (runStatus.status !== 'completed') {
      throw new Error('Timeout waiting for assistant response')
    }

    // Get the response
    const messages = await openai.beta.threads.messages.list(currentThreadId)
    const lastMessage = messages.data[0]

    if (lastMessage.role !== 'assistant') {
      throw new Error('No assistant response found')
    }

    const textContent = lastMessage.content.find(content => content.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in assistant response')
    }

    res.json({
      response: textContent.text.value,
      threadId: currentThreadId
    })
  } catch (error) {
    console.error('OpenAI assistant error:', error)
    res.status(500).json({ error: error.message })
  }
})

// OpenAI Assistant endpoint with Server-Sent Events streaming
app.post('/api/openai/assistant/stream', async (req, res) => {
  try {
    const { message, assistantId, threadId, additionalInstructions, referralContext } = req.body

    const openai = getOpenAIClient()
    if (!openai) {
      return res.status(500).json({ error: 'OpenAI API key not configured' })
    }

    if (!assistantId) {
      return res.status(400).json({ error: 'Assistant ID required' })
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    // Create or use existing thread
    let currentThreadId = threadId
    if (!currentThreadId) {
      const thread = await openai.beta.threads.create()
      currentThreadId = thread.id
      // Send thread ID to client
      res.write(`data: ${JSON.stringify({ type: 'threadId', threadId: currentThreadId })}\n\n`)
    }

    // Build message with referral context if provided
    let messageContent = message
    if (referralContext) {
      messageContent = `KONTEKST - Opplastede henvisninger:
${referralContext}

BRUKERS SPØRSMÅL:
${message}`
    }

    // Add message to thread
    await openai.beta.threads.messages.create(currentThreadId, {
      role: 'user',
      content: messageContent
    })

    // Create run with streaming
    const runOptions = {
      assistant_id: assistantId
    }

    if (additionalInstructions) {
      runOptions.additional_instructions = additionalInstructions
    }

    const stream = await openai.beta.threads.runs.stream(currentThreadId, runOptions)

    // Accumulate text to clean citations at the end
    let accumulatedText = ''

    // Handle stream events
    stream.on('textDelta', (textDelta) => {
      // Accumulate text for citation cleaning
      accumulatedText += textDelta.value
      // Send each text delta to the client
      res.write(`data: ${JSON.stringify({ type: 'delta', text: textDelta.value })}\n\n`)
    })

    stream.on('textDone', () => {
      // Clean citations from accumulated text and send cleaned version
      let cleanedText = accumulatedText
      cleanedText = cleanedText.replace(/【[^】]*†metodebok\.pdf】/g, '(metodebok)')
      cleanedText = cleanedText.replace(/【[^】]*†prioriteringsveileder[^】]*】/g, '(prioriteringsveileder)')
      cleanedText = cleanedText.replace(/【[^】]*】/g, '') // Remove any other citations

      // If text was cleaned, send a correction delta
      if (cleanedText !== accumulatedText) {
        // Send signal to replace entire message
        res.write(`data: ${JSON.stringify({ type: 'replace', text: cleanedText })}\n\n`)
      }

      // Signal completion
      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
    })

    stream.on('error', (error) => {
      console.error('Stream error:', error)
      res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`)
      res.end()
    })

    stream.on('end', () => {
      res.end()
    })

  } catch (error) {
    console.error('OpenAI assistant streaming error:', error)
    res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`)
    res.end()
  }
})

// OpenAI Vision endpoint (for OCR)
app.post('/api/openai/vision', async (req, res) => {
  try {
    const { imageBase64, prompt } = req.body

    const openai = getOpenAIClient()
    if (!openai) {
      return res.status(500).json({ error: 'OpenAI API key not configured' })
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: { url: `data:image/png;base64,${imageBase64}` }
            }
          ]
        }
      ],
      max_tokens: 4096
    })

    res.json({ text: response.choices[0]?.message?.content || '' })
  } catch (error) {
    console.error('OpenAI vision error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Claude chat endpoint
app.post('/api/claude/chat', async (req, res) => {
  try {
    const { prompt, model = 'claude-3-5-sonnet-20241022', max_tokens = 2000 } = req.body

    const anthropic = getAnthropicClient()
    if (!anthropic) {
      return res.status(500).json({ error: 'Anthropic API key not configured' })
    }

    const message = await anthropic.messages.create({
      model,
      max_tokens,
      messages: [{ role: 'user', content: prompt }]
    })

    const content = message.content[0]
    if (content.type === 'text') {
      res.json({ text: content.text })
    } else {
      res.status(500).json({ error: 'Unexpected response format' })
    }
  } catch (error) {
    console.error('Claude chat error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Claude vision endpoint (for OCR)
app.post('/api/claude/vision', async (req, res) => {
  try {
    const { imageBase64, prompt } = req.body

    const anthropic = getAnthropicClient()
    if (!anthropic) {
      return res.status(500).json({ error: 'Anthropic API key not configured' })
    }

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: 'image/png', data: imageBase64 }
            },
            { type: 'text', text: prompt }
          ]
        }
      ]
    })

    const content = response.content[0]
    if (content.type === 'text') {
      res.json({ text: content.text })
    } else {
      res.status(500).json({ error: 'Unexpected response format' })
    }
  } catch (error) {
    console.error('Claude vision error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Catch-all route - serve index.html for any non-API routes (for client-side routing)
// In Express 5, we need to use a middleware approach instead of '*'
app.use((req, res, next) => {
  // Only serve index.html for non-API routes
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'))
  } else {
    next()
  }
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 HenVenn API server running on port ${PORT}`)
  console.log(`   Health check: http://localhost:${PORT}/api/health`)
  console.log(`   Frontend: http://localhost:${PORT}`)
})
