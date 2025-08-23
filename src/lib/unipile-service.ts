/**
 * Unipile API Integration Service
 * Handles all interactions with the Unipile API for account management and messaging
 */

interface UnipileConfig {
  apiUrl: string
  apiKey: string
}

interface CreateHostedAuthLinkParams {
  type: 'create' | 'reconnect'
  providers: string[]
  expiresOn: string
  successRedirectUrl?: string
  failureRedirectUrl?: string
  notifyUrl?: string
  name?: string // Internal user identifier
  reconnectAccount?: string // Required for reconnect type
}

interface HostedAuthLinkResponse {
  object: string
  url: string
}

interface UnipileAccount {
  id: string
  provider: string
  status: string
  name?: string
  display_name?: string
  full_name?: string
  first_name?: string
  last_name?: string
  username?: string
  handle?: string
  email?: string
  profile_picture_url?: string
  profile_picture?: string
  avatar_url?: string
  picture?: string
  image_url?: string
  photo_url?: string
  capabilities?: string[]
  created_at: string
  updated_at: string
  // Allow any additional fields from Unipile
  [key: string]: any
}

interface UnipileAccountsListResponse {
  accounts: UnipileAccount[]
  total: number
}

export class UnipileService {
  private config: UnipileConfig

  constructor(apiUrl?: string, apiKey?: string) {
    this.config = {
      apiUrl: apiUrl || process.env.UNIPILE_API_URL || 'https://api.unipile.com',
      apiKey: apiKey || process.env.UNIPILE_API_KEY || ''
    }

    if (!this.config.apiKey) {
      console.warn('Unipile API key not configured')
    }
  }

  /**
   * Check if Unipile is properly configured
   */
  isConfigured(): boolean {
    return !!(this.config.apiUrl && this.config.apiKey)
  }

  /**
   * Create a hosted authentication link for connecting accounts
   */
  async createHostedAuthLink(params: CreateHostedAuthLinkParams): Promise<HostedAuthLinkResponse> {
    if (!this.isConfigured()) {
      throw new Error('Unipile service not configured')
    }

    const requestBody = {
      type: params.type,
      providers: params.providers.length > 0 ? params.providers.map(p => p.toUpperCase()) : undefined,
      api_url: this.config.apiUrl,
      expiresOn: params.expiresOn,
      ...(params.successRedirectUrl && { success_redirect_url: params.successRedirectUrl }),
      ...(params.failureRedirectUrl && { failure_redirect_url: params.failureRedirectUrl }),
      ...(params.notifyUrl && { notify_url: params.notifyUrl }),
      ...(params.name && { name: params.name }),
      ...(params.type === 'reconnect' && params.reconnectAccount && { reconnect_account: params.reconnectAccount })
    }

    console.log('Unipile request body:', JSON.stringify(requestBody, null, 2))

    const response = await fetch(`${this.config.apiUrl}/api/v1/hosted/accounts/link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': this.config.apiKey
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Unipile API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })
      throw new Error(`Failed to create hosted auth link: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Get account details by ID
   */
  async getAccount(accountId: string): Promise<UnipileAccount> {
    if (!this.isConfigured()) {
      throw new Error('Unipile service not configured')
    }

    const response = await fetch(`${this.config.apiUrl}/api/v1/accounts/${accountId}`, {
      headers: {
        'X-API-KEY': this.config.apiKey
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Unipile API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })
      throw new Error(`Failed to get account: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Get user profile by identifier (includes profile picture)
   * Try multiple endpoints as per Unipile documentation
   */
  async getUserProfile(accountId: string, identifier: string): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Unipile service not configured')
    }

    // Try the profile endpoint first
    try {
      const response = await fetch(`${this.config.apiUrl}/api/v1/users/${identifier}/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': this.config.apiKey,
          'account_id': accountId
        }
      })

      if (response.ok) {
        return await response.json()
      }

      console.warn('Profile endpoint failed, trying alternative approach:', response.status)
    } catch (error) {
      console.warn('Profile endpoint error:', error)
    }

    // Try alternative: get user info via messaging endpoint
    try {
      const response = await fetch(`${this.config.apiUrl}/api/v1/users/${identifier}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': this.config.apiKey,
          'account_id': accountId
        }
      })

      if (response.ok) {
        console.log('Successfully fetched user info via alternative endpoint')
        return await response.json()
      }

      const errorText = await response.text()
      console.error('Alternative user endpoint also failed:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })
    } catch (error) {
      console.error('Alternative user endpoint error:', error)
    }

    // If both fail, return null instead of throwing
    console.warn('All profile fetching methods failed, continuing without profile data')
    return null
  }

  /**
   * List all accounts
   */
  async listAccounts(): Promise<UnipileAccountsListResponse> {
    if (!this.isConfigured()) {
      throw new Error('Unipile service not configured')
    }

    const response = await fetch(`${this.config.apiUrl}/api/v1/accounts`, {
      headers: {
        'X-API-KEY': this.config.apiKey
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Unipile API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })
      throw new Error(`Failed to list accounts: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Delete/disconnect an account
   */
  async deleteAccount(accountId: string): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('Unipile service not configured')
    }

    const response = await fetch(`${this.config.apiUrl}/api/v1/accounts/${accountId}`, {
      method: 'DELETE',
      headers: {
        'X-API-KEY': this.config.apiKey
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Unipile API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })
      throw new Error(`Failed to delete account: ${response.statusText}`)
    }
  }

  /**
   * Create a reconnection link for an existing account
   */
  async createReconnectLink(
    accountId: string,
    userIdentifier: string,
    successRedirectUrl?: string,
    failureRedirectUrl?: string,
    notifyUrl?: string
  ): Promise<HostedAuthLinkResponse> {
    return this.createHostedAuthLink({
      type: 'reconnect',
      providers: [], // Not needed for reconnect
      expiresOn: new Date(Date.now() + 3600000).toISOString(), // 1 hour
      successRedirectUrl,
      failureRedirectUrl,
      notifyUrl,
      name: userIdentifier,
      reconnectAccount: accountId
    })
  }

  /**
   * Send a message through a connected account
   * Note: This is a placeholder for future messaging functionality
   */
  async sendMessage(accountId: string, recipientId: string, message: string): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Unipile service not configured')
    }

    // TODO: Implement based on Unipile's messaging API
    // This will be implemented in the next phase when we add messaging functionality
    throw new Error('Message sending not yet implemented')
  }

  /**
   * Get messages from an account
   * Note: This is a placeholder for future messaging functionality
   */
  async getMessages(accountId: string, limit?: number, offset?: number): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Unipile service not configured')
    }

    // TODO: Implement based on Unipile's messaging API
    // This will be implemented in the next phase when we add messaging functionality
    throw new Error('Message retrieval not yet implemented')
  }

  /**
   * Get account status and health information
   */
  async getAccountStatus(accountId: string): Promise<{ status: string; last_activity?: string }> {
    try {
      const account = await this.getAccount(accountId)
      return {
        status: account.status,
        last_activity: account.updated_at
      }
    } catch (error) {
      console.error('Error getting account status:', error)
      throw error
    }
  }

  /**
   * Validate if a provider is supported by Unipile
   */
  static getSupportedProviders(): string[] {
    return [
      'linkedin',
      'whatsapp',
      'instagram',
      'messenger',
      'telegram',
      'twitter',
      'gmail',
      'outlook'
    ]
  }

  /**
   * Check if a provider is supported
   */
  static isProviderSupported(provider: string): boolean {
    return UnipileService.getSupportedProviders().includes(provider.toLowerCase())
  }

  /**
   * Get provider-specific configuration
   */
  static getProviderConfig(provider: string) {
    const configs = {
      linkedin: {
        name: 'LinkedIn',
        supportsMessaging: true,
        supportsPosting: true,
        authMethods: ['credentials', 'qr_code']
      },
      whatsapp: {
        name: 'WhatsApp',
        supportsMessaging: true,
        supportsPosting: false,
        authMethods: ['qr_code']
      },
      instagram: {
        name: 'Instagram',
        supportsMessaging: true,
        supportsPosting: true,
        authMethods: ['credentials']
      },
      messenger: {
        name: 'Facebook Messenger',
        supportsMessaging: true,
        supportsPosting: false,
        authMethods: ['credentials']
      },
      telegram: {
        name: 'Telegram',
        supportsMessaging: true,
        supportsPosting: false,
        authMethods: ['phone']
      },
      twitter: {
        name: 'Twitter',
        supportsMessaging: true,
        supportsPosting: true,
        authMethods: ['credentials']
      },
      gmail: {
        name: 'Gmail',
        supportsMessaging: true,
        supportsPosting: false,
        authMethods: ['oauth']
      },
      outlook: {
        name: 'Outlook',
        supportsMessaging: true,
        supportsPosting: false,
        authMethods: ['oauth']
      }
    }

    return configs[provider.toLowerCase() as keyof typeof configs] || null
  }
}

// Export a default instance
export const unipileService = new UnipileService()

// Export types for use in other files
export type {
  UnipileConfig,
  CreateHostedAuthLinkParams,
  HostedAuthLinkResponse,
  UnipileAccount,
  UnipileAccountsListResponse
}
