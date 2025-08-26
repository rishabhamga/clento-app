import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      console.log('❌ Lead List Process API: Unauthorized - no userId')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    console.log('⚙️ Lead List Process API: userId:', userId, 'leadListId:', id, 'body:', body)

    // Get user's ID from the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (userError || !userData) {
      console.error('⚙️ Lead List Process API: Error fetching user:', userError)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    console.log('⚙️ Lead List Process API: Found user:', userData.id)

    // Verify the lead list exists and belongs to the user
    const { data: leadList, error: leadListError } = await supabase
      .from('lead_lists')
      .select('id, name, csv_file_url, status, total_leads')
      .eq('id', id)
      .eq('user_id', userData.id)
      .single()

    if (leadListError || !leadList) {
      console.error('⚙️ Lead List Process API: Error fetching lead list:', leadListError)
      return NextResponse.json(
        { error: 'Lead list not found or access denied' },
        { status: 404 }
      )
    }

    console.log('⚙️ Lead List Process API: Found lead list:', leadList.id)

    if (!leadList.csv_file_url) {
      console.error('⚙️ Lead List Process API: No CSV file uploaded yet')
      return NextResponse.json(
        { error: 'No CSV file uploaded yet' },
        { status: 400 }
      )
    }

    if (leadList.status === 'processing') {
      console.error('⚙️ Lead List Process API: Lead list is already being processed')
      return NextResponse.json(
        { error: 'Lead list is already being processed' },
        { status: 400 }
      )
    }

    // Extract column mappings from the request body
    const { columnMappings } = body
    console.log('⚙️ Lead List Process API: Column mappings:', columnMappings)

    // Update the lead list status to processing
    const { data: updatedLeadList, error: updateError } = await supabase
      .from('lead_lists')
      .update({
        status: 'processing',
        processing_started_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError || !updatedLeadList) {
      console.error('⚙️ Lead List Process API: Error updating lead list:', updateError)
      return NextResponse.json(
        { error: 'Failed to start processing' },
        { status: 500 }
      )
    }

    console.log('⚙️ Lead List Process API: Started processing for lead list:', id)

    // TODO: In a real implementation, you would:
    // 1. Queue a background job to process the CSV with the column mappings
    // 2. Parse each row according to the mappings
    // 3. Validate and clean the data
    // 4. Insert leads into the database
    // 5. Update the lead list status and counts

    // For now, we'll simulate processing
    setTimeout(async () => {
      try {
        const processedLeads = Math.floor(Math.random() * (leadList.total_leads || 10)) + 1
        const failedLeads = (leadList.total_leads || 10) - processedLeads

        await supabase
          .from('lead_lists')
          .update({
            status: 'completed',
            processed_leads: processedLeads,
            failed_leads: failedLeads,
            processing_completed_at: new Date().toISOString()
          })
          .eq('id', id)
        
        console.log('⚙️ Lead List Process API: Simulated processing completed for:', id, {
          processed: processedLeads,
          failed: failedLeads
        })
      } catch (error) {
        console.error('⚙️ Lead List Process API: Error in simulated processing:', error)
        
        // Update status to failed
        await supabase
          .from('lead_lists')
          .update({
            status: 'failed',
            error_message: 'Processing failed',
            processing_completed_at: new Date().toISOString()
          })
          .eq('id', id)
      }
    }, 5000) // Simulate 5 second processing time

    const response = {
      success: true,
      message: 'Processing started successfully',
      lead_list: updatedLeadList
    }

    console.log('⚙️ Lead List Process API: Started processing for lead list:', id)
    return NextResponse.json(response)

  } catch (error) {
    console.error('⚙️ Error in lead list process API:', error)
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
