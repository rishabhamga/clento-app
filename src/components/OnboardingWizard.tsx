'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Input,
  Text,
  VStack,
  HStack,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Progress,
  Badge,
  Flex,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Avatar,
  IconButton,
  useColorModeValue,
  useToast,
  SimpleGrid,

  Icon,
  Tooltip
} from '@chakra-ui/react'
import { keyframes } from '@emotion/react'
import { useRouter } from 'next/navigation'
import { CheckCircleIcon, ChevronRightIcon, TimeIcon, DeleteIcon } from '@chakra-ui/icons'
import { FiUsers, FiTarget, FiBookOpen, FiLinkedin, FiSkipForward, FiCheck, FiArrowRight, FiRefreshCw } from 'react-icons/fi'
import { HiOutlineOfficeBuilding } from 'react-icons/hi'
import { GradientButton } from '@/components/ui/GradientButton'
import { AnalysisDisplay } from '@/components/AnalysisDisplay'
import { Enhanced3DStepper } from '@/components/ui/Enhanced3DStepper'
import { CreateOrganization, useOrganization, useUser } from '@clerk/nextjs'
import { createCustomToast, commonToasts } from '@/lib/utils/custom-toast'

// Enhanced animations matching campaign creation
const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
`

const glow = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(102, 126, 234, 0.3); }
  50% { box-shadow: 0 0 30px rgba(102, 126, 234, 0.5); }
`

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
`

interface LinkedInAccount {
  id: string
  linkedin_id: string
  display_name: string
  profile_picture_url?: string
  headline?: string
  industry?: string
  location?: string
  connection_status: string
  connected_at: string
}

interface ICPAnalysis {
  core_offer: string
  industry: string
  business_model: string
  icp_summary: string
  target_personas?: Array<{
    title: string
    company_size: string
    industry: string
    pain_points: string[]
    desired_outcomes: string[]
    challenges: string[]
    demographics: {
      seniority_level: string
      department: string
      decision_making_authority: string
    }
  }>
  case_studies?: Array<{
    title: string
    industry: string
    challenge: string
    solution: string
    results: string[]
    metrics?: string
    client_info?: string
  }>
  lead_magnets?: Array<{
    title: string
    type: string
    description: string
    target_audience: string
    call_to_action: string
    url?: string
  }>
  competitive_advantages: string[]
  tech_stack?: string[]
  social_proof?: {
    testimonials: Array<{
      quote: string
      author: string
      company?: string
      position?: string
    }>
    client_logos: string[]
    metrics: Array<{
      metric: string
      value: string
    }>
  }
  confidence_score: number
  pages_analyzed?: number
  completed_at?: string
}

export default function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(0)
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [icpAnalysis, setIcpAnalysis] = useState<ICPAnalysis | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [analysisId, setAnalysisId] = useState<string | null>(null)
  const [linkedinAccounts, setLinkedinAccounts] = useState<LinkedInAccount[]>([])
  const [isLoadingLinkedIn, setIsLoadingLinkedIn] = useState(false)
  const [organizationCreated, setOrganizationCreated] = useState(false)

  const router = useRouter()
  const toast = useToast()
  const { organization } = useOrganization()
  const { user } = useUser()

  // Enhanced color mode values with 3D styling matching campaign creation
  const cardBg = useColorModeValue('rgba(255, 255, 255, 0.9)', 'rgba(26, 32, 44, 0.9)')
  const glassBg = useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(26, 32, 44, 0.8)')
  const borderColor = useColorModeValue('rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)')
  const gradientBg = useColorModeValue(
    'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    'linear-gradient(135deg, #4c1d95 0%, #5b21b6 50%, #7c3aed 100%)'
  )
  const accentGradient = useColorModeValue(
    'linear-gradient(45deg, #667eea, #764ba2)',
    'linear-gradient(45deg, #5b21b6, #7c3aed)'
  )

  const steps = [
    // { title: 'Welcome', description: 'Getting started' }, // TODO: Re-enable in future
    { title: 'Website Analysis', description: 'AI-powered insights' },
    { title: 'Organization Setup', description: 'Create your workspace' },
    // { title: 'LinkedIn Accounts', description: 'Connect outreach accounts' }, // TODO: Re-enable in future
    { title: 'Complete Setup', description: 'Finalize your profile' }
  ]

  const customToast = createCustomToast(toast)

  // Check for LinkedIn connection success on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('linkedin_connected') === 'true') {
      customToast.success({
        title: 'LinkedIn Connected!',
        description: 'Your LinkedIn account has been successfully connected.',
      })
      fetchLinkedInAccounts()
    }
  }, [])

  // Fetch LinkedIn accounts
  const fetchLinkedInAccounts = async () => {
    try {
      const response = await fetch('/api/linkedin/accounts')
      const data = await response.json()

      if (data.success) {
        setLinkedinAccounts(data.accounts)
      }
    } catch (error) {
      console.error('Error fetching LinkedIn accounts:', error)
    }
  }

  // Sync user to Supabase and load LinkedIn accounts on component mount
  useEffect(() => {
    const syncUserAndLoadData = async () => {
      try {
        // Ensure user is synced to Supabase
        await fetch('/api/sync-user', { method: 'POST' })
      } catch (error) {
        console.error('Error syncing user:', error)
      }

      // Load LinkedIn accounts
      fetchLinkedInAccounts()

      // For onboarding, we don't load existing analysis - users should start fresh
      // This ensures they can enter a new website URL and run a new analysis
      console.log('Onboarding: Starting fresh - not loading existing analysis')
    }

    syncUserAndLoadData()
  }, [])



  const handleWebsiteSubmit = async () => {
    if (!websiteUrl) {
      customToast.warning({
        title: 'Website URL Required',
        description: 'Please enter your website URL to continue.',
      })
      return
    }

    // Add protocol if missing
    let urlToAnalyze = websiteUrl.trim()
    if (!urlToAnalyze.startsWith('http://') && !urlToAnalyze.startsWith('https://')) {
      urlToAnalyze = 'https://' + urlToAnalyze
    }

    setIsAnalyzing(true)
    setAnalysisError(null)
    setIcpAnalysis(null)

    try {
      const response = await fetch('/api/analyze-site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ website_url: urlToAnalyze })
      })

      const data = await response.json()

      if (data.success && data.analysisId) {
        setAnalysisId(data.analysisId)
        setAnalysisProgress(10)

        // Start polling for results instead of immediately moving to next step
        let pollCount = 0
        const maxPolls = 60 // 3 minutes timeout

        const pollForResults = async () => {
          try {
            pollCount++

            if (pollCount > maxPolls) {
              console.log('Onboarding polling timeout reached')
              setIsAnalyzing(false)
              setAnalysisError('Analysis timeout. Please try again.')
              customToast.error({
                title: 'Analysis Timeout',
                description: 'Analysis took too long. Please try again.',
              })
              return
            }

            const resultResponse = await fetch(`/api/analyze-site?id=${data.analysisId}`)
            if (resultResponse.ok) {
              const resultData = await resultResponse.json()

              console.log('=== ONBOARDING POLLING DEBUG ===')
              console.log('Result data:', resultData)
              console.log('Analysis status:', resultData.analysis?.status)
              console.log('===============================')

              if (resultData.success && resultData.analysis) {
                const status = resultData.analysis.status

                if (status === 'completed') {
                  setIcpAnalysis(resultData.analysis)
                  setIsAnalyzing(false)
                  setAnalysisProgress(100)
                } else if (status === 'failed') {
                  throw new Error('Analysis failed')
                } else if (status === 'analyzing') {
                  setAnalysisProgress(prev => Math.min(prev + 2, 90))
                  setTimeout(pollForResults, 2000)
                } else {
                  // Still processing, continue polling
                  setTimeout(pollForResults, 2000)
                }
              } else {
                setTimeout(pollForResults, 2000)
              }
            } else {
              throw new Error('Failed to fetch analysis results')
            }
          } catch (error) {
            console.error('Error polling for results:', error)
            setIsAnalyzing(false)
            setAnalysisError('Failed to complete analysis')
            customToast.error({
              title: 'Analysis Error',
              description: error instanceof Error ? error.message : 'Failed to complete analysis',
            })
          }
        }

        // Start polling
        setTimeout(pollForResults, 1000)
      } else {
        throw new Error(data.error || 'Analysis failed')
      }
    } catch (error) {
      console.error('Error starting analysis:', error)
      setIsAnalyzing(false)
      setAnalysisError('Failed to start analysis')
      customToast.error({
        title: 'Analysis Failed',
        description: 'Unable to start website analysis. Please try again.',
      })
    }
  }

  const handleConnectLinkedIn = () => {
    setIsLoadingLinkedIn(true)
    window.location.href = '/api/linkedin/auth'
  }

  const handleDisconnectLinkedIn = async (accountId: string) => {
    try {
      const response = await fetch(`/api/linkedin/accounts?id=${accountId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        customToast.success({
          title: 'Account Disconnected',
          description: data.message,
        })
        fetchLinkedInAccounts()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error disconnecting LinkedIn:', error)
      customToast.error({
        title: 'Disconnection Failed',
        description: 'Unable to disconnect LinkedIn account. Please try again.',
      })
    }
  }

  const handleSkipStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleFinishOnboarding()
    }
  }



  const handleFinishOnboarding = async () => {
    try {
      // Ensure user is synced to Supabase first
      await fetch('/api/sync-user', { method: 'POST' })

      // Mark onboarding as completed - SET BOTH FIELDS to prevent redirect loop
      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          website_url: websiteUrl,
          site_summary: icpAnalysis?.core_offer || '',
          icp: icpAnalysis || {},
          completed: true, // Dashboard checks this field
          onboarding_completed: true, // Middleware checks this field
          onboarding_step_completed: {
            website_analysis: !!icpAnalysis,
            linkedin_connected: linkedinAccounts.length > 0,
            completed_at: new Date().toISOString()
          }
        })
      })

      if (response.ok) {
        // Small delay to ensure database update propagates
        setTimeout(() => {
          router.push('/dashboard')
        }, 500)
      } else {
        throw new Error('Failed to save onboarding completion')
      }
    } catch (error) {
      console.error('Error completing onboarding:', error)
      // Still redirect to dashboard even if profile update fails
      setTimeout(() => {
        router.push('/dashboard')
      }, 500)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      // TODO: Re-enable Welcome step when needed
      // case 0:
      //   return (
      //     <VStack spacing={8} w="full">
      //       <Card
      //         bg={cardBg}
      //         backdropFilter="blur(10px)"
      //         border="1px solid"
      //         borderColor={borderColor}
      //         shadow="xl"
      //         borderRadius="2xl"
      //         overflow="hidden"
      //         animation={`${glow} 4s ease-in-out infinite`}
      //         w="full"
      //         maxW="4xl"
      //       >
      //         <CardHeader textAlign="center" pb={4}>
      //           <Heading size="lg" bgGradient={accentGradient} bgClip="text" mb={2}>
      //             Welcome to Observe.ai
      //           </Heading>
      //           <Text fontSize="lg" color="gray.600" lineHeight="tall">
      //             Transform your sales process with AI-powered lead generation and automated outreach
      //           </Text>
      //         </CardHeader>
      //         <CardBody px={8} py={6}>
      //           <VStack spacing={6}>
      //             <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
      //               <Card bg={glassBg} p={4} borderRadius="xl" border="1px solid" borderColor={borderColor}>
      //                 <HStack>
      //                   <Icon as={FiTarget} color="purple.500" boxSize={6} />
      //                   <VStack align="start" spacing={1}>
      //                     <Text fontWeight="bold" fontSize="sm">AI Website Analysis</Text>
      //                     <Text fontSize="xs" color="gray.600">Discover your ideal customer profile</Text>
      //                   </VStack>
      //                 </HStack>
      //               </Card>
      //
      //               {/* TODO: Re-enable LinkedIn integration card when step is re-enabled */}
      //               {/* <Card bg={glassBg} p={4} borderRadius="xl" border="1px solid" borderColor={borderColor}>
      //                 <HStack>
      //                   <Icon as={FiLinkedin} color="purple.600" boxSize={6} />
      //                   <VStack align="start" spacing={1}>
      //                     <Text fontWeight="bold" fontSize="sm">LinkedIn Integration</Text>
      //                     <Text fontSize="xs" color="gray.600">Connect accounts for outreach</Text>
      //                   </VStack>
      //                 </HStack>
      //               </Card> */}
      //
      //               <Card bg={glassBg} p={4} borderRadius="xl" border="1px solid" borderColor={borderColor}>
      //                 <HStack>
      //                   <Icon as={FiUsers} color="green.500" boxSize={6} />
      //                   <VStack align="start" spacing={1}>
      //                     <Text fontWeight="bold" fontSize="sm">Smart Lead Discovery</Text>
      //                     <Text fontSize="xs" color="gray.600">Find qualified prospects automatically</Text>
      //                   </VStack>
      //                 </HStack>
      //               </Card>
      //
      //               <Card bg={glassBg} p={4} borderRadius="xl" border="1px solid" borderColor={borderColor}>
      //                 <HStack>
      //                   <Icon as={FiBookOpen} color="purple.500" boxSize={6} />
      //                   <VStack align="start" spacing={1}>
      //                     <Text fontWeight="bold" fontSize="sm">Personalized Outreach</Text>
      //                     <Text fontSize="xs" color="gray.600">AI-crafted messages that convert</Text>
      //                   </VStack>
      //                 </HStack>
      //               </Card>
      //             </SimpleGrid>
      //
      //             <HStack spacing={4} w="full" justify="center">
      //               <GradientButton
      //                 variant="primary"
      //                 size="lg"
      //                 onClick={() => setCurrentStep(1)}
      //                 rightIcon={<ChevronRightIcon />}
      //               >
      //                 Start Setup
      //               </GradientButton>
      //
      //               <Button
      //                 variant="ghost"
      //                 size="lg"
      //                 onClick={handleSkipStep}
      //                 leftIcon={<FiSkipForward />}
      //                 color="gray.500"
      //                 _hover={{ color: 'gray.700' }}
      //               >
      //                 Skip Setup
      //               </Button>
      //             </HStack>
      //           </VStack>
      //         </CardBody>
      //       </Card>
      //     </VStack>
      //   )

      case 0: // Website Analysis (was case 1, now case 0 since Welcome step is skipped)
        return (
          <VStack spacing={8} w="full">
            <Card
              bg={cardBg}
              backdropFilter="blur(10px)"
              border="1px solid"
              borderColor={borderColor}
              shadow="xl"
              borderRadius="2xl"
              overflow="hidden"
              w="full"
              maxW="4xl"
            >
              <CardHeader textAlign="center">
                <Heading size="lg" bgGradient={accentGradient} bgClip="text" mb={2}>
                  {isAnalyzing ? '🔍 Analyzing Your Website' : '🌐 Website Analysis'}
                </Heading>
                <Text color="gray.600">
                  {isAnalyzing
                    ? 'Our AI is discovering your ideal customer profile...'
                    : 'Help us understand your business better with AI-powered website analysis'
                  }
                </Text>
              </CardHeader>
              <CardBody px={8} py={6}>
                <VStack spacing={6}>
                  {!isAnalyzing && !icpAnalysis && (
                    <>
                      <FormControl>
                        <FormLabel fontWeight="semibold">Website URL</FormLabel>
                        <Input
                          placeholder="https://www.yourcompany.com"
                          value={websiteUrl}
                          onChange={(e) => setWebsiteUrl(e.target.value)}
                          size="lg"
                          borderColor="gray.300"
                          _focus={{ borderColor: 'purple.400', boxShadow: '0 0 0 1px #9F7AEA' }}
                        />
                      </FormControl>

                      <Box w="full" bg={useColorModeValue('purple.50', 'purple.900')} p={4} borderRadius="xl" border="1px" borderColor={useColorModeValue('purple.200', 'purple.700')}>
                        <Heading size="sm" color={useColorModeValue('purple.700', 'purple.300')} mb={3}>
                          What our AI will discover:
                        </Heading>
                        <SimpleGrid columns={{ base: 1, sm: 2 }} gap={2}>
                          {[
                            'Core offering & value proposition',
                            'Target customer personas',
                            'Industry positioning',
                            'Competitive advantages',
                            'Case studies & social proof',
                            'Lead generation opportunities'
                          ].map((item, index) => (
                            <HStack key={index}>
                              <CheckCircleIcon color="green.500" boxSize={4} />
                              <Text fontSize="sm">{item}</Text>
                            </HStack>
                          ))}
                        </SimpleGrid>
                      </Box>

                      <HStack spacing={4} w="full" justify="center">
                        <GradientButton
                          variant="primary"
                          size="lg"
                          onClick={handleWebsiteSubmit}
                          rightIcon={<FiArrowRight />}
                        >
                          Analyze Website
                        </GradientButton>

                        <Button
                          variant="ghost"
                          size="lg"
                          onClick={handleSkipStep}
                          leftIcon={<FiSkipForward />}
                          color="gray.500"
                          _hover={{ color: 'gray.700' }}
                        >
                          Skip Analysis
                        </Button>
                      </HStack>
                    </>
                  )}

                  {isAnalyzing && (
                    <VStack spacing={6} w="full">
                      <Box w="full">
                        <Flex justify="space-between" mb={2}>
                          <Text fontSize="sm" fontWeight="medium">Analysis Progress</Text>
                          <Text fontSize="sm" color="gray.600">{analysisProgress}%</Text>
                        </Flex>
                        <Progress
                          value={analysisProgress}
                          colorScheme="purple"
                          bg="gray.100"
                          borderRadius="full"
                          size="lg"
                        />
                      </Box>

                      <VStack spacing={4} w="full" align="stretch">
                        {[
                          { threshold: 0, text: 'Discovering website pages...', icon: Spinner },
                          { threshold: 30, text: 'Extracting content from pages', icon: analysisProgress > 30 ? CheckCircleIcon : TimeIcon },
                          { threshold: 60, text: 'AI analyzing business intelligence', icon: analysisProgress > 60 ? CheckCircleIcon : TimeIcon },
                          { threshold: 90, text: 'Generating ICP insights', icon: analysisProgress > 90 ? CheckCircleIcon : TimeIcon }
                        ].map((step, index) => (
                          <HStack key={index}>
                            <Icon
                              as={step.icon}
                              color={analysisProgress > step.threshold ? "green.500" : "gray.400"}
                              {...(step.icon === Spinner && { spin: true })}
                            />
                            <Text color={analysisProgress > step.threshold ? "black" : "gray.500"}>
                              {step.text}
                            </Text>
                          </HStack>
                        ))}
                      </VStack>

                      <Alert status="info" borderRadius="xl">
                        <AlertIcon />
                        <Box>
                          <AlertTitle>Hang tight!</AlertTitle>
                          <AlertDescription>
                            This usually takes 1-2 minutes. We're scanning multiple pages to extract detailed insights.
                          </AlertDescription>
                        </Box>
                      </Alert>
                    </VStack>
                  )}

                  {icpAnalysis && (
                    <VStack spacing={6} w="full">
                      <Alert status="success" borderRadius="xl">
                        <AlertIcon />
                        <Box>
                          <AlertTitle>Analysis Complete! ✅</AlertTitle>
                          <AlertDescription>
                            We've successfully analyzed your website and identified your ideal customer profile.
                          </AlertDescription>
                        </Box>
                      </Alert>

                      <Card bg={glassBg} p={6} borderRadius="xl" w="full">
                        <AnalysisDisplay
                          analysis={icpAnalysis}
                          showHeader={false}
                          compact={true}
                        />
                      </Card>

                      <HStack spacing={4} w="full" justify="center">
                        <GradientButton
                          variant="primary"
                          size="lg"
                          onClick={() => setCurrentStep(1)} // Organization Setup
                          rightIcon={<ChevronRightIcon />}
                        >
                          Continue Setup
                        </GradientButton>

                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() => {
                            setIcpAnalysis(null)
                            setWebsiteUrl('')
                            setAnalysisError(null)
                            setAnalysisProgress(0)
                          }}
                          leftIcon={<FiArrowRight />}
                          colorScheme="purple"
                        >
                          Run New Analysis
                        </Button>
                      </HStack>
                    </VStack>
                  )}

                  {analysisError && (
                    <Alert status="error" borderRadius="xl">
                      <AlertIcon />
                      <Box>
                        <AlertTitle>Analysis Failed</AlertTitle>
                        <AlertDescription>{analysisError}</AlertDescription>
                      </Box>
                    </Alert>
                  )}
                </VStack>
              </CardBody>
            </Card>
          </VStack>
                  )



      case 1: // Organization Setup
        return (
          <VStack spacing={8} w="full">
            <Card
              bg={cardBg}
              backdropFilter="blur(10px)"
              border="1px solid"
              borderColor={borderColor}
              shadow="xl"
              borderRadius="2xl"
              overflow="hidden"
              w="full"
              maxW="4xl"
            >
              <CardHeader textAlign="center">
                <Heading size="lg" bgGradient={accentGradient} bgClip="text" mb={2}>
                  🏢 Organization Setup
                </Heading>
                <Text color="gray.600">
                  {organization ? 'Great! Your organization is ready' : 'Create your team workspace for collaboration'}
                </Text>
              </CardHeader>
              <CardBody px={8} py={6}>
                <VStack spacing={6}>
                  {!organization ? (
                    <>
                      {/* Benefits Section */}
                      <Box w="full" bg="purple.50" p={4} borderRadius="xl" border="1px" borderColor="purple.200">
                        <Heading size="sm" color="purple.700" mb={3}>
                          Why create an organization?
                        </Heading>
                        <SimpleGrid columns={{ base: 1, sm: 2 }} gap={2}>
                          {[
                            'Team collaboration & sharing',
                            'Centralized campaign management',
                            'Role-based permissions',
                            'Shared lead databases',
                            'Team performance analytics',
                            'Invite team members easily'
                          ].map((item, index) => (
                            <HStack key={index}>
                              <CheckCircleIcon color="green.500" boxSize={4} />
                              <Text fontSize="sm">{item}</Text>
                            </HStack>
                          ))}
                        </SimpleGrid>
                      </Box>

                      {/* Organization Form - Seamlessly Integrated */}
                      <Flex justify="center" w="full">
                        <Box w="full" maxW="md" mx="auto">
                          <CreateOrganization
                            afterCreateOrganizationUrl="/onboarding?step=2"
                            appearance={{
                              elements: {
                                card: {
                                  boxShadow: 'none',
                                  border: 'none',
                                  background: 'transparent',
                                  padding: '16px',
                                  margin: '0 auto',
                                  width: '100%',
                                  maxWidth: '420px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center'
                                },
                                headerTitle: {
                                  display: 'none'
                                },
                                headerSubtitle: {
                                  display: 'none'
                                },
                                formFieldRow: {
                                  marginBottom: '12px',
                                  width: '100%'
                                },
                                formField: {
                                  marginBottom: '12px',
                                  width: '100%'
                                },
                                formFieldInput: {
                                  padding: '12px 16px',
                                  margin: '4px 0',
                                  width: '100%',
                                  maxWidth: '100%',
                                  fontSize: '16px',
                                  borderRadius: '8px',
                                  border: '2px solid #E2E8F0',
                                  background: '#FFFFFF',
                                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                                  '&:focus': {
                                    borderColor: '#667eea',
                                    boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)'
                                  }
                                },
                                formFieldLabel: {
                                  fontSize: '14px',
                                  fontWeight: '600',
                                  color: '#2D3748',
                                  marginBottom: '4px',
                                  display: 'block'
                                },
                                formButtonPrimary: {
                                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                  borderRadius: '12px',
                                  border: 'none',
                                  padding: '14px 24px',
                                  fontSize: '16px',
                                  fontWeight: '600',
                                  width: '100%',
                                  marginTop: '16px',
                                  transition: 'all 0.3s ease',
                                  '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)'
                                  }
                                },
                                footer: {
                                  marginTop: '12px',
                                  textAlign: 'center',
                                  padding: '0',
                                  display: 'none'
                                },
                                footerActionLink: {
                                  display: 'none'
                                },
                                fileDropAreaBox: {
                                  marginBottom: '12px'
                                },
                                fileDropAreaButtonPrimary: {
                                  padding: '8px 12px',
                                  fontSize: '14px'
                                }
                              },
                              variables: {
                                colorPrimary: '#667eea',
                                colorText: '#2D3748',
                                colorTextSecondary: '#718096',
                                colorBackground: 'transparent',
                                colorInputBackground: '#FFFFFF',
                                colorInputText: '#2D3748',
                                borderRadius: '8px',
                                fontFamily: '"Inter", "system-ui", "sans-serif"',
                                spacingUnit: '0.75rem'
                              }
                            }}
                          />
                        </Box>
                      </Flex>

                      {/* Skip Option */} {/* REMOVED: causing issue when skipped*/}
                      {/* <Box textAlign="center" mt={4}>
                        <Text fontSize="sm" color="gray.600" mb={3}>
                          You can create an organization later from your dashboard
                        </Text>
                        <Button
                          variant="ghost"
                          size="lg"
                          onClick={() => setCurrentStep(3)} // Skip LinkedIn step, go directly to Complete Setup
                          leftIcon={<FiSkipForward />}
                          color="gray.500"
                          _hover={{
                            color: 'gray.700',
                            bg: 'gray.50'
                          }}
                          borderRadius="xl"
                          px={6}
                        >
                          Skip for now
                        </Button>
                      </Box> */}
                    </>
                  ) : (
                    <VStack spacing={6} w="full">
                      <Alert status="success" borderRadius="xl">
                        <AlertIcon />
                        <Box>
                          <AlertTitle>Organization Ready! ✅</AlertTitle>
                          <AlertDescription>
                            "{organization?.name}" is set up and ready for team collaboration.
                          </AlertDescription>
                        </Box>
                      </Alert>

                      <Card bg={glassBg} p={6} borderRadius="xl" w="full">
                        <VStack spacing={4}>
                          <HStack spacing={4}>
                            <Avatar
                              src={organization?.imageUrl}
                              name={organization?.name}
                              size="lg"
                              icon={<HiOutlineOfficeBuilding />}
                            />
                            <VStack align="start" spacing={1}>
                              <Text fontSize="xl" fontWeight="bold">{organization?.name}</Text>
                              <Text fontSize="sm" color="gray.600">
                                {organization?.membersCount} member{organization?.membersCount !== 1 ? 's' : ''}
                              </Text>
                              <Badge colorScheme="green">Active</Badge>
                            </VStack>
                          </HStack>
                        </VStack>
                      </Card>

                      <GradientButton
                        variant="primary"
                        size="lg"
                        onClick={() => setCurrentStep(2)} // Go to Complete Setup
                        rightIcon={<ChevronRightIcon />}
                        w="full"
                      >
                        Continue Setup
                      </GradientButton>
                    </VStack>
                  )}
                </VStack>
              </CardBody>
            </Card>
          </VStack>
        )

      // TODO: Re-enable LinkedIn step in future
      // case 3:
      //   return (
      //     <VStack spacing={8} w="full">
      //       <Card
      //         bg={cardBg}
      //         backdropFilter="blur(10px)"
      //         border="1px solid"
      //         borderColor={borderColor}
      //         shadow="xl"
      //         borderRadius="2xl"
      //         overflow="hidden"
      //         w="full"
      //         maxW="4xl"
      //       >
      //         <CardHeader textAlign="center">
      //           <Heading size="lg" bgGradient={accentGradient} bgClip="text" mb={2}>
      //             Connect LinkedIn Accounts
      //           </Heading>
      //           <Text color="gray.600">
      //             Connect up to 10 LinkedIn accounts for automated outreach campaigns
      //           </Text>
      //         </CardHeader>
      //         <CardBody px={8} py={6}>
      //           <VStack spacing={6}>
      //             {/* Current LinkedIn Accounts */}
      //             {linkedinAccounts.length > 0 && (
      //               <VStack spacing={4} w="full" align="stretch">
      //                 <Text fontWeight="semibold" color="gray.700">
      //                   Connected Accounts ({linkedinAccounts.length}/10)
      //                 </Text>
      //
      //                 {linkedinAccounts.map((account) => (
      //                   <Card key={account.id} bg={glassBg} p={4} borderRadius="xl">
      //                     <HStack spacing={4} w="full">
      //                       <Avatar
      //                         src={account.profile_picture_url}
      //                         name={account.display_name}
      //                         size="md"
      //                       />
      //                       <VStack align="start" spacing={1} flex={1}>
      //                         <Text fontWeight="bold" fontSize="sm">
      //                           {account.display_name}
      //                         </Text>
      //                         {account.headline && (
      //                           <Text fontSize="xs" color="gray.600" noOfLines={1}>
      //                             {account.headline}
      //                           </Text>
      //                         )}
      //                         <HStack spacing={2}>
      //                           <Badge size="sm" colorScheme="green">Connected</Badge>
      //                           {account.industry && (
      //                             <Badge size="sm" variant="outline">{account.industry}</Badge>
      //                           )}
      //                         </HStack>
      //                       </VStack>
      //                       <Tooltip label="Disconnect Account">
      //                         <IconButton
      //                           aria-label="Disconnect"
      //                           icon={<DeleteIcon />}
      //                           size="sm"
      //                           variant="ghost"
      //                           colorScheme="red"
      //                           onClick={() => handleDisconnectLinkedIn(account.id)}
      //                         />
      //                       </Tooltip>
      //                     </HStack>
      //                   </Card>
      //                 ))}
      //               </VStack>
      //             )}

      //             {/* Add New Account */}
      //             {linkedinAccounts.length < 10 && (
      //               <Card
      //                 bg={glassBg}
      //                 p={6}
      //                 borderRadius="xl"
      //                 border="2px dashed"
      //                 borderColor={useColorModeValue('purple.200', 'purple.700')}
      //                 w="full"
      //                 cursor="pointer"
      //                 onClick={handleConnectLinkedIn}
      //                 _hover={{ borderColor: useColorModeValue('purple.400', 'purple.500'), transform: 'translateY(-2px)' }}
      //                 transition="all 0.2s"
      //               >
      //                 <VStack spacing={4}>
      //                   <Icon as={FiLinkedin} boxSize={12} color={useColorModeValue('purple.600', 'purple.400')} />
      //                   <VStack spacing={2}>
      //                     <Text fontWeight="bold" textAlign="center">
      //                       Connect LinkedIn Account
      //                     </Text>
      //                     <Text fontSize="sm" color="gray.600" textAlign="center">
      //                       Add another LinkedIn account for outreach diversity and higher sending limits
      //                     </Text>
      //                   </VStack>
      //
      //                   <GradientButton
      //                     variant="primary"
      //                     size="md"
      //                     isLoading={isLoadingLinkedIn}
      //                     loadingText="Connecting..."
      //                     leftIcon={<FiLinkedin />}
      //                   >
      //                     Connect Account
      //                   </GradientButton>
      //                 </VStack>
      //               </Card>
      //             )}

      //             {linkedinAccounts.length >= 10 && (
      //               <Alert status="info" borderRadius="xl">
      //                 <AlertIcon />
      //                 <Box>
      //                   <AlertTitle>Maximum Accounts Reached</AlertTitle>
      //                   <AlertDescription>
      //                     You've connected the maximum of 10 LinkedIn accounts. This provides excellent sending capacity!
      //                   </AlertDescription>
      //                 </Box>
      //               </Alert>
      //             )}

      //             {/* Benefits */}
      //             <Box w="full" bg={useColorModeValue('purple.50', 'purple.900')} p={4} borderRadius="xl" border="1px" borderColor={useColorModeValue('purple.200', 'purple.700')}>
      //               <Text fontWeight="semibold" color={useColorModeValue('purple.700', 'purple.300')} mb={3}>
      //                 Why connect multiple accounts?
      //               </Text>
      //               <VStack spacing={2} align="start">
      //                 {[
      //                   'Higher daily sending limits (100+ connections per account)',
      //                   'Reduced risk of account restrictions',
      //                   'Better deliverability and response rates',
      //                   'Ability to A/B test different messaging strategies'
      //                 ].map((benefit, index) => (
      //                   <HStack key={index}>
      //                     <CheckCircleIcon color="green.500" boxSize={4} />
      //                     <Text fontSize="sm">{benefit}</Text>
      //                   </HStack>
      //                 ))}
      //               </VStack>
      //             </Box>

      //             <HStack spacing={4} w="full" justify="center">
      //               <GradientButton
      //                 variant="primary"
      //                 size="lg"
      //                 onClick={() => setCurrentStep(4)}
      //                 rightIcon={<ChevronRightIcon />}
      //               >
      //                 {linkedinAccounts.length > 0 ? 'Continue' : 'Continue Without LinkedIn'}
      //               </GradientButton>
      //
      //               <Button
      //                 variant="ghost"
      //                 size="lg"
      //                 onClick={handleSkipStep}
      //                 leftIcon={<FiSkipForward />}
      //                 color="gray.500"
      //                 _hover={{ color: 'gray.700' }}
      //               >
      //                 Skip for Now
      //               </Button>
      //             </HStack>
      //           </VStack>
      //         </CardBody>
      //       </Card>
      //     </VStack>
      //   )

      case 2: // Complete Setup
        return (
          <VStack spacing={8} w="full">
            <Card
              bg={cardBg}
              backdropFilter="blur(10px)"
              border="1px solid"
              borderColor={borderColor}
              shadow="xl"
              borderRadius="2xl"
              overflow="hidden"
              w="full"
              maxW="4xl"
              animation={`${glow} 4s ease-in-out infinite`}
            >
              <CardHeader textAlign="center">
                <Heading size="lg" bgGradient={accentGradient} bgClip="text" mb={2}>
                  Setup Complete!
                </Heading>
                <Text fontSize="lg" color="gray.600">
                  You're all set to start generating high-quality leads with AI
                </Text>
              </CardHeader>
              <CardBody px={8} py={6}>
                <VStack spacing={6}>
                  {/* Setup Summary */}
                  <VStack spacing={4} w="full" align="stretch">
                    <Text fontWeight="semibold" color="gray.700">
                      Your Setup Summary:
                    </Text>

                    <SimpleGrid columns={1} spacing={3}>
                      <HStack>
                        <Icon as={icpAnalysis ? FiCheck : FiTarget} color={icpAnalysis ? "green.500" : "gray.400"} />
                        <Text>
                          Website Analysis: {icpAnalysis ? '✅ Complete' : '⏭️ Skipped'}
                        </Text>
                      </HStack>

                      <HStack>
                        <Icon as={organization ? FiCheck : HiOutlineOfficeBuilding} color={organization ? "green.500" : "gray.400"} />
                        <Text>
                          Organization: {organization ? `✅ ${organization.name}` : '⏭️ Personal Account'}
                        </Text>
                      </HStack>

                      {/* TODO: Re-enable LinkedIn accounts summary when step is re-enabled */}
                      {/* <HStack>
                        <Icon as={linkedinAccounts.length > 0 ? FiCheck : FiLinkedin} color={linkedinAccounts.length > 0 ? "green.500" : "gray.400"} />
                        <Text>
                          LinkedIn Accounts: {linkedinAccounts.length > 0 ? `✅ ${linkedinAccounts.length} connected` : '⏭️ None connected'}
                        </Text>
                      </HStack> */}
                    </SimpleGrid>
                  </VStack>

                  {/* Next Steps */}
                  <Box w="full" bg="purple.50" p={4} borderRadius="xl" border="1px" borderColor="purple.200">
                    <Text fontWeight="semibold" color="purple.700" mb={3}>
                      What's next?
                    </Text>
                    <VStack spacing={2} align="start">
                      {[
                        'Explore your dashboard to see available features',
                        'Create your first lead generation campaign',
                        'Set up automated outreach sequences',
                        'Monitor your campaign performance and results'
                      ].map((step, index) => (
                        <HStack key={index}>
                          <Badge colorScheme="purple" rounded="full" w={6} h={6} display="flex" alignItems="center" justifyContent="center">
                            {index + 1}
                          </Badge>
                          <Text fontSize="sm">{step}</Text>
                        </HStack>
                      ))}
                    </VStack>
                  </Box>

                  <GradientButton
                    variant="primary"
                    size="xl"
                    onClick={handleFinishOnboarding}
                    rightIcon={<FiArrowRight />}
                    w="full"
                    animation={`${pulse} 2s ease-in-out infinite`}
                  >
                    Launch Dashboard
                  </GradientButton>
                </VStack>
              </CardBody>
            </Card>
          </VStack>
        )

      default:
        return null
    }
  }

  return (
    <Box
      minH="100vh"
      bg={gradientBg}
      position="relative"
      overflow="hidden"
    >
      {/* Animated background elements */}
      <Box
        position="absolute"
        top="10%"
        right="10%"
        w="300px"
        h="300px"
        borderRadius="50%"
        bg={accentGradient}
        opacity={0.1}
        animation={`${float} 6s ease-in-out infinite`}
        zIndex={0}
      />
      <Box
        position="absolute"
        bottom="20%"
        left="5%"
        w="200px"
        h="200px"
        borderRadius="50%"
        bg={accentGradient}
        opacity={0.08}
        animation={`${float} 8s ease-in-out infinite reverse`}
        zIndex={0}
      />

      <Container maxW="7xl" py={8} position="relative" zIndex={1}>
        <VStack spacing={10} align="stretch">
          {/* Header */}
          <Box textAlign="center">
            <Text
              fontSize="3xl"
              fontWeight="bold"
              mb={2}
              color={useColorModeValue('white', 'gray.100')}
              textShadow="0 2px 4px rgba(0,0,0,0.3)"
            >

            </Text>
            <Text
              fontSize="lg"
              color={useColorModeValue('whiteAlpha.900', 'gray.200')}
              maxW="3xl"
              mx="auto"
              textShadow="0 1px 2px rgba(0,0,0,0.2)"
            >
              Let's set up your account to start generating qualified leads automatically
            </Text>
          </Box>

          {/* Progress Stepper */}
          <Enhanced3DStepper
            currentStep={currentStep}
            steps={steps}
            variant="detailed"
            colorScheme="purple"
            showProgress={true}
            animated={true}
          />

          {/* Current Step Content */}
          <Flex justify="center" w="full">
            {renderStep()}
          </Flex>
        </VStack>
      </Container>
    </Box>
  )
}