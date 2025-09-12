import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'

// Define routes that should be protected (require authentication)
const isProtectedRoute = createRouteMatcher([
    '/dashboard(.*)',
    '/campaigns(.*)'
])

// Define public routes (accessible without authentication)
const isPublicRoute = createRouteMatcher([
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/webhooks/(.*)',
    '/api/linkedin/(.*)'
])

const isConsoleRoute = createRouteMatcher([
    '/console(.*)',
    '/api/console(.*)'
])

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export default clerkMiddleware(async (auth, req) => {
    const { userId } = await auth()

    if (isProtectedRoute(req)) {
        if (!userId) {
            const signInUrl = new URL('/sign-in', req.url)
            signInUrl.searchParams.set('redirect_url', req.url)
            return NextResponse.redirect(signInUrl)
        }
    }
    if (isConsoleRoute(req)) {
        if (!userId) {
            const signInUrl = new URL('/sign-in', req.url)
            signInUrl.searchParams.set('redirect_url', req.url)
            return NextResponse.redirect(signInUrl)
        }

        // check isAdmin flag in your users table
        try {
            const { data: u, error } = await supabase
                .from('users')
                .select('*')
                .eq('clerk_id', userId)
                .single()
            if (error) {
                // not an admin → 403
                return new NextResponse('Forbidden', { status: 403 })
            }
            if (!u?.isAdmin) {
                return new NextResponse('Forbidden', { status: 403 })
            }
        } catch (err) {
            console.error('Console auth error:', err)
            return new NextResponse('Internal error', { status: 500 })
        }

        // if we get here, userId && isAdmin === 1
        console.log("welcome admin")
        return NextResponse.next()
    }

    return NextResponse.next()
})

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
}