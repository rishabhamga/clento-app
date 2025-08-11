/**
 * Advanced Rate Limiter and Anti-Bot Protection
 * 
 * Provides sophisticated rate limiting capabilities to prevent being blocked
 * by LinkedIn and career pages. Includes exponential backoff, rotating user agents,
 * request queuing, and intelligent retry mechanisms.
 */

export interface RateLimiterConfig {
  // Basic rate limiting
  maxRequestsPerMinute: number;
  maxRequestsPerHour: number;
  maxConcurrentRequests: number;
  
  // Delay configurations
  baseDelay: number; // Base delay between requests (ms)
  randomJitter: number; // Random jitter to add (ms)
  
  // Retry configurations
  maxRetries: number;
  retryBackoffFactor: number; // Exponential backoff multiplier
  maxRetryDelay: number; // Maximum delay for retries (ms)
  
  // Circuit breaker
  circuitBreakerThreshold: number; // Failures before circuit opens
  circuitBreakerCooldown: number; // Cooldown period (ms)
  
  // User agent rotation
  userAgents: string[];
  rotateUserAgents: boolean;
  
  // Request timeout
  requestTimeout: number;
}

export interface RequestMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  rateLimitedRequests: number;
  averageResponseTime: number;
  circuitBreakerTrips: number;
  lastRequestTime: number;
}

interface RequestItem {
  url: string;
  options: RequestInit;
  resolve: (response: Response) => void;
  reject: (error: Error) => void;
  retryCount: number;
  addedAt: number;
}

interface CircuitBreakerState {
  isOpen: boolean;
  failureCount: number;
  lastFailureTime: number;
  resetCount: number; // Track number of resets
  maxResets: number; // Maximum allowed resets
}

interface WindowedCounter {
  count: number;
  windowStart: number;
}

export class AdvancedRateLimiter {
  private config: RateLimiterConfig;
  private requestQueue: RequestItem[] = [];
  private activeRequests = 0;
  private metrics: RequestMetrics;
  private circuitBreaker: CircuitBreakerState;
  
  // Rate limiting windows
  private minuteWindow: WindowedCounter;
  private hourWindow: WindowedCounter;
  
  // User agent rotation
  private currentUserAgentIndex = 0;
  
  // Request processing
  private isProcessing = false;
  private processingTimeout: NodeJS.Timeout | null = null;

  constructor(config: Partial<RateLimiterConfig> = {}) {
    this.config = {
      maxRequestsPerMinute: 30,
      maxRequestsPerHour: 500,
      maxConcurrentRequests: 3,
      baseDelay: 2000,
      randomJitter: 1000,
      maxRetries: 3,
      retryBackoffFactor: 2,
      maxRetryDelay: 30000,
      circuitBreakerThreshold: 5,
      circuitBreakerCooldown: 60000,
      rotateUserAgents: true,
      requestTimeout: 15000,
      userAgents: [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:119.0) Gecko/20100101 Firefox/119.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:119.0) Gecko/20100101 Firefox/119.0',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/119.0.0.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
      ],
      ...config
    };

    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rateLimitedRequests: 0,
      averageResponseTime: 0,
      circuitBreakerTrips: 0,
      lastRequestTime: 0
    };

    this.circuitBreaker = {
      isOpen: false,
      failureCount: 0,
      lastFailureTime: 0,
      resetCount: 0,
      maxResets: 2 // Allow maximum 2 resets per job
    };

    this.minuteWindow = { count: 0, windowStart: Date.now() };
    this.hourWindow = { count: 0, windowStart: Date.now() };
  }

  /**
   * Make a rate-limited HTTP request
   */
  public async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    return new Promise((resolve, reject) => {
      const requestItem: RequestItem = {
        url,
        options: this.enhanceRequestOptions(options),
        resolve,
        reject,
        retryCount: 0,
        addedAt: Date.now()
      };

      this.requestQueue.push(requestItem);
      this.processQueue();
    });
  }

  /**
   * Process the request queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      while (this.requestQueue.length > 0) {
        // Check circuit breaker
        if (this.isCircuitBreakerOpen()) {
          const delay = this.getRemainingCooldown();
          if (delay > 0) {
            console.log(`Circuit breaker is open, waiting ${delay}ms`);
            await this.sleep(delay);
            continue;
          } else {
            this.resetCircuitBreaker();
          }
        }

        // Check rate limits
        if (!this.canMakeRequest()) {
          const delay = this.getNextAvailableTime() - Date.now();
          if (delay > 0) {
            console.log(`Rate limit reached, waiting ${delay}ms`);
            await this.sleep(Math.min(delay, 60000)); // Max 1 minute wait
            continue;
          }
        }

        // Check concurrent request limit
        if (this.activeRequests >= this.config.maxConcurrentRequests) {
          await this.sleep(100); // Short wait before checking again
          continue;
        }

        // Process next request
        const requestItem = this.requestQueue.shift();
        if (requestItem) {
          this.processRequest(requestItem);
        }

        // Add delay between requests
        const delay = this.calculateDelay();
        if (delay > 0) {
          await this.sleep(delay);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single request
   */
  private async processRequest(requestItem: RequestItem): Promise<void> {
    this.activeRequests++;
    const startTime = Date.now();

    try {
      this.updateRateCounters();
      this.metrics.totalRequests++;

      // Create timeout signal
      const timeoutController = new AbortController();
      const timeoutId = setTimeout(() => {
        timeoutController.abort();
      }, this.config.requestTimeout);

      // Combine abort signals
      const combinedController = new AbortController();
      if (requestItem.options.signal) {
        requestItem.options.signal.addEventListener('abort', () => {
          combinedController.abort();
        });
      }
      timeoutController.signal.addEventListener('abort', () => {
        combinedController.abort();
      });

      // Make the request
      const response = await fetch(requestItem.url, {
        ...requestItem.options,
        signal: combinedController.signal
      });

      clearTimeout(timeoutId);

      // Update metrics
      const responseTime = Date.now() - startTime;
      this.updateResponseTimeMetrics(responseTime);
      this.metrics.lastRequestTime = Date.now();

      // Check if response indicates rate limiting
      if (this.isRateLimitResponse(response)) {
        this.handleRateLimit(requestItem, response);
        return;
      }

      // Check if response indicates server error (potential overload)
      if (response.status >= 500) {
        this.handleServerError(requestItem, response);
        return;
      }

      // Success
      this.metrics.successfulRequests++;
      this.resetCircuitBreakerFailures();
      requestItem.resolve(response);

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateResponseTimeMetrics(responseTime);
      this.handleRequestError(requestItem, error);
    } finally {
      this.activeRequests--;
    }
  }

  /**
   * Handle rate limit response
   */
  private async handleRateLimit(requestItem: RequestItem, response: Response): Promise<void> {
    this.metrics.rateLimitedRequests++;
    
    // Extract retry-after header if available
    const retryAfter = response.headers.get('retry-after');
    let delayMs = this.calculateRetryDelay(requestItem.retryCount);
    
    if (retryAfter) {
      const retryAfterMs = parseInt(retryAfter) * 1000;
      delayMs = Math.max(delayMs, retryAfterMs);
    }

    // Increase base delay for future requests
    this.adjustRateLimit(response.status);

    if (requestItem.retryCount < this.config.maxRetries) {
      requestItem.retryCount++;
      console.log(`Rate limited, retrying in ${delayMs}ms (attempt ${requestItem.retryCount})`);
      
      setTimeout(() => {
        this.requestQueue.unshift(requestItem);
        this.processQueue();
      }, delayMs);
    } else {
      this.metrics.failedRequests++;
      requestItem.reject(new Error(`Rate limited: ${response.status} ${response.statusText}`));
    }
  }

  /**
   * Handle server error response
   */
  private async handleServerError(requestItem: RequestItem, response: Response): Promise<void> {
    this.incrementCircuitBreakerFailures();

    if (requestItem.retryCount < this.config.maxRetries) {
      requestItem.retryCount++;
      const delayMs = this.calculateRetryDelay(requestItem.retryCount);
      
      console.log(`Server error ${response.status}, retrying in ${delayMs}ms (attempt ${requestItem.retryCount})`);
      
      setTimeout(() => {
        this.requestQueue.unshift(requestItem);
        this.processQueue();
      }, delayMs);
    } else {
      this.metrics.failedRequests++;
      requestItem.reject(new Error(`Server error: ${response.status} ${response.statusText}`));
    }
  }

  /**
   * Handle request error (network, timeout, etc.)
   */
  private async handleRequestError(requestItem: RequestItem, error: any): Promise<void> {
    this.incrementCircuitBreakerFailures();

    if (requestItem.retryCount < this.config.maxRetries && this.isRetryableError(error)) {
      requestItem.retryCount++;
      const delayMs = this.calculateRetryDelay(requestItem.retryCount);
      
      console.log(`Request error, retrying in ${delayMs}ms (attempt ${requestItem.retryCount}):`, error.message);
      
      setTimeout(() => {
        this.requestQueue.unshift(requestItem);
        this.processQueue();
      }, delayMs);
    } else {
      this.metrics.failedRequests++;
      requestItem.reject(error);
    }
  }

  /**
   * Enhance request options with anti-bot protection
   */
  private enhanceRequestOptions(options: RequestInit): RequestInit {
    const baseHeaders: Record<string, string> = {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
      'DNT': '1'
    };

    // Add rotating user agent
    if (this.config.rotateUserAgents) {
      baseHeaders['User-Agent'] = this.getNextUserAgent();
    }

    // Handle existing headers properly
    let finalHeaders: HeadersInit = baseHeaders;
    if (options.headers) {
      if (options.headers instanceof Headers) {
        // Convert Headers object to Record
        const existingHeaders: Record<string, string> = {};
        options.headers.forEach((value, key) => {
          existingHeaders[key] = value;
        });
        finalHeaders = { ...baseHeaders, ...existingHeaders };
      } else {
        finalHeaders = { ...baseHeaders, ...options.headers };
      }
    }

    return {
      ...options,
      headers: finalHeaders
    };
  }

  /**
   * Check if we can make a request within rate limits
   */
  private canMakeRequest(): boolean {
    this.cleanupWindows();
    
    return this.minuteWindow.count < this.config.maxRequestsPerMinute &&
           this.hourWindow.count < this.config.maxRequestsPerHour;
  }

  /**
   * Get the next available time for making a request
   */
  private getNextAvailableTime(): number {
    this.cleanupWindows();
    
    let nextTime = Date.now();
    
    // Check minute window
    if (this.minuteWindow.count >= this.config.maxRequestsPerMinute) {
      nextTime = Math.max(nextTime, this.minuteWindow.windowStart + 60000);
    }
    
    // Check hour window
    if (this.hourWindow.count >= this.config.maxRequestsPerHour) {
      nextTime = Math.max(nextTime, this.hourWindow.windowStart + 3600000);
    }
    
    return nextTime;
  }

  /**
   * Update rate limiting counters
   */
  private updateRateCounters(): void {
    this.cleanupWindows();
    this.minuteWindow.count++;
    this.hourWindow.count++;
  }

  /**
   * Clean up expired time windows
   */
  private cleanupWindows(): void {
    const now = Date.now();
    
    // Reset minute window if expired
    if (now - this.minuteWindow.windowStart >= 60000) {
      this.minuteWindow = { count: 0, windowStart: now };
    }
    
    // Reset hour window if expired
    if (now - this.hourWindow.windowStart >= 3600000) {
      this.hourWindow = { count: 0, windowStart: now };
    }
  }

  /**
   * Calculate delay between requests
   */
  private calculateDelay(): number {
    const baseDelay = this.config.baseDelay;
    const jitter = Math.random() * this.config.randomJitter;
    return baseDelay + jitter;
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(retryCount: number): number {
    const exponentialDelay = this.config.baseDelay * Math.pow(this.config.retryBackoffFactor, retryCount);
    const jitter = Math.random() * 1000;
    return Math.min(exponentialDelay + jitter, this.config.maxRetryDelay);
  }

  /**
   * Check if response indicates rate limiting
   */
  private isRateLimitResponse(response: Response): boolean {
    return response.status === 429 || 
           response.status === 503 || 
           (response.status === 403 && response.headers.get('retry-after') !== null);
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    if (error.name === 'AbortError') return false;
    if (error.code === 'ECONNREFUSED') return true;
    if (error.code === 'ENOTFOUND') return false;
    if (error.code === 'ETIMEDOUT') return true;
    if (error.message?.includes('network')) return true;
    return true; // Default to retryable
  }

  /**
   * Adjust rate limiting based on response
   */
  private adjustRateLimit(statusCode: number): void {
    if (statusCode === 429) {
      // Severe rate limiting - reduce request rate
      this.config.baseDelay = Math.min(this.config.baseDelay * 2, 10000);
      this.config.maxRequestsPerMinute = Math.max(1, Math.floor(this.config.maxRequestsPerMinute * 0.7));
    }
  }

  /**
   * Get next user agent for rotation
   */
  private getNextUserAgent(): string {
    if (!this.config.rotateUserAgents || this.config.userAgents.length === 0) {
      return this.config.userAgents[0] || '';
    }
    
    const userAgent = this.config.userAgents[this.currentUserAgentIndex];
    this.currentUserAgentIndex = (this.currentUserAgentIndex + 1) % this.config.userAgents.length;
    return userAgent;
  }

  /**
   * Circuit breaker methods
   */
  private isCircuitBreakerOpen(): boolean {
    return this.circuitBreaker.isOpen;
  }

  private incrementCircuitBreakerFailures(): void {
    this.circuitBreaker.failureCount++;
    this.circuitBreaker.lastFailureTime = Date.now();
    
    if (this.circuitBreaker.failureCount >= this.config.circuitBreakerThreshold) {
      this.circuitBreaker.isOpen = true;
      this.metrics.circuitBreakerTrips++;
      console.warn(`Circuit breaker opened after ${this.circuitBreaker.failureCount} failures`);
    }
  }

  private resetCircuitBreakerFailures(): void {
    this.circuitBreaker.failureCount = Math.max(0, this.circuitBreaker.failureCount - 1);
  }

  private resetCircuitBreaker(): void {
    if (this.circuitBreaker.resetCount >= this.circuitBreaker.maxResets) {
      console.log(`Circuit breaker maximum resets (${this.circuitBreaker.maxResets}) reached, keeping it open`);
      return;
    }
    
    this.circuitBreaker.isOpen = false;
    this.circuitBreaker.failureCount = 0;
    this.circuitBreaker.resetCount++;
    console.log(`Circuit breaker reset (${this.circuitBreaker.resetCount}/${this.circuitBreaker.maxResets})`);
  }

  private getRemainingCooldown(): number {
    if (!this.circuitBreaker.isOpen) return 0;
    const elapsed = Date.now() - this.circuitBreaker.lastFailureTime;
    return Math.max(0, this.config.circuitBreakerCooldown - elapsed);
  }

  /**
   * Update response time metrics
   */
  private updateResponseTimeMetrics(responseTime: number): void {
    const totalRequests = this.metrics.totalRequests;
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (totalRequests - 1) + responseTime) / totalRequests;
  }

  /**
   * Utility methods
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current metrics
   */
  public getMetrics(): RequestMetrics {
    return { ...this.metrics };
  }

  /**
   * Get current queue size
   */
  public getQueueSize(): number {
    return this.requestQueue.length;
  }

  /**
   * Get active request count
   */
  public getActiveRequestCount(): number {
    return this.activeRequests;
  }

  /**
   * Reset metrics
   */
  public resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rateLimitedRequests: 0,
      averageResponseTime: 0,
      circuitBreakerTrips: 0,
      lastRequestTime: 0
    };
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<RateLimiterConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Clear request queue
   */
  public clearQueue(): void {
    this.requestQueue.forEach(item => {
      item.reject(new Error('Request cancelled - queue cleared'));
    });
    this.requestQueue = [];
  }
}

// Export a singleton instance for global use
export const globalRateLimiter = new AdvancedRateLimiter();

// Export utility functions
export function createRateLimiter(config?: Partial<RateLimiterConfig>): AdvancedRateLimiter {
  return new AdvancedRateLimiter(config);
}

export function createLinkedInRateLimiter(): AdvancedRateLimiter {
  return new AdvancedRateLimiter({
    maxRequestsPerMinute: 20,
    maxRequestsPerHour: 300,
    maxConcurrentRequests: 2,
    baseDelay: 3000,
    randomJitter: 2000,
    maxRetries: 5,
    circuitBreakerThreshold: 3,
    circuitBreakerCooldown: 120000 // 2 minutes
  });
}

export function createCareerPageRateLimiter(): AdvancedRateLimiter {
  return new AdvancedRateLimiter({
    maxRequestsPerMinute: 40,
    maxRequestsPerHour: 800,
    maxConcurrentRequests: 4,
    baseDelay: 1500,
    randomJitter: 1000,
    maxRetries: 2, // Reduced retries
    circuitBreakerThreshold: 3, // Reduced threshold
    circuitBreakerCooldown: 10000 // Reduced to 10 seconds
  });
}