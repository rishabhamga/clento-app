import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { z } from 'zod'
import { conversationStorage } from '@/lib/conversation-storage'
import { ConversationUpdate, ConversationResponse, FilterEvolution, ConversationState } from '@/types/conversation'
import { getCurrentProvider } from '@/lib/data-providers/provider-manager'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Schema for conversation update requests
const ConversationUpdateSchema = z.object({
  userMessage: z.string().min(1),
  conversationId: z.string().optional(),
  intent: z.enum(['initial', 'add', 'remove', 'replace', 'refine', 'clarify']).optional(),
  userId: z.string().optional(),
  campaignId: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { userMessage, conversationId, intent, userId, campaignId } = ConversationUpdateSchema.parse(body)

    console.log(`💬 Conversation update: ${intent || 'auto'} - "${userMessage.substring(0, 50)}..."`)

    // Get or create conversation
    let conversation = conversationId ? conversationStorage.getConversation(conversationId) : null
    if (!conversation) {
      console.log('🆕 Creating new conversation')
      conversation = conversationStorage.createNewConversation(userId, campaignId)
    }

    // Add user message to conversation
    conversationStorage.addMessage(conversation.conversationId, 'user', userMessage, { intent })

    // Get current provider for context
    const currentProvider = getCurrentProvider()
    console.log(`🔧 Using provider: ${currentProvider}`)

    // Build context-aware prompt
    const conversationContext = buildConversationContext(conversation, currentProvider)
    const prompt = buildConversationalPrompt(userMessage, conversationContext, currentProvider)

    console.log('🤖 Sending conversational request to OpenAI...')

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are Alex, an expert AI SDR assistant. You help users refine their ideal customer profile through natural conversation. Always respond with valid JSON that includes both the updated filter state and a conversational message explaining what you changed and why."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 3000
    })

    const responseContent = completion.choices[0]?.message?.content
    if (!responseContent) {
      throw new Error('No response from OpenAI')
    }

    console.log('📥 OpenAI response received')

    // Parse the response
    const parsedResponse = parseConversationalResponse(responseContent)

    // Calculate filter changes
    const filterChanges = calculateFilterChanges(conversation.currentFilters, parsedResponse.updatedFilters)

    // Update conversation state
    conversationStorage.updateFilters(
      conversation.conversationId,
      parsedResponse.updatedFilters,
      filterChanges
    )

    // Add assistant message to conversation
    conversationStorage.addMessage(
      conversation.conversationId,
      'assistant',
      parsedResponse.assistantMessage,
      {
        confidence: parsedResponse.confidence,
        filtersApplied: filterChanges.map(fc => fc.field)
      }
    )

    // Prepare response
    const response: ConversationResponse = {
      conversationId: conversation.conversationId,
      assistantMessage: parsedResponse.assistantMessage,
      updatedFilters: parsedResponse.updatedFilters,
      filterChanges,
      confidence: parsedResponse.confidence,
      reasoningExplanation: parsedResponse.reasoningExplanation,
      conflictsDetected: parsedResponse.conflictsDetected || [],
      clarificationNeeded: parsedResponse.clarificationNeeded || [],
      suggestedFollowups: parsedResponse.suggestedFollowups || []
    }

    // Log enhanced intelligence features for debugging
    if (parsedResponse.conflictsDetected && parsedResponse.conflictsDetected?.length > 0) {
      console.log(`⚠️  Conflicts detected in conversation ${conversation.conversationId}:`, parsedResponse.conflictsDetected)
    }

    if (parsedResponse.clarificationNeeded && parsedResponse.clarificationNeeded?.length > 0) {
      console.log(`❓ Clarification needed for conversation ${conversation.conversationId}:`, parsedResponse.clarificationNeeded)
    }

    console.log(`✅ Conversation updated successfully (${filterChanges.length} filter changes, confidence: ${parsedResponse.confidence}%)`)

    return NextResponse.json({
      success: true,
      conversation: response,
      provider: currentProvider,
      // Include enhanced intelligence metadata
      advancedIntelligence: {
        hasConflicts: (parsedResponse.conflictsDetected?.length || 0) > 0,
        needsClarification: (parsedResponse.clarificationNeeded?.length || 0) > 0,
        confidenceLevel: parsedResponse.confidence >= 85 ? 'high' : parsedResponse.confidence >= 70 ? 'medium' : 'low'
      }
    })

  } catch (error) {
    console.error('❌ Conversation API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof z.ZodError ? error.errors : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')
    const userId = searchParams.get('userId')

    if (conversationId) {
      // Get specific conversation
      const conversation = conversationStorage.getConversation(conversationId)
      if (!conversation) {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        )
      }
      return NextResponse.json({ success: true, conversation })
    }

    if (userId) {
      // List conversations for user
      const conversationIds = conversationStorage.listConversations(userId)
      return NextResponse.json({ success: true, conversationIds })
    }

    // List all recent conversations
    const conversationIds = conversationStorage.listConversations()
    return NextResponse.json({ success: true, conversationIds })

  } catch (error) {
    console.error('❌ Conversation GET error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve conversations' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId is required' },
        { status: 400 }
      )
    }

    conversationStorage.deleteConversation(conversationId)
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('❌ Conversation DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete conversation' },
      { status: 500 }
    )
  }
}

function buildConversationContext(conversation: ConversationState, provider: string): string {
  const recentMessages = conversation.messages.slice(-6) // Last 6 messages for context
  const currentFilters = conversation.currentFilters

  // Summarize current filter state
  const filterSummary: string[] = []
  if (currentFilters.jobTitles.length > 0) filterSummary.push(`Job Titles: ${currentFilters.jobTitles.join(', ')}`)
  if (currentFilters.industries.length > 0) filterSummary.push(`Industries: ${currentFilters.industries.join(', ')}`)
  if (currentFilters.companySize.length > 0) filterSummary.push(`Company Size: ${currentFilters.companySize.join(', ')}`)
  if (currentFilters.personLocations.length > 0) filterSummary.push(`Person Locations: ${currentFilters.personLocations.join(', ')}`)
  if (currentFilters.organizationJobTitles.length > 0) filterSummary.push(`Hiring For: ${currentFilters.organizationJobTitles.join(', ')}`)
  if (currentFilters.organizationJobLocations.length > 0) filterSummary.push(`Job Locations: ${currentFilters.organizationJobLocations.join(', ')}`)

  let context = `CONVERSATION CONTEXT:\n`
  context += `Provider: ${provider}\n`
  context += `Current Filter State: ${filterSummary.length > 0 ? filterSummary.join(' | ') : 'No filters set'}\n\n`

  if (recentMessages.length > 0) {
    context += `Recent Conversation:\n`
    recentMessages.forEach(msg => {
      context += `${msg.role === 'user' ? 'User' : 'Alex'}: ${msg.content}\n`
    })
    context += `\n`
  }

  return context
}

function buildConversationalPrompt(userMessage: string, context: string, provider: string): string {
  return `${context}

NEW USER MESSAGE: "${userMessage}"

You are Alex, an expert AI SDR with advanced conversation intelligence. The user wants to update their target audience filters based on their message.

ADVANCED CONVERSATION INTELLIGENCE CAPABILITIES:

1. **NEGATION HANDLING**:
   - "not CTO" → excludeJobTitles: ["CTO"]
   - "exclude startups" → excludeIndustries: ["Startup"] or companySize excludes small ranges
   - "don't want remote" → excludePersonLocations: ["Remote"]
   - "no technology companies" → excludeIndustries: ["Technology"]

2. **ALTERNATIVES PROCESSING**:
   - "CTO or CMO" → jobTitles: ["CTO", "CMO"]
   - "either healthcare or fintech" → industries: ["Healthcare", "Financial Services"]
   - "VP Sales or Director of Sales" → jobTitles: ["VP Sales", "Director of Sales"]
   - "San Francisco, New York, or Austin" → personLocations: ["San Francisco", "New York", "Austin"]

3. **CONTEXTUAL REFERENCES**:
   - "change that to CMO" → Replace the most recently mentioned job title with "CMO"
   - "remove the previous" → Remove the last added filter item
   - "add more like that" → Expand similar items to the last added filter
   - "make it broader" → Expand current criteria to include similar/related items
   - "be more specific" → Narrow down current criteria to more specific variants

4. **TEMPORAL EXPRESSIONS** (convert to dates based on current date: ${new Date().toISOString().split('T')[0]}):
   - "last month" → organizationJobPostedAtMin: "${new Date(Date.now() - 30*24*60*60*1000).toISOString().split('T')[0]}"
   - "past 3 months" → organizationJobPostedAtMin: "${new Date(Date.now() - 90*24*60*60*1000).toISOString().split('T')[0]}"
   - "recently" → organizationJobPostedAtMin: "${new Date(Date.now() - 14*24*60*60*1000).toISOString().split('T')[0]}"
   - "past 6 months" → organizationJobPostedAtMin: "${new Date(Date.now() - 180*24*60*60*1000).toISOString().split('T')[0]}"
   - "this year" → organizationJobPostedAtMin: "${new Date().getFullYear()}-01-01"

5. **INTELLIGENT CONFLICT RESOLUTION**:
   - If user requests contradictory requirements, suggest alternatives
   - If filters would result in very narrow results, warn and suggest broadening
   - If excluding and including similar items, clarify intent
   - Example: "Add CTO but exclude technology companies" → Suggest: "This might limit results significantly. CTOs are common in tech. Would you prefer CTOs in non-tech industries or CTOs in specific industries?"

6. **CONFIDENCE SCORING LOGIC**:
   - 95-100: Clear, unambiguous instructions with specific values
   - 85-94: Clear intent but may need minor interpretation
   - 70-84: Reasonable interpretation required, some ambiguity
   - 50-69: Significant ambiguity, assumptions made
   - 30-49: High uncertainty, may need clarification
   - <30: Very unclear, requires clarification

7. **CLARIFICATION PROMPTS** (for ambiguous requests):
   - Low confidence (< 70): Include specific clarifying questions
   - Ask for specifics when vague terms are used
   - Offer alternatives when multiple interpretations possible

8. **CONTEXTUAL FILTER EVOLUTION**:
   - Track why filters were added (hiring signals, exclusions, preferences)
   - Maintain filter relationships (e.g., if excluding tech, suggest non-tech alternatives)
   - Remember user preferences and apply consistently

INTELLIGENT PARSING EXAMPLES:
- "Change CTO to CMO" → Replace jobTitles: ['CTO'] with ['CMO'], confidence: 95
- "Not interested in startups anymore" → Add to excludeIndustries: ['Startup'], update companySize to exclude small ranges, confidence: 85
- "Add companies hiring developers" → organizationJobTitles: ['developer', 'software developer', 'software engineer'], jobPostings: true, confidence: 90
- "Remove the previous location" → Remove last added location from relevant location array, confidence: depends on context clarity
- "Make the job titles broader" → Expand current jobTitles with related roles, confidence: 75 (ask for specifics)
- "Companies that posted jobs recently" → organizationJobPostedAtMin: recent date, jobPostings: true, confidence: 88

ADVANCED RESPONSE REQUIREMENTS:
- Always explain your reasoning for interpretations
- If confidence < 70, include clarifying questions
- If detecting conflicts, address them explicitly
- Suggest next logical refinements
- Use natural, conversational language as Alex
- Reference the specific changes you're making

Respond with JSON in this exact format:
{
  "assistantMessage": "Natural conversational response explaining changes, reasoning, and any clarifications needed",
  "updatedFilters": {
    "searchType": "people",
    "jobTitles": [],
    "excludeJobTitles": [],
    "seniorities": [],
    "personLocations": [],
    "excludePersonLocations": [],
    "industries": [],
    "excludeIndustries": [],
    "organizationLocations": [],
    "excludeOrganizationLocations": [],
    "companySize": [],
    "revenueMin": null,
    "revenueMax": null,
    "technologies": [],
    "excludeTechnologies": [],
    "organizationJobTitles": [],
    "organizationJobLocations": [],
    "organizationNumJobsMin": null,
    "organizationNumJobsMax": null,
    "organizationJobPostedAtMin": null,
    "organizationJobPostedAtMax": null,
    "fundingStages": [],
    "fundingAmountMin": null,
    "fundingAmountMax": null,
    "foundedYearMin": null,
    "foundedYearMax": null,
    "jobPostings": null,
    "newsEvents": null,
    "webTraffic": null,
    "keywords": [],
    "intentTopics": [],
    "companyDomains": []
  },
  "confidence": 85,
  "reasoningExplanation": "Detailed explanation of interpretation logic and assumptions made",
  "conflictsDetected": ["List any conflicting requirements or potential issues"],
  "clarificationNeeded": ["Specific questions to ask if confidence < 70"],
  "suggestedFollowups": ["Contextually relevant next steps or refinements"]
}`
}

function parseConversationalResponse(responseContent: string): {
  assistantMessage: string
  updatedFilters: ConversationState['currentFilters']
  confidence: number
  reasoningExplanation?: string
  conflictsDetected?: string[]
  clarificationNeeded?: string[]
  suggestedFollowups?: string[]
} {
  // Clean the response content
  let cleanedContent = responseContent.trim()

  if (cleanedContent.startsWith('```json')) {
    cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '')
  } else if (cleanedContent.startsWith('```')) {
    cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '')
  }

  cleanedContent = cleanedContent.replace(/^`+|`+$/g, '')

  try {
    const parsed = JSON.parse(cleanedContent)

    // Validate that required fields are present
    if (!parsed.assistantMessage || !parsed.updatedFilters || typeof parsed.confidence !== 'number') {
      throw new Error('Missing required response fields')
    }

    // Validate confidence score is within valid range
    if (parsed.confidence < 0 || parsed.confidence > 100) {
      console.warn('Invalid confidence score, defaulting to 50:', parsed.confidence)
      parsed.confidence = 50
    }

    // Log advanced intelligence features being used
    if (parsed.conflictsDetected?.length > 0) {
      console.log('🚨 Conflicts detected:', parsed.conflictsDetected)
    }

    if (parsed.clarificationNeeded?.length > 0) {
      console.log('❓ Clarification needed:', parsed.clarificationNeeded)
    }

    if (parsed.reasoningExplanation) {
      console.log('🧠 AI reasoning:', parsed.reasoningExplanation.substring(0, 100) + '...')
    }

    return {
      assistantMessage: parsed.assistantMessage,
      updatedFilters: parsed.updatedFilters,
      confidence: parsed.confidence,
      reasoningExplanation: parsed.reasoningExplanation,
      conflictsDetected: parsed.conflictsDetected || [],
      clarificationNeeded: parsed.clarificationNeeded || [],
      suggestedFollowups: parsed.suggestedFollowups || []
    }
  } catch (error) {
    console.error('Failed to parse enhanced conversational response:', error)
    throw new Error(`Failed to parse AI response: ${error}`)
  }
}

function calculateFilterChanges(oldFilters: ConversationState['currentFilters'], newFilters: ConversationState['currentFilters']): FilterEvolution[] {
  const changes: FilterEvolution[] = []
  const now = new Date()

  // Compare each field and track changes
  Object.keys(newFilters).forEach(field => {
    const oldValue = oldFilters[field]
    const newValue = newFilters[field]

    // Handle array fields
    if (Array.isArray(newValue) && Array.isArray(oldValue)) {
      const added = newValue.filter(v => !oldValue.includes(v))
      const removed = oldValue.filter(v => !newValue.includes(v))

      if (added.length > 0) {
        changes.push({
          timestamp: now,
          action: 'add',
          field,
          previousValue: oldValue,
          newValue: added,
          reason: `Added ${added.join(', ')} to ${field}`
        })
      }

      if (removed.length > 0) {
        changes.push({
          timestamp: now,
          action: 'remove',
          field,
          previousValue: removed,
          newValue: oldValue,
          reason: `Removed ${removed.join(', ')} from ${field}`
        })
      }
    }
    // Handle primitive fields
    else if (oldValue !== newValue) {
      changes.push({
        timestamp: now,
        action: 'replace',
        field,
        previousValue: oldValue,
        newValue: newValue,
        reason: `Changed ${field} from ${oldValue} to ${newValue}`
      })
    }
  })

  return changes
}