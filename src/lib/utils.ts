import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import axios from "axios"

interface ICrmProps {
    companyName?: string;
    firstName?: string;
    lastName?: string;
    country?: string;
    mobileNumber?: string;
    linkedIn?: string;
    email: string
    source: string
}

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export const entryToCrm = async({ companyName, firstName, lastName, country, mobileNumber, email, source, linkedIn }: ICrmProps) => {
    const client_id = process.env.ZOHO_CLIENT_ID;
    const client_secret = process.env.ZOHO_CLIENT_SECRET;
    const refreshToken = process.env.ZOHO_REFRESH_TOKEN;

    const refreshUrl = `https://accounts.zoho.in/oauth/v2/token?client_id=${client_id}&client_secret=${client_secret}&grant_type=refresh_token&refresh_token=${refreshToken}`

    let access_token = null
    try {
        const req = await axios.post(refreshUrl)
        access_token = req?.data.access_token
    } catch (err) {
        console.log("an error occured", err)
    }
    if (access_token) {
        const crmUrl = `https://www.zohoapis.in/crm/v8/Leads`

        const headers = {
            "Authorization": `Zoho-oauthtoken ${access_token}`,
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        const reqBody = {
            "data": [
                {
                    "Company": companyName ?? 'Not Provided',
                    "First_Name": firstName ?? 'first name',
                    "Last_Name": lastName ?? 'last name',
                    "Email": email,
                    "Phone": mobileNumber ?? 'Not Provided',
                    "Country": country ?? 'Not Provided',
                    "Lead_Status": "Open",
                    "Lead_Source": source ?? 'unknown',
                    ...(linkedIn ? { "Linkedin": linkedIn ?? 'unknown' } : {})
                }
            ]
        }
        try {
            const req = await axios.post(crmUrl, reqBody, { headers })
            console.log(req.data, "CRM RESPONSE");
        } catch (err) {
            console.log("an error occured", err)
        }
    }
}