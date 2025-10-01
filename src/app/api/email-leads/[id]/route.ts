import { auth } from "@clerk/nextjs/server";
import { supabase } from "../../../../lib/supabase";
import { NextResponse } from "next/server";
import axios from 'axios';

const getLeadDetail = async (leadId: string) => {

    const leadData = await axios.get(`https://server.smartlead.ai/api/v1/leads/${leadId}`, {
        params: {
            api_key: process.env.SMARTLEAD_API_KEY,
        },
        headers: {
            'Content-Type': 'application/json',
        },
    });

    console.log(leadData, "=================================================")

    return {
    };
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
        history: historyData.data
    }
}

export async function GET(request: Request) {
    try {
        const { pathname } = new URL(request.url)
        const path = pathname.split('/')
        const leadId = path[path.length - 1]

        const { orgId } = await auth();
        const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .select('id')
            .eq('clerk_org_id', orgId)
            .single();

        if (orgError || !orgData) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
        }

        const lead = await getLeadDetail(leadId);

        return NextResponse.json({ success: true, data: lead })
    } catch (error: any) {
        console.error('Error fetching lead details:', JSON.stringify(error, null, 4))
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
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