import { NextRequest, NextResponse } from 'next/server'
import { mockTranscripts, type MeetingTranscript } from '@/data/mockTranscripts'

export async function POST(request: NextRequest) {
  try {
    const { query, accountId } = await request.json()

    if (!query || !accountId) {
      return NextResponse.json(
        { error: 'Query and accountId are required' },
        { status: 400 }
      )
    }

    // Filter transcripts for the selected account
    const accountTranscripts = mockTranscripts.filter(t => 
      t.accountName.toLowerCase().replace(/\s+/g, '-') === accountId
    )

    if (accountTranscripts.length === 0) {
      return NextResponse.json({
        response: "I couldn't find any meeting transcripts for this account.",
        sources: []
      })
    }

    // Generate AI response based on query
    const response = await generateAIResponse(query, accountTranscripts)

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error processing chat request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function generateAIResponse(query: string, transcripts: MeetingTranscript[]) {
  const queryLower = query.toLowerCase()
  let responseContent = ""
  let sources: Array<{
    meetingId: string
    meetingDate: string
    snippet: string
    participants: string[]
  }> = []

  // Enhanced keyword matching and response generation
  if (queryLower.includes('security') || queryLower.includes('compliance') || queryLower.includes('gdpr') || queryLower.includes('soc')) {
    responseContent = "Based on your conversations, here are the key security and compliance concerns mentioned:\n\n"
    
    transcripts.forEach(transcript => {
      const relevantExchanges = transcript.transcript.filter(exchange => 
        exchange.text.toLowerCase().includes('security') ||
        exchange.text.toLowerCase().includes('compliance') ||
        exchange.text.toLowerCase().includes('gdpr') ||
        exchange.text.toLowerCase().includes('soc') ||
        exchange.text.toLowerCase().includes('iso') ||
        exchange.text.toLowerCase().includes('pci') ||
        exchange.text.toLowerCase().includes('certification')
      )
      
      if (relevantExchanges.length > 0) {
        sources.push({
          meetingId: transcript.id,
          meetingDate: transcript.date,
          snippet: relevantExchanges[0].text,
          participants: transcript.participants.map(p => p.name)
        })
        
        responseContent += `**${transcript.date} - ${transcript.meetingType.charAt(0).toUpperCase() + transcript.meetingType.slice(1)} Meeting:**\n`
        relevantExchanges.slice(0, 2).forEach(exchange => {
          responseContent += `• ${exchange.speaker}: "${exchange.text}"\n`
        })
        responseContent += "\n"
      }
    })

    if (sources.length === 0) {
      responseContent = "I couldn't find specific security or compliance discussions in the available meeting transcripts for this account. You may want to ask about other topics like integrations, pricing, or technical requirements."
    }
  } 
  else if (queryLower.includes('action') || queryLower.includes('follow') || queryLower.includes('next steps') || queryLower.includes('todo')) {
    responseContent = "Here are the action items and next steps from your recent meetings:\n\n"
    
    transcripts.forEach(transcript => {
      if (transcript.actionItems && transcript.actionItems.length > 0) {
        sources.push({
          meetingId: transcript.id,
          meetingDate: transcript.date,
          snippet: `Action items: ${transcript.actionItems.join(', ')}`,
          participants: transcript.participants.map(p => p.name)
        })
        
        responseContent += `**${transcript.date} - ${transcript.meetingType.charAt(0).toUpperCase() + transcript.meetingType.slice(1)} Meeting:**\n`
        transcript.actionItems.forEach(item => {
          responseContent += `• ${item}\n`
        })
        responseContent += "\n"
      }
    })

    if (sources.length === 0) {
      responseContent = "I couldn't find specific action items in the meeting transcripts. The action items might not have been explicitly documented, or they may be embedded in the conversation flow."
    }
  } 
  else if (queryLower.includes('integration') || queryLower.includes('salesforce') || queryLower.includes('api') || queryLower.includes('technical')) {
    responseContent = "Here's what was discussed about integrations and technical requirements:\n\n"
    
    transcripts.forEach(transcript => {
      const relevantExchanges = transcript.transcript.filter(exchange => 
        exchange.text.toLowerCase().includes('integration') ||
        exchange.text.toLowerCase().includes('salesforce') ||
        exchange.text.toLowerCase().includes('api') ||
        exchange.text.toLowerCase().includes('crm') ||
        exchange.text.toLowerCase().includes('technical')
      )
      
      if (relevantExchanges.length > 0) {
        sources.push({
          meetingId: transcript.id,
          meetingDate: transcript.date,
          snippet: relevantExchanges[0].text,
          participants: transcript.participants.map(p => p.name)
        })
        
        responseContent += `**${transcript.date} - ${transcript.meetingType.charAt(0).toUpperCase() + transcript.meetingType.slice(1)} Meeting:**\n`
        relevantExchanges.slice(0, 2).forEach(exchange => {
          responseContent += `• ${exchange.speaker}: "${exchange.text}"\n`
        })
        responseContent += "\n"
      }
    })
  }
  else if (queryLower.includes('pricing') || queryLower.includes('cost') || queryLower.includes('budget') || queryLower.includes('roi')) {
    responseContent = "Here's what was discussed about pricing and ROI:\n\n"
    
    transcripts.forEach(transcript => {
      const relevantExchanges = transcript.transcript.filter(exchange => 
        exchange.text.toLowerCase().includes('pricing') ||
        exchange.text.toLowerCase().includes('cost') ||
        exchange.text.toLowerCase().includes('budget') ||
        exchange.text.toLowerCase().includes('roi') ||
        exchange.text.toLowerCase().includes('volume') ||
        exchange.text.toLowerCase().includes('subscription')
      )
      
      if (relevantExchanges.length > 0) {
        sources.push({
          meetingId: transcript.id,
          meetingDate: transcript.date,
          snippet: relevantExchanges[0].text,
          participants: transcript.participants.map(p => p.name)
        })
        
        responseContent += `**${transcript.date} - ${transcript.meetingType.charAt(0).toUpperCase() + transcript.meetingType.slice(1)} Meeting:**\n`
        relevantExchanges.slice(0, 2).forEach(exchange => {
          responseContent += `• ${exchange.speaker}: "${exchange.text}"\n`
        })
        responseContent += "\n"
      }
    })
  }
  else if (queryLower.includes('summary') || queryLower.includes('overview') || queryLower.includes('key points')) {
    responseContent = "Here's a summary of your key meetings:\n\n"
    
    transcripts.forEach(transcript => {
      sources.push({
        meetingId: transcript.id,
        meetingDate: transcript.date,
        snippet: transcript.summary || 'No summary available',
        participants: transcript.participants.map(p => p.name)
      })
      
      responseContent += `**${transcript.date} - ${transcript.meetingType.charAt(0).toUpperCase() + transcript.meetingType.slice(1)} Meeting** (${transcript.duration}):\n`
      responseContent += `${transcript.summary}\n\n`
      
      if (transcript.keyTopics && transcript.keyTopics.length > 0) {
        responseContent += `Key Topics: ${transcript.keyTopics.join(', ')}\n\n`
      }
    })
  }
  else {
    // General search across all transcript content
    responseContent = `I found ${transcripts.length} meeting(s) for this account. Here are some things you can ask me about:\n\n`
    responseContent += "• **Security and compliance concerns** - GDPR, SOC 2, ISO certifications\n"
    responseContent += "• **Integration requirements** - Salesforce, APIs, technical setup\n"
    responseContent += "• **Action items and next steps** - Follow-ups and deliverables\n"
    responseContent += "• **Pricing discussions** - Budget, ROI, subscription models\n"
    responseContent += "• **Meeting summaries** - Overview of all conversations\n\n"
    responseContent += "What specific topic would you like to explore?"

    // Add basic meeting info as sources
    transcripts.forEach(transcript => {
      sources.push({
        meetingId: transcript.id,
        meetingDate: transcript.date,
        snippet: transcript.summary || `${transcript.meetingType} meeting with ${transcript.participants.length} participants`,
        participants: transcript.participants.map(p => p.name)
      })
    })
  }

  return {
    response: responseContent,
    sources: sources
  }
}
