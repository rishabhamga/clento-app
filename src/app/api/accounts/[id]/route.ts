import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: accountId } = await params

    // Get user's ID from the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (userError || !userData) {
      console.error('Error fetching user:', userError)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get the account with RLS policy check
    const { data: account, error: accountError } = await supabase
      .from('user_accounts')
      .select('*')
      .eq('id', accountId)
      .single()

    if (accountError || !account) {
      console.error('Error fetching account:', accountError)
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      account
    })

  } catch (error) {
    console.error('Error in account GET API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: accountId } = await params
    const body = await request.json()
    
    const {
      display_name,
      username,
      email,
      profile_picture_url,
      connection_status,
      unipile_data,
      capabilities,
      last_sync_at,
      expires_at
    } = body

    // Get user's ID from the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (userError || !userData) {
      console.error('Error fetching user:', userError)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Update the account (RLS policies will handle access control)
    const updateData: any = {}
    
    if (display_name !== undefined) updateData.display_name = display_name
    if (username !== undefined) updateData.username = username
    if (email !== undefined) updateData.email = email
    if (profile_picture_url !== undefined) updateData.profile_picture_url = profile_picture_url
    if (connection_status !== undefined) updateData.connection_status = connection_status
    if (unipile_data !== undefined) updateData.unipile_data = unipile_data
    if (capabilities !== undefined) updateData.capabilities = capabilities
    if (last_sync_at !== undefined) updateData.last_sync_at = last_sync_at
    if (expires_at !== undefined) updateData.expires_at = expires_at

    const { data: updatedAccount, error: updateError } = await supabase
      .from('user_accounts')
      .update(updateData)
      .eq('id', accountId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating account:', updateError)
      return NextResponse.json(
        { error: 'Failed to update account' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      account: updatedAccount
    })

  } catch (error) {
    console.error('Error in account PUT API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: accountId } = await params

    // Get user's ID from the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (userError || !userData) {
      console.error('Error fetching user:', userError)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Delete the account (RLS policies will handle access control)
    const { error: deleteError } = await supabase
      .from('user_accounts')
      .delete()
      .eq('id', accountId)

    if (deleteError) {
      console.error('Error deleting account:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete account' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully'
    })

  } catch (error) {
    console.error('Error in account DELETE API:', error)
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
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
