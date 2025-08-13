import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { supabase } from '../../../../../lib/supabase'
import Papa from 'papaparse'
import { startSmartleadCampaign } from '../../../../../lib/smartlead-campaign'

export interface ILeadsPersonalized { full_name: string | null; status: string; linkedin_connection_status: string; created_at: string; updated_at: string; initial_email?: string; initial_email_subject?: string; follow_up_email_1?: string; follow_up_email_1_subject?: string; follow_up_email_2?: string; follow_up_email_2_subject?: string; follow_up_email_3?: string; follow_up_email_3_subject?: string; follow_up_email_4?: string; follow_up_email_4_subject?: string; }

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
    'Email',
    'initial_email',
    'initial_email_subject',
    'follow_up_email_1',
    'follow_up_email_1_subject',
    'follow_up_email_2',
    'follow_up_email_2_subject',
    'follow_up_email_3',
    'follow_up_email_3_subject',
    'follow_up_email_4',
    'follow_up_email_4_subject'
];

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
    REPLY_LINKEDIN_MESSAGE_DATE_6 = 'reply linkedin message 6 date',
    INITIAL_EMAIL = 'initial_email',
    INITIAL_EMAIL_SUBJECT = 'initial_email_subject',
    FOLLOW_UP_EMAIL_1 = 'follow_up_email_1',
    FOLLOW_UP_EMAIL_1_SUBJECT = 'follow_up_email_1_subject',
    FOLLOW_UP_EMAIL_2 = 'follow_up_email_2',
    FOLLOW_UP_EMAIL_2_SUBJECT = 'follow_up_email_2_subject',
    FOLLOW_UP_EMAIL_3 = 'follow_up_email_3',
    FOLLOW_UP_EMAIL_3_SUBJECT = 'follow_up_email_3_subject',
    FOLLOW_UP_EMAIL_4 = 'follow_up_email_4',
    FOLLOW_UP_EMAIL_4_SUBJECT = 'follow_up_email_4_subject'
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
        const campaignId = formData.get('campaignId')?.toString();
        const csvFile = formData.get('csv') as File | null;

        //Config
        const timezone = formData.get('timezone')?.toString() || null;
        const dayOfWeek = formData.get('dayOfWeek') ? JSON.parse(formData.get('dayOfWeek') as string) : null;
        const startHour = formData.get('startHour')?.toString() || null;
        const endHour = formData.get('endHour')?.toString() || null;
        const minTimeBetweenEmails = formData.get('minTimeBetweenEmails') ? parseInt(formData.get('minTimeBetweenEmails') as string, 10) : null;
        const maxNewLeadsPerDay = formData.get('maxNewLeadsPerDay') ? parseInt(formData.get('maxNewLeadsPerDay') as string, 10) : null;
        const scheduleStartTime = formData.get('scheduleStartTime')?.toString() || null;
        const campaignDomainsRaw = formData.get('campaignDomains');
        const campaignDomains = typeof campaignDomainsRaw === 'string' ? JSON.parse(campaignDomainsRaw) : null;

        // Check for missing config fields
        if (
            !timezone ||
            !dayOfWeek ||
            !startHour ||
            !endHour ||
            !minTimeBetweenEmails ||
            !maxNewLeadsPerDay ||
            !scheduleStartTime
        ) {
            return NextResponse.json({ error: 'Missing campaign configuration fields' }, { status: 400 });
        }

        if (!orgId || !campaignId || !csvFile) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check if leads for this campaign have already been uploaded
        const { data: existingCampaignLeads, error: campaignLeadsError } = await supabase
            .from('leads')
            .select('id')
            .eq('clento_campaign_id', campaignId)
            .limit(1);

        if (campaignLeadsError) {
            console.error('Error checking existing campaign leads:', campaignLeadsError);
            return NextResponse.json({ error: 'Error checking campaign leads' }, { status: 500 });
        }

        if (existingCampaignLeads && existingCampaignLeads.length > 0) {
            return NextResponse.json({ error: 'Leads for this campaign have already been uploaded' }, { status: 400 });
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

        let leads: ILeadsPersonalized[] = [];
        let warnings: string[] = []; // Array to collect warning messages

        // Process leads in parallel for performance
        const leadPromises = csvRows.map(async (row, rowIndex) => {
            // Check for missing required fields
            const missingFields = requiredFields.filter(field => {
            const idx = normalizedHeaderLineArray.indexOf(field.trim().toLowerCase());
            return idx === -1 || !row[idx] || row[idx].trim() === '';
            });

            if (missingFields.length > 0) {
            warnings.push(`Row ${rowIndex + 1} is missing required fields: ${missingFields.join(', ')}`);
            return null; // Skip this row
            }

            const updatedRow = row.map((val, idx) => val);

            const getValue = (field: string) => {
            let idx = normalizedHeaderLineArray.indexOf(field.trim().toLowerCase());
            if (idx === -1) idx = headerLineArray.indexOf(field);
            const value = updatedRow[idx]?.trim() || null;
            return value;
            };

            const lead: Record<string, any> = {
            organization_id: orgId,
            clento_campaign_id: campaignId,
            steps: []
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
                if (!parsedDate) continue;
                steps.push({
                details: { action: `linkedin_follow_up_${i}`, message },
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
                if (!parsedDate) continue;
                steps.push({
                details: { action: `linkedin_reply_received`, message: replyMessage },
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
            status: hasMessages ? 'contacted' : 'new',
            linkedin_connection_status: hasMessages ? 'connected' : 'not_connected',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
            };

            const allowedStatusValues = ['new', 'contacted', 'replied', 'positive', 'neutral', 'negative', 'unsubscribed'];
            if (!allowedStatusValues.includes(leadToInsert.status)) {
            warnings.push(`Row ${rowIndex + 1}: Invalid status value: ${leadToInsert.status}`);
            return null;
            }

            const linkedinUrl = getValue('Linkedin url')?.toLowerCase() || '';
            const email = getValue('Email')?.toLowerCase() || '';
            if (
            (linkedinUrl && existingLeadsSet.has(`linkedin_url:${linkedinUrl}`)) ||
            (email && existingLeadsSet.has(`email:${email}`))
            ) {
            warnings.push(`Row ${rowIndex + 1}: Duplicate lead found, skipping`);
            return null;
            }

            const leadPersonalized: ILeadsPersonalized = {
            ...leadToInsert,
            initial_email: getValue('initial_email') ?? undefined,
            initial_email_subject: getValue('initial_email_subject') ?? undefined,
            follow_up_email_1: getValue('follow_up_email_1') ?? undefined,
            follow_up_email_1_subject: getValue('follow_up_email_1_subject') ?? undefined,
            follow_up_email_2: getValue('follow_up_email_2') ?? undefined,
            follow_up_email_2_subject: getValue('follow_up_email_2_subject') ?? undefined,
            follow_up_email_3: getValue('follow_up_email_3') ?? undefined,
            follow_up_email_3_subject: getValue('follow_up_email_3_subject') ?? undefined,
            follow_up_email_4: getValue('follow_up_email_4') ?? undefined,
            follow_up_email_4_subject: getValue('follow_up_email_4_subject') ?? undefined
            };

            // Insert into Supabase
            const { error: leadError } = await supabase.from('leads').insert([leadToInsert]);
            if (leadError) {
            warnings.push(`Row ${rowIndex + 1}: Error inserting lead into Supabase`);
            return null;
            }

            return leadPersonalized;
        });

        // Await all promises and filter out nulls (skipped leads)
        const resolvedLeads = await Promise.all(leadPromises);
        leads = resolvedLeads.filter(Boolean) as ILeadsPersonalized[];


        // Calculate the percentage of skipped leads
        const totalRows = csvRows.length;
        const skippedLeads = totalRows - leads.length;
        const skippedPercentage = (skippedLeads / totalRows) * 100;

        if (skippedPercentage > 50) {
            return NextResponse.json({
                uploaded: false,
                error: 'Majority of the leads were skipped. Campaign creation aborted.',
                warnings
            }, { status: 400 });
        }

        const campaignData = {
            campaignId,
            leads,
            timezone,
            dayOfWeek,
            startHour,
            endHour,
            minTimeBetweenEmails,
            maxNewLeadsPerDay,
            scheduleStartTime,
            campaignDomains
        }

        await startSmartleadCampaign(campaignData)

        return NextResponse.json({ uploaded: true, message: 'Leads Uploaded', warnings }, { status: 200 });
    } catch (err) {
        console.error('Server error:', err);
        return NextResponse.json({ uploaded: false, error: 'Internal server error' }, { status: 500 });
    }
}