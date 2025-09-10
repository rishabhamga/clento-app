'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Card,
  CardBody,
  SimpleGrid,
  Badge,
  Button,
  Spinner,
  Alert,
  AlertIcon,
  useColorModeValue,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Icon,
  Stepper,
  Step,
  StepIndicator,
  StepStatus,
  StepIcon,
  StepNumber,
  StepTitle,
  StepDescription,
  StepSeparator,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel
} from '@chakra-ui/react'
import { ArrowLeft, Settings, Target, MessageSquare, Workflow, Rocket, Lock } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { GradientButton } from '@/components/ui/GradientButton'

interface Campaign {
  id: string
  name: string
  description: string
  status: string
  created_at: string
  settings: any
}

const steps = [
  { 
    id: 'targeting', 
    title: 'Targeting', 
    description: 'Define your ideal prospects',
    icon: Target
  },
  { 
    id: 'pitch', 
    title: 'Pitch', 
    description: 'Create your value proposition',
    icon: MessageSquare
  },
  { 
    id: 'outreach', 
    title: 'Outreach', 
    description: 'Configure messaging',
    icon: MessageSquare
  },
  { 
    id: 'workflow', 
    title: 'Workflow', 
    description: 'Set up sequences',
    icon: Workflow
  },
  { 
    id: 'launch', 
    title: 'Launch', 
    description: 'Start your campaign',
    icon: Rocket
  }
]

export default function CampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const toast = useToast()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(0)
  const { isOpen, onOpen, onClose } = useDisclosure()

  const cardBg = useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(26, 32, 44, 0.8)')
  const borderColor = useColorModeValue('rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)')

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const response = await fetch(`/api/console/campaigns/${params.id}`)
        if (!response.ok) throw new Error('Failed to fetch campaign')
        
        const data = await response.json()
        setCampaign(data)
      } catch (error) {
        console.error('Error fetching campaign:', error)
        toast({
          title: 'Error',
          description: 'Failed to load campaign details',
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchCampaign()
    }
  }, [params.id, toast])

  const handleEditAttempt = () => {
    onOpen()
  }

  const renderTargetingContent = () => (
    <VStack spacing={6} align="stretch">
      <Card bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="xl">
        <CardBody>
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between">
              <Heading size="md">Ideal Customer Profile</Heading>
              <Button 
                size="sm" 
                leftIcon={<Lock size={16} />} 
                onClick={handleEditAttempt}
                variant="outline"
              >
                Edit
              </Button>
            </HStack>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <Box>
                <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={2}>Job Titles</Text>
                <Text fontSize="sm">Head of Sales, CTO, VP Engineering</Text>
              </Box>
              <Box>
                <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={2}>Industries</Text>
                <Text fontSize="sm">Technology, SaaS, Software</Text>
              </Box>
              <Box>
                <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={2}>Company Size</Text>
                <Text fontSize="sm">100-500 employees</Text>
              </Box>
              <Box>
                <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={2}>Location</Text>
                <Text fontSize="sm">United States</Text>
              </Box>
            </SimpleGrid>
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  )

  const renderPitchContent = () => (
    <VStack spacing={6} align="stretch">
      <Card bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="xl">
        <CardBody>
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between">
              <Heading size="md">Value Proposition</Heading>
              <Button 
                size="sm" 
                leftIcon={<Lock size={16} />} 
                onClick={handleEditAttempt}
                variant="outline"
              >
                Edit
              </Button>
            </HStack>
            <Box>
              <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={2}>Core Offering</Text>
              <Text fontSize="sm">AI-powered sales development platform that automates outreach</Text>
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={2}>Pain Points Addressed</Text>
              <Text fontSize="sm">Manual outreach, low response rates, inefficient lead qualification</Text>
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={2}>Proof Points</Text>
              <Text fontSize="sm">3x higher response rates, 50% time savings, proven ROI</Text>
            </Box>
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  )

  const renderOutreachContent = () => (
    <VStack spacing={6} align="stretch">
      <Card bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="xl">
        <CardBody>
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between">
              <Heading size="md">Message Configuration</Heading>
              <Button 
                size="sm" 
                leftIcon={<Lock size={16} />} 
                onClick={handleEditAttempt}
                variant="outline"
              >
                Edit
              </Button>
            </HStack>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <Box>
                <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={2}>Email Subject Lines</Text>
                <Text fontSize="sm">Personalized based on company and role</Text>
              </Box>
              <Box>
                <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={2}>LinkedIn Messages</Text>
                <Text fontSize="sm">AI-generated, contextual outreach</Text>
              </Box>
              <Box>
                <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={2}>Follow-up Strategy</Text>
                <Text fontSize="sm">Multi-touch sequence with delays</Text>
              </Box>
              <Box>
                <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={2}>Personalization</Text>
                <Text fontSize="sm">Company research, recent news, mutual connections</Text>
              </Box>
            </SimpleGrid>
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  )

  const renderWorkflowContent = () => (
    <VStack spacing={6} align="stretch">
      <Card bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="xl">
        <CardBody>
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between">
              <Heading size="md">Sequence Setup</Heading>
              <Button 
                size="sm" 
                leftIcon={<Lock size={16} />} 
                onClick={handleEditAttempt}
                variant="outline"
              >
                Edit
              </Button>
            </HStack>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <Box>
                <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={2}>Sequence Type</Text>
                <Text fontSize="sm">Aggressive Multi-Channel</Text>
              </Box>
              <Box>
                <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={2}>Total Steps</Text>
                <Text fontSize="sm">4 touchpoints</Text>
              </Box>
              <Box>
                <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={2}>Duration</Text>
                <Text fontSize="sm">6 days</Text>
              </Box>
              <Box>
                <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={2}>Channels</Text>
                <Text fontSize="sm">LinkedIn + Email</Text>
              </Box>
            </SimpleGrid>
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  )

  const renderLaunchContent = () => (
    <VStack spacing={6} align="stretch">
      <Card bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="xl">
        <CardBody>
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between">
              <Heading size="md">Campaign Launch</Heading>
              <Button 
                size="sm" 
                leftIcon={<Lock size={16} />} 
                onClick={handleEditAttempt}
                variant="outline"
              >
                Edit
              </Button>
            </HStack>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <Box>
                <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={2}>Status</Text>
                <Badge colorScheme={campaign?.status === 'active' ? 'green' : 'yellow'}>
                  {campaign?.status?.toUpperCase()}
                </Badge>
              </Box>
              <Box>
                <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={2}>Start Date</Text>
                <Text fontSize="sm">
                  {campaign?.created_at ? new Date(campaign.created_at).toLocaleDateString() : 'Not set'}
                </Text>
              </Box>
              <Box>
                <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={2}>Total Leads</Text>
                <Text fontSize="sm">0</Text>
              </Box>
              <Box>
                <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={2}>Template</Text>
                <Text fontSize="sm">Aggressive Multi-Channel</Text>
              </Box>
            </SimpleGrid>
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  )

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: return renderTargetingContent()
      case 1: return renderPitchContent()
      case 2: return renderOutreachContent()
      case 3: return renderWorkflowContent()
      case 4: return renderLaunchContent()
      default: return renderTargetingContent()
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <Container maxW="7xl" py={8}>
          <VStack spacing={6} justify="center" h="400px">
            <Spinner size="xl" color="purple.500" />
            <Text>Loading campaign details...</Text>
          </VStack>
        </Container>
      </DashboardLayout>
    )
  }

  if (!campaign) {
    return (
      <DashboardLayout>
        <Container maxW="7xl" py={8}>
          <Alert status="error">
            <AlertIcon />
            Campaign not found
          </Alert>
        </Container>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <Container maxW="7xl" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <HStack spacing={4}>
            <Button
              leftIcon={<ArrowLeft size={16} />}
              variant="ghost"
              onClick={() => router.back()}
            >
              Back
            </Button>
            <VStack spacing={1} align="start" flex={1}>
              <Heading 
                size="xl" 
                bgGradient="linear(to-r, purple.400, blue.400)"
                bgClip="text"
                fontWeight="bold"
              >
                {campaign.name}
              </Heading>
              <Text color="gray.600" fontSize="lg">
                Campaign Overview
              </Text>
            </VStack>
            <Badge 
              colorScheme={campaign.status === 'active' ? 'green' : 'yellow'}
              variant="subtle"
              fontSize="sm"
              px={3}
              py={1}
            >
              {campaign.status.toUpperCase()}
            </Badge>
          </HStack>

          {/* Progress Stepper */}
          <Card bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="xl" p={6}>
            <VStack spacing={6}>
              <Stepper size="lg" index={currentStep} orientation="horizontal" width="100%">
                {steps.map((step, index) => (
                  <Step key={index}>
                    <StepIndicator 
                      cursor="pointer"
                      onClick={() => setCurrentStep(index)}
                      _hover={{ transform: 'scale(1.1)' }}
                      transition="all 0.2s ease"
                    >
                      <StepStatus
                        complete={<Icon as={step.icon} boxSize={4} />}
                        incomplete={<StepNumber />}
                        active={<Icon as={step.icon} boxSize={4} />}
                      />
                    </StepIndicator>
                    <Box flexShrink="0">
                      <StepTitle 
                        cursor="pointer"
                        onClick={() => setCurrentStep(index)}
                        _hover={{ color: 'purple.500' }}
                      >
                        {step.title}
                      </StepTitle>
                      <StepDescription>{step.description}</StepDescription>
                    </Box>
                    <StepSeparator />
                  </Step>
                ))}
              </Stepper>
            </VStack>
          </Card>

          {/* Step Content */}
          <Box>
            {renderStepContent()}
          </Box>

          {/* Navigation */}
          <HStack justify="space-between">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              isDisabled={currentStep === 0}
            >
              Previous
            </Button>
            <Button
              colorScheme="purple"
              onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
              isDisabled={currentStep === steps.length - 1}
            >
              Next
            </Button>
          </HStack>
        </VStack>

        {/* Edit Attempt Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="md">
          <ModalOverlay backdropFilter="blur(10px)" />
          <ModalContent bg={cardBg} borderRadius="xl">
            <ModalHeader>
              <VStack spacing={2} align="center">
                <Icon as={Lock} boxSize={8} color="purple.500" />
                <Text>Campaign Editing Restricted</Text>
              </VStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <VStack spacing={4} align="center" textAlign="center">
                <Text color="gray.600">
                  Campaign editing is currently restricted. To make changes to this campaign, 
                  please connect with your account executive.
                </Text>
                <GradientButton variant="primary" onClick={onClose}>
                  Contact Account Executive
                </GradientButton>
              </VStack>
            </ModalBody>
          </ModalContent>
        </Modal>
      </Container>
    </DashboardLayout>
  )
}