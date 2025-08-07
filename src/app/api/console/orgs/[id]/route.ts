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
    COMPANY_WEBSITE = 'Company website',
    CITY = 'City',
    COUNTRY = 'Country',
    EMAIL = 'Email',
    MOBILE_PHONE = 'Mobile Phone'
}

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

        // Add debug logs to track the flow and data
        console.debug('Parsed CSV rows:', csvRows);

        for (const row of csvRows) {
            console.debug('Processing row:', row);

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
                console.debug(`Transforming value at index ${idx}:`, val);
                return val;
            });

            const getValue = (field: string) => {
                let idx = normalizedHeaderLineArray.indexOf(field.trim().toLowerCase());
                if (idx === -1) idx = headerLineArray.indexOf(field);
                const value = updatedRow[idx]?.trim() || null;
                console.debug(`Extracted value for field '${field}':`, value);
                return value;
            };

            const lead: Record<string, string | null> = {
                organization_id: orgId,
                campaign_id: campaignId,
                list_name: listName,
            };

            Object.values(possibleFields).forEach((field) => {
                const key = field.replace(/\s+/g, '_').toLowerCase();
                lead[key] = getValue(field);
                console.debug(`Mapped field '${field}' to lead key '${key}':`, lead[key]);
            });

            const user = await currentUser();
            if (!user || !user.id) {
                console.warn('Skipping row due to missing user information:', row);
                continue; // skip if user is not available
            }

            const fullName = [
                getValue(possibleFields.FIRST_NAME),
                getValue(possibleFields.LAST_NAME)
            ].filter(Boolean).join(' ').trim();

            const leadToInsert = {
                organization_id: orgId,
                clento_campaign_id: campaignId,
                full_name: fullName || null,
                first_name: getValue(possibleFields.FIRST_NAME),
                last_name: getValue(possibleFields.LAST_NAME),
                email: getValue(possibleFields.EMAIL),
                phone: getValue(possibleFields.MOBILE_PHONE),
                title: getValue(possibleFields.TITLE),
                headline: null,
                seniority: null,
                company: getValue(possibleFields.COMPANY),
                industry: null,
                location: getValue(possibleFields.LOCATION),
                linkedin_url: getValue(possibleFields.LINKEDIN_URL),
                twitter_url: null,
                status: 'new',
                source: 'manual',
                enrichment_data: {},
                verified: false,
                confidence: 0,
                smartlead_campaign_id: campaignId,
                last_email_event: null,
                last_event_timestamp: null,
                syndie_lead_id: null,
                linkedin_connection_status: 'not_connected',
                steps: [],
                campaign_info: {},
                seat_info: {},
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const linkedinUrl = getValue(possibleFields.LINKEDIN_URL)?.toLowerCase() || '';
            const email = getValue(possibleFields.EMAIL)?.toLowerCase() || '';
            if (
                (linkedinUrl && existingLeadsSet.has(`linkedin_url:${linkedinUrl}`)) ||
                (email && existingLeadsSet.has(`email:${email}`))
            ) {
                console.warn('Duplicate lead found, skipping:', { linkedin_url: linkedinUrl, email });
                continue; // Skip duplicate lead
            }
            const { data: leadData, error: leadError } = await supabase.from('leads').insert([leadToInsert]);

            // Log the result of the Supabase insert operation
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