import { Enhanced3DStepper } from './Enhanced3DStepper'

interface CampaignStep {
  title: string
  description?: string
}

interface CampaignStepperProps {
  currentStep: number
  steps?: CampaignStep[]
  variant?: 'default' | 'compact' | 'detailed'
  colorScheme?: string
  showProgress?: boolean
  animated?: boolean
}

const defaultSteps: CampaignStep[] = [
  { title: 'Targeting', description: 'Define your ideal prospects' },
  { title: 'Pitch', description: 'Create your value proposition' },
  { title: 'Outreach', description: 'Configure messaging' },
  { title: 'Workflow', description: 'Set up sequences' },
  { title: 'Launch', description: 'Start your campaign' }
]

export function CampaignStepper({ 
  currentStep, 
  steps = defaultSteps,
  variant = 'detailed',
  colorScheme = 'purple',
  showProgress = true,
  animated = true
}: CampaignStepperProps) {
  return (
    <Enhanced3DStepper
      currentStep={currentStep}
      steps={steps}
      variant={variant}
      colorScheme={colorScheme}
      showProgress={showProgress}
      animated={animated}
    />
  )
} 