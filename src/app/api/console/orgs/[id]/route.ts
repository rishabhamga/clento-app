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
            .select('id, name')
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

function streamToBuffer(stream: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: any[] = []
        stream.on('data', (chunk: any) => chunks.push(chunk))
        stream.on('end', () => resolve(Buffer.concat(chunks)))
        stream.on('error', reject)
    })
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const orgId = formData.get('orgId')?.toString();
        const listName = formData.get('listName')?.toString();
        const campaignId = formData.get('campaignId')?.toString();
        const csv = formData.get('csv');
        const s3Bucket = 'mc-contact-lists';

        if (!orgId || !listName || !campaignId || !csv) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const id = randomUUID();

        // Deactivate previous leads for this campaign
        await supabase
            .from('leads_files')
            .update({ active: 0 })
            .eq('campaign_id', campaignId);

        // Insert new lead file record
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
            .single();

        if (leadError) {
            console.error('Supabase insert error:', leadError);
            return NextResponse.json({ uploaded: false, error: 'Supabase insert failed' }, { status: 500 });
        }

        // Convert file to buffer (support Blob, File, or Node.js stream)
        let buffer: Buffer | undefined = undefined;
        if (csv && typeof (csv as any).arrayBuffer === 'function') {
            // Browser/edge runtime Blob or File
            const arrayBuffer = await (csv as any).arrayBuffer();
            buffer = Buffer.from(arrayBuffer);
        } else if (csv && typeof (csv as any).stream === 'function') {
            // Node.js ReadableStream
            buffer = await streamToBuffer((csv as any).stream());
        } else {
            return NextResponse.json({ uploaded: false, error: 'Invalid file format: must be Blob, File, or ReadableStream' }, { status: 400 });
        }

        // Upload to S3
        try {
            await uploadFileToS3Bucket(s3Bucket as any, id, listName, buffer);
        } catch (err) {
            console.error('S3 upload error:', err);
            return NextResponse.json({ uploaded: false, error: 'S3 upload failed' }, { status: 500 });
        }

        return NextResponse.json({ uploaded: true, lead }, { status: 200 });
    } catch (err) {
        console.error('Server error:', err);
        return NextResponse.json({ uploaded: false, error: 'Internal server error' }, { status: 500 });
    }
}