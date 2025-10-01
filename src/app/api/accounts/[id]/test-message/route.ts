import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { UnipileClient } from 'unipile-node-sdk'

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Mock data for testing - in real implementation this would come from CSV or database
const TEST_CONTACTS = [
  {
    firstName: 'udit',
    lastName: 'pandoh',
    linkedinUrl: 'https://www.linkedin.com/in/udit-pandoh-aliste/',
    linkedinIdentifier: 'udit-pandoh-aliste'
  }
]

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🧪 TEST MESSAGE (SDK): Starting test message flow using Unipile SDK')
    const { userId } = await auth()
    
    if (!userId) {
      console.log('🧪 TEST MESSAGE (SDK): ❌ No userId found - unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: accountId } = await params
    console.log('🧪 TEST MESSAGE (SDK): ✅ User authenticated:', userId)
    console.log('🧪 TEST MESSAGE (SDK): 📝 Account ID:', accountId)

    // Check if Unipile API key is configured
    if (!process.env.UNIPILE_API_KEY) {
      console.log('🧪 TEST MESSAGE (SDK): ❌ UNIPILE_API_KEY environment variable not set')
      return NextResponse.json(
        { error: 'Unipile API key not configured' },
        { status: 500 }
      )
    }
    console.log('🧪 TEST MESSAGE (SDK): ✅ Unipile API key is configured')

    // Get user's ID from the users table
    console.log('🧪 TEST MESSAGE (SDK): 🔍 Looking up user in database by clerk_id:', userId)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (userError || !userData) {
      console.log('🧪 TEST MESSAGE (SDK): ❌ User not found in database')
      console.log('🧪 TEST MESSAGE (SDK): 📊 User error:', userError)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    console.log('🧪 TEST MESSAGE (SDK): ✅ Found user in database:', userData.id)

    // Get the account to verify ownership and get unipile account ID
    console.log('🧪 TEST MESSAGE (SDK): 🔍 Looking up account in database by ID:', accountId)
    const { data: account, error: accountError } = await supabase
      .from('user_accounts')
      .select('*')
      .eq('id', accountId)
      .single()

    if (accountError || !account) {
      console.log('🧪 TEST MESSAGE (SDK): ❌ Account not found in database')
      console.log('🧪 TEST MESSAGE (SDK): 📊 Account error:', accountError)
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }
    console.log('🧪 TEST MESSAGE (SDK): ✅ Found account in database')
    console.log('🧪 TEST MESSAGE (SDK): 📊 Account details:', {
      id: account.id,
      provider: account.provider,
      display_name: account.display_name,
      connection_status: account.connection_status,
      unipile_account_id: account.unipile_account_id
    })

    // Check if account is connected
    if (account.connection_status !== 'connected') {
      console.log('🧪 TEST MESSAGE (SDK): ❌ Account is not connected, status:', account.connection_status)
      return NextResponse.json(
        { error: 'Account is not connected' },
        { status: 400 }
      )
    }
    console.log('🧪 TEST MESSAGE (SDK): ✅ Account is connected')

    // Get unipile account ID from account data
    const unipileAccountId = account.unipile_data?.account_id || account.unipile_account_id

    console.log('🧪 TEST MESSAGE (SDK): 🔍 Checking unipile account ID')
    console.log('🧪 TEST MESSAGE (SDK): 📊 unipile_data:', account.unipile_data)
    console.log('🧪 TEST MESSAGE (SDK): 📊 unipile_account_id field:', account.unipile_account_id)
    console.log('🧪 TEST MESSAGE (SDK): 📊 Final unipileAccountId:', unipileAccountId)

    if (!unipileAccountId) {
      console.log('🧪 TEST MESSAGE (SDK): ❌ Unipile account ID not found in account data')
      return NextResponse.json(
        { error: 'Unipile account ID not found' },
        { status: 400 }
      )
    }
    console.log('🧪 TEST MESSAGE (SDK): ✅ Found unipile account ID:', unipileAccountId)

    // Extract the correct API endpoint from the account's hosted_link
    let apiBaseUrl = 'https://api16.unipile.com:14683' // fallback
    
    if (account.unipile_data?.hosted_link) {
      try {
        // Decode the base64 JSON in the hosted_link to get the correct API endpoint
        const encodedData = account.unipile_data.hosted_link.split('/').pop()
        if (encodedData) {
          const decodedData = JSON.parse(Buffer.from(encodedData, 'base64').toString('utf8'))
          console.log('🧪 TEST MESSAGE (SDK): 📊 Decoded hosted_link data:', decodedData)
          
          if (decodedData.url) {
            apiBaseUrl = decodedData.url
            console.log('🧪 TEST MESSAGE (SDK): ✅ Extracted API base URL from hosted_link:', apiBaseUrl)
          }
        }
      } catch (error) {
        console.log('🧪 TEST MESSAGE (SDK): ⚠️ Could not decode hosted_link, using default API URL')
        console.log('🧪 TEST MESSAGE (SDK): 📊 Decode error:', error)
      }
    }

    // Initialize Unipile SDK client
    console.log('🧪 TEST MESSAGE (SDK): 🔧 Initializing Unipile SDK client')
    console.log('🧪 TEST MESSAGE (SDK): 📊 API Base URL:', apiBaseUrl)
    console.log('🧪 TEST MESSAGE (SDK): 📊 API Key preview:', process.env.UNIPILE_API_KEY!.substring(0, 8) + '...')
    
    const client = new UnipileClient(apiBaseUrl, process.env.UNIPILE_API_KEY!)
    console.log('🧪 TEST MESSAGE (SDK): ✅ Unipile SDK client initialized')

    // Use first test contact for now
    const testContact = TEST_CONTACTS[0]
    console.log('🧪 TEST MESSAGE (SDK): 📝 Using test contact:', {
      name: `${testContact.firstName} ${testContact.lastName}`,
      linkedinUrl: testContact.linkedinUrl,
      identifier: testContact.linkedinIdentifier
    })
    
    let profileInfo: any = null
    
    try {
      // Step 1: Try to get profile information using SDK
      console.log('🧪 TEST MESSAGE (SDK): 🔍 Step 1: Getting LinkedIn profile via Unipile SDK')
      console.log('🧪 TEST MESSAGE (SDK): 📊 Profile identifier:', testContact.linkedinIdentifier)
      console.log('🧪 TEST MESSAGE (SDK): 📊 Using unipile account ID:', unipileAccountId)
      
      try {
        profileInfo = await client.users.getProfile({
          account_id: unipileAccountId,
          identifier: testContact.linkedinIdentifier,
        })
        console.log('🧪 TEST MESSAGE (SDK): ✅ Successfully retrieved profile from Unipile SDK')
        console.log('🧪 TEST MESSAGE (SDK): 📊 Profile info:', {
          provider_id: profileInfo.provider_id,
          first_name: profileInfo.first_name,
          last_name: profileInfo.last_name,
          headline: profileInfo.headline
        })
      } catch (profileError: any) {
        console.log('🧪 TEST MESSAGE (SDK): ⚠️ Profile lookup failed, but continuing with direct message approach')
        console.log('🧪 TEST MESSAGE (SDK): 📊 Profile error:', profileError.message)
        profileInfo = null // We'll use fallback data
      }
      
      // Step 2: Verify connection and send test message 
      const testMessage = `Hi ${testContact.firstName.charAt(0).toUpperCase() + testContact.firstName.slice(1)}, I'm testing my LinkedIn integration with Clento. This is a test message from our AI-powered outreach system! 🚀`
      
      console.log('🧪 TEST MESSAGE (SDK): 💬 Step 2: Attempting to send test message via Unipile SDK')
      console.log('🧪 TEST MESSAGE (SDK): 📊 Message content:', testMessage)
      console.log('🧪 TEST MESSAGE (SDK): 📊 Target profile:', testContact.linkedinIdentifier)
      console.log('🧪 TEST MESSAGE (SDK): 💡 Note: Target should be first-degree connection of Rishabh Amga')
      
      // Optional: Try to verify connection status by checking relations
      try {
        console.log('🧪 TEST MESSAGE (SDK): 🔍 Checking connections to verify first-degree relationship')
        const relations = await client.users.getAllRelations({
          account_id: unipileAccountId,
        })
        console.log('🧪 TEST MESSAGE (SDK): 📊 Found relations count:', relations?.items?.length || 0)
        
        // Check if target is in relations
        if (profileInfo && relations?.items) {
          const isConnected = relations.items.some((relation: any) => 
            relation.provider_id === profileInfo.provider_id ||
            relation.public_identifier === testContact.linkedinIdentifier
          )
          console.log('🧪 TEST MESSAGE (SDK): 📊 Target found in relations:', isConnected)
          
          if (isConnected) {
            console.log('🧪 TEST MESSAGE (SDK): ✅ Confirmed: Target is a first-degree connection!')
          } else {
            console.log('🧪 TEST MESSAGE (SDK): ⚠️ Target not found in relations list - might not be connected')
          }
        }
      } catch (relationsError: any) {
        console.log('🧪 TEST MESSAGE (SDK): ⚠️ Could not verify relations, continuing with messaging attempt')
        console.log('🧪 TEST MESSAGE (SDK): 📊 Relations error:', relationsError.message)
      }
      
      let chatResponse: any = null
      let connectionResponse: any = null
      let testResult: {
        type: 'direct_message' | 'connection_request'
        success: boolean
        chat_id?: string
        message_id?: string
        invitation_id?: string
        connectionMessage?: string
      } | null = null
      
      try {
        // Use provider_id from profile lookup for messaging (more reliable than public identifier)
        const messagingId = profileInfo ? profileInfo.provider_id : testContact.linkedinIdentifier
        
        console.log('🧪 TEST MESSAGE (SDK): 📊 Identifier comparison:')
        console.log('🧪 TEST MESSAGE (SDK): 📊 - Public identifier (old):', testContact.linkedinIdentifier)
        console.log('🧪 TEST MESSAGE (SDK): 📊 - Provider ID (new):', profileInfo?.provider_id || 'not available')
        console.log('🧪 TEST MESSAGE (SDK): 📊 - Using for messaging:', messagingId)
        
        console.log('🧪 TEST MESSAGE (SDK): 📊 SDK Parameters for direct message:', {
          account_id: unipileAccountId,
          attendees_ids: [messagingId],
          text: testMessage,
          using_provider_id: !!profileInfo,
          options: { linkedin: { api: 'classic' } }
        })
        console.log('🧪 TEST MESSAGE (SDK): 💡 Using LinkedIn provider ID for messaging (should work for first-degree connections)')
        
        chatResponse = await client.messaging.startNewChat({
          account_id: unipileAccountId,
          attendees_ids: [messagingId],
          text: testMessage,
          options: {
            linkedin: {
              api: 'classic'  // Use classic LinkedIn API for messaging
            }
          }
        })
        
        console.log('🧪 TEST MESSAGE (SDK): ✅ Successfully sent direct message via Unipile SDK')
        console.log('🧪 TEST MESSAGE (SDK): 📊 Chat response:', {
          object: chatResponse.object,
          chat_id: chatResponse.chat_id,
          message_id: chatResponse.message_id
        })
        
        testResult = {
          type: 'direct_message',
          success: true,
          chat_id: chatResponse.chat_id,
          message_id: chatResponse.message_id
        }
        
      } catch (messageError: any) {
        console.log('🧪 TEST MESSAGE (SDK): ⚠️ Direct message failed, checking if connection request is needed')
        console.log('🧪 TEST MESSAGE (SDK): 📊 Message error:', messageError.message)
        
        // Check if this is because they're not connected (422 error)
        console.log('🧪 TEST MESSAGE (SDK): 🔍 Analyzing message error for connection fallback')
        console.log('🧪 TEST MESSAGE (SDK): 📊 Error status:', messageError.body?.status)
        console.log('🧪 TEST MESSAGE (SDK): 📊 Error type:', messageError.body?.type)
        
        if (messageError.body && messageError.body.status === 422 && 
            (messageError.body.type === 'errors/invalid_recipient' || 
             messageError.body.type === 'errors/no_connection_with_recipient')) {
          
          console.log('🧪 TEST MESSAGE (SDK): 💡 Error indicates no connection - attempting connection request instead')
          
          try {
            // Use the provider_id from profile info for connection request
            const recipientId = profileInfo ? profileInfo.provider_id : testContact.linkedinIdentifier
            const connectionMessage = `Hi ${testContact.firstName.charAt(0).toUpperCase() + testContact.firstName.slice(1)}, I'd like to connect with you to test my LinkedIn integration with Clento. Thanks!`
            
            console.log('🧪 TEST MESSAGE (SDK): 📊 SDK Parameters for connection request:', {
              account_id: unipileAccountId,
              provider_id: recipientId,
              message: connectionMessage
            })
            
            connectionResponse = await client.users.sendInvitation({
              account_id: unipileAccountId,
              provider_id: recipientId,
              message: connectionMessage,
            })
            
            console.log('🧪 TEST MESSAGE (SDK): ✅ Successfully sent connection request via Unipile SDK')
            console.log('🧪 TEST MESSAGE (SDK): 📊 Connection response:', connectionResponse)
            
            testResult = {
              type: 'connection_request',
              success: true,
              invitation_id: connectionResponse.invitation_id || 'sent',
              connectionMessage: connectionMessage
            }
            
          } catch (connectionError: any) {
            console.log('🧪 TEST MESSAGE (SDK): ❌ Connection request also failed')
            console.log('🧪 TEST MESSAGE (SDK): 📊 Connection error:', connectionError.message)
            throw connectionError // Re-throw to be caught by outer catch
          }
          
        } else {
          console.log('🧪 TEST MESSAGE (SDK): ❌ Direct message failed for other reason, not retrying')
          throw messageError // Re-throw to be caught by outer catch
        }
      }

      // Ensure we have a test result
      if (!testResult) {
        throw new Error('No test result available - neither message nor connection request succeeded')
      }

      // Log the test activity (message or connection request)
      console.log('🧪 TEST MESSAGE (SDK): 📝 Step 3: Logging activity to database')
      const activityType = testResult.type === 'connection_request' ? 'connection_request' : 'test_message'
      
      const activityInsertResult = await supabase
        .from('account_activities')
        .insert({
          account_id: accountId,
          activity_type: activityType,
          activity_data: {
            target_profile: {
              name: profileInfo 
                ? `${profileInfo.first_name} ${profileInfo.last_name}`
                : `${testContact.firstName} ${testContact.lastName}`,
              identifier: testContact.linkedinIdentifier,
              linkedin_url: testContact.linkedinUrl,
              provider_id: profileInfo?.provider_id
            },
            action_taken: testResult.type,
            message: testResult.type === 'connection_request' ? testResult.connectionMessage : testMessage,
            chat_id: testResult.chat_id || null,
            message_id: testResult.message_id || null,
            invitation_id: testResult.invitation_id || null,
            profile_retrieved: !!profileInfo,
            sdk_used: true,
            timestamp: new Date().toISOString()
          },
          created_at: new Date().toISOString()
        })

      if (activityInsertResult.error) {
        console.log('🧪 TEST MESSAGE (SDK): ⚠️ Warning: Failed to log activity to database:', activityInsertResult.error)
      } else {
        console.log('🧪 TEST MESSAGE (SDK): ✅ Successfully logged activity to database')
      }

      console.log('🧪 TEST MESSAGE (SDK): 🎉 Test flow completed successfully!')
      
      // Return appropriate response based on what action was taken
      const responseMessage = testResult.type === 'connection_request' 
        ? 'Connection request sent successfully! Direct messaging was not possible.'
        : 'Test message sent successfully!'
        
      return NextResponse.json({
        success: true,
        message: responseMessage,
        data: {
          actionTaken: testResult.type,
          chatId: testResult.chat_id || null,
          messageId: testResult.message_id || null,
          invitationId: testResult.invitation_id || null,
          recipientProfile: {
            name: profileInfo 
              ? `${profileInfo.first_name} ${profileInfo.last_name}`
              : `${testContact.firstName} ${testContact.lastName}`,
            identifier: testContact.linkedinIdentifier,
            linkedinUrl: testContact.linkedinUrl,
            headline: profileInfo?.headline || 'Profile not retrieved',
            profilePicture: profileInfo?.profile_picture_url || null,
            providerId: profileInfo?.provider_id || null
          },
          sentMessage: testResult.type === 'connection_request' ? testResult.connectionMessage : testMessage,
          sdkUsed: true,
          fallbackUsed: testResult.type === 'connection_request'
        }
      })

    } catch (unipileError: any) {
      console.log('🧪 TEST MESSAGE (SDK): ❌ Unipile SDK error occurred')
      console.log('🧪 TEST MESSAGE (SDK): 📊 Error details:', unipileError.message)
      console.log('🧪 TEST MESSAGE (SDK): 📊 Error object:', unipileError)
      
      // Parse common Unipile errors using SDK error handling
      let errorMessage = 'Failed to send test message'
      let errorCode = 'UNIPILE_ERROR'
      
      // Check for SDK specific error handling
      if (unipileError.body) {
        const { status, type } = unipileError.body
        console.log('🧪 TEST MESSAGE (SDK): 📊 SDK Error status:', status)
        console.log('🧪 TEST MESSAGE (SDK): 📊 SDK Error type:', type)
        
        switch (status) {
          case 400:
            errorMessage = 'Invalid request parameters.'
            errorCode = 'INVALID_PARAMETERS'
            break
          case 401:
            errorMessage = 'Invalid Unipile API credentials.'
            errorCode = 'INVALID_CREDENTIALS'
            break
          case 404:
            errorMessage = 'Target profile not found on LinkedIn.'
            errorCode = 'PROFILE_NOT_FOUND'
            break
          case 422:
            errorMessage = 'Recipient cannot be reached. They may not be a first-degree connection.'
            errorCode = 'RECIPIENT_UNREACHABLE'
            break
          case 429:
            errorMessage = 'Rate limit exceeded. Please try again later.'
            errorCode = 'RATE_LIMIT'
            break
          default:
            errorMessage = `Unipile API error (${status})`
            errorCode = 'UNIPILE_ERROR'
        }
        
        // Handle specific error types
        switch (type) {
          case 'errors/missing_credentials':
          case 'errors/invalid_credentials':
            errorMessage = 'Invalid Unipile API credentials.'
            errorCode = 'INVALID_CREDENTIALS'
            break
          case 'errors/disconnected_account':
            errorMessage = 'Account appears to be disconnected from LinkedIn.'
            errorCode = 'ACCOUNT_DISCONNECTED'
            break
          case 'errors/invalid_recipient':
          case 'errors/no_connection_with_recipient':
            errorMessage = 'Recipient cannot be reached. They may not be a first-degree connection.'
            errorCode = 'RECIPIENT_UNREACHABLE'
            break
          case 'errors/invalid_parameters':
            errorMessage = 'Invalid request parameters.'
            errorCode = 'INVALID_PARAMETERS'
            break
        }
      }

      console.log('🧪 TEST MESSAGE (SDK): 📊 Parsed error code:', errorCode)
      console.log('🧪 TEST MESSAGE (SDK): 📊 Parsed error message:', errorMessage)

      return NextResponse.json({
        success: false,
        error: errorCode,
        message: errorMessage,
        details: {
          identifier: testContact.linkedinIdentifier,
          originalError: unipileError.message,
          sdkError: unipileError.body || null
        }
      }, { status: 400 })
    }

  } catch (error: any) {
    console.log('🧪 TEST MESSAGE (SDK): ❌ General error occurred')
    console.log('🧪 TEST MESSAGE (SDK): 📊 Error details:', error.message || error)
    console.log('🧪 TEST MESSAGE (SDK): 📊 Error stack:', error.stack)
    
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
