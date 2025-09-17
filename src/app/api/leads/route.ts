import { supabase } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';
import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';
import { syndieBaseUrl } from '../../../lib/utils';

const getCampaigns = async (tokenData: { api_token: string }) => {
    try {
        const res = await axios.get(syndieBaseUrl + '/api/campaigns' + '?includeAnalytics=true&includeDetailedActions=true', {
            headers: {
                'Authorization': `Bearer ${tokenData.api_token}`,
                'Content-Type': 'application/json',
            }
        })

        if (!res.data) {
            console.log('No Campaigns Found')
            return
        }
        const campaignsArray: any[] = res.data.data
        // console.log(JSON.stringify(res.data.data, null, 4))

        return campaignsArray.filter(it => it.status !== 'paused' && it.status !== 'draft')
    } catch (err) {
        console.log(JSON.stringify(err, null, 4));
        return
    }
}

const getLeads = async (tokenData: { api_token: string }, campaignIds: string[], page: string, limit: string, status?: string, search?: string) => {
    try {
        const paramsObj: Record<string, string> = { page, limit };
        if (status !== undefined) {
            paramsObj.status = status;
        }
        if (search !== undefined) {
            paramsObj.search = search;
        }
        const params = new URLSearchParams(paramsObj);
        console.log(params)
        campaignIds.forEach(id => params.append('campaignId', id));
        const res = await axios.get(`${syndieBaseUrl}/api/leads?${params.toString()}`, {
            headers: {
                'Authorization': `Bearer ${tokenData.api_token}`,
                'Content-Type': 'application/json',
            }
        });
        return res.data;
    } catch (err) {
        console.log(err);
        return;
    }
}

const getStats = async (campaignsArray: any) => {
    const allStats = campaignsArray.map((it: any) => it.stats)
    const totals = allStats.reduce((acc: any, curr: any) => {
        Object.keys(curr).forEach((key) => {
            acc[key] = (acc[key] || 0) + curr[key];
        });
        return acc;
    }, {} as Record<string, number>);
    console.log(totals);
    return totals
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const stats = searchParams.get('stats');

    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '15';
    const status = searchParams.get('connectionStatus') ?? undefined;
    const searchTerm = searchParams.get('search') ?? undefined;

    try {
        const { orgId } = await auth()
        const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .select('id')
            .eq('clerk_org_id', orgId)
            .single();

        if (!orgData || orgError) {
            console.log(orgError)
            return NextResponse.json(
                { success: false, error: 'Org Not Found' },
                { status: 401 }
            )
        }

        const { data: tokenData, error: tokenError } = await supabase.from('syndie_access_tokens').select('*').eq('organization_id', orgData.id).single()
        if (!tokenData || tokenError) {
            console.log(tokenError)
            return NextResponse.json(
                { success: false, error: 'Token Not Found' },
                { status: 401 }
            )
        }
        const campaignsArray = await getCampaigns(tokenData);
        if (!campaignsArray) {
            return NextResponse.json(
                { success: false, error: 'Error fetching campaigns' },
                { status: 401 }
            )
        }
        if (stats) {
            const statsData = await getStats(campaignsArray)
            return NextResponse.json(
                { success: true, data: statsData }
            )
        }
        const filteredCampaigns = campaignsArray.filter(it => it.status === 'active')
        const campaignIds = filteredCampaigns.map(it => it.id);

        const leads = await getLeads(tokenData, campaignIds, page, limit, status, searchTerm);
        return NextResponse.json(
            { success: true, data: leads }
        )
    } catch (error) {
        console.error('Error fetching lead details:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}