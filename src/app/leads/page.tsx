'use client'

import {
    Box,
    Container,
    VStack,
    Heading,
    Text,
    Card,
    CardBody,
    Badge,
    HStack,
    Avatar,
    Select,
    useColorModeValue,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    Icon,
    useToast,
    Spinner,
    Spacer,
    SimpleGrid,
    Progress,
    Flex,
    Wrap,
    WrapItem,
    Button,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableContainer,
    IconButton,
    Tooltip,
    Input,
    InputGroup,
    InputLeftElement
} from '@chakra-ui/react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { GradientButton } from '@/components/ui/GradientButton'
import {
    Search,
    Filter,
    Download,
    Plus,
    CheckCircle,
    Mail,
    Linkedin,
    Clock,
    TrendingUp,
    Users,
    Activity,
    Star,
    AlertCircle,
    MessageCircle,
    Eye,
    ChevronLeft,
    ChevronRight,
    ExternalLink
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    LeadWithSyndieData,
    LeadListResponse,
    LeadStats,
    LeadFilters,
    LinkedInConnectionStatus,
    LeadActivityTimeline
} from '@/types/syndie'
import { timeStamp } from 'console'

// Helper functions
function getConnectionStatusColor(status: LinkedInConnectionStatus): string {
    switch (status) {
        case 'connected': return 'green'
        case 'replied': return 'blue'
        case 'pending': return 'yellow'
        case 'bounced': return 'red'
        case 'not_interested': return 'gray'
        default: return 'gray'
    }
}

function getStatusColor(status: string): string {
    switch (status) {
        case 'replied': return 'green'
        case 'positive': return 'green'
        case 'contacted': return 'blue'
        case 'new': return 'purple'
        case 'negative': return 'red'
        case 'unsubscribed': return 'gray'
        default: return 'gray'
    }
}

function formatConnectionStatus(status: LinkedInConnectionStatus): string {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const emailSet = {
    "akshay@shakedeal.com": [
        {
            action: "email_sent",
            message: `Subject: Congrats on ShakeDeal’s loyalty feature launch, Akshay

Hi Akshay,

Huge congrats on ShakeDeal’s new loyalty rewards feature after your latest funding round! It’s fantastic to see innovation in customer engagement space—how has user uptake been so far?

At Clento, we help scale loyalty and retention efforts through AI-powered SDR that streamlines outreach and enriches prospects—cutting manual effort while improving engagement.

Would love to connect and swap ideas on AI-led growth strategies. Open to it?

Best,
Heena
`,
            timestamp: "2025-07-08T02:07:00.000Z",
            stepNodeId: "step_001"
        },
        {
            action: "email_sent",
            message: `Subject: Re: ShakeDeal’s loyalty launch

Hi Akshay,

Following up—ShakeDeal’s loyalty feature launch sounds like a game-changer for engagement. Anything surprising in how users are reacting?

We’ve supported similar launches where AI outreach helped onboard 30% more pilot users quickly. Happy to share strategy ideas if it’s helpful.

Best,
Heena
`,
            timestamp: "2025-07-09T13:41:00.000Z",
            stepNodeId: "step_002"
        },
        {
            action: "email_sent",
            message: `Subject: AI for loyalty rollout?

Hi Akshay,

Hope things are going well! Got me thinking—customers who opt into loyalty schemes often also respond well to personal messages. Clento helps create highly relevant outreach to drive that engagement at scale.

Mind if we chat for 10 mins to sketch something out?

Warm regards,
Heena
`,
            timestamp: "2025-07-11T05:03:00.000Z",
            stepNodeId: "step_003"
        },
        {
            action: "reply recieved",
            message: `Subject: Re: One last thing…

Hi Heena,

Apologies for the silence—I’ve been busy with our new rollout. That campaign mockup sounds interesting! Can you send it over? I’d love to see how your AI messaging could align with what we’re doing at ShakeDeal.

Best regards,
Akshay Hegde
Co-Founder & Managing Director, ShakeDeal
`,
            timestamp: "2025-07-14T07:34:00.000Z",
            stepNodeId: "step_005"
        }
    ],
    // "manoj@cubiclogics.com": [
    //     {
    //         action: "email_sent",
    //         message: "Hey Manoj, I’ve been following Cubic Logics' innovative work in tech solutions, especially how you’re helping clients scale with data and automation. At Clento, we’re building something similar — AI-driven SDR workflows that handle everything from intent data to personalized outreach. I’d love to hear your thoughts on how you think such tech could be integrated into your operations.",
    //         timestamp: "2025-07-12T00:00:00.000Z",
    //         stepNodeId: "step_007"
    //     },
    //     {
    //         action: "email_sent",
    //         message: "Thanks for the connect, Manoj! I was wondering — how much time does your team spend managing different tools for your sales process? CRM, enrichment, copy, delivery, etc.? We’ve been testing a streamlined stack that integrates all these components into one. If this sounds like something you’re exploring for your GTM ops, I’d be happy to share how we’ve been making this work for clients in the tech space.",
    //         timestamp: "2025-07-14T00:00:00.000Z",
    //         stepNodeId: "step_008"
    //     },
    //     {
    //         action: "email_sent",
    //         message: "I’ve seen how companies like Cubic Logics are transforming their outreach and thought you might find this interesting. Clento helps teams find warm leads, personalize their messaging, and launch campaigns without extra tools or manual effort. Users are saving ₹5-6L/month and consistently booking 15+ demos ahead of schedule. I’ve recorded a quick 90-second Loom video explaining how it works. Would you like to check it out?",
    //         timestamp: "2025-07-16T00:00:00.000Z",
    //         stepNodeId: "step_009"
    //     },
    // ],
    "marco@halo.live": [
        {
            action: "email_sent",
            message: `Subject: Congrats on Halo's UK push, Marco

Hi Marco,

Congrats on Halo's expanding into the UK—awesome move! Breaking into new markets is always a big milestone. How have local partners or founders responded so far?

At Clento, we’ve built an AI sales development platform that simplifies scaling outreach—automating prospecting, enrichment, and follow-ups to support expansion without adding headcount.

Would love to connect and talk about how AI-powered tools can help you build that initial pipeline in new regions.

Best,
Heena
`,
            timestamp: "2025-07-03T06:35:00.000Z",
            stepNodeId: "step_011"
        },
        {
            action: "email_sent",
            message: `Subject: Thoughts on UK FinTech prospects?

Hi Marco,

Just circling back—your UK expansion with Halo has really potential. Found anything surprising in the local FinTech space?

We’ve supported finance teams entering new markets with AI-driven SDR that helped them engage 20% more prospects early on. Happy to share examples if you’d like.

Best,
Heena
`,
            timestamp: "2025-07-06T08:23:00.000Z",
            stepNodeId: "step_012"
        },
        {
            action: "email_sent",
            message: `Subject: Last note—UK outreach help?

Hey Marco,

Not sure if now’s perchance too busy, but wanted to check if I could send over a tailored mock campaign draft—just 10 mins, no strings—showcasing how Clento would approach outreach for your UK launch.

Let me know!

Cheers,
Heena
`,
            timestamp: "2025-07-08T07:54:00.000Z",
            stepNodeId: "step_012"
        }
    ],
    "bhargav@intellicar.in": [
        {
            action: "email_sent",
            message: `Subject: Congrats on Intellicar’s AI diagnostic module, Bhargav
Hi Bhargav,

Congratulations on Intellicar’s launch of the new AI vehicle diagnostics feature—super exciting to see that kind of innovation in India’s auto-tech scene! How’s the initial feedback from customers been?

As CBO, I know orchestrating product rollouts and capturing early adoption insights can feel like juggling multiple moving parts. At Clento, we’ve built an AI-powered SDR platform that integrates prospecting, enrichment, and multi-channel outreach into one streamlined workflow—helping teams like yours save time and stay nimble.

Would love to connect and swap ideas on how AI is reshaping operations in mobility. Up for a quick chat?

Best regards,
Heena Bhardwaj
Business Development Manager at Clento
`,
            timestamp: "2025-07-03T00:00:00.000Z",
            stepNodeId: "step_017"
        },
        {
            action: "email_sent",
            message: `Subject: Still interested, Bhargav?

Hi Bhargav,

Just wanted to drop one final note on this—your AI diagnostics suite is seriously impressive, and I believe Clento could help you engage more shops/fleets without extra headcount.

If you’d like, I can pull together a quick mock campaign based on Intellicar’s launch—just to visualize the value.

Let me know either way, and thanks for your time!

Cheers,
Heena
`,
            timestamp: "2025-07-06T00:00:00.000Z",
            stepNodeId: "step_018"
        }
    ]

}

export default function LeadsPage() {
    const router = useRouter()
    const cardBg = useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(26, 32, 44, 0.8)')
    const glassBg = useColorModeValue('rgba(255, 255, 255, 0.1)', 'rgba(26, 32, 44, 0.1)')
    const borderColor = useColorModeValue('rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)')
    const { isOpen, onOpen, onClose } = useDisclosure()
    const toast = useToast()

    // State management
    const [leads, setLeads] = useState<LeadWithSyndieData[]>([])
    const [stats, setStats] = useState<LeadStats | null>(null)
    const [selectedLead, setSelectedLead] = useState<LeadWithSyndieData | null>(null)
    const [selectedLeadTimeline, setSelectedLeadTimeline] = useState<LeadActivityTimeline | null>(null)
    const [loading, setLoading] = useState(false)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalLeads, setTotalLeads] = useState(0)

    // Filter state
    const [filters, setFilters] = useState<LeadFilters>({})
    const [searchTerm, setSearchTerm] = useState('')

    // Handle search
    const handleSearch = (value: string) => {
        setSearchTerm(value)
        const updatedFilters = { ...filters, search: value || undefined }
        setFilters(updatedFilters)
        fetchLeads(1, updatedFilters)
    }

    // Fetch leads with current filters and pagination
    const fetchLeads = async (newPage = 1, newFilters = filters) => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                page: newPage.toString(),
                limit: '15',
                ...(newFilters.status && { status: newFilters.status.join(',') }),
                ...(newFilters.connectionStatus && { connectionStatus: newFilters.connectionStatus.join(',') }),
                ...(newFilters.account && { account: newFilters.account }),
                ...(newFilters.campaign && { campaign: newFilters.campaign }),
                ...(newFilters.search && { search: newFilters.search }),
            })

            const response = await fetch(`/api/leads?${params}`)
            if (!response.ok) throw new Error('Failed to fetch leads')

            const result = await response.json()
            if (result.success) {
                setLeads(result.data.leads)
                setPage(result.data.pagination.page)
                setTotalPages(result.data.pagination.totalPages)
                setTotalLeads(result.data.pagination.total || 0)
            }
        } catch (error) {
            console.error('Error fetching leads:', error)
            toast({
                title: 'Error',
                description: 'Failed to fetch leads',
                status: 'error',
                duration: 3000,
                isClosable: true,
            })
        }
        setLoading(false)
    }

    // Fetch lead statistics
    const fetchStats = async () => {
        try {
            const response = await fetch('/api/leads?stats=true')
            if (!response.ok) throw new Error('Failed to fetch stats')

            const result = await response.json()
            if (result.success) {
                setStats(result.data)
            }
        } catch (error) {
            console.error('Error fetching stats:', error)
        }
    }

    // Handle lead selection for detail view
    const handleLeadSelect = async (lead: LeadWithSyndieData) => {
        setSelectedLead(lead)
        try {
            const response = await fetch(`/api/leads/${lead.id}`)
            if (!response.ok) throw new Error('Failed to fetch lead details')

            const result = await response.json()
            if (result.success) {
                setSelectedLeadTimeline(result.data.timeline)
            }
        } catch (error) {
            console.error('Error fetching lead details:', error)
        }
        onOpen()
    }

    // Handle filter changes
    const handleFilterChange = (newFilters: Partial<LeadFilters>) => {
        const updatedFilters = { ...filters, ...newFilters }
        setFilters(updatedFilters)
        fetchLeads(1, updatedFilters)
    }



    // Initial data fetch
    useEffect(() => {
        fetchLeads()
        fetchStats()
    }, [])

    return (
        <DashboardLayout>
            <Container maxW="7xl" py={8}>
                <VStack spacing={8} align="stretch">
                    {/* Header Section */}
                    <Box>
                        <HStack justify="space-between" align="center" mb={6}>
                            <VStack spacing={1} align="start">
                                <Heading
                                    size="xl"
                                    bgGradient="linear(to-r, purple.400, blue.400)"
                                    bgClip="text"
                                    fontWeight="bold"
                                >
                                    Lead Management
                                </Heading>
                                <Text color="gray.600" fontSize="lg">
                                    Track and manage your outreach leads
                                </Text>
                            </VStack>
                            <HStack spacing={3}>
                                <GradientButton
                                    leftIcon={<Download size={16} />}
                                    variant="tertiary"
                                    size="sm"
                                >
                                    Export
                                </GradientButton>
                                <GradientButton
                                    leftIcon={<Plus size={16} />}
                                    variant="primary"
                                    size="sm"
                                    onClick={() => router.push('/campaigns/new')}
                                >
                                    New Campaign
                                </GradientButton>
                            </HStack>
                        </HStack>
                    </Box>

                    {/* Stats Overview */}
                    {stats && (
                        <SimpleGrid columns={{ base: 2, md: 6 }} spacing={6}>
                            <Card
                                bg={cardBg}
                                border="1px solid"
                                borderColor={borderColor}
                                borderRadius="xl"
                                p={4}
                                _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                                transition="all 0.2s ease"
                            >
                                <VStack spacing={1}>
                                    <Icon as={Users} boxSize={5} color="purple.500" />
                                    <Text fontSize="2xl" fontWeight="bold">
                                        {stats.total}
                                    </Text>
                                    <Text fontSize="xs" color="gray.600">Total Leads</Text>
                                </VStack>
                            </Card>

                            <Card
                                bg={cardBg}
                                border="1px solid"
                                borderColor={borderColor}
                                borderRadius="xl"
                                p={4}
                                _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                                transition="all 0.2s ease"
                            >
                                <VStack spacing={1}>
                                    <Icon as={Linkedin} boxSize={5} color="green.500" />
                                    <Text fontSize="2xl" fontWeight="bold">
                                        {stats.byConnectionStatus.connected + stats.byConnectionStatus.replied}
                                    </Text>
                                    <Text fontSize="xs" color="gray.600">Connected</Text>
                                </VStack>
                            </Card>

                            <Card
                                bg={cardBg}
                                border="1px solid"
                                borderColor={borderColor}
                                borderRadius="xl"
                                p={4}
                                _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                                transition="all 0.2s ease"
                            >
                                <VStack spacing={1}>
                                    <Icon as={MessageCircle} boxSize={5} color="blue.500" />
                                    <Text fontSize="2xl" fontWeight="bold">
                                        {stats.byConnectionStatus.replied}
                                    </Text>
                                    <Text fontSize="xs" color="gray.600">Replied</Text>
                                </VStack>
                            </Card>

                            <Card
                                bg={cardBg}
                                border="1px solid"
                                borderColor={borderColor}
                                borderRadius="xl"
                                p={4}
                                _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                                transition="all 0.2s ease"
                            >
                                <VStack spacing={1}>
                                    <Icon as={Activity} boxSize={5} color="orange.500" />
                                    <Text fontSize="2xl" fontWeight="bold">
                                        {stats.activeAutomations}
                                    </Text>
                                    <Text fontSize="xs" color="gray.600">Active</Text>
                                </VStack>
                            </Card>

                            <Card
                                bg={cardBg}
                                border="1px solid"
                                borderColor={borderColor}
                                borderRadius="xl"
                                p={4}
                                _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                                transition="all 0.2s ease"
                            >
                                <VStack spacing={1}>
                                    <Icon as={TrendingUp} boxSize={5} color="purple.500" />
                                    <Text fontSize="2xl" fontWeight="bold">
                                        {stats.newThisWeek}
                                    </Text>
                                    <Text fontSize="xs" color="gray.600">This Week</Text>
                                </VStack>
                            </Card>

                            <Card
                                bg={cardBg}
                                border="1px solid"
                                borderColor={borderColor}
                                borderRadius="xl"
                                p={4}
                                _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                                transition="all 0.2s ease"
                            >
                                <VStack spacing={1}>
                                    <Icon as={Clock} boxSize={5} color="gray.500" />
                                    <Text fontSize="2xl" fontWeight="bold">
                                        {stats.recentActivity}
                                    </Text>
                                    <Text fontSize="xs" color="gray.600">Recent</Text>
                                </VStack>
                            </Card>
                        </SimpleGrid>
                    )}

                    {/* Filters and Search */}
                    <Card
                        bg={cardBg}
                        backdropFilter="blur(10px)"
                        border="1px solid"
                        borderColor={borderColor}
                        borderRadius="xl"
                        shadow="lg"
                        px={6}
                        py={3}
                    >
                        <HStack spacing={6} align="end" justify="start">
                            <Text 
                                fontSize="sm" 
                                fontWeight="bold" 
                                bgGradient="linear(to-r, purple.400, blue.400)"
                                bgClip="text"
                                mb={2}
                            >
                                Filter Leads
                            </Text>
                            
                            <Box>
                                <Text 
                                    fontSize="xs" 
                                    fontWeight="semibold" 
                                    color="gray.500" 
                                    textTransform="uppercase"
                                    letterSpacing="wider"
                                    mb={1}
                                >
                                    Search
                                </Text>
                                <InputGroup size="lg">
                                    <InputLeftElement pointerEvents="none">
                                        <Icon as={Search} color="gray.500" boxSize={5} />
                                    </InputLeftElement>
                                    <Input
                                        placeholder="Search leads by name, email, or company..."
                                        value={searchTerm}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        bg={glassBg}
                                        border="1px solid"
                                        borderColor={borderColor}
                                        borderRadius="lg"
                                        fontSize="md"
                                        _hover={{ borderColor: 'purple.300' }}
                                        _focus={{
                                            borderColor: 'purple.400',
                                            boxShadow: '0 0 0 1px var(--chakra-colors-purple-400)',
                                            bg: 'white'
                                        }}
                                    />
                                </InputGroup>
                            </Box>

                            {/* Filter Options */}
                            <Box width="100%">
                                <HStack justify="space-between" mb={4}>
                                    <Text fontSize="sm" fontWeight="semibold" color="gray.600">
                                        Filter Options
                                    </Text>
                                    <Button
                                        leftIcon={<Filter size={16} />}
                                        variant="ghost"
                                        size="sm"
                                        color="purple.500"
                                        _hover={{ bg: glassBg }}
                                    >
                                        Advanced Filters
                                    </Button>
                                </HStack>

                                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                                    <VStack align="stretch" spacing={2}>
                                        <Text fontSize="xs" fontWeight="medium" color="gray.500" textTransform="uppercase">
                                            Connection Status
                                        </Text>
                                        <Select
                                            placeholder="All Statuses"
                                            size="md"
                                            bg={glassBg}
                                            border="1px solid"
                                            borderColor={borderColor}
                                            borderRadius="lg"
                                            _hover={{ borderColor: 'purple.300' }}
                                            _focus={{
                                                borderColor: 'purple.400',
                                                boxShadow: '0 0 0 1px var(--chakra-colors-purple-400)'
                                            }}
                                            onChange={(e) => handleFilterChange({
                                                connectionStatus: e.target.value ? [e.target.value as LinkedInConnectionStatus] : undefined
                                            })}
                                        >
                                            <option value="not_connected">Not Connected</option>
                                            <option value="pending">Pending</option>
                                            <option value="connected">Connected</option>
                                            <option value="replied">Replied</option>
                                            <option value="bounced">Bounced</option>
                                            <option value="not_interested">Not Interested</option>
                                        </Select>
                                    </VStack>

                                    <VStack align="stretch" spacing={2}>
                                        <Text fontSize="xs" fontWeight="medium" color="gray.500" textTransform="uppercase">
                                            Account (Seat)
                                        </Text>
                                        <Select
                                            placeholder="All Accounts"
                                            size="md"
                                            bg={glassBg}
                                            border="1px solid"
                                            borderColor={borderColor}
                                            borderRadius="lg"
                                            _hover={{ borderColor: 'purple.300' }}
                                            _focus={{
                                                borderColor: 'purple.400',
                                                boxShadow: '0 0 0 1px var(--chakra-colors-purple-400)'
                                            }}
                                            onChange={(e) => handleFilterChange({
                                                account: e.target.value || undefined
                                            })}
                                        >
                                            <option value="account1">Account 1</option>
                                            <option value="account2">Account 2</option>
                                            <option value="account3">Account 3</option>
                                        </Select>
                                    </VStack>

                                    <VStack align="stretch" spacing={2}>
                                        <Text fontSize="xs" fontWeight="medium" color="gray.500" textTransform="uppercase">
                                            Campaign
                                        </Text>
                                        <Select
                                            placeholder="All Campaigns"
                                            size="md"
                                            bg={glassBg}
                                            border="1px solid"
                                            borderColor={borderColor}
                                            borderRadius="lg"
                                            _hover={{ borderColor: 'purple.300' }}
                                            _focus={{
                                                borderColor: 'purple.400',
                                                boxShadow: '0 0 0 1px var(--chakra-colors-purple-400)'
                                            }}
                                            onChange={(e) => handleFilterChange({
                                                campaign: e.target.value || undefined
                                            })}
                                        >
                                            <option value="campaign1">Campaign 1</option>
                                            <option value="campaign2">Campaign 2</option>
                                            <option value="campaign3">Campaign 3</option>
                                        </Select>
                                    </VStack>
                                </SimpleGrid>
                            </Box>
                        </HStack>
                    </Card>

                    {/* Lead Detail Modal */}
                    <Modal isOpen={isOpen} onClose={onClose} size="4xl">
                        <ModalOverlay backdropFilter="blur(10px)" />
                        <ModalContent bg={cardBg} borderRadius="xl">
                            <ModalHeader>
                                <HStack spacing={4}>
                                    <Avatar size="lg" name={selectedLead?.full_name} />
                                    <VStack align="start" spacing={1}>
                                        <Heading size="lg">{selectedLead?.full_name}</Heading>
                                        <Text color="gray.600">{selectedLead?.title}</Text>
                                        <HStack spacing={2}>
                                            <Badge
                                                colorScheme={getConnectionStatusColor(selectedLead?.linkedin_connection_status || 'not_connected')}
                                                variant="subtle"
                                            >
                                                {formatConnectionStatus(selectedLead?.linkedin_connection_status || 'not_connected')}
                                            </Badge>
                                            {selectedLead?.source === 'syndie' && (
                                                <Badge colorScheme="purple" variant="subtle">
                                                    Automation
                                                </Badge>
                                            )}
                                        </HStack>
                                    </VStack>
                                </HStack>
                            </ModalHeader>
                            <ModalCloseButton />
                            <ModalBody pb={6}>
                                {selectedLead && (
                                    <VStack spacing={6} align="stretch">
                                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                                            <VStack spacing={4} align="stretch">
                                                <Box>
                                                    <Text fontWeight="semibold" mb={2}>Contact Information</Text>
                                                    <VStack spacing={2} align="stretch">
                                                        <HStack>
                                                            <Icon as={Mail} boxSize={4} color="gray.500" />
                                                            <Text fontSize="sm">{selectedLead.email || 'No email'}</Text>
                                                        </HStack>
                                                        <HStack>
                                                            <Icon as={Linkedin} boxSize={4} color="blue.500" />
                                                            <Text
                                                                as="a"
                                                                href={selectedLead.linkedin_url || '#'}
                                                                target="_blank"
                                                                color="blue.500"
                                                                fontSize="sm"
                                                                _hover={{ textDecoration: 'underline' }}
                                                            >
                                                                LinkedIn Profile
                                                            </Text>
                                                        </HStack>
                                                        {selectedLead.location && (
                                                            <HStack>
                                                                <Text fontWeight="semibold" fontSize="sm">Location:</Text>
                                                                <Text fontSize="sm">{selectedLead.location}</Text>
                                                            </HStack>
                                                        )}
                                                    </VStack>
                                                </Box>
                                            </VStack>

                                            <VStack spacing={4} align="stretch">
                                                <Box>
                                                    <Text fontWeight="semibold" mb={2}>Automation Progress</Text>
                                                    <VStack spacing={3} align="stretch">
                                                        <HStack justify="space-between">
                                                            <Text fontSize="sm">Connection Progress</Text>
                                                            <Text fontWeight="bold" fontSize="sm">
                                                                {selectedLead.connectionProgress || 0}%
                                                            </Text>
                                                        </HStack>
                                                        <Progress
                                                            value={selectedLead.connectionProgress || 0}
                                                            colorScheme="purple"
                                                            borderRadius="md"
                                                        />
                                                        <SimpleGrid columns={3} spacing={4}>
                                                            <VStack>
                                                                <Text fontSize="lg" fontWeight="bold">
                                                                    {selectedLead.totalSteps || 0}
                                                                </Text>
                                                                <Text fontSize="xs" color="gray.600">Total Steps</Text>
                                                            </VStack>
                                                            <VStack>
                                                                <Text fontSize="lg" fontWeight="bold" color="green.500">
                                                                    {selectedLead.completedSteps || 0}
                                                                </Text>
                                                                <Text fontSize="xs" color="gray.600">Completed</Text>
                                                            </VStack>
                                                            <VStack>
                                                                <Text fontSize="lg" fontWeight="bold" color="red.500">
                                                                    {selectedLead.failedSteps || 0}
                                                                </Text>
                                                                <Text fontSize="xs" color="gray.600">Failed</Text>
                                                            </VStack>
                                                        </SimpleGrid>
                                                    </VStack>
                                                </Box>
                                            </VStack>
                                        </SimpleGrid>

                                        {/* Activity Timeline */}
                                        {selectedLeadTimeline?.steps && (
                                            <Box>
                                                <VStack spacing={6} align="stretch" maxH="300px" overflow="auto">
                                                    {/* Mock Data Section */}
                                                    {selectedLead.email && emailSet[selectedLead.email]?.length > 0 && (
                                                        <Box>
                                                            <Text fontWeight="semibold" mb={4}>Email Activity Timeline</Text>
                                                            <VStack spacing={3} align="stretch">
                                                                {emailSet[selectedLead.email]?.map((step, index) => (
                                                                    <HStack key={`mock-${index}`} spacing={3} p={3} bg={glassBg} borderRadius="md">
                                                                        <Icon
                                                                            as={CheckCircle}
                                                                            color={'blue.500'}
                                                                            boxSize={4}
                                                                        />
                                                                        <VStack align="start" spacing={1} flex={1}>
                                                                            <Text fontWeight="medium" fontSize="sm" textTransform={'capitalize'}>{step?.action?.split('_').join(' ')}</Text>
                                                                            <Text fontSize="xs" color="gray.600" whiteSpace="pre-line">{step.message}</Text>
                                                                            <Text fontSize="xs" color="gray.500">
                                                                                {new Date(step.timestamp).toLocaleString()}
                                                                            </Text>
                                                                        </VStack>
                                                                    </HStack>
                                                                ))}
                                                            </VStack>
                                                        </Box>
                                                    )}

                                                    {/* Actual Steps Section */}
                                                    {selectedLeadTimeline.steps.length > 0 && (
                                                        <Box>
                                                            <Text fontWeight="semibold" mb={4}>Linkedin Activity Timeline</Text>
                                                            {/* <Text fontWeight="semibold" mb={2} color="blue.500">Actual Steps</Text> */}
                                                            <VStack spacing={3} align="stretch">
                                                                {selectedLeadTimeline.steps.map((step, index) => (
                                                                    <HStack key={`actual-${index}`} spacing={3} p={3} bg={glassBg} borderRadius="md">
                                                                        <Icon
                                                                            as={step.success ? CheckCircle : AlertCircle}
                                                                            color={step.success ? 'green.500' : 'red.500'}
                                                                            boxSize={4}
                                                                        />
                                                                        <VStack align="start" spacing={1} flex={1}>
                                                                            <Text fontWeight="medium" fontSize="sm" textTransform={'capitalize'}>{step?.title?.split('_').join(' ')}</Text>
                                                                            <Text fontSize="xs" color="gray.600">{step.description}</Text>
                                                                            <Text fontSize="xs" color="gray.500">
                                                                                {new Date(step.timestamp).toLocaleString()}
                                                                            </Text>
                                                                        </VStack>
                                                                    </HStack>
                                                                ))}
                                                            </VStack>
                                                        </Box>
                                                    )}
                                                </VStack>
                                            </Box>
                                        )}
                                    </VStack>
                                )}
                            </ModalBody>
                        </ModalContent>
                    </Modal>

                    {/* Loading State */}
                    {loading && (
                        <Flex justify="center" py={8}>
                            <Spinner size="lg" color="purple.500" />
                        </Flex>
                    )}

                    {/* Empty State */}
                    {!loading && leads.length === 0 && (
                        <Card
                            bg={cardBg}
                            border="1px solid"
                            borderColor={borderColor}
                            borderRadius="xl"
                            py={16}
                        >
                            <VStack spacing={4}>
                                <Icon as={Users} boxSize={16} color="gray.400" />
                                <Heading size="lg" color="gray.500">No Leads Found</Heading>
                                <Text color="gray.600" textAlign="center">
                                    Start a campaign to begin collecting leads, or adjust your<br />
                                    filters to see more results.
                                </Text>
                                <GradientButton
                                    leftIcon={<Plus size={16} />}
                                    onClick={() => router.push('/campaigns/new')}
                                >
                                    Create Your First Campaign
                                </GradientButton>
                            </VStack>
                        </Card>
                    )}

                    {/* Leads Table */}
                    {!loading && leads.length > 0 && (
                        <>
                            <Card
                                bg={cardBg}
                                backdropFilter="blur(10px)"
                                border="1px solid"
                                borderColor={borderColor}
                                borderRadius="xl"
                                overflow="hidden"
                            >
                                <TableContainer>
                                    <Table variant="simple" size="sm">
                                        <Thead bg={glassBg}>
                                            <Tr>
                                                <Th color="gray.600" fontWeight="semibold" py={4}>Lead</Th>
                                                <Th color="gray.600" fontWeight="semibold">Company</Th>
                                                <Th color="gray.600" fontWeight="semibold">Status</Th>
                                                <Th color="gray.600" fontWeight="semibold">Connection</Th>
                                                <Th color="gray.600" fontWeight="semibold">Progress</Th>
                                                <Th color="gray.600" fontWeight="semibold">Last Activity</Th>
                                                <Th color="gray.600" fontWeight="semibold">Actions</Th>
                                            </Tr>
                                        </Thead>
                                        <Tbody>
                                            {leads.map((lead) => (
                                                <Tr
                                                    key={lead.id}
                                                    _hover={{
                                                        bg: glassBg,
                                                        transform: 'scale(1.01)',
                                                        cursor: 'pointer'
                                                    }}
                                                    transition="all 0.2s ease"
                                                    onClick={() => handleLeadSelect(lead)}
                                                >
                                                    <Td py={4}>
                                                        <HStack spacing={3}>
                                                            <Avatar
                                                                size="sm"
                                                                name={lead.full_name}
                                                                border="2px solid"
                                                                borderColor={borderColor}
                                                            />
                                                            <VStack align="start" spacing={0}>
                                                                <Text fontWeight="semibold" fontSize="sm" noOfLines={1}>
                                                                    {lead.full_name}
                                                                </Text>
                                                                <Text fontSize="xs" color="gray.500" noOfLines={1}>
                                                                    {lead.title}
                                                                </Text>
                                                            </VStack>
                                                        </HStack>
                                                    </Td>
                                                    <Td>
                                                        <VStack align="start" spacing={0}>
                                                            <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                                                                {lead.company}
                                                            </Text>
                                                            <Text fontSize="xs" color="gray.500" noOfLines={1}>
                                                                {lead.location}
                                                            </Text>
                                                        </VStack>
                                                    </Td>
                                                    <Td>
                                                        <Badge
                                                            colorScheme={getStatusColor(lead.status)}
                                                            variant="subtle"
                                                            fontSize="xs"
                                                            textTransform="capitalize"
                                                        >
                                                            {lead.status}
                                                        </Badge>
                                                    </Td>
                                                    <Td>
                                                        <Badge
                                                            colorScheme={getConnectionStatusColor(lead.linkedin_connection_status)}
                                                            variant="subtle"
                                                            fontSize="xs"
                                                        >
                                                            {formatConnectionStatus(lead.linkedin_connection_status)}
                                                        </Badge>
                                                    </Td>
                                                    <Td>
                                                        {(lead.totalSteps || 0) > 0 ? (
                                                            <VStack spacing={1} align="start">
                                                                <Text fontSize="xs" color="gray.600">
                                                                    {lead.completedSteps}/{lead.totalSteps} steps
                                                                </Text>
                                                                <Progress
                                                                    value={((lead.completedSteps || 0) / (lead.totalSteps || 1)) * 100}
                                                                    colorScheme="purple"
                                                                    size="sm"
                                                                    borderRadius="md"
                                                                    w="60px"
                                                                />
                                                            </VStack>
                                                        ) : (
                                                            <Text fontSize="xs" color="gray.400">No automation</Text>
                                                        )}
                                                    </Td>

                                                    <Td>
                                                        {lead.lastStepAt ? (
                                                            <Text fontSize="xs" color="gray.500">
                                                                {new Date(lead.lastStepAt).toLocaleDateString()}
                                                            </Text>
                                                        ) : (
                                                            <Text fontSize="xs" color="gray.400">No activity</Text>
                                                        )}
                                                    </Td>
                                                    <Td>
                                                        <HStack spacing={1}>
                                                            <Tooltip label="View Details">
                                                                <IconButton
                                                                    icon={<Eye size={14} />}
                                                                    size="xs"
                                                                    variant="ghost"
                                                                    colorScheme="purple"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        handleLeadSelect(lead)
                                                                    }}
                                                                    aria-label="View lead details"
                                                                />
                                                            </Tooltip>
                                                            {lead.linkedin_url && (
                                                                <Tooltip label="Open LinkedIn">
                                                                    <IconButton
                                                                        icon={<ExternalLink size={14} />}
                                                                        size="xs"
                                                                        variant="ghost"
                                                                        colorScheme="blue"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            window.open(lead.linkedin_url || '#', '_blank')
                                                                        }}
                                                                        aria-label="Open LinkedIn profile"
                                                                    />
                                                                </Tooltip>
                                                            )}
                                                            {lead.email && (
                                                                <Tooltip label="Send Email">
                                                                    <IconButton
                                                                        icon={<Mail size={14} />}
                                                                        size="xs"
                                                                        variant="ghost"
                                                                        colorScheme="green"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            window.open(`mailto:${lead.email}`, '_blank')
                                                                        }}
                                                                        aria-label="Send email"
                                                                    />
                                                                </Tooltip>
                                                            )}
                                                        </HStack>
                                                    </Td>
                                                </Tr>
                                            ))}
                                        </Tbody>
                                    </Table>
                                </TableContainer>
                            </Card>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <Card
                                    bg={cardBg}
                                    backdropFilter="blur(10px)"
                                    border="1px solid"
                                    borderColor={borderColor}
                                    borderRadius="xl"
                                    p={4}
                                >
                                    <Flex justify="space-between" align="center">
                                        <Text fontSize="sm" color="gray.600">
                                            Page {page} of {200} • Showing {leads.length} of {3000} leads
                                        </Text>
                                        <HStack spacing={2}>
                                            <IconButton
                                                icon={<ChevronLeft size={16} />}
                                                size="sm"
                                                onClick={() => fetchLeads(page - 1)}
                                                isDisabled={page <= 1}
                                                variant="outline"
                                                borderColor={borderColor}
                                                aria-label="Previous page"
                                            />

                                            {/* Simple pagination showing current page */}
                                            <Button
                                                size="sm"
                                                variant="solid"
                                                colorScheme="purple"
                                                minW="40px"
                                            >
                                                {page}
                                            </Button>

                                            <IconButton
                                                icon={<ChevronRight size={16} />}
                                                size="sm"
                                                onClick={() => fetchLeads(page + 1)}
                                                isDisabled={page >= totalPages}
                                                variant="outline"
                                                borderColor={borderColor}
                                                aria-label="Next page"
                                            />
                                        </HStack>
                                    </Flex>
                                </Card>
                            )}
                        </>
                    )}
                </VStack>
            </Container>
        </DashboardLayout>
    )
}