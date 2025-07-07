import {
  Box,
  Card,
  CardBody,
  Step,
  StepIcon,
  StepIndicator,
  StepNumber,
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
  useColorModeValue
} from '@chakra-ui/react'

interface CampaignStep {
  title: string
  description?: string
}

interface CampaignStepperProps {
  currentStep: number
  steps?: CampaignStep[]
}

const defaultSteps: CampaignStep[] = [
  { title: 'Targeting', description: 'Define your ideal prospects' },
  { title: 'Pitch', description: 'Create your value proposition' },
  { title: 'Outreach', description: 'Configure messaging' },
  { title: 'Workflow', description: 'Set up sequences' },
  { title: 'Launch', description: 'Start your campaign' }
]

export function CampaignStepper({ currentStep, steps = defaultSteps }: CampaignStepperProps) {
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  return (
    <Card bg={cardBg} border="1px solid" borderColor={borderColor} mb={6}>
      <CardBody>
        <Stepper index={currentStep} size="sm" colorScheme="purple">
          {steps.map((step, index) => (
            <Step key={index}>
              <StepIndicator>
                <StepStatus
                  complete={<StepIcon />}
                  incomplete={<StepNumber />}
                  active={<StepNumber />}
                />
              </StepIndicator>

              <Box flexShrink="0">
                <StepTitle fontSize="sm" fontWeight="semibold">
                  {step.title}
                </StepTitle>
              </Box>

              <StepSeparator />
            </Step>
          ))}
        </Stepper>
      </CardBody>
    </Card>
  )
} 