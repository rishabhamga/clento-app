import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()

  // Handle protected routes
  if (isProtectedRoute(req)) {
    // If user is not authenticated, redirect to sign-in
    if (!userId) {
      const signInUrl = new URL('/sign-in', req.url)
      signInUrl.searchParams.set('redirect_url', req.url)
      return NextResponse.redirect(signInUrl)
    }

    // Check onboarding completion for authenticated users (except when coming from onboarding)
    if (req.nextUrl.pathname !== '/onboarding') {
      // Skip onboarding check if coming from onboarding (to prevent race condition)
      const referer = req.headers.get('referer')
      const isComingFromOnboarding = referer?.includes('/onboarding')
      
      if (!isComingFromOnboarding) {
        try {
          const supabase = createClient(supabaseUrl, supabaseServiceKey)
          
          // Get user record
          const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('clerk_id', userId)
            .single()

          if (user) {
            // Check if user has completed onboarding
            const { data: profile } = await supabase
              .from('user_profile')
              .select('onboarding_completed')
              .eq('user_id', user.id)
              .single()

            // If onboarding is not completed, redirect to onboarding
            if (!profile?.onboarding_completed) {
              const onboardingUrl = new URL('/onboarding', req.url)
              return NextResponse.redirect(onboardingUrl)
            }
          } else {
            // New user, redirect to onboarding to trigger sync
            const onboardingUrl = new URL('/onboarding', req.url)
            return NextResponse.redirect(onboardingUrl)
          }
        } catch (error) {
          console.error('Error checking onboarding status:', error)
          // On error, allow access (fail open)
        }
      }
    }
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