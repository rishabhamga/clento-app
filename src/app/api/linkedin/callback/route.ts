import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getOrCreateUserByClerkId } from '@/lib/user-sync'

interface LinkedInTokenResponse {
  access_token: string
  expires_in: number
  refresh_token?: string
  refresh_token_expires_in?: number
}

interface LinkedInProfile {
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

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', request.url))
    }

    if (error) {
      console.error('LinkedIn OAuth error:', error)
      return NextResponse.redirect(new URL('/onboarding?error=linkedin_auth_failed', request.url))
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL('/onboarding?error=invalid_callback', request.url))
    }

    // Verify state parameter
    const storedState = request.cookies.get('linkedin_oauth_state')?.value
    if (!storedState || storedState !== state) {
      console.error('Invalid state parameter')
      return NextResponse.redirect(new URL('/onboarding?error=invalid_state', request.url))
    }

    // Exchange code for access token
    const tokenResponse = await exchangeCodeForToken(code)
    if (!tokenResponse) {
      return NextResponse.redirect(new URL('/onboarding?error=token_exchange_failed', request.url))
    }

    // Get LinkedIn profile information
    const profile = await getLinkedInProfile(tokenResponse.access_token)
    if (!profile) {
      return NextResponse.redirect(new URL('/onboarding?error=profile_fetch_failed', request.url))
    }

    // Get or create user in database
    const user = await getOrCreateUserByClerkId(userId)
    if (!user) {
      return NextResponse.redirect(new URL('/onboarding?error=user_creation_failed', request.url))
    }

    // Save LinkedIn account to database
    const success = await saveLinkedInAccount(user.id, tokenResponse, profile)
    if (!success) {
      return NextResponse.redirect(new URL('/onboarding?error=account_save_failed', request.url))
    }

    // Clear the state cookie
    const response = NextResponse.redirect(new URL('/onboarding?linkedin_connected=true', request.url))
    response.cookies.delete('linkedin_oauth_state')

    return response

  } catch (error) {
    console.error('Error in LinkedIn callback:', error)
    return NextResponse.redirect(new URL('/onboarding?error=callback_error', request.url))
  }
}

async function exchangeCodeForToken(code: string): Promise<LinkedInTokenResponse | null> {
  try {
    const clientId = process.env.LINKEDIN_CLIENT_ID
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/linkedin/callback`

    if (!clientId || !clientSecret) {
      console.error('LinkedIn credentials not configured')
      return null
    }

    const tokenUrl = 'https://www.linkedin.com/oauth/v2/accessToken'
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri
    })

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: body.toString()
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Token exchange failed:', response.status, errorText)
      return null
    }

    const tokenData: LinkedInTokenResponse = await response.json()
    return tokenData

  } catch (error) {
    console.error('Error exchanging code for token:', error)
    return null
  }
}

async function getLinkedInProfile(accessToken: string): Promise<LinkedInProfile | null> {
  try {
    const profileUrl = 'https://api.linkedin.com/v2/people/~?projection=(id,localizedFirstName,localizedLastName,profilePicture(displayImage~:playableStreams),headline,industry,location)'
    
    const response = await fetch(profileUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      console.error('Profile fetch failed:', response.status, await response.text())
      return null
    }

    const profile: LinkedInProfile = await response.json()
    return profile

  } catch (error) {
    console.error('Error fetching LinkedIn profile:', error)
    return null
  }
}

async function saveLinkedInAccount(
  userId: string, 
  tokenData: LinkedInTokenResponse, 
  profile: LinkedInProfile
): Promise<boolean> {
  try {
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000))
    
    // Extract profile information
    const displayName = profile.localizedFirstName && profile.localizedLastName 
      ? `${profile.localizedFirstName} ${profile.localizedLastName}`
      : 'LinkedIn User'
    
    const profilePictureUrl = profile.profilePicture?.['displayImage~']?.elements?.[0]?.identifiers?.[0]?.identifier
    const headline = Object.values(profile.headline?.localized || {})[0] || ''
    const industry = Object.values(profile.industry?.localized || {})[0] || ''
    const location = profile.location?.name || ''

    // Check if this LinkedIn account is already connected
    const { data: existingAccount } = await supabaseAdmin
      .from('linkedin_accounts')
      .select('id')
      .eq('user_id', userId)
      .eq('linkedin_id', profile.id)
      .eq('is_active', true)
      .single()

    if (existingAccount) {
      // Update existing account
      const { error } = await supabaseAdmin
        .from('linkedin_accounts')
        .update({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_expires_at: expiresAt.toISOString(),
          profile_data: profile,
          display_name: displayName,
          profile_picture_url: profilePictureUrl,
          headline,
          industry,
          location,
          connection_status: 'connected',
          health_check_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingAccount.id)

      if (error) {
        console.error('Error updating LinkedIn account:', error)
        return false
      }
    } else {
      // Create new account
      const { error } = await supabaseAdmin
        .from('linkedin_accounts')
        .insert({
          user_id: userId,
          linkedin_id: profile.id,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_expires_at: expiresAt.toISOString(),
          profile_data: profile,
          display_name: displayName,
          profile_picture_url: profilePictureUrl,
          headline,
          industry,
          location,
          connection_status: 'connected',
          health_check_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error saving LinkedIn account:', error)
        return false
      }

      // Update user profile to increment LinkedIn accounts count
      await supabaseAdmin
        .from('user_profile')
        .upsert({
          user_id: userId,
          linkedin_accounts_connected: supabaseAdmin.rpc('linkedin_accounts_connected', { user_uuid: userId }),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
    }

    return true

  } catch (error) {
    console.error('Error saving LinkedIn account:', error)
    return false
  }
} 