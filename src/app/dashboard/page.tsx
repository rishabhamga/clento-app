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
    Button,
    IconButton,
    Tooltip
} from '@chakra-ui/react'
import { Search, Activity, Users, MessageCircle, TrendingUp, Plus, ArrowLeft } from 'lucide-react'
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

    const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
    
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

    // Agent configuration
    const agentConfig = {
        'ai-sdr': {
            name: 'AI SDR',
            color: 'purple.500',
            gradient: 'linear(to-r, purple.400, blue.400)',
            entityName: 'Leads',
            entityNameSingle: 'Lead',
            campaignName: 'Campaigns',
            campaignType: 'outreach campaigns',
            actionText: 'Create a Campaign',
            description: 'Manage your outreach campaigns and track performance',
            statLabels: {
                activeCampaigns: 'Active Campaigns',
                totalEntities: 'Total Leads',
                totalMessages: 'Messages Sent',
                responseRate: 'Response Rate'
            }
        },
        'ai-marketer': {
            name: 'Marketer AI',
            color: 'blue.500',
            gradient: 'linear(to-r, blue.400, blue.600)',
            entityName: 'Contacts',
            entityNameSingle: 'Contact',
            campaignName: 'Marketing Campaigns',
            campaignType: 'marketing campaigns',
            actionText: 'Create Marketing Campaign',
            description: 'Manage your marketing campaigns and track engagement',
            statLabels: {
                activeCampaigns: 'Active Campaigns',
                totalEntities: 'Total Contacts',
                totalMessages: 'Campaigns Sent',
                responseRate: 'Engagement Rate'
            }
        },
        'ai-recruiter': {
            name: 'AI Recruiter',
            color: 'green.500',
            gradient: 'linear(to-r, green.400, green.600)',
            entityName: 'Candidates',
            entityNameSingle: 'Candidate',
            campaignName: 'Recruitment Campaigns',
            campaignType: 'recruitment campaigns',
            actionText: 'Create Recruitment Campaign',
            description: 'Manage your recruitment campaigns and track candidate responses',
            statLabels: {
                activeCampaigns: 'Active Campaigns',
                totalEntities: 'Total Candidates',
                totalMessages: 'Outreach Sent',
                responseRate: 'Response Rate'
            }
        },
        'ai-sales-buddy': {
            name: 'Conversation Intelligence AI',
            color: 'orange.500',
            gradient: 'linear(to-r, orange.400, orange.600)',
            entityName: 'Call Preparations',
            entityNameSingle: 'Call Prep',
            campaignName: 'Sales Prep Sessions',
            campaignType: 'call preparation sessions',
            actionText: 'Create Prep Session',
            description: 'Manage your call preparations and track sales performance',
            statLabels: {
                activeCampaigns: 'Active Sessions',
                totalEntities: 'Total Preps',
                totalMessages: 'Insights Generated',
                responseRate: 'Success Rate'
            }
        },
        'asset-inventory-agent': {
            name: 'Asset Inventory AI',
            color: 'red.500',
            gradient: 'linear(to-r, red.400, red.600)',
            entityName: 'Assets',
            entityNameSingle: 'Asset',
            campaignName: 'Security Queries',
            campaignType: 'security assessments',
            actionText: 'Create Security Query',
            description: 'Query asset inventory and manage security assessments',
            statLabels: {
                activeCampaigns: 'Active Queries',
                totalEntities: 'Total Assets',
                totalMessages: 'Scans Completed',
                responseRate: 'Issues Found'
            }
        }
    }

    const currentAgent = selectedAgent && agentConfig[selectedAgent as keyof typeof agentConfig] 
        ? agentConfig[selectedAgent as keyof typeof agentConfig] 
        : agentConfig['ai-sdr'] // Default to AI SDR

    const searchBg = useColorModeValue('white', 'gray.800')
    const searchBorder = useColorModeValue('gray.200', 'gray.700')
    const cardBg = useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(26, 32, 44, 0.8)')
    const cardBorder = useColorModeValue('rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)')

    const handleCreateCampaign = () => {
        localStorage.removeItem('campaignTargeting')
        localStorage.removeItem('campaignPitchData')
        localStorage.removeItem('campaignOutreachData')
        localStorage.removeItem('campaignWorkflow')
        localStorage.removeItem('campaignLaunch')
        localStorage.removeItem('selectedLeads')
        router.push('/campaigns/new')
    }

    // Load selected agent from localStorage
    useEffect(() => {
        const savedAgent = localStorage.getItem('selectedAgent')
        if (savedAgent && agentConfig[savedAgent as keyof typeof agentConfig]) {
            setSelectedAgent(savedAgent)
        } else {
            // Default to AI SDR if no agent is selected or invalid agent
            setSelectedAgent('ai-sdr')
        }
    }, [])

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
                    profile: data.profile || { completed: true }, // Default to completed if no profile
                    loading: false
                }))
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



    const filteredCampaigns = state.campaigns.filter((campaign) => {
        // Filter by search query
        const matchesSearch = campaign.name.toLowerCase().includes(state.searchQuery.toLowerCase())
        
        // Filter by selected agent - check the campaign's selectedAgent setting
        const campaignAgent = state.dbCampaigns.find(dbCampaign => dbCampaign.id === campaign.id)?.settings?.selectedAgent || 'ai-sdr'
        const matchesAgent = campaignAgent === selectedAgent
        
        return matchesSearch && matchesAgent
    })

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

    return (
        <DashboardLayout>
            <VStack spacing={8} align="stretch">
                {/* Dynamic Header based on selected agent */}
                <HStack justify="space-between" align="center">
                    <HStack spacing={4} align="center">
                        <Tooltip label="Back to Agent Selection" placement="bottom">
                            <IconButton
                                aria-label="Back to agents"
                                icon={<ArrowLeft size={16} />}
                                size="sm"
                                variant="ghost"
                                color="gray.500"
                                _hover={{ 
                                    color: "gray.700", 
                                    bg: "gray.100" 
                                }}
                                onClick={() => router.push('/')}
                            />
                        </Tooltip>
                        <VStack spacing={1} align="start">
                            <Heading
                                size="xl"
                                bgGradient={currentAgent.gradient}
                                bgClip="text"
                                fontWeight="bold"
                            >
                                {currentAgent.campaignName}
                            </Heading>
                            <Text color="gray.600" fontSize="lg">
                                {currentAgent.description}
                            </Text>
                        </VStack>
                    </HStack>
                    <GradientButton
                        leftIcon={<Plus size={16} />}
                        variant="primary"
                        size="lg"
                        onClick={() => handleCreateCampaign()}
                    >
                        {currentAgent.actionText}
                    </GradientButton>
                </HStack>

                {/* Search Bar */}
                <InputGroup maxW="400px" mb={6}>
                    <InputLeftElement>
                        <Icon as={Search} boxSize={5} color="gray.400" />
                    </InputLeftElement>
                    <Input
                        placeholder={`Search ${currentAgent.campaignType}`}
                        value={state.searchQuery}
                        onChange={(e) => setState((prev) => ({ ...prev, searchQuery: e.target.value }))}
                        bg={searchBg}
                        border="1px"
                        borderColor={searchBorder}
                        borderRadius="lg"
                        _focus={{
                            borderColor: currentAgent.color,
                            boxShadow: `0 0 0 1px var(--chakra-colors-${currentAgent.color.replace('.', '-')})`
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
                            <Icon as={Activity} boxSize={5} color={currentAgent.color} />
                            <Text fontSize="2xl" fontWeight="bold">
                                {state.dashboardStats.activeCampaigns}
                            </Text>
                            <Text fontSize="xs" color="gray.600">{currentAgent.statLabels.activeCampaigns}</Text>
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
                            <Text fontSize="xs" color="gray.600">{currentAgent.statLabels.totalEntities}</Text>
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
                            <Text fontSize="xs" color="gray.600">{currentAgent.statLabels.totalMessages}</Text>
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
                            <Text fontSize="xs" color="gray.600">{currentAgent.statLabels.responseRate}</Text>
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
                        {filteredCampaigns.map((campaign) => {
                            const dbCampaign = state.dbCampaigns.find(dbCampaign => dbCampaign.id === campaign.id)
                            const agentType = dbCampaign?.settings?.selectedAgent || 'ai-sdr'
                            
                            return (
                                <CampaignCard
                                    key={campaign.id}
                                    id={campaign.id}
                                    name={campaign.name}
                                    type={campaign.type}
                                    agentType={agentType}
                                    leads={campaign.leads}
                                    createdAt={campaign.createdAt}
                                    onClick={() => router.push(`/campaigns/${campaign.id}`)}
                                    onMenuClick={() => {
                                        // For now, just navigate to campaign view
                                        router.push(`/campaigns/${campaign.id}`)
                                    }}
                                    onDelete={(deletedId) => {
                                        // Remove the deleted campaign from the state
                                        setState(prev => ({
                                            ...prev,
                                            campaigns: prev.campaigns.filter(c => c.id !== deletedId),
                                            dbCampaigns: prev.dbCampaigns.filter(c => c.id !== deletedId)
                                        }))
                                    }}
                                />
                            )
                        })}
                    </Grid>

                    {filteredCampaigns.length === 0 && state.searchQuery && (
                        <Box textAlign="center" py={12}>
                            <Text color="gray.500" fontSize="lg">
                                No {currentAgent.campaignType} found matching &quot;{state.searchQuery}&quot;
                            </Text>
                        </Box>
                    )}

                    {state.campaigns.length === 0 && (
                        <Box textAlign="center" py={12}>
                            <VStack spacing={4}>
                                <Text color="gray.500" fontSize="lg">
                                    {organization
                                        ? `No ${currentAgent.campaignType} yet in ${organization.name}. Create your first ${currentAgent.campaignType.slice(0, -1)} to get started!`
                                        : `No ${currentAgent.campaignType} yet. Create your first ${currentAgent.campaignType.slice(0, -1)} to get started!`
                                    }
                                </Text>
                                <GradientButton onClick={() => router.push('/campaigns/new')}>
                                    {currentAgent.actionText}
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