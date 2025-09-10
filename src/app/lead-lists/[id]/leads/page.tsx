'use client'

import { useUser } from '@clerk/nextjs'
import {
    Box,
    Heading,
    Text,
    VStack,
    HStack,
    Input,
    InputGroup,
    InputLeftElement,
    Icon,
    useColorModeValue,
    Spinner,
    Alert,
    AlertIcon,
    Badge,
    Card,
    Button,
    useToast,
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableContainer,
    Select,
    Checkbox,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    IconButton,
    Divider,
    SimpleGrid,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText
} from '@chakra-ui/react'
import {
    Search,
    ArrowLeft,
    RefreshCw,
    Download,
    MoreVertical,
    ChevronRight,
    Users,
    CheckCircle,
    XCircle,
    Mail,
    Phone,
    ExternalLink,
    Filter
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'

// Internal components
import DashboardLayout from '@/components/layout/DashboardLayout'
import { GradientButton } from '@/components/ui/GradientButton'

// Types
interface Lead {
    id: string
    full_name: string
    first_name: string | null
    last_name: string | null
    email: string | null
    phone: string | null
    company: string | null
    title: string | null
    linkedin_url: string | null
    location: string | null
    industry: string | null
    status: string
    source: string
    created_at: string
    updated_at: string
}

interface LeadListInfo {
    id: string
    name: string
    description: string | null
    total_leads: number
    processed_leads: number
    failed_leads: number
    status: string
}

export default function LeadListLeadsPage() {
    const { user, isLoaded } = useUser()
    const router = useRouter()
    const params = useParams()
    const toast = useToast()
    const leadListId = params.id as string

    const [state, setState] = useState({
        leadList: null as LeadListInfo | null,
        leads: [] as Lead[],
        loading: true,
        error: null as string | null,
        searchQuery: '',
        statusFilter: '',
        sourceFilter: '',
        selectedLeads: new Set<string>(),
        currentPage: 1,
        totalPages: 1,
        totalLeads: 0,
        refreshing: false
    })

    const cardBg = useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(26, 32, 44, 0.8)')
    const cardBorder = useColorModeValue('rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)')
    const searchBg = useColorModeValue('white', 'gray.800')
    const searchBorder = useColorModeValue('gray.200', 'gray.700')

    const leadsPerPage = 50

    // Fetch leads
    useEffect(() => {
        const fetchData = async () => {
            if (!user || !leadListId) return

            try {
                // Fetch lead list info
                const leadListResponse = await fetch(`/api/lead-lists/${leadListId}`)
                if (!leadListResponse.ok) {
                    throw new Error('Failed to fetch lead list')
                }
                const leadListData = await leadListResponse.json()

                // Fetch leads for this list
                const params = new URLSearchParams({
                    lead_list_id: leadListId,
                    limit: leadsPerPage.toString(),
                    offset: ((state.currentPage - 1) * leadsPerPage).toString()
                })

                if (state.searchQuery) params.append('search', state.searchQuery)
                if (state.statusFilter) params.append('status', state.statusFilter)
                if (state.sourceFilter) params.append('source', state.sourceFilter)

                const leadsResponse = await fetch(`/api/leads?${params.toString()}`)
                if (!leadsResponse.ok) {
                    throw new Error('Failed to fetch leads')
                }
                const leadsData = await leadsResponse.json()

                setState(prev => ({
                    ...prev,
                    leadList: leadListData.lead_list,
                    leads: leadsData.leads || [],
                    totalLeads: leadsData.total || 0,
                    totalPages: Math.ceil((leadsData.total || 0) / leadsPerPage),
                    loading: false
                }))

            } catch (err: any) {
                setState(prev => ({
                    ...prev,
                    error: err.message || 'Failed to load data.',
                    loading: false
                }))
            }
        }

        if (isLoaded && user) {
            fetchData()
        }
    }, [isLoaded, user, leadListId, state.currentPage, state.searchQuery, state.statusFilter, state.sourceFilter])

    const handleSearch = (query: string) => {
        setState(prev => ({ 
            ...prev, 
            searchQuery: query, 
            currentPage: 1,
            loading: true 
        }))
    }

    const handleFilterChange = (type: 'status' | 'source', value: string) => {
        setState(prev => ({ 
            ...prev, 
            [type + 'Filter']: value, 
            currentPage: 1,
            loading: true 
        }))
    }

    const handleSelectLead = (leadId: string, selected: boolean) => {
        setState(prev => {
            const newSelected = new Set(prev.selectedLeads)
            if (selected) {
                newSelected.add(leadId)
            } else {
                newSelected.delete(leadId)
            }
            return { ...prev, selectedLeads: newSelected }
        })
    }

    const handleSelectAll = (selected: boolean) => {
        setState(prev => ({
            ...prev,
            selectedLeads: selected ? new Set(prev.leads.map(lead => lead.id)) : new Set()
        }))
    }

    const handlePageChange = (page: number) => {
        setState(prev => ({ ...prev, currentPage: page, loading: true }))
    }

    const handleRefresh = async () => {
        setState(prev => ({ ...prev, refreshing: true }))
        // Trigger re-fetch by updating a dependency
        setTimeout(() => {
            setState(prev => ({ ...prev, refreshing: false, loading: true }))
        }, 500)
    }

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            new: { color: 'blue', text: 'New' },
            contacted: { color: 'orange', text: 'Contacted' },
            replied: { color: 'green', text: 'Replied' },
            positive: { color: 'green', text: 'Positive' },
            neutral: { color: 'gray', text: 'Neutral' },
            negative: { color: 'red', text: 'Negative' },
            unsubscribed: { color: 'red', text: 'Unsubscribed' }
        }
        const config = statusConfig[status as keyof typeof statusConfig] || { color: 'gray', text: status }
        
        return (
            <Badge colorScheme={config.color} size="sm">
                {config.text}
            </Badge>
        )
    }

    if (!isLoaded || state.loading) {
        return (
            <DashboardLayout>
                <VStack spacing={6} justify="center" h="400px">
                    <Spinner size="xl" color="purple.500" />
                    <Text>Loading leads...</Text>
                </VStack>
            </DashboardLayout>
        )
    }

    if (state.error || !state.leadList) {
        return (
            <DashboardLayout>
                <VStack spacing={6} align="center" py={12}>
                    <Alert status="error" maxW="md">
                        <AlertIcon />
                        {state.error || 'Lead list not found'}
                    </Alert>
                    <Button leftIcon={<ArrowLeft size={16} />} onClick={() => router.push('/lead-lists')}>
                        Back to Lead Lists
                    </Button>
                </VStack>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <VStack spacing={8} align="stretch">
                {/* Breadcrumb */}
                <Breadcrumb spacing="8px" separator={<ChevronRight size={16} />}>
                    <BreadcrumbItem>
                        <BreadcrumbLink onClick={() => router.push('/lead-lists')}>
                            Lead Lists
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbItem>
                        <BreadcrumbLink onClick={() => router.push(`/lead-lists/${leadListId}`)}>
                            {state.leadList.name}
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbItem isCurrentPage>
                        <Text>All Leads</Text>
                    </BreadcrumbItem>
                </Breadcrumb>

                {/* Header */}
                <HStack justify="space-between" align="center">
                    <VStack spacing={1} align="start">
                        <Heading 
                            size="xl" 
                            bgGradient="linear(to-r, purple.400, blue.400)"
                            bgClip="text"
                            fontWeight="bold"
                        >
                            All Leads
                        </Heading>
                        <Text color="gray.600" fontSize="lg">
                            {state.totalLeads} leads in "{state.leadList.name}"
                        </Text>
                    </VStack>
                    <HStack spacing={3}>
                        <Button
                            leftIcon={<RefreshCw size={16} />}
                            variant="outline"
                            onClick={handleRefresh}
                            isLoading={state.refreshing}
                            loadingText="Refreshing"
                        >
                            Refresh
                        </Button>
                        <Button
                            leftIcon={<Download size={16} />}
                            variant="outline"
                            isDisabled={state.selectedLeads.size === 0}
                        >
                            Export Selected ({state.selectedLeads.size})
                        </Button>
                        <Button
                            leftIcon={<ArrowLeft size={16} />}
                            variant="outline"
                            onClick={() => router.push(`/lead-lists/${leadListId}`)}
                        >
                            Back to List
                        </Button>
                    </HStack>
                </HStack>

                {/* Stats */}
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={6}>
                    <Card 
                        bg={cardBg}
                        backdropFilter="blur(10px)"
                        border="1px solid" 
                        borderColor={cardBorder}
                        borderRadius="xl"
                        p={4}
                    >
                        <Stat>
                            <StatLabel>Total Leads</StatLabel>
                            <StatNumber color="purple.500">{state.leadList.total_leads}</StatNumber>
                            <StatHelpText>
                                <Icon as={Users} boxSize={4} mr={1} />
                                In this list
                            </StatHelpText>
                        </Stat>
                    </Card>

                    <Card 
                        bg={cardBg}
                        backdropFilter="blur(10px)"
                        border="1px solid" 
                        borderColor={cardBorder}
                        borderRadius="xl"
                        p={4}
                    >
                        <Stat>
                            <StatLabel>Processed</StatLabel>
                            <StatNumber color="green.500">{state.leadList.processed_leads}</StatNumber>
                            <StatHelpText>
                                <Icon as={CheckCircle} boxSize={4} mr={1} />
                                Successfully imported
                            </StatHelpText>
                        </Stat>
                    </Card>

                    <Card 
                        bg={cardBg}
                        backdropFilter="blur(10px)"
                        border="1px solid" 
                        borderColor={cardBorder}
                        borderRadius="xl"
                        p={4}
                    >
                        <Stat>
                            <StatLabel>Failed</StatLabel>
                            <StatNumber color="red.500">{state.leadList.failed_leads}</StatNumber>
                            <StatHelpText>
                                <Icon as={XCircle} boxSize={4} mr={1} />
                                Import failed
                            </StatHelpText>
                        </Stat>
                    </Card>

                    <Card 
                        bg={cardBg}
                        backdropFilter="blur(10px)"
                        border="1px solid" 
                        borderColor={cardBorder}
                        borderRadius="xl"
                        p={4}
                    >
                        <Stat>
                            <StatLabel>Selected</StatLabel>
                            <StatNumber color="blue.500">{state.selectedLeads.size}</StatNumber>
                            <StatHelpText>
                                <Icon as={CheckCircle} boxSize={4} mr={1} />
                                For bulk actions
                            </StatHelpText>
                        </Stat>
                    </Card>
                </SimpleGrid>

                {/* Filters */}
                <Card 
                    bg={cardBg}
                    backdropFilter="blur(10px)"
                    border="1px solid" 
                    borderColor={cardBorder}
                    borderRadius="xl"
                    p={6}
                >
                    <HStack spacing={4} wrap="wrap">
                        <InputGroup maxW="300px">
                            <InputLeftElement>
                                <Icon as={Search} boxSize={4} color="gray.400" />
                            </InputLeftElement>
                            <Input
                                placeholder="Search leads..."
                                value={state.searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                bg={searchBg}
                                border="1px"
                                borderColor={searchBorder}
                                borderRadius="lg"
                            />
                        </InputGroup>

                        <Select
                            placeholder="All statuses"
                            value={state.statusFilter}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            maxW="150px"
                            bg={searchBg}
                            border="1px"
                            borderColor={searchBorder}
                            borderRadius="lg"
                        >
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="replied">Replied</option>
                            <option value="positive">Positive</option>
                            <option value="neutral">Neutral</option>
                            <option value="negative">Negative</option>
                            <option value="unsubscribed">Unsubscribed</option>
                        </Select>

                        <Select
                            placeholder="All sources"
                            value={state.sourceFilter}
                            onChange={(e) => handleFilterChange('source', e.target.value)}
                            maxW="150px"
                            bg={searchBg}
                            border="1px"
                            borderColor={searchBorder}
                            borderRadius="lg"
                        >
                            <option value="manual">Manual</option>
                            <option value="apollo">Apollo</option>
                            <option value="zoominfo">ZoomInfo</option>
                            <option value="clearbit">Clearbit</option>
                            <option value="syndie">Syndie</option>
                        </Select>

                        {(state.searchQuery || state.statusFilter || state.sourceFilter) && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                    setState(prev => ({
                                        ...prev,
                                        searchQuery: '',
                                        statusFilter: '',
                                        sourceFilter: '',
                                        currentPage: 1,
                                        loading: true
                                    }))
                                }}
                            >
                                Clear Filters
                            </Button>
                        )}
                    </HStack>
                </Card>

                {/* Leads Table */}
                <Card 
                    bg={cardBg}
                    backdropFilter="blur(10px)"
                    border="1px solid" 
                    borderColor={cardBorder}
                    borderRadius="xl"
                    p={6}
                >
                    <VStack spacing={4} align="stretch">
                        {state.leads.length > 0 ? (
                            <>
                                <HStack justify="space-between" align="center">
                                    <HStack spacing={3}>
                                        <Checkbox
                                            isChecked={state.selectedLeads.size === state.leads.length && state.leads.length > 0}
                                            isIndeterminate={state.selectedLeads.size > 0 && state.selectedLeads.size < state.leads.length}
                                            onChange={(e) => handleSelectAll(e.target.checked)}
                                        />
                                        <Text fontSize="sm" color="gray.600">
                                            {state.selectedLeads.size > 0 
                                                ? `${state.selectedLeads.size} selected`
                                                : `${state.leads.length} leads`
                                            }
                                        </Text>
                                    </HStack>
                                    <Text fontSize="sm" color="gray.600">
                                        Page {state.currentPage} of {state.totalPages}
                                    </Text>
                                </HStack>

                                <TableContainer>
                                    <Table variant="simple" size="sm">
                                        <Thead>
                                            <Tr>
                                                <Th width="40px"></Th>
                                                <Th>Name</Th>
                                                <Th>Email</Th>
                                                <Th>Company</Th>
                                                <Th>Title</Th>
                                                <Th>Status</Th>
                                                <Th>Source</Th>
                                                <Th>Added</Th>
                                                <Th width="60px"></Th>
                                            </Tr>
                                        </Thead>
                                        <Tbody>
                                            {state.leads.map((lead) => (
                                                <Tr key={lead.id}>
                                                    <Td>
                                                        <Checkbox
                                                            isChecked={state.selectedLeads.has(lead.id)}
                                                            onChange={(e) => handleSelectLead(lead.id, e.target.checked)}
                                                        />
                                                    </Td>
                                                    <Td fontWeight="medium">{lead.full_name}</Td>
                                                    <Td>
                                                        {lead.email ? (
                                                            <HStack spacing={2}>
                                                                <Text color="gray.600">{lead.email}</Text>
                                                                <Icon as={Mail} boxSize={3} color="gray.400" />
                                                            </HStack>
                                                        ) : (
                                                            <Text color="gray.400">-</Text>
                                                        )}
                                                    </Td>
                                                    <Td color="gray.600">{lead.company || '-'}</Td>
                                                    <Td color="gray.600">{lead.title || '-'}</Td>
                                                    <Td>{getStatusBadge(lead.status)}</Td>
                                                    <Td>
                                                        <Badge variant="outline" size="sm">
                                                            {lead.source}
                                                        </Badge>
                                                    </Td>
                                                    <Td color="gray.600" fontSize="sm">
                                                        {new Date(lead.created_at).toLocaleDateString()}
                                                    </Td>
                                                    <Td>
                                                        <Menu>
                                                            <MenuButton
                                                                as={IconButton}
                                                                icon={<MoreVertical size={14} />}
                                                                variant="ghost"
                                                                size="sm"
                                                            />
                                                            <MenuList>
                                                                <MenuItem fontSize="sm">View Details</MenuItem>
                                                                <MenuItem fontSize="sm">Edit Lead</MenuItem>
                                                                {lead.linkedin_url && (
                                                                    <MenuItem 
                                                                        fontSize="sm"
                                                                        icon={<ExternalLink size={14} />}
                                                                        onClick={() => window.open(lead.linkedin_url!, '_blank')}
                                                                    >
                                                                        LinkedIn
                                                                    </MenuItem>
                                                                )}
                                                                <Divider />
                                                                <MenuItem fontSize="sm" color="red.500">
                                                                    Remove from List
                                                                </MenuItem>
                                                            </MenuList>
                                                        </Menu>
                                                    </Td>
                                                </Tr>
                                            ))}
                                        </Tbody>
                                    </Table>
                                </TableContainer>

                                {/* Pagination */}
                                {state.totalPages > 1 && (
                                    <HStack justify="center" spacing={2} pt={4}>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handlePageChange(state.currentPage - 1)}
                                            isDisabled={state.currentPage === 1}
                                        >
                                            Previous
                                        </Button>
                                        
                                        {Array.from({ length: Math.min(5, state.totalPages) }, (_, i) => {
                                            const page = i + 1
                                            return (
                                                <Button
                                                    key={page}
                                                    size="sm"
                                                    variant={page === state.currentPage ? "solid" : "outline"}
                                                    colorScheme={page === state.currentPage ? "purple" : "gray"}
                                                    onClick={() => handlePageChange(page)}
                                                >
                                                    {page}
                                                </Button>
                                            )
                                        })}
                                        
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handlePageChange(state.currentPage + 1)}
                                            isDisabled={state.currentPage === state.totalPages}
                                        >
                                            Next
                                        </Button>
                                    </HStack>
                                )}
                            </>
                        ) : (
                            <VStack spacing={4} py={12}>
                                <Icon as={Users} boxSize={16} color="gray.400" />
                                <Text color="gray.500" textAlign="center" fontSize="lg">
                                    {state.searchQuery || state.statusFilter || state.sourceFilter
                                        ? 'No leads found matching your filters'
                                        : 'No leads in this list yet'
                                    }
                                </Text>
                                {!state.searchQuery && !state.statusFilter && !state.sourceFilter && (
                                    <GradientButton
                                        onClick={() => router.push(`/lead-lists/${leadListId}/edit`)}
                                    >
                                        Upload CSV to Add Leads
                                    </GradientButton>
                                )}
                            </VStack>
                        )}
                    </VStack>
                </Card>
            </VStack>
        </DashboardLayout>
    )
}
