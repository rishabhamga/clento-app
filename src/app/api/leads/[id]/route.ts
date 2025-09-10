import { supabase } from '@/lib/supabase'
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios';
import { syndieBaseUrl } from '../../../../lib/utils';

const getLeadDetail = async (id: string, tokenData: { api_token: string }) => {
    try {
        const res = await axios.get(syndieBaseUrl + `/api/leads/${id}`, {
            headers: {
                'Authorization': `Bearer ${tokenData.api_token}`,
                'Content-Type': 'application/json',
            }
        })

        if (!res.data) {
            console.log('No Lead Found')
            return
        }
        const lead: any = res.data.data
        return lead
    } catch (err) {
        console.log(err)
        return
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { pathname } = new URL(request.url)
    const path = pathname.split('/')
    const leadId = path[path.length - 1]

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

        const lead = await getLeadDetail(leadId, tokenData)

        return NextResponse.json(
            { success: true, data: lead }
        )
    } catch (error) {
        console.error('Error fetching lead details:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}