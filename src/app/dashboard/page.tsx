'use client'

import { useUser } from '@clerk/nextjs'
import { useOrganization } from '@clerk/nextjs'
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Grid,
  Input,
  InputGroup,
  InputLeftElement,
  Icon,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Badge,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Card,
  CardBody,
  Button
} from '@chakra-ui/react'
import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import CampaignCard from '@/components/ui/CampaignCard'
import { GradientButton } from '@/components/ui/GradientButton'

interface UserProfile {
  company_name: string
  website_url: string
  site_summary: string
  icp: Record<string, unknown>
  completed: boolean
}

interface Campaign {
  id: string
  name: string
  type: 'Standard' | 'Watchtower' | 'Local'
  leads: {
    current: number
    total: number
  }
  country: string
  flag: string
  isPrivate: boolean
  status: string
}

export interface DbCampaign {
  id: string
  name: string
  description: string
  status: string
  sequence_template: string
  settings: Record<string, any>
  created_at: string
  updated_at: string
}

export default function Dashboard() {
  const { user, isLoaded } = useUser()
  const { organization } = useOrganization()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [dbCampaigns, setDbCampaigns] = useState<DbCampaign[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [dashboardStats, setDashboardStats] = useState({
    activeCampaigns: 0,
    totalLeads: 0,
    totalMessages: 0,
    responseRate: 0
  })

  const searchBg = useColorModeValue('white', 'gray.800')
  const searchBorder = useColorModeValue('gray.200', 'gray.700')
  const statCardBg = useColorModeValue('white', 'gray.800')
  const statCardBorder = useColorModeValue('gray.200', 'gray.700')

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return

      try {
        const response = await fetch('/api/user/profile')

        if (!response.ok) {
          throw new Error('Failed to load profile')
        }

        const data = await response.json()
        setProfile(data.profile)

        // If profile is not completed or user is new, redirect to onboarding
        if (!data.profile?.completed || data.isNewUser) {
          console.log('Redirecting to onboarding:', {
            profileCompleted: data.profile?.completed,
            isNewUser: data.isNewUser
          })
          router.push('/onboarding')
          return
        }
      } catch (err) {
        setError('Unable to load your profile. Please try refreshing the page.')
        console.error('Profile fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    if (isLoaded && user) {
      fetchProfile()
    }
  }, [user, isLoaded, router])

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        // Build URL with organization context
        const params = new URLSearchParams()
        if (organization?.id) {
          params.append('organizationId', organization.id)
        }

        const url = `/api/campaigns${params.toString() ? `?${params.toString()}` : ''}`

        // Fetch campaigns from database with organization context
        const response = await fetch(url)

        console.log(response.json)

        if (!response.ok) {
          throw new Error('Failed to fetch campaigns')
        }

        const data = await response.json()

        if (data.campaigns && Array.isArray(data.campaigns)) {
          setDbCampaigns(data.campaigns)

          // Convert DB campaigns to UI format
          const uiCampaigns = data.campaigns.map((campaign: DbCampaign) => {
            // Extract lead counts from settings or use defaults
            const leadCount = campaign.settings?.leadCount || 0
            const totalLeads = campaign.settings?.totalLeads || 0

            // Determine campaign type based on template or settings
            let type: 'Standard' | 'Watchtower' | 'Local' = 'Standard'
            if (campaign.settings?.campaignType === 'watchtower') {
              type = 'Watchtower'
            } else if (campaign.settings?.campaignType === 'local') {
              type = 'Local'
            }

            // Get country info from settings or default to US
            const country = campaign.settings?.country || 'US'
            let flag = '🇺🇸'
            if (country === 'Global') flag = '🌍'
            else if (country === 'UK') flag = '🇬🇧'
            else if (country === 'CA') flag = '🇨🇦'

            return {
              id: campaign.id,
              name: campaign.name,
              type,
              leads: {
                current: leadCount,
                total: totalLeads
              },
              country,
              flag,
              isPrivate: campaign.settings?.isPrivate || false,
              status: campaign.status
            }
          })

          setCampaigns(uiCampaigns)

          // Calculate dashboard stats
          const active = data.campaigns.filter((c: DbCampaign) => c.status === 'active').length
          const totalLeads = data.campaigns.reduce((sum: number, c: DbCampaign) =>
            sum + (c.settings?.totalLeads || 0), 0)

          setDashboardStats({
            activeCampaigns: active,
            totalLeads,
            totalMessages: data.stats?.totalMessages || 0,
            responseRate: data.stats?.responseRate || 0
          })
        }
      } catch (err) {
        console.error('Error fetching campaigns:', err)
        // Don't fall back to sample data in production
        // setCampaigns(sampleCampaigns)
      }
    }

    if (isLoaded && user) {
      fetchCampaigns()
    }
  }, [isLoaded, user, organization?.id])

  const handleTogglePrivate = (campaignId: string) => {
    setCampaigns(campaigns.map(campaign =>
      campaign.id === campaignId
        ? { ...campaign, isPrivate: !campaign.isPrivate }
        : campaign
    ))
  }

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!isLoaded || loading) {
    return (
      <DashboardLayout>
        <VStack spacing={6} justify="center" h="400px">
          <Spinner size="xl" color="purple.500" />
          <Text>Loading your dashboard...</Text>
        </VStack>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      </DashboardLayout>
    )
  }

  if (!profile?.completed) {
    return (
      <DashboardLayout>
        <VStack spacing={6} justify="center" h="400px">
          <Spinner size="xl" color="purple.500" />
          <Text>Redirecting to onboarding...</Text>
        </VStack>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <VStack spacing={8} align="stretch">
        {/* Dashboard Stats */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} mb={6}>
          <Card bg={statCardBg} border="1px solid" borderColor={statCardBorder}>
            <CardBody>
              <Stat>
                <StatLabel>Active Campaigns</StatLabel>
                <StatNumber>{dashboardStats.activeCampaigns}</StatNumber>
                <StatHelpText>Currently running</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={statCardBg} border="1px solid" borderColor={statCardBorder}>
            <CardBody>
              <Stat>
                <StatLabel>Total Leads</StatLabel>
                <StatNumber>{dashboardStats.totalLeads}</StatNumber>
                <StatHelpText>In all campaigns</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={statCardBg} border="1px solid" borderColor={statCardBorder}>
            <CardBody>
              <Stat>
                <StatLabel>Messages Sent</StatLabel>
                <StatNumber>{dashboardStats.totalMessages}</StatNumber>
                <StatHelpText>Across all campaigns</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={statCardBg} border="1px solid" borderColor={statCardBorder}>
            <CardBody>
              <Stat>
                <StatLabel>Response Rate</StatLabel>
                <StatNumber>{dashboardStats.responseRate}%</StatNumber>
                <StatHelpText>Average across campaigns</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Tabs */}
        <Tabs colorScheme="purple" variant="enclosed">
          <TabList>
            <Tab>{organization ? 'Organization Campaigns' : 'My Campaigns'}</Tab>
            <Tab>Team Campaigns</Tab>
            <Tab>Templates</Tab>
          </TabList>

          <TabPanels>
            <TabPanel px={0}>
              {/* Header */}
              <HStack justify="space-between" align="center" mb={6}>
                <VStack spacing={2} align="start">
                  <HStack spacing={3} align="center">
                    <Heading size="lg" color="gray.800">
                      Campaigns
                    </Heading>
                    <Badge colorScheme="purple" borderRadius="full" px={2}>
                      {campaigns.length}
                    </Badge>
                  </HStack>
                  {organization && (
                    <Text fontSize="sm" color="gray.600">
                      Organization workspace • {organization.membersCount} member{organization.membersCount !== 1 ? 's' : ''}
                    </Text>
                  )}
                </VStack>

                <GradientButton size="lg" onClick={() => router.push('/campaigns/new')}>
                  Create a Campaign
                </GradientButton>
              </HStack>

              {/* Search Bar */}
              <InputGroup maxW="400px" mb={6}>
                <InputLeftElement>
                  <Icon as={Search} boxSize={5} color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search campaigns"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  bg={searchBg}
                  border="1px"
                  borderColor={searchBorder}
                  borderRadius="lg"
                  _focus={{
                    borderColor: "purple.400",
                    boxShadow: "0 0 0 1px var(--chakra-colors-purple-400)"
                  }}
                />
              </InputGroup>

              {/* Campaign Grid */}
              <Grid
                templateColumns="repeat(auto-fill, minmax(300px, 1fr))"
                gap={6}
                w="100%"
              >
                {filteredCampaigns.map((campaign) => (
                  <CampaignCard
                    key={campaign.id}
                    name={campaign.name}
                    type={campaign.type}
                    leads={campaign.leads}
                    country={campaign.country}
                    flag={campaign.flag}
                    isPrivate={campaign.isPrivate}
                    onTogglePrivate={() => handleTogglePrivate(campaign.id)}
                    onClick={() => router.push(`/campaigns/${campaign.id}`)}
                  />
                ))}
              </Grid>

              {filteredCampaigns.length === 0 && searchQuery && (
                <Box textAlign="center" py={12}>
                  <Text color="gray.500" fontSize="lg">
                    No campaigns found matching &quot;{searchQuery}&quot;
                  </Text>
                </Box>
              )}

              {campaigns.length === 0 && (
                <Box textAlign="center" py={12}>
                  <VStack spacing={4}>
                    <Text color="gray.500" fontSize="lg">
                      {organization
                        ? `No campaigns yet in ${organization.name}. Create your first campaign to get started!`
                        : "No campaigns yet. Create your first campaign to get started!"
                      }
                    </Text>
                    <GradientButton onClick={() => router.push('/campaigns/new')}>
                      Create Your First Campaign
                    </GradientButton>
                  </VStack>
                </Box>
              )}
            </TabPanel>

            <TabPanel>
              <VStack spacing={4} align="center" py={8}>
                <Text color="gray.600" fontSize="lg">
                  Collaborate with your team on campaigns
                </Text>
                <Text color="gray.500" fontSize="sm">
                  Team campaigns are available with Pro subscription
                </Text>
                <Button colorScheme="blue" size="sm" variant="outline">
                  Upgrade to Pro
                </Button>
              </VStack>
            </TabPanel>

            <TabPanel>
              <VStack spacing={4} align="center" py={8}>
                <Text color="gray.600" fontSize="lg">
                  Save time with pre-built campaign templates
                </Text>
                <Text color="gray.500" fontSize="sm">
                  Campaign templates are available with Pro subscription
                </Text>
                <Button colorScheme="blue" size="sm" variant="outline">
                  Upgrade to Pro
                </Button>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </DashboardLayout>
  )
}

// Sample campaign data matching Artisan's design
const sampleCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'Tech Companies 50/150',
    type: 'Standard',
    leads: { current: 290, total: 12863 },
    country: 'US',
    flag: '🇺🇸',
    isPrivate: true,
    status: 'active'
  },
  {
    id: '2',
    name: 'Web Visitor',
    type: 'Watchtower',
    leads: { current: 213, total: 8026 },
    country: 'Global',
    flag: '🌍',
    isPrivate: true,
    status: 'active'
  },
  {
    id: '3',
    name: 'Belmar',
    type: 'Standard',
    leads: { current: 0, total: 3180 },
    country: 'US',
    flag: '🇺🇸',
    isPrivate: true,
    status: 'active'
  },
  {
    id: '4',
    name: 'Cambray',
    type: 'Standard',
    leads: { current: 0, total: 15526 },
    country: 'UK',
    flag: '🇬🇧',
    isPrivate: true,
    status: 'active'
  }
]