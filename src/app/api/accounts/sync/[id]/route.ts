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

    if (!unipileService.isConfigured()) {
      console.error('Unipile service not configured')
      return NextResponse.json(
        { error: 'Unipile integration not configured' },
        { status: 500 }
      )
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

    if (!account.unipile_account_id) {
      return NextResponse.json(
        { error: 'Account not connected to Unipile' },
        { status: 400 }
      )
    }

    try {
      // Fetch fresh account data from Unipile
      const accountDetails = await unipileService.getAccount(account.unipile_account_id)
      
      // Note: LinkedIn profile pictures are not available via Unipile API
      console.log('LinkedIn profile pictures are not available via Unipile API - using initials in UI')

      // Update account with fresh data
      const updateData: any = {
        connection_status: 'connected',
        last_sync_at: new Date().toISOString(),
        unipile_data: {
          ...account.unipile_data,
          account_details: accountDetails,
          last_sync_at: new Date().toISOString()
        }
      }

      // Update display information if available
      console.log('Syncing account details from Unipile:', JSON.stringify(accountDetails, null, 2))
      
      // Try multiple possible name fields
      const displayName = accountDetails.name || 
                         accountDetails.display_name ||
                         accountDetails.full_name ||
                         `${accountDetails.first_name || ''} ${accountDetails.last_name || ''}`.trim() ||
                         null
      
      if (displayName && displayName !== account.display_name) {
        updateData.display_name = displayName
      }
      
      if ((accountDetails.username || accountDetails.handle) && 
          (accountDetails.username || accountDetails.handle) !== account.username) {
        updateData.username = accountDetails.username || accountDetails.handle
      }
      
      if (accountDetails.email && accountDetails.email !== account.email) {
        updateData.email = accountDetails.email
      }

      // Extract premium status from LinkedIn connection params
      if (accountDetails.connection_params?.im) {
        const linkedinData = accountDetails.connection_params.im
        const isPremium = linkedinData.premiumId !== null || 
                         (linkedinData.premiumFeatures && linkedinData.premiumFeatures.length > 0)
        
        console.log('LinkedIn Premium Status:', {
          premiumId: linkedinData.premiumId,
          premiumFeatures: linkedinData.premiumFeatures,
          isPremium
        })

        // Store premium status in unipile_data
        updateData.unipile_data = {
          ...updateData.unipile_data,
          premium_status: {
            is_premium: isPremium,
            premium_id: linkedinData.premiumId,
            premium_features: linkedinData.premiumFeatures || [],
            premium_contract_id: linkedinData.premiumContractId
          }
        }
      }
      
      // LinkedIn profile pictures are not available via Unipile API
      // The UI will display user initials instead
      console.log('LinkedIn profile picture not available via API - UI will show initials')
      if (accountDetails.capabilities) {
        updateData.capabilities = accountDetails.capabilities
      }

      const { data: updatedAccount, error: updateError } = await supabase
        .from('user_accounts')
        .update(updateData)
        .eq('id', accountId)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating account after sync:', updateError)
        return NextResponse.json(
          { error: 'Failed to update account' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        account: updatedAccount,
        message: 'Account synced successfully'
      })

    } catch (error) {
      console.error('Error syncing with Unipile:', error)
      
      // Determine error status based on error type
      let newStatus = 'error'
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('403')) {
          newStatus = 'credentials' // Needs re-authentication
        } else if (error.message.includes('404')) {
          newStatus = 'disconnected' // Account no longer exists
        }
      }
      
      // Update account with error status
      await supabase
        .from('user_accounts')
        .update({
          connection_status: newStatus,
          last_sync_at: new Date().toISOString(),
          unipile_data: {
            ...account.unipile_data,
            last_sync_error: error instanceof Error ? error.message : 'Unknown error',
            last_sync_error_at: new Date().toISOString()
          }
        })
        .eq('id', accountId)

      return NextResponse.json(
        { error: 'Failed to sync account', status: newStatus },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error in account sync API:', error)
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
