import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '../../../../lib/supabase'
import { getFileFromS3 } from '../../../../utils/s3Util'
import Papa from 'papaparse';

interface ILeadFiles {
    id: string,
    list_name: string,
    campaign_id: string,
    organization_id: string,
    s3_key: string,
    s3_bucket: string,
    created_at: Date,
    active: number
}

//final leads data interface
export interface ILeads {
    id: string,
    contactName: string,
    designation: string,
    lastContact: string,
    email: string,
    linkedIn: string,
    connectionRequestAcceptDate: string,
    companyName: string,
    companyDescription: string,
    companyWebsite: string,
    companySize: string,
    companyLocation: string,
    clientNeedAnalysis: string[],
    recommendedApproach: string[],
    talkingPoints: string[],
    status: string,
    linkedInMessages: {
        from: string,
        date: string,
        message: string
    }[],
    emailMessages: {
        from: string,
        date: string,
        message: string
    }[]
    meetingsBooked: string
    pendingApproval: string
}
export interface IRecentActivity {
    id: number,
    taskTitle: string,
    taskDescription: string,
    contactName: string,
    campaignName: string,
    companyName: string,
    time: string,
    message: string
}

//csv text parsing util
const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"' && insideQuotes && nextChar === '"') {
            current += '"';
            i++;
        } else if (char === '"') {
            insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current);
    return result.map(field => field.trim());
};

const getRecentActivity = async (orgId: string) => {
    const { data, error: campaignError } = await supabase
        .from('campaigns')
        .select('id, name')
        .eq('organization_id', orgId)
    const campaigns = data as { id: string, name: string }[]

    const today = new Date();
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3); //change this when you want specific date for recent activity

    const isSameDay = (d1: Date, d2: Date) =>
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
    let tasksToday = 0

    const recentActivity: IRecentActivity[] = [];

    const messagePatterns = [
        { type: "LinkedIn", regex: /^linkedin_message_(\d+)$/, title: "Send LinkedIn Message" },
        { type: "Reply (LinkedIn)", regex: /^reply_linkedin_message_(\d+)$/, title: "Reply Received on LinkedIn" },
        { type: "Email", regex: /^email_message_(\d+)$/, title: "Sent Email" },
        { type: "Reply (Email)", regex: /^reply_email_message_(\d+)$/, title: "Received Reply on Email" }
    ];

    const generateDescription = (type: string, contactName: string, campaignName: string) => {
        switch (type) {
            case "LinkedIn": {
                return `Sent LinkedIn message to ${contactName} for the '${campaignName}' campaign`
            }
            case "Reply (LinkedIn)": {
                return `Received a reply from ${contactName} on LinkedIn`
            }
            case "Email": {
                return `Sent an Email to ${contactName} for the '${campaignName}' campaign`
            }
            case "Reply (Email)": {
                return `Received a email reply from ${contactName}`
            }
            default: {
                return `Performed an unknown action for ${contactName} in the '${campaignName}' campaign`
            }
        }
    }

    for (const campaign of campaigns) {
        const { data, error: leadError } = await supabase
            .from('leads_files')
            .select('*')
            .eq('campaign_id', campaign.id)
            .eq('active', 1)
            .single()
        const leads = data as ILeadFiles | null
        if (!leads) continue;

        const leadsFileBuffer = await getFileFromS3(leads.s3_key, leads.s3_bucket);
        if (!leadsFileBuffer) {
            continue;
        }
        const csvFileString = leadsFileBuffer.toString().trim();
        const csvLines = csvFileString.split('\n');
        const csvLinesWithoutHeader = csvLines.slice(1);
        const headerLineArray = csvLines[0].split(",")


        csvLinesWithoutHeader.forEach((line, index) => {
            let row = parseCsvLine(line);
            // Replace null/empty values with 'Not Found'
            row = row.map(val => (val === null || val === undefined || val.trim() === "") ? "Not Found" : val);
            const contactName = row[headerLineArray.indexOf("full_name")];
            const companyName = row[headerLineArray.indexOf("company_name")];

            messagePatterns.forEach(({ type, regex, title }) => {
                headerLineArray.forEach((col, idx) => {
                    const match = col.match(regex);
                    if (match) {
                        let message = row[idx];
                        if (typeof message !== 'string') message = '';
                        headerLineArray.map((header) => {
                            const mess = message.split(`{{${header}}}`);
                            message = mess.join(row[headerLineArray.indexOf(header)]?.trim() || "Not Found");
                        })
                        const dateCol = `${col}_date`;
                        const dateIdx = headerLineArray.indexOf(dateCol);
                        const dateStr = row[dateIdx];
                        if (!dateStr) return;

                        const date = new Date(dateStr);

                        if (isSameDay(today, date)) {
                            tasksToday += 1
                        }

                        if (isNaN(date.getTime()) || date < threeDaysAgo) return;

                        if (message?.trim()) {
                            recentActivity.push({
                                id: Math.floor(Math.random() * 1000000),
                                message,
                                taskTitle: title,
                                taskDescription: generateDescription(type, contactName, campaign.name),
                                contactName,
                                campaignName: campaign.name,
                                companyName: companyName,
                                time: date.toISOString().split('T')[0] // Only date part (YYYY-MM-DD)
                            });
                        }
                    }
                });
            });
        });
    }
    const sortedRecentActivity = recentActivity
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 30);

    return { sortedRecentActivity, campaigns }
}

export async function GET(request: NextRequest) {

    const finalLeads: ILeads[] = [];

    const { orgId } = await auth();

    const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('id')
        .eq('clerk_org_id', orgId)
        .single();

    if (!orgId || !orgData || orgError) {
        console.error('Auth or organization error:', { orgId, orgData, orgError });
        return NextResponse.json({ error: 'An Error Occurred' }, { status: 500 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const campaignId = searchParams.get('campaignId');
        const limit = parseInt(searchParams.get('limit') || '100');
        const offset = parseInt(searchParams.get('offset') || '0');

        if (!campaignId) {
            const { sortedRecentActivity, campaigns } = await getRecentActivity(orgData.id);
            if (!sortedRecentActivity) {
                console.error('No recent activity found for organization:', orgData.id);
                return NextResponse.json({ error: 'No recent activity' }, { status: 500 });
            }
            return NextResponse.json({ recentActivity: sortedRecentActivity, campaigns }, { status: 200 });
        }

        const { data, error: leadError } = await supabase
            .from('leads_files')
            .select('*')
            .eq('campaign_id', campaignId)
            .eq('active', 1)
            .single();

        const leadData = data as ILeadFiles | null;

        if (leadError || !leadData) {
            console.error('Error fetching leads or no active leads found:', { leadError, leadData });
            return NextResponse.json(
                { error: 'Leads not found' },
                { status: 404 }
            );
        }

        const csvFileBuffer = await getFileFromS3(leadData.s3_key, leadData.s3_bucket);

        if (!csvFileBuffer) {
            console.error('Failed to fetch file from S3:', { s3_key: leadData.s3_key, s3_bucket: leadData.s3_bucket });
            return NextResponse.json({ error: 'Failed to fetch file from S3' }, { status: 500 });
        }

        const csvFileString = csvFileBuffer.toString().trim();
        const parsedCsv = Papa.parse<string[]>(csvFileString, {
            delimiter: ',',
            skipEmptyLines: true,
        });

        if (parsedCsv.errors.length > 0) {
            console.error('Error parsing CSV:', parsedCsv.errors);
            return NextResponse.json({ error: 'Error parsing CSV file' }, { status: 500 });
        }

        const [headerLineArray, ...csvRows] = parsedCsv.data;

        const normalizedHeaderLineArray = headerLineArray.map(h => h.trim().toLowerCase());

        csvRows.forEach((row, rowIndex) => {
            const updatedRow = row.map((val, idx) => {
                const columnName = headerLineArray[idx]?.trim().toLowerCase();
                if (columnName === 'pending_approval' && (val === null || val === undefined || val.trim() === "")) {
                    return ""; // Use an empty string for `pending_approval` to maintain type consistency
                }
                return (val === null || val === undefined || val.trim() === "") ? "Not Found" : val;
            });

            const getValue = (field: string) => {
                let idx = normalizedHeaderLineArray.indexOf(field.trim().toLowerCase());
                if (idx === -1) idx = headerLineArray.indexOf(field);
                return updatedRow[idx]?.trim() || "Not Found";
            };

            const requiredFields = ["id", "full_name", "email", "company_name"];
            const hasAllRequired = requiredFields.every(f => {
                const idx = headerLineArray.indexOf(f);
                return idx !== -1 && updatedRow[idx] && updatedRow[idx] !== "Not Found";
            });

            if (!hasAllRequired) {
                console.warn('Row skipped due to missing required fields:', { rowIndex, updatedRow, hasAllRequired });
                return;
            }

            const linkedInMessages: ILeads["linkedInMessages"] = [];
            const emailMessages: ILeads["emailMessages"] = [];
            let lastContactDate = new Date(0);

            headerLineArray.forEach((col, i) => {
                const normalizedCol = col.trim().toLowerCase();
                let value = updatedRow[i]?.trim();
                if (typeof value !== 'string') value = '';
                headerLineArray.forEach((header, headerIdx) => {
                    const line = value.split(`{{${header.trim().toLowerCase()}}}`);
                    value = line.join(updatedRow[headerIdx] || "Not Found");
                });
                if (!value) return;

                const match = normalizedCol.match(/^(linkedin_message|reply_linkedin_message|email_message|reply_email_message)_(\d+)$/);
                if (!match) return;

                const [, type, num] = match;
                const dateField = `${type}_${num}_date`;
                const dateIdx = headerLineArray.findIndex(h => h.trim().toLowerCase() === dateField);
                const dateStr = dateIdx !== -1 ? updatedRow[dateIdx]?.trim() : '';
                if (!dateStr) return;

                const date = new Date(dateStr);
                if (isNaN(date.getTime())) {
                    return;
                }

                if (date > lastContactDate) lastContactDate = date;

                const from = type.startsWith("reply") ? "lead" : "you";
                const messageObj = { from, date: date.toISOString().split("T")[0], message: value };

                if (type.includes("linkedin")) {
                    linkedInMessages.push(messageObj);
                } else {
                    emailMessages.push(messageObj);
                }
            });

            const leadLinkedInMessages = linkedInMessages.filter((msg) => msg.from === 'lead').length;
            const leadEmailMessages = emailMessages.filter((msg) => msg.from === 'lead').length;
            const totalLeadMessages = leadLinkedInMessages + leadEmailMessages;
            const meetingsBooked = getValue("meetings_booked") || "0";

            finalLeads.push({
                id: getValue("id"),
                contactName: getValue("full_name"),
                designation: getValue("designation"),
                lastContact: lastContactDate.toISOString(),
                email: getValue("email"),
                linkedIn: "",
                connectionRequestAcceptDate: getValue("connection_request_accepted_date"),
                companyName: getValue("company_name"),
                companyDescription: getValue("company_description"),
                companyWebsite: getValue("company_website"),
                companySize: getValue("company_size"),
                pendingApproval: updatedRow[headerLineArray.indexOf("pending_approval")],
                companyLocation: getValue("company_location\r") || getValue("company_location"),
                clientNeedAnalysis: getValue("client_need_analysis").split("#").filter(Boolean),
                recommendedApproach: getValue("recommended_approach").split("#").filter(Boolean),
                talkingPoints: getValue("talking_points").split("#").filter(Boolean),
                status: totalLeadMessages >= 3 ? "hot" : totalLeadMessages >= 1 ? "warm" : "cold",
                linkedInMessages,
                emailMessages,
                meetingsBooked: meetingsBooked
            });
        });


        const paginatedLeads = finalLeads.slice(offset, offset + limit);

        return NextResponse.json({ leads: paginatedLeads }, { status: 200 });

    } catch (err) {
        console.error('Unexpected error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}