// Conversation state management types for AI SDR (Alex)

export interface ConversationMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  metadata?: {
    confidence?: number
    filtersApplied?: string[]
    processingTime?: number
  }
}

export interface FilterEvolution {
  timestamp: Date
  action: 'initial' | 'add' | 'remove' | 'replace' | 'refine'
  field: string
  previousValue?: any
  newValue?: any
  reason?: string
}

export interface ConversationState {
  conversationId: string
  userId?: string
  campaignId?: string

  // Message history
  messages: ConversationMessage[]
        // Current filter state (matches ParsedICP structure)
        currentFilters: {
          // Basic search info
        searchType: 'people' | 'company'

        // Person-level filters
        jobTitles: string[]
        seniorities: string[]
        personLocations?: string[]

        // Company-level filters
        organizationLocations?: string[]
        companySize: string[]
        revenueMin?: number | null
        revenueMax?: number | null
        technologies: string[]
        excludeTechnologies?: string[]

        // Organization job filters (hiring signals)
        organizationJobTitles?: string[]
        organizationJobLocations?: string[]
        organizationNumJobsMin?: number | null
        organizationNumJobsMax?: number | null
        organizationJobPostedAtMin?: string | null
        organizationJobPostedAtMax?: string | null

        // Funding & growth signals
        fundingAmountMin?: number | null
        fundingAmountMax?: number | null

        // Other filters
        keywords: string[]
        companyDomains?: string[]
  }

  // Filter evolution history
  filterEvolution: FilterEvolution[]

  // Conversation metadata
  metadata: {
    createdAt: Date
    updatedAt: Date
    totalMessages: number
    lastActivity: Date
    conversationStatus: 'active' | 'completed' | 'archived'
    overallConfidence?: number
    provider: 'apollo' | 'explorium'
  }
}

export interface ConversationUpdate {
  userMessage: string
  intent?: 'initial' | 'add' | 'remove' | 'replace' | 'refine' | 'clarify'
  previousConversationId?: string
}

export interface ConversationResponse {
  conversationId: string
  assistantMessage: string
  updatedFilters: ConversationState['currentFilters']
  filterChanges: FilterEvolution[]
  confidence: number
  reasoningExplanation?: string
  conflictsDetected?: string[]
  clarificationNeeded?: string[]
  suggestedFollowups?: string[]
}

export interface ConversationStorage {
  // For session-based storage
  setConversation(conversationId: string, state: ConversationState): void
  getConversation(conversationId: string): ConversationState | null
  deleteConversation(conversationId: string): void
  listConversations(userId?: string): string[]

  // For cleanup
  cleanupOldConversations(olderThanHours?: number): void
}