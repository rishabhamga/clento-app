import { NextResponse } from 'next/server'
import type { CSVLeadData } from '@/types/csv'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const leads: CSVLeadData[] = data.leads

    // Validate each lead
    const validatedLeads = leads.map(lead => {
      const errors: string[] = []

      // Required fields
      if (!lead.first_name?.trim()) errors.push('First name is required')
      if (!lead.last_name?.trim()) errors.push('Last name is required')

      // Email validation if present
      if (lead.email && !isValidEmail(lead.email)) {
        errors.push('Invalid email format')
      }

      // URL validation if present
      if (lead.linkedin_url && !isValidUrl(lead.linkedin_url)) {
        errors.push('Invalid LinkedIn URL format')
      }

      return {
        ...lead,
        validation_status: errors.length === 0 ? 'valid' : 'invalid',
        validation_message: errors.join(', ') || undefined
      }
    })

    // Calculate validation summary
    const validCount = validatedLeads.filter(l => l.validation_status === 'valid').length
    const invalidCount = validatedLeads.length - validCount

    return NextResponse.json({
      leads: validatedLeads,
      summary: {
        total: validatedLeads.length,
        valid: validCount,
        invalid: invalidCount
      }
    })

  } catch (error) {
    console.error('CSV validation error:', error)
    return NextResponse.json(
      { error: 'Failed to validate CSV data' },
      { status: 400 }
    )
  }
}

// Helper functions
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
} 