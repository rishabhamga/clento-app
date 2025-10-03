import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import axios from 'axios';
import { syndieBaseUrl } from '../../../lib/utils';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const getAccounts = async (tokenData: { api_token: string }) => {
    try {
        const res = await axios.get(syndieBaseUrl + '/api/linkedin/seats', {
            headers: {
                'Authorization': `Bearer ${tokenData.api_token}`,
                'Content-Type': 'application/json',
            }
        })

        if (!res.data) {
            console.log('No Seats Found')
            return
        }

        return res?.data?.data?.seats
    } catch (err) {
        console.log(JSON.stringify(err, null, 4));
        return
    }
}

export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    const {data: organizationData, error: orgError} = await supabase.from('organizations').select("*").eq('clerk_org_id', orgId).single();

    if(!organizationData || orgError){
        return NextResponse.json({error: 'An Error Occured', status: 400})
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organizationId = orgId;

    //GET the token of the syndie
    const {data: tokenData, error: tokenError} = await supabase.from('syndie_access_tokens').select('*').eq('organization_id', organizationData.id).single();

    if(!tokenError && tokenData){
        const accounts = await getAccounts(tokenData)
        return NextResponse.json({message: "Accounts Fetched Successfully", syndieSeats: true, accounts}, {status: 200})
    }

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

    let orgDbId = null

    // If organizationId is provided, get the corresponding database ID
    if (organizationId) {

      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('clerk_org_id', organizationId)
        .single()

      if (orgError || !orgData) {
        console.warn(`👤 ⚠️ Organization ${organizationId} not found in database:`, orgError)
      } else {
        orgDbId = orgData.id
      }
    }

    // Build accounts query based on organization context
    let accountsQuery = supabase
      .from('user_accounts')
      .select('*')
      .order('created_at', { ascending: false })

    if (organizationId && orgDbId) {
      // Organization context: show organization accounts (only connected ones)
      accountsQuery = accountsQuery
        .eq('organization_id', orgDbId)
        .eq('connection_status', 'connected')
    } else {
      // Personal context: show personal accounts (null organization_id, only connected ones)
      accountsQuery = accountsQuery
        .eq('user_id', userData.id)
        .is('organization_id', null)
        .eq('connection_status', 'connected')
    }

    const { data: accounts, error: accountsError } = await accountsQuery

    if (accountsError) {
      console.error('Error fetching accounts:', accountsError)
      return NextResponse.json(
        { error: 'Failed to fetch accounts' },
        { status: 500 }
      )
    }


    // Get account statistics
    let stats: any[] = []
    try {
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_account_stats', {
          p_user_id: userData.id,
          p_organization_id: orgDbId
        })

      if (statsError) {
        console.error('Error fetching account stats:', statsError)
        // Provide default stats if function fails
        stats = [{
          total_accounts: 0,
          connected_accounts: 0,
          by_provider: {}
        }]
      } else {
        stats = statsData || []
      }
    } catch (error) {
      console.error('Error calling get_account_stats function:', error)
      // Provide default stats if function fails
      stats = [{
        total_accounts: 0,
        connected_accounts: 0,
        by_provider: {}
      }]
    }

    return NextResponse.json({
      success: true,
      accounts: accounts || [],
      stats: stats?.[0] || {
        total_accounts: 0,
        connected_accounts: 0,
        by_provider: {}
      },
      context: {
        organizationId,
        isOrganizationContext: !!organizationId
      }
    })

  } catch (error) {
    console.error('Error in accounts API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      provider,
      account_type = 'personal',
      display_name,
      username,
      email,
      profile_picture_url,
      unipile_account_id,
      unipile_data = {},
      capabilities = [],
      organization_id
    } = body

    // Validate required fields
    if (!provider || !display_name) {
      return NextResponse.json(
        { error: 'Provider and display_name are required' },
        { status: 400 }
      )
    }

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

    let orgDbId = null

    // If organization_id is provided, validate it exists and user has access
    if (organization_id) {
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('id')
        .eq('clerk_org_id', organization_id)
        .single()

      if (orgError || !orgData) {
        return NextResponse.json(
          { error: 'Organization not found' },
          { status: 404 }
        )
      }

      orgDbId = orgData.id

      // Check if user is a member of the organization
      const { data: memberData, error: memberError } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', orgDbId)
        .eq('user_id', userData.id)
        .single()

      if (memberError || !memberData) {
        return NextResponse.json(
          { error: 'Access denied to organization' },
          { status: 403 }
        )
      }
    }

    // Create the account
    const { data: newAccount, error: createError } = await supabase
      .from('user_accounts')
      .insert({
        user_id: userData.id,
        organization_id: orgDbId,
        provider,
        account_type,
        display_name,
        username,
        email,
        profile_picture_url,
        unipile_account_id,
        unipile_data,
        capabilities,
        connection_status: unipile_account_id ? 'connected' : 'disconnected'
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating account:', createError)
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      account: newAccount
    }, { status: 201 })

  } catch (error) {
    console.error('Error in accounts POST API:', error)
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
