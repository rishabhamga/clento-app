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
    SimpleGrid,
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
    CardBody,
    Button,
    useToast,
    Tooltip,
    Avatar,
    Progress,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableContainer,
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    Divider,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    IconButton
} from '@chakra-ui/react'
import {
    Search,
    ArrowLeft,
    RefreshCw,
    Settings,
    Trash2,
    CheckCircle,
    AlertCircle,
    Clock,
    XCircle,
    ExternalLink,
    Database,
    Upload,
    Download,
    Eye,
    MoreVertical,
    FileText,
    Users,
    TrendingUp,
    AlertTriangle,
    ChevronRight,
    Edit
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'

// Internal components
import DashboardLayout from '@/components/layout/DashboardLayout'
import { GradientButton } from '@/components/ui/GradientButton'

// Types
import { LeadListWithAccount } from '@/types/database'

interface Lead {
    id: string
    full_name: string
    email: string | null
    company: string | null
    title: string | null
    status: string
    created_at: string
}

export default function LeadListDetailPage() {
    const { user, isLoaded } = useUser()
    const { organization } = useOrganization()
    const router = useRouter()
    const params = useParams()
    const toast = useToast()
    const leadListId = params.id as string

    const [state, setState] = useState({
        leadList: null as LeadListWithAccount | null,
        leads: [] as Lead[],
        loading: true,
        error: null as string | null,
        searchQuery: '',
        refreshing: false
    })

    const cardBg = useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(26, 32, 44, 0.8)')
    const cardBorder = useColorModeValue('rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)')
    const searchBg = useColorModeValue('white', 'gray.800')
    const searchBorder = useColorModeValue('gray.200', 'gray.700')

    // Fetch lead list details
    useEffect(() => {
        const fetchLeadList = async () => {
            if (!user || !leadListId) return

            try {
                const response = await fetch(`/api/lead-lists/${leadListId}`)

                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error('Lead list not found')
                    }
                    throw new Error('Failed to fetch lead list')
                }

                const data = await response.json()
                setState(prev => ({
                    ...prev,
                    leadList: data.lead_list,
                    leads: data.lead_list.recent_leads || [],
                    loading: false
                }))
            } catch (err: any) {
                setState(prev => ({
                    ...prev,
                    error: err.message || 'Failed to load lead list. Please try refreshing the page.',
                    loading: false
                }))
            }
        }

        if (isLoaded && user) {
            fetchLeadList()
        }
    }, [isLoaded, user, leadListId])

    const handleRefresh = async () => {
        setState(prev => ({ ...prev, refreshing: true }))
        
        try {
            const response = await fetch(`/api/lead-lists/${leadListId}`)
            if (!response.ok) throw new Error('Failed to refresh')
            
            const data = await response.json()
            setState(prev => ({
                ...prev,
                leadList: data.lead_list,
                leads: data.lead_list.recent_leads || []
            }))

            toast({
                title: 'Refreshed',
                description: 'Lead list data has been updated.',
                status: 'success',
                duration: 2000,
                isClosable: true,
            })
        } catch (error) {
            toast({
                title: 'Refresh Failed',
                description: 'Failed to refresh lead list data.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            })
        } finally {
            setState(prev => ({ ...prev, refreshing: false }))
        }
    }

    const handleEdit = () => {
        router.push(`/lead-lists/${leadListId}/edit`)
    }

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this lead list? This action cannot be undone.')) {
            return
        }

        try {
            const response = await fetch(`/api/lead-lists/${leadListId}`, {
                method: 'DELETE',
            })

            if (!response.ok) {
                throw new Error('Failed to delete lead list')
            }

            toast({
                title: 'Lead List Deleted',
                description: 'The lead list has been deleted successfully.',
                status: 'info',
                duration: 3000,
                isClosable: true,
            })

            router.push('/lead-lists')

        } catch (error) {
            toast({
                title: 'Deletion Failed',
                description: 'Failed to delete lead list. Please try again.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            })
        }
    }

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'completed':
                return { color: 'green', icon: CheckCircle, text: 'Completed' }
            case 'processing':
                return { color: 'blue', icon: Clock, text: 'Processing' }
            case 'failed':
                return { color: 'red', icon: XCircle, text: 'Failed' }
            case 'draft':
            default:
                return { color: 'gray', icon: FileText, text: 'Draft' }
        }
    }

    const filteredLeads = state.leads.filter(lead =>
        lead.full_name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        (lead.email && lead.email.toLowerCase().includes(state.searchQuery.toLowerCase())) ||
        (lead.company && lead.company.toLowerCase().includes(state.searchQuery.toLowerCase()))
    )

    if (!isLoaded || state.loading) {
        return (
            <DashboardLayout>
                <VStack spacing={6} justify="center" h="400px">
                    <Spinner size="xl" color="purple.500" />
                    <Text>Loading lead list...</Text>
                </VStack>
            </DashboardLayout>
        )
    }

    if (state.error) {
        return (
            <DashboardLayout>
                <VStack spacing={6} align="center" py={12}>
                    <Alert status="error" maxW="md">
                        <AlertIcon />
                        {state.error}
                    </Alert>
                    <Button leftIcon={<ArrowLeft size={16} />} onClick={() => router.push('/lead-lists')}>
                        Back to Lead Lists
                    </Button>
                </VStack>
            </DashboardLayout>
        )
    }

    if (!state.leadList) {
        return (
            <DashboardLayout>
                <VStack spacing={6} align="center" py={12}>
                    <Text color="gray.500" fontSize="lg">Lead list not found</Text>
                    <Button leftIcon={<ArrowLeft size={16} />} onClick={() => router.push('/lead-lists')}>
                        Back to Lead Lists
                    </Button>
                </VStack>
            </DashboardLayout>
        )
    }

    const leadList = state.leadList
    const statusConfig = getStatusConfig(leadList.status)
    const StatusIcon = statusConfig.icon
    const completionRate = leadList.total_leads > 0 ? 
        Math.round((leadList.processed_leads / leadList.total_leads) * 100) : 0

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
                    <BreadcrumbItem isCurrentPage>
                        <Text>{leadList.name}</Text>
                    </BreadcrumbItem>
                </Breadcrumb>

                {/* Header */}
                <HStack justify="space-between" align="center">
                    <VStack spacing={1} align="start">
                        <HStack spacing={3} align="center">
                            <Heading 
                                size="xl" 
                                bgGradient="linear(to-r, purple.400, blue.400)"
                                bgClip="text"
                                fontWeight="bold"
                            >
                                {leadList.name}
                            </Heading>
                            <Badge
                                colorScheme={statusConfig.color}
                                variant="subtle"
                                fontSize="sm"
                                px={3}
                                py={1}
                                borderRadius="md"
                            >
                                <HStack spacing={1}>
                                    <Icon as={StatusIcon} boxSize={4} />
                                    <Text>{statusConfig.text}</Text>
                                </HStack>
                            </Badge>
                        </HStack>
                        {leadList.description && (
                            <Text color="gray.600" fontSize="lg">
                                {leadList.description}
                            </Text>
                        )}
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
                        <Menu>
                            <MenuButton
                                as={IconButton}
                                icon={<MoreVertical size={16} />}
                                variant="outline"
                            />
                            <MenuList>
                                <MenuItem icon={<Edit size={16} />} onClick={handleEdit}>
                                    Edit List
                                </MenuItem>
                                <MenuItem icon={<Download size={16} />}>
                                    Export CSV
                                </MenuItem>
                                <Divider />
                                <MenuItem 
                                    icon={<Trash2 size={16} />} 
                                    color="red.500"
                                    onClick={handleDelete}
                                >
                                    Delete List
                                </MenuItem>
                            </MenuList>
                        </Menu>
                    </HStack>
                </HStack>

                {/* Stats Cards */}
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
                            <StatNumber color="purple.500">{leadList.total_leads}</StatNumber>
                            <StatHelpText>
                                <Icon as={Users} boxSize={4} mr={1} />
                                All leads in list
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
                            <StatNumber color="green.500">{leadList.processed_leads}</StatNumber>
                            <StatHelpText>
                                <Icon as={CheckCircle} boxSize={4} mr={1} />
                                Successfully processed
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
                            <StatNumber color="red.500">{leadList.failed_leads}</StatNumber>
                            <StatHelpText>
                                <Icon as={XCircle} boxSize={4} mr={1} />
                                Processing failed
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
                            <StatLabel>Success Rate</StatLabel>
                            <StatNumber color="blue.500">{completionRate}%</StatNumber>
                            <StatHelpText>
                                <Icon as={TrendingUp} boxSize={4} mr={1} />
                                Processing success
                            </StatHelpText>
                        </Stat>
                    </Card>
                </SimpleGrid>

                {/* Progress Bar for Processing */}
                {leadList.status === 'processing' && (
                    <Card 
                        bg={cardBg}
                        backdropFilter="blur(10px)"
                        border="1px solid" 
                        borderColor={cardBorder}
                        borderRadius="xl"
                        p={6}
                    >
                        <VStack spacing={4} align="stretch">
                            <HStack justify="space-between">
                                <Text fontWeight="semibold">Processing Progress</Text>
                                <Text color="gray.600">{completionRate}%</Text>
                            </HStack>
                            <Progress 
                                value={completionRate} 
                                colorScheme="purple" 
                                size="lg" 
                                borderRadius="full"
                                bg="gray.100"
                            />
                            <Text fontSize="sm" color="gray.600">
                                {leadList.processed_leads} of {leadList.total_leads} leads processed
                            </Text>
                        </VStack>
                    </Card>
                )}

                {/* Connected Account Info */}
                {leadList.connected_account && (
                    <Card 
                        bg={cardBg}
                        backdropFilter="blur(10px)"
                        border="1px solid" 
                        borderColor={cardBorder}
                        borderRadius="xl"
                        p={6}
                    >
                        <HStack spacing={4}>
                            <Avatar
                                size="md"
                                src={leadList.connected_account.profile_picture_url || undefined}
                                name={leadList.connected_account.display_name}
                            />
                            <VStack align="start" spacing={1}>
                                <Text fontWeight="semibold">Connected Account</Text>
                                <Text color="gray.600">
                                    {leadList.connected_account.display_name} ({leadList.connected_account.provider})
                                </Text>
                            </VStack>
                            <Badge 
                                colorScheme={leadList.connected_account.connection_status === 'connected' ? 'green' : 'red'}
                                ml="auto"
                            >
                                {leadList.connected_account.connection_status}
                            </Badge>
                        </HStack>
                    </Card>
                )}

                {/* Error Message */}
                {leadList.error_message && (
                    <Alert status="error">
                        <AlertIcon />
                        <VStack align="start" spacing={1}>
                            <Text fontWeight="semibold">Processing Error</Text>
                            <Text fontSize="sm">{leadList.error_message}</Text>
                        </VStack>
                    </Alert>
                )}

                {/* Recent Leads */}
                <Card 
                    bg={cardBg}
                    backdropFilter="blur(10px)"
                    border="1px solid" 
                    borderColor={cardBorder}
                    borderRadius="xl"
                    p={6}
                >
                    <VStack spacing={4} align="stretch">
                        <HStack justify="space-between" align="center">
                            <Text fontSize="lg" fontWeight="semibold">
                                Recent Leads ({state.leads.length})
                            </Text>
                            <InputGroup maxW="300px">
                                <InputLeftElement>
                                    <Icon as={Search} boxSize={4} color="gray.400" />
                                </InputLeftElement>
                                <Input
                                    placeholder="Search leads"
                                    value={state.searchQuery}
                                    onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
                                    bg={searchBg}
                                    border="1px"
                                    borderColor={searchBorder}
                                    borderRadius="lg"
                                    size="sm"
                                />
                            </InputGroup>
                        </HStack>

                        {filteredLeads.length > 0 ? (
                            <TableContainer>
                                <Table variant="simple" size="sm">
                                    <Thead>
                                        <Tr>
                                            <Th>Name</Th>
                                            <Th>Email</Th>
                                            <Th>Company</Th>
                                            <Th>Title</Th>
                                            <Th>Status</Th>
                                            <Th>Added</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {filteredLeads.map((lead) => (
                                            <Tr key={lead.id}>
                                                <Td fontWeight="medium">{lead.full_name}</Td>
                                                <Td color="gray.600">{lead.email || '-'}</Td>
                                                <Td color="gray.600">{lead.company || '-'}</Td>
                                                <Td color="gray.600">{lead.title || '-'}</Td>
                                                <Td>
                                                    <Badge 
                                                        colorScheme={lead.status === 'new' ? 'blue' : 'gray'}
                                                        size="sm"
                                                    >
                                                        {lead.status}
                                                    </Badge>
                                                </Td>
                                                <Td color="gray.600" fontSize="sm">
                                                    {new Date(lead.created_at).toLocaleDateString()}
                                                </Td>
                                            </Tr>
                                        ))}
                                    </Tbody>
                                </Table>
                            </TableContainer>
                        ) : (
                            <VStack spacing={4} py={8}>
                                <Icon as={Users} boxSize={12} color="gray.400" />
                                <Text color="gray.500" textAlign="center">
                                    {state.searchQuery 
                                        ? `No leads found matching "${state.searchQuery}"`
                                        : leadList.status === 'draft' 
                                            ? 'Upload a CSV file to add leads to this list'
                                            : 'No leads in this list yet'
                                    }
                                </Text>
                                {leadList.status === 'draft' && (
                                    <GradientButton
                                        leftIcon={<Upload size={16} />}
                                        onClick={handleEdit}
                                    >
                                        Upload CSV
                                    </GradientButton>
                                )}
                            </VStack>
                        )}

                        {state.leads.length >= 10 && (
                            <HStack justify="center" pt={4}>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.push(`/lead-lists/${leadListId}/leads`)}
                                >
                                    View All Leads
                                </Button>
                            </HStack>
                        )}
                    </VStack>
                </Card>

                {/* File Information */}
                {leadList.original_filename && (
                    <Card 
                        bg={cardBg}
                        backdropFilter="blur(10px)"
                        border="1px solid" 
                        borderColor={cardBorder}
                        borderRadius="xl"
                        p={6}
                    >
                        <VStack spacing={3} align="start">
                            <Text fontSize="lg" fontWeight="semibold">File Information</Text>
                            <HStack spacing={3}>
                                <Icon as={FileText} boxSize={5} color="gray.500" />
                                <VStack align="start" spacing={1}>
                                    <Text fontWeight="medium">{leadList.original_filename}</Text>
                                    <Text fontSize="sm" color="gray.600">
                                        Uploaded {new Date(leadList.updated_at).toLocaleDateString()}
                                    </Text>
                                </VStack>
                            </HStack>
                        </VStack>
                    </Card>
                )}
            </VStack>
        </DashboardLayout>
    )
}
