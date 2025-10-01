import { currentUser } from '@clerk/nextjs/server'
import { supabase } from './supabase'
import { supabaseAdmin } from './supabase'
import { z } from 'zod';

// Define a schema for user data validation
const userSchema = z.object({
  clerk_id: z.string().nonempty('Clerk ID is required'),
  email: z.string().email('Invalid email address'),
  full_name: z.string().nonempty('Full name is required'),
  created_at: z.string().nonempty('Created at timestamp is required'),
  updated_at: z.string().nonempty('Updated at timestamp is required'),
});

export async function syncUserToSupabase() {
  try {
    const user = await currentUser()

    if (!user) {
      return null
    }

    // Check if user already exists in Supabase
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', user.id)
      .single()

    if (fetchError) {
      console.error('Error fetching user from Supabase:', fetchError)
      throw new Error('Failed to fetch user from Supabase')
    }

    if (existingUser) {
      // User already exists, no need to sync
      return existingUser
    }

    // Validate user data before inserting
    const userData = {
      clerk_id: user.id,
      email: user.emailAddresses[0]?.emailAddress || '',
      full_name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || '',
      created_at: new Date(user.createdAt).toISOString(),
      updated_at: new Date().toISOString()
    }

    const validation = userSchema.safeParse(userData)
    if (!validation.success) {
      console.error('User data validation failed:', validation.error.errors)
      throw new Error('Invalid user data')
    }

    // Create user in Supabase
    const { data, error: insertError } = await supabase
      .from('users')
      .insert(validation.data)
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting user into Supabase:', insertError)
      throw new Error('Failed to insert user into Supabase')
    }

    console.log('User synced to Supabase:', user.id)
    return data
  } catch (error) {
    console.error('Error in syncUserToSupabase:', error)
    throw error
  }
}

/**
 * Get or create user by Clerk ID - for use in API routes
 * This version ensures the user actually exists in the database before returning
 */
export async function getOrCreateUserByClerkId(clerkUserId: string): Promise<{ id: string } | null> {
  try {
    console.log('Getting or creating user for Clerk ID:', clerkUserId)

    // First try to get existing user
    const { data: existingUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, clerk_id')
      .eq('clerk_id', clerkUserId)
      .single()

    if (existingUser && !userError) {
      console.log('Found existing user:', (existingUser as any).id)
      return existingUser
    }

    if (userError && userError.code !== 'PGRST116') {
      // Some other error occurred
      console.error('Unexpected error fetching user:', userError)
      throw new Error(`Database error: ${userError.message}`)
    }

    // User doesn't exist, create them
    console.log('User not found, creating new user for Clerk ID:', clerkUserId)

    // First, let's check if we have the users table and it's accessible
    const { data: tableCheck, error: tableError } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1)

    if (tableError) {
      console.error('Cannot access users table:', tableError)
      throw new Error(`Cannot access users table: ${tableError.message}`)
    }

    console.log('Users table is accessible, proceeding with user creation')

    // Create the user
    const { data: newUser, error: createError } = await (supabaseAdmin as any)
      .from('users')
      .insert({
        clerk_id: clerkUserId,
        email: `${clerkUserId}@pending.com`, // Temporary email
        full_name: 'User', // Temporary name
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id, clerk_id')
      .single()

    if (createError) {
      console.error('Error creating user in database:', createError)

      // If creation failed due to duplicate, try to fetch again (race condition)
      if (createError.code === '23505') { // Unique violation
        console.log('Duplicate key error, attempting to fetch existing user')
        const { data: retryUser, error: retryError } = await supabaseAdmin
          .from('users')
          .select('id, clerk_id')
          .eq('clerk_id', clerkUserId)
          .single()

        if (retryUser && !retryError) {
          console.log('Found user created by another process:', (retryUser as any).id)
          return retryUser
        }

        console.error('Failed to fetch user after duplicate error:', retryError)
      }

      throw new Error(`Failed to create user: ${createError.message}`)
    }

    if (!newUser) {
      console.error('User creation returned no data')
      throw new Error('User creation returned no data')
    }

    console.log('User successfully created:', newUser.id)

    // Verify the user was actually created by fetching it again
    const { data: verifyUser, error: verifyError } = await supabaseAdmin
      .from('users')
      .select('id, clerk_id')
      .eq('id', newUser.id)
      .single()

    if (verifyError || !verifyUser) {
      console.error('Created user verification failed:', verifyError)
      throw new Error('User creation verification failed')
    }

    console.log('User creation verified successfully:', (verifyUser as any).id)
    return verifyUser

  } catch (error) {
    console.error('Error in getOrCreateUserByClerkId:', error)
    return null
  }
}

/**
 * Enhanced user sync that updates user details when full Clerk context is available
 */
export async function enrichUserFromClerk(): Promise<{ id: string } | null> {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return null
    }

    // Check if user exists and update with enriched data
    const { data: updatedUser, error } = await (supabaseAdmin as any)
      .from('users')
      .upsert({
        clerk_id: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || `${clerkUser.id}@pending.com`,
        full_name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'clerk_id',
        ignoreDuplicates: false
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error enriching user data:', error)
      return null
    }

    return updatedUser
  } catch (error) {
    console.error('Error in enrichUserFromClerk:', error)
    return null
  }
}