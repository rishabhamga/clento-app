import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get ICP filter profiles for the user
    const { data: profiles, error } = await supabase
      .from('icp_filter_profiles')
      .select(`
        id,
        profile_name,
        description,
        filters,
        search_type,
        usage_count,
        last_used_at,
        created_at,
        updated_at
      `)
      .eq('user_id', userData.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching ICP profiles:', error)
      return NextResponse.json(
        { error: 'Failed to fetch ICP profiles' },
        { status: 500 }
      )
    }

    return NextResponse.json({ profiles })
  } catch (error) {
    console.error('Error in GET /api/icp-profiles:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { profile_name, description, filters, search_type } = body

    if (!profile_name || !filters) {
      return NextResponse.json(
        { error: 'Profile name and filters are required' },
        { status: 400 }
      )
    }

    // Get user from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get user's organization
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profile')
      .select('organization_id')
      .eq('user_id', userData.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      )
    }

    // Create new ICP filter profile
    const { data: profile, error } = await supabase
      .from('icp_filter_profiles')
      .insert({
        user_id: userData.id,
        organization_id: userProfile?.organization_id,
        profile_name,
        description,
        filters,
        search_type: search_type || 'people'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating ICP profile:', error)
      return NextResponse.json(
        { error: 'Failed to create ICP profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({ profile }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/icp-profiles:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 