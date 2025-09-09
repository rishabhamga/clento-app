import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getOrCreateUserByClerkId } from '@/lib/user-sync'

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const user = await getOrCreateUserByClerkId(userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get user's LinkedIn accounts
    const { data: linkedinAccounts, error } = await supabaseAdmin
      .from('linkedin_accounts')
      .select(`
        id,
        linkedin_id,
        display_name,
        profile_picture_url,
        headline,
        industry,
        location,
        is_active,
        connection_status,
        last_used_at,
        usage_count,
        daily_message_count,
        connected_at
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('connected_at', { ascending: false })

    if (error) {
      console.error('Error fetching LinkedIn accounts:', error)
      return NextResponse.json(
        { error: 'Failed to fetch LinkedIn accounts' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      accounts: linkedinAccounts || [],
      count: linkedinAccounts?.length || 0,
      maxAccounts: 10
    })

  } catch (error) {
    console.error('Error in LinkedIn accounts GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('id')

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID required' }, { status: 400 })
    }

    // Get user from database
    const user = await getOrCreateUserByClerkId(userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify account belongs to user and deactivate it
    const { data: deletedAccount, error } = await (supabaseAdmin as any)
      .from('linkedin_accounts')
      .update({
        is_active: false,
        connection_status: 'revoked',
        updated_at: new Date().toISOString()
      })
      .eq('id', accountId)
      .eq('user_id', user.id)
      .select('id, display_name')
      .single()

    if (error) {
      console.error('Error disconnecting LinkedIn account:', error)
      return NextResponse.json(
        { error: 'Failed to disconnect LinkedIn account' },
        { status: 500 }
      )
    }

    if (!deletedAccount) {
      return NextResponse.json(
        { error: 'Account not found or access denied' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `LinkedIn account ${deletedAccount.display_name} has been disconnected`
    })

  } catch (error) {
    console.error('Error in LinkedIn accounts DELETE:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 