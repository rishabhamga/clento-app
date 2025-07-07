import { Metadata } from 'next'
import OnboardingWizard from '@/components/OnboardingWizard'

export const metadata: Metadata = {
  title: 'Welcome - AI SDR Platform',
  description: 'Complete your setup to start generating qualified leads',
}

export default function OnboardingPage() {
  return <OnboardingWizard />
} 