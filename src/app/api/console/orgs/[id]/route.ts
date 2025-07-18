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

        const { id: orgId } = await params

        const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', orgId)
            .maybeSingle()

        const { data: campaignData, error: campaignError } = await supabase
            .from('campaigns')
            .select('*')
            .eq('organization_id', orgId)

        if (orgError || !orgData) {
            return NextResponse.json({ error: 'Org not found' }, { status: 404 })
        }
        if (campaignError) {
            return NextResponse.json({ error: 'No campaigns found' }, { status: 404 })
        }

        return NextResponse.json({ orgData, campaignData })
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function POST(
    request: Request
) {
    try {
        const formData = await request.formData()
        const orgId = formData.get('orgId')
        const listName = formData.get('listName')
        const campaignId = formData.get('campaignId')
        const csv = formData.get('csv')
        const s3Bucket = "mc-contact-lists"

        if (!orgId) {
            return NextResponse.json(
                { error: 'No Org Id Provided' },
                { status: 500 }
            )
        }
        if (!listName) {
            return NextResponse.json(
                { error: 'No List Name Provided' },
                { status: 500 }
            )
        }
        if (!campaignId) {
            return NextResponse.json(
                { error: 'No Campaign Id Provided' },
                { status: 500 }
            )
        }
        if (!csv) {
            return NextResponse.json(
                { error: 'No File Provided' },
                { status: 500 }
            )
        }

        const id = randomUUID();

        //upload to the leads table
        const { data: lead, error: leadError } = await supabase
            .from('leads_files')
            .insert([{
                id,
                list_name: listName,
                campaign_id: campaignId,
                organization_id: orgId,
                s3_key: id,
                s3_bucket: s3Bucket,
                created_at: new Date(),
                active: 1
            }])
            .select()
            .single()

            console.log(lead);

        const arrayBuffer = await (csv as File).arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        try{
            await uploadFileToS3Bucket(s3Bucket as any, id, listName as string, buffer)
        }catch(err){
            console.log(err);
        }
        if (leadError) {
            console.log(leadError);
            return NextResponse.json({ uploaded: false, error: 'error uploading the csv' }, { status: 500 })
        }
        return NextResponse.json({ uploaded: true, lead }, { status: 200 })
    } catch (err) {
        console.log(err)
        return NextResponse.json({ uploaded: false }, { status: 401 })
    }
}