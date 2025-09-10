'use client'
// Types
import {
    LeadListWithAccount,
    LeadListStats,
    CreateLeadListRequest,
    Database as DatabaseType
} from '@/types/database'
import { useState } from 'react'
import { ApolloCompanyFilters, ApolloPeopleFilters, IIntentSignals, IntentSignals } from '../../../components/filters/ApolloFiltersNew'
import { Box, Button, Card, CardBody, FormControl, FormLabel, Heading, HStack, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Spacer, Text, Textarea, useColorModeValue, useDisclosure, useToast, VStack } from '@chakra-ui/react'
import { ApolloSearchProvider, useApolloSearch, useSearchFilters, useSearchResults } from '../../../hooks/useApolloSearch'
import { GradientButton } from '../../../components/ui/GradientButton'
import { useOrganization } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import { createCustomToast } from '../../../lib/utils/custom-toast'
import SearchResults from '../../../components/results/SearchResults'

type UserAccount = DatabaseType['public']['Tables']['user_accounts']['Row']

const CreateLeadListInside = () => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        icpId: '',
        file: null as File | null,
        mode: 'icp' // 'icp' or 'upload'
    })
    const [showICPPanel, setShowICPPanel] = useState(false)

    const defaultIntentSignals: IIntentSignals = {
        jobPostings: [],
        socialMediaKeywords: [],
        searchQueries: [],
        fundsRaisedMin: 0,
        fundsRaisedMax: 1000000000,
        techStack: []
    }

    const toast = useToast();

    const [intentSignals, setIntentSignals] = useState<IIntentSignals>(defaultIntentSignals);
    const { companyResults } = useSearchResults();
    const { search, isSearching, clearResults, setSearchResults, state } = useApolloSearch();
    const { searchType, filters, hasActiveFilters, updateFilter, resetFilters, setSearchType, peopleFilters, companyFilters } = useSearchFilters();
    const { results, pagination } = useSearchResults();
    const { organization } = useOrganization()
    const router = useRouter();
    const customToast = createCustomToast(toast);
    const cardBg = useColorModeValue('rgba(255,255,255,0.9)', 'rgba(26,32,44,0.9)')
    const borderColor = useColorModeValue('rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)')

    const handleFilterChange = (field: string, value: unknown) => {
        updateFilter(field, value)
    }
    const handleIntentSignalChange = (field: keyof IIntentSignals, value: string[]) => {
        setIntentSignals(prev => ({
            ...prev,
            [field]: value
        }));
    }

    // Dummy ICPs for dropdown (replace with real data if available)
    const icpOptions = [
        { id: 'icp1', name: 'Tech Startups' },
        { id: 'icp2', name: 'Enterprise SaaS' },
        { id: 'icp3', name: 'Healthcare Providers' }
    ]

    const handleCreateList = async (data: CreateLeadListRequest) => {

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

            toast({
                title: 'Lead List Created',
                description: 'Your lead list has been created successfully! Redirecting to upload CSV...',
                status: 'success',
                duration: 3000,
                isClosable: true,
            })

            // Redirect to edit page for CSV upload
            router.push(`/lead-lists`)

        } catch (error) {
            console.error('Error creating lead list:', error)
            toast({
                title: 'Creation Failed',
                description: 'Failed to create lead list. Please try again.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            })
        }
    }

    const handleSubmit = () => {
        if (!formData.name.trim()) return

        if (formData.mode === 'icp') {
            if (pagination?.total_entries !== undefined && pagination.total_entries > 20000) {
                if (!confirm(`The amount of Leads seems to be a huge number, Are you sure you wanna continue with ${pagination.total_entries} leads`)) {
                    return
                }
            }
            handleCreateList({
                name: formData.name.trim(),
                description: formData.description.trim() || undefined,
                icp_id: formData.icpId || undefined,
                organization_id: '',
                icpData: {
                    peopleFilters, companyFilters
                },
                totalResults: pagination?.total_entries
            })
        } else if (formData.mode === 'upload') {
            // For upload, pass file in a FormData or handle in parent
            handleCreateList({
                name: formData.name.trim(),
                description: formData.description.trim() || undefined,
                file: formData.file || undefined,
                organization_id: ''
            })
        }
    }

    const handleSearch = async () => {
        try {
            await search()
            customToast.success({
                title: 'Search Complete',
                description: `Found results for your people search`,
            })
        } catch (error) {
            customToast.error({
                title: 'Search Error',
                description: error instanceof Error ? error.message : 'Something went wrong',
            })
        }
    }

    const handleCancel = () => {
        setFormData({ name: '', description: '', icpId: '', file: null, mode: 'icp' })
        setShowICPPanel(false)
    }

    return (
        <DashboardLayout>
            <Box minH="90vh" bg="gray.50">
                <HStack align="start" spacing={8} justifyContent={'space-between'} height="100%">
                    <Box maxW="2xl" py={10} px={{ base: 4, md: 8 }} flex="1">
                        <Text fontSize="3xl" fontWeight="bold" mb={8} textAlign="center" color="purple.700">
                            Create New Lead List
                        </Text>
                        <Box bg="white" boxShadow="md" borderRadius="xl" p={{ base: 4, md: 8 }}>
                            <VStack spacing={6} align="stretch">
                                {/* Mode Switch Tabs */}
                                <HStack spacing={2} justify="center">
                                    <Button
                                        variant={formData.mode === 'icp' ? 'solid' : 'outline'}
                                        colorScheme="purple"
                                        onClick={() => setFormData(prev => ({ ...prev, mode: 'icp' }))}
                                    >
                                        ICP Based
                                    </Button>
                                    <Button
                                        variant={formData.mode === 'upload' ? 'solid' : 'outline'}
                                        colorScheme="blue"
                                        onClick={() => setFormData(prev => ({ ...prev, mode: 'upload' }))}
                                    >
                                        Upload CSV
                                    </Button>
                                </HStack>

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

                                {formData.mode === 'upload' && (
                                    <FormControl isRequired>
                                        <FormLabel>Upload CSV</FormLabel>
                                        <Input
                                            type="file"
                                            accept=".csv"
                                            onChange={e => {
                                                const file = e.target.files?.[0] || null
                                                setFormData(prev => ({ ...prev, file }))
                                            }}
                                        />
                                    </FormControl>
                                )}

                                <HStack justify="flex-end">
                                    <Button variant="ghost" onClick={handleCancel}>
                                        Cancel
                                    </Button>
                                    <GradientButton
                                        onClick={handleSubmit}
                                        loadingText="Creating..."
                                        isDisabled={
                                            !formData.name.trim() ||
                                            (formData.mode === 'icp' && !results) ||
                                            (formData.mode === 'upload' && !formData.file)
                                        }
                                    >
                                        Create Lead List
                                    </GradientButton>
                                </HStack>
                            </VStack>
                        </Box>
                        {formData.mode === 'icp' && (
                            <>
                                <Spacer height={20} />
                                <GradientButton size="lg" w="full" onClick={handleSearch}>🔍 Search Prospects</GradientButton>
                            </>
                        )}
                    </Box>
                    {!isSearching && formData.mode === 'icp' && (
                        <Box
                            bg="white"
                            boxShadow="md"
                            borderRadius="xl"
                            p={{ base: 4, md: 8 }}
                            minH="60vh"
                            maxH="90vh"
                            flex="1"
                            maxW="2xl"
                            overflowY="auto"
                        >
                            <Text fontSize="2xl" fontWeight="bold" mb={6} color="purple.700">ICP Filters</Text>
                            <VStack spacing={6} align="stretch">
                                {/* Filter Type Switcher */}
                                <Box>
                                    <Text fontSize="sm" fontWeight="semibold" color="purple.600" mb={2}>
                                        Filter Type
                                    </Text>
                                    <HStack spacing={4}>
                                        <Button
                                            size="sm"
                                            variant={searchType === 'company' ? 'solid' : 'outline'}
                                            colorScheme="purple"
                                            onClick={() => setSearchType('company')}
                                        >
                                            Company Filters
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant={searchType === 'people' ? 'solid' : 'outline'}
                                            colorScheme="purple"
                                            onClick={() => setSearchType('people')}
                                        >
                                            People Filters
                                        </Button>
                                    </HStack>
                                </Box>
                                <Box>
                                    {searchType && searchType === 'people' ? (
                                        <ApolloPeopleFilters
                                            filters={peopleFilters}
                                            onChange={handleFilterChange}
                                        />
                                    ) : (
                                        <ApolloCompanyFilters
                                            filters={companyFilters}
                                            onChange={handleFilterChange}
                                        />
                                    )}
                                    <IntentSignals intentSignals={intentSignals} onChange={handleIntentSignalChange} />
                                </Box>
                            </VStack>
                        </Box>
                    )}
                </HStack>
                <Spacer height={10}/>
                {results.length !== 0 && (
                    <Card
                        bg={cardBg}
                        backdropFilter="blur(10px)"
                        border="1px solid"
                        borderColor={borderColor}
                        shadow="xl"
                        borderRadius="2xl"
                        overflow="hidden"
                        h="800px"
                        display="flex"
                        flexDirection="column"
                    >
                        <CardBody p={6} display="flex" flexDirection="column" overflow="hidden">
                            {/* Search results header */}
                            <HStack justify="space-between" mb={4}>
                                <Heading size="md" color="purple.500">Preview Results</Heading>
                                {companyResults.length !== 0 && searchType === 'people' && (
                                    <Box>
                                        <Text fontSize={'sm'} textColor={'gray.400'}>Company Results Found</Text>
                                    </Box>
                                )}
                            </HStack>

                            {/* Results placeholder (keeps layout for SearchResults) */}
                            <Box flex={1} overflow="auto" borderRadius="md" p={2} bg="transparent">
                                <SearchResults />
                            </Box>
                        </CardBody>
                    </Card>
                )}
            </Box>
        </DashboardLayout>
    )
}
export default function CreateLeadList() {
    return (
        <ApolloSearchProvider>
            <CreateLeadListInside />
        </ApolloSearchProvider>
    )
}