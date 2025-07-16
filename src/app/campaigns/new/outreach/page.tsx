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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useColorModeValue,
  useDisclosure,
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
  Tooltip
} from '@chakra-ui/react'
import { keyframes } from '@emotion/react'
import { CampaignStepper } from '@/components/ui/CampaignStepper'
import { GradientButton } from '@/components/ui/GradientButton'
import { useRouter } from 'next/navigation'
import { FiGlobe, FiUser, FiTarget, FiSettings, FiEye, FiPlus, FiTrash2, FiEdit3, FiMessageCircle } from 'react-icons/fi'
import { createCustomToast, commonToasts } from '@/lib/utils/custom-toast'

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

export default function OutreachPage() {
  const router = useRouter()
  const toast = useToast()
  const customToast = createCustomToast(toast)
  const { isOpen, onOpen, onClose } = useDisclosure()
  
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
  const [sampleMessage, setSampleMessage] = useState('')

  // Load pitch data from localStorage
  useEffect(() => {
    const savedPitchData = localStorage.getItem('campaignPitchData')
    if (savedPitchData) {
      setPitchData(JSON.parse(savedPitchData))
    }
  }, [])

  const languages = [
    'English (United States)',
    'Finnish',
    'French', 
    'German (Formal)',
    'German (Informal)',
    'Gujarati',
    'Spanish',
    'Portuguese',
    'Italian',
    'Dutch',
    'Russian',
    'Chinese (Simplified)',
    'Japanese',
    'Korean'
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
    }
  }

  const removeCTA = (cta: string) => {
    setCallsToAction(callsToAction.filter(c => c !== cta))
  }

  const generateSampleMessage = async () => {
    if (!pitchData) {
      customToast.warning({
        title: 'No Pitch Data',
        description: 'Please complete the pitch step first.',
      })
      return
    }

    setIsGenerating(true)
    try {
      // Mock sample message generation based on pitch data
      const message = `Hi {{firstName}},

${pitchData.offeringDescription}

${pitchData.painPoints.length > 0 ? `I noticed that ${pitchData.painPoints[0].description.toLowerCase()}. ${pitchData.painPoints[0].title}` : ''}

${pitchData.proofPoints.length > 0 ? pitchData.proofPoints[0].description : ''}

${callsToAction[0]}

${signOffs[0]},
{{senderName}}`

      setSampleMessage(message)
      onOpen()
    } catch (error) {
      console.error('Error generating sample message:', error)
      customToast.error({
        title: 'Generation Failed',
        description: 'Failed to generate sample message. Please try again.',
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
          >
            Configure your messaging settings and personalization options with AI-powered precision
          </Text>
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
                onClick={() => setNewCTA('Add new CTA')}
                leftIcon={<Text>⊕</Text>}
              >
                Add CTA
              </Button>
              
              {newCTA && (
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
                    <Button variant="ghost" onClick={() => setNewCTA('')}>
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

        {/* Generate Sample Message - TODO: Show this later when message is personalized */}
        {/* <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
          <CardBody textAlign="center">
            <GradientButton
              variant="primary"
              size="lg"
              leftIcon={<FiEye />}
              onClick={generateSampleMessage}
              isLoading={isGenerating}
              loadingText="Generating..."
            >
              Generate Sample Message
            </GradientButton>
          </CardBody>
        </Card> */}

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

      {/* Sample Message Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Sample Message Preview</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Box>
                <Text fontWeight="semibold" mb={2}>Message Type</Text>
                <Select defaultValue="First Email">
                                      <option value="First Email">First Email</option>
                    <option value="Follow-up Email">Follow-up Email</option>
                    <option value="LinkedIn Message">LinkedIn Message</option>
                </Select>
              </Box>
              
              <Box>
                <Text fontWeight="semibold" mb={2}>Message</Text>
                <Box p={4} bg={grayBg} borderRadius="md" whiteSpace="pre-line">
                  <Text fontSize="sm">Subject: proposal</Text>
                  <Divider my={2} />
                  <Text>{sampleMessage}</Text>
                </Box>
              </Box>
              
              <Text fontSize="xs" color="gray.600">
                Please note, this message is a representation and actual outputs may vary based on selected personalization.
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
} 