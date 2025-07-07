import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Function to generate AI-powered messages
async function generateMessage(data: any) {
  const { lead, campaignData } = data
  const { pitch, outreach } = campaignData
  
  try {
    // Use OpenAI to generate personalized message if API key is available
    if (process.env.OPENAI_API_KEY) {
      try {
        const prompt = `
Generate a personalized outreach message for a sales campaign with the following details:

PROSPECT INFORMATION:
- Name: ${lead?.firstName || 'Prospect'} ${lead?.lastName || ''}
- Company: ${lead?.company || 'the company'}
- Title: ${lead?.title || 'professional'}
- Industry: ${lead?.industry || 'their industry'}

CAMPAIGN DETAILS:
- Offering Description: ${pitch?.offeringDescription || 'Our solution helps businesses improve their operations and drive growth.'}
- Pain Points: ${pitch?.painPoints?.map((p: any) => p.description).join(', ') || 'Common industry challenges'}
- Proof Points: ${pitch?.proofPoints?.map((p: any) => p.description).join(', ') || 'Our proven track record'}

MESSAGING GUIDELINES:
- Tone of Voice: ${outreach?.toneOfVoice || 'Professional'}
- Language: ${outreach?.campaignLanguage || 'English (United States)'}
${outreach?.coachingPoints?.map((point: any) => `- ${point.instruction}`).join('\n') || ''}

OUTPUT INSTRUCTIONS:
1. Create a subject line under 60 characters
2. Create a personalized email body with 2-3 short paragraphs
3. Include a clear call-to-action
4. Use one of these sign-offs: ${outreach?.signOffs?.join(', ') || 'Best, Regards, Thanks'}
5. Format the output as JSON with "subject" and "body" fields
`;

        const completion = await openai.chat.completions.create({
          model: "gpt-4o", // Using a more widely available model
          messages: [
            { role: "system", content: "You are an expert sales copywriter who creates personalized outreach messages." },
            { role: "user", content: prompt }
          ]
        });
        
        try {
          const responseText = completion.choices[0].message.content;
          if (responseText) {
            // Try to parse as JSON, but handle potential formatting issues
            let jsonText = responseText;
            // If response starts with ```json and ends with ```, strip those out
            if (responseText.startsWith('```json')) {
              jsonText = responseText.replace(/^```json\n/, '').replace(/\n```$/, '');
            } else if (responseText.startsWith('```')) {
              jsonText = responseText.replace(/^```\n/, '').replace(/\n```$/, '');
            }
            
            try {
              const parsedResponse = JSON.parse(jsonText);
              return {
                subject: parsedResponse.subject,
                body: parsedResponse.body,
                variables: {
                  firstName: lead?.firstName || 'there',
                  company: lead?.company || 'your company',
                  title: lead?.title || 'professional',
                  valueProposition: pitch?.offeringDescription || '',
                  painPoint: pitch?.painPoints && pitch.painPoints.length > 0 
                    ? pitch.painPoints[0].description 
                    : '',
                  proofPoint: pitch?.proofPoints && pitch.proofPoints.length > 0 
                    ? pitch.proofPoints[0].description 
                    : '',
                  callToAction: outreach?.callsToAction && outreach.callsToAction.length > 0 
                    ? outreach.callsToAction[0] 
                    : 'Would you be interested in learning more?',
                  signOff: outreach?.signOffs && outreach.signOffs.length > 0 
                    ? outreach.signOffs[0] 
                    : 'Best'
                }
              };
            } catch (jsonError) {
              console.error('Error parsing JSON from AI response:', jsonError);
              // Continue to fallback
            }
          }
        } catch (parseError) {
          console.error('Error processing AI response:', parseError);
          // Continue to fallback
        }
      } catch (aiError) {
        console.error('Error using OpenAI:', aiError);
        // Continue to fallback
      }
    }
    
    // Fallback to template-based generation if OpenAI fails or is not available
    return generateTemplateBased(lead, pitch, outreach);
  } catch (error) {
    console.error('Error generating message:', error)
    return generateTemplateBased(lead, pitch, outreach);
  }
}

// Helper function for template-based message generation
function generateTemplateBased(lead: any, pitch: any, outreach: any) {
  // Extract values for personalization
  const firstName = lead?.firstName || 'there'
  const company = lead?.company || 'your company'
  const title = lead?.title || 'professional'
  
  // Get random sign-off
  const signOffs = outreach?.signOffs || ['Best', 'Regards', 'Thanks']
  const randomSignOff = signOffs[Math.floor(Math.random() * signOffs.length)]
  
  // Get random call to action
  const ctas = outreach?.callsToAction || ['Would you be interested in learning more?']
  const randomCta = ctas[Math.floor(Math.random() * ctas.length)]
  
  // Generate subject line
  const subject = `Improving ${company}'s growth with our solution`
  
  // Generate email body
  const body = `Hi ${firstName},

I noticed that you're the ${title} at ${company} and thought I'd reach out.

${pitch?.offeringDescription || 'We help companies like yours improve their operations and drive growth.'}

${pitch?.painPoints && pitch.painPoints.length > 0 
  ? `I've worked with other ${company}'s industry companies, and they often struggle with ${pitch.painPoints[0].description.toLowerCase()}.` 
  : ''}

${pitch?.proofPoints && pitch.proofPoints.length > 0 
  ? pitch.proofPoints[0].description 
  : 'We have a proven track record of helping companies achieve significant results.'}

${randomCta}

${randomSignOff},
{{senderName}}
`

  return {
    subject,
    body,
    variables: {
      firstName,
      company,
      title,
      valueProposition: pitch?.offeringDescription || '',
      painPoint: pitch?.painPoints && pitch.painPoints.length > 0 
        ? pitch.painPoints[0].description 
        : '',
      proofPoint: pitch?.proofPoints && pitch.proofPoints.length > 0 
        ? pitch.proofPoints[0].description 
        : '',
      callToAction: randomCta,
      signOff: randomSignOff
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    
    if (!data.lead || !data.campaignData) {
      return NextResponse.json(
        { error: 'Lead and campaign data are required' },
        { status: 400 }
      )
    }

    // Generate message
    const message = await generateMessage(data)

    return NextResponse.json({
      success: true,
      message
    })

  } catch (error) {
    console.error('Error in generate-message API:', error)
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