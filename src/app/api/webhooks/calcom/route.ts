import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { Webhook } from 'svix'
import { entryToCrm } from '../../../../lib/utils'

interface Attendees {
    email: string,
    name: string,
    timeZone: string,
    language: string[],
    utcOffset: number
}

export async function POST(req: NextRequest) {
    // Get the body
    const payload = await req.json()
    const body = JSON.stringify(payload)

    const data = payload.payload
    const attendees = data.attendees as Attendees[]

    await Promise.all(
        attendees.map(attendee => entryToCrm({
            firstName: attendee.name.split(' ')[0],
            lastName: attendee.name.split(' ')[1],
            email: attendee.email,
            source: 'CAL.COM BOOKING'
        }))
    )

    return NextResponse.json({ success: true })
}