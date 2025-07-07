import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { useAuth } from '@clerk/nextjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}

if (!supabaseAnonKey) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Server-side client with service role (for admin operations)
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Custom hook to create an authenticated Supabase client
export function useSupabaseClient() {
  const { getToken } = useAuth()
  
  const authenticatedClient = createClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      global: {
        fetch: async (url, options: any = {}) => {
          const token = await getToken({ template: 'supabase' })
          
          return fetch(url, {
            ...options,
            headers: {
              ...options.headers,
              Authorization: token ? `Bearer ${token}` : '',
            },
          })
        },
      },
    }
  )
  
  return authenticatedClient
}

// Helper function to get or create user record
export async function getOrCreateUser(clerkUserId: string, email: string, fullName?: string) {
  // First, try to get existing user
  const { data: existingUser, error: selectError } = await supabase
    .from('users')
    .select('*')
    .eq('clerk_id', clerkUserId)
    .single()

  if (existingUser && !selectError) {
    return { user: existingUser, error: null }
  }

  // If user doesn't exist, create a new one
  const { data: newUser, error: insertError } = await supabase
    .from('users')
    .insert({
      clerk_id: clerkUserId,
      email,
      full_name: fullName || null,
    })
    .select()
    .single()

  return { user: newUser, error: insertError }
}

// Helper function to get user stats
export async function getUserStats(userId: string) {
  const { data, error } = await supabase
    .rpc('get_user_stats', { user_uuid: userId })

  if (error) {
    console.error('Error fetching user stats:', error)
    return null
  }

  return data?.[0] || {
    total_leads: 0,
    total_campaigns: 0,
    active_campaigns: 0,
    messages_sent: 0,
    replies_received: 0,
    positive_replies: 0,
  }
}

// Helper function to get leads with pagination and filtering
export async function getLeads(
  userId: string,
  options: {
    status?: string
    campaign?: string
    limit?: number
    offset?: number
    search?: string
  } = {}
) {
  let query = supabase
    .from('leads')
    .select(`
      *,
      campaign_leads(
        campaign_id,
        status as campaign_status,
        campaigns(name)
      )
    `)
    .eq('user_id', userId)

  // Apply filters
  if (options.status && options.status !== 'all') {
    query = query.eq('status', options.status)
  }

  if (options.campaign) {
    query = query.eq('campaign_leads.campaign_id', options.campaign)
  }

  if (options.search) {
    query = query.or(`full_name.ilike.%${options.search}%,email.ilike.%${options.search}%,company.ilike.%${options.search}%`)
  }

  // Apply pagination
  if (options.limit) {
    query = query.limit(options.limit)
  }

  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  return { data: data || [], error }
}

// Helper function to get campaigns with lead counts
export async function getCampaigns(userId: string) {
  const { data, error } = await supabase
    .from('campaigns')
    .select(`
      *,
      campaign_leads(count),
      sequence_steps(count)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  return { data: data || [], error }
}

// Helper function to get messages for a specific lead
export async function getLeadMessages(leadId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: true })

  return { data: data || [], error }
}

// Helper function to create a new lead
export async function createLead(
  userId: string,
  leadData: Omit<Database['public']['Tables']['leads']['Insert'], 'user_id'>
) {
  const { data, error } = await supabase
    .from('leads')
    .insert({
      ...leadData,
      user_id: userId,
    })
    .select()
    .single()

  return { data, error }
}

// Helper function to create a new campaign
export async function createCampaign(
  userId: string,
  campaignData: Omit<Database['public']['Tables']['campaigns']['Insert'], 'user_id'>
) {
  const { data, error } = await supabase
    .from('campaigns')
    .insert({
      ...campaignData,
      user_id: userId,
    })
    .select()
    .single()

  return { data, error }
}

// Helper function to add leads to a campaign
export async function addLeadsToCampaign(campaignId: string, leadIds: string[]) {
  const campaignLeads = leadIds.map(leadId => ({
    campaign_id: campaignId,
    lead_id: leadId,
  }))

  const { data, error } = await supabase
    .from('campaign_leads')
    .insert(campaignLeads)
    .select()

  return { data, error }
}

// Helper function to update lead status
export async function updateLeadStatus(
  leadId: string,
  status: Database['public']['Tables']['leads']['Row']['status']
) {
  const { data, error } = await supabase
    .from('leads')
    .update({ status })
    .eq('id', leadId)
    .select()
    .single()

  return { data, error }
}

// Helper function to log a message
export async function logMessage(
  messageData: Database['public']['Tables']['messages']['Insert']
) {
  const { data, error } = await supabase
    .from('messages')
    .insert(messageData)
    .select()
    .single()

  return { data, error }
}

// Helper function to get integration credentials
export async function getIntegrationCredentials(
  userId: string,
  provider: Database['public']['Tables']['integration_credentials']['Row']['provider']
) {
  const { data, error } = await supabase
    .from('integration_credentials')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', provider)
    .eq('is_active', true)
    .single()

  return { data, error }
}

// Helper function to store integration credentials
export async function storeIntegrationCredentials(
  userId: string,
  provider: Database['public']['Tables']['integration_credentials']['Row']['provider'],
  credentials: Record<string, unknown>
) {
  const { data, error } = await supabase
    .from('integration_credentials')
    .upsert({
      user_id: userId,
      provider,
      credentials,
      is_active: true,
    })
    .select()
    .single()

  return { data, error }
} 