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
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    useToast,
    Tooltip,
    Avatar,
    Progress,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    IconButton,
    Divider,
    FormControl,
    FormLabel,
    Textarea,
    Select
} from '@chakra-ui/react'
import {
    Search,
    Plus,
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
    AlertTriangle
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

// Internal components
import DashboardLayout from '@/components/layout/DashboardLayout'
import { GradientButton } from '@/components/ui/GradientButton'

// Types
import {
    LeadListWithAccount,
    LeadListStats,
    CreateLeadListRequest,
    Database as DatabaseType
} from '@/types/database'
import { useOrgPlan } from '../../hooks/useOrgPlan'

type UserAccount = DatabaseType['public']['Tables']['user_accounts']['Row']

// Lead List Card Component
const LeadListCard = ({
    leadList,
    onView,
    onEdit,
    onDelete,
    isLoading
}: {
    leadList: LeadListWithAccount
    onView: (id: string) => void
    onEdit: (leadList: LeadListWithAccount) => void
    onDelete: (id: string) => void
    isLoading: boolean
}) => {
    const cardBg = useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(26, 32, 44, 0.8)')
    const cardBorder = useColorModeValue('rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)')
    const textColor = useColorModeValue('gray.600', 'gray.400');


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

    const statusConfig = getStatusConfig(leadList.status)
    const StatusIcon = statusConfig.icon
    const completionRate = leadList.total_leads > 0 ?
        Math.round((leadList.processed_leads / leadList.total_leads) * 100) : 0

    return (
        <Card
            bg={cardBg}
            backdropFilter="blur(10px)"
            border="1px solid"
            borderColor={cardBorder}
            borderRadius="xl"
            p={6}
            _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
            transition="all 0.2s ease"
            position="relative"
        >
            <VStack spacing={4} align="stretch">
                {/* Header */}
                <HStack justify="space-between" align="start">
                    <VStack align="start" spacing={1} flex={1}>
                        <HStack spacing={2} align="center">
                            <Text fontWeight="semibold" fontSize="lg" noOfLines={1}>
                                {leadList.name}
                            </Text>
                            <Badge
                                colorScheme={statusConfig.color}
                                variant="subtle"
                                fontSize="xs"
                                px={2}
                                py={1}
                                borderRadius="md"
                            >
                                <HStack spacing={1}>
                                    <Icon as={StatusIcon} boxSize={3} />
                                    <Text>{statusConfig.text}</Text>
                                </HStack>
                            </Badge>
                        </HStack>
                        {leadList.description && (
                            <Text fontSize="sm" color={textColor} noOfLines={2}>
                                {leadList.description}
                            </Text>
                        )}
                    </VStack>
                    <Menu placement="bottom-end">
                        <MenuButton
                            as={IconButton}
                            icon={<MoreVertical size={16} />}
                            variant="ghost"
                            size="sm"
                            isLoading={isLoading}
                            zIndex={10}
                        />
                        <MenuList
                            zIndex={1500}
                            bg={cardBg}
                            border="1px solid"
                            borderColor={cardBorder}
                            boxShadow="xl"
                            borderRadius="md"
                            backdropFilter="blur(10px)"
                        >
                            <MenuItem icon={<Eye size={16} />} onClick={() => onView(leadList.id)}>
                                View Details
                            </MenuItem>
                            <MenuItem icon={<Settings size={16} />} onClick={() => onEdit(leadList)}>
                                Edit
                            </MenuItem>
                            <MenuItem icon={<Download size={16} />}>
                                Export CSV
                            </MenuItem>
                            <Divider />
                            <MenuItem
                                icon={<Trash2 size={16} />}
                                color="red.500"
                                onClick={() => onDelete(leadList.id)}
                            >
                                Delete
                            </MenuItem>
                        </MenuList>
                    </Menu>
                </HStack>

                {/* Stats */}
                <SimpleGrid columns={3} spacing={4}>
                    <VStack spacing={1}>
                        <Text fontSize="2xl" fontWeight="bold" color="purple.500">
                            {leadList.total_leads}
                        </Text>
                        <Text fontSize="xs" color={textColor}>Total Leads</Text>
                    </VStack>
                    <VStack spacing={1}>
                        <Text fontSize="2xl" fontWeight="bold" color="green.500">
                            {leadList.processed_leads}
                        </Text>
                        <Text fontSize="xs" color={textColor}>Processed</Text>
                    </VStack>
                    <VStack spacing={1}>
                        <Text fontSize="2xl" fontWeight="bold" color="red.500">
                            {leadList.failed_leads}
                        </Text>
                        <Text fontSize="xs" color={textColor}>Failed</Text>
                    </VStack>
                </SimpleGrid>

                {/* Progress Bar */}
                {leadList.status === 'processing' && (
                    <Box>
                        <HStack justify="space-between" mb={2}>
                            <Text fontSize="sm" color={textColor}>Processing Progress</Text>
                            <Text fontSize="sm" color={textColor}>{completionRate}%</Text>
                        </HStack>
                        <Progress
                            value={completionRate}
                            colorScheme="purple"
                            size="sm"
                            borderRadius="full"
                        />
                    </Box>
                )}

                {/* Connected Account */}
                <HStack spacing={2}>
                    {leadList.connected_account ? (
                        <>
                            <Avatar
                                size="xs"
                                src={leadList.connected_account.profile_picture_url || undefined}
                                name={leadList.connected_account.display_name}
                            />
                            <Text fontSize="sm" color={textColor}>
                                Connected to {leadList.connected_account.display_name}
                            </Text>
                            <Badge
                                size="sm"
                                colorScheme={leadList.connected_account.connection_status === 'connected' ? 'green' : 'red'}
                            >
                                {leadList.connected_account.connection_status}
                            </Badge>
                        </>
                    ) : (
                        <>
                            <Icon as={AlertCircle} boxSize={4} color="gray.400" />
                            <Text fontSize="sm" color="gray.400">
                                No account connected
                            </Text>
                        </>
                    )}
                </HStack>

                {/* Campaign */}
                <HStack spacing={2}>
                    {leadList.campaign ? (
                        <>
                            <Icon as={TrendingUp} boxSize={4} color="blue.500" />
                            <Text fontSize="sm" color={textColor}>
                                Campaign: {leadList.campaign.name}
                            </Text>
                            <Badge
                                size="sm"
                                colorScheme={leadList.campaign.status === 'active' ? 'green' : 'gray'}
                            >
                                {leadList.campaign.status}
                            </Badge>
                        </>
                    ) : (
                        <>
                            <Icon as={AlertCircle} boxSize={4} color="gray.400" />
                            <Text fontSize="sm" color="gray.400">
                                No campaign assigned
                            </Text>
                        </>
                    )}
                </HStack>

                {/* File Info */}
                {leadList.original_filename && (
                    <HStack spacing={2}>
                        <Icon as={FileText} boxSize={4} color="gray.500" />
                        <Text fontSize="sm" color={textColor} noOfLines={1}>
                            {leadList.original_filename}
                        </Text>
                    </HStack>
                )}

                {/* Last Updated */}
                <Text fontSize="xs" color={textColor}>
                    Updated {new Date(leadList.updated_at).toLocaleDateString()}
                </Text>

                {/* Actions */}
                <HStack spacing={2} justify="flex-end">
                    <Button
                        size="sm"
                        variant="ghost"
                        leftIcon={<Eye size={14} />}
                        onClick={() => onView(leadList.id)}
                    >
                        View
                    </Button>
                    {leadList.status === 'draft' && (
                        <Button
                            size="sm"
                            variant="ghost"
                            colorScheme="purple"
                            leftIcon={<Upload size={14} />}
                            onClick={() => onEdit(leadList)}
                        >
                            Upload CSV
                        </Button>
                    )}
                </HStack>
            </VStack>
        </Card>
    )
}

// Create Lead List Modal Component
const CreateLeadListModal = ({
    isOpen,
    onClose,
    onSubmit,
    accounts,
    campaigns,
    isLoading
}: {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: CreateLeadListRequest) => void
    accounts: UserAccount[]
    campaigns: any[]
    isLoading: boolean
}) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        connected_account_id: '',
        campaign_id: ''
    })

    const handleSubmit = () => {
        if (!formData.name.trim()) return

        onSubmit({
            name: formData.name.trim(),
            description: formData.description.trim() || undefined,
            connected_account_id: formData.connected_account_id || undefined,
            campaign_id: formData.campaign_id || undefined,
            organization_id: '' // Will be set by the API
        })
    }

    const handleClose = () => {
        setFormData({ name: '', description: '', connected_account_id: '', campaign_id: '' })
        onClose()
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} size="lg">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Create New Lead List</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack spacing={4} align="stretch">
                        <FormControl isRequired>
                            <FormLabel>List Name</FormLabel>
                            <Input
                                placeholder="Enter lead list name"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel>Description</FormLabel>
                            <Textarea
                                placeholder="Optional description for this lead list"
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                rows={3}
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel>Connected Account (Optional)</FormLabel>
                            <Select
                                placeholder="Select an account for outreach"
                                value={formData.connected_account_id}
                                onChange={(e) => setFormData(prev => ({ ...prev, connected_account_id: e.target.value }))}
                            >
                                {accounts.filter(acc => acc.connection_status === 'connected').map(account => (
                                    <option key={account.id} value={account.id}>
                                        {account.display_name} ({account.provider})
                                    </option>
                                ))}
                            </Select>
                            <Text fontSize="sm" color="gray.500" mt={1}>
                                Connect this list to a social media account for automated outreach
                            </Text>
                        </FormControl>

                        <FormControl>
                            <FormLabel>Campaign (Optional)</FormLabel>
                            <Select
                                placeholder="Select a campaign for this lead list"
                                value={formData.campaign_id}
                                onChange={(e) => setFormData(prev => ({ ...prev, campaign_id: e.target.value }))}
                            >
                                {campaigns.map(campaign => (
                                    <option key={campaign.id} value={campaign.id}>
                                        {campaign.name}
                                    </option>
                                ))}
                            </Select>
                            <Text fontSize="sm" color="gray.500" mt={1}>
                                Associate this lead list with a specific campaign for better organization
                            </Text>
                        </FormControl>
                    </VStack>
                </ModalBody>
                <ModalFooter>
                    <Button variant="ghost" mr={3} onClick={handleClose}>
                        Cancel
                    </Button>
                    <GradientButton
                        onClick={handleSubmit}
                        isLoading={isLoading}
                        loadingText="Creating..."
                        isDisabled={!formData.name.trim()}
                    >
                        Create Lead List
                    </GradientButton>
                </ModalFooter>
            </ModalContent>
        </Modal>
    )
}

// Component that uses useSearchParams (needs to be wrapped in Suspense)
function LeadListsPageContent() {
    const { hasPlan } = useOrgPlan();
    const { user, isLoaded } = useUser()
    const { organization } = useOrganization()
    const router = useRouter()
    const searchParams = useSearchParams()
    const toast = useToast()
    const { isOpen, onOpen, onClose } = useDisclosure()

    const [state, setState] = useState({
        leadLists: [] as LeadListWithAccount[],
        accounts: [] as UserAccount[],
        campaigns: [] as any[],
        stats: null as LeadListStats | null,
        loading: true,
        error: null as string | null,
        searchQuery: '',
        statusFilter: '',
        creatingList: false,
        deletingListId: null as string | null
    })

    const cardBg = useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(26, 32, 44, 0.8)')
    const cardBorder = useColorModeValue('rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)')
    const searchBg = useColorModeValue('white', 'gray.800')
    const searchBorder = useColorModeValue('gray.200', 'gray.700')

    // Fetch lead lists and accounts
    useEffect(() => {
        const fetchData = async () => {
            if (!user) return

            try {
                const params = new URLSearchParams()
                if (organization?.id) {
                    params.append('organizationId', organization.id)
                }

                // Fetch lead lists
                const leadListsUrl = `/api/lead-lists${params.toString() ? `?${params.toString()}` : ''}`
                const leadListsResponse = await fetch(leadListsUrl)

                if (!leadListsResponse.ok) {
                    throw new Error('Failed to fetch lead lists')
                }

                const leadListsData = await leadListsResponse.json()

                // Fetch accounts
                const accountsUrl = `/api/accounts${params.toString() ? `?${params.toString()}` : ''}`
                const accountsResponse = await fetch(accountsUrl)

                if (!accountsResponse.ok) {
                    throw new Error('Failed to fetch accounts')
                }

                const accountsData = await accountsResponse.json()

                // Fetch campaigns
                const campaignsUrl = `/api/campaigns${params.toString() ? `?${params.toString()}` : ''}`
                const campaignsResponse = await fetch(campaignsUrl)

                if (!campaignsResponse.ok) {
                    throw new Error('Failed to fetch campaigns')
                }

                const campaignsData = await campaignsResponse.json()

                setState(prev => ({
                    ...prev,
                    leadLists: leadListsData.lead_lists || [],
                    accounts: accountsData.accounts || [],
                    campaigns: campaignsData.campaigns || [],
                    stats: leadListsData.stats,
                    loading: false
                }))
            } catch (err) {
                setState(prev => ({
                    ...prev,
                    error: 'Failed to load data. Please try refreshing the page.',
                    loading: false
                }))
            }
        }

        if (isLoaded && user) {
            fetchData()
        }
    }, [isLoaded, user, organization?.id])

    const handleCreateList = async (data: CreateLeadListRequest) => {
        setState(prev => ({ ...prev, creatingList: true }))

        try {
            const response = await fetch('/api/lead-lists', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...data,
                    organization_id: organization?.id
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to create lead list')
            }

            const result = await response.json()

            setState(prev => ({
                ...prev,
                leadLists: [result.lead_list, ...prev.leadLists]
            }))

            toast({
                title: 'Lead List Created',
                description: 'Your lead list has been created successfully! Redirecting to upload CSV...',
                status: 'success',
                duration: 3000,
                isClosable: true,
            })

            onClose()

            // Redirect to edit page for CSV upload
            router.push(`/lead-lists/${result.lead_list.id}/edit`)

        } catch (error) {
            console.error('Error creating lead list:', error)
            toast({
                title: 'Creation Failed',
                description: 'Failed to create lead list. Please try again.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            })
        } finally {
            setState(prev => ({ ...prev, creatingList: false }))
        }
    }

    const handleViewList = (id: string) => {
        router.push(`/lead-lists/${id}`)
    }

    const handleEditList = (leadList: LeadListWithAccount) => {
        router.push(`/lead-lists/${leadList.id}/edit`)
    }

    const handleDeleteList = async (id: string) => {
        if (!confirm('Are you sure you want to delete this lead list? This action cannot be undone.')) {
            return
        }

        setState(prev => ({ ...prev, deletingListId: id }))

        try {
            const response = await fetch(`/api/lead-lists/${id}`, {
                method: 'DELETE',
            })

            if (!response.ok) {
                throw new Error('Failed to delete lead list')
            }

            setState(prev => ({
                ...prev,
                leadLists: prev.leadLists.filter(list => list.id !== id)
            }))

            toast({
                title: 'Lead List Deleted',
                description: 'The lead list has been deleted successfully.',
                status: 'info',
                duration: 3000,
                isClosable: true,
            })

        } catch (error) {
            console.error('Error deleting lead list:', error)
            toast({
                title: 'Deletion Failed',
                description: 'Failed to delete lead list. Please try again.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            })
        } finally {
            setState(prev => ({ ...prev, deletingListId: null }))
        }
    }

    const handleDownloadSample = async () => {
        try {
            const response = await fetch('/api/lead-lists/sample-csv')
            if (!response.ok) {
                throw new Error('Failed to download sample CSV')
            }

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'sample_leads.csv'
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)

        } catch (error) {
            console.error('Error downloading sample CSV:', error)
            toast({
                title: 'Download Failed',
                description: 'Failed to download sample CSV. Please try again.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            })
        }
    }

    const filteredLeadLists = state.leadLists.filter(list => {
        const matchesSearch = list.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
            (list.description && list.description.toLowerCase().includes(state.searchQuery.toLowerCase()))

        const matchesStatus = !state.statusFilter || list.status === state.statusFilter

        return matchesSearch && matchesStatus
    })

    if (!isLoaded || state.loading) {
        return (
            <DashboardLayout>
                <VStack spacing={6} justify="center" h="400px">
                    <Spinner size="xl" color="purple.500" />
                    <Text>Loading your lead lists...</Text>
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
                {/* Header */}
                <HStack justify="space-between" align="center">
                    <VStack spacing={1} align="start">
                        <Heading
                            size="xl"
                            bgGradient="linear(to-r, purple.400, blue.400)"
                            bgClip="text"
                            fontWeight="bold"
                        >
                            Lead Lists
                        </Heading>
                        <Text color="gray.600" fontSize="lg">
                            Manage your prospect lists and connect them to your outreach accounts
                        </Text>
                    </VStack>
                    <HStack spacing={3}>
                        <Button
                            leftIcon={<Download size={16} />}
                            variant="outline"
                            onClick={handleDownloadSample}
                        >
                            Sample CSV
                        </Button>
                        <GradientButton
                            leftIcon={<Plus size={16} />}
                            variant="primary"
                            size="lg"
                            onClick={onOpen}
                        >
                            Create Lead List
                        </GradientButton>
                    </HStack>
                </HStack>

                {/* Search and Filters */}
                <HStack spacing={4}>
                    <InputGroup maxW="400px">
                        <InputLeftElement>
                            <Icon as={Search} boxSize={5} color="gray.400" />
                        </InputLeftElement>
                        <Input
                            placeholder="Search lead lists"
                            value={state.searchQuery}
                            onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
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
                    <Select
                        placeholder="All statuses"
                        value={state.statusFilter}
                        onChange={(e) => setState(prev => ({ ...prev, statusFilter: e.target.value }))}
                        maxW="200px"
                        bg={searchBg}
                        border="1px"
                        borderColor={searchBorder}
                        borderRadius="lg"
                    >
                        <option value="draft">Draft</option>
                        <option value="processing">Processing</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                    </Select>
                </HStack>

                {/* Stats Cards */}
                {state.stats && (
                    <SimpleGrid columns={{ base: 2, md: 5 }} spacing={6}>
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
                                <Icon as={Database} boxSize={5} color="purple.500" />
                                <Text fontSize="2xl" fontWeight="bold">
                                    {state.stats.total_lists}
                                </Text>
                                <Text fontSize="xs" color="gray.600">Total Lists</Text>
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
                                <Icon as={Users} boxSize={5} color="blue.500" />
                                <Text fontSize="2xl" fontWeight="bold">
                                    {state.stats.total_leads.toLocaleString()}
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
                                <Icon as={Clock} boxSize={5} color="orange.500" />
                                <Text fontSize="2xl" fontWeight="bold">
                                    {state.stats.processing_lists}
                                </Text>
                                <Text fontSize="xs" color="gray.600">Processing</Text>
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
                                <Icon as={CheckCircle} boxSize={5} color="green.500" />
                                <Text fontSize="2xl" fontWeight="bold">
                                    {state.stats.completed_lists}
                                </Text>
                                <Text fontSize="xs" color="gray.600">Completed</Text>
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
                                <Icon as={AlertTriangle} boxSize={5} color="red.500" />
                                <Text fontSize="2xl" fontWeight="bold">
                                    {state.stats.failed_lists}
                                </Text>
                                <Text fontSize="xs" color="gray.600">Failed</Text>
                            </VStack>
                        </Card>
                    </SimpleGrid>
                )}

                {/* Lead Lists Grid */}
                <Box>
                    <Grid
                        templateColumns="repeat(auto-fill, minmax(350px, 1fr))"
                        gap={6}
                        w="100%"
                    >
                        {filteredLeadLists.map((leadList) => (
                            <LeadListCard
                                key={leadList.id}
                                leadList={leadList}
                                onView={handleViewList}
                                onEdit={handleEditList}
                                onDelete={handleDeleteList}
                                isLoading={state.deletingListId === leadList.id}
                            />
                        ))}
                    </Grid>

                    {filteredLeadLists.length === 0 && state.searchQuery && (
                        <Box textAlign="center" py={12}>
                            <Text color="gray.500" fontSize="lg">
                                No lead lists found matching &quot;{state.searchQuery}&quot;
                            </Text>
                        </Box>
                    )}

                    {state.leadLists.length === 0 && (
                        <Box textAlign="center" py={12}>
                            <VStack spacing={4}>
                                <Icon as={Database} boxSize={16} color="gray.400" />
                                <Text color="gray.500" fontSize="lg">
                                    {organization
                                        ? `No lead lists created yet in ${organization.name}. Create your first list to get started!`
                                        : "No lead lists created yet. Create your first list to get started!"
                                    }
                                </Text>
                                <GradientButton onClick={onOpen}>
                                    Create Your First Lead List
                                </GradientButton>
                            </VStack>
                        </Box>
                    )}
                </Box>

                {/* Create Lead List Modal */}
                <CreateLeadListModal
                    isOpen={isOpen}
                    onClose={onClose}
                    onSubmit={handleCreateList}
                    accounts={state.accounts}
                    campaigns={state.campaigns}
                    isLoading={state.creatingList}
                />
            </VStack>
        </DashboardLayout>
    )
}

// Main component with Suspense wrapper
export default function LeadListsPage() {
    return (
        <Suspense fallback={
            <DashboardLayout>
                <VStack spacing={6} justify="center" h="400px">
                    <Spinner size="xl" color="purple.500" />
                    <Text>Loading lead lists...</Text>
                </VStack>
            </DashboardLayout>
        }>
            <LeadListsPageContent />
        </Suspense>
    )
}
