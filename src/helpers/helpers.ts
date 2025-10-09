import { syndieBaseUrl } from "../lib/utils"
import axios from 'axios';

export const orgToSmartLeadCampaignMap = {
    '6f462221-2f14-48a3-91d1-b60ba824caf9': [//Revenue sage
        '2510990',
        '2510844'
    ],
    'b9580756-519d-44d4-a3a9-9622c62816a3': [//Alloroots
        '2444463',
        '2444437',
        '2444372'
    ],
    '784b9227-61c5-47c9-97ac-d46233cd3a69': [ // Altech
        '2440388',
        '2440266',
        '2440099'
    ],
    '5b733d24-8be8-4c2b-87c9-fcf50eadb796': [ // Supreme
        '2444335',
        '2444280'
    ],
    '8be53b58-d55b-4b58-b90f-a13e9815bbab': [//Upriver
        '2440779',
        '2440699'
    ],
    // @todo graphketing
}

export const getCampaigns = async (tokenData: { api_token: string }) => {
    try {
        const res = await axios.get(syndieBaseUrl + '/api/campaigns' + '?includeAnalytics=true&includeDetailedActions=true', {
            headers: {
                'Authorization': `Bearer ${tokenData.api_token}`,
                'Content-Type': 'application/json',
            }
        })

        if (!res.data) {
            console.log('No Campaigns Found')
            return
        }
        const campaignsArray: any[] = res.data.data
        // console.log(JSON.stringify(res.data.data, null, 4))

        return campaignsArray
    } catch (err) {
        console.log(JSON.stringify(err, null, 4));
        return
    }
}

export const getLeads = async (tokenData: { api_token: string }, campaignIds: string[], page: string, limit: string, status?: string, search?: string) => {
    try {
        const paramsObj: Record<string, string> = { page, limit };
        if (status !== undefined) {
            paramsObj.status = status;
        }
        if (search !== undefined) {
            paramsObj.search = search;
        }
        const params = new URLSearchParams(paramsObj);
        console.log(params)
        campaignIds.forEach(id => params.append('campaignId', id));
        const res = await axios.get(`${syndieBaseUrl}/api/leads?${params.toString()}`, {
            headers: {
                'Authorization': `Bearer ${tokenData.api_token}`,
                'Content-Type': 'application/json',
            }
        });
        return res.data;
    } catch (err) {
        console.log(err);
        return;
    }
}

export const getStats = async (campaignsArray: any) => {
    // Ensure campaignsArray is an array
    if (!Array.isArray(campaignsArray)) {
        console.error('getStats: campaignsArray is not an array:', campaignsArray);
        return {};
    }

    const allStats = campaignsArray.map((it: any) => it.stats)
    const totals = allStats.reduce((acc: any, curr: any) => {
        if (curr && typeof curr === 'object') {
            Object.keys(curr).forEach((key) => {
                acc[key] = (acc[key] || 0) + curr[key];
            });
        }
        return acc;
    }, {} as Record<string, number>);
    return totals
}