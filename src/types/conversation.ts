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
        jobTitles: [],
        seniorities: [],
        personLocations: [],
        excludePersonLocations: [],
        hasEmail: null,
        industries: [],
        companyHeadcount: [],
        companyDomains: [],
        intentTopics: [],
        technologies: [],
        technologyUids: [],
        excludeTechnologyUids: [],
        keywords: [],
        organizationNumJobsMin: null,
        organizationNumJobsMax: null,
        organizationJobPostedAtMin: null,
        organizationJobPostedAtMax: null,
        revenueMin: null,
        revenueMax: null,
        fundingStages: [],
        fundingAmountMin: null,
        fundingAmountMax: null,
        foundedYearMin: null,
        foundedYearMax: null,
        jobPostings: null,
        newsEvents: null,
        webTraffic: null,
        // org filters
        organizationNumEmployeesRange: [],
        organizationLocations: [],
        excludeOrganizationLocations: [],
        revenueRangeMin: 0,
        revenueRangeMax: 0,
        companyTechnologies: [],
        companyKeywords: [],
        organizationName: '',
        organizationIds: '',
        latestFundingAmountMin: 0,
        latestFundingAmountMax: 0,
        totalFundingMin: 0,
        totalFundingMax: 0,
        latestFundingDateRangeMin: '',
        latestFundingDateRangeMax: '',
        organizationJobTitles: [],
        organizationJobLocations: [],
        organizationJobsMin: 0,
        organizationJobsMax: 0,
        organizationJobPostedAtRangeMin: '',
        organizationJobPostedAtRangeMax: '',
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