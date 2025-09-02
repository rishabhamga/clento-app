import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { supabase } from "../../../../lib/supabase"

export async function GET(request: NextRequest) {
    try {
        const { userId, orgId } = await auth()

        if (!orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: orgData, error: orgError } = await supabase.from('organizations').select('*').eq('clerk_org_id', orgId).single();

        if (orgError) {
            console.error('Error fetching organizations:', orgError)
            return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 })
        }

        if (!orgData) {
            return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 })
        }
        const { data: planData, error: planError } = await supabase
            .from('syndie_access_tokens')
            .select('*')
            .eq('organization_id', orgData.id)
            .single()

        if(planError) {
            return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            plan: planData ? true : false
        })

    } catch (error) {
        console.error('Error in organizations API:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}