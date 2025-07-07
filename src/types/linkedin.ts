export interface LinkedInAccount {
  id: string
  linkedin_id: string
  display_name: string
  profile_picture_url?: string
  headline?: string
  industry?: string
  location?: string
  is_active: boolean
  connection_status: 'connected' | 'expired' | 'revoked' | 'error'
  last_used_at?: string
  usage_count: number
  daily_message_count: number
  connected_at: string
  created_at: string
  updated_at: string
}

export interface LinkedInProfile {
  id: string
  localizedFirstName?: string
  localizedLastName?: string
  profilePicture?: {
    'displayImage~': {
      elements: Array<{
        identifiers: Array<{
          identifier: string
        }>
      }>
    }
  }
  headline?: {
    localized: {
      [key: string]: string
    }
  }
  industry?: {
    localized: {
      [key: string]: string
    }
  }
  location?: {
    name: string
  }
}

export interface LinkedInTokenResponse {
  access_token: string
  expires_in: number
  refresh_token?: string
  refresh_token_expires_in?: number
}

export interface LinkedInAccountsResponse {
  success: boolean
  accounts: LinkedInAccount[]
  count: number
  maxAccounts: number
  error?: string
}

export interface LinkedInConnectionRequest {
  message?: string
  account_id: string
  target_profile_id: string
}

export interface LinkedInConnectionResponse {
  success: boolean
  message: string
  connection_id?: string
  error?: string
} 