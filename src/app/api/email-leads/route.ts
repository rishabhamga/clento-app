import { auth } from "@clerk/nextjs/server";
import { supabase } from "../../../lib/supabase";
import { NextResponse } from "next/server";
import axios from 'axios';

// @yash todo mkae this api
const orgToSmartLeadCampaignMap = {
    '6f462221-2f14-48a3-91d1-b60ba824caf9': [
        '2510990',
        '2510844'
    ],
}

const getCampaign = async (campaignId: string, page: number = 1, perPage: number = 100) => {
    const offset = (page - 1) * perPage;
    const limit = Math.min(perPage, 100); // Cap at 100 (API limit)

    const campaignData = await axios.get(`https://server.smartlead.ai/api/v1/campaigns/${campaignId}/analytics`, {
        params: {
            api_key: process.env.SMARTLEAD_API_KEY,
        },
        headers: {
            'Authorization': `Bearer ${process.env.SMARTLEAD_API_KEY}`,
            'Content-Type': 'application/json',
        },
    });

    const res = await axios.get(`https://server.smartlead.ai/api/v1/campaigns/${campaignId}/leads`, {
        params: {
            api_key: process.env.SMARTLEAD_API_KEY,
            offset: offset,
            limit: limit
        },
        headers: {
            'Authorization': `Bearer ${process.env.SMARTLEAD_API_KEY}`,
            'Content-Type': 'application/json',
        },
    });
    const leads = res.data?.data || []
    const total = res.data?.total_leads

    return {
        leads,
        pagination: {
            page,
            perPage,
            offset,
            total,
            totalPages: Math.ceil(total / perPage)
        },
        analytics: campaignData.data
    };
}

export async function GET(request: Request) {
    try {
        const { orgId } = await auth()

        if (!orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1', 10)
        const perPage = parseInt(searchParams.get('per_page') || '100', 10)

        const validPage = Math.max(1, page)
        const validPerPage = Math.min(Math.max(1, perPage), 500) // Cap at 500 per page

        const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .select('id')
            .eq('clerk_org_id', orgId)
            .single();

        if (orgError || !orgData) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
        }

        const campaignIds = orgToSmartLeadCampaignMap[orgData.id]

        if (!campaignIds || campaignIds.length === 0) {
            return NextResponse.json({
                error: 'No campaigns configured for this organization'
            }, { status: 404 })
        }

        // Fetch MORE than needed to account for duplicates
        // Multiply by 2 to ensure we have enough after deduplication
        const fetchMultiplier = 2;
        const perPagePerCampaign = Math.ceil((validPerPage * fetchMultiplier) / campaignIds.length);

        const results = await Promise.all(campaignIds.map(async (campaignId) => {
            return await getCampaign(campaignId, validPage, perPagePerCampaign)
        }))

        // Combine all leads from all campaigns
        const allLeads = results.flatMap(result => result.leads)

        // Deduplicate leads based on lead.lead.id
        // Using a Map to preserve the first occurrence of each unique lead
        const uniqueLeadsMap = new Map()
        allLeads.forEach(lead => {
            const uniqueKey = lead.lead?.id
            if (!uniqueLeadsMap.has(uniqueKey)) {
                uniqueLeadsMap.set(uniqueKey, lead)
            }
        })

        // Convert Map back to array
        const uniqueLeads = Array.from(uniqueLeadsMap.values())

        // Slice to ensure we return exactly the requested perPage amount
        const paginatedLeads = uniqueLeads.slice(0, validPerPage)

        // Get actual total from API responses
        const apiTotalLeads = results.reduce((sum, result) => sum + Number(result.pagination.total || 0), 0)

        // Calculate total pages based on API total
        const totalPages = Math.ceil(apiTotalLeads / validPerPage)

        // Aggregate analytics from all campaigns
        const analytics = {
            sentCount: results.reduce((sum, result) => sum + Number(result.analytics.sent_count || 0), 0),
            openCount: results.reduce((sum, result) => sum + Number(result.analytics.open_count || 0), 0),
            clickCount: results.reduce((sum, result) => sum + Number(result.analytics.click_count || 0), 0),
            replyCount: results.reduce((sum, result) => sum + Number(result.analytics.reply_count || 0), 0),
            uniqueSentCount: results.reduce((sum, result) => sum + Number(result.analytics.unique_sent_count || 0), 0),
            bounceCount: results.reduce((sum, result) => sum + Number(result.analytics.bounce_count || 0), 0),
            totalCount: results.reduce((sum, result) => sum + Number(result.analytics.campaign_lead_stats?.total || 0), 0)
        }

        return NextResponse.json({
            success: true,
            data: paginatedLeads,
            pagination: {
                page: validPage,
                perPage: validPerPage,
                offset: (validPage - 1) * validPerPage,
                total: apiTotalLeads,
                totalPages: totalPages
            },
            organizationId: orgData.id,
            analytics,
            // Optional: Include campaign info for debugging (remove in production)
            meta: {
                campaignsCount: campaignIds.length,
                perPagePerCampaign: perPagePerCampaign,
                totalLeadsFetched: allLeads.length,
                totalUniqueLeads: uniqueLeads.length,
                duplicatesRemoved: allLeads.length - uniqueLeads.length,
                leadsReturned: paginatedLeads.length,
                leadsPerCampaign: results.map((r, i) => ({
                    campaignId: campaignIds[i],
                    count: r.leads.length,
                    apiTotal: r.pagination.total
                }))
            }
        })
    } catch (error: any) {
        console.error('Error fetching email leads:', error)
        return NextResponse.json({
            error: 'Failed to fetch email leads',
            message: error.message
        }, { status: 500 })
    }
}