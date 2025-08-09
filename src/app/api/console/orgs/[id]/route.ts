import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { supabase } from '../../../../../lib/supabase'
import { getFileFromS3, uploadFileToS3Bucket } from '../../../../../utils/s3Util'
import { randomUUID } from 'crypto'
import Papa from 'papaparse'

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

const requiredFields = [
    'Linkedin url',
    'Email'
]

enum possibleFields {
    FIRST_NAME = 'First name',
    LAST_NAME = 'Last name',
    TITLE = 'Title',
    COMPANY = 'Company',
    LOCATION = 'Location',
    LINKEDIN_URL = 'Linkedin url',
    EMAIL = 'Email',
    MOBILE_PHONE = 'Mobile Phone',
    LINKEDIN_MESSAGE_1 = 'Linkedin Message 1',
    LINKEDIN_MESSAGE_DATE_1 = 'Linkedin Message Date 1',
    LINKEDIN_MESSAGE_2 = 'linkedin message 2',
    LINKEDIN_MESSAGE_DATE_2 = 'linkedin message 2 date',
    LINKEDIN_MESSAGE_3 = 'linkedin message 3',
    LINKEDIN_MESSAGE_DATE_3 = 'linkedin message 3 date',
    LINKEDIN_MESSAGE_4 = 'linkedin message 4',
    LINKEDIN_MESSAGE_DATE_4 = 'linkedin message 4 date',
    LINKEDIN_MESSAGE_5 = 'linkedin message 5',
    LINKEDIN_MESSAGE_DATE_5 = 'linkedin message 5 date',
    LINKEDIN_MESSAGE_6 = 'linkedin message 6',
    LINKEDIN_MESSAGE_DATE_6 = 'linkedin message 6 date',
    REPLY_LINKEDIN_MESSAGE_1 = 'reply linkedin message 1',
    REPLY_LINKEDIN_MESSAGE_DATE_1 = 'reply linkedin message 1 date',
    REPLY_LINKEDIN_MESSAGE_2 = 'reply linkedin message 2',
    REPLY_LINKEDIN_MESSAGE_DATE_2 = 'reply linkedin message 2 date',
    REPLY_LINKEDIN_MESSAGE_3 = 'reply linkedin message 3',
    REPLY_LINKEDIN_MESSAGE_DATE_3 = 'reply linkedin message 3 date',
    REPLY_LINKEDIN_MESSAGE_4 = 'reply linkedin message 4',
    REPLY_LINKEDIN_MESSAGE_DATE_4 = 'reply linkedin message 4 date',
    REPLY_LINKEDIN_MESSAGE_5 = 'reply linkedin message 5',
    REPLY_LINKEDIN_MESSAGE_DATE_5 = 'reply linkedin message 5 date',
    REPLY_LINKEDIN_MESSAGE_6 = 'reply linkedin message 6',
    REPLY_LINKEDIN_MESSAGE_DATE_6 = 'reply linkedin message 6 date'
}

const parseDate = (dateString: string): string | null => {
    const [day, month, year] = dateString.split('/');
    if (!day || !month || !year) return null;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

// Ensure this function is defined before its usage in the code
export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const orgId = formData.get('orgId')?.toString();
        const listName = formData.get('listName')?.toString();
        const campaignId = formData.get('campaignId')?.toString();
        const csvFile = formData.get('csv') as File | null;

        if (!orgId || !listName || !campaignId || !csvFile) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Move this block to the start of the POST handler, after validating required fields and before the for-loop:
        const { data: existingLeadsData, error: existingLeadsError } = await supabase
            .from('leads')
            .select('linkedin_url, email')
            .eq('clento_campaign_id', campaignId);

        if (existingLeadsError) {
            console.log(existingLeadsError)
            return NextResponse.json({ error: 'Error fetching existing leads' }, { status: 500 });
        }

        // Build a Set for fast duplicate checking
        const existingLeadsSet = new Set<string>();
        (existingLeadsData || []).forEach(lead => {
            if (lead.linkedin_url) existingLeadsSet.add(`linkedin_url:${lead.linkedin_url.trim().toLowerCase()}`);
            if (lead.email) existingLeadsSet.add(`email:${lead.email.trim().toLowerCase()}`);
        });

        const csvString = await csvFile.text();
        const parsedCsv = Papa.parse<string[]>(csvString, {
            delimiter: ',',
            skipEmptyLines: true,
        });

        if (parsedCsv.errors.length > 0) {
            console.error('Error parsing CSV:', parsedCsv.errors);
            return NextResponse.json({ error: 'Error parsing CSV file' }, { status: 500 });
        }

        const [headerLineArray, ...csvRows] = parsedCsv.data;

        const normalizedHeaderLineArray = headerLineArray.map(h => h.trim().toLowerCase());

        const leadsTableFields = [
            'First name',
            'Last name',
            'Title',
            'Company',
            'Linkedin url',
            'Email',
        ];

        for (const row of csvRows) {
            // Skip row if any required field is missing
            const missingRequired = requiredFields.some(field => {
                const idx = normalizedHeaderLineArray.indexOf(field.trim().toLowerCase());
                return !row[idx] || row[idx].trim() === '';
            });
            if (missingRequired) {
                console.warn('Skipping row due to missing required fields:', row);
                continue; // skip this row
            }

            const updatedRow = row.map((val, idx) => {
                return val;
            });

            const getValue = (field: string) => {
                let idx = normalizedHeaderLineArray.indexOf(field.trim().toLowerCase());
                if (idx === -1) idx = headerLineArray.indexOf(field);
                const value = updatedRow[idx]?.trim() || null;
                return value;
            };

            const lead: Record<string, any> = {
                organization_id: orgId,
                clento_campaign_id: campaignId,
                steps: [] // Initialize steps as an array
            };

            leadsTableFields.forEach((field) => {
                const key = field.replace(/\s+/g, '_').toLowerCase();
                lead[key] = getValue(field);
            });

            const steps: Array<Record<string, any>> = [];
            let hasMessages = false;

            for (let i = 1; i <= 6; i++) {
                const message = getValue(possibleFields[`LINKEDIN_MESSAGE_${i}` as keyof typeof possibleFields]);
                const messageDate = getValue(possibleFields[`LINKEDIN_MESSAGE_DATE_${i}` as keyof typeof possibleFields]);

                if (message && messageDate) {
                    const parsedDate = parseDate(messageDate);
                    if (!parsedDate) {
                        console.warn(`Invalid date format for message ${i}:`, messageDate);
                        continue;
                    }

                    steps.push({
                        details: {
                            action: `linkedin_follow_up_${i}`,
                            message
                        },
                        success: true,
                        response: `Follow-up message ${i} sent`,
                        stepType: 'linkedin_message',
                        timestamp: new Date(parsedDate).toISOString(),
                        stepNodeId: `step_${String(i).padStart(3, '0')}`
                    });
                    hasMessages = true;
                }
            }

            for (let i = 1; i <= 6; i++) {
                const replyMessage = getValue(possibleFields[`REPLY_LINKEDIN_MESSAGE_${i}` as keyof typeof possibleFields]);
                const replyMessageDate = getValue(possibleFields[`REPLY_LINKEDIN_MESSAGE_DATE_${i}` as keyof typeof possibleFields]);

                if (replyMessage && replyMessageDate) {
                    const parsedDate = parseDate(replyMessageDate);
                    if (!parsedDate) {
                        console.warn(`Invalid date format for reply message ${i}:`, replyMessageDate);
                        continue;
                    }

                    steps.push({
                        details: {
                            action: `linkedin_reply_received`,
                            message: replyMessage
                        },
                        success: true,
                        response: `Reply received from lead`,
                        stepType: 'linkedin_reply',
                        timestamp: new Date(parsedDate).toISOString(),
                        stepNodeId: `step_${String(i + 6).padStart(3, '0')}`
                    });
                    hasMessages = true;
                }
            }

            lead.steps = steps;

            const fullName = [
                getValue('First name'),
                getValue('Last name')
            ].filter(Boolean).join(' ').trim();

            const leadToInsert = {
                ...lead,
                full_name: fullName || null,
                status: hasMessages ? 'contacted' : 'new', // Updated to use valid status values
                linkedin_connection_status: hasMessages ? 'connected' : 'not_connected',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            // Define allowed status values based on the database schema
            const allowedStatusValues = ['new', 'contacted', 'replied', 'positive', 'neutral', 'negative', 'unsubscribed']; // Updated to match the schema

            // Validate the status field before insertion
            if (!allowedStatusValues.includes(leadToInsert.status)) {
                console.error(`Invalid status value: ${leadToInsert.status}. Allowed values are: ${allowedStatusValues.join(', ')}`);
                return NextResponse.json({ error: `Invalid status value: ${leadToInsert.status}` }, { status: 400 });
            }

            const linkedinUrl = getValue('Linkedin url')?.toLowerCase() || '';
            const email = getValue('Email')?.toLowerCase() || '';
            if (
                (linkedinUrl && existingLeadsSet.has(`linkedin_url:${linkedinUrl}`)) ||
                (email && existingLeadsSet.has(`email:${email}`))
            ) {
                console.warn('Duplicate lead found, skipping:', { linkedin_url: linkedinUrl, email });
                continue; // Skip duplicate lead
            }

            const { data: leadData, error: leadError } = await supabase.from('leads').insert([leadToInsert]);

            if (leadError) {
                console.error('Error inserting lead into Supabase:', leadError);
            } else {
                console.debug('Successfully inserted lead into Supabase:', leadData);
            }
        }

        console.info('All rows processed successfully.');
        return NextResponse.json({ uploaded: true, message: 'Leads Uploaded' }, { status: 200 });
    } catch (err) {
        console.error('Server error:', err);
        return NextResponse.json({ uploaded: false, error: 'Internal server error' }, { status: 500 });
    }
}