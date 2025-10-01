import { auth } from "@clerk/nextjs/server";
import { supabase } from "../../../../lib/supabase";
import { NextResponse } from "next/server";
import axios from 'axios';

const getLeadMessageHistory = async (campaignId: string, leadId: string) => {
    try {
        // Fetch message history - the response structure is { history: [...], from: '...', to: '...' }
        const response = await axios.get(
            `https://server.smartlead.ai/api/v1/campaigns/${campaignId}/leads/${leadId}/message-history`,
            {
                params: {
                    api_key: process.env.SMARTLEAD_API_KEY,
                },
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
        const history = response.data?.history || []

        return {
            messageHistory: history,
            metadata: {
                from: response.data?.from,
                to: response.data?.to,
                totalMessages: history.length
            }
        };
    } catch (error: any) {
        console.error('Error fetching message history:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            url: error.config?.url
        })
        throw error
    }
}

const fetchLeadDetail = async(email: string, campaignId: string) => {

    const leadData = await axios.get(`https://server.smartlead.ai/api/v1/leads?api_key=${process.env.SMARTLEAD_API_KEY}&email=${email}`, {
        headers: {
            'Content-Type': 'application/json',
        },
    });

    console.log(leadData.data, "====================================")

    const historyData = await axios.get(`https://server.smartlead.ai/api/v1/campaigns/${campaignId}/leads/${leadData.data.id}/message-history?api_key=${process.env.SMARTLEAD_API_KEY}`, {
        headers: {
            'Content-Type': 'application/json',
        },
    });
    console.log(historyData.data, "====================================")

    return {
        lead: leadData.data,
        history: historyData.data,
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const campaignId = searchParams.get('campaign_id')
        const leadId = searchParams.get('lead_id')

        console.log('Fetching lead details:', { campaignId, leadId })

        if (!campaignId || !leadId) {
            console.error('Missing required parameters:', { campaignId, leadId })
            return NextResponse.json({
                error: 'Both campaign_id and lead_id are required',
                received: { campaignId, leadId }
            }, { status: 400 })
        }

        const { orgId } = await auth();

        if (!orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .select('id')
            .eq('clerk_org_id', orgId)
            .single();

        if (orgError || !orgData) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
        }

        const result = await getLeadMessageHistory(campaignId, leadId);

        return NextResponse.json({ success: true, data: result })
    } catch (error: any) {
        console.error('Error fetching lead details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        })
        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
                details: error.response?.data || error.message
            },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { email, campaignId } = body

        console.log("Fetching for the lead with this and this", email);

        const lead = await fetchLeadDetail(email, campaignId)

        return NextResponse.json({ success: true, data: lead })
    } catch (error) {
        console.error('Error fetching lead details:', JSON.stringify(error, null, 4))
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}