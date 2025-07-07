import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // LinkedIn OAuth configuration
    const clientId = process.env.LINKEDIN_CLIENT_ID
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/linkedin/callback`
    
    if (!clientId) {
      console.error('LinkedIn Client ID not configured')
      return NextResponse.json({ error: 'LinkedIn integration not configured' }, { status: 500 })
    }

    // LinkedIn OAuth scopes for profile and messaging
    const scopes = [
      'r_liteprofile',
      'r_emailaddress',
      'w_member_social'
    ].join(' ')

    // Generate state parameter for security (CSRF protection)
    const state = `${userId}_${Date.now()}_${Math.random().toString(36).substring(7)}`
    
    // Build LinkedIn authorization URL
    const linkedinAuthUrl = new URL('https://www.linkedin.com/oauth/v2/authorization')
    linkedinAuthUrl.searchParams.set('response_type', 'code')
    linkedinAuthUrl.searchParams.set('client_id', clientId)
    linkedinAuthUrl.searchParams.set('redirect_uri', redirectUri)
    linkedinAuthUrl.searchParams.set('state', state)
    linkedinAuthUrl.searchParams.set('scope', scopes)

    // Store state in session/cookie for verification (in production, use a secure session store)
    const response = NextResponse.redirect(linkedinAuthUrl.toString())
    response.cookies.set('linkedin_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60 * 1000 // 10 minutes
    })

    return response

  } catch (error) {
    console.error('Error initiating LinkedIn OAuth:', error)
    return NextResponse.json(
      { error: 'Failed to initiate LinkedIn authentication' },
      { status: 500 }
    )
  }
} 