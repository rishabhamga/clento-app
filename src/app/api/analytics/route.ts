import { NextResponse } from "next/server";

import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { supabase } from "../../../lib/supabase";
import axios from "axios";
import { getStats, orgToSmartLeadCampaignMap, getCampaigns } from "../../../helpers/helpers";

const getEmailCampaignAnalytics = async (campaignId: string) => {
    const campaignData = await axios.get(`https://server.smartlead.ai/api/v1/campaigns/${campaignId}/analytics`, {
        params: {
            api_key: process.env.SMARTLEAD_API_KEY,
        },
        headers: {
            'Authorization': `Bearer ${process.env.SMARTLEAD_API_KEY}`,
            'Content-Type': 'application/json',
        },
    });
    return {
        analytics: campaignData.data,
    };
}

export async function GET(request: NextRequest) {
    try {
        const { orgId } = await auth();

        const { data: orgData, error: orgError } = await supabase.from('organizations').select('*').eq('clerk_org_id', orgId).single();

        if (orgError) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
        }

        const { data: campaignData, error: campaignError } = await supabase.from('campaigns').select('*').eq('organization_id', orgData.id);

        if (campaignError) {
            console.log(campaignError);
        }

        const { data: tokenData, error: tokenError } = await supabase.from('syndie_access_tokens').select('*').eq('organization_id', orgData.id).single()

        if (tokenError || !tokenData) {
            return NextResponse.json({ analytics: [] }, { status: 200 })
        }

        const campaignsResult = await getCampaigns(tokenData);
        if (!campaignsResult || !campaignsResult) {
            return NextResponse.json(
                { success: false, error: 'Error fetching campaigns' },
                { status: 401 }
            )
        }
        const statsData = await getStats(campaignsResult);

        const emailCampaigns = orgToSmartLeadCampaignMap[orgData.id];
        const emailStats = await Promise.all(emailCampaigns.map(async (campaignId) => {
            return await getEmailCampaignAnalytics(campaignId)
        }));

        const emailAnalytics = {
            sentCount: emailStats.reduce((sum, result) => sum + Number(result.analytics.sent_count || 0), 0),
            openCount: emailStats.reduce((sum, result) => sum + Number(result.analytics.open_count || 0), 0),
            clickCount: emailStats.reduce((sum, result) => sum + Number(result.analytics.click_count || 0), 0),
            replyCount: emailStats.reduce((sum, result) => sum + Number(result.analytics.reply_count || 0), 0),
            uniqueSentCount: emailStats.reduce((sum, result) => sum + Number(result.analytics.unique_sent_count || 0), 0),
            bounceCount: emailStats.reduce((sum, result) => sum + Number(result.analytics.bounce_count || 0), 0),
            totalCount: emailStats.reduce((sum, result) => sum + Number(result.analytics.campaign_lead_stats?.total || 0), 0)
        }


        const results = {
            campaigns: campaignData,
            linkedinStats: statsData,
            emailStats: emailAnalytics
        }
        return NextResponse.json(results, { status: 200 })

    } catch (error) {
        console.log(JSON.stringify(error, null, 2))
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}