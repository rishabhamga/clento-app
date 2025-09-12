// Apollo HTTP Client Configuration
// Handles all HTTP communication with Apollo.io API

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

export interface ApolloConfig {
  apiKey: string
  baseURL?: string
  timeout?: number
}

export interface ApolloRateLimitInfo {
  remainingRequests: number
  resetTime: Date
  dailyLimit: number
  dailyUsed: number
}

class ApolloHttpClient {
  private client: AxiosInstance
  private apiKey: string
  private rateLimitInfo: ApolloRateLimitInfo | null = null

  constructor(config: ApolloConfig) {
    this.apiKey = config.apiKey

    this.client = axios.create({
      baseURL: config.baseURL || 'https://api.apollo.io/v1',
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Observe-AI/1.0',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor - add API key to all requests
    this.client.interceptors.request.use(
      (config) => {
        // Add API key to headers
        config.headers['x-api-key'] = this.apiKey

        // Log request for debugging (remove in production)
        if (process.env.NODE_ENV === 'development') {
          console.log(`Apollo API Request: ${config.method?.toUpperCase()} ${config.url}`)
        }

        return config
      },
      (error) => {
        console.error('Apollo API Request Error:', error)
        return Promise.reject(error)
      }
    )

    // Response interceptor - handle rate limiting and errors
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Extract and store rate limit information
        this.updateRateLimitInfo(response.headers)

        if (process.env.NODE_ENV === 'development') {
          console.log(`Apollo API Response: ${response.status} ${response.config.url}`)
        }

        return response
      },
      async (error) => {
        if (error.response) {
            console.log(error.response);
          const { status, headers, data } = error.response

          // Update rate limit info even on errors
          this.updateRateLimitInfo(headers)

          // Handle specific Apollo API errors
          switch (status) {
            case 401:
              console.error('Apollo API: Invalid API key')
              throw new Error('Apollo API authentication failed. Please check your API key.')

            case 403:
              console.error('Apollo API: Forbidden - insufficient permissions')
              throw new Error('Apollo API access forbidden. Please check your subscription plan.')

            case 429:
              const retryAfter = headers['retry-after'] || headers['x-ratelimit-reset']
              console.error(`Apollo API: Rate limit exceeded. Retry after: ${retryAfter}`)

              if (retryAfter) {
                // Implement exponential backoff
                const delay = parseInt(retryAfter) * 1000
                await new Promise(resolve => setTimeout(resolve, Math.min(delay, 60000)))

                // Retry the request once
                return this.client.request(error.config)
              }
              throw new Error(`Apollo API rate limit exceeded. Please try again later.`)

            case 500:
              console.error('Apollo API: Internal server error')
              throw new Error('Apollo API is experiencing issues. Please try again later.')

            default:
              console.error(`Apollo API Error ${status}:`, data)
              throw new Error(`Apollo API error: ${data?.message || 'Unknown error'}`)
          }
        } else if (error.request) {
          console.error('Apollo API: Network error', error.message)
          throw new Error('Unable to connect to Apollo API. Please check your internet connection.')
        } else {
          console.error('Apollo API: Request setup error', error.message)
          throw new Error('Apollo API request configuration error.')
        }
      }
    )
  }

  private updateRateLimitInfo(headers: any) {
    const remaining = headers['x-ratelimit-remaining']
    const reset = headers['x-ratelimit-reset']
    const dailyLimit = headers['x-daily-limit']
    const dailyUsed = headers['x-daily-used']

    if (remaining !== undefined) {
      this.rateLimitInfo = {
        remainingRequests: parseInt(remaining) || 0,
        resetTime: reset ? new Date(parseInt(reset) * 1000) : new Date(),
        dailyLimit: parseInt(dailyLimit) || 0,
        dailyUsed: parseInt(dailyUsed) || 0,
      }
    }
  }

  public getRateLimitInfo(): ApolloRateLimitInfo | null {
    return this.rateLimitInfo
  }

  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get(url, config)
    return response.data
  }

  public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post(url, data, config)
    return response.data
  }

  public async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put(url, data, config)
    return response.data
  }

  public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete(url, config)
    return response.data
  }
}

// Singleton instance
let apolloHttpClient: ApolloHttpClient | null = null

export function createApolloHttpClient(config?: Partial<ApolloConfig>): ApolloHttpClient {
  const apiKey = config?.apiKey || process.env.APOLLO_API_KEY
//   const apiKey = '8RfsmwxioluGragpDtJVeg'

  if (!apiKey) {
    throw new Error('Apollo API key is required. Please set APOLLO_API_KEY in your environment variables.')
  }

  if (!apolloHttpClient) {
    apolloHttpClient = new ApolloHttpClient({
      apiKey,
      baseURL: config?.baseURL,
      timeout: config?.timeout,
    })
  }

  return apolloHttpClient
}

export function getApolloHttpClient(): ApolloHttpClient {
  if (!apolloHttpClient) {
    return createApolloHttpClient()
  }
  return apolloHttpClient
}

// Export singleton instance
export const apolloClient = getApolloHttpClient()

export { ApolloHttpClient }