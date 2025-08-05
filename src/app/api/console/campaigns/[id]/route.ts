import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { supabase } from '../../../../../lib/supabase'
import { getFileFromS3, uploadFileToS3Bucket } from '../../../../../utils/s3Util'
import { randomUUID } from 'crypto'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await currentUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: campaignId } = await params

        const { data: campaignData, error: campaignError } = await supabase
            .from('campaigns')
            .select('*')
            .eq('id', campaignId)
            .single()

        if (campaignError) {
            return NextResponse.json({ error: 'No campaigns found' }, { status: 404 })
        }

        return NextResponse.json({ campaignData })
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}