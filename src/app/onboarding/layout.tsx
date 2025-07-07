import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export default async function OnboardingLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  // Note: Removed automatic redirect to dashboard from layout to prevent race conditions
  // The OnboardingWizard component handles the redirect after completing onboarding
  
  return <>{children}</>
} 