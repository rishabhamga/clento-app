import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { unipileService } from '@/lib/unipile-service'

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
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

    // If account has Unipile integration, attempt to disconnect from Unipile
    if (account.unipile_account_id && unipileService.isConfigured()) {
      try {
        await unipileService.deleteAccount(account.unipile_account_id)
        console.log('Successfully disconnected from Unipile:', account.unipile_account_id)
      } catch (unipileError) {
        console.warn('Error disconnecting from Unipile (continuing with local disconnect):', unipileError)
      }
    }

    // Update the account status to disconnected (or delete it based on preference)
    const body = await request.json().catch(() => ({}))
    const { deleteAccount = false } = body

    if (deleteAccount) {
      // Completely remove the account
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
    } else {
      // Just disconnect but keep the record
      const { data: updatedAccount, error: updateError } = await supabase
        .from('user_accounts')
        .update({
          connection_status: 'disconnected',
          unipile_account_id: null,
          last_sync_at: new Date().toISOString(),
          unipile_data: {
            ...account.unipile_data,
            disconnected_at: new Date().toISOString(),
            previous_unipile_account_id: account.unipile_account_id
          }
        })
        .eq('id', accountId)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating account after disconnect:', updateError)
        return NextResponse.json(
          { error: 'Failed to disconnect account' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        account: updatedAccount,
        message: 'Account disconnected successfully'
      })
    }

  } catch (error) {
    console.error('Error in account disconnect API:', error)
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
