import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: profileId } = await params

    // Get user from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get specific ICP filter profile
    const { data: profile, error } = await supabase
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
      .eq('id', profileId)
      .eq('user_id', userData.id)
      .single()

    if (error) {
      console.error('Error fetching ICP profile:', error)
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Increment usage count
    await supabase.rpc('increment_profile_usage', { profile_uuid: profileId })

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Error in GET /api/icp-profiles/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: profileId } = await params
    const body = await request.json()
    const { profile_name, description, filters, search_type } = body

    // Get user from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update ICP filter profile
    const { data: profile, error } = await supabase
      .from('icp_filter_profiles')
      .update({
        profile_name,
        description,
        filters,
        search_type,
        updated_at: new Date().toISOString()
      })
      .eq('id', profileId)
      .eq('user_id', userData.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating ICP profile:', error)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Error in PUT /api/icp-profiles/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: profileId } = await params

    // Get user from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Delete ICP filter profile
    const { error } = await supabase
      .from('icp_filter_profiles')
      .delete()
      .eq('id', profileId)
      .eq('user_id', userData.id)

    if (error) {
      console.error('Error deleting ICP profile:', error)
      return NextResponse.json(
        { error: 'Failed to delete profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Profile deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/icp-profiles/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 