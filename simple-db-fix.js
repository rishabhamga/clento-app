const { createClient } = require('@supabase/supabase-js')

// You'll need to set these environment variables or replace with your actual values
const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function testDatabaseIssues() {
  console.log('🔍 Testing database for known issues...')
  
  // Test 1: Check if confidence column exists
  console.log('\n1. Testing confidence column...')
  console.log("adding this log to test deployment")
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('confidence')
      .limit(1)
    
    if (error) {
      if (error.message.includes('confidence')) {
        console.log('❌ Confidence column is missing!')
        console.log('   Run this SQL in Supabase dashboard:')
        console.log('   ALTER TABLE leads ADD COLUMN confidence DECIMAL(3,2) DEFAULT 1.0;')
      } else {
        console.log('⚠️  Other error with leads table:', error.message)
      }
    } else {
      console.log('✅ Confidence column exists')
    }
  } catch (err) {
    console.log('⚠️  Could not test confidence column:', err.message)
  }
  
  // Test 2: Test upsert operation
  console.log('\n2. Testing lead upsert operation...')
  try {
    const testLead = {
      external_id: `test-${Date.now()}`,
      first_name: 'Test',
      last_name: 'User',
      full_name: 'Test User',
      email: `test${Date.now()}@example.com`,
      company: 'Test Company',
      source: 'test',
      verified: false,
      confidence: 1.0
    }
    
    const { data, error } = await supabase
      .from('leads')
      .upsert(testLead, { 
        onConflict: 'external_id',
        ignoreDuplicates: false
      })
      .select()
    
    if (error) {
      console.log('❌ Upsert failed:', error.message)
      if (error.message.includes('unique') || error.message.includes('constraint')) {
        console.log('   This likely means unique constraints are missing.')
        console.log('   Run the SQL commands from fix-database-quick.md')
      }
    } else {
      console.log('✅ Upsert test successful')
      
      // Clean up test data
      await supabase
        .from('leads')
        .delete()
        .eq('external_id', testLead.external_id)
      console.log('✅ Test data cleaned up')
    }
  } catch (err) {
    console.log('❌ Upsert test failed:', err.message)
  }
  
  // Test 3: Check if helper functions exist
  console.log('\n3. Testing upsert_lead function...')
  try {
    const { data, error } = await supabase
      .rpc('upsert_lead', {
        p_external_id: `func-test-${Date.now()}`,
        p_first_name: 'Func',
        p_last_name: 'Test',
        p_full_name: 'Func Test',
        p_email: `functest${Date.now()}@example.com`,
        p_phone: null,
        p_title: 'Tester',
        p_company: 'Test Co',
        p_industry: null,
        p_location: null,
        p_linkedin_url: null,
        p_employee_count: null,
        p_revenue: null,
        p_source: 'test',
        p_verified: false,
        p_confidence: 1.0,
        p_technologies: []
      })
    
    if (error) {
      console.log('❌ upsert_lead function missing or failed:', error.message)
      console.log('   Run the SQL commands from fix-database-quick.md to add helper functions')
    } else {
      console.log('✅ upsert_lead function works')
      
      // Clean up
      await supabase
        .from('leads')
        .delete()
        .eq('id', data)
    }
  } catch (err) {
    console.log('❌ upsert_lead function test failed:', err.message)
  }
  
  // Test 4: Check sequence_steps table
  console.log('\n4. Testing sequence_steps table...')
  try {
    const { data, error } = await supabase
      .from('sequence_steps')
      .select('id')
      .limit(1)
    
    if (error) {
      if (error.message.includes('does not exist')) {
        console.log('❌ sequence_steps table is missing!')
        console.log('   Run the SQL commands from fix-database-quick.md to add missing tables')
      } else {
        console.log('⚠️  Other error with sequence_steps table:', error.message)
      }
    } else {
      console.log('✅ sequence_steps table exists')
    }
  } catch (err) {
    console.log('⚠️  Could not test sequence_steps table:', err.message)
  }
  
  // Test 5: Check messages table
  console.log('\n5. Testing messages table...')
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('id')
      .limit(1)
    
    if (error) {
      if (error.message.includes('does not exist')) {
        console.log('❌ messages table is missing!')
        console.log('   Run the SQL commands from fix-database-quick.md to add missing tables')
      } else {
        console.log('⚠️  Other error with messages table:', error.message)
      }
    } else {
      console.log('✅ messages table exists')
    }
  } catch (err) {
    console.log('⚠️  Could not test messages table:', err.message)
  }
  
  console.log('\n🎯 Database testing completed!')
  console.log('\n📋 Next Steps:')
  console.log('1. If any tests failed, open your Supabase dashboard')
  console.log('2. Go to SQL Editor → New query')
  console.log('3. Copy and run the SQL commands from fix-database-quick.md')
  console.log('4. Test your application after applying the fixes')
}

if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_SERVICE_KEY === 'YOUR_SERVICE_ROLE_KEY') {
  console.log('❌ Please set your Supabase credentials:')
  console.log('Either set environment variables:')
  console.log('export PUBLIC_SUPABASE_URL="your_url"')
  console.log('export SUPABASE_SERVICE_ROLE_KEY="your_key"')
  console.log('\nOr edit this file and replace the placeholder values')
} else {
  testDatabaseIssues()
} 