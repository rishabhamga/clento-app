import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'

// Define routes that should be protected (require authentication)
const isProtectedRoute = createRouteMatcher([
    '/dashboard(.*)',
    '/campaigns(.*)',
    '/onboarding'
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

        if (req.nextUrl.pathname !== '/onboarding') {
            const referer = req.headers.get('referer')
            const isComingFromOnboarding = referer?.includes('/onboarding')

            if (!isComingFromOnboarding) {
                try {
                    const supabase = createClient(supabaseUrl, supabaseServiceKey)

                    // Fetch user and profile in a single query using Supabase's join feature
                    const { data: user, error: userError } = await supabase
                        .from('users')
                        .select('id')
                        .eq('clerk_id', userId)
                        .single();

                    if (userError) {
                        console.error('Error fetching user:', userError);
                        throw new Error('Failed to fetch user');
                    }

                    if (!user) {
                        const onboardingUrl = new URL('/onboarding', req.url);
                        return NextResponse.redirect(onboardingUrl);
                    }

                    const { data: profile, error: profileError } = await supabase
                        .from('user_profile')
                        .select('onboarding_completed')
                        .eq('user_id', user.id)
                        .single();

                    if (profileError) {
                        console.error('Error fetching user profile:', profileError);
                        throw new Error('Failed to fetch user profile');
                    }

                    if (!profile?.onboarding_completed) {
                        const onboardingUrl = new URL('/onboarding', req.url);
                        return NextResponse.redirect(onboardingUrl);
                    }
                } catch (error) {
                    console.error('Error checking onboarding status:', error)
                }
            }
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