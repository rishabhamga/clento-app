import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { Webhook } from 'svix'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    // Get the headers
    const headerPayload = await headers()
    const svix_id = headerPayload.get('svix-id')
    const svix_timestamp = headerPayload.get('svix-timestamp')
    const svix_signature = headerPayload.get('svix-signature')

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return NextResponse.json(
        { error: 'Error occurred -- missing headers' },
        { status: 400 }
      )
    }

    // Get the body
    const payload = await req.json()
    const body = JSON.stringify(payload)

    // Create a new Svix instance with your secret
    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '')

    let evt: any

    // Verify the payload with the headers
    try {
      evt = wh.verify(body, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      })
    } catch (err) {
      console.error('Error verifying webhook:', err)
      return NextResponse.json(
        { error: 'Error occurred -- invalid signature' },
        { status: 400 }
      )
    }

    // Handle the webhook
    const { type, data } = evt

    switch (type) {
      case 'user.created':
        await handleUserCreated(data)
        break
      case 'user.updated':
        await handleUserUpdated(data)
        break
      case 'user.deleted':
        await handleUserDeleted(data)
        break
      case 'organization.created':
        await handleOrganizationCreated(data)
        break
      case 'organization.updated':
        await handleOrganizationUpdated(data)
        break
      case 'organization.deleted':
        await handleOrganizationDeleted(data)
        break
      case 'organizationMembership.created':
        await handleOrganizationMembershipCreated(data)
        break
      case 'organizationMembership.deleted':
        await handleOrganizationMembershipDeleted(data)
        break
      default:
        console.log(`Unhandled webhook type: ${type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleUserCreated(userData: any) {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert({
        clerk_id: userData.id,
        email: userData.email_addresses?.[0]?.email_address || '',
        full_name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || '',
        created_at: new Date(userData.created_at).toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating user in Supabase:', error)
      return
    }

    console.log('User created in Supabase:', userData.id)
  } catch (error) {
    console.error('Error in handleUserCreated:', error)
  }
}

async function handleUserUpdated(userData: any) {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        email: userData.email_addresses?.[0]?.email_address || '',
        full_name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || '',
        updated_at: new Date().toISOString()
      })
      .eq('clerk_id', userData.id)

    if (error) {
      console.error('Error updating user in Supabase:', error)
      return
    }

    console.log('User updated in Supabase:', userData.id)
  } catch (error) {
    console.error('Error in handleUserUpdated:', error)
  }
}

async function handleUserDeleted(userData: any) {
  try {
    // Soft delete or handle user deletion
    const { error } = await supabase
      .from('users')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('clerk_id', userData.id)

    if (error) {
      console.error('Error deleting user in Supabase:', error)
      return
    }

    console.log('User deleted in Supabase:', userData.id)
  } catch (error) {
    console.error('Error in handleUserDeleted:', error)
  }
}

async function handleOrganizationCreated(organizationData: any) {
  try {
    console.log('Creating organization in Supabase:', organizationData.id)

    // Create organization using the database function
    const { data: orgId, error } = await supabase
      .rpc('create_organization_with_admin', {
        p_clerk_org_id: organizationData.id,
        p_name: organizationData.name,
        p_slug: organizationData.slug,
        p_user_clerk_id: organizationData.created_by,
        p_logo_url: organizationData.image_url || null,
        p_website_url: null
      })

    if (error) {
      console.error('Error creating organization in Supabase:', error)
      return
    }

    console.log('Organization created in Supabase:', organizationData.id, 'with internal ID:', orgId)
  } catch (error) {
    console.error('Error in handleOrganizationCreated:', error)
  }
}

async function handleOrganizationUpdated(organizationData: any) {
  try {
    console.log('Updating organization in Supabase:', organizationData.id)

    const { error } = await supabase
      .from('organizations')
      .update({
        name: organizationData.name,
        slug: organizationData.slug,
        logo_url: organizationData.image_url || null,
        updated_at: new Date().toISOString()
      })
      .eq('clerk_org_id', organizationData.id)

    if (error) {
      console.error('Error updating organization in Supabase:', error)
      return
    }

    console.log('Organization updated in Supabase:', organizationData.id)
  } catch (error) {
    console.error('Error in handleOrganizationUpdated:', error)
  }
}

async function handleOrganizationDeleted(organizationData: any) {
  try {
    console.log('Deleting organization in Supabase:', organizationData.id)

    // Soft delete or hard delete based on your preference
    const { error } = await supabase
      .from('organizations')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('clerk_org_id', organizationData.id)

    if (error) {
      console.error('Error deleting organization in Supabase:', error)
      return
    }

    console.log('Organization deleted in Supabase:', organizationData.id)
  } catch (error) {
    console.error('Error in handleOrganizationDeleted:', error)
  }
}

async function handleOrganizationMembershipCreated(membershipData: any) {
  try {
    console.log('Adding organization member in Supabase:', membershipData)

    // Get the organization internal ID
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('clerk_org_id', membershipData.organization.id)
      .single()

    if (orgError || !orgData) {
      console.error('Organization not found for membership:', membershipData.organization.id)
      return
    }

    // Get the user internal ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', membershipData.public_user_data.user_id)
      .single()

    if (userError || !userData) {
      console.error('User not found for membership:', membershipData.public_user_data.user_id)
      return
    }

    // Create the membership
    const { error } = await supabase
      .from('organization_members')
      .insert({
        organization_id: orgData.id,
        user_id: userData.id,
        role: membershipData.role,
        status: 'active',
        joined_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error creating organization membership in Supabase:', error)
      return
    }

    console.log('Organization membership created in Supabase:', membershipData.public_user_data.user_id, 'to org:', membershipData.organization.id)
  } catch (error) {
    console.error('Error in handleOrganizationMembershipCreated:', error)
  }
}

async function handleOrganizationMembershipDeleted(membershipData: any) {
  try {
    console.log('Removing organization member in Supabase:', membershipData)

    // Get the organization internal ID
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('clerk_org_id', membershipData.organization.id)
      .single()

    if (orgError || !orgData) {
      console.error('Organization not found for membership deletion:', membershipData.organization.id)
      return
    }

    // Get the user internal ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', membershipData.public_user_data.user_id)
      .single()

    if (userError || !userData) {
      console.error('User not found for membership deletion:', membershipData.public_user_data.user_id)
      return
    }

    // Remove the membership
    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('organization_id', orgData.id)
      .eq('user_id', userData.id)

    if (error) {
      console.error('Error deleting organization membership in Supabase:', error)
      return
    }

    console.log('Organization membership deleted in Supabase:', membershipData.public_user_data.user_id, 'from org:', membershipData.organization.id)
  } catch (error) {
    console.error('Error in handleOrganizationMembershipDeleted:', error)
  }
} 