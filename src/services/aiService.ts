import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { AzureOpenAI } from 'openai'
import '@azure/openai/types' // Type extensions for Azure
import { DirectLine } from 'botframework-directlinejs'
import { ReferralAssessment } from '../types'

/**
 * AI Service Configuration
 *
 * For å bruke dette:
 * 1. Opprett en .env fil i root-mappen
 * 2. Legg til én av følgende:
 *    - VITE_ANTHROPIC_API_KEY=din-api-nøkkel (Claude)
 *    - VITE_OPENAI_API_KEY + VITE_OPENAI_ASSISTANT_ID (OpenAI Assistant med kunnskapsbase)
 *    - VITE_OPENAI_API_KEY=din-api-nøkkel (Standard OpenAI)
 *    - VITE_AZURE_OPENAI_API_KEY + VITE_AZURE_OPENAI_ENDPOINT (Azure OpenAI)
 *    - VITE_COPILOT_DIRECT_LINE_SECRET (Microsoft Copilot Studio)
 */

export type AIProvider = 'claude' | 'openai' | 'openai-assistant' | 'azure' | 'copilot' | 'backend'

interface AIServiceConfig {
  provider: AIProvider
  apiKey: string
  model?: string
  endpoint?: string // For Azure OpenAI
  deploymentName?: string // For Azure OpenAI
  directLineSecret?: string // For Copilot Studio
  assistantId?: string // For OpenAI Assistant
}

/**
 * AI Service for assessing medical referrals
 */
export class AIService {
  private provider: AIProvider
  private anthropic?: Anthropic
  private openai?: OpenAI
  private azureOpenAI?: AzureOpenAI
  private directLine?: DirectLine
  private model: string
  private deploymentName?: string
  private assistantId?: string

  constructor(config: AIServiceConfig) {
    this.provider = config.provider

    // Backend-only mode - no client initialization needed
    if (config.provider === 'backend') {
      this.model = 'gpt-4-turbo-preview' // Placeholder
      return
    }

    if (config.provider === 'claude') {
      this.anthropic = new Anthropic({
        apiKey: config.apiKey,
        dangerouslyAllowBrowser: true // For prototype - should use backend in production
      })
      this.model = config.model || 'claude-3-5-sonnet-20241022'
    } else if (config.provider === 'azure') {
      // Azure OpenAI konfiguration
      if (!config.endpoint) {
        throw new Error('Azure OpenAI krever endpoint URL')
      }
      this.azureOpenAI = new AzureOpenAI({
        apiKey: config.apiKey,
        endpoint: config.endpoint,
        apiVersion: '2024-10-21',
        dangerouslyAllowBrowser: true // For prototype - should use backend in production
      })
      this.deploymentName = config.deploymentName || 'gpt-4'
      this.model = config.model || 'gpt-4'
    } else if (config.provider === 'copilot') {
      // Microsoft Copilot Studio via DirectLine
      if (!config.directLineSecret) {
        throw new Error('Copilot Studio krever DirectLine secret')
      }
      this.directLine = new DirectLine({
        secret: config.directLineSecret
      })
      this.model = 'copilot-studio-agent'
    } else if (config.provider === 'openai-assistant') {
      // OpenAI Assistant with knowledge base
      if (!config.assistantId) {
        throw new Error('OpenAI Assistant krever Assistant ID')
      }
      this.openai = new OpenAI({
        apiKey: config.apiKey,
        dangerouslyAllowBrowser: true // For prototype - should use backend in production
      })
      this.assistantId = config.assistantId
      this.model = 'openai-assistant'
    } else {
      // Standard OpenAI
      this.openai = new OpenAI({
        apiKey: config.apiKey,
        dangerouslyAllowBrowser: true // For prototype - should use backend in production
      })
      this.model = config.model || 'gpt-4-turbo-preview'
    }
  }

  /**
   * Quick triage - only determine priority group without detailed assessment
   * Uses backend API when available for better security
   */
  async quickTriageReferral(
    referralText: string,
    priorityGuidelines: string
  ): Promise<'red' | 'orange' | 'green' | 'rejected'> {
    // Try backend API first
    try {
      const apiUrl = window.location.origin + '/api/triage/quick'
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralText, priorityGuidelines })
      })

      if (response.ok) {
        const data = await response.json()
        return data.priorityGroup
      }
    } catch (error) {
      console.log('Backend API not available, falling back to client-side')
    }

    // Fallback to client-side AI
    const prompt = `Du er en erfaren ortoped som skal gjøre en rask triagering av en henvisning.

PRIORITERINGSVEILEDER:
${priorityGuidelines}

HENVISNING:
${referralText}

OPPGAVE:
Bestem KUN hvilken prioritetsgruppe denne henvisningen tilhører. Svar med ett enkelt ord:
- "red" (≤4 uker): Akutte tilstander, betydelige nevrologiske utfall, røde flagg
- "orange" (5-12 uker): Betydelige symptomer, moderat funksjonshemming
- "green" (>12 uker): Elektive tilstander, stabile symptomer
- "rejected": Mangler grunnleggende informasjon, kan håndteres i primærhelsetjenesten, feil fagfelt

VIKTIG AVVISNINGSKRITERIER:
- Mangler pasientinfo (alder/kjønn)
- Vage symptomer ("smerter i kne, prøvd alt")
- Mangler klinisk undersøkelse
- Mangler bildediagnostikk
- Tilhører annet fagfelt (nevrologi, revmatologi, etc.)

Svar KUN med: red, orange, green, eller rejected`

    let response: string

    if (this.provider === 'claude' && this.anthropic) {
      response = await this.callClaude(prompt)
    } else if (this.provider === 'openai' && this.openai) {
      response = await this.callOpenAI(prompt)
    } else if (this.provider === 'azure' && this.azureOpenAI) {
      response = await this.callAzureOpenAI(prompt)
    } else {
      throw new Error('AI provider not configured')
    }

    const cleanResponse = response.trim().toLowerCase()
    if (cleanResponse.includes('red')) return 'red'
    if (cleanResponse.includes('orange')) return 'orange'
    if (cleanResponse.includes('green')) return 'green'
    if (cleanResponse.includes('rejected')) return 'rejected'

    // Default to green if unclear
    return 'green'
  }

  /**
   * Assess a single referral using AI with streaming support
   * Uses backend API when available for better security
   */
  async assessReferralStreaming(
    referralText: string,
    _referralNumber: number,
    priorityGuidelines: string,
    onChunk?: (chunk: string) => void
  ): Promise<ReferralAssessment> {
    // Try backend API first with SSE streaming
    try {
      const apiUrl = window.location.origin + '/api/triage/assess/stream'
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralText, priorityGuidelines })
      })

      if (response.ok && response.body) {
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let fullResponse = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6))

              if (data.type === 'delta' && data.text) {
                fullResponse += data.text
                if (onChunk) onChunk(data.text)
              } else if (data.type === 'done') {
                return this.parseAssessmentResponse(fullResponse)
              } else if (data.type === 'error') {
                throw new Error(data.error)
              }
            }
          }
        }

        return this.parseAssessmentResponse(fullResponse)
      }
    } catch (error) {
      console.log('Backend API not available, falling back to client-side', error)
    }

    // Fallback to client-side AI
    const prompt = this.buildAssessmentPrompt(referralText, priorityGuidelines)

    let fullResponse = ''

    if (this.provider === 'claude' && this.anthropic) {
      fullResponse = await this.callClaudeStreaming(prompt, onChunk)
    } else if (this.provider === 'openai' && this.openai) {
      fullResponse = await this.callOpenAIStreaming(prompt, onChunk)
    } else if (this.provider === 'azure' && this.azureOpenAI) {
      fullResponse = await this.callAzureOpenAIStreaming(prompt, onChunk)
    } else if (this.provider === 'openai-assistant' && this.openai && this.assistantId) {
      // For OpenAI Assistant, fallback to non-streaming
      fullResponse = await this.callOpenAIAssistant(referralText)
    } else if (this.provider === 'copilot' && this.directLine) {
      // For Copilot Studio, fallback to non-streaming
      fullResponse = await this.callCopilotStudio(referralText)
    } else {
      throw new Error('AI provider not configured')
    }

    return this.parseAssessmentResponse(fullResponse)
  }

  /**
   * Assess a single referral using AI
   */
  async assessReferral(
    referralText: string,
    _referralNumber: number,
    priorityGuidelines: string
  ): Promise<ReferralAssessment> {
    let response: string

    if (this.provider === 'copilot' && this.directLine) {
      // For Copilot Studio: Send bare henvisningsteksten
      // Agenten har allerede prioriteringsveileder som kunnskapsbase
      response = await this.callCopilotStudio(referralText)
    } else if (this.provider === 'openai-assistant' && this.openai && this.assistantId) {
      // For OpenAI Assistant: Send bare henvisningsteksten
      // Assistenten har allerede prioriteringsveileder som kunnskapsbase
      response = await this.callOpenAIAssistant(referralText)
    } else {
      // For andre providers: Send full prompt med veileder
      const prompt = this.buildAssessmentPrompt(referralText, priorityGuidelines)

      if (this.provider === 'claude' && this.anthropic) {
        response = await this.callClaude(prompt)
      } else if (this.provider === 'azure' && this.azureOpenAI) {
        response = await this.callAzureOpenAI(prompt)
      } else if (this.provider === 'openai' && this.openai) {
        response = await this.callOpenAI(prompt)
      } else {
        throw new Error('AI provider not configured')
      }
    }

    return this.parseAssessmentResponse(response)
  }

  /**
   * Separate multiple referrals from a single text using AI
   * This is used when the PDF contains multiple referrals without clear delimiters
   */
  async separateReferrals(fullText: string): Promise<string[]> {
    const prompt = `Du er en AI-assistent som skal hjelpe med å identifisere og separere individuelle medisinske henvisninger fra en samlet tekst.

TEKST FRA PDF:
${fullText}

OPPGAVE:
Analyser teksten ovenfor og identifiser alle individuelle henvisninger. Hver henvisning inneholder typisk:
- Pasientinformasjon (navn, alder, kjønn)
- Symptomer og kliniske funn
- Sykehistorie
- Aktuell problemstilling

Return et JSON-array hvor hvert element er teksten til én henvisning:

{
  "referrals": [
    "Tekst for henvisning 1...",
    "Tekst for henvisning 2...",
    ...
  ]
}

VIKTIG:
- Hvis det bare er én henvisning i teksten, returner et array med ett element
- Ikke endre eller forkorte teksten - inkluder all informasjon fra hver henvisning
- Separer kun ved naturlige skiller mellom henvisninger
- Hvis du finner nummerering (f.eks. "Henvisning 1", "Pasient 2"), bruk den som guide

Svar KUN med valid JSON.`

    let response: string

    if (this.provider === 'claude' && this.anthropic) {
      response = await this.callClaude(prompt)
    } else if (this.provider === 'openai' && this.openai) {
      response = await this.callOpenAI(prompt)
    } else if (this.provider === 'azure' && this.azureOpenAI) {
      response = await this.callAzureOpenAI(prompt)
    } else if (this.provider === 'openai-assistant' && this.openai) {
      // For OpenAI Assistant, use regular OpenAI API for this task
      response = await this.callOpenAI(prompt)
    } else {
      // Fallback: return full text as single referral
      console.warn('AI provider not configured for referral separation - returning full text')
      return [fullText]
    }

    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        console.warn('Could not extract JSON from AI response - returning full text')
        return [fullText]
      }

      const parsed = JSON.parse(jsonMatch[0])

      if (parsed.referrals && Array.isArray(parsed.referrals) && parsed.referrals.length > 0) {
        return parsed.referrals.filter((r: string) => r.trim().length > 50) // Filter out very short texts
      } else {
        console.warn('No referrals found in AI response - returning full text')
        return [fullText]
      }
    } catch (error) {
      console.error('Error parsing AI separation response:', error)
      console.error('Response was:', response)
      // Fallback: return full text as single referral
      return [fullText]
    }
  }

  /**
   * Build the assessment prompt for AI
   */
  private buildAssessmentPrompt(referralText: string, priorityGuidelines: string): string {
    return `Du er en erfaren ortoped som skal vurdere en henvisning fra fastlege.

PRIORITERINGSVEILEDER:
${priorityGuidelines}

HENVISNING:
${referralText}

OPPGAVE:
Analyser henvisningen og gi en strukturert vurdering på norsk i følgende JSON-format:

For AKSEPTERTE henvisninger (red/orange/green):
{
  "keySummary": "Konsis oppsummering av nøkkelsymptomer og funn (2-3 setninger)",
  "tentativeDiagnosis": "Tentativ diagnose",
  "differentialDiagnoses": ["Diff.diagnose 1", "Diff.diagnose 2"],  // VALGFRITT - kun hvis relevant
  "guidelineDescription": {
    "conditions": [
      {
        "icon": "🦵",  // Bruk emoji: 🦵 (bein/skulder/arm), 🦶 (fot/ankel), 🦴 (generelt skjelett), 🏃 (bevegelse/sene)
        "name": "Rotatorcuff-ruptur (skulder)",
        "source": "Kap. 2.22 Rotatorcuff skade",
        "deadlines": [
          "Traumatisk ruptur: Veiledende frist 12 uker",
          "Degenerativ ruptur: Veiledende frist 26 uker"
        ],
        "rightToHealthcare": true,
        "comment": "Veilederen skiller eksplisitt mellom traumatiske og degenerative rupturer; traumatiske vurderes som alvorlige og skal håndteres raskere."
      }
    ]
  },
  "priorityGroup": "red|orange|green"
}

For AVVISTE henvisninger (rejected):
{
  "keySummary": "Konsis oppsummering av henvisningen",
  "tentativeDiagnosis": "Foreløpig vurdering",
  "priorityGroup": "rejected",
  "rejection": {
    "wrongSpecialty": false,  // Sett til true hvis henvisningen tilhører et annet fagfelt
    "correctSpecialty": null,  // Hvis wrongSpecialty=true, angi riktig fagfelt (f.eks. "Nevrologi", "Revmatologi")
    "missingInformation": ["Mangler bildediagnostikk", "Ingen beskrivelse av konservativ behandling"],
    "expectedPrimaryCareActions": ["Prøv fysioterapi i 6-8 uker", "Ta røntgen av aktuelt område", "Prøv NSAID-behandling"]
  }
}

VIKTIGE REGLER:
1. differentialDiagnoses: Kun hvis det er klinisk relevant med flere diagnoser. Utelat feltet hvis diagnosen er klar.
2. guidelineDescription: For aksepterte henvisninger - gi detaljert omtale fra prioriteringsveilederen med relevante kapitler, frister og kommentarer.
3. rejection: IKKE inkluder "reason" feltet. Bruk wrongSpecialty, correctSpecialty, missingInformation og expectedPrimaryCareActions.
4. wrongSpecialty: Hvis problemstillingen tilhører et annet fagfelt (nevrologi, indremedisin, revmatologi, etc.), sett dette til true og spesifiser correctSpecialty.

KRITERIER FOR AVSLAG (VÆR STRENG - DU MÅ AVVISE VAGE HENVISNINGER):
Avvis henvisning (priorityGroup: "rejected") når:
1. FEIL FAGFELT: Problemstillingen tilhører et annet fagfelt enn ortopedi/kirurgi
   - Nevrologiske tilstander (f.eks. perifer neuropati, CNS-lidelser, nevrodegenerative sykdommer)
   - Revmatologiske tilstander (f.eks. systemiske autoimmune sykdommer, inflammatorisk artritt)
   - Indremedisinske tilstander (f.eks. kardiovaskulære, metabolske)
   - Hudlidelser uten ortopedisk komponent
   → Sett wrongSpecialty=true og correctSpecialty="[fagfelt]"

2. UTILSTREKKELIG INFORMASJON (VIKTIG - AVVIS VAGE HENVISNINGER):
   - Mangler pasientinformasjon (alder, kjønn)
   - Mangler spesifikk symptomdeskrivelse (kun "smerter" eller "vondt" uten detaljer)
   - Mangler varighet av symptomer
   - Mangler klinisk undersøkelse/funn
   - Vage beskrivelser som "prøvd alt" uten å spesifisere hva
   - Mangler funksjonsnivå (hva pasienten ikke kan gjøre)
   EKSEMPEL PÅ AVVISNING: "Smerter i kne, prøvd alt" → AVVIS (for vagt, mangler konkret info)

3. Manglende utredning:
   - Ingen/utilstrekkelig bildediagnostikk (røntgen/MR)
   - Ingen sykehistorie dokumentert
   - Mangler laboratorieprøver ved mistanke om infeksjon/inflammasjon

4. Kan håndteres i primærhelsetjenesten - ikke behov for spesialistkompetanse
   - Akutt overbelastning/muskelskade uten objektive funn
   - Milde symptomer uten funksjonshemming
   - Ikke forsøkt konservativ behandling (fysioterapi, NSAID)

5. Ingen klar indikasjon for spesialistvurdering:
   - Stabile/ukompliserte symptomer uten progresjon
   - Ingen røde flagg
   - Konservativ behandling ikke forsøkt eller for kort tid

VIKTIG: Hvis henvisningen er vag og mangler grunnleggende informasjon → ALLTID AVVIS.
Eksempel: "Smerter i kne, vet ikke hva vi skal gjøre" → AVVIS (mangler alder, kjønn, klinisk undersøkelse, bildediagnostikk, varighet, forsøkt behandling)

KRITERIER FOR PRIORITERING (kun for henvisninger som IKKE skal avvises):
- red (≤4 uker): Akutte tilstander, betydelige nevrologiske utfall, progredierende symptomer, røde flagg
- orange (5-12 uker): Betydelige symptomer, ikke respondert på konservativ behandling, moderat funksjonshemming
- green (>12 uker): Elektive tilstander, stabile symptomer, lav funksjonshemming

Vurder alltid FØRST om henvisningen skal AVVISES:
- Er pasientinformasjon tilstede (alder, kjønn)?
- Er symptomene konkret beskrevet?
- Er det gjort klinisk undersøkelse med objektive funn?
- Er det gjort bildediagnostikk?
- Er varighet dokumentert?
- Er forsøkt behandling dokumentert?
HVIS NEI TIL FLERE AV DISSE → AVVIS HENVISNINGEN

Svar KUN med valid JSON, ingen annen tekst.`
  }

  /**
   * Call Claude API with streaming
   */
  private async callClaudeStreaming(prompt: string, onChunk?: (chunk: string) => void): Promise<string> {
    if (!this.anthropic) throw new Error('Claude not configured')

    let fullText = ''

    const stream = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      stream: true
    })

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        const chunk = event.delta.text
        fullText += chunk
        if (onChunk) {
          onChunk(chunk)
        }
      }
    }

    return fullText
  }

  /**
   * Call Claude API
   */
  private async callClaude(prompt: string): Promise<string> {
    if (!this.anthropic) throw new Error('Claude not configured')

    const message = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    const content = message.content[0]
    if (content.type === 'text') {
      return content.text
    }

    throw new Error('Unexpected response format from Claude')
  }

  /**
   * Call OpenAI API with streaming
   */
  private async callOpenAIStreaming(prompt: string, onChunk?: (chunk: string) => void): Promise<string> {
    if (!this.openai) throw new Error('OpenAI not configured')

    let fullText = ''

    const stream = await this.openai.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: 'Du er en erfaren ortoped som vurderer medisinske henvisninger på norsk.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
      stream: true
    })

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || ''
      fullText += content
      if (onChunk && content) {
        onChunk(content)
      }
    }

    return fullText
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(prompt: string): Promise<string> {
    if (!this.openai) throw new Error('OpenAI not configured')

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: 'Du er en erfaren ortoped som vurderer medisinske henvisninger på norsk.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    })

    return response.choices[0]?.message?.content || ''
  }

  /**
   * Call Azure OpenAI API with streaming
   */
  private async callAzureOpenAIStreaming(prompt: string, onChunk?: (chunk: string) => void): Promise<string> {
    if (!this.azureOpenAI) throw new Error('Azure OpenAI not configured')
    if (!this.deploymentName) throw new Error('Azure deployment name not configured')

    let fullText = ''

    const stream = await this.azureOpenAI.chat.completions.create({
      model: this.deploymentName,
      messages: [
        {
          role: 'system',
          content: 'Du er en erfaren ortoped som vurderer medisinske henvisninger på norsk.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
      stream: true
    })

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || ''
      fullText += content
      if (onChunk && content) {
        onChunk(content)
      }
    }

    return fullText
  }

  /**
   * Call Azure OpenAI API
   */
  private async callAzureOpenAI(prompt: string): Promise<string> {
    if (!this.azureOpenAI) throw new Error('Azure OpenAI not configured')
    if (!this.deploymentName) throw new Error('Azure deployment name not configured')

    const response = await this.azureOpenAI.chat.completions.create({
      model: this.deploymentName, // Azure bruker deployment name i stedet for model
      messages: [
        {
          role: 'system',
          content: 'Du er en erfaren ortoped som vurderer medisinske henvisninger på norsk.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    })

    return response.choices[0]?.message?.content || ''
  }

  /**
   * Call Microsoft Copilot Studio via DirectLine
   */
  private async callCopilotStudio(referralText: string): Promise<string> {
    if (!this.directLine) throw new Error('Copilot Studio not configured')

    const directLine = this.directLine // Local variable for TypeScript

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Copilot Studio timeout - ingen respons etter 60 sekunder'))
      }, 60000) // 60 sekunder timeout

      // Subscribe to bot messages
      directLine.activity$
        .filter((activity: any) => activity.type === 'message' && activity.from.id !== 'user')
        .subscribe({
          next: (activity: any) => {
            clearTimeout(timeout)
            const botMessage = activity.text || ''
            resolve(botMessage)
          },
          error: (error: any) => {
            clearTimeout(timeout)
            reject(new Error(`Copilot Studio error: ${error.message}`))
          }
        })

      // Send message to bot
      directLine
        .postActivity({
          from: { id: 'user', name: 'HenVenn User' },
          type: 'message',
          text: referralText
        })
        .subscribe({
          error: (error: any) => {
            clearTimeout(timeout)
            reject(new Error(`Failed to send message to Copilot: ${error.message}`))
          }
        })
    })
  }

  /**
   * Call OpenAI Assistant with knowledge base
   */
  private async callOpenAIAssistant(referralText: string): Promise<string> {
    if (!this.openai) throw new Error('OpenAI not configured')
    if (!this.assistantId) throw new Error('Assistant ID not configured')

    try {
      // Step 1: Create a thread
      const thread = await this.openai.beta.threads.create()

      // Step 2: Add message to thread
      await this.openai.beta.threads.messages.create(thread.id, {
        role: 'user',
        content: referralText
      })

      // Step 3: Run the assistant
      const run = await this.openai.beta.threads.runs.create(thread.id, {
        assistant_id: this.assistantId
      })

      // Step 4: Wait for completion (with timeout)
      let runStatus = await this.openai.beta.threads.runs.retrieve(thread.id, run.id)
      let attempts = 0
      const maxAttempts = 60 // 60 attempts * 1 second = 60 seconds timeout

      while (runStatus.status !== 'completed' && attempts < maxAttempts) {
        if (runStatus.status === 'failed' || runStatus.status === 'cancelled' || runStatus.status === 'expired') {
          throw new Error(`Assistant run failed with status: ${runStatus.status}`)
        }

        await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
        runStatus = await this.openai.beta.threads.runs.retrieve(thread.id, run.id)
        attempts++
      }

      if (runStatus.status !== 'completed') {
        throw new Error('OpenAI Assistant timeout - ingen respons etter 60 sekunder')
      }

      // Step 5: Get the assistant's response
      const messages = await this.openai.beta.threads.messages.list(thread.id)
      const assistantMessage = messages.data.find(msg => msg.role === 'assistant')

      if (!assistantMessage) {
        throw new Error('Ingen svar fra OpenAI Assistant')
      }

      // Extract text from message content
      const textContent = assistantMessage.content.find(content => content.type === 'text')
      if (!textContent || textContent.type !== 'text') {
        throw new Error('Ugyldig svarformat fra OpenAI Assistant')
      }

      // Remove OpenAI citation markers like 【4:1†metodebok.pdf】 and replace with "metodebok"
      let responseText = textContent.text.value
      responseText = responseText.replace(/【[^】]*†metodebok\.pdf】/g, '(metodebok)')
      responseText = responseText.replace(/【[^】]*†prioriteringsveileder[^】]*】/g, '(prioriteringsveileder)')
      responseText = responseText.replace(/【[^】]*】/g, '') // Remove any other citations

      return responseText
    } catch (error: any) {
      console.error('OpenAI Assistant error:', error)
      throw new Error(`OpenAI Assistant feil: ${error.message}`)
    }
  }

  /**
   * Parse AI response to ReferralAssessment
   */
  private parseAssessmentResponse(response: string): ReferralAssessment {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const parsed = JSON.parse(jsonMatch[0])

      const assessment: ReferralAssessment = {
        keySummary: parsed.keySummary || '',
        tentativeDiagnosis: parsed.tentativeDiagnosis || '',
        priorityGroup: parsed.priorityGroup || 'green'
      }

      // differentialDiagnoses er optional - bare hvis det finnes
      if (parsed.differentialDiagnoses && parsed.differentialDiagnoses.length > 0) {
        assessment.differentialDiagnoses = parsed.differentialDiagnoses
      }

      // guidelineDescription (for aksepterte henvisninger)
      if (parsed.guidelineDescription) {
        assessment.guidelineDescription = parsed.guidelineDescription
      }

      // rejection objekt (for avviste henvisninger)
      if (parsed.rejection) {
        assessment.rejection = {
          wrongSpecialty: parsed.rejection.wrongSpecialty || false,
          correctSpecialty: parsed.rejection.correctSpecialty || undefined,
          missingInformation: parsed.rejection.missingInformation || [],
          expectedPrimaryCareActions: parsed.rejection.expectedPrimaryCareActions || parsed.rejection.primaryCareActions || []
        }
      }

      return assessment
    } catch (error) {
      console.error('Error parsing AI response:', error)
      console.error('Response was:', response)

      // Return a fallback assessment
      return {
        keySummary: 'Kunne ikke analysere henvisningen automatisk.',
        tentativeDiagnosis: 'Ukjent',
        priorityGroup: 'green',
        guidelineDescription: {
          conditions: [{
            icon: '⚠️',
            name: 'Manuell vurdering nødvendig',
            source: 'AI-systemet kunne ikke prosessere responsen korrekt',
            deadlines: ['Vurder manuelt'],
            rightToHealthcare: false,
            comment: 'Teknisk feil i AI-prosessering'
          }]
        }
      }
    }
  }
}

/**
 * Create AI service instance from environment variables
 * Always returns an AIService - will use backend API when available
 */
export function createAIService(): AIService {
  const copilotSecret = import.meta.env.VITE_COPILOT_DIRECT_LINE_SECRET
  const claudeKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY
  const openaiAssistantId = import.meta.env.VITE_OPENAI_ASSISTANT_ID
  const azureKey = import.meta.env.VITE_AZURE_OPENAI_API_KEY
  const azureEndpoint = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT
  const azureDeployment = import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT_NAME

  // Prioriter OpenAI Assistant først (best for egendefinert agent med kunnskapsbase)
  if (openaiKey && openaiAssistantId) {
    return new AIService({
      provider: 'openai-assistant',
      apiKey: openaiKey,
      assistantId: openaiAssistantId
    })
  }

  // Deretter Copilot Studio (alternativ for egendefinert agent)
  else if (copilotSecret) {
    return new AIService({
      provider: 'copilot',
      apiKey: '', // Ikke brukt for Copilot
      directLineSecret: copilotSecret
    })
  }

  // Deretter Claude (best for medisinsk bruk uten kunnskapsbase)
  else if (claudeKey) {
    return new AIService({
      provider: 'claude',
      apiKey: claudeKey
    })
  }

  // Deretter Azure OpenAI (best for GDPR/norsk helsevesen)
  else if (azureKey && azureEndpoint) {
    return new AIService({
      provider: 'azure',
      apiKey: azureKey,
      endpoint: azureEndpoint,
      deploymentName: azureDeployment
    })
  }

  // Til slutt standard OpenAI
  else if (openaiKey) {
    return new AIService({
      provider: 'openai',
      apiKey: openaiKey
    })
  }

  // No frontend API keys - create backend-only service
  // This service will only use backend API endpoints
  console.log('No frontend AI API keys - using backend-only mode')
  return new AIService({
    provider: 'backend',
    apiKey: '' // Not used
  })
}

export default AIService
