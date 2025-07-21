import { auth, currentUser } from "@clerk/nextjs/server"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import { supabase } from "../../../../lib/supabase"

export async function GET(request: NextRequest) {
    const user = await currentUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    try {

        const { data: organizations, error } = await supabase
            .from('organizations')
            .select('*')

        if (error) {
            console.error('Error fetching organizations:', error)
            return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            organizations: organizations || []
        })

    } catch (error) {
        console.error('Error in organizations API:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}