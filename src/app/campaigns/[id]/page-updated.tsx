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
  CardHeader,
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
  Select,
  Textarea,
  Flex,
  Wrap,
  WrapItem,
  Divider
} from '@chakra-ui/react'
import { keyframes } from '@emotion/react'
import { ArrowLeft, Lock, Target, MessageSquare, Workflow, Rocket, Globe, Edit3, PenTool, Users } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { GradientButton } from '@/components/ui/GradientButton'
import { CampaignStepper } from '@/components/ui/CampaignStepper'

// Enhanced animations matching campaign creation pages
const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
`

const glow = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(102, 126, 234, 0.3); }
  50% { box-shadow: 0 0 30px rgba(102, 126, 234, 0.5); }
`

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`

interface Campaign {
  id: string
  name: string
  description: string
  status: string
  created_at: string
  sequence_template: string
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

  // Enhanced glassmorphism colors matching campaign creation
  const cardBg = useColorModeValue('rgba(255, 255, 255, 0.9)', 'rgba(26, 32, 44, 0.9)')
  const glassBg = useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(26, 32, 44, 0.8)')
  const borderColor = useColorModeValue('rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)')
  const grayBg = useColorModeValue('rgba(247, 250, 252, 0.9)', 'rgba(45, 55, 72, 0.9)')
  const gradientBg = useColorModeValue(
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #4a5568 0%, #2d3748 100%)'
  )
  const accentGradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const response = await fetch(`/api/console/campaigns/${params.id}`)
        if (!response.ok) throw new Error('Failed to fetch campaign')
        
        const data = await response.json()
        console.log('🔍 Campaign Data from API:', data)
        console.log('🔍 Campaign Settings:', data.campaignData?.settings)
        setCampaign(data.campaignData)
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

  const renderTargetingContent = () => {
    const targeting = campaign?.settings?.targeting || {}
    const filters = campaign?.settings?.filters || {}
    
    return (
      <Container maxW="7xl" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Header Section */}
          <VStack spacing={4} textAlign="center">
            <Heading 
              size="2xl" 
              fontWeight="bold"
              bgGradient="linear(to-r, purple.400, blue.400)"
              bgClip="text"
            >
              Ideal Customer Profile Preview
            </Heading>
            <Text fontSize="xl" color="gray.600" maxW="2xl">
              View your configured ideal customer targeting criteria
            </Text>
          </VStack>

          {/* Targeting Filters Display */}
          <Card
            bg={glassBg}
            borderRadius="2xl"
            border="1px solid"
            borderColor={borderColor}
            backdropFilter="blur(20px)"
            boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
            _hover={{
              transform: 'translateY(-4px)',
              boxShadow: '0 35px 60px -12px rgba(102, 126, 234, 0.4)',
              transition: 'all 0.3s ease-in-out'
            }}
            transition="all 0.3s ease-in-out"
          >
            <CardHeader pb={2}>
              <HStack spacing={3} justify="space-between">
                <HStack spacing={3}>
                  <Box
                    p={3}
                    borderRadius="xl"
                    bg={accentGradient}
                    color="white"
                    boxShadow="0 8px 20px rgba(102, 126, 234, 0.4)"
                  >
                    <Users size="20" />
                  </Box>
                  <VStack align="start" spacing={0}>
                    <Heading size="md" color="gray.800">Selected Filters</Heading>
                    <Text fontSize="sm" color="gray.600">Your targeting configuration</Text>
                  </VStack>
                </HStack>
                <Button 
                  size="sm" 
                  leftIcon={<Lock size={16} />} 
                  onClick={handleEditAttempt}
                  variant="outline"
                  borderColor="purple.200"
                  _hover={{ borderColor: 'purple.400' }}
                >
                  Edit
                </Button>
              </HStack>
            </CardHeader>
            <CardBody pt={0}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <Box>
                  <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={2}>Job Titles</Text>
                  <Text fontSize="sm" color="gray.800">
                    {filters.jobTitles?.length > 0 
                      ? filters.jobTitles.join(', ') 
                      : targeting.jobTitles || 'Head of Sales, CTO, VP Engineering'}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={2}>Industries</Text>
                  <Text fontSize="sm" color="gray.800">
                    {filters.industries?.length > 0 
                      ? filters.industries.join(', ') 
                      : targeting.industries || 'Technology, SaaS, Software'}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={2}>Company Size</Text>
                  <Text fontSize="sm" color="gray.800">
                    {filters.companySize || targeting.companySize || '100-500 employees'}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={2}>Location</Text>
                  <Text fontSize="sm" color="gray.800">
                    {filters.locations?.length > 0 
                      ? filters.locations.join(', ') 
                      : targeting.location || 'United States'}
                  </Text>
                </Box>
              </SimpleGrid>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    )
  }

  const renderPitchContent = () => {
    const pitch = campaign?.settings?.pitch || {}
    const offering = campaign?.settings?.offering || {}
    const painPoints = campaign?.settings?.pain_points || []
    const proofPoints = campaign?.settings?.proof_points || []
    
    return (
      <Container maxW="7xl" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Header Section */}
          <VStack spacing={4} textAlign="center">
            <Heading 
              size="2xl" 
              fontWeight="bold"
              bgGradient="linear(to-r, purple.400, blue.400)"
              bgClip="text"
            >
              Create Your Pitch
            </Heading>
            <Text fontSize="xl" color="gray.600" maxW="2xl">
              Analyze your website and create compelling messaging that converts prospects into customers
            </Text>
          </VStack>

          {/* Core Offering */}
          <Card
            bg={glassBg}
            borderRadius="2xl"
            border="1px solid"
            borderColor={borderColor}
            backdropFilter="blur(20px)"
            boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
            _hover={{
              transform: 'translateY(-4px)',
              boxShadow: '0 35px 60px -12px rgba(102, 126, 234, 0.4)',
              transition: 'all 0.3s ease-in-out'
            }}
            transition="all 0.3s ease-in-out"
          >
            <CardHeader pb={2}>
              <HStack spacing={3} justify="space-between">
                <HStack spacing={3}>
                  <Box
                    p={3}
                    borderRadius="xl"
                    bg={accentGradient}
                    color="white"
                    boxShadow="0 8px 20px rgba(102, 126, 234, 0.4)"
                  >
                    <Target size="20" />
                  </Box>
                  <VStack align="start" spacing={0}>
                    <Heading size="md" color="gray.800">Core Offering</Heading>
                    <Text fontSize="sm" color="gray.600">Your primary value proposition</Text>
                  </VStack>
                </HStack>
                <Button 
                  size="sm" 
                  leftIcon={<Lock size={16} />} 
                  onClick={handleEditAttempt}
                  variant="outline"
                  borderColor="purple.200"
                  _hover={{ borderColor: 'purple.400' }}
                >
                  Edit
                </Button>
              </HStack>
            </CardHeader>
            <CardBody pt={0}>
              <Text fontSize="md" color="gray.800" lineHeight="1.6">
                {offering.description || pitch.coreOffering || campaign?.description || 'Clento provides an all-in-one AI-powered sales development platform that automates the entire outreach process, enhancing SDR performance and reducing costs.'}
              </Text>
            </CardBody>
          </Card>

          {/* Customer Pain Points */}
          <Card
            bg={glassBg}
            borderRadius="2xl"
            border="1px solid"
            borderColor={borderColor}
            backdropFilter="blur(20px)"
            boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
            _hover={{
              transform: 'translateY(-4px)',
              boxShadow: '0 35px 60px -12px rgba(102, 126, 234, 0.4)',
              transition: 'all 0.3s ease-in-out'
            }}
            transition="all 0.3s ease-in-out"
          >
            <CardHeader pb={2}>
              <HStack spacing={3} justify="space-between">
                <HStack spacing={3}>
                  <Box
                    p={3}
                    borderRadius="xl"
                    bg="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
                    color="white"
                    boxShadow="0 8px 20px rgba(240, 147, 251, 0.4)"
                  >
                    <Text fontSize="lg">😣</Text>
                  </Box>
                  <VStack align="start" spacing={0}>
                    <Heading size="md" color="gray.800">Customer Pain Points</Heading>
                    <Text fontSize="sm" color="gray.600">Problems your solution addresses</Text>
                  </VStack>
                </HStack>
                <Button 
                  size="sm" 
                  leftIcon={<Lock size={16} />} 
                  onClick={handleEditAttempt}
                  variant="outline"
                  borderColor="purple.200"
                  _hover={{ borderColor: 'purple.400' }}
                >
                  Edit
                </Button>
              </HStack>
            </CardHeader>
            <CardBody pt={0}>
              <VStack spacing={3} align="stretch">
                {(painPoints.length > 0 ? painPoints : [
                  'High costs and complexity of managing multiple sales tools',
                  'Inconsistent outreach and low meeting conversion rates',
                  'Need for personalized outreach while maintaining compliance',
                  'Fragmented sales tools leading to inefficiencies'
                ]).map((point, index) => (
                  <Box
                    key={index}
                    p={4}
                    borderRadius="xl"
                    bg="rgba(248, 113, 113, 0.1)"
                    border="1px solid"
                    borderColor="red.200"
                  >
                    <HStack spacing={3}>
                      <Text fontWeight="bold" color="red.500">{index + 1}</Text>
                      <Text fontSize="sm" color="gray.800">{point}</Text>
                    </HStack>
                  </Box>
                ))}
              </VStack>
            </CardBody>
          </Card>

          {/* Success Stories & Proof */}
          <Card
            bg={glassBg}
            borderRadius="2xl"
            border="1px solid"
            borderColor={borderColor}
            backdropFilter="blur(20px)"
            boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
            _hover={{
              transform: 'translateY(-4px)',
              boxShadow: '0 35px 60px -12px rgba(102, 126, 234, 0.4)',
              transition: 'all 0.3s ease-in-out'
            }}
            transition="all 0.3s ease-in-out"
          >
            <CardHeader pb={2}>
              <HStack spacing={3} justify="space-between">
                <HStack spacing={3}>
                  <Box
                    p={3}
                    borderRadius="xl"
                    bg="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
                    color="white"
                    boxShadow="0 8px 20px rgba(79, 172, 254, 0.4)"
                  >
                    <Text fontSize="lg">🏆</Text>
                  </Box>
                  <VStack align="start" spacing={0}>
                    <Heading size="md" color="gray.800">Success Stories & Proof</Heading>
                    <Text fontSize="sm" color="gray.600">Evidence of your solution's effectiveness</Text>
                  </VStack>
                </HStack>
                <Button 
                  size="sm" 
                  leftIcon={<Lock size={16} />} 
                  onClick={handleEditAttempt}
                  variant="outline"
                  borderColor="purple.200"
                  _hover={{ borderColor: 'purple.400' }}
                >
                  Edit
                </Button>
              </HStack>
            </CardHeader>
            <CardBody pt={0}>
              <VStack spacing={3} align="stretch">
                {(proofPoints.length > 0 ? proofPoints : [
                  'Streamlined sales processes',
                  'Increased meeting bookings and conversion rates',
                  'Enhanced personalization in outreach',
                  'Compliance with industry regulations'
                ]).map((point, index) => (
                  <Box
                    key={index}
                    p={4}
                    borderRadius="xl"
                    bg="rgba(34, 197, 94, 0.1)"
                    border="1px solid"
                    borderColor="green.200"
                  >
                    <HStack spacing={3}>
                      <Text fontWeight="bold" color="green.500">{index + 1}</Text>
                      <Text fontSize="sm" color="gray.800">{point}</Text>
                    </HStack>
                  </Box>
                ))}
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    )
  }

  const renderOutreachContent = () => {
    const outreach = campaign?.settings?.outreach || {}
    const messaging = campaign?.settings?.messaging || {}
    const language = campaign?.settings?.campaign_language || 'English'
    const signOffs = campaign?.settings?.sign_offs || ['BEST', 'REGARDS', 'THANKS']
    
    return (
      <Container maxW="7xl" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Header Section */}
          <VStack spacing={4} textAlign="center">
            <Heading 
              size="2xl" 
              fontWeight="bold"
              bgGradient="linear(to-r, purple.400, blue.400)"
              bgClip="text"
            >
              Outreach Configuration
            </Heading>
            <Text fontSize="xl" color="gray.600" maxW="2xl">
              Configure your messaging settings and personalization options with AI-powered precision
            </Text>
          </VStack>

          {/* Campaign Language */}
          <Card
            bg={glassBg}
            borderRadius="2xl"
            border="1px solid"
            borderColor={borderColor}
            backdropFilter="blur(20px)"
            boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
            _hover={{
              transform: 'translateY(-4px)',
              boxShadow: '0 35px 60px -12px rgba(102, 126, 234, 0.4)',
              transition: 'all 0.3s ease-in-out'
            }}
            transition="all 0.3s ease-in-out"
          >
            <CardHeader pb={2}>
              <HStack spacing={3} justify="space-between">
                <HStack spacing={3}>
                  <Box
                    p={3}
                    borderRadius="xl"
                    bg={accentGradient}
                    color="white"
                    boxShadow="0 8px 20px rgba(102, 126, 234, 0.4)"
                  >
                    <Globe size="20" />
                  </Box>
                  <VStack align="start" spacing={0}>
                    <Heading size="md" color="gray.800">Campaign Language</Heading>
                    <Text fontSize="sm" color="gray.600">Choose your preferred communication language</Text>
                  </VStack>
                </HStack>
                <Button 
                  size="sm" 
                  leftIcon={<Lock size={16} />} 
                  onClick={handleEditAttempt}
                  variant="outline"
                  borderColor="purple.200"
                  _hover={{ borderColor: 'purple.400' }}
                >
                  Edit
                </Button>
              </HStack>
            </CardHeader>
            <CardBody pt={0}>
              <Box
                p={4}
                borderRadius="xl"
                border="2px solid"
                borderColor="purple.200"
                bg="white"
                fontSize="lg"
                fontWeight="600"
                color="gray.800"
              >
                {language}
              </Box>
            </CardBody>
          </Card>

          {/* Message Sign Offs */}
          <Card
            bg={glassBg}
            borderRadius="2xl"
            border="1px solid"
            borderColor={borderColor}
            backdropFilter="blur(20px)"
            boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
            _hover={{
              transform: 'translateY(-4px)',
              boxShadow: '0 35px 60px -12px rgba(102, 126, 234, 0.4)',
              transition: 'all 0.3s ease-in-out'
            }}
            transition="all 0.3s ease-in-out"
          >
            <CardHeader pb={2}>
              <HStack spacing={3} justify="space-between">
                <HStack spacing={3}>
                  <Box
                    p={3}
                    borderRadius="xl"
                    bg={accentGradient}
                    color="white"
                    boxShadow="0 8px 20px rgba(102, 126, 234, 0.4)"
                  >
                    <Edit3 size="20" />
                  </Box>
                  <VStack align="start" spacing={0}>
                    <Heading size="md" color="gray.800">Message Sign Offs In {language.split(' ')[0]}</Heading>
                    <Text fontSize="sm" color="gray.600">Customize your message endings</Text>
                  </VStack>
                </HStack>
                <Button 
                  size="sm" 
                  leftIcon={<Lock size={16} />} 
                  onClick={handleEditAttempt}
                  variant="outline"
                  borderColor="purple.200"
                  _hover={{ borderColor: 'purple.400' }}
                >
                  Edit
                </Button>
              </HStack>
            </CardHeader>
            <CardBody pt={0}>
              <VStack spacing={4} align="stretch">
                <Flex wrap="wrap" gap={3}>
                  {signOffs.map((signOff, index) => (
                    <Badge
                      key={index}
                      px={4}
                      py={2}
                      borderRadius="xl"
                      bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                      color="white"
                      fontSize="sm"
                      fontWeight="600"
                      boxShadow="0 4px 15px rgba(102, 126, 234, 0.4)"
                      textTransform="none"
                    >
                      {signOff}
                    </Badge>
                  ))}
                </Flex>
              </VStack>
            </CardBody>
          </Card>

          {/* Tone of Voice */}
          <Card
            bg={glassBg}
            borderRadius="2xl"
            border="1px solid"
            borderColor={borderColor}
            backdropFilter="blur(20px)"
            boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
            _hover={{
              transform: 'translateY(-4px)',
              boxShadow: '0 35px 60px -12px rgba(102, 126, 234, 0.4)',
              transition: 'all 0.3s ease-in-out'
            }}
            transition="all 0.3s ease-in-out"
          >
            <CardHeader pb={2}>
              <HStack spacing={3} justify="space-between">
                <HStack spacing={3}>
                  <Box
                    p={3}
                    borderRadius="xl"
                    bg={accentGradient}
                    color="white"
                    boxShadow="0 8px 20px rgba(102, 126, 234, 0.4)"
                  >
                    <PenTool size="20" />
                  </Box>
                  <VStack align="start" spacing={0}>
                    <Heading size="md" color="gray.800">Tone of Voice</Heading>
                    <Text fontSize="sm" color="gray.600">Define your communication style</Text>
                  </VStack>
                </HStack>
                <Button 
                  size="sm" 
                  leftIcon={<Lock size={16} />} 
                  onClick={handleEditAttempt}
                  variant="outline"
                  borderColor="purple.200"
                  _hover={{ borderColor: 'purple.400' }}
                >
                  Edit
                </Button>
              </HStack>
            </CardHeader>
            <CardBody pt={0}>
              <Box
                p={4}
                borderRadius="xl"
                border="2px solid"
                borderColor="purple.200"
                bg="white"
                fontSize="lg"
                fontWeight="600"
                color="gray.800"
              >
                {campaign?.settings?.tone_of_voice || 'Urgent'}
              </Box>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    )
  }

  const renderWorkflowContent = () => {
    const workflow = campaign?.settings?.workflow || {}
    const sequence = campaign?.settings?.sequence || {}
    
    return (
      <Container maxW="7xl" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Header Section */}
          <VStack spacing={4} textAlign="center">
            <Heading 
              size="2xl" 
              fontWeight="bold"
              bgGradient="linear(to-r, purple.400, blue.400)"
              bgClip="text"
            >
              Workflow Configuration
            </Heading>
            <Text fontSize="xl" color="gray.600" maxW="2xl">
              Review your automated sequence and workflow settings
            </Text>
          </VStack>

          {/* Sequence Details */}
          <Card
            bg={glassBg}
            borderRadius="2xl"
            border="1px solid"
            borderColor={borderColor}
            backdropFilter="blur(20px)"
            boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
            _hover={{
              transform: 'translateY(-4px)',
              boxShadow: '0 35px 60px -12px rgba(102, 126, 234, 0.4)',
              transition: 'all 0.3s ease-in-out'
            }}
            transition="all 0.3s ease-in-out"
          >
            <CardHeader pb={2}>
              <HStack spacing={3} justify="space-between">
                <HStack spacing={3}>
                  <Box
                    p={3}
                    borderRadius="xl"
                    bg={accentGradient}
                    color="white"
                    boxShadow="0 8px 20px rgba(102, 126, 234, 0.4)"
                  >
                    <Workflow size="20" />
                  </Box>
                  <VStack align="start" spacing={0}>
                    <Heading size="md" color="gray.800">Sequence Setup</Heading>
                    <Text fontSize="sm" color="gray.600">Your automation workflow configuration</Text>
                  </VStack>
                </HStack>
                <Button 
                  size="sm" 
                  leftIcon={<Lock size={16} />} 
                  onClick={handleEditAttempt}
                  variant="outline"
                  borderColor="purple.200"
                  _hover={{ borderColor: 'purple.400' }}
                >
                  Edit
                </Button>
              </HStack>
            </CardHeader>
            <CardBody pt={0}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <Box>
                  <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={2}>Sequence Type</Text>
                  <Text fontSize="md" color="gray.800">
                    {campaign?.sequence_template || workflow.sequenceType || 'aggressive-multi'}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={2}>Total Steps</Text>
                  <Text fontSize="md" color="gray.800">
                    {sequence.steps?.length ? `${sequence.steps.length} touchpoints` : workflow.totalSteps || '4 touchpoints'}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={2}>Duration</Text>
                  <Text fontSize="md" color="gray.800">
                    {workflow.duration || sequence.duration || '6 days'}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={2}>Channels</Text>
                  <Text fontSize="md" color="gray.800">
                    {workflow.channels?.join(' + ') || sequence.channels?.join(' + ') || 'LinkedIn + Email'}
                  </Text>
                </Box>
              </SimpleGrid>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    )
  }

  const renderLaunchContent = () => {
    const launch = campaign?.settings?.launch || {}
    const stats = campaign?.settings?.stats || {}
    
    return (
      <Container maxW="7xl" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Header Section */}
          <VStack spacing={4} textAlign="center">
            <Heading 
              size="2xl" 
              fontWeight="bold"
              bgGradient="linear(to-r, purple.400, blue.400)"
              bgClip="text"
            >
              Campaign Launch
            </Heading>
            <Text fontSize="xl" color="gray.600" maxW="2xl">
              Review your campaign status and launch configuration
            </Text>
          </VStack>

          {/* Launch Status */}
          <Card
            bg={glassBg}
            borderRadius="2xl"
            border="1px solid"
            borderColor={borderColor}
            backdropFilter="blur(20px)"
            boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
            _hover={{
              transform: 'translateY(-4px)',
              boxShadow: '0 35px 60px -12px rgba(102, 126, 234, 0.4)',
              transition: 'all 0.3s ease-in-out'
            }}
            transition="all 0.3s ease-in-out"
          >
            <CardHeader pb={2}>
              <HStack spacing={3} justify="space-between">
                <HStack spacing={3}>
                  <Box
                    p={3}
                    borderRadius="xl"
                    bg={accentGradient}
                    color="white"
                    boxShadow="0 8px 20px rgba(102, 126, 234, 0.4)"
                  >
                    <Rocket size="20" />
                  </Box>
                  <VStack align="start" spacing={0}>
                    <Heading size="md" color="gray.800">Campaign Status</Heading>
                    <Text fontSize="sm" color="gray.600">Current launch configuration</Text>
                  </VStack>
                </HStack>
                <Button 
                  size="sm" 
                  leftIcon={<Lock size={16} />} 
                  onClick={handleEditAttempt}
                  variant="outline"
                  borderColor="purple.200"
                  _hover={{ borderColor: 'purple.400' }}
                >
                  Edit
                </Button>
              </HStack>
            </CardHeader>
            <CardBody pt={0}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <Box>
                  <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={2}>Status</Text>
                  <Badge 
                    colorScheme={campaign?.status === 'active' ? 'green' : 'yellow'}
                    variant="subtle"
                    fontSize="md"
                    px={3}
                    py={1}
                    borderRadius="lg"
                  >
                    {campaign?.status?.toUpperCase() || 'DRAFT'}
                  </Badge>
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={2}>Start Date</Text>
                  <Text fontSize="md" color="gray.800">
                    {launch.startDate 
                      ? new Date(launch.startDate).toLocaleDateString() 
                      : campaign?.created_at 
                        ? new Date(campaign.created_at).toLocaleDateString() 
                        : 'Not set'}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={2}>Total Leads</Text>
                  <Text fontSize="md" color="gray.800">
                    {stats.totalLeads || campaign?.settings?.totalLeads || campaign?.settings?.leadCount || '0'}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={2}>Template</Text>
                  <Text fontSize="md" color="gray.800">
                    {campaign?.sequence_template || launch.template || 'aggressive-multi'}
                  </Text>
                </Box>
              </SimpleGrid>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    )
  }

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
      {/* Campaign Progress Header - exactly like campaign creation */}
      <Box
        bgGradient="linear(135deg, #667eea 0%, #764ba2 100%)"
        minH="100vh"
        position="relative"
        overflow="hidden"
      >
        {/* Background Animation */}
        <Box
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          background="radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%), 
                     radial-gradient(circle at 70% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)"
          animation={`${float} 6s ease-in-out infinite`}
          zIndex="0"
        />

        <Container maxW="7xl" py={6} position="relative" zIndex="1">
          <VStack spacing={8} align="stretch">
            {/* Header with Back Button */}
            <HStack spacing={4}>
              <Button
                leftIcon={<ArrowLeft size={16} />}
                variant="ghost"
                color="white"
                _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
                onClick={() => router.back()}
              >
                Back
              </Button>
              <VStack spacing={1} align="start" flex={1}>
                <Heading 
                  size="xl" 
                  color="white"
                  fontWeight="bold"
                >
                  {campaign.name}
                </Heading>
                <Text color="whiteAlpha.800" fontSize="lg">
                  Campaign Overview
                </Text>
              </VStack>
              <Badge 
                colorScheme={campaign.status === 'active' ? 'green' : 'yellow'}
                variant="solid"
                fontSize="sm"
                px={3}
                py={1}
              >
                {campaign.status.toUpperCase()}
              </Badge>
            </HStack>

            {/* Progress Stepper - exactly like campaign creation */}
            <Card
              bg="rgba(255, 255, 255, 0.95)"
              backdropFilter="blur(20px)"
              borderRadius="2xl"
              border="1px solid"
              borderColor="rgba(255, 255, 255, 0.3)"
              boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
              p={6}
            >
              <CampaignStepper currentStep={currentStep + 1} />
            </Card>

            {/* Step Content */}
            <Box>
              {renderStepContent()}
            </Box>

            {/* Navigation - exactly like campaign creation */}
            <HStack justify="space-between" pt={4}>
              <Button
                variant="outline"
                size="lg"
                color="white"
                borderColor="whiteAlpha.300"
                _hover={{ borderColor: 'white', bg: 'rgba(255, 255, 255, 0.1)' }}
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                isDisabled={currentStep === 0}
              >
                Previous
              </Button>
              <Button
                size="lg"
                bg="white"
                color="purple.600"
                _hover={{ bg: 'whiteAlpha.900' }}
                onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                isDisabled={currentStep === steps.length - 1}
              >
                Next
              </Button>
            </HStack>
          </VStack>
        </Container>

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
      </Box>
    </DashboardLayout>
  )
}