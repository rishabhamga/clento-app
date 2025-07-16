import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { supabase } from '../../../../../lib/supabase'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await currentUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: orgId } = await params

        const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', orgId)
            .maybeSingle()

        if (orgError || !orgData) {
            return NextResponse.json({ error: 'Org not found' }, { status: 404 })
        }

        return NextResponse.json({ orgData })
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}