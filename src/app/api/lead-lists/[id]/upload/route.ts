import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { uploadFileToGCS } from '@/utils/gcsUtil'
import Papa from 'papaparse'

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

interface CSVPreview {
  headers: string[]
  rows: string[][]
  totalRows: number
}

interface ProcessedLead {
  full_name: string
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  title?: string
  company?: string
  industry?: string
  location?: string
  linkedin_url?: string
  source: string
  lead_list_id: string
  organization_id: string
  user_id: string
  status: 'new'
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('🚀 Starting CSV upload process for lead list:', id)

    // Authenticate user
    const { userId, orgId } = await auth()
    if (!userId || !orgId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('👤 User authenticated:', { userId, orgId })

    // Get organization data
    const { data: organizationData, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('clerk_org_id', orgId)
      .maybeSingle()

    if (orgError || !organizationData) {
      console.error('❌ Organization not found:', orgError)
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    console.log('🏢 Organization found:', organizationData)

    // Get user data
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (userError || !userData) {
      console.error('❌ User not found:', userError)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    console.log('👤 User found:', userData)

    // Get lead list
    const { data: leadList, error: leadListError } = await supabaseAdmin
      .from('lead_lists')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organizationData.id)
      .single()

    if (leadListError || !leadList) {
      console.error('❌ Lead list not found:', leadListError)
      return NextResponse.json(
        { error: 'Lead list not found' },
        { status: 404 }
      )
    }

    console.log('📋 Lead list found:', { id: leadList.id, name: leadList.name })

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    console.log('📁 File received:', {
      name: file.name,
      size: file.size,
      type: file.type
    })

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Only CSV files are allowed' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const fileContent = fileBuffer.toString('utf-8')

    console.log('📄 File content preview:', fileContent.substring(0, 200) + '...')

    // Upload to Google Cloud Storage
    console.log('☁️ Uploading to Google Cloud Storage...')
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const gcsFileName = `lead-lists/${leadList.id}/${timestamp}-${file.name}`

    const uploadResult = await uploadFileToGCS(
      fileBuffer,
      gcsFileName,
      'text/csv',
      ''
    )

    if (!uploadResult.success) {
      console.error('❌ Failed to upload to GCS:', uploadResult.error)
      return NextResponse.json(
        { error: `Failed to upload file to cloud storage: ${uploadResult.error}` },
        { status: 500 }
      )
    }

    console.log('✅ File uploaded to GCS:', uploadResult.url)

    // Parse CSV content
    console.log('📊 Parsing CSV content...')
    const parseResult = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
      transform: (value: string) => value.trim()
    })

    if (parseResult.errors.length > 0) {
      console.error('❌ CSV parsing errors:', parseResult.errors)
      return NextResponse.json(
        { error: 'Invalid CSV format: ' + parseResult.errors[0].message },
        { status: 400 }
      )
    }

    const csvData = parseResult.data as Record<string, string>[]
    const headers = parseResult.meta.fields || []

    console.log('📊 CSV parsed successfully:', {
      headers: headers,
      totalRows: csvData.length,
      firstRow: csvData[0]
    })

    // Create preview
    const preview: CSVPreview = {
      headers: headers,
      rows: csvData.slice(0, 5).map(row => headers.map(header => row[header] || '')),
      totalRows: csvData.length
    }

    // Process leads and insert into database
    console.log('💾 Processing leads for database insertion...')
    let processedCount = 0
    let failedCount = 0
    const errors: string[] = []

    const leadsToInsert: ProcessedLead[] = []

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i]

      try {
        // Extract required fields
        const email = row.email || row.Email || row.EMAIL || ''
        const firstName = row.first_name || row.firstName || row['First Name'] || ''
        const lastName = row.last_name || row.lastName || row['Last Name'] || ''
        const fullName = row.full_name || row.fullName || row['Full Name'] ||
                        `${firstName} ${lastName}`.trim() || email.split('@')[0]

        if (!email) {
          errors.push(`Row ${i + 1}: Missing email address`)
          failedCount++
          continue
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
          errors.push(`Row ${i + 1}: Invalid email format: ${email}`)
          failedCount++
          continue
        }

        const processedLead: ProcessedLead = {
          full_name: fullName,
          email: email,
          first_name: firstName || undefined,
          last_name: lastName || undefined,
          phone: row.phone || row.Phone || row.PHONE || undefined,
          title: row.title || row.Title || row.TITLE || row.job_title || row['Job Title'] || undefined,
          company: row.company_name || row.companyName || row['Company Name'] || row.company || row.Company || undefined,
          industry: row.company_industry || row.companyIndustry || row['Company Industry'] || row.industry || row.Industry || undefined,
          location: row.location || row.Location || row.LOCATION || row.city || row.City || undefined,
          linkedin_url: row.linkedin_url || row.linkedinUrl || row['LinkedIn URL'] || row.linkedin || row.LinkedIn || undefined,
          source: 'manual',
          lead_list_id: leadList.id,
          organization_id: organizationData.id,
          user_id: userData.id,
          status: 'new'
        }

        leadsToInsert.push(processedLead)
        processedCount++

      } catch (error: any) {
        console.error(`❌ Error processing row ${i + 1}:`, error)
        errors.push(`Row ${i + 1}: ${error.message}`)
        failedCount++
      }
    }

    console.log('📊 Processing summary:', {
      totalRows: csvData.length,
      processedCount,
      failedCount,
      leadsToInsert: leadsToInsert.length
    })

    // Insert leads into database in batches
    if (leadsToInsert.length > 0) {
      console.log('💾 Inserting leads into database...')

      const batchSize = 100
      let insertedCount = 0

      for (let i = 0; i < leadsToInsert.length; i += batchSize) {
        const batch = leadsToInsert.slice(i, i + batchSize)

        const { data: insertedLeads, error: insertError } = await supabaseAdmin
          .from('leads')
          .insert(batch)
          .select('id')

        if (insertError) {
          console.error('❌ Error inserting batch:', insertError)
          failedCount += batch.length
          errors.push(`Database error: ${insertError.message}`)
        } else {
          insertedCount += insertedLeads?.length || 0
          console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}: ${insertedLeads?.length || 0} leads`)
        }
      }

      console.log('💾 Database insertion complete:', {
        attempted: leadsToInsert.length,
        inserted: insertedCount,
        failed: leadsToInsert.length - insertedCount
      })
    }

    // Update lead list with file information and stats
    const { error: updateError } = await supabaseAdmin
      .from('lead_lists')
      .update({
        csv_file_url: uploadResult.url,
        original_filename: file.name,
        total_leads: csvData.length,
        processed_leads: processedCount,
        failed_leads: failedCount,
        status: failedCount > 0 ? 'completed' : 'completed', // Using 'completed' status as per schema
        processing_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) {
      console.error('❌ Error updating lead list:', updateError)
    } else {
      console.log('✅ Lead list updated with processing results')
    }

    // Get updated lead list
    const { data: updatedLeadList } = await supabaseAdmin
      .from('lead_lists')
      .select('*')
      .eq('id', id)
      .single()

    console.log('🎉 Upload process completed successfully')

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${processedCount} leads`,
      lead_list: updatedLeadList,
      preview: preview,
      stats: {
        total_rows: csvData.length,
        processed: processedCount,
        failed: failedCount,
        errors: errors.slice(0, 10) // Limit errors in response
      },
      file_info: {
        name: file.name,
        size: file.size,
        gcs_url: uploadResult.url,
        gcs_file_name: gcsFileName
      }
    })

  } catch (error: any) {
    console.error('❌ Error in upload process:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message
      },
      { status: 500 }
    )
  }
}
