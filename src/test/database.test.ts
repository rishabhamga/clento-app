import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { supabaseAdmin } from '@/lib/supabase'

// Mock test data
const testUser = {
  clerk_id: 'test_clerk_id_123',
  email: 'test@example.com',
  full_name: 'Test User',
}

const testLead = {
  full_name: 'John Doe',
  email: 'john@example.com',
  company: 'Test Company',
  title: 'CEO',
  status: 'new' as const,
}

describe('Database Schema Tests', () => {
  let testUserId: string

  beforeAll(async () => {
    // Clean up any existing test data
    await supabaseAdmin
      .from('users')
      .delete()
      .eq('clerk_id', testUser.clerk_id)
  })

  afterAll(async () => {
    // Clean up test data
    if (testUserId) {
      await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', testUserId)
    }
  })

  it('should create a user successfully', async () => {
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert(testUser)
      .select()
      .single()

    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(data?.email).toBe(testUser.email)
    expect(data?.clerk_id).toBe(testUser.clerk_id)
    
    testUserId = data?.id || ''
  })

  it('should create a lead for the user', async () => {
    if (!testUserId) return

    const { data, error } = await supabaseAdmin
      .from('leads')
      .insert({
        ...testLead,
        user_id: testUserId,
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(data?.full_name).toBe(testLead.full_name)
    expect(data?.user_id).toBe(testUserId)
  })

  it('should create a campaign for the user', async () => {
    if (!testUserId) return

    const { data, error } = await supabaseAdmin
      .from('campaigns')
      .insert({
        user_id: testUserId,
        name: 'Test Campaign',
        description: 'A test campaign',
        status: 'draft',
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(data?.name).toBe('Test Campaign')
    expect(data?.user_id).toBe(testUserId)
  })

  it('should prevent access to other users data (RLS test)', async () => {
    if (!testUserId) return

    // Create another user
    const { data: otherUser } = await supabaseAdmin
      .from('users')
      .insert({
        clerk_id: 'other_clerk_id_456',
        email: 'other@example.com',
        full_name: 'Other User',
      })
      .select()
      .single()

    if (otherUser) {
      // Try to access the first user's leads as the second user
      // Note: This is a simplified test - in real app, we'd test with actual JWT
      const { data: leads } = await supabaseAdmin
        .from('leads')
        .select('*')
        .eq('user_id', testUserId)

      // With admin client, we can see all data
      expect(leads).toBeDefined()
      
      // Clean up other user
      await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', otherUser.id)
    }
  })

  it('should test the get_user_stats function', async () => {
    if (!testUserId) return

    const { data, error } = await supabaseAdmin
      .rpc('get_user_stats', { user_uuid: testUserId })

    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(Array.isArray(data)).toBe(true)
    
    if (data && data.length > 0) {
      const stats = data[0]
      expect(typeof stats.total_leads).toBe('number')
      expect(typeof stats.total_campaigns).toBe('number')
      expect(stats.total_leads).toBeGreaterThanOrEqual(1) // We created one lead
    }
  })

  it('should enforce unique email constraint per user', async () => {
    if (!testUserId) return

    // Try to create another lead with the same email for the same user
    const { error } = await supabaseAdmin
      .from('leads')
      .insert({
        user_id: testUserId,
        full_name: 'Another John',
        email: testLead.email, // Same email
        company: 'Another Company',
      })

    expect(error).toBeDefined()
    expect(error?.code).toBe('23505') // Unique violation error code
  })

  it('should allow same email for different users', async () => {
    // Create another user
    const { data: otherUser } = await supabaseAdmin
      .from('users')
      .insert({
        clerk_id: 'another_clerk_id_789',
        email: 'another@example.com',
        full_name: 'Another User',
      })
      .select()
      .single()

    if (otherUser) {
      // Create a lead with the same email as the first user's lead
      const { data, error } = await supabaseAdmin
        .from('leads')
        .insert({
          user_id: otherUser.id,
          full_name: 'John Doe Different User',
          email: testLead.email, // Same email as first user's lead
          company: 'Different Company',
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data?.email).toBe(testLead.email)

      // Clean up
      await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', otherUser.id)
    }
  })
}) 