import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { unipileService, UnipileService } from '@/lib/unipile-service'

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!unipileService.isConfigured()) {
      console.error('Unipile service not configured')
      return NextResponse.json(
        { error: 'Unipile integration not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const {
      provider,
      organization_id,
      success_redirect_url,
      failure_redirect_url,
      notify_url
    } = body

    // Validate required fields
    if (!provider) {
      return NextResponse.json(
        { error: 'Provider is required' },
        { status: 400 }
      )
    }

    // Validate provider is supported
    if (!UnipileService.isProviderSupported(provider)) {
      return NextResponse.json(
        { error: `Provider ${provider} is not supported` },
        { status: 400 }
      )
    }

    // Get user's ID from the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('clerk_id', userId)
      .single()

    if (userError || !userData) {
      console.error('Error fetching user:', userError)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    let orgDbId = null
    
    // If organization_id is provided, convert Clerk org ID to database UUID
    if (organization_id) {
      console.log('Looking up organization:', organization_id)
      
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('id, name, permissible_seats')
        .eq('clerk_org_id', organization_id)
        .single()

      if (orgError || !orgData) {
        console.error('Organization lookup error:', orgError)
        return NextResponse.json(
          { error: 'Organization not found', details: orgError?.message },
          { status: 404 }
        )
      }
      
      orgDbId = orgData.id
      console.log('Found organization:', { clerk_id: organization_id, db_id: orgDbId, name: orgData.name, permissible_seats: orgData.permissible_seats })

      // Check current account count against seat limit
      const { count: currentAccountCount, error: countError } = await supabase
        .from('user_accounts')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgDbId)
        .neq('connection_status', 'disconnected') // Don't count disconnected accounts

      if (countError) {
        console.error('Error counting current accounts:', countError)
        return NextResponse.json(
          { error: 'Failed to check account limits' },
          { status: 500 }
        )
      }

      if (currentAccountCount !== null && currentAccountCount >= orgData.permissible_seats) {
        return NextResponse.json(
          { 
            error: 'Account limit reached', 
            message: `Your organization has reached the maximum of ${orgData.permissible_seats} connected accounts. Please disconnect an existing account or upgrade your plan.`,
            current_accounts: currentAccountCount,
            max_accounts: orgData.permissible_seats
          },
          { status: 403 }
        )
      }
    }

    // Create Unipile hosted auth link
    console.log('Creating Unipile hosted auth link:', {
      provider: provider.toLowerCase(),
      userId: userData.id,
      organizationId: organization_id,
      orgDbId
    })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    console.log('Environment check:', {
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      UNIPILE_API_URL: process.env.UNIPILE_API_URL,
      UNIPILE_API_KEY: process.env.UNIPILE_API_KEY ? 'Set' : 'Not set',
      baseUrl
    })
    
    const unipileData = await unipileService.createHostedAuthLink({
      type: 'create',
      providers: [provider.toUpperCase()], // Unipile expects uppercase
      expiresOn: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      successRedirectUrl: success_redirect_url || `${baseUrl}/accounts?connected=true`,
      failureRedirectUrl: failure_redirect_url || `${baseUrl}/accounts?error=connection_failed`,
      notifyUrl: notify_url || `${baseUrl}/api/accounts/webhook`,
      name: userData.id // Use our internal user ID for matching
    })

    // Store pending connection in database
    const { data: pendingAccount, error: createError } = await supabase
      .from('user_accounts')
      .insert({
        user_id: userData.id,
        organization_id: orgDbId, // Use the UUID, not the Clerk org ID
        provider: provider.toLowerCase(),
        account_type: 'personal',
        display_name: `${provider} Account (Connecting...)`,
        connection_status: 'pending',
        unipile_data: {
          hosted_link: unipileData.url, // Unipile returns 'url' not 'link'
          created_at: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating pending account:', createError)
      return NextResponse.json(
        { error: 'Failed to create connection record' },
        { status: 500 }
      )
    }

    console.log('Unipile response received:', unipileData)

    return NextResponse.json({
      success: true,
      connection_url: unipileData.url, // Unipile returns 'url' not 'link'
      account_id: pendingAccount.id
    })

  } catch (error) {
    console.error('Error in accounts connect API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
