import { supabase } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';
import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';
import { getCampaigns, getLeads, getStats } from '../../../helpers/helpers';

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
        const filteredCampaigns = campaignsArray.filter(it => it.status === 'active' || 'paused')
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