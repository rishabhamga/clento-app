'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import { GradientButton } from '@/components/ui/GradientButton'
import {
    LeadActivityTimeline,
    LeadFilters,
    LeadStats,
    LeadWithSyndieData,
    LinkedInConnectionStatus
} from '@/types/syndie'
import {
    Avatar,
    Badge,
    Box,
    Button,
    Card,
    Container,
    Flex,
    Heading,
    HStack,
    Icon,
    IconButton,
    Input,
    InputGroup,
    InputLeftElement,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalHeader,
    ModalOverlay,
    others,
    Progress,
    Select,
    SimpleGrid,
    Spinner,
    Table,
    TableContainer,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tooltip,
    Tr,
    useColorModeValue,
    useDisclosure,
    useToast,
    VStack
} from '@chakra-ui/react'
import { useOrganization } from '@clerk/nextjs'
import {
    Activity,
    ChevronLeft,
    ChevronRight,
    Clock,
    Download,
    ExternalLink,
    Eye,
    Linkedin,
    Mail,
    MessageCircle,
    Plus,
    Search,
    TrendingUp,
    Users
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

// Helper functions
function getConnectionStatusColor(status: LinkedInConnectionStatus): string {
    switch (status) {
        case 'accepted': return 'green'
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

export default function LeadsPage() {
    const router = useRouter()
    const { organization } = useOrganization()
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
    const [leadDetailLoading, setLeadDetailLoading] = useState(false);

    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalLeads, setTotalLeads] = useState(0)

    // Filter state
    const [filters, setFilters] = useState<LeadFilters>({})
    const [searchTerm, setSearchTerm] = useState('')

    // Filter options state
    const [campaignOptions, setCampaignOptions] = useState<{ id: string, name: string }[]>([])
    const [accountOptions, setAccountOptions] = useState<{ id: string, display_name: string }[]>([])
    const [leadListOptions, setLeadListOptions] = useState<{ id: string, name: string }[]>([])
    const [filterOptionsLoading, setFilterOptionsLoading] = useState(false)

    // Handle search
    const handleSearch = () => {
        const updatedFilters = { ...filters, search: searchTerm || undefined }
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
                ...(newFilters.leadListId && { lead_list_id: newFilters.leadListId }),
                ...(newFilters.source && { source: newFilters.source }),
                ...(newFilters.search && { search: newFilters.search }),
            })

            const response = await fetch(`/api/leads?${params}`)
            if (!response.ok) throw new Error('Failed to fetch leads')

            const result = await response.json()
            console.log(result);
            if (result.success) {
                setLeads(result.data.data) //get leads from syndie
                setPage(result.data.pagination.currentPage)
                setTotalPages(result.data.pagination.pages)
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

    // Handle lead selection for detail view
    const handleLeadSelect = async (lead: LeadWithSyndieData) => {
        setSelectedLead(lead)
        try {
            const response = await fetch(`/api/leads/${lead.id}`)
            if (!response.ok) throw new Error('Failed to fetch lead details')

            const result = await response.json()
            if (result.success) {
                console.log(result.data);
                setSelectedLeadTimeline(result.data)
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

    // Fetch filter options
    const fetchStats = async () => {
        try {
            const response = await fetch(`/api/leads?stats=true`)
            if (!response.ok) throw new Error('Failed to fetch lead stats')
            const result = await response.json();
            if (result.success) {
                setStats(result.data)
            }
            // setStats()
        } catch (err) {
            console.error('Error fetching lead stats:', err)
        }
    }

    // Initial data fetch
    useEffect(() => {
        fetchLeads()
        fetchStats()
        // fetchFilterOptions()
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
                        <SimpleGrid columns={{ base: 2, md: 3 }} spacing={6}>
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
                                        {stats.requestsSent}
                                    </Text>
                                    <Text fontSize="xs" color="gray.600">Requests Sent</Text>
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
                                        {stats.accepted}
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
                                        {stats.replied}
                                    </Text>
                                    <Text fontSize="xs" color="gray.600">Replied</Text>
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
                        px={4}
                        py={2}
                    >
                        <HStack spacing={6} align="end" justify="start">
                            <Text
                                fontSize="sm"
                                fontWeight="bold"
                                bgGradient="linear(to-r, purple.400, blue.400)"
                                bgClip="text"
                                mb={5}
                                whiteSpace="nowrap"
                            >
                                Filter Leads
                            </Text>

                            <Box width={'2xl'}>
                                <Text
                                    fontSize="xs"
                                    fontWeight="semibold"
                                    color="gray.500"
                                    textTransform="uppercase"
                                    letterSpacing="wider"
                                    mb={1}
                                    ml={5}
                                >
                                    Search
                                </Text>
                                <InputGroup size="lg" width={{ base: '100%', md: '400px', lg: '500px' }}>
                                    <InputLeftElement pointerEvents="none">
                                        <Icon as={Search} color="gray.500" boxSize={4} />
                                    </InputLeftElement>
                                    <Input
                                        placeholder="Search leads by name, email, or company..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleSearch()
                                            }
                                        }}
                                        bg={glassBg}
                                        border="1px solid"
                                        borderColor={borderColor}
                                        borderRadius="lg"
                                        fontSize="sm"
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
                                <SimpleGrid columns={{ base: 1, md: 4 }} spacing={3}>
                                    <VStack align="stretch" spacing={1}>
                                        <Text fontSize="xs" fontWeight="medium" color="gray.500" textTransform="uppercase">
                                            Connection Status
                                        </Text>
                                        <Select
                                            placeholder="All Statuses"
                                            size="sm"
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
                                            <option value="pending">Pending</option>
                                            <option value="accepted">Accepted</option>
                                            <option value="replied">Replied</option>
                                        </Select>
                                    </VStack>

                                    {/* <VStack align="stretch" spacing={1}>
                                        <Text fontSize="xs" fontWeight="medium" color="gray.500" textTransform="uppercase">
                                            Account (Seat)
                                        </Text>
                                        <Select
                                            placeholder="All Accounts"
                                            size="sm"
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
                                            disabled={filterOptionsLoading}
                                        >
                                            {accountOptions.map(account => (
                                                <option key={account.id} value={account.id}>
                                                    {account.display_name}
                                                </option>
                                            ))}
                                        </Select>
                                    </VStack>

                                    <VStack align="stretch" spacing={1}>
                                        <Text fontSize="xs" fontWeight="medium" color="gray.500" textTransform="uppercase">
                                            Campaign
                                        </Text>
                                        <Select
                                            placeholder="All Campaigns"
                                            size="sm"
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
                                            disabled={filterOptionsLoading}
                                        >
                                            {campaignOptions.map(campaign => (
                                                <option key={campaign.id} value={campaign.id}>
                                                    {campaign.name}
                                                </option>
                                            ))}
                                        </Select>
                                    </VStack>

                                    <VStack align="stretch" spacing={1}>
                                        <Text fontSize="xs" fontWeight="medium" color="gray.500" textTransform="uppercase">
                                            Lead List
                                        </Text>
                                        <Select
                                            placeholder="All Lists"
                                            size="sm"
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
                                                leadListId: e.target.value || undefined
                                            })}
                                            disabled={filterOptionsLoading}
                                        >
                                            {leadListOptions.map(leadList => (
                                                <option key={leadList.id} value={leadList.id}>
                                                    {leadList.name}
                                                </option>
                                            ))}
                                        </Select>
                                    </VStack> */}
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
                                    <Avatar size="lg" name={selectedLead?.name} />
                                    <VStack align="start" spacing={1}>
                                        <Heading size="lg">{selectedLead?.name}</Heading>
                                        <Text color="gray.600">{selectedLead?.headline}</Text>
                                        <HStack spacing={2}>
                                            <Badge
                                                colorScheme={getConnectionStatusColor(selectedLead?.status || 'not_connected')}
                                                variant="subtle"
                                            >
                                                {formatConnectionStatus(selectedLead?.status || 'not_connected')}
                                            </Badge>
                                        </HStack>
                                    </VStack>
                                </HStack>
                            </ModalHeader>
                            <ModalCloseButton />
                            <ModalBody pb={6}>
                                {selectedLeadTimeline && (
                                    <VStack spacing={6} align="stretch">
                                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                                            <VStack spacing={4} align="stretch">
                                                <Box>
                                                    <Text fontWeight="semibold" mb={2}>Contact Information</Text>
                                                    <VStack spacing={2} align="stretch">
                                                        <HStack>
                                                            <Icon as={Linkedin} boxSize={4} color="blue.500" />
                                                            <Text
                                                                as="a"
                                                                href={'https://linkedin.com/in/' + selectedLeadTimeline.profile.public_identifier || '#'}
                                                                target="_blank"
                                                                color="blue.500"
                                                                fontSize="sm"
                                                                _hover={{ textDecoration: 'underline' }}
                                                            >
                                                                LinkedIn Profile
                                                            </Text>
                                                        </HStack>
                                                        {selectedLeadTimeline.profile.location && (
                                                            <HStack>
                                                                <Text fontWeight="semibold" fontSize="sm">Location:</Text>
                                                                <Text fontSize="sm">{selectedLeadTimeline.profile.location}</Text>
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
                                                                {selectedLeadTimeline.steps
                                                                    ? Math.round(
                                                                        (selectedLeadTimeline.steps.filter(step => step.success).length / selectedLeadTimeline.steps.length) * 100
                                                                    )
                                                                    : 0}%
                                                            </Text>
                                                        </HStack>
                                                        <Progress
                                                            value={selectedLeadTimeline.steps
                                                                ? Math.round(
                                                                    (selectedLeadTimeline.steps.filter(step => step.success).length / selectedLeadTimeline.steps.length) * 100
                                                                )
                                                                : 0}
                                                            colorScheme="purple"
                                                            borderRadius="md"
                                                        />
                                                        <SimpleGrid columns={3} spacing={4}>
                                                            <VStack>
                                                                <Text fontSize="lg" fontWeight="bold">
                                                                    {selectedLeadTimeline.steps.length || 0}
                                                                </Text>
                                                                <Text fontSize="xs" color="gray.600">Total Steps</Text>
                                                            </VStack>
                                                            <VStack>
                                                                <Text fontSize="lg" fontWeight="bold" color="green.500">
                                                                    {selectedLeadTimeline.steps.filter(step => step.success).length || 0}
                                                                </Text>
                                                                <Text fontSize="xs" color="gray.600">Completed</Text>
                                                            </VStack>
                                                            <VStack>
                                                                <Text fontSize="lg" fontWeight="bold" color="red.500">
                                                                    {selectedLeadTimeline.steps.filter(it => it.errorMessage !== null && it.errorMessage !== undefined || it.success === false).length || 0}
                                                                </Text>
                                                                <Text fontSize="xs" color="gray.600">Failed</Text>
                                                            </VStack>
                                                        </SimpleGrid>
                                                    </VStack>
                                                </Box>
                                            </VStack>
                                        </SimpleGrid>
                                        <Box justifyContent={"start"}>
                                            <VStack align="stretch" spacing={4}>
                                                <Text fontWeight="semibold" mb={2}>Step Progress</Text>
                                                <VStack align="stretch" spacing={0}>
                                                    {selectedLeadTimeline.steps.filter(it => !it.stepNodeId.startsWith('notify_webhook')).map((step, idx) => (
                                                        <React.Fragment key={idx}>
                                                            {idx !== 0 && (
                                                                <Box
                                                                    alignSelf={'start'}
                                                                    width="2px"
                                                                    height="32px"
                                                                    bg={step.success ? 'green.400' : step.errorMessage ? 'red.400' : 'orange.300'}
                                                                    mx={2}
                                                                />
                                                            )}
                                                            <HStack align="center" spacing={3}>
                                                                <Box
                                                                    boxSize={6}
                                                                    borderRadius="full"
                                                                    bg={step.success ? 'green.400' : step.errorMessage ? 'red.400' : 'orange.300'}
                                                                    display="flex"
                                                                    alignItems="center"
                                                                    justifyContent="center"
                                                                >
                                                                    {step.success ? (
                                                                        <Icon as={TrendingUp} color="white" boxSize={4} />
                                                                    ) : step.errorMessage ? (
                                                                        <Icon as={Clock} color="white" boxSize={4} />
                                                                    ) : (
                                                                        <Icon as={Activity} color="white" boxSize={4} />
                                                                    )}
                                                                </Box>
                                                                <VStack align="start" spacing={0}>
                                                                    <Text fontWeight="medium" fontSize="sm" textTransform={'capitalize'} color={step.success ? 'green.400' : step.errorMessage ? 'red.400' : 'orange.300'}>
                                                                        {step.stepNodeId.startsWith('send-invite') ? 'Sent Invite' : step.stepNodeId.split('-')[0].split('_').join(' ')}
                                                                    </Text>
                                                                    <Text fontSize="xs" color={step.success ? 'green.400' : step.errorMessage ? 'red.400' : 'gray.400'}>
                                                                        {step.success
                                                                            ? 'Completed'
                                                                            : step.errorMessage
                                                                                ? `Failed: ${step.errorMessage}`
                                                                                : '⚠️'}
                                                                    </Text>
                                                                    {step?.details?.comments?.map(it => (
                                                                        <>
                                                                            <HStack>
                                                                                <Text fontWeight="xs" fontSize="xs" textTransform={'capitalize'} color={'grey.200'}>
                                                                                    {it.comment}
                                                                                </Text>
                                                                                {it.reason && (
                                                                                    <Text fontSize="xs" color={step.success ? 'green.400' : step.errorMessage ? 'red.400' : 'gray.400'}>
                                                                                        {it.reason}
                                                                                    </Text>
                                                                                )}
                                                                                {it.post && (
                                                                                    <IconButton
                                                                                        icon={<ExternalLink size={14} />}
                                                                                        size="xs"
                                                                                        variant="ghost"
                                                                                        colorScheme="blue"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation()
                                                                                            window.open(it.post || '#', '_blank')
                                                                                        }}
                                                                                        aria-label="Open LinkedIn profile"
                                                                                    />
                                                                                )}
                                                                            </HStack>
                                                                        </>
                                                                    ))}
                                                                    <Text fontWeight="xs" fontSize="xs" textTransform={'capitalize'} color={'grey.200'}>
                                                                        {step.message}
                                                                    </Text>
                                                                </VStack>
                                                            </HStack>
                                                        </React.Fragment>
                                                    ))}
                                                </VStack>
                                            </VStack>
                                        </Box>
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
                                                <Th color="gray.600" fontWeight="semibold">Account</Th>
                                                <Th color="gray.600" fontWeight="semibold">Connection</Th>
                                                <Th color="gray.600" fontWeight="semibold">Campaign</Th>
                                                <Th color="gray.600" fontWeight="semibold">Last Activity</Th>
                                                <Th color="gray.600" fontWeight="semibold">Actions</Th>
                                            </Tr>
                                        </Thead>
                                        <Tbody >
                                            {leads.map((lead) => (
                                                <Tr
                                                    key={lead.id}
                                                    _hover={{
                                                        bgGradient: 'linear(to-r, purple.50 0%, white 100%)',
                                                        transform: 'scale(1.01)',
                                                        cursor: 'pointer',
                                                        transition: 'background 0.8s cubic-bezier(0.4,0,0.2,1)'
                                                    }}
                                                    transition="all 0.2s ease"
                                                    onClick={() => handleLeadSelect(lead)}
                                                    bg={selectedLead?.id === lead.id ? 'purple.50' : undefined}
                                                    style={selectedLead?.id === lead.id
                                                        ? { transition: 'background 0.8s cubic-bezier(0.4,0,0.2,1)' }
                                                        : undefined
                                                    }
                                                >
                                                    <Td py={4}>
                                                        <HStack spacing={3}>
                                                            <Avatar
                                                                src={lead.profilePicture}
                                                                size="sm"
                                                                name={lead.name}
                                                                border="2px solid"
                                                                borderColor={borderColor}
                                                            />
                                                            <VStack align="start" spacing={0}>
                                                                <Text fontWeight="semibold" fontSize="sm" noOfLines={1}>
                                                                    {lead.name}
                                                                </Text>
                                                                <Text fontSize="xs" color="gray.500" noOfLines={1}>
                                                                    {lead.headline?.length > 40
                                                                        ? `${lead.headline.slice(0, 40)}...`
                                                                        : lead.headline}
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
                                                        <Text fontSize="sm" color="gray.600">
                                                            {lead.senderName
                                                                ? `${lead.senderName}`
                                                                : 'No Account'
                                                            }
                                                        </Text>
                                                    </Td>
                                                    <Td>
                                                        <Badge
                                                            colorScheme={getConnectionStatusColor(lead.status)}
                                                            variant="subtle"
                                                            fontSize="xs"
                                                        >
                                                            {formatConnectionStatus(lead.status)}
                                                        </Badge>
                                                    </Td>
                                                    <Td>
                                                        <Text fontSize="sm" color="gray.600">
                                                            {lead.campaign
                                                                ? `${lead.campaign}`
                                                                : 'No Account'
                                                            }
                                                        </Text>
                                                    </Td>

                                                    <Td>
                                                        {lead.updatedAt ? (
                                                            <Text fontSize="xs" color="gray.500">
                                                                {new Date(lead.updatedAt).toLocaleDateString()}
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
                                                            {lead.publicIdentifier && (
                                                                <Tooltip label="Open LinkedIn">
                                                                    <IconButton
                                                                        icon={<ExternalLink size={14} />}
                                                                        size="xs"
                                                                        variant="ghost"
                                                                        colorScheme="blue"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            window.open(`https://linkedin.com/in/` + lead.publicIdentifier || '#', '_blank')
                                                                        }}
                                                                        aria-label="Open LinkedIn profile"
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
                                            Page {page} of {totalPages} • Showing {leads.length} of {totalLeads} leads
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