import axios from 'axios';
import { supabase } from './supabase';
import { requestFormReset } from 'react-dom';
import { ILeadsPersonalized } from '../app/api/console/orgs/[id]/route';

interface SmartleadCampaignParams {
    campaignId: string;
    leads: ILeadsPersonalized[];
    timezone?: string;
    dayOfWeek: number[];
    startHour: string;
    endHour: string;
    minTimeBetweenEmails: number;
    maxNewLeadsPerDay: number;
    scheduleStartTime?: string;
    campaignDomains: string[];
}
//Just for campaign name
async function fetchCampaignName(campaignId: string): Promise<string> {
    const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('name')
        .eq('id', campaignId)
        .single();

    if (campaignError || !campaignData) {
        console.error('Error fetching campaign from database:', campaignError);
        throw new Error('Failed to fetch campaign from database');
    }

    return campaignData.name;
}

//Create campaign
async function createSmartleadCampaign(name: string, smartLeadApiKey: string): Promise<any> {
    const smartleadCampaignData = {
        name,
        client_id: null // Assuming no client is associated
    };

    try {
        const response = await axios.post(`https://server.smartlead.ai/api/v1/campaigns/create?api_key=${smartLeadApiKey}`, smartleadCampaignData, {
            headers: {
                'Authorization': `Bearer ${process.env.SMARTLEAD_API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        return response.data;
    } catch (error) {
        console.error('Error creating Smartlead campaign:', error);
        throw new Error('Failed to create Smartlead campaign');
    }
}

//Update clento campaign
async function updateCampaignInDatabase(campaignId: string, smartleadCampaignId: string): Promise<void> {
    const { error: updateError } = await supabase
        .from('campaigns')
        .update({ smartlead_campaign_id: smartleadCampaignId })
        .eq('id', campaignId);

    if (updateError) {
        console.error('Error updating campaign in database:', updateError);
        throw new Error('Failed to update campaign in database');
    }
}

//add leads
async function addLeadsToCampaign(createdCampaignId: string, leadData: any[], smartLeadApiKey: string): Promise<void> {
    const addLeadsData = {
        lead_list: leadData,
        settings: {
            ignore_global_block_list: true,
            ignore_unsubscribe_list: true,
            ignore_duplicate_leads_in_other_campaign: true
        }
    };

    try {
        const response = await axios.post(`https://server.smartlead.ai/api/v1/campaigns/${createdCampaignId}/leads?api_key=${smartLeadApiKey}`, addLeadsData, {
            headers: {
                'Authorization': `Bearer ${process.env.SMARTLEAD_API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        console.log('Leads added to Smartlead campaign successfully:', response.data);
    } catch (error) {
        console.error('Error adding leads to Smartlead campaign:', error);
        if ((error as any).response) {
            console.error('Smartlead API error response:', (error as any).response.data);
        }
        throw new Error('Failed to add leads to Smartlead campaign');
    }
}

//schedule campaign
async function scheduleCampaign(createdCampaignId: string, scheduleData: any, smartLeadApiKey: string): Promise<void> {
    try {
        const response = await axios.post(`https://server.smartlead.ai/api/v1/campaigns/${createdCampaignId}/schedule?api_key=${smartLeadApiKey}`, scheduleData, {
            headers: {
                'Authorization': `Bearer ${process.env.SMARTLEAD_API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        console.log('Campaign schedule updated successfully:', response.data);
    } catch (error) {
        console.error('Error updating campaign schedule:', error);
        if ((error as any).response) {
            console.error('Smartlead API error response during schedule update:', (error as any).response.data);
        }
        throw new Error('Failed to update campaign schedule');
    }
}

//sequence
async function addSequencesToCampaign(createdCampaignId: string, smartLeadApiKey: string): Promise<void> {
    const sequenceData = {
        sequences: [
            {
                seq_number: 1,
                seq_delay_details: {
                    delay_in_days: 1
                },
                subject: '{{initial_email_subject}}',
                email_body: '{{initial_email}}'
            },
            {
                seq_number: 2,
                seq_delay_details: {
                    delay_in_days: 3
                },
                subject: '{{follow_up_email_1_subject}}',
                email_body: '{{follow_up_email_1_subject}}'
            },
            {
                seq_number: 3,
                seq_delay_details: {
                    delay_in_days: 3
                },
                subject: '{{follow_up_email_2_subject}}',
                email_body: '{{follow_up_email_2}}'
            },
            {
                seq_number: 4,
                seq_delay_details: {
                    delay_in_days: 4
                },
                subject: '{{follow_up_email_3_subject}}',
                email_body: '{{follow_up_email_3}}'
            },
            {
                seq_number: 5,
                seq_delay_details: {
                    delay_in_days: 5
                },
                subject: '{{follow_up_email_4_subject}}',
                email_body: '{{follow_up_email_4}}'
            }
        ]
    };

    try {
        const response = await axios.post(`https://server.smartlead.ai/api/v1/campaigns/${createdCampaignId}/sequences?api_key=${smartLeadApiKey}`, sequenceData, {
            headers: {
                'Authorization': `Bearer ${process.env.SMARTLEAD_API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        console.log('Campaign sequence saved successfully:', response.data);
    } catch (error) {
        console.error('Error saving campaign sequence:', error);
        if ((error as any).response) {
            console.error('Smartlead API error response during sequence saving:', (error as any).response.data);
        }
        throw new Error('Failed to save campaign sequence');
    }
}

// // Function to set email sending accounts for the campaign
async function setEmailSendingAccounts(campaignId: string, campaignDomains: string[], smartLeadApiKey: string): Promise<void> {
    try {
        // Fetch all senders from Smartlead
        const response = await axios.get(`https://server.smartlead.ai/api/v1/email-accounts/?api_key=${smartLeadApiKey}&offset=0&limit=100`, {
            headers: {
                'Authorization': `Bearer ${process.env.SMARTLEAD_API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        const allSenders = response.data;

        // Filter senders based on campaignDomains
        const filteredSenders = allSenders.filter((sender: any) => {
            const senderDomain = sender.from_email.split('@')[1];
            return campaignDomains.includes(senderDomain);
        });

        // Prepare data to add senders to the campaign
        const addSendersData = {
            email_account_ids: filteredSenders.map((sender: any) => sender.id),
        };

        // Add filtered senders to the campaign
        const addResponse = await axios.post(`https://server.smartlead.ai/api/v1/campaigns/${campaignId}/email-accounts?api_key=${smartLeadApiKey}`, addSendersData, {
            headers: {
                'Authorization': `Bearer ${process.env.SMARTLEAD_API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        console.log('Email sending accounts successfully added to the campaign:', addResponse.data);
    } catch (error) {
        console.error('Error setting email sending accounts for the campaign:', error);
        if ((error as any).response) {
            console.error('Smartlead API error response:', (error as any).response.data);
        }
        throw new Error('Failed to set email sending accounts for the campaign');
    }
}

async function startCampaign(campaignId: string, smartLeadApiKey: string): Promise<void> {
    try {
        const response = await axios.post(`https://server.smartlead.ai/api/v1/campaigns/${campaignId}/status?api_key=${smartLeadApiKey}`, {
            status: "START"
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.SMARTLEAD_API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        console.log('Campaign started successfully:', response.data);
    } catch (error) {
        console.error('Error starting the campaign:', error);
        if ((error as any).response) {
            console.error('Smartlead API error response:', (error as any).response.data);
        }
        throw new Error('Failed to start the campaign');
    }
}

//Main function
export async function startSmartleadCampaign(params: SmartleadCampaignParams): Promise<any> {
    const { campaignId, leads, timezone, dayOfWeek, startHour, endHour, minTimeBetweenEmails, maxNewLeadsPerDay, scheduleStartTime, campaignDomains } = params;

    const smartLeadApiKey = process.env.SMARTLEAD_API_KEY as string;

    const leadData = leads.map(lead => {
        const [firstName, ...lastNameParts] = (lead.full_name || '').split(' ');
        return {
            first_name: firstName || 'Unknown',
            last_name: lastNameParts.join(' ') || 'Unknown',
            email: lead.full_name ? `${lead.full_name.replace(/\s+/g, '.').toLowerCase()}@example.com` : 'unknown@example.com',
            linkedin_profile: lead.linkedin_connection_status === 'connected' ? `https://www.linkedin.com/in/${firstName.toLowerCase()}` : null,
            custom_fields: {
                Status: lead.status,
                initial_email: lead.initial_email,
                initial_email_subject: lead.initial_email_subject,
                follow_up_email_1_subject: lead.follow_up_email_1_subject,
                follow_up_email_1: lead.follow_up_email_1,
                follow_up_email_2_subject: lead.follow_up_email_2_subject,
                follow_up_email_2: lead.follow_up_email_2,
                follow_up_email_3_subject: lead.follow_up_email_3_subject,
                follow_up_email_3: lead.follow_up_email_3,
                follow_up_email_4: lead.follow_up_email_4,
                follow_up_email_4_subject: lead.follow_up_email_4_subject
            }
        };
    });

    const campaignName = await fetchCampaignName(campaignId);
    const createdCampaign = await createSmartleadCampaign(campaignName, smartLeadApiKey);
    await updateCampaignInDatabase(campaignId, createdCampaign.id);
    await addLeadsToCampaign(createdCampaign.id, leadData, smartLeadApiKey);
    await addSequencesToCampaign(createdCampaign.id, smartLeadApiKey);

    const scheduleData = {
        timezone: timezone ?? 'America/Los_Angeles',
        days_of_the_week: dayOfWeek,
        start_hour: startHour,
        end_hour: endHour,
        min_time_btw_emails: minTimeBetweenEmails,
        max_new_leads_per_day: maxNewLeadsPerDay,
        schedule_start_time: scheduleStartTime || new Date().toISOString(),
    };

    await scheduleCampaign(createdCampaign.id, scheduleData, smartLeadApiKey);
    await setEmailSendingAccounts(createdCampaign.id, campaignDomains, smartLeadApiKey);

    // Start the campaign
    await startCampaign(createdCampaign.id, smartLeadApiKey);
}
