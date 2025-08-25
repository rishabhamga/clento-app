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
        jobTitles: string[],
        seniorities: string[],
        personLocations: string[],
        excludePersonLocations: string[],
        hasEmail: boolean,
        industries: string[],
        companyHeadcount: string[],
        companyDomains: string[],
        intentTopics: string[],
        technologies: string[],
        technologyUids: string[],
        keywords: [],
        organizationNumJobsMin: number,
        organizationNumJobsMax: number,
        organizationJobPostedAtMin: number,
        organizationJobPostedAtMax: number,
        revenueMin: number,
        revenueMax: number,
        fundingStages: string[],
        fundingAmountMin: number,
        fundingAmountMax: number,
        foundedYearMin: string,
        foundedYearMax: string,
        jobPostings: boolean,
        newsEvents: boolean,
        webTraffic: boolean,
        // org filters
        organizationNumEmployeesRange: string[],
        organizationLocations: string[],
        excludeOrganizationLocations: string[],
        revenueRangeMin: number,
        revenueRangeMax: number,
        companyTechnologies: string[],
        companyKeywords: string[],
        organizationName: string,
        organizationIds: string,
        latestFundingAmountMin: number,
        latestFundingAmountMax: number,
        totalFundingMin: number,
        totalFundingMax: number,
        latestFundingDateRangeMin: string,
        latestFundingDateRangeMax: string,
        organizationJobTitles: string[],
        organizationJobLocations: string[],
        organizationJobsMin: number,
        organizationJobsMax: number,
        organizationJobPostedAtRangeMin: string,
        organizationJobPostedAtRangeMax: string,
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