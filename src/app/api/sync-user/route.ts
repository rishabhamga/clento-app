import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
  try {
    const user = await currentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'No user found' }, { status: 401 })
    }

    // Check if user already exists in Supabase
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', user.id)
      .single()

    if (existingUser) {
      // User already exists
      return NextResponse.json({ message: 'User already synced', user: existingUser })
    }

    // Create user in Supabase
    const { data, error } = await supabase
      .from('users')
      .insert({
        clerk_id: user.id,
        email: user.emailAddresses[0]?.emailAddress || '',
        full_name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || '',
        created_at: new Date(user.createdAt).toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating user in Supabase:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    console.log('User synced to Supabase:', user.id)
    return NextResponse.json({ message: 'User synced successfully', user: data })
  } catch (error) {
    console.error('Error in sync-user API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 