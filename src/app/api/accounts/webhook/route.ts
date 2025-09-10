import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { unipileService } from '@/lib/unipile-service'

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface UnipileWebhookPayload {
  status: 'CREATION_SUCCESS' | 'RECONNECTED' | 'CREATION_FAILED'
  account_id?: string
  name?: string // This is our internal user ID
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: UnipileWebhookPayload = await request.json()

    console.log('Received Unipile webhook:', body)

    const { status, account_id, name: userDbId, error } = body

    if (!userDbId) {
      console.error('Missing user ID in webhook payload')
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 })
    }

    // Find the pending account record
    const { data: pendingAccount, error: findError } = await supabase
      .from('user_accounts')
      .select('*')
      .eq('user_id', userDbId)
      .eq('connection_status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (findError || !pendingAccount) {
      console.error('Pending account not found:', findError)
      return NextResponse.json({ error: 'Pending account not found' }, { status: 404 })
    }

    if (status === 'CREATION_SUCCESS' || status === 'RECONNECTED') {
      if (!account_id) {
        console.error('Missing account_id for successful connection')
        return NextResponse.json({ error: 'Missing account_id' }, { status: 400 })
      }

      try {
        // Fetch account details from Unipile API
        let accountDetails: any = null
        if (unipileService.isConfigured()) {
          try {
            accountDetails = await unipileService.getAccount(account_id)
            console.log('Account details fetched for new account:', accountDetails?.account_id || account_id)
          } catch (fetchError) {
            console.warn('Failed to fetch account details from Unipile:', fetchError)
          }
        }

        // Update the account record with success
        const updateData: any = {
          unipile_account_id: account_id,
          connection_status: 'connected',
          last_sync_at: new Date().toISOString(),
          unipile_data: {
            ...pendingAccount.unipile_data,
            account_details: accountDetails,
            connected_at: new Date().toISOString()
          }
        }

        // Extract display information from account details if available
        if (accountDetails) {
          console.log('Processing account details from Unipile:', JSON.stringify(accountDetails, null, 2))

          // Try multiple possible name fields
          const displayName = accountDetails.name ||
                             accountDetails.display_name ||
                             accountDetails.full_name ||
                             `${accountDetails.first_name || ''} ${accountDetails.last_name || ''}`.trim() ||
                             null

          if (displayName) {
            updateData.display_name = displayName
          }

          if (accountDetails.username || accountDetails.handle) {
            updateData.username = accountDetails.username || accountDetails.handle
          }

          if (accountDetails.email) {
            updateData.email = accountDetails.email
          }

          // LinkedIn profile pictures are not available via Unipile API
          // The UI will display user initials instead
          console.log('LinkedIn profile picture not available via API - UI will show initials')

          if (accountDetails.capabilities) {
            updateData.capabilities = accountDetails.capabilities
          }

          // Extract premium status from LinkedIn connection params
          if (accountDetails.connection_params?.im) {
            const linkedinData = accountDetails.connection_params.im
            const isPremium = linkedinData.premiumId !== null ||
                             (linkedinData.premiumFeatures && linkedinData.premiumFeatures.length > 0)

            console.log('LinkedIn Premium Status for new account:', {
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
        }

        const { data: updatedAccount, error: updateError } = await supabase
          .from('user_accounts')
          .update(updateData)
          .eq('id', pendingAccount.id)
          .select()
          .single()

        if (updateError) {
          console.error('Error updating account with success:', updateError)
          return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
        }

        console.log('Successfully connected account:', {
          accountId: updatedAccount.id,
          unipileAccountId: account_id,
          provider: updatedAccount.provider
        })

      } catch (fetchError) {
        console.error('Error fetching account details:', fetchError)

        // Still update with basic success info even if we can't fetch details
        const { error: basicUpdateError } = await supabase
          .from('user_accounts')
          .update({
            unipile_account_id: account_id,
            connection_status: 'connected',
            last_sync_at: new Date().toISOString(),
            display_name: pendingAccount.display_name.replace(' (Connecting...)', '')
          })
          .eq('id', pendingAccount.id)

        if (basicUpdateError) {
          console.error('Error with basic account update:', basicUpdateError)
          return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
        }
      }

    } else if (status === 'CREATION_FAILED') {
      // Update the account record with failure
      const { error: updateError } = await supabase
        .from('user_accounts')
        .update({
          connection_status: 'error',
          unipile_data: {
            ...pendingAccount.unipile_data,
            error: error || 'Connection failed',
            failed_at: new Date().toISOString()
          }
        })
        .eq('id', pendingAccount.id)

      if (updateError) {
        console.error('Error updating account with failure:', updateError)
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
      }

      console.log('Account connection failed:', {
        accountId: pendingAccount.id,
        provider: pendingAccount.provider,
        error: error
      })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in accounts webhook:', error)
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
