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
  Select,
  Input,
  Textarea,
  Switch,
  FormLabel,
  Heading,
  Badge,
  Button,
  useColorModeValue,
  Divider,
  SimpleGrid,
  RadioGroup,
  Radio,
  Checkbox,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  useToast,
  Flex,
  IconButton,
  Tooltip,
  Collapse
} from '@chakra-ui/react'
import { keyframes } from '@emotion/react'
import { CampaignStepper } from '@/components/ui/CampaignStepper'
import { GradientButton } from '@/components/ui/GradientButton'
import { useRouter } from 'next/navigation'
import { FiGlobe, FiUser, FiTarget, FiSettings, FiEye, FiPlus, FiTrash2, FiEdit3, FiMessageCircle, FiLinkedin, FiMail } from 'react-icons/fi'
import { createCustomToast, commonToasts } from '@/lib/utils/custom-toast'
import { generateSampleMessages } from '@/lib/message-generation-service'
import type { GenerateMessagesResponse } from '@/lib/message-generation-service'
import { LinkedInMessageFrame } from '@/components/ui/LinkedInMessageFrame'
import { EmailMessageFrame } from '@/components/ui/EmailMessageFrame'
import { SampleMessagesCarousel } from '@/components/ui/SampleMessagesCarousel'

interface PitchData {
  websiteUrl: string
  websiteAnalysis: unknown
  offeringDescription: string
  painPoints: Array<{ id: string; title: string; description: string }>
  proofPoints: Array<{ id: string; title: string; description: string }>
  coachingPoints: Array<{ id: string; instruction: string; editable: boolean }>
  emailCoachingPoints: Array<{ id: string; instruction: string; editable: boolean }>
}

// Define animations
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

export default function OutreachPage() {
  const router = useRouter()
  const toast = useToast()
  const customToast = createCustomToast(toast)

  // Enhanced color mode values with 3D styling
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

  // State for outreach settings
  const [campaignLanguage, setCampaignLanguage] = useState('English (United States)')
  const [signOffs, setSignOffs] = useState(['Best', 'Regards', 'Thanks'])
  const [newSignOff, setNewSignOff] = useState('')
  const [toneOfVoice, setToneOfVoice] = useState('Professional')
  const [callsToAction, setCallsToAction] = useState([
    'Curious about ways to boost your lead generation?',
    'Interested in tools to help you get more leads?',
    'I can record a quick custom video to show what we offer. Are you the right person to send it to?',
    'Do you mind if I show you some examples of how our system can help generate leads for you?'
  ])
  const [addingCTA, setAddingCTA] = useState(false)
  const [newCTA, setNewCTA] = useState('')
  const [messagePersonalization, setMessagePersonalization] = useState(true)
  const [maxResourceAge, setMaxResourceAge] = useState(4)
  const [personalizationSources, setPersonalizationSources] = useState([
    'Website Scrape',
    'X Posts',
    'LinkedIn Posts',
    'Press Release',
    'Funding Announcement'
  ])

  // Pitch data from previous step
  const [pitchData, setPitchData] = useState<PitchData | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [sampleMessages, setSampleMessages] = useState<GenerateMessagesResponse | null>(null)
  const [carouselData, setCarouselData] = useState<{linkedin: any[], email: any[]} | null>(null)

  // Load pitch data from localStorage OR backend
  useEffect(() => {
    const savedOutreachDataRaw = localStorage.getItem('campaignOutreachData')
    if (savedOutreachDataRaw) {
      try {
        const savedOutreachData = JSON.parse(savedOutreachDataRaw)
        if (savedOutreachData.campaignLanguage) setCampaignLanguage(savedOutreachData.campaignLanguage)
        if (savedOutreachData.signOffs) setSignOffs(savedOutreachData.signOffs)
        if (savedOutreachData.toneOfVoice) setToneOfVoice(savedOutreachData.toneOfVoice)
        if (savedOutreachData.callsToAction) setCallsToAction(savedOutreachData.callsToAction)
        if (typeof savedOutreachData.messagePersonalization === 'boolean') setMessagePersonalization(savedOutreachData.messagePersonalization)
        if (typeof savedOutreachData.maxResourceAge === 'number') setMaxResourceAge(savedOutreachData.maxResourceAge)
        if (Array.isArray(savedOutreachData.personalizationSources)) setPersonalizationSources(savedOutreachData.personalizationSources)
      } catch (err) {
        console.error('❌ [OUTREACH] Error parsing outreach data:', err)
        localStorage.removeItem('campaignOutreachData')
      }
    }
    const savedPitchData = localStorage.getItem('campaignPitchData')

    if (savedPitchData) {
      try {
        const parsed = JSON.parse(savedPitchData)
        setPitchData(parsed)
      } catch (error) {
        console.error('❌ [OUTREACH] Error parsing localStorage pitch data:', error)
        localStorage.removeItem('campaignPitchData') // Clear corrupted data
      }
    } else {
      // Fetch from backend draft API
      const fetchDraft = async () => {
        try {
          const res = await fetch('/api/campaigns/save-draft')

          if (res.ok) {
            const data = await res.json()

            if (data.success && data.drafts) {
              // If multiple drafts, take the most recent
              const draft = Array.isArray(data.drafts) ? data.drafts[0] : data.drafts

              if (draft && draft.website_analysis) {
                const pd: PitchData = {
                  websiteUrl: draft.website_url || '',
                  websiteAnalysis: draft.website_analysis || null,
                  offeringDescription: draft.offering_description || '',
                  painPoints: draft.pain_points || [],
                  proofPoints: draft.proof_points || [],
                  coachingPoints: draft.coaching_points || [],
                  emailCoachingPoints: draft.email_body_coaching || []
                }
                setPitchData(pd)
                // Cache locally for subsequent steps
                localStorage.setItem('campaignPitchData', JSON.stringify(pd))
              } else {
                console.log('⚠️ [OUTREACH] Draft found but missing website analysis')
              }
            }
          } else {
            console.error('❌ [OUTREACH] Backend fetch failed:', res.status, res.statusText)
          }
        } catch (err) {
          console.error('❌ [OUTREACH] Failed to fetch pitch draft:', err)
        }
      }
      fetchDraft()
    }
  }, [])

  // Languages that can actually be used for outreach campaigns
  const languages = [
    'English',
    'French',
    'German',
    'Spanish',
    'Portuguese',
    'Italian',
    'Dutch'
  ]

  const toneOptions = [
    { value: 'Urgent', description: 'Pressing and immediate, emphasizing the importance of quick action.' },
    { value: 'Professional', description: 'Formal and respectful, maintaining a business-like demeanor.' },
    { value: 'Supportive', description: 'Encouraging and helpful, offering assistance.' },
    { value: 'Sincere', description: 'Genuine and honest, building trust through authenticity.' },
    { value: 'Storytelling', description: 'Engaging and narrative, telling a compelling story.' },
    { value: 'Challenging', description: 'Provocative and thought-provoking, questioning the status quo.' },
    { value: 'Confident', description: 'Assured and self-assured, demonstrating expertise.' },
    { value: 'Friendly', description: 'Warm and approachable, creating a personal connection.' }
  ]

  const addSignOff = () => {
    if (newSignOff.trim() && !signOffs.includes(newSignOff.trim())) {
      setSignOffs([...signOffs, newSignOff.trim()])
      setNewSignOff('')
    }
  }

  const removeSignOff = (signOff: string) => {
    setSignOffs(signOffs.filter(s => s !== signOff))
  }

  const addCTA = () => {
    if (newCTA.trim() && !callsToAction.includes(newCTA.trim())) {
      setCallsToAction([...callsToAction, newCTA.trim()])
      setNewCTA('')
      setAddingCTA(false)
    }
  }

  const removeCTA = (cta: string) => {
    setCallsToAction(callsToAction.filter(c => c !== cta))
  }

  const generateSampleMessage = async () => {
    if (!pitchData) {
      customToast.warning({
        title: 'Missing Pitch Data',
        description: 'Please complete the pitch step first to generate sample messages.',
      })
      return
    }

    if (!(pitchData as any).websiteAnalysis) {
      customToast.warning({
        title: 'Missing Website Analysis',
        description: 'Website analysis is required to generate personalized messages. Please complete the pitch step.',
      })
      return
    }

    setIsGenerating(true)
    try {
      const outreachData = {
        campaignLanguage,
        signOffs,
        toneOfVoice,
        callsToAction,
        messagePersonalization
      }

      const result = await generateSampleMessages((pitchData as any).websiteAnalysis, 3, outreachData)

      if (result.success) {
        setSampleMessages(result)
        // Transform for carousel
        const linked = result.linkedinMessages.map((gm) => ({
          id: gm.id,
          type: 'linkedin',
          senderName: gm.content.sender.name,
          senderRole: gm.content.sender.role,
          senderCompany: gm.content.sender.company,
          senderImage: undefined,
          message: gm.content.message,
          timestamp: 'Just now'
        }))
        const emails = result.emailMessages.map((gm) => ({
          id: gm.id,
          type: 'email',
          senderName: gm.content.sender.name,
          senderEmail: (gm.content.sender as any).email,
          subject: gm.content.subject,
          message: gm.content.message,
          timestamp: 'Just now'
        }))
        setCarouselData({ linkedin: linked, email: emails })
      } else {
        throw new Error(result.error || 'Generation failed')
      }
    } catch (error) {
      console.error('Error generating sample messages:', error)
      customToast.error({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to generate sample messages',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleContinueToWorkflow = () => {
    const outreachData = {
      campaignLanguage,
      signOffs,
      toneOfVoice,
      callsToAction,
      messagePersonalization,
      maxResourceAge,
      personalizationSources
    }

    localStorage.setItem('campaignOutreachData', JSON.stringify(outreachData))
    router.push('/campaigns/new/workflow')
  }

  const handleBackToPitch = () => {
    router.push('/campaigns/new/pitch')
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
        top="-50%"
        left="-50%"
        width="200%"
        height="200%"
        opacity="0.1"
        backgroundImage="radial-gradient(circle at 25% 25%, white 2px, transparent 2px)"
        backgroundSize="50px 50px"
        animation={`${float} 20s ease-in-out infinite`}
      />

      <Container maxW="7xl" py={8} position="relative" zIndex="1">
        <CampaignStepper currentStep={2} />

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
            Outreach Configuration
          </Heading>
          <Text
            fontSize="xl"
            color="whiteAlpha.900"
            fontWeight="500"
            maxW="2xl"
            mx="auto"
            mb={4}
          >
            Configure your messaging settings and personalization options with AI-powered precision
          </Text>

          {/* Pitch Data Status Indicator */}
          <HStack justify="center" spacing={2}>
            <Box
              w={3}
              h={3}
              borderRadius="full"
              bg={pitchData && (pitchData as any).websiteAnalysis ? 'green.400' : 'orange.400'}
              animation={!pitchData ? `${pulse} 2s infinite` : undefined}
            />
            <Text
              fontSize="sm"
              color="whiteAlpha.800"
              fontWeight="500"
            >
              {pitchData && (pitchData as any).websiteAnalysis
                ? `✅ Analysis ready for ${(pitchData as any).websiteUrl || 'website'} • ${(pitchData as any).websiteAnalysis?.target_personas?.length || 0} personas`
                : pitchData
                  ? '⚠️ Missing website analysis data'
                  : '🔄 Loading pitch data...'}
            </Text>
          </HStack>
        </Box>

        <VStack spacing={8} align="stretch">
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
              <HStack spacing={3}>
                <Box
                  p={3}
                  borderRadius="xl"
                  bg={accentGradient}
                  color="white"
                  boxShadow="0 8px 20px rgba(102, 126, 234, 0.4)"
                >
                  <FiGlobe size="20" />
                </Box>
                <VStack align="start" spacing={0}>
                  <Heading size="md" color="gray.800">Campaign Language</Heading>
                  <Text fontSize="sm" color="gray.600">Choose your preferred communication language</Text>
                </VStack>
              </HStack>
            </CardHeader>
            <CardBody pt={0}>
              <Select
                value={campaignLanguage}
                onChange={(e) => setCampaignLanguage(e.target.value)}
                size="lg"
                borderRadius="xl"
                border="2px solid"
                borderColor="purple.200"
                bg="white"
                _hover={{
                  borderColor: 'purple.400',
                  boxShadow: '0 0 0 1px rgba(139, 92, 246, 0.2)'
                }}
                _focus={{
                  borderColor: 'purple.500',
                  boxShadow: '0 0 0 3px rgba(139, 92, 246, 0.1)'
                }}
              >
                {languages.map((lang) => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </Select>
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
              <HStack spacing={3}>
                <Box
                  p={3}
                  borderRadius="xl"
                  bg={accentGradient}
                  color="white"
                  boxShadow="0 8px 20px rgba(102, 126, 234, 0.4)"
                >
                  <FiEdit3 size="20" />
                </Box>
                <VStack align="start" spacing={0}>
                  <Heading size="md" color="gray.800">Message Sign Offs In {campaignLanguage.split(' ')[0]}</Heading>
                  <Text fontSize="sm" color="gray.600">Customize your message endings</Text>
                </VStack>
              </HStack>
            </CardHeader>
            <CardBody pt={0}>
              <VStack spacing={4} align="stretch">
                <Flex wrap="wrap" gap={3}>
                  {signOffs.map((signOff) => (
                    <Badge
                      key={signOff}
                      px={4}
                      py={2}
                      borderRadius="xl"
                      cursor="pointer"
                      bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                      color="white"
                      fontSize="sm"
                      fontWeight="600"
                      _hover={{
                        transform: 'scale(1.05)',
                        boxShadow: '0 8px 20px rgba(102, 126, 234, 0.4)'
                      }}
                      transition="all 0.2s ease-in-out"
                      onClick={() => removeSignOff(signOff)}
                    >
                      {signOff} ×
                    </Badge>
                  ))}
                </Flex>
                <HStack spacing={3}>
                  <Input
                    placeholder="Add your sign offs here"
                    value={newSignOff}
                    onChange={(e) => setNewSignOff(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addSignOff()}
                    borderRadius="xl"
                    border="2px solid"
                    borderColor="purple.200"
                    bg="white"
                    _hover={{
                      borderColor: 'purple.400',
                      boxShadow: '0 0 0 1px rgba(139, 92, 246, 0.2)'
                    }}
                    _focus={{
                      borderColor: 'purple.500',
                      boxShadow: '0 0 0 3px rgba(139, 92, 246, 0.1)'
                    }}
                  />
                  <Tooltip label="Add new sign-off">
                    <IconButton
                      aria-label="Add sign-off"
                      icon={<FiPlus />}
                      onClick={addSignOff}
                      size="lg"
                      borderRadius="xl"
                      bg={accentGradient}
                      color="white"
                      _hover={{
                        transform: 'scale(1.05)',
                        boxShadow: '0 8px 20px rgba(102, 126, 234, 0.4)'
                      }}
                      transition="all 0.2s ease-in-out"
                    />
                  </Tooltip>
                </HStack>
                <Text fontSize="sm" color="gray.600" fontStyle="italic">
                  Click to remove • Press Enter to add
                </Text>
              </VStack>
            </CardBody>
          </Card>

        {/* Tone of Voice */}
        <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
          <CardHeader>
            <HStack>
              <FiUser />
              <Heading size="md">Tone of Voice</Heading>
            </HStack>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <RadioGroup value={toneOfVoice} onChange={setToneOfVoice}>
                <VStack spacing={4} align="stretch">
                  {toneOptions.map((tone) => (
                    <Box key={tone.value} p={4} border="1px solid" borderColor={borderColor} borderRadius="md">
                      <HStack justify="space-between" align="start">
                        <Radio value={tone.value} size="lg">
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="semibold">{tone.value}</Text>
                            <Text fontSize="sm" color="gray.600">{tone.description}</Text>
                          </VStack>
                        </Radio>
                      </HStack>
                    </Box>
                  ))}
                </VStack>
              </RadioGroup>
            </VStack>
          </CardBody>
        </Card>

        {/* Calls To Action */}
        <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
          <CardHeader>
            <HStack>
              <FiTarget />
              <Heading size="md">Calls To Action</Heading>
            </HStack>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              {callsToAction.map((cta, index) => (
                <HStack key={index} justify="space-between" p={3} bg={grayBg} borderRadius="md">
                  <Checkbox defaultChecked>
                    <Text>{cta}</Text>
                  </Checkbox>
                  <HStack>
                    <Button size="sm" variant="ghost" onClick={() => removeCTA(cta)}>🗑️</Button>
                    <Button size="sm" variant="ghost">✏️</Button>
                  </HStack>
                </HStack>
              ))}

              <Button
                variant="outline"
                colorScheme="blue"
                onClick={() => setAddingCTA(true)}
                leftIcon={<Text>⊕</Text>}
              >
                Add CTA
              </Button>

              {addingCTA && (
                <HStack>
                  <Textarea
                    placeholder="Enter your call-to-action"
                    value={newCTA}
                    onChange={(e) => setNewCTA(e.target.value)}
                    rows={2}
                  />
                  <VStack>
                    <GradientButton variant="secondary" onClick={addCTA}>
                      Add
                    </GradientButton>
                    <Button variant="ghost" onClick={() => {setAddingCTA(false) ,setNewCTA('')}}>
                      Cancel
                    </Button>
                  </VStack>
                </HStack>
              )}
            </VStack>
          </CardBody>
        </Card>

        {/* Message Personalization */}
        <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
          <CardHeader>
            <HStack justify="space-between">
              <HStack>
                <FiSettings />
                <VStack align="start" spacing={0}>
                  <Heading size="md">Message Personalization</Heading>
                  <Badge colorScheme="purple" variant="subtle">Recommended</Badge>
                </VStack>
              </HStack>
              <Switch
                isChecked={messagePersonalization}
                onChange={(e) => setMessagePersonalization(e.target.checked)}
                size="lg"
                colorScheme="purple"
              />
            </HStack>
          </CardHeader>
          <CardBody>
            <Text fontSize="sm" color="gray.600" mb={6}>
              Select the sources you want us to use to personalize your messages. We will automatically
              select the personalization most likely to garner a response from the lead.
            </Text>

            <VStack spacing={6} align="stretch">
              <Box>
                <FormLabel>Select Maximum Resource Age</FormLabel>
                <HStack spacing={4}>
                  <Text fontSize="sm">2</Text>
                  <Slider
                    value={maxResourceAge}
                    onChange={setMaxResourceAge}
                    min={2}
                    max={12}
                    step={1}
                    flex={1}
                  >
                    <SliderTrack>
                      <SliderFilledTrack />
                    </SliderTrack>
                    <SliderThumb />
                  </Slider>
                  <Text fontSize="sm">12</Text>
                  <Text fontWeight="semibold">{maxResourceAge} Months</Text>
                </HStack>
              </Box>

              <Box>
                <FormLabel mb={4}>Personalization Sources</FormLabel>
                <SimpleGrid columns={2} spacing={4}>
                  {[
                    { name: 'Website Scrape', description: 'Analyze the lead\'s website for achievements, goals, product updates, and recent blog posts.' },
                    { name: 'X Posts', description: 'Highlight recent X (formerly Twitter) posts published by your prospects.' },
                    { name: 'LinkedIn Posts', description: 'Feature recent LinkedIn updates shared by your prospects.' },
                    { name: 'Press Release', description: 'Reference recent press releases and announcements.' },
                    { name: 'Funding Announcement', description: 'Mention recent funding rounds and investment news.' }
                  ].map((source) => (
                    <Card key={source.name} variant="outline" p={4}>
                      <VStack align="start" spacing={2}>
                        <HStack>
                          <Checkbox
                            isChecked={personalizationSources.includes(source.name)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setPersonalizationSources([...personalizationSources, source.name])
                              } else {
                                setPersonalizationSources(personalizationSources.filter(s => s !== source.name))
                              }
                            }}
                          />
                          <Text fontWeight="semibold" fontSize="sm">{source.name}</Text>
                        </HStack>
                        <Text fontSize="xs" color="gray.600">{source.description}</Text>
                      </VStack>
                    </Card>
                  ))}
                </SimpleGrid>
              </Box>
            </VStack>
          </CardBody>
        </Card>

        {/* Generate Sample Messages Preview */}
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
            <HStack spacing={3}>
              <Box
                p={3}
                borderRadius="xl"
                bg={accentGradient}
                color="white"
                boxShadow="0 8px 20px rgba(102, 126, 234, 0.4)"
              >
                <FiMessageCircle size="20" />
              </Box>
              <VStack align="start" spacing={0}>
                <Heading size="md" color="gray.800">Sample Messages Preview</Heading>
                <Text fontSize="sm" color="gray.600">Generate personalized LinkedIn and email samples</Text>
              </VStack>
            </HStack>
          </CardHeader>
          <CardBody pt={0}>
            <VStack spacing={4}>
              <Text fontSize="sm" color="gray.600" textAlign="center">
                Preview how your personalized messages will look to prospects based on your current settings.
              </Text>
              <GradientButton
                variant="primary"
                size="lg"
                leftIcon={<FiEye />}
                onClick={generateSampleMessage}
                isLoading={isGenerating}
                loadingText="Generating Messages..."
                minW="240px"
                _hover={{
                  transform: 'scale(1.05)',
                  boxShadow: '0 20px 40px rgba(102, 126, 234, 0.4)'
                }}
                transition="all 0.3s ease"
              >
                {isGenerating ? 'Generating Messages...' : 'Generate Sample Messages'}
              </GradientButton>
              {sampleMessages && (
                <Text fontSize="xs" color="gray.500" textAlign="center">
                  Generated {sampleMessages.totalGenerated} messages • Ready to preview
                </Text>
              )}

              {/* Sample Messages Carousel Display */}
              <Collapse in={!!sampleMessages && !!carouselData} animateOpacity>
                <Box w="full" display="flex" justifyContent="center" pt={4}>
                  {carouselData && (
                    <SampleMessagesCarousel
                      linkedinMessages={carouselData.linkedin}
                      emailMessages={carouselData.email}
                      isLoading={isGenerating}
                      onRegenerateMessages={generateSampleMessage}
                      toneOfVoice={toneOfVoice}
                    />
                  )}
                </Box>
              </Collapse>
            </VStack>
          </CardBody>
        </Card>

        {/* Navigation */}
        <HStack justify="space-between" pt={4}>
          <Button
            onClick={handleBackToPitch}
            size="lg"
            bg="white"
            color="purple.600"
            borderColor="purple.300"
            borderWidth="2px"
            variant="outline"
            _hover={{
              bg: 'purple.50',
              borderColor: 'purple.400',
              transform: 'translateY(-2px)',
              shadow: 'lg',
            }}
            _active={{
              bg: 'purple.100'
            }}
            transition="all 0.3s ease"
            fontWeight="600"
            minW="160px"
          >
            ← Back to Pitch
          </Button>
          <GradientButton
            onClick={handleContinueToWorkflow}
            size="lg"
            _hover={{
              transform: 'translateY(-2px)',
              shadow: 'xl',
            }}
            transition="all 0.3s ease"
            minW="180px"
          >
            Continue to Workflow →
          </GradientButton>
          </HStack>
        </VStack>
      </Container>

    </Box>
  )
}