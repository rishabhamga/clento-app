import axios from 'axios';
import { supabase } from './supabase';

interface SmartleadCampaignParams {
    campaignId: string;
    leads: Array<{
        full_name: string | null;
        status: string;
        linkedin_connection_status: string;
        created_at: string;
        updated_at: string;
    }>;
    timezone?: string;
    dayOfWeek: number[];
    startHour: string;
    endHour: string;
    minTimeBetweenEmails: number;
    maxNewLeadsPerDay: number;
    scheduleStartTime?: string;
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
                seq_variants: [
                    {
                        subject: 'Subject',
                        email_body: '<p>Hi<br><br>How are you?<br><br>Hope you\'re doing good</p>',
                        variant_label: 'A'
                    },
                    {
                        subject: 'Ema a',
                        email_body: '<p>This is a new game a</p>',
                        variant_label: 'B'
                    },
                    {
                        subject: 'C emsil',
                        email_body: '<p>Hiii C</p>',
                        variant_label: 'C'
                    }
                ]
            },
            {
                seq_number: 2,
                seq_delay_details: {
                    delay_in_days: 1
                },
                subject: '', // Blank makes the follow-up in the same thread
                email_body: '<p>Bump up right!</p>'
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

export async function getPersonalisation () {

}

//Main function
export async function startSmartleadCampaign(params: SmartleadCampaignParams): Promise<any> {
    const { campaignId, leads, timezone, dayOfWeek, startHour, endHour, minTimeBetweenEmails, maxNewLeadsPerDay, scheduleStartTime } = params;

    const smartLeadApiKey = process.env.SMARTLEAD_API_KEY as string;

    const leadData = leads.map(lead => {
        const [firstName, ...lastNameParts] = (lead.full_name || '').split(' ');
        return {
            first_name: firstName || 'Unknown',
            last_name: lastNameParts.join(' ') || 'Unknown',
            email: lead.full_name ? `${lead.full_name.replace(/\s+/g, '.').toLowerCase()}@example.com` : 'unknown@example.com',
            linkedin_profile: lead.linkedin_connection_status === 'connected' ? `https://www.linkedin.com/in/${firstName.toLowerCase()}` : null,
            custom_fields: {
                Status: lead.status
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
}
