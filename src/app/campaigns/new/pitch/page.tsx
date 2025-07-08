'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Card,
  CardHeader,
  CardBody,
  VStack,
  HStack,
  Text,
  Input,
  Textarea,
  IconButton,
  Button,
  Badge,
  Heading,
  useColorModeValue,
  useToast,
  Spinner,
  Divider,
  Collapse
} from '@chakra-ui/react'
import { keyframes } from '@emotion/react'
import { FiPlus, FiTrash2, FiRefreshCw, FiChevronDown, FiChevronUp } from 'react-icons/fi'
import { GradientButton } from '@/components/ui/GradientButton'
import { CampaignStepper } from '@/components/ui/CampaignStepper'
import { AnalysisDisplay } from '@/components/AnalysisDisplay'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'

// Enhanced animations
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

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
`

interface PainPoint {
  id: string
  title: string
  description: string
}

interface ProofPoint {
  id: string
  title: string
  description: string
}

interface CoachingPoint {
  id: string
  instruction: string
  editable: boolean
}

interface WebsiteAnalysis {
  summary: string
  valueProposition: string
  features: string[]
  painPoints: PainPoint[]
  proofPoints: ProofPoint[]
}

// ICP Analysis interface for comprehensive analysis data
interface ICPAnalysis {
  core_offer: string
  industry: string
  business_model: string
  icp_summary: string
  target_personas: Array<{
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
  case_studies: Array<{
    title: string
    industry: string
    challenge: string
    solution: string
    results: string[]
    metrics?: string
    client_info?: string
  }>
  lead_magnets: Array<{
    title: string
    type: string
    description: string
    target_audience: string
    call_to_action: string
    url?: string
  }>
  competitive_advantages: string[]
  tech_stack: string[]
  social_proof: {
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

export default function PitchPage() {
  const router = useRouter()
  const toast = useToast()
  const { user } = useUser()

  // Enhanced color mode values with glassmorphism
  const cardBg = useColorModeValue('rgba(255, 255, 255, 0.9)', 'rgba(26, 32, 44, 0.9)')
  const glassBg = useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(26, 32, 44, 0.8)')
  const borderColor = useColorModeValue('rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)')
  const grayBg = useColorModeValue('rgba(247, 250, 252, 0.9)', 'rgba(45, 55, 72, 0.9)')
  const gradientBg = useColorModeValue(
    'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    'linear-gradient(135deg, #4c1d95 0%, #5b21b6 50%, #7c3aed 100%)'
  )
  const accentGradient = useColorModeValue(
    'linear-gradient(45deg, #667eea, #764ba2)',
    'linear-gradient(45deg, #5b21b6, #7c3aed)'
  )

  // Enhanced color values for specific sections
  const yellowBg = useColorModeValue('rgba(255, 235, 59, 0.1)', 'rgba(255, 193, 7, 0.1)')
  const blueBg = useColorModeValue('rgba(33, 150, 243, 0.1)', 'rgba(33, 150, 243, 0.1)')
  const greenBg = useColorModeValue('rgba(76, 175, 80, 0.1)', 'rgba(76, 175, 80, 0.1)')
  const yellowBorderColor = useColorModeValue('rgba(255, 235, 59, 0.3)', 'rgba(255, 193, 7, 0.3)')
  const blueBorderColor = useColorModeValue('rgba(33, 150, 243, 0.3)', 'rgba(33, 150, 243, 0.3)')
  const greenBorderColor = useColorModeValue('rgba(76, 175, 80, 0.3)', 'rgba(76, 175, 80, 0.3)')

  // State management
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [websiteAnalysis, setWebsiteAnalysis] = useState<WebsiteAnalysis | null>(null)
  const [icpAnalysis, setICPAnalysis] = useState<ICPAnalysis | null>(null)
  const [offeringDescription, setOfferingDescription] = useState('')
  const [painPoints, setPainPoints] = useState<PainPoint[]>([])
  const [proofPoints, setProofPoints] = useState<ProofPoint[]>([])
  const [showAnalysisSection, setShowAnalysisSection] = useState(false)
  const [coachingPoints, setCoachingPoints] = useState<CoachingPoint[]>([
    { id: '1', instruction: 'DO NOT ASK ANY QUESTIONS', editable: false },
    { id: '2', instruction: 'start all emails out with "Hello" or "Hi" and say the prospect&apos;s first name.', editable: false },
    { id: '3', instruction: 'mention the name of the lead&apos;s company once per email. Do not implement LLC if it is apart of the company&apos;s name.', editable: false },
    { id: '4', instruction: 'Break the email into multiple paragraphs. NO MORE THAN 3. Always isolate the Call To Action from the other paragraphs.', editable: false },
    { id: '5', instruction: 'Do not come off as assumptive of the prospect&apos;s situation or the problems of their company.', editable: false },
  ])

  // Email coaching functions
  const [emailCoachingPoints, setEmailCoachingPoints] = useState<CoachingPoint[]>([
    { id: 'email-1', instruction: 'Keep subject lines under 50 characters for better open rates', editable: true },
    { id: 'email-2', instruction: 'End with a single, clear call-to-action', editable: true },
  ])

  // Load existing analysis data from user profile
  useEffect(() => {
    const loadExistingAnalysis = async () => {
      if (!user) return

      try {
        const response = await fetch('/api/user/profile')
        if (response.ok) {
          const data = await response.json()
          
          if (data.profile?.icp && typeof data.profile.icp === 'object') {
            setICPAnalysis(data.profile.icp)
            setWebsiteUrl(data.profile.website_url || '')
            setOfferingDescription(data.profile.icp.core_offer || '')
            setShowAnalysisSection(true)
            
            // Extract pain points and proof points from personas if available
            if (data.profile.icp.target_personas && data.profile.icp.target_personas.length > 0) {
              const allPainPoints: PainPoint[] = []
              const allProofPoints: ProofPoint[] = []
              
              data.profile.icp.target_personas.forEach((persona: any, personaIndex: number) => {
                if (persona.pain_points) {
                  persona.pain_points.forEach((point: string, index: number) => {
                    allPainPoints.push({
                      id: `persona-${personaIndex}-pain-${index}`,
                      title: `Pain Point ${allPainPoints.length + 1}`,
                      description: point
                    })
                  })
                }
                
                if (persona.desired_outcomes) {
                  persona.desired_outcomes.forEach((outcome: string, index: number) => {
                    allProofPoints.push({
                      id: `persona-${personaIndex}-outcome-${index}`,
                      title: `Success Outcome ${allProofPoints.length + 1}`,
                      description: outcome
                    })
                  })
                }
              })
              
              if (allPainPoints.length > 0) setPainPoints(allPainPoints)
              if (allProofPoints.length > 0) setProofPoints(allProofPoints)
            }
          }
        }
      } catch (error) {
        console.error('Error loading existing analysis:', error)
      } finally {
        setIsLoadingProfile(false)
      }
    }

    loadExistingAnalysis()
  }, [user])

  const handleAnalyzeWebsite = async () => {
    if (!websiteUrl.trim()) {
      toast({
        title: 'Website URL required',
        description: 'Please enter a website URL to analyze.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    // Add protocol if missing
    let urlToAnalyze = websiteUrl.trim()
    if (!urlToAnalyze.startsWith('http://') && !urlToAnalyze.startsWith('https://')) {
      urlToAnalyze = 'https://' + urlToAnalyze
    }

    setIsAnalyzing(true)
    setWebsiteAnalysis(null)
    setICPAnalysis(null)

    try {
      const response = await fetch('/api/analyze-site', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: urlToAnalyze }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to analyze website')
      }

      const data = await response.json()
      
      if (data.analysisId) {
        // Poll for results
        let pollCount = 0
        const maxPolls = 60 // 2 minutes timeout
        
        const pollForResults = async () => {
          try {
            pollCount++
            
            if (pollCount > maxPolls) {
              console.log('Pitch page polling timeout reached')
              setIsAnalyzing(false)
              toast({
                title: 'Analysis Timeout',
                description: 'Analysis took too long. Please try again.',
                status: 'error',
                duration: 5000,
                isClosable: true,
              })
              return
            }
            const resultResponse = await fetch(`/api/analyze-site?id=${data.analysisId}`)
            if (resultResponse.ok) {
              const resultData = await resultResponse.json()
              
              console.log('=== PITCH PAGE POLLING DEBUG ===')
              console.log('Result data:', resultData)
              console.log('Result data status:', resultData.status)
              console.log('Analysis status:', resultData.analysis?.status)
              console.log('===============================')
              
              if (resultData.success && resultData.analysis && resultData.analysis.status === 'completed') {
                setICPAnalysis(resultData.analysis)
                setOfferingDescription(resultData.analysis.core_offer || '')
                setShowAnalysisSection(true)
                
                // Extract pain points and proof points from personas
                if (resultData.analysis.target_personas && resultData.analysis.target_personas.length > 0) {
                  const allPainPoints: PainPoint[] = []
                  const allProofPoints: ProofPoint[] = []
                  
                  resultData.analysis.target_personas.forEach((persona: any, personaIndex: number) => {
                    if (persona.pain_points) {
                      persona.pain_points.forEach((point: string, index: number) => {
                        allPainPoints.push({
                          id: `persona-${personaIndex}-pain-${index}`,
                          title: `Pain Point ${allPainPoints.length + 1}`,
                          description: point
                        })
                      })
                    }
                    
                    if (persona.desired_outcomes) {
                      persona.desired_outcomes.forEach((outcome: string, index: number) => {
                        allProofPoints.push({
                          id: `persona-${personaIndex}-outcome-${index}`,
                          title: `Success Outcome ${allProofPoints.length + 1}`,
                          description: outcome
                        })
                      })
                    }
                  })
                  
                  setPainPoints(allPainPoints)
                  setProofPoints(allProofPoints)
                }
                
                toast({
                  title: 'Analysis Complete!',
                  description: 'Your website has been analyzed and insights generated.',
                  status: 'success',
                  duration: 5000,
                  isClosable: true,
                  position: 'top-right',
                  variant: 'solid',
                  containerStyle: {
                    background: 'linear-gradient(45deg, #667eea, #764ba2)',
                    color: 'white',
                  }
                })
                
                setIsAnalyzing(false)
              } else if (resultData.analysis && resultData.analysis.status === 'failed') {
                throw new Error('Analysis failed')
              } else {
                // Still processing, continue polling
                setTimeout(pollForResults, 2000)
              }
            } else {
              throw new Error('Failed to fetch analysis results')
            }
          } catch (error) {
            console.error('Error polling for results:', error)
            setIsAnalyzing(false)
            toast({
              title: 'Analysis Error',
              description: error instanceof Error ? error.message : 'Failed to complete analysis',
              status: 'error',
              duration: 5000,
              isClosable: true,
            })
          }
        }
        
        // Start polling
        setTimeout(pollForResults, 1000)
        
        toast({
          title: 'Analysis Started',
          description: 'Analyzing your website... This may take up to 2 minutes.',
          status: 'info',
          duration: 5000,
          isClosable: true,
        })
      } else {
        throw new Error('Failed to start analysis')
      }
    } catch (error) {
      console.error('Error analyzing website:', error)
      setIsAnalyzing(false)
      toast({
        title: 'Analysis Error',
        description: error instanceof Error ? error.message : 'Failed to analyze website',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const addPainPoint = () => {
    const newId = Date.now().toString()
    setPainPoints([...painPoints, {
      id: newId,
      title: '',
      description: ''
    }])
  }

  const updatePainPoint = (id: string, field: 'title' | 'description', value: string) => {
    setPainPoints(painPoints.map(point =>
      point.id === id ? { ...point, [field]: value } : point
    ))
  }

  const removePainPoint = (id: string) => {
    setPainPoints(painPoints.filter(point => point.id !== id))
  }

  const addProofPoint = () => {
    const newId = Date.now().toString()
    setProofPoints([...proofPoints, {
      id: newId,
      title: '',
      description: ''
    }])
  }

  const updateProofPoint = (id: string, field: 'title' | 'description', value: string) => {
    setProofPoints(proofPoints.map(point =>
      point.id === id ? { ...point, [field]: value } : point
    ))
  }

  const removeProofPoint = (id: string) => {
    setProofPoints(proofPoints.filter(point => point.id !== id))
  }

  const addCoachingPoint = () => {
    const newId = Date.now().toString()
    setCoachingPoints([...coachingPoints, {
      id: newId,
      instruction: '',
      editable: true
    }])
  }

  const updateCoachingPoint = (id: string, instruction: string) => {
    setCoachingPoints(coachingPoints.map(point =>
      point.id === id ? { ...point, instruction } : point
    ))
  }

  const removeCoachingPoint = (id: string) => {
    setCoachingPoints(coachingPoints.filter(point => point.id !== id))
  }

  const addEmailCoachingPoint = () => {
    const newId = Date.now().toString()
    setEmailCoachingPoints([...emailCoachingPoints, {
      id: newId,
      instruction: '',
      editable: true
    }])
  }

  const updateEmailCoachingPoint = (id: string, instruction: string) => {
    setEmailCoachingPoints(emailCoachingPoints.map(point =>
      point.id === id ? { ...point, instruction } : point
    ))
  }

  const removeEmailCoachingPoint = (id: string) => {
    setEmailCoachingPoints(emailCoachingPoints.filter(point => point.id !== id))
  }

  const handleContinueToOutreach = () => {
    // Save pitch data to localStorage
    const pitchData = {
      websiteUrl,
      websiteAnalysis,
      offeringDescription,
      painPoints,
      proofPoints,
      coachingPoints,
      emailCoachingPoints
    }
    
    localStorage.setItem('campaignPitchData', JSON.stringify(pitchData))
    
    toast({
      title: 'Pitch Data Saved',
      description: 'Your pitch configuration has been saved.',
      status: 'success',
      duration: 2000,
      isClosable: true,
      position: 'top-right',
      variant: 'solid',
      containerStyle: {
        background: 'linear-gradient(45deg, #667eea, #764ba2)',
        color: 'white',
      }
    })
    
    setTimeout(() => {
      router.push('/campaigns/new/outreach')
    }, 1000)
  }

  const handleSaveDraft = async () => {
    const pitchData = {
      websiteUrl,
      websiteAnalysis,
      offeringDescription,
      painPoints,
      proofPoints,
      coachingPoints,
      emailCoachingPoints
    }
    
    localStorage.setItem('campaignPitchData', JSON.stringify(pitchData))
    
    toast({
      title: 'Draft Saved',
      description: 'Your pitch data has been saved locally.',
      status: 'success',
      duration: 2000,
      isClosable: true,
      position: 'top-right',
      variant: 'solid',
      containerStyle: {
        background: 'linear-gradient(45deg, #667eea, #764ba2)',
        color: 'white',
      }
    })
  }

  const handleBackToTargeting = () => {
    router.push('/campaigns/new/targeting/b2b-filters')
  }

  if (isLoadingProfile) {
    return (
      <Box 
        minH="100vh"
        bg={gradientBg}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <VStack spacing={4}>
          <Spinner size="xl" color="white" />
          <Text color="white" fontSize="lg">Loading your profile...</Text>
        </VStack>
      </Box>
    )
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
        top="8%"
        right="12%"
        w="280px"
        h="280px"
        borderRadius="50%"
        bg={accentGradient}
        opacity={0.1}
        animation={`${float} 8s ease-in-out infinite`}
        zIndex={0}
      />
      <Box
        position="absolute"
        bottom="15%"
        left="8%"
        w="220px"
        h="220px"
        borderRadius="50%"
        bg={accentGradient}
        opacity={0.08}
        animation={`${float} 10s ease-in-out infinite reverse`}
        zIndex={0}
      />

      <Container maxW="7xl" py={8} position="relative" zIndex={1}>
        <VStack spacing={8} align="stretch">
          {/* Header with Campaign Stepper */}
          <Card 
            bg={cardBg}
            backdropFilter="blur(10px)"
            border="1px solid"
            borderColor={borderColor}
            shadow="xl"
            borderRadius="2xl"
            overflow="hidden"
          >
            <CardBody p={6}>
              <CampaignStepper currentStep={1} />
            </CardBody>
          </Card>

          {/* Page Title */}
          <Box textAlign="center" mb={8}>
            <Heading 
              as="h1" 
              size="2xl" 
              mb={4}
              bgGradient="linear(to-r, white, purple.100)"
              bgClip="text"
              fontWeight="800"
              letterSpacing="-0.02em"
              animation={`${glow} 2s ease-in-out infinite`}
            >
              🎨 Create Your Pitch
            </Heading>
            <Text 
              fontSize="xl" 
              color="whiteAlpha.900"
              fontWeight="500"
              maxW="2xl"
              mx="auto"
            >
              Analyze your website and create compelling messaging that converts prospects into customers
            </Text>
          </Box>

          {/* Website Analysis Section */}
          <Card 
            bg={cardBg}
            backdropFilter="blur(10px)"
            border="1px solid"
            borderColor={borderColor}
            shadow="xl"
            borderRadius="2xl"
            overflow="hidden"
            animation={`${glow} 5s ease-in-out infinite`}
          >
            <CardHeader pb={3}>
              <HStack>
                <Badge 
                  colorScheme="blue"
                  px={3}
                  py={1}
                  borderRadius="full"
                >
                  🤖 AI Analysis
                </Badge>
                <Heading size="lg" color="gray.800">
                  Website Analysis
                </Heading>
              </HStack>
            </CardHeader>
            <CardBody pt={0}>
              <VStack spacing={6} align="stretch">
                <HStack>
                  <Input
                    placeholder="Enter your website URL (e.g., yourcompany.com)"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    bg={glassBg}
                    border="1px solid"
                    borderColor={borderColor}
                    _focus={{
                      borderColor: 'purple.400',
                      boxShadow: `0 0 0 1px rgba(102, 126, 234, 0.4)`,
                    }}
                    size="lg"
                  />
                  <GradientButton
                    onClick={handleAnalyzeWebsite}
                    isLoading={isAnalyzing}
                    loadingText="Analyzing..."
                    disabled={!websiteUrl.trim()}
                    size="lg"
                    px={8}
                    leftIcon={<FiRefreshCw />}
                    _hover={{
                      transform: 'translateY(-2px)',
                      shadow: 'xl',
                    }}
                    transition="all 0.3s ease"
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Analyze'}
                  </GradientButton>
                </HStack>

                {isAnalyzing && (
                  <Card 
                    bg={blueBg}
                    border="1px solid"
                    borderColor={blueBorderColor}
                    borderRadius="xl"
                  >
                    <CardBody>
                      <VStack spacing={3}>
                        <HStack>
                          <Spinner size="sm" color="purple.500" />
                          <Text fontWeight="medium">Analyzing your website...</Text>
                        </HStack>
                        <Text fontSize="sm" color="gray.600">
                          This may take up to 2 minutes as we analyze your content, value proposition, and target market.
                        </Text>
                      </VStack>
                    </CardBody>
                  </Card>
                )}
                
                <Collapse in={showAnalysisSection} animateOpacity>
                  {icpAnalysis && (
                    <Card 
                      bg={cardBg}
                      backdropFilter="blur(10px)"
                      border="1px solid"
                      borderColor={borderColor}
                      shadow="xl"
                      borderRadius="2xl"
                      overflow="hidden"
                    >
                      <CardBody>
                        <AnalysisDisplay analysis={icpAnalysis} />
                      </CardBody>
                    </Card>
                  )}
                </Collapse>
              </VStack>
            </CardBody>
          </Card>

          {/* Offering Description */}
          <Card 
            bg={cardBg}
            backdropFilter="blur(10px)"
            border="1px solid"
            borderColor={borderColor}
            shadow="xl"
            borderRadius="2xl"
            overflow="hidden"
          >
            <CardHeader pb={3}>
              <HStack>
                <Badge colorScheme="blue" px={3} py={1} borderRadius="full">
                  📝 Core Offer
                </Badge>
                <Heading size="lg" color="gray.800">
                  Your Value Proposition
                </Heading>
              </HStack>
            </CardHeader>
            <CardBody pt={0}>
              <Textarea
                placeholder="Describe what your company offers and its core value proposition..."
                value={offeringDescription}
                onChange={(e) => setOfferingDescription(e.target.value)}
                bg={glassBg}
                border="1px solid"
                borderColor={borderColor}
                _focus={{
                  borderColor: 'purple.400',
                  boxShadow: `0 0 0 1px rgba(147, 51, 234, 0.4)`,
                }}
                minH="120px"
                size="lg"
              />
            </CardBody>
          </Card>

          {/* Pain Points Section */}
          <Card 
            bg={cardBg}
            backdropFilter="blur(10px)"
            border="1px solid"
            borderColor={borderColor}
            shadow="xl"
            borderRadius="2xl"
            overflow="hidden"
          >
            <CardHeader pb={3}>
              <HStack justify="space-between">
                <HStack>
                  <Badge colorScheme="red" px={3} py={1} borderRadius="full">
                    PAIN POINTS
                  </Badge>
                  <Heading size="lg" color="gray.800">
                    Customer Pain Points
                  </Heading>
                </HStack>
                <IconButton
                  aria-label="Add pain point"
                  icon={<FiPlus />}
                  onClick={addPainPoint}
                  colorScheme="red"
                  variant="ghost"
                  size="sm"
                  _hover={{
                    transform: 'scale(1.05)',
                  }}
                  transition="all 0.2s ease"
                />
              </HStack>
            </CardHeader>
            <CardBody pt={0}>
              <VStack spacing={3} align="stretch">
                {painPoints.map((point, index) => (
                  <Box 
                    key={point.id}
                    p={4}
                    bg={glassBg}
                    border="1px solid"
                    borderColor={borderColor}
                    borderRadius="lg"
                    _hover={{ 
                      borderColor: 'red.300',
                      shadow: 'md' 
                    }}
                    transition="all 0.2s ease"
                  >
                    <VStack spacing={2} align="stretch">
                      <HStack spacing={3}>
                        <Text 
                          fontSize="sm" 
                          fontWeight="bold" 
                          color="red.600"
                          minW="20px"
                        >
                          {index + 1}.
                        </Text>
                        <Input
                          placeholder="Pain point title..."
                          value={point.title}
                          onChange={(e) => updatePainPoint(point.id, 'title', e.target.value)}
                          variant="unstyled"
                          fontWeight="medium"
                          fontSize="sm"
                          _placeholder={{ color: 'gray.400' }}
                        />
                        <IconButton
                          aria-label="Remove pain point"
                          icon={<FiTrash2 />}
                          onClick={() => removePainPoint(point.id)}
                          size="xs"
                          colorScheme="red"
                          variant="ghost"
                          opacity={0.7}
                          _hover={{ opacity: 1 }}
                        />
                      </HStack>
                      <Box pl="32px">
                        <Textarea
                          placeholder="Describe the pain point..."
                          value={point.description}
                          onChange={(e) => updatePainPoint(point.id, 'description', e.target.value)}
                          variant="unstyled"
                          fontSize="sm"
                          resize="none"
                          rows={2}
                          _placeholder={{ color: 'gray.400' }}
                        />
                      </Box>
                    </VStack>
                  </Box>
                ))}
                
                {painPoints.length === 0 && (
                  <Box 
                    p={6} 
                    textAlign="center"
                    border="2px dashed" 
                    borderColor="gray.300"
                    borderRadius="lg"
                    bg="gray.50"
                  >
                    <Text color="gray.500" fontSize="sm">
                      Click the + button to add your first pain point
                    </Text>
                  </Box>
                )}
              </VStack>
            </CardBody>
          </Card>

          {/* Proof Points Section */}
          <Card 
            bg={cardBg}
            backdropFilter="blur(10px)"
            border="1px solid"
            borderColor={borderColor}
            shadow="xl"
            borderRadius="2xl"
            overflow="hidden"
          >
            <CardHeader pb={3}>
              <HStack justify="space-between">
                <HStack>
                  <Badge colorScheme="green" px={3} py={1} borderRadius="full">
                    ✅ PROOF POINTS
                  </Badge>
                  <Heading size="lg" color="gray.800">
                    Success Stories & Proof
                  </Heading>
                </HStack>
                <IconButton
                  aria-label="Add proof point"
                  icon={<FiPlus />}
                  onClick={addProofPoint}
                  colorScheme="green"
                  variant="ghost"
                  size="sm"
                  _hover={{
                    transform: 'scale(1.05)',
                  }}
                  transition="all 0.2s ease"
                />
              </HStack>
            </CardHeader>
            <CardBody pt={0}>
              <VStack spacing={3} align="stretch">
                {proofPoints.map((point, index) => (
                  <Box 
                    key={point.id}
                    p={4}
                    bg={glassBg}
                    border="1px solid"
                    borderColor={borderColor}
                    borderRadius="lg"
                    _hover={{ 
                      borderColor: 'green.300',
                      shadow: 'md' 
                    }}
                    transition="all 0.2s ease"
                  >
                    <VStack spacing={2} align="stretch">
                      <HStack spacing={3}>
                        <Text 
                          fontSize="sm" 
                          fontWeight="bold" 
                          color="green.600"
                          minW="20px"
                        >
                          {index + 1}.
                        </Text>
                        <Input
                          placeholder="Success story title..."
                          value={point.title}
                          onChange={(e) => updateProofPoint(point.id, 'title', e.target.value)}
                          variant="unstyled"
                          fontWeight="medium"
                          fontSize="sm"
                          _placeholder={{ color: 'gray.400' }}
                        />
                        <IconButton
                          aria-label="Remove proof point"
                          icon={<FiTrash2 />}
                          onClick={() => removeProofPoint(point.id)}
                          size="xs"
                          colorScheme="red"
                          variant="ghost"
                          opacity={0.7}
                          _hover={{ opacity: 1 }}
                        />
                      </HStack>
                      <Box pl="32px">
                        <Textarea
                          placeholder="Describe the success story or proof..."
                          value={point.description}
                          onChange={(e) => updateProofPoint(point.id, 'description', e.target.value)}
                          variant="unstyled"
                          fontSize="sm"
                          resize="none"
                          rows={2}
                          _placeholder={{ color: 'gray.400' }}
                        />
                      </Box>
                    </VStack>
                  </Box>
                ))}
                
                {proofPoints.length === 0 && (
                  <Box 
                    p={6} 
                    textAlign="center"
                    border="2px dashed" 
                    borderColor="gray.300"
                    borderRadius="lg"
                    bg="gray.50"
                  >
                    <Text color="gray.500" fontSize="sm">
                      Click the + button to add your first success story
                    </Text>
                  </Box>
                )}
              </VStack>
            </CardBody>
          </Card>

          {/* Navigation Actions */}
          <HStack justify="space-between" align="center">
            <GradientButton
              variant="secondary"
              onClick={handleBackToTargeting}
              leftIcon={<Text>←</Text>}
              _hover={{
                transform: 'translateY(-2px)',
                shadow: 'lg',
              }}
              transition="all 0.3s ease"
            >
              Back to Targeting
            </GradientButton>

            <HStack spacing={4}>
              <Button
                variant="ghost"
                onClick={handleSaveDraft}
                color="purple.500"
                _hover={{ bg: 'purple.50' }}
              >
                Save Draft
              </Button>
              
              <GradientButton
                onClick={handleContinueToOutreach}
                rightIcon={<Text>→</Text>}
                size="lg"
                _hover={{
                  transform: 'translateY(-2px)',
                  shadow: 'xl',
                }}
                transition="all 0.3s ease"
              >
                Continue to Outreach
              </GradientButton>
            </HStack>
          </HStack>
        </VStack>
      </Container>
    </Box>
  )
} 