'use client'

// External libraries
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
import { Search, Activity, Users, MessageCircle, TrendingUp, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

// Internal components
import DashboardLayout from '@/components/layout/DashboardLayout'
import CampaignCard from '@/components/ui/CampaignCard'
import { GradientButton } from '@/components/ui/GradientButton'

// Interfaces
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
    createdAt: string
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

// Reusable component for Stat Cards
const StatCard = ({ label, number, helpText }: { label: string; number: number; helpText: string }) => {
    const statCardBg = useColorModeValue('white', 'gray.800')
    const statCardBorder = useColorModeValue('gray.200', 'gray.700')

    return (
        <Card bg={statCardBg} border="1px solid" borderColor={statCardBorder}>
            <CardBody>
                <Stat>
                    <StatLabel>{label}</StatLabel>
                    <StatNumber>{number}</StatNumber>
                    <StatHelpText>{helpText}</StatHelpText>
                </Stat>
            </CardBody>
        </Card>
    )
}

export default function Dashboard() {
    const { user, isLoaded } = useUser()
    const { organization } = useOrganization()
    const router = useRouter()

    const [state, setState] = useState({
        profile: null as UserProfile | null,
        loading: true,
        error: null as string | null,
        campaigns: [] as Campaign[],
        dbCampaigns: [] as DbCampaign[],
        searchQuery: '',
        dashboardStats: {
            activeCampaigns: 0,
            totalLeads: 0,
            totalMessages: 0,
            responseRate: 0
        }
    })

    const searchBg = useColorModeValue('white', 'gray.800')
    const searchBorder = useColorModeValue('gray.200', 'gray.700')
    const cardBg = useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(26, 32, 44, 0.8)')
    const cardBorder = useColorModeValue('rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)')

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) return

            try {
                const response = await fetch('/api/user/profile')

                if (!response.ok) {
                    throw new Error('Failed to load profile')
                }

                const data = await response.json()
                setState((prev) => ({
                    ...prev,
                    profile: data.profile,
                    loading: false
                }))

                if (!data.profile?.completed || data.isNewUser) {
                    router.push('/onboarding')
                }
            } catch (err) {
                setState((prev) => ({
                    ...prev,
                    error: 'Unable to load your profile. Please try refreshing the page.',
                    loading: false
                }))
            }
        }

        if (isLoaded && user) {
            fetchProfile()
        }
    }, [user, isLoaded, router])

    useEffect(() => {
        const fetchCampaigns = async () => {
            try {
                const params = new URLSearchParams()
                if (organization?.id) {
                    params.append('organizationId', organization.id)
                }

                const url = `/api/campaigns${params.toString() ? `?${params.toString()}` : ''}`
                const response = await fetch(url)

                if (!response.ok) {
                    throw new Error('Failed to fetch campaigns')
                }

                const data = await response.json()
                const uiCampaigns = data.campaigns.map((campaign: DbCampaign) => {
                    const leadCount = campaign.settings?.leadCount || 0
                    const totalLeads = campaign.settings?.totalLeads || 0

                    let type: 'Standard' | 'Watchtower' | 'Local' = 'Standard'
                    if (campaign.settings?.campaignType === 'watchtower') {
                        type = 'Watchtower'
                    } else if (campaign.settings?.campaignType === 'local') {
                        type = 'Local'
                    }



                    return {
                        id: campaign.id,
                        name: campaign.name,
                        type,
                        leads: {
                            current: leadCount,
                            total: totalLeads
                        },
                        createdAt: campaign.created_at,
                        status: campaign.status
                    }
                })

                setState((prev) => ({
                    ...prev,
                    campaigns: uiCampaigns,
                    dbCampaigns: data.campaigns,
                    dashboardStats: {
                        activeCampaigns: data.campaigns.filter((c: DbCampaign) => c.status === 'active').length,
                        totalLeads: data.campaigns.reduce((sum: number, c: DbCampaign) => sum + (c.settings?.totalLeads || 0), 0),
                        totalMessages: data.stats?.totalMessages || 0,
                        responseRate: data.stats?.responseRate || 0
                    }
                }))
            } catch (err) {
                console.error('Error fetching campaigns:', err)
            }
        }

        if (isLoaded && user) {
            fetchCampaigns()
        }
    }, [isLoaded, user, organization?.id])



    const filteredCampaigns = state.campaigns.filter((campaign) =>
        campaign.name.toLowerCase().includes(state.searchQuery.toLowerCase())
    )

    if (!isLoaded || state.loading) {
        return (
            <DashboardLayout>
                <VStack spacing={6} justify="center" h="400px">
                    <Spinner size="xl" color="purple.500" />
                    <Text>Loading your dashboard...</Text>
                </VStack>
            </DashboardLayout>
        )
    }

    if (state.loading) {
        return (
            <DashboardLayout>
                <VStack spacing={6} justify="center" h="400px">
                    <Spinner size="xl" color="purple.500" />
                    <Text>Loading campaigns...</Text>
                </VStack>
            </DashboardLayout>
        )
    }

    if (state.error) {
        return (
            <DashboardLayout>
                <Alert status="error">
                    <AlertIcon />
                    {state.error}
                </Alert>
            </DashboardLayout>
        )
    }

    if (!state.profile?.completed) {
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
                {/* Campaigns Header */}
                <HStack justify="space-between" align="center">
                    <VStack spacing={1} align="start">
                        <Heading 
                            size="xl" 
                            bgGradient="linear(to-r, purple.400, blue.400)"
                            bgClip="text"
                            fontWeight="bold"
                        >
                            Campaigns
                        </Heading>
                        <Text color="gray.600" fontSize="lg">
                            Manage your outreach campaigns and track performance
                        </Text>
                    </VStack>
                    <GradientButton 
                        leftIcon={<Plus size={16} />} 
                        variant="primary"
                        size="lg"
                        onClick={() => router.push('/campaigns/new')}
                    >
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
                        value={state.searchQuery}
                        onChange={(e) => setState((prev) => ({ ...prev, searchQuery: e.target.value }))}
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

                {/* Dashboard Stats */}
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={6} mb={8}>
                    <Card 
                        bg={cardBg}
                        backdropFilter="blur(10px)"
                        border="1px solid" 
                        borderColor={cardBorder}
                        borderRadius="xl"
                        p={4}
                        _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                        transition="all 0.2s ease"
                    >
                        <VStack spacing={1}>
                            <Icon as={Activity} boxSize={5} color="purple.500" />
                            <Text fontSize="2xl" fontWeight="bold">
                                {state.dashboardStats.activeCampaigns}
                            </Text>
                            <Text fontSize="xs" color="gray.600">Active Campaigns</Text>
                        </VStack>
                    </Card>

                    <Card 
                        bg={cardBg}
                        backdropFilter="blur(10px)"
                        border="1px solid" 
                        borderColor={cardBorder}
                        borderRadius="xl"
                        p={4}
                        _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                        transition="all 0.2s ease"
                    >
                        <VStack spacing={1}>
                            <Icon as={Users} boxSize={5} color="green.500" />
                            <Text fontSize="2xl" fontWeight="bold">
                                {state.dashboardStats.totalLeads}
                            </Text>
                            <Text fontSize="xs" color="gray.600">Total Leads</Text>
                        </VStack>
                    </Card>

                    <Card 
                        bg={cardBg}
                        backdropFilter="blur(10px)"
                        border="1px solid" 
                        borderColor={cardBorder}
                        borderRadius="xl"
                        p={4}
                        _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                        transition="all 0.2s ease"
                    >
                        <VStack spacing={1}>
                            <Icon as={MessageCircle} boxSize={5} color="blue.500" />
                            <Text fontSize="2xl" fontWeight="bold">
                                {state.dashboardStats.totalMessages}
                            </Text>
                            <Text fontSize="xs" color="gray.600">Messages Sent</Text>
                        </VStack>
                    </Card>

                    <Card 
                        bg={cardBg}
                        backdropFilter="blur(10px)"
                        border="1px solid" 
                        borderColor={cardBorder}
                        borderRadius="xl"
                        p={4}
                        _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                        transition="all 0.2s ease"
                    >
                        <VStack spacing={1}>
                            <Icon as={TrendingUp} boxSize={5} color="orange.500" />
                            <Text fontSize="2xl" fontWeight="bold">
                                {state.dashboardStats.responseRate}%
                            </Text>
                            <Text fontSize="xs" color="gray.600">Response Rate</Text>
                        </VStack>
                    </Card>
                </SimpleGrid>

                {/* Campaigns Section */}
                <Box>

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
                                        createdAt={campaign.createdAt}
                                        onClick={() => router.push(`/campaigns/${campaign.id}`)}
                                        onMenuClick={() => {
                                            // For now, just navigate to campaign view
                                            router.push(`/campaigns/${campaign.id}`)
                                        }}
                                    />
                                ))}
                            </Grid>

                            {filteredCampaigns.length === 0 && state.searchQuery && (
                                <Box textAlign="center" py={12}>
                                    <Text color="gray.500" fontSize="lg">
                                        No campaigns found matching &quot;{state.searchQuery}&quot;
                                    </Text>
                                </Box>
                            )}

                            {state.campaigns.length === 0 && (
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
                </Box>
            </VStack>
        </DashboardLayout>
    )
}

// Sample campaign data
const sampleCampaigns: Campaign[] = [
    {
        id: '1',
        name: 'Tech Companies 50/150',
        type: 'Standard',
        leads: { current: 290, total: 12863 },
        createdAt: '2024-08-01T00:00:00Z',
        status: 'active'
    },
    {
        id: '2',
        name: 'Web Visitor',
        type: 'Watchtower',
        leads: { current: 213, total: 8026 },
        createdAt: '2024-07-25T00:00:00Z',
        status: 'active'
    },
    {
        id: '3',
        name: 'Belmar',
        type: 'Standard',
        leads: { current: 0, total: 3180 },
        createdAt: '2024-07-20T00:00:00Z',
        status: 'active'
    },
    {
        id: '4',
        name: 'Cambray',
        type: 'Standard',
        leads: { current: 0, total: 15526 },
        createdAt: '2024-07-15T00:00:00Z',
        status: 'active'
    }
]