'use client'

// External libraries
import {
    Alert,
    AlertIcon,
    Box,
    Button,
    Card,
    Grid,
    Heading,
    HStack,
    Icon,
    Input,
    InputGroup,
    InputLeftElement,
    Select,
    SimpleGrid,
    Spinner,
    Text,
    useColorModeValue,
    useToast,
    VStack
} from '@chakra-ui/react'
import { useOrganization, useUser } from '@clerk/nextjs'
import {
    AlertTriangle,
    CheckCircle,
    Clock,
    Database,
    Download,
    Plus,
    Search,
    Users
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

// Internal components
import DashboardLayout from '@/components/layout/DashboardLayout'
import { GradientButton } from '@/components/ui/GradientButton'

// Types
import {
    Database as DatabaseType,
    LeadListStats,
    LeadListWithAccount
} from '@/types/database'
import LeadListCard from '../../components/LeadListCard'
import { useOrgPlan } from '../../hooks/useOrgPlan'

type UserAccount = DatabaseType['public']['Tables']['user_accounts']['Row']

// Component that uses useSearchParams (needs to be wrapped in Suspense)
function LeadListsPageContent() {
    const { hasPlan } = useOrgPlan();
    const { user, isLoaded } = useUser()
    const { organization } = useOrganization()
    const router = useRouter()
    const searchParams = useSearchParams()
    const toast = useToast()

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
                            onClick={() => router.push('/lead-lists/create')}
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
                    <SimpleGrid columns={{ base: 2, md:2 }} spacing={6}>
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
                                <GradientButton onClick={() => router.push('/lead-lists/create')}>
                                    Create Your First Lead List
                                </GradientButton>
                            </VStack>
                        </Box>
                    )}
                </Box>
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
