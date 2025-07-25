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
  FormControl,
  FormLabel,
  Switch,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Select,
  Heading,
  SimpleGrid,
  Divider,
  useColorModeValue,
  useToast,
  Badge,
  Progress,
  Icon,
  Button
} from '@chakra-ui/react'
import { keyframes } from '@emotion/react'
import { CampaignStepper } from '@/components/ui/CampaignStepper'
import { GradientButton } from '@/components/ui/GradientButton'
import { useRouter } from 'next/navigation'
import { FiCalendar, FiClock, FiShield, FiZap, FiCheckCircle, FiPlay, FiTarget } from 'react-icons/fi'
import { HiOutlineOfficeBuilding } from 'react-icons/hi'
import { format } from 'date-fns'
import { useOrganization } from '@clerk/nextjs'
import { createCustomToast, commonToasts } from '@/lib/utils/custom-toast'

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
  50% { opacity: 0.8; }
`

interface LaunchSettings {
  campaignName: string
  autopilot: boolean
  dailyLimit: number
  timezone: string
  startDate: string
  reviewRequired: boolean
  trackingEnabled: boolean
  doNotContact: string[]
}

// Helper function to save campaign settings to the database
const saveCampaignSettings = async (launchSettings: LaunchSettings) => {
  // This is a placeholder for now
  console.log('Saving campaign settings:', launchSettings)
  return true
}

export default function LaunchPage() {
  const router = useRouter()
  const toast = useToast()
  const customToast = createCustomToast(toast)
  const { organization } = useOrganization()
  const [isLaunching, setIsLaunching] = useState(false)

  const [campaignData, setCampaignData] = useState<{
    targeting?: unknown
    pitch?: unknown
    outreach?: unknown
    workflow?: { customSteps?: Array<{ delay?: number }> }
  } | null>(null)
  const [launchSettings, setLaunchSettings] = useState<LaunchSettings>({
    campaignName: '',
    autopilot: false,
    dailyLimit: 50,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    startDate: new Date().toISOString().split('T')[0],
    reviewRequired: true,
    trackingEnabled: true,
    doNotContact: []
  })

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

  useEffect(() => {
    // Load all campaign data from localStorage
    const loadCampaignData = () => {
      if (typeof window !== 'undefined') {
        const targeting = JSON.parse(localStorage.getItem('campaignTargeting') || '{}')
        const pitch = JSON.parse(localStorage.getItem('campaignPitchData') || '{}')
        const outreach = JSON.parse(localStorage.getItem('campaignOutreachData') || '{}')
        const workflow = JSON.parse(localStorage.getItem('campaignWorkflow') || '{}')
        const savedLaunch = JSON.parse(localStorage.getItem('campaignLaunch') || '{}')

        setCampaignData({
          targeting,
          pitch,
          outreach,
          workflow
        })

        if (savedLaunch.campaignName) {
          setLaunchSettings(prev => ({ ...prev, ...savedLaunch }))
        }
      }
    }

    loadCampaignData()
  }, [])

  const updateLaunchSetting = (field: keyof LaunchSettings, value: string | number | boolean) => {
    setLaunchSettings(prev => {
      const updated = { ...prev, [field]: value }
      if (typeof window !== 'undefined') {
        localStorage.setItem('campaignLaunch', JSON.stringify(updated))
      }
      return updated
    })
  }

  const handleLaunchCampaign = async () => {
    if (!launchSettings.campaignName.trim()) {
      customToast.warning({
        title: 'Campaign name required',
        description: 'Please enter a name for your campaign.',
      })
      return
    }

    setIsLaunching(true)

    try {
      // Get targeting data (filters/ICP) instead of selected leads
      const targetingData = typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('campaignTargeting') || '{}')
        : {}

      console.log('Launch: Using targeting data/filters:', targetingData)

      const campaignPayload = {
        campaignName: launchSettings.campaignName,
        organizationId: organization?.id,
        targeting: targetingData,
        pitch: typeof window !== 'undefined'
          ? JSON.parse(localStorage.getItem('campaignPitchData') || '{}')
          : {},
        outreach: typeof window !== 'undefined'
          ? JSON.parse(localStorage.getItem('campaignOutreachData') || '{}')
          : {},
        workflow: typeof window !== 'undefined'
          ? JSON.parse(localStorage.getItem('campaignWorkflow') || '{}')
          : {},
        launch: launchSettings
      }

      console.log('Creating campaign with payload:', campaignPayload)

      const response = await fetch('/api/campaigns/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignPayload)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create campaign')
      }

      console.log('Campaign created successfully:', data)

      // Clear localStorage data after successful launch
      if (typeof window !== 'undefined') {
        localStorage.removeItem('campaignTargeting')
        localStorage.removeItem('campaignPitchData')
        localStorage.removeItem('campaignOutreachData')
        localStorage.removeItem('campaignWorkflow')
        localStorage.removeItem('campaignLaunch')
        localStorage.removeItem('selectedLeads')
      }

      customToast.success({
        title: 'Campaign Launched!',
        description: organization
          ? `"${launchSettings.campaignName}" has been successfully created in ${organization.name} and is ready to start.`
          : `"${launchSettings.campaignName}" has been successfully created and is ready to start.`,
        duration: 5000,
      })

      // Navigate to campaign dashboard or campaigns list
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)

    } catch (error) {
      console.error('Error launching campaign:', error)
      customToast.error({
        title: 'Launch Failed',
        description: error instanceof Error ? error.message : 'Failed to launch campaign',
        duration: 5000,
      })
    } finally {
      setIsLaunching(false)
    }
  }

  const handleBack = () => {
    router.push('/campaigns/new/workflow')
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
        top="6%"
        right="10%"
        w="320px"
        h="320px"
        borderRadius="50%"
        bg={accentGradient}
        opacity={0.1}
        animation={`${float} 9s ease-in-out infinite`}
        zIndex={0}
      />
      <Box
        position="absolute"
        bottom="12%"
        left="6%"
        w="240px"
        h="240px"
        borderRadius="50%"
        bg={accentGradient}
        opacity={0.08}
        animation={`${float} 11s ease-in-out infinite reverse`}
        zIndex={0}
      />

      <Container maxW="7xl" py={8} position="relative" zIndex={1}>
        <VStack spacing={8} align="stretch">
          {/* Header with Campaign Stepper */}
          <CampaignStepper currentStep={4} />

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
              Launch Your Campaign
            </Heading>
            <Text
              fontSize="xl"
              color="whiteAlpha.900"
              fontWeight="500"
              maxW="2xl"
              mx="auto"
            >
              Review your campaign settings and launch your AI-powered outreach to start generating leads
            </Text>
            {organization && (
              <Badge
                colorScheme="purple"
                mt={3}
                px={4}
                py={2}
                borderRadius="full"
                fontSize="sm"
              >
                <HStack spacing={2}>
                  <Icon as={HiOutlineOfficeBuilding} />
                  <Text>Creating in {organization.name}</Text>
                </HStack>
              </Badge>
            )}
          </Box>

          {/* Launch Settings */}
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
                  ⚙️ Settings
                </Badge>
                <Heading size="lg" color="gray.800">
                  Campaign Configuration
                </Heading>
              </HStack>
            </CardHeader>
            <CardBody pt={0}>
              <VStack spacing={6} align="stretch">
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  {/* Campaign Name */}
                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="medium">
                      <HStack>
                        <Icon as={FiTarget} color="purple.500" />
                        <Text>Campaign Name</Text>
                      </HStack>
                    </FormLabel>
                    <Input
                      value={launchSettings.campaignName}
                      onChange={(e) => updateLaunchSetting('campaignName', e.target.value)}
                      placeholder="Enter campaign name..."
                      bg={glassBg}
                      border="1px solid"
                      borderColor={borderColor}
                      _focus={{
                        borderColor: 'purple.400',
                        boxShadow: `0 0 0 1px rgba(102, 126, 234, 0.4)`,
                      }}
                      size="lg"
                    />
                  </FormControl>

                  {/* Daily Limit */}
                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="medium">
                      <HStack>
                        <Icon as={FiZap} color="orange.500" />
                        <Text>Daily Contact Limit</Text>
                      </HStack>
                    </FormLabel>
                    <NumberInput
                      value={launchSettings.dailyLimit}
                      onChange={(value) => updateLaunchSetting('dailyLimit', parseInt(value) || 50)}
                      min={1}
                      max={500}
                      size="lg"
                    >
                      <NumberInputField
                        bg={glassBg}
                        border="1px solid"
                        borderColor={borderColor}
                        _focus={{
                          borderColor: 'orange.400',
                          boxShadow: `0 0 0 1px rgba(251, 146, 60, 0.4)`,
                        }}
                      />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>

                  {/* Start Date */}
                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="medium">
                      <HStack>
                        <Icon as={FiCalendar} color="green.500" />
                        <Text>Start Date</Text>
                      </HStack>
                    </FormLabel>
                    <Input
                      type="date"
                      value={launchSettings.startDate}
                      onChange={(e) => updateLaunchSetting('startDate', e.target.value)}
                      bg={glassBg}
                      border="1px solid"
                      borderColor={borderColor}
                      _focus={{
                        borderColor: 'green.400',
                        boxShadow: `0 0 0 1px rgba(72, 187, 120, 0.4)`,
                      }}
                      size="lg"
                    />
                  </FormControl>

                  {/* Timezone */}
                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="medium">
                      <HStack>
                        <Icon as={FiClock} color="blue.500" />
                        <Text>Timezone</Text>
                      </HStack>
                    </FormLabel>
                    <Select
                      value={launchSettings.timezone}
                      onChange={(e) => updateLaunchSetting('timezone', e.target.value)}
                      bg={glassBg}
                      border="1px solid"
                      borderColor={borderColor}
                      _focus={{
                        borderColor: 'blue.400',
                        boxShadow: `0 0 0 1px rgba(66, 153, 225, 0.4)`,
                      }}
                      size="lg"
                    >
                      <option value="America/New_York">Eastern Time (ET)</option>
                      <option value="America/Chicago">Central Time (CT)</option>
                      <option value="America/Denver">Mountain Time (MT)</option>
                      <option value="America/Los_Angeles">Pacific Time (PT)</option>
                      <option value="Europe/London">London (GMT)</option>
                      <option value="Europe/Paris">Paris (CET)</option>
                      <option value="Asia/Tokyo">Tokyo (JST)</option>
                      <option value="Australia/Sydney">Sydney (AEST)</option>
                    </Select>
                  </FormControl>
                </SimpleGrid>

                <Divider />

                {/* Advanced Settings */}
                <VStack spacing={4} align="stretch">
                  <Text fontSize="md" fontWeight="semibold" color="gray.600">
                    Advanced Options
                  </Text>

                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    {/* Autopilot Mode */}
                    <FormControl>
                      <HStack justify="space-between">
                        <VStack align="start" spacing={0}>
                          <FormLabel mb={0} fontSize="sm" fontWeight="medium">
                            <HStack>
                              <Icon as={FiPlay} color="purple.500" />
                              <Text>Autopilot Mode</Text>
                            </HStack>
                          </FormLabel>
                          <Text fontSize="xs" color="gray.500">
                            Automatically send messages without manual approval
                          </Text>
                        </VStack>
                        <Switch
                          isChecked={launchSettings.autopilot}
                          onChange={(e) => updateLaunchSetting('autopilot', e.target.checked)}
                          colorScheme="purple"
                          size="lg"
                        />
                      </HStack>
                    </FormControl>

                    {/* Review Required */}
                    <FormControl>
                      <HStack justify="space-between">
                        <VStack align="start" spacing={0}>
                          <FormLabel mb={0} fontSize="sm" fontWeight="medium">
                            <HStack>
                              <Icon as={FiCheckCircle} color="green.500" />
                              <Text>Manual Review</Text>
                            </HStack>
                          </FormLabel>
                          <Text fontSize="xs" color="gray.500">
                            Require approval before sending messages
                          </Text>
                        </VStack>
                        <Switch
                          isChecked={launchSettings.reviewRequired}
                          onChange={(e) => updateLaunchSetting('reviewRequired', e.target.checked)}
                          colorScheme="green"
                          size="lg"
                        />
                      </HStack>
                    </FormControl>

                    {/* Tracking Enabled */}
                    <FormControl>
                      <HStack justify="space-between">
                        <VStack align="start" spacing={0}>
                          <FormLabel mb={0} fontSize="sm" fontWeight="medium">
                            <HStack>
                              <Icon as={FiShield} color="blue.500" />
                              <Text>Email Tracking</Text>
                            </HStack>
                          </FormLabel>
                          <Text fontSize="xs" color="gray.500">
                            Track opens, clicks, and replies
                          </Text>
                        </VStack>
                        <Switch
                          isChecked={launchSettings.trackingEnabled}
                          onChange={(e) => updateLaunchSetting('trackingEnabled', e.target.checked)}
                          colorScheme="blue"
                          size="lg"
                        />
                      </HStack>
                    </FormControl>
                  </SimpleGrid>
                </VStack>
              </VStack>
            </CardBody>
          </Card>

          {/* Progress Indicator */}
          {isLaunching && (
            <Card
              bg={cardBg}
              backdropFilter="blur(10px)"
              border="1px solid"
              borderColor={borderColor}
              shadow="xl"
              borderRadius="2xl"
              overflow="hidden"
              animation={`${pulse} 2s infinite`}
            >
              <CardBody>
                <VStack spacing={4}>
                  <Text fontSize="lg" fontWeight="medium">
                    Launching Your Campaign...
                  </Text>
                  <Progress
                    value={75}
                    colorScheme="purple"
                    size="lg"
                    w="full"
                    borderRadius="full"
                    bg="gray.200"
                  />
                  <Text fontSize="sm" color="gray.600">
                    Setting up your AI SDR and initializing outreach sequences...
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          )}

          {/* Navigation Actions */}
          <HStack justify="space-between" align="center">
            <Button
              onClick={handleBack}
              leftIcon={<Text>←</Text>}
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
              Back to Workflow
            </Button>

            <GradientButton
              onClick={handleLaunchCampaign}
              isLoading={isLaunching}
              loadingText="Launching..."
              disabled={!launchSettings.campaignName.trim()}
              rightIcon={<Icon as={FiPlay} />}
              size="lg"
              px={12}
              py={6}
              fontSize="lg"
              _hover={{
                transform: 'translateY(-2px)',
                shadow: 'xl',
              }}
              transition="all 0.3s ease"
              animation={`${glow} 4s ease-in-out infinite`}
            >
              {isLaunching ? 'Launching Campaign...' : '🚀 Launch Campaign'}
            </GradientButton>
          </HStack>
        </VStack>
      </Container>
    </Box>
  )
}