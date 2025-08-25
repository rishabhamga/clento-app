import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { z } from 'zod'
import { conversationStorage } from '@/lib/conversation-storage'
import { ConversationUpdate, ConversationResponse, FilterEvolution, ConversationState } from '@/types/conversation'
import { getCurrentProvider } from '@/lib/data-providers/provider-manager'
import { SearchType } from '../../../../types/apollo'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

// Schema for conversation update requests
const ConversationUpdateSchema = z.object({
    userMessage: z.string().min(1),
    conversationId: z.string().optional(),
    intent: z.enum(['initial', 'add', 'remove', 'replace', 'refine', 'clarify']).optional(),
    userId: z.string().optional(),
    campaignId: z.string().optional(),
    searchType: z.enum(['people', 'company', 'csv_upload']).optional(),
    currentFilters: z.any().optional()
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
        // console.log(body, "this is the convo body");
        const { userMessage, conversationId, intent, userId, campaignId, searchType, currentFilters: frontendFilters } = ConversationUpdateSchema.parse(body)

        console.log(`💬 Conversation update: ${intent || 'auto'} - "${userMessage.substring(0, 50)}..."`)

        // Get or create conversation
        let conversation = conversationId ? conversationStorage.getConversation(conversationId) : null
        if (!conversation) {
            console.log('🆕 Creating new conversation')
            conversation = conversationStorage.createNewConversation(userId, campaignId)
        }

        // If the frontend supplied a snapshot of current filters, merge/use it as the
        // effective current filter state for this prompt. This ensures the AI sees
        // both people and company filters as the UI currently has them.
        const effectiveFilters = frontendFilters && Object.keys(frontendFilters).length > 0
            ? { ...conversation.currentFilters, ...frontendFilters }
            : conversation.currentFilters

        // Persist the effective filters on the conversation object so later diffs
        // and updates are computed against the same baseline.
        conversation.currentFilters = effectiveFilters

        // Add user message to conversation
        conversationStorage.addMessage(conversation.conversationId, 'user', userMessage, { intent })

        // Get current provider for context
        const currentProvider = getCurrentProvider()
        console.log(`🔧 Using provider: ${currentProvider}`)

        // Build context-aware prompt and include the active searchType
        const conversationContext = buildConversationContext(conversation, currentProvider, effectiveFilters, searchType)
        const prompt = buildConversationalPrompt(userMessage, conversationContext, currentProvider, searchType)

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

        console.log('📥 OpenAI response received', responseContent)

        // Parse the response
        const parsedResponse = parseConversationalResponse(responseContent)

        // Normalize alias keys from parsed response so we compare the same canonical fields
        // Use `any` because parsedResponse.updatedFilters comes from the AI and is loosely typed
        const normalizedUpdatedFilters: any = { ...parsedResponse.updatedFilters }
        console.log("need to check this", normalizedUpdatedFilters);

        // companySize (legacy) -> companyHeadcount (canonical)
        if (Array.isArray(normalizedUpdatedFilters.companySize) && !normalizedUpdatedFilters.companyHeadcount) {
            normalizedUpdatedFilters.companyHeadcount = normalizedUpdatedFilters.companySize
            // keep companySize in source for debugging, but remove to avoid duplicate diffs
            delete normalizedUpdatedFilters.companySize
        }

        // Merge technology fields into canonical `technologyUids` used by the UI
        // Accept `technologies` or `companyTechnologies` as aliases from the AI
        const techSources: string[] = []
        if (Array.isArray(normalizedUpdatedFilters.technologies)) techSources.push('technologies')
        if (Array.isArray(normalizedUpdatedFilters.companyTechnologies)) techSources.push('companyTechnologies')
        if (techSources.length > 0 && !normalizedUpdatedFilters.technologyUids) {
            // Merge unique values preserving order
            const merged: any[] = []
            techSources.forEach(key => {
                (normalizedUpdatedFilters[key] || []).forEach((v: any) => {
                    if (!merged.map(String).includes(String(v))) merged.push(v)
                })
            })
            normalizedUpdatedFilters.technologyUids = merged
        }
        // Remove aliases to avoid duplicate change entries
        delete normalizedUpdatedFilters.technologies
        delete normalizedUpdatedFilters.companyTechnologies

        // excludeTechnologies -> excludeTechnologyUids
        if (Array.isArray(normalizedUpdatedFilters.excludeTechnologies) && !normalizedUpdatedFilters.excludeTechnologyUids) {
            normalizedUpdatedFilters.excludeTechnologyUids = normalizedUpdatedFilters.excludeTechnologies
        }
        delete normalizedUpdatedFilters.excludeTechnologies

        // Normalize revenue range aliases: prefer revenueMin/revenueMax as canonical
        if ((normalizedUpdatedFilters.revenueRangeMin !== undefined || normalizedUpdatedFilters.revenueRangeMax !== undefined) && (normalizedUpdatedFilters.revenueMin === undefined && normalizedUpdatedFilters.revenueMax === undefined)) {
            if (normalizedUpdatedFilters.revenueRangeMin !== undefined) normalizedUpdatedFilters.revenueMin = normalizedUpdatedFilters.revenueRangeMin
            if (normalizedUpdatedFilters.revenueRangeMax !== undefined) normalizedUpdatedFilters.revenueMax = normalizedUpdatedFilters.revenueRangeMax
        }
        // Remove range aliases to prevent duplicate diffs
        delete normalizedUpdatedFilters.revenueRangeMin
        delete normalizedUpdatedFilters.revenueRangeMax

        // Helper to normalize filters (apply same canonical mapping to both old and new)
        const normalizeFilters = (input: any) => {
            if (!input) return {}
            const out: any = { ...input }

            // companySize -> companyHeadcount
            if (Array.isArray(out.companySize) && !out.companyHeadcount) {
                out.companyHeadcount = out.companySize
            }

            // Merge technology aliases into technologyUids
            const techSrc: string[] = []
            if (Array.isArray(out.technologies)) techSrc.push('technologies')
            if (Array.isArray(out.companyTechnologies)) techSrc.push('companyTechnologies')
            if (techSrc.length > 0 && !out.technologyUids) {
                const merged: any[] = []
                techSrc.forEach(k => (out[k] || []).forEach((v: any) => { if (!merged.map(String).includes(String(v))) merged.push(v) }))
                out.technologyUids = merged
            }

            // excludeTechnologies alias
            if (Array.isArray(out.excludeTechnologies) && !out.excludeTechnologyUids) {
                out.excludeTechnologyUids = out.excludeTechnologies
            }

            // revenueRange -> revenueMin/Max
            if ((out.revenueRangeMin !== undefined || out.revenueRangeMax !== undefined) && (out.revenueMin === undefined && out.revenueMax === undefined)) {
                if (out.revenueRangeMin !== undefined) out.revenueMin = out.revenueRangeMin
                if (out.revenueRangeMax !== undefined) out.revenueMax = out.revenueRangeMax
            }

            // organizationJobPostedAtRange -> organizationJobPostedAtMin/Max
            if (out.organizationJobPostedAtRangeMin && !out.organizationJobPostedAtMin) {
                out.organizationJobPostedAtMin = out.organizationJobPostedAtRangeMin
            }
            if (out.organizationJobPostedAtRangeMax && !out.organizationJobPostedAtMax) {
                out.organizationJobPostedAtMax = out.organizationJobPostedAtRangeMax
            }

            // Drop UI/pagination keys that should not trigger filter diffs
            delete out.page
            delete out.perPage
            delete out.limit
            delete out.offset
            delete out.sort

            // Remove alias fields to keep canonical output clean
            delete out.companySize
            delete out.technologies
            delete out.companyTechnologies
            delete out.excludeTechnologies
            delete out.revenueRangeMin
            delete out.revenueRangeMax
            delete out.organizationJobPostedAtRangeMin
            delete out.organizationJobPostedAtRangeMax

            return out
        }

        // Calculate filter changes against the conversation's canonical currentFilters
        const filterChanges = calculateFilterChanges(conversation.currentFilters, normalizedUpdatedFilters)

        // Update conversation state
        conversationStorage.updateFilters(
            conversation.conversationId,
            normalizedUpdatedFilters,
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
            // Return the normalized, canonical filters to the UI
            updatedFilters: normalizedUpdatedFilters,
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

function buildConversationContext(conversation: ConversationState, provider: string, effectiveFilters?: any, searchType?: SearchType): string {
    const recentMessages = conversation.messages.slice(-6) // Last 6 messages for context
    // Prefer effectiveFilters passed in; fall back to conversation.currentFilters
    const currentFilters = effectiveFilters || conversation.currentFilters || {}

    // Summarize person-level filters
    const personSummary: string[] = []
    if (Array.isArray(currentFilters.jobTitles) && currentFilters.jobTitles.length > 0) personSummary.push(`Job Titles: ${currentFilters.jobTitles.join(', ')}`)
    if (Array.isArray(currentFilters.seniorities) && currentFilters.seniorities.length > 0) personSummary.push(`Seniorities: ${currentFilters.seniorities.join(', ')}`)
    if (Array.isArray(currentFilters.personLocations) && currentFilters.personLocations.length > 0) personSummary.push(`Person Locations: ${currentFilters.personLocations.join(', ')}`)

    // Summarize company-level filters
    const companySummary: string[] = []
    if (Array.isArray(currentFilters.organizationLocations) && currentFilters.organizationLocations.length > 0) companySummary.push(`Organization Locations: ${currentFilters.organizationLocations.join(', ')}`)
    if (Array.isArray(currentFilters.companySize) && currentFilters.companySize.length > 0) companySummary.push(`Company Size: ${currentFilters.companySize.join(', ')}`)
    if (Array.isArray(currentFilters.technologies) && currentFilters.technologies.length > 0) companySummary.push(`Technologies: ${currentFilters.technologies.join(', ')}`)
    if (Array.isArray(currentFilters.companyDomains) && currentFilters.companyDomains.length > 0) companySummary.push(`Company Domains: ${currentFilters.companyDomains.join(', ')}`)

    let context = `CONVERSATION CONTEXT:\n`
    context += `Provider: ${provider}\n`
    context += `Active Search Type: ${searchType || 'unspecified'}\n`
    context += `Person Filters: ${personSummary.length > 0 ? personSummary.join(' | ') : 'None'}\n`
    context += `Company Filters: ${companySummary.length > 0 ? companySummary.join(' | ') : 'None'}\n\n`

    if (recentMessages.length > 0) {
        context += `Recent Conversation:\n`
        recentMessages.forEach(msg => {
            context += `${msg.role === 'user' ? 'User' : 'Alex'}: ${msg.content}\n`
        })
        context += `\n`
    }

    return context
}

function buildConversationalPrompt(userMessage: string, context: string, provider: string, searchType?: SearchType): string {
    const resolvedSearchType = searchType || 'people'
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
   - "last month" → organizationJobPostedAtMin: "${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}"
   - "past 3 months" → organizationJobPostedAtMin: "${new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}"
   - "recently" → organizationJobPostedAtMin: "${new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}"
   - "past 6 months" → organizationJobPostedAtMin: "${new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}"
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
    "searchType": ${resolvedSearchType},
    "jobTitles": [],
    "seniorities": [],
    "personLocations": [],
    "excludePersonLocations": [],
    "hasEmail": null,
    "industries": [],
    "companyHeadcount": [],
    "companyDomains": [],
    "intentTopics": [],
    "technologies": [],
    "technologyUids": [],
    "excludeTechnologyUids": [],
    "keywords": [],
    "organizationNumJobsMin": null,
    "organizationNumJobsMax": null,
    "organizationJobPostedAtMin": null,
    "organizationJobPostedAtMax": null,
    "revenueMin": null,
    "revenueMax": null,
    "fundingStages": [],
    "fundingAmountMin": null,
    "fundingAmountMax": null,
    "foundedYearMin": null,
    "foundedYearMax": null,
    "jobPostings": null,
    "newsEvents": null,
    "webTraffic": null,
    "organizationNumEmployeesRange": [],
    "organizationLocations": [],
    "excludeOrganizationLocations": [],
    "revenueRangeMin": 0,
    "revenueRangeMax": 0,
    "companyTechnologies": [],
    "companyKeywords": [],
    "organizationName": '',
    "organizationIds": '',
    "latestFundingAmountMin": 0,
    "latestFundingAmountMax": 0,
    "totalFundingMin": 0,
    "totalFundingMax": 0,
    "latestFundingDateRangeMin": '',
    "latestFundingDateRangeMax": '',
    "organizationJobTitles": [],
    "organizationJobLocations": [],
    "organizationJobsMin": 0,
    "organizationJobsMax": 0,
    "organizationJobPostedAtRangeMin": '',
    "organizationJobPostedAtRangeMax": ''
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

    // Build union of keys from both old and new so we don't miss removals
    const keys = Array.from(new Set([...(oldFilters ? Object.keys(oldFilters) : []), ...(newFilters ? Object.keys(newFilters) : [])]))

    // Helper to compare arrays as sets (ignore order and treat null/undefined as empty)
    const arrayAsSetEquals = (a: any, b: any) => {
        const A = Array.isArray(a) ? a.map(String) : []
        const B = Array.isArray(b) ? b.map(String) : []
        if (A.length !== B.length) return false
        const s = new Set(A)
        return B.every(x => s.has(x))
    }

    keys.forEach(field => {
        const oldValue = oldFilters ? oldFilters[field] : undefined
        const newValue = newFilters ? newFilters[field] : undefined

        // If both are arrays (or one is undefined/null and the other is empty), compare as sets
        if (Array.isArray(oldValue) || Array.isArray(newValue)) {
            const oldArr = Array.isArray(oldValue) ? oldValue : []
            const newArr = Array.isArray(newValue) ? newValue : []

            // If sets are equal, no change
            if (arrayAsSetEquals(oldArr, newArr)) return

            const oldSet = new Set(oldArr.map(String))
            const newSet = new Set(newArr.map(String))
            const added = newArr.filter(v => !oldSet.has(String(v)))
            const removed = oldArr.filter(v => !newSet.has(String(v)))

            // Choose a single action type for this field to avoid multiple entries per field
            let action: FilterEvolution['action'] = 'replace'
            if (added.length > 0 && removed.length === 0) action = 'add'
            else if (removed.length > 0 && added.length === 0) action = 'remove'
            else action = 'replace'

            changes.push({
                timestamp: now,
                action,
                field,
                previousValue: oldArr,
                newValue: newArr,
                reason: `Updated ${field}`
            })
            return
        }

        // Treat null/undefined equivalently for primitives
        const oldNull = oldValue === undefined || oldValue === null
        const newNull = newValue === undefined || newValue === null
        if (oldNull && newNull) return

        // Primitive/other types: shallow compare via JSON stringify for stable detection
        const oldSerialized = typeof oldValue === 'object' ? JSON.stringify(oldValue) : String(oldValue)
        const newSerialized = typeof newValue === 'object' ? JSON.stringify(newValue) : String(newValue)
        if (oldSerialized !== newSerialized) {
            changes.push({
                timestamp: now,
                action: 'replace',
                field,
                previousValue: oldValue,
                newValue: newValue,
                reason: `Changed ${field}`
            })
        }
    })

    return changes
}