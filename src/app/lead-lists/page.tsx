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
import SyndieLeadListCard from '../../components/SyndieLeadListCard'
import { useOrgPlan } from '../../hooks/useOrgPlan'
import { SyndieLeadList } from '@/app/api/lead-lists/route';

type UserAccount = DatabaseType['public']['Tables']['user_accounts']['Row']

// Component that uses useSearchParams (needs to be wrapped in Suspense)
function LeadListsPageContent() {
    const { user, isLoaded } = useUser()
    const { organization } = useOrganization()
    const router = useRouter()
    const toast = useToast()

    const [state, setState] = useState({
        leadLists: [] as LeadListWithAccount[],
        syndieLeadLists: [] as SyndieLeadList[],
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
                console.log(leadListsData);
                if (leadListsData.listType === 'syndie') {
                    setState(prev => ({
                        ...prev,
                        syndieLeadLists: leadListsData.data.data || [],
                    }))
                } else {
                    setState(prev => ({
                        ...prev,
                        leadLists: leadListsData.lead_lists || [],
                    }))
                }

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

    const handleEditSyndieList = (leadList: SyndieLeadList) => {
        // For now, just show a toast - could be updated to open Syndie editor
        toast({
            title: 'Edit in Syndie',
            description: `Opening lead list ${leadList.name} in Syndie editor...`,
            status: 'info',
            duration: 3000,
            isClosable: true,
        })
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
        const matchesSearch = list?.name?.toLowerCase()?.includes(state.searchQuery.toLowerCase()) ||
            (list.description && list.description.toLowerCase().includes(state.searchQuery.toLowerCase()))

        const matchesStatus = !state.statusFilter || list.status === state.statusFilter

        return matchesSearch && matchesStatus
    })

    const filteredSyndieLeadLists = state.syndieLeadLists.filter(list => {
        const matchesSearch = list?.name?.toLowerCase()?.includes(state.searchQuery.toLowerCase())

        // For Syndie lists, we can filter by searchUrlType instead of status
        const matchesStatus = !state.statusFilter || list.searchUrlType === state.statusFilter

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
                        {!state.syndieLeadLists && (
                            <GradientButton
                                leftIcon={<Plus size={16} />}
                                variant="primary"
                                size="lg"
                                onClick={() => router.push('/lead-lists/create')}
                            >
                                Create Lead List
                            </GradientButton>
                        )}
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
                    {!state.syndieLeadLists && (
                    <Select
                        placeholder="All types"
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
                        <option value="linkedin">LinkedIn</option>
                        <option value="apollo">Apollo</option>
                        <option value="sales_navigator">Sales Navigator</option>
                        </Select>
                    )}
                </HStack>

                {/* Stats Cards */}
                <SimpleGrid columns={{ base: 2, md: state.syndieLeadLists ? 1 : 2 }} spacing={6}>
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
                                {state.stats?.total_lists || state.leadLists.length || state.syndieLeadLists.length}
                            </Text>
                            <Text fontSize="xs" color="gray.600">Total Lists</Text>
                        </VStack>
                    </Card>

                    {!state.syndieLeadLists && (
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
                                    {state.stats?.total_leads?.toLocaleString() || state.leadLists.reduce((sum, list) => sum + list.total_leads, 0).toLocaleString()}
                                </Text>
                                <Text fontSize="xs" color="gray.600">Total Leads</Text>
                            </VStack>
                        </Card>
                    )}
                </SimpleGrid>

                {/* Syndie Lead Lists Section */}
                {state.syndieLeadLists.length > 0 && (
                    <Box>
                        <Heading size="md" mb={4} color="purple.500">
                            Lead Lists
                        </Heading>
                        <Grid
                            templateColumns="repeat(auto-fill, minmax(350px, 1fr))"
                            gap={6}
                            w="100%"
                            mb={8}
                        >
                            {filteredSyndieLeadLists.map((leadList) => (
                                <SyndieLeadListCard
                                    key={leadList.id}
                                    leadList={leadList}
                                    isLoading={state.deletingListId === leadList.id}
                                />
                            ))}
                        </Grid>
                    </Box>
                )}

                {/* Lead Lists Section */}
                {!state.syndieLeadLists && (
                    <Box>
                        <Heading size="md" mb={4} color="purple.500">
                            Lead Lists
                        </Heading>
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

                        {filteredLeadLists.length === 0 && filteredSyndieLeadLists.length === 0 && state.searchQuery && (
                            <Box textAlign="center" py={12}>
                                <Text color="gray.500" fontSize="lg">
                                    No lead lists found matching &quot;{state.searchQuery}&quot;
                                </Text>
                            </Box>
                        )}
                    </Box>
                )}
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
