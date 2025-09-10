import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      console.log('❌ Lead List Preview API: Unauthorized - no userId')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    console.log('👁️ Lead List Preview API: userId:', userId, 'leadListId:', id)

    // Get user's ID from the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (userError || !userData) {
      console.error('👁️ Lead List Preview API: Error fetching user:', userError)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    console.log('👁️ Lead List Preview API: Found user:', userData.id)

    // Verify the lead list exists and belongs to the user
    const { data: leadList, error: leadListError } = await supabase
      .from('lead_lists')
      .select('id, name, csv_file_url, original_filename, status')
      .eq('id', id)
      .eq('user_id', userData.id)
      .single()

    if (leadListError || !leadList) {
      console.error('👁️ Lead List Preview API: Error fetching lead list:', leadListError)
      return NextResponse.json(
        { error: 'Lead list not found or access denied' },
        { status: 404 }
      )
    }

    console.log('👁️ Lead List Preview API: Found lead list:', leadList.id)

    if (!leadList.csv_file_url) {
      console.error('👁️ Lead List Preview API: No CSV file uploaded yet')
      return NextResponse.json(
        { error: 'No CSV file uploaded yet' },
        { status: 400 }
      )
    }

    // In a real implementation, you would:
    // 1. Download the file from cloud storage
    // 2. Parse the CSV content
    // 3. Return a preview of the first few rows

    // For now, we'll return a mock preview
    const mockPreview = {
      success: true,
      preview: {
        filename: leadList.original_filename,
        headers: ['first_name', 'last_name', 'email', 'company', 'title'],
        rows: [
          ['John', 'Doe', 'john.doe@example.com', 'Acme Corp', 'CEO'],
          ['Jane', 'Smith', 'jane.smith@example.com', 'Tech Inc', 'CTO'],
          ['Bob', 'Johnson', 'bob.johnson@example.com', 'StartupXYZ', 'Founder']
        ],
        total_rows: 100,
        status: leadList.status
      }
    }

    console.log('👁️ Lead List Preview API: Returning mock preview')
    return NextResponse.json(mockPreview)

  } catch (error) {
    console.error('👁️ Error in lead list preview API:', error)
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
