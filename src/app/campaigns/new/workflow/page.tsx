'use client'

import React, { useState, useEffect, useRef } from 'react'
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
  FormLabel,
  Heading,
  Badge,
  IconButton,
  Divider,
  SimpleGrid,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useColorModeValue,
  useToast,
  Flex,
  Tooltip,
  Switch,
  Avatar,
  Progress,
  Circle,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Button,
  Spacer
} from '@chakra-ui/react'
import { keyframes } from '@emotion/react'
import {
  AddIcon,
  DeleteIcon,
  DragHandleIcon,
  ChevronRightIcon,
  CheckIcon,
  TimeIcon,
  EmailIcon,
  ChatIcon
} from '@chakra-ui/icons'
import { CampaignStepper } from '@/components/ui/CampaignStepper'
import { GradientButton } from '@/components/ui/GradientButton'
import { useRouter } from 'next/navigation'
import {
  FiMail,
  FiUser,
  FiClock,
  FiSettings,
  FiPlay,
  FiPause,
  FiEdit3,
  FiTrash2,
  FiPlus,
  FiArrowRight,
  FiMessageCircle,
  FiLinkedin,
  FiTarget,
  FiZap,
  FiEye
} from 'react-icons/fi'
import { createCustomToast, commonToasts } from '@/lib/utils/custom-toast'

// Animations
const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`

const flow = keyframes`
  0% { stroke-dashoffset: 20; }
  100% { stroke-dashoffset: 0; }
`

const glow = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(102, 126, 234, 0.3); }
  50% { box-shadow: 0 0 30px rgba(102, 126, 234, 0.5); }
`

interface WorkflowStep {
  id: string
  channel: 'email' | 'linkedin'
  actionType: 'email' | 'connect' | 'message'
  delay: number
  subject?: string
  template: string
  conditions?: string[]
  isActive?: boolean
  completed?: boolean
}

interface WorkflowTemplate {
  id: string
  name: string
  description: string
  icon: string
  color: string
  steps: WorkflowStep[]
  conversionRate?: string
  responseRate?: string
}

const defaultTemplates: WorkflowTemplate[] = [
  {
    id: 'linkedin-first',
    name: 'LinkedIn First',
    description: 'Start with LinkedIn, then follow up with email',
    icon: '•',
    color: 'linkedin',
    conversionRate: '18%',
    responseRate: '34%',
    steps: [
      {
        id: '1',
        channel: 'linkedin',
        actionType: 'connect',
        delay: 0,
        template: 'Hi {{firstName}}, I noticed your work at {{company}}. Would love to connect and share some insights about {{industry}} trends.',
        completed: true
      },
      {
        id: '2',
        channel: 'linkedin',
        actionType: 'message',
        delay: 2,
        template: 'Thanks for connecting! I saw that {{company}} is {{companyDescription}}. We help similar companies {{valueProposition}}. Would you be open to a quick chat?',
        conditions: ['linkedin_connected'],
        isActive: true
      },
      {
        id: '3',
        channel: 'email',
        actionType: 'email',
        delay: 5,
        subject: 'Following up from LinkedIn',
        template: 'Hi {{firstName}},\n\nI sent you a connection request on LinkedIn a few days ago. I wanted to reach out directly because {{reason}}.\n\n{{valueProposition}}\n\nWould you be interested in a brief call to discuss how this could benefit {{company}}?\n\nBest regards,\n{{senderName}}',
        conditions: ['linkedin_not_connected']
      }
    ]
  },
  {
    id: 'email-only',
    name: 'Email Intensive',
    description: 'Three-email sequence with strategic follow-ups',
    icon: '•',
    color: 'blue',
    conversionRate: '22%',
    responseRate: '28%',
    steps: [
      {
        id: '1',
        channel: 'email',
        actionType: 'email',
        delay: 0,
        subject: '{{company}} + {{yourCompany}} partnership opportunity',
        template: 'Hi {{firstName}},\n\nI noticed {{company}} is {{companyDescription}}. We help similar companies {{valueProposition}}.\n\n{{proofPoint}}\n\nWould you be open to a 15-minute call to explore how this could benefit {{company}}?\n\nBest,\n{{senderName}}'
      },
      {
        id: '2',
        channel: 'email',
        actionType: 'email',
        delay: 3,
        subject: 'Re: {{company}} + {{yourCompany}} partnership',
        template: 'Hi {{firstName}},\n\nI wanted to follow up on my previous email about helping {{company}} {{painPoint}}.\n\n{{caseStudy}}\n\nWould next week work for a brief call?\n\nBest,\n{{senderName}}'
      },
      {
        id: '3',
        channel: 'email',
        actionType: 'email',
        delay: 7,
        subject: 'Final follow-up for {{firstName}}',
        template: 'Hi {{firstName}},\n\nI know you\'re busy, so this will be my last follow-up.\n\nIf the timing isn\'t right now, I completely understand. Would you prefer I reach back out in a few months?\n\nIf you\'re interested in learning more, I\'m happy to send over a brief case study of how we helped {{similarCompany}}.\n\nBest,\n{{senderName}}'
      }
    ]
  },
  {
    id: 'aggressive-multi',
    name: 'Multi-Channel Pro',
    description: 'High-touch sequence across email and LinkedIn',
    icon: '•',
    color: 'purple',
    conversionRate: '25%',
    responseRate: '42%',
    steps: [
      {
        id: '1',
        channel: 'email',
        actionType: 'email',
        delay: 0,
        subject: 'Quick question about {{company}}',
        template: 'Hi {{firstName}},\n\nQuick question - is {{company}} currently {{painPoint}}?\n\nWe just helped {{similarCompany}} {{result}} and thought you might be interested.\n\nWorth a quick call?\n\n{{senderName}}'
      },
      {
        id: '2',
        channel: 'linkedin',
        actionType: 'connect',
        delay: 1,
        template: 'Hi {{firstName}}, I just sent you an email about {{topic}}. Would love to connect here as well!'
      },
      {
        id: '3',
        channel: 'linkedin',
        actionType: 'message',
        delay: 3,
        template: 'Thanks for connecting! Did you get a chance to see my email about {{topic}}? Happy to share more details.',
        conditions: ['linkedin_connected']
      },
      {
        id: '4',
        channel: 'email',
        actionType: 'email',
        delay: 5,
        subject: 'Following up on {{topic}}',
        template: 'Hi {{firstName}},\n\nFollowing up on my previous email about {{topic}}.\n\n{{proofPoint}}\n\nWould you be available for a quick call this week?\n\nBest,\n{{senderName}}'
      }
    ]
  }
]

export default function WorkflowPage() {
  const router = useRouter()
  const toast = useToast()
  const customToast = createCustomToast(toast)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [customSteps, setCustomSteps] = useState<WorkflowStep[]>([])
  const [isCustom, setIsCustom] = useState(false)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [selectedStep, setSelectedStep] = useState<string | null>(null)
  const workflowStepsContainerRef = useRef<HTMLDivElement>(null)

  // Enhanced color values for glassmorphism
  const bgGradient = useColorModeValue(
    'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    'linear-gradient(135deg, #4c1d95 0%, #5b21b6 50%, #7c3aed 100%)'
  )
  const glassBg = useColorModeValue('rgba(255, 255, 255, 0.9)', 'rgba(26, 32, 44, 0.9)')
  const cardBg = useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(26, 32, 44, 0.8)')
  const accentGradient = useColorModeValue(
    'linear-gradient(45deg, #667eea, #764ba2)',
    'linear-gradient(45deg, #5b21b6, #7c3aed)'
  )

  useEffect(() => {
    // Load saved workflow data
    const savedData = localStorage.getItem('campaignWorkflow')
    if (savedData) {
      const parsed = JSON.parse(savedData)
      if (parsed.templateId) {
        setSelectedTemplate(parsed.templateId)
        const template = defaultTemplates.find(t => t.id === parsed.templateId)
        if (template) {
          setCustomSteps([...template.steps])
        }
      }
      if (parsed.customSteps) {
        setCustomSteps(parsed.customSteps)
        setIsCustom(true)
      }
    }
  }, [])

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)
    setIsCustom(false)
    const template = defaultTemplates.find(t => t.id === templateId)
    if (template) {
      setCustomSteps([...template.steps])
    }
  }

  const addCustomStep = () => {
    const newStep: WorkflowStep = {
      id: Date.now().toString(),
      channel: 'email',
      actionType: 'email',
      delay: customSteps.length > 0 ? customSteps[customSteps.length - 1].delay + 3 : 0,
      subject: '',
      template: ''
    }
    setCustomSteps([...customSteps, newStep])
    setIsCustom(true)

    setTimeout(() => {
      if (workflowStepsContainerRef.current) {
        const lastStep = workflowStepsContainerRef.current?.lastElementChild
        if (lastStep) {
          lastStep.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'end' })
        }
      }
    }, 100)
  }

  const updateStep = (stepId: string, field: keyof WorkflowStep, value: string | number | string[]) => {
    setCustomSteps(steps =>
      steps.map(step =>
        step.id === stepId ? { ...step, [field]: value } : step
      )
    )
    setIsCustom(true)
  }

  const removeStep = (stepId: string) => {
    setCustomSteps(steps => steps.filter(step => step.id !== stepId))
  }

  const getChannelIcon = (channel: string) => {
    return channel === 'email' ? FiMail : FiLinkedin
  }

  const getChannelColor = (channel: string) => {
    return channel === 'email' ? 'blue' : 'linkedin'
  }

  const getStepStatus = (step: WorkflowStep, index: number) => {
    if (step.completed) return 'completed'
    if (step.isActive) return 'active'
    return 'pending'
  }

  const renderConnectionLine = (index: number) => {
    if (index === customSteps.length - 1) return null

    return (
      <Box
        position="absolute"
        top="50%"
        right="-20px"
        width="40px"
        height="2px"
        zIndex={0}
      >
        <svg width="40" height="2" viewBox="0 0 40 2">
          <line
            x1="0"
            y1="1"
            x2="40"
            y2="1"
            stroke="url(#gradient)"
            strokeWidth="2"
            strokeDasharray="4 4"
            style={{ animation: `${flow} 2s ease-in-out infinite` }}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#667eea" />
              <stop offset="100%" stopColor="#764ba2" />
            </linearGradient>
          </defs>
        </svg>
      </Box>
    )
  }

  const handleSaveWorkflow = async () => {
    try {
      const workflowData = {
        templateId: selectedTemplate,
        customSteps: customSteps,
        isCustom
      }

      localStorage.setItem('campaignWorkflow', JSON.stringify(workflowData))

      customToast.success({
        title: 'Workflow Saved',
        description: 'Your campaign workflow has been saved successfully.',
      })
    } catch (error) {
      customToast.error({
        title: 'Save Failed',
        description: 'Failed to save workflow. Please try again.',
      })
    }
  }

  const handleContinue = () => {
    handleSaveWorkflow()
    router.push('/campaigns/new/launch')
  }

  const handleBack = () => {
    router.push('/campaigns/new/outreach')
  }

  return (
    <Box
      minH="100vh"
      bg={bgGradient}
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
      />

      <Container maxW="7xl" py={8} position="relative" zIndex="1">
        <VStack spacing={8} align="stretch">
          <CampaignStepper currentStep={4} />

          {/* Header */}
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
              Workflow Designer
            </Heading>
            <Text
              fontSize="xl"
              color="whiteAlpha.900"
              fontWeight="500"
              maxW="2xl"
              mx="auto"
            >
              Design your outreach sequence with precision. Create multi-channel touchpoints that convert.
            </Text>
          </Box>

          {/* Template Selection */}
          <Card
            bg={glassBg}
            borderRadius="2xl"
            border="1px solid"
            borderColor="whiteAlpha.200"
            backdropFilter="blur(20px)"
            boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
          >
            <CardHeader>
              <HStack spacing={3}>
                <Box
                  p={3}
                  borderRadius="xl"
                  bg={accentGradient}
                  color="white"
                  boxShadow="0 8px 20px rgba(102, 126, 234, 0.4)"
                >
                  <FiTarget size="20" />
                </Box>
                <VStack align="start" spacing={0}>
                  <Heading size="lg" color="gray.800">Choose Your Strategy</Heading>
                  <Text color="gray.600">Select a proven template or build your own</Text>
                </VStack>
                <Box ml="auto">
                  <HStack>
                    <Text fontSize="sm" color="gray.600">Preview Mode</Text>
                    <Switch
                      colorScheme="purple"
                      isChecked={isPreviewMode}
                      onChange={(e) => setIsPreviewMode(e.target.checked)}
                    />
                  </HStack>
                </Box>
              </HStack>
            </CardHeader>
            <CardBody>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                {defaultTemplates.map((template) => (
                  <Card
                    key={template.id}
                    cursor="pointer"
                    onClick={() => handleTemplateSelect(template.id)}
                    border={selectedTemplate === template.id ? '3px solid' : '2px solid'}
                    borderColor={selectedTemplate === template.id ? 'purple.400' : 'transparent'}
                    bg={selectedTemplate === template.id ? glassBg : 'white'}
                    borderRadius="xl"
                    _hover={{
                      transform: 'translateY(-4px)',
                      boxShadow: '0 20px 40px -8px rgba(102, 126, 234, 0.3)'
                    }}
                    transition="all 0.3s ease-in-out"
                    position="relative"
                    overflow="hidden"
                  >
                    {selectedTemplate === template.id && (
                      <Box
                        position="absolute"
                        top="0"
                        left="0"
                        right="0"
                        height="4px"
                        bg={accentGradient}
                        animation={`${glow} 2s ease-in-out infinite`}
                      />
                    )}
                    <CardBody p={6}>
                      <VStack align="start" spacing={4}>
                        <HStack spacing={3} width="100%">
                          <Text fontSize="2xl">{template.icon}</Text>
                          <VStack align="start" spacing={0} flex="1">
                            <Text fontWeight="bold" fontSize="lg">{template.name}</Text>
                            <Badge
                              colorScheme={template.color}
                              variant="subtle"
                              fontSize="xs"
                              px={2}
                              py={1}
                              borderRadius="md"
                            >
                              {template.steps.length} steps
                            </Badge>
                          </VStack>
                          {selectedTemplate === template.id && (
                            <CheckIcon color="purple.500" boxSize={5} />
                          )}
                        </HStack>
                        <Text fontSize="sm" color="gray.600" lineHeight="1.5">
                          {template.description}
                        </Text>
                        <HStack spacing={4} width="100%">
                          <VStack spacing={0} align="start">
                            <Text fontSize="xs" color="gray.500">Response Rate</Text>
                            <Text fontSize="lg" fontWeight="bold" color="green.500">
                              {template.responseRate}
                            </Text>
                          </VStack>
                          <VStack spacing={0} align="start">
                            <Text fontSize="xs" color="gray.500">Conversion</Text>
                            <Text fontSize="lg" fontWeight="bold" color="blue.500">
                              {template.conversionRate}
                            </Text>
                          </VStack>
                        </HStack>
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>
            </CardBody>
          </Card>

          {/* Workflow Visualization */}
          {customSteps.length > 0 && (
            <Card
              bg={glassBg}
              borderRadius="2xl"
              border="1px solid"
              borderColor="whiteAlpha.200"
              backdropFilter="blur(20px)"
              boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
            >
              <CardHeader>
                <HStack justify="space-between">
                  <HStack spacing={3}>
                    <Box
                      p={3}
                      borderRadius="xl"
                      bg={accentGradient}
                      color="white"
                      boxShadow="0 8px 20px rgba(102, 126, 234, 0.4)"
                    >
                      <FiZap size="20" />
                    </Box>
                    <VStack align="start" spacing={0}>
                      <Heading size="lg" color="gray.800">Workflow Flow</Heading>
                      <Text color="gray.600">Visual representation of your outreach sequence</Text>
                    </VStack>
                  </HStack>
                  <GradientButton
                    variant="secondary"
                    size="sm"
                    leftIcon={<FiPlus />}
                    onClick={addCustomStep}
                  >
                    Add Step
                  </GradientButton>
                </HStack>
              </CardHeader>
              <CardBody>
                <Box overflowX="auto" pb={4} ref={workflowStepsContainerRef}>
                  <Flex minW="fit-content" position="relative" alignItems="stretch">
                    {customSteps.map((step, index) => {
                      const Icon = getChannelIcon(step.channel)
                      const status = getStepStatus(step, index)

                      return (
                        <Box
                          key={step.id}
                          position="relative"
                          mr={index < customSteps.length - 1 ? 8 : 0}
                          display="flex"
                          alignItems="stretch"
                        >
                          {/* Connection Line */}
                          {renderConnectionLine(index)}

                          {/* Step Card */}
                          <Card
                            width="280px"
                            minHeight="200px"
                            border="2px solid"
                            borderColor={
                              status === 'completed' ? 'green.300' :
                              status === 'active' ? 'purple.400' : 'gray.200'
                            }
                            bg={
                              status === 'completed' ? 'green.50' :
                              status === 'active' ? 'purple.50' : 'white'
                            }
                            cursor="pointer"
                            onClick={() => setSelectedStep(step.id)}
                            _hover={{
                              transform: 'translateY(-2px)',
                              boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)'
                            }}
                            transition="all 0.2s ease-in-out"
                            position="relative"
                            zIndex={1}
                            display="flex"
                            flexDirection="column"
                          >
                            <CardHeader pb={2}>
                              <HStack justify="space-between">
                                <HStack spacing={3}>
                                  <Circle
                                    size="40px"
                                    bg={
                                      status === 'completed' ? 'green.500' :
                                      status === 'active' ? 'purple.500' : 'gray.400'
                                    }
                                    color="white"
                                  >
                                    {status === 'completed' ? (
                                      <CheckIcon boxSize={4} />
                                    ) : (
                                      <Icon size="18" />
                                    )}
                                  </Circle>
                                  <VStack align="start" spacing={0}>
                                    <Text fontSize="sm" fontWeight="bold">
                                      Step {index + 1}
                                    </Text>
                                    {selectedTemplate === 'aggressive-multi' ? (
                                        <Select
                                            size="xs"
                                            width="auto"
                                            value={step.channel}
                                            onChange={(e) => updateStep(step.id, 'channel', e.target.value)}
                                            bg={`${getChannelColor(step.channel)}.100`}
                                            color={`${getChannelColor(step.channel)}.800`}
                                            fontWeight="bold"
                                            borderRadius="md"
                                            borderColor={`${getChannelColor(step.channel)}.300`}
                                            _focus={{ borderColor: `${getChannelColor(step.channel)}.500` }}
                                            cursor="pointer"
                                      >
                                        <option value="email">EMAIL</option>
                                        <option value="linkedin">LINKEDIN</option>
                                      </Select>
                                    ) : (
                                        <Badge
                                            colorScheme={getChannelColor(step.channel)}
                                            size="sm"
                                        >
                                            {step.channel.toUpperCase()}
                                        </Badge>
                                    )}
                                  </VStack>
                                </HStack>
                                <VStack spacing={1}>
                                  <IconButton
                                    aria-label="Delete step"
                                    icon={<FiTrash2 />}
                                    size="xs"
                                    variant="ghost"
                                    colorScheme="red"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      removeStep(step.id)
                                    }}
                                  />
                                </VStack>
                              </HStack>
                            </CardHeader>
                            <Spacer height={20}/>
                            <CardBody>
                                <HStack spacing={2}>
                                  <TimeIcon boxSize={5} color="gray.500" />
                                  <Text fontSize="md" color="gray.600">
                                    {step.delay === 0 ? 'Immediate' : `Day ${step.delay}`}
                                  </Text>
                                </HStack>
                            </CardBody>
                          </Card>
                        </Box>
                      )
                    })}
                  </Flex>
                </Box>
              </CardBody>
            </Card>
          )}

          {/* Workflow Stats */}
          {selectedTemplate && (
            <Card
              bg={glassBg}
              borderRadius="2xl"
              border="1px solid"
              borderColor="whiteAlpha.200"
              backdropFilter="blur(20px)"
              boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
            >
              <CardBody>
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={6}>
                  <VStack spacing={2}>
                    <Circle size="60px" bg="blue.100" color="blue.600">
                      <FiMail size="24" />
                    </Circle>
                    <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                      {customSteps.filter(s => s.channel === 'email').length}
                    </Text>
                    <Text fontSize="sm" color="gray.600">Email Steps</Text>
                  </VStack>
                  <VStack spacing={2}>
                    <Circle size="60px" bg="linkedin.100" color="linkedin.600">
                      <FiLinkedin size="24" />
                    </Circle>
                    <Text fontSize="2xl" fontWeight="bold" color="linkedin.600">
                      {customSteps.filter(s => s.channel === 'linkedin').length}
                    </Text>
                    <Text fontSize="sm" color="gray.600">LinkedIn Steps</Text>
                  </VStack>
                  <VStack spacing={2}>
                    <Circle size="60px" bg="purple.100" color="purple.600">
                      <FiClock size="24" />
                    </Circle>
                    <Text fontSize="2xl" fontWeight="bold" color="purple.600">
                      {Math.max(...customSteps.map(s => s.delay), 0)}
                    </Text>
                    <Text fontSize="sm" color="gray.600">Total Days</Text>
                  </VStack>
                  <VStack spacing={2}>
                    <Circle size="60px" bg="green.100" color="green.600">
                      <FiTarget size="24" />
                    </Circle>
                    <Text fontSize="2xl" fontWeight="bold" color="green.600">
                      {defaultTemplates.find(t => t.id === selectedTemplate)?.responseRate || 'N/A'}
                    </Text>
                    <Text fontSize="sm" color="gray.600">Response Rate</Text>
                  </VStack>
                </SimpleGrid>
              </CardBody>
            </Card>
          )}

          {/* Navigation */}
          <HStack justify="space-between" pt={4}>
            <Button
              onClick={handleBack}
              leftIcon={<ChevronRightIcon transform="rotate(180deg)" />}
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
              Back to Outreach
            </Button>

            <HStack spacing={3}>
              <Button
                onClick={handleSaveWorkflow}
                leftIcon={<FiSettings />}
                size="lg"
                bg="white"
                color="gray.600"
                borderColor="gray.300"
                borderWidth="2px"
                variant="outline"
                _hover={{
                  bg: 'gray.50',
                  borderColor: 'gray.400'
                }}
                _active={{
                  bg: 'gray.100'
                }}
                transition="all 0.2s ease"
                fontWeight="600"
              >
                💾 Save Draft
              </Button>
              <GradientButton
                onClick={handleContinue}
                isDisabled={customSteps.length === 0}
                rightIcon={<FiPlay />}
                size="lg"
                _hover={{
                  transform: 'translateY(-2px)',
                  shadow: 'xl',
                }}
                transition="all 0.3s ease"
                minW="180px"
              >
                🚀 Launch Campaign
              </GradientButton>
            </HStack>
          </HStack>
        </VStack>
      </Container>

      {/* Step Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent>
          <ModalHeader>Edit Workflow Step</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedStep && (
              <VStack spacing={4} align="stretch">
                {/* Step editing form would go here */}
                <Text>Step editing functionality coming soon...</Text>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  )
}