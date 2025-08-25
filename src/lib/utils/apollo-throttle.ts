// Apollo Request Throttling and Rate Limiting
// Prevents hitting Apollo API rate limits and manages request queuing

export interface ThrottleConfig {
  maxConcurrentRequests: number
  requestsPerSecond: number
  requestsPerMinute: number
  requestsPerHour: number
  requestsPerDay: number
  burstAllowance: number
}

export interface RequestMetrics {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  rateLimitedRequests: number
  averageResponseTime: number
  lastRequestTime: Date
  nextAllowedRequestTime: Date
}

export interface QueuedRequest {
  id: string
  userId: string
  requestType: 'search' | 'enrichment' | 'lookup'
  priority: 'high' | 'medium' | 'low'
  createdAt: Date
  retryCount: number
  resolve: (value: any) => void
  reject: (error: any) => void
  requestFn: () => Promise<any>
}

// Default throttle configuration for Apollo API
const DEFAULT_THROTTLE_CONFIG: ThrottleConfig = {
  maxConcurrentRequests: 3,      // Apollo recommends max 3 concurrent requests
  requestsPerSecond: 2,          // Conservative rate
  requestsPerMinute: 100,        // Apollo free tier limit
  requestsPerHour: 1000,         // Apollo paid tier limit
  requestsPerDay: 10000,         // Apollo enterprise limit
  burstAllowance: 5              // Allow brief bursts
}

class ApolloThrottleManager {
  private config: ThrottleConfig
  private metrics: RequestMetrics
  private requestQueue: QueuedRequest[] = []
  private activeRequests: Set<string> = new Set()
  private requestTimestamps: Date[] = []
  private isProcessingQueue = false

  // Rate limiting counters
  private requestCounts = {
    perSecond: { count: 0, resetTime: Date.now() + 1000 },
    perMinute: { count: 0, resetTime: Date.now() + 60000 },
    perHour: { count: 0, resetTime: Date.now() + 3600000 },
    perDay: { count: 0, resetTime: Date.now() + 86400000 }
  }

  constructor(config: Partial<ThrottleConfig> = {}) {
    this.config = { ...DEFAULT_THROTTLE_CONFIG, ...config }
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rateLimitedRequests: 0,
      averageResponseTime: 0,
      lastRequestTime: new Date(0),
      nextAllowedRequestTime: new Date()
    }

    // Clean up old request timestamps periodically
    setInterval(() => {
      this.cleanupOldTimestamps()
    }, 60000) // Every minute
  }

  /**
   * Execute a request with throttling and rate limiting
   */
  async executeRequest<T>(
    requestFn: () => Promise<T>,
    options: {
      userId: string
      requestType?: 'search' | 'enrichment' | 'lookup'
      priority?: 'high' | 'medium' | 'low'
      retryCount?: number
    }
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const queuedRequest: QueuedRequest = {
        id: this.generateRequestId(),
        userId: options.userId,
        requestType: options.requestType || 'search',
        priority: options.priority || 'medium',
        createdAt: new Date(),
        retryCount: options.retryCount || 0,
        resolve,
        reject,
        requestFn
      }

      this.addToQueue(queuedRequest)
      this.processQueue()
    })
  }

  /**
   * Add request to queue with priority ordering
   */
  private addToQueue(request: QueuedRequest) {
    // Insert request based on priority
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    const insertIndex = this.requestQueue.findIndex(
      req => priorityOrder[req.priority] > priorityOrder[request.priority]
    )

    if (insertIndex === -1) {
      this.requestQueue.push(request)
    } else {
      this.requestQueue.splice(insertIndex, 0, request)
    }

    console.log(`Apollo: Queued request ${request.id} (priority: ${request.priority}, queue size: ${this.requestQueue.length})`)
  }

  /**
   * Process queued requests respecting rate limits
   */
  private async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return
    }

    this.isProcessingQueue = true

    try {
      while (this.requestQueue.length > 0 && this.canMakeRequest()) {
        const request = this.requestQueue.shift()!

        if (this.activeRequests.size >= this.config.maxConcurrentRequests) {
          // Put request back at front of queue and wait
          this.requestQueue.unshift(request)
          break
        }

        this.executeQueuedRequest(request)
      }
    } finally {
      this.isProcessingQueue = false
    }

    // Schedule next processing if queue is not empty
    if (this.requestQueue.length > 0) {
      const delay = this.calculateNextRequestDelay()
      setTimeout(() => this.processQueue(), delay)
    }
  }

  /**
   * Execute a queued request
   */
  private async executeQueuedRequest(request: QueuedRequest) {
    this.activeRequests.add(request.id)
    const startTime = Date.now()

    try {
      console.log(`Apollo: Executing request ${request.id} (${request.requestType})`)

      // Update rate limiting counters
      this.updateRateLimitCounters()

      // Execute the actual request
      const result = await request.requestFn()

      // Update metrics
      const responseTime = Date.now() - startTime
      this.updateMetrics(true, responseTime)

      console.log(`Apollo: Request ${request.id} completed in ${responseTime}ms`)
      request.resolve(result)

    } catch (error) {
      const responseTime = Date.now() - startTime

      console.log(error);

      // Check if it's a rate limit error
      if (this.isRateLimitError(error)) {
        this.metrics.rateLimitedRequests++
        console.warn(`Apollo: Rate limited for request ${request.id}`)

        // Retry with backoff if under retry limit
        if (request.retryCount < 3) {
          const retryDelay = this.calculateRetryDelay(request.retryCount)
          console.log(`Apollo: Retrying request ${request.id} in ${retryDelay}ms`)

          setTimeout(() => {
            request.retryCount++
            this.addToQueue(request)
            this.processQueue()
          }, retryDelay)
        } else {
          this.updateMetrics(false, responseTime)
          request.reject(new Error(`Rate limit exceeded for request ${request.id} after ${request.retryCount} retries`))
        }
      } else {
        this.updateMetrics(false, responseTime)
        console.error(`Apollo: Request ${request.id} failed:`, error)
        request.reject(error)
      }
    } finally {
      this.activeRequests.delete(request.id)
      this.requestTimestamps.push(new Date())

      // Continue processing queue
      setTimeout(() => this.processQueue(), 100)
    }
  }

  /**
   * Check if we can make a request based on rate limits
   */
  private canMakeRequest(): boolean {
    const now = Date.now()

    // Reset counters if time windows have passed
    Object.entries(this.requestCounts).forEach(([period, counter]) => {
      if (now >= counter.resetTime) {
        counter.count = 0
        counter.resetTime = this.getNextResetTime(period as keyof typeof this.requestCounts)
      }
    })

    // Check all rate limits
    if (this.requestCounts.perSecond.count >= this.config.requestsPerSecond) return false
    if (this.requestCounts.perMinute.count >= this.config.requestsPerMinute) return false
    if (this.requestCounts.perHour.count >= this.config.requestsPerHour) return false
    if (this.requestCounts.perDay.count >= this.config.requestsPerDay) return false

    return true
  }

  /**
   * Update rate limiting counters
   */
  private updateRateLimitCounters() {
    this.requestCounts.perSecond.count++
    this.requestCounts.perMinute.count++
    this.requestCounts.perHour.count++
    this.requestCounts.perDay.count++
  }

  /**
   * Calculate delay before next request
   */
  private calculateNextRequestDelay(): number {
    const baseDelay = 1000 / this.config.requestsPerSecond // Basic rate limiting

    // Add extra delay if queue is large
    const queuePenalty = Math.min(this.requestQueue.length * 100, 2000)

    // Add exponential backoff if we have recent rate limit errors
    const rateLimitPenalty = this.metrics.rateLimitedRequests > 0 ?
      Math.min(Math.pow(2, this.metrics.rateLimitedRequests) * 1000, 30000) : 0

    return baseDelay + queuePenalty + rateLimitPenalty
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(retryCount: number): number {
    const baseDelay = 1000 // 1 second
    const exponentialDelay = Math.pow(2, retryCount) * baseDelay
    const jitter = Math.random() * 1000 // Add jitter to prevent thundering herd

    return Math.min(exponentialDelay + jitter, 60000) // Max 1 minute
  }

  /**
   * Check if error is due to rate limiting
   */
  private isRateLimitError(error: any): boolean {
    if (error?.response?.status === 429) return true
    if (error?.message?.toLowerCase().includes('rate limit')) return true
    if (error?.message?.toLowerCase().includes('too many requests')) return true
    return false
  }

  /**
   * Update request metrics
   */
  private updateMetrics(success: boolean, responseTime: number) {
    this.metrics.totalRequests++
    this.metrics.lastRequestTime = new Date()

    if (success) {
      this.metrics.successfulRequests++
    } else {
      this.metrics.failedRequests++
    }

    // Update average response time
    const totalResponseTime = this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + responseTime
    this.metrics.averageResponseTime = totalResponseTime / this.metrics.totalRequests
  }

  /**
   * Get next reset time for rate limit period
   */
  private getNextResetTime(period: keyof typeof this.requestCounts): number {
    const now = Date.now()
    switch (period) {
      case 'perSecond': return now + 1000
      case 'perMinute': return now + 60000
      case 'perHour': return now + 3600000
      case 'perDay': return now + 86400000
      default: return now + 1000
    }
  }

  /**
   * Clean up old request timestamps
   */
  private cleanupOldTimestamps() {
    const oneHourAgo = new Date(Date.now() - 3600000)
    this.requestTimestamps = this.requestTimestamps.filter(
      timestamp => timestamp > oneHourAgo
    )
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `apollo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get current metrics
   */
  getMetrics(): RequestMetrics {
    return { ...this.metrics }
  }

  /**
   * Get queue status
   */
  getQueueStatus() {
    return {
      queueLength: this.requestQueue.length,
      activeRequests: this.activeRequests.size,
      isProcessing: this.isProcessingQueue,
      rateLimits: {
        perSecond: this.requestCounts.perSecond,
        perMinute: this.requestCounts.perMinute,
        perHour: this.requestCounts.perHour,
        perDay: this.requestCounts.perDay
      }
    }
  }

  /**
   * Update throttle configuration
   */
  updateConfig(newConfig: Partial<ThrottleConfig>) {
    this.config = { ...this.config, ...newConfig }
    console.log('Apollo: Throttle configuration updated:', this.config)
  }

  /**
   * Clear queue (emergency stop)
   */
  clearQueue() {
    const clearedCount = this.requestQueue.length
    this.requestQueue.forEach(request => {
      request.reject(new Error('Request queue cleared'))
    })
    this.requestQueue = []
    console.log(`Apollo: Cleared ${clearedCount} requests from queue`)
  }

  /**
   * Get estimated wait time for new request
   */
  getEstimatedWaitTime(): number {
    if (!this.canMakeRequest()) {
      return this.calculateNextRequestDelay()
    }

    const queuePosition = this.requestQueue.length
    const averageRequestTime = this.metrics.averageResponseTime || 2000

    return queuePosition * averageRequestTime
  }
}

// Singleton instance
let throttleManager: ApolloThrottleManager | null = null

export function getApolloThrottleManager(config?: Partial<ThrottleConfig>): ApolloThrottleManager {
  if (!throttleManager) {
    throttleManager = new ApolloThrottleManager(config)
  }
  return throttleManager
}

export function createApolloThrottleManager(config?: Partial<ThrottleConfig>): ApolloThrottleManager {
  return new ApolloThrottleManager(config)
}

// Export singleton instance
export const apolloThrottle = getApolloThrottleManager()

export { ApolloThrottleManager }