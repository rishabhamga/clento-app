import { NextRequest, NextResponse } from 'next/server'
import { mockTranscripts } from '@/data/mockTranscripts'

export async function POST(request: NextRequest) {
  try {
    const { accountId } = await request.json()

    if (!accountId) {
      return NextResponse.json(
        { error: 'AccountId is required' },
        { status: 400 }
      )
    }

    // Filter transcripts for the selected account
    const accountTranscripts = mockTranscripts.filter(t => 
      t.accountName.toLowerCase().replace(/\s+/g, '-') === accountId
    )

    if (accountTranscripts.length === 0) {
      return NextResponse.json({
        actionItems: [],
        message: "No meeting transcripts found for this account."
      })
    }

    // Extract all action items with meeting context
    const allActionItems: Array<{
      id: string
      text: string
      meetingDate: string
      meetingType: string
      priority: 'high' | 'medium' | 'low'
      status: 'pending' | 'completed' | 'in-progress'
    }> = []

    accountTranscripts.forEach(transcript => {
      if (transcript.actionItems && transcript.actionItems.length > 0) {
        transcript.actionItems.forEach((item, index) => {
          // Determine priority based on keywords
          let priority: 'high' | 'medium' | 'low' = 'medium'
          if (item.toLowerCase().includes('urgent') || item.toLowerCase().includes('asap') || item.toLowerCase().includes('security')) {
            priority = 'high'
          } else if (item.toLowerCase().includes('documentation') || item.toLowerCase().includes('send')) {
            priority = 'low'
          }

          allActionItems.push({
            id: `${transcript.id}-${index}`,
            text: item,
            meetingDate: transcript.date,
            meetingType: transcript.meetingType,
            priority,
            status: 'pending' // Default status
          })
        })
      }
    })

    // Sort by priority and date
    allActionItems.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      }
      return new Date(b.meetingDate).getTime() - new Date(a.meetingDate).getTime()
    })

    return NextResponse.json({
      actionItems: allActionItems,
      totalCount: allActionItems.length,
      byPriority: {
        high: allActionItems.filter(item => item.priority === 'high').length,
        medium: allActionItems.filter(item => item.priority === 'medium').length,
        low: allActionItems.filter(item => item.priority === 'low').length
      }
    })
  } catch (error) {
    console.error('Error extracting action items:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
