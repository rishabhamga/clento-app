// Session-based conversation storage for AI SDR (Alex) conversations

import { ConversationState, ConversationStorage } from '@/types/conversation'

class SessionConversationStorage implements ConversationStorage {
  private storageKey = 'alex_conversations'
  private maxConversations = 10 // Limit to prevent memory bloat
  private maxAge = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

  private getStorageData(): Record<string, ConversationState> {
    if (typeof window === 'undefined') {
      // Server-side: use in-memory storage (will be lost on restart)
      return (global as any).__alexConversations || {}
    }

    try {
      const data = localStorage.getItem(this.storageKey)
      if (!data) return {}

      const parsed = JSON.parse(data)
      // Convert date strings back to Date objects
      Object.values(parsed).forEach((conversation: any) => {
        conversation.metadata.createdAt = new Date(conversation.metadata.createdAt)
        conversation.metadata.updatedAt = new Date(conversation.metadata.updatedAt)
        conversation.metadata.lastActivity = new Date(conversation.metadata.lastActivity)
        conversation.messages.forEach((msg: any) => {
          msg.timestamp = new Date(msg.timestamp)
        })
        conversation.filterEvolution.forEach((evolution: any) => {
          evolution.timestamp = new Date(evolution.timestamp)
        })
      })
      return parsed
    } catch (error) {
      console.warn('Failed to parse conversation storage:', error)
      return {}
    }
  }

  private setStorageData(data: Record<string, ConversationState>): void {
    if (typeof window === 'undefined') {
      // Server-side: store in global
      (global as any).__alexConversations = data
      return
    }

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to save conversation storage:', error)
    }
  }

  setConversation(conversationId: string, state: ConversationState): void {
    const data = this.getStorageData()
    data[conversationId] = {
      ...state,
      metadata: {
        ...state.metadata,
        updatedAt: new Date(),
        lastActivity: new Date()
      }
    }

    // Cleanup old conversations if we're at the limit
    this.cleanupIfNeeded(data)
    this.setStorageData(data)
  }

  getConversation(conversationId: string): ConversationState | null {
    const data = this.getStorageData()
    return data[conversationId] || null
  }

  deleteConversation(conversationId: string): void {
    const data = this.getStorageData()
    delete data[conversationId]
    this.setStorageData(data)
  }

  listConversations(userId?: string): string[] {
    const data = this.getStorageData()
    const conversations = Object.values(data)

    if (userId) {
      return conversations
        .filter(conv => conv.userId === userId)
        .sort((a, b) => b.metadata.lastActivity.getTime() - a.metadata.lastActivity.getTime())
        .map(conv => conv.conversationId)
    }

    return conversations
      .sort((a, b) => b.metadata.lastActivity.getTime() - a.metadata.lastActivity.getTime())
      .map(conv => conv.conversationId)
  }

  cleanupOldConversations(olderThanHours: number = 24): void {
    const data = this.getStorageData()
    const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000)

    Object.keys(data).forEach(conversationId => {
      const conversation = data[conversationId]
      if (conversation.metadata.lastActivity.getTime() < cutoffTime) {
        delete data[conversationId]
      }
    })

    this.setStorageData(data)
  }

  private cleanupIfNeeded(data: Record<string, ConversationState>): void {
    const conversations = Object.values(data)
    if (conversations.length <= this.maxConversations) return

    // Remove oldest conversations beyond the limit
    const sorted = conversations.sort((a, b) =>
      a.metadata.lastActivity.getTime() - b.metadata.lastActivity.getTime()
    )

    const toRemove = sorted.slice(0, conversations.length - this.maxConversations)
    toRemove.forEach(conv => {
      delete data[conv.conversationId]
    })
  }

  // Utility methods for conversation management
  createNewConversation(userId?: string, campaignId?: string): ConversationState {
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date()

    const conversation: ConversationState = {
      conversationId,
      userId,
      campaignId,
      messages: [],
      currentFilters: {
        searchType: 'people',
        jobTitles: [],
        // excludeJobTitles: [],
        seniorities: [],
        personLocations: [],
        // excludePersonLocations: [],
        // industries: [],
        // excludeIndustries: [],
        organizationLocations: [],
        // excludeOrganizationLocations: [],
        companySize: [],
        revenueMin: null,
        revenueMax: null,
        technologies: [],
        excludeTechnologies: [],
        organizationJobTitles: [],
        organizationJobLocations: [],
        organizationNumJobsMin: null,
        organizationNumJobsMax: null,
        organizationJobPostedAtMin: null,
        organizationJobPostedAtMax: null,
        // fundingStages: [],
        fundingAmountMin: null,
        fundingAmountMax: null,
        // foundedYearMin: null,
        // foundedYearMax: null,
        // jobPostings: null,
        // newsEvents: null,
        // webTraffic: null,
        keywords: [],
        // intentTopics: [],
        companyDomains: []
      },
      filterEvolution: [],
      metadata: {
        createdAt: now,
        updatedAt: now,
        totalMessages: 0,
        lastActivity: now,
        conversationStatus: 'active',
        provider: 'apollo' // Default to Apollo
      }
    }

    this.setConversation(conversationId, conversation)
    return conversation
  }

  addMessage(conversationId: string, role: 'user' | 'assistant', content: string, metadata?: any): void {
    const conversation = this.getConversation(conversationId)
    if (!conversation) return

    const message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role,
      content,
      timestamp: new Date(),
      metadata
    }

    conversation.messages.push(message)
    conversation.metadata.totalMessages = conversation.messages.length
    this.setConversation(conversationId, conversation)
  }

  updateFilters(conversationId: string, newFilters: Partial<ConversationState['currentFilters']>, evolution: any[]): void {
    const conversation = this.getConversation(conversationId)
    if (!conversation) return

    conversation.currentFilters = { ...conversation.currentFilters, ...newFilters }
    conversation.filterEvolution.push(...evolution)
    this.setConversation(conversationId, conversation)
  }
}

// Export singleton instance
export const conversationStorage = new SessionConversationStorage()

// Export utility functions
export function generateConversationId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}