// src/app/campaigns/new/targeting/b2b-filters/ui-only.tsx
'use client'

import React from 'react'
import {
    Box,
    Container,
    VStack,
    HStack,
    Text,
    Card,
    CardBody,
    Heading,
    useColorModeValue,
    Grid,
    GridItem,
    Button,
    Flex,
    Spinner,
    Divider,
} from '@chakra-ui/react'
import { keyframes } from '@emotion/react'

// Presentational components (no logic used here)
import { GradientButton } from '@/components/ui/GradientButton'
import { CampaignStepper } from '@/components/ui/CampaignStepper'
import { ConversationalICP } from '@/components/filters/ConversationalICP'
import CSVUpload from '@/components/filters/CSVUpload'
import ApolloFilters from '@/components/filters/ApolloFilters'
import SearchResults from '@/components/results/SearchResults'
import { useSearchFilters } from '../../../../../hooks/useApolloSearch'

// Animations (kept for visual parity)
const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
`
export default function B2BFilters() {
    // Color tokens (rendered once; these calls are pure)
    const cardBg = useColorModeValue('rgba(255,255,255,0.9)', 'rgba(26,32,44,0.9)')
    const borderColor = useColorModeValue('rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)')
    const gradientBg = useColorModeValue(
        'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        'linear-gradient(135deg, #4c1d95 0%, #5b21b6 50%, #7c3aed 100%)'
    )
    const accentGradient = useColorModeValue(
        'linear-gradient(45deg, #667eea, #764ba2)',
        'linear-gradient(45deg, #5b21b6, #7c3aed)'
    )
    const titleTextColor = useColorModeValue('white', 'gray.100')
    const subtitleTextColor = useColorModeValue('whiteAlpha.900', 'gray.200')

    const { searchType, filters, hasActiveFilters, updateFilter, resetFilters, setSearchType } = useSearchFilters()

    const handleFilterChange = (field: string, value: unknown) => {
        updateFilter(field, value)
    }

    return (
        <Box minH="100vh" bg={gradientBg} position="relative" overflow="hidden">
            {/* Decorative floating blobs */}
            <Box
                position="absolute"
                top="5%"
                right="15%"
                w="250px"
                h="250px"
                borderRadius="50%"
                bg={accentGradient}
                opacity={0.1}
                animation={`${float} 7s ease-in-out infinite`}
                zIndex={0}
            />
            <Box
                position="absolute"
                bottom="10%"
                left="10%"
                w="180px"
                h="180px"
                borderRadius="50%"
                bg={accentGradient}
                opacity={0.08}
                animation={`${float} 9s ease-in-out infinite reverse`}
                zIndex={0}
            />

            <Container maxW="7xl" py={8} position="relative" zIndex={1}>
                <VStack spacing={8} align="stretch">
                    {/* Stepper */}
                    <CampaignStepper currentStep={0} />

                    {/* Page Title */}
                    <Box textAlign="center">
                        <Heading size="2xl" mb={4} color={titleTextColor} textShadow="0 2px 4px rgba(0,0,0,0.3)">
                            Ideal Customer Profile Preview
                        </Heading>
                        <Text fontSize="lg" color={subtitleTextColor} maxW="2xl" mx="auto" textShadow="0 1px 2px rgba(0,0,0,0.2)">
                            Use our advanced filters to find your perfect people prospects from 200M+ verified contacts
                        </Text>
                    </Box>

                    {/* Selected Filters */}
                    <SelectedFiltersDisplay filters={filters} searchType={searchType} />

                    {/* Grid with Filters column and Results column */}
                    <Grid templateColumns={{ base: '1fr', lg: '450px 1fr' }} gap={6} alignItems="start">
                        {/* Left column: Filters card (two possible UIs shown statically below) */}
                        <GridItem>
                            <VStack spacing={6} align="stretch">
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
                                        <VStack spacing={6} align="stretch" flex={1} overflow="hidden" mt={6}>
                                            <Heading size="md" color="purple.500" flexShrink={0}>
                                                Target Your Ideal Customers
                                            </Heading>

                                            <Box flex={1} overflow="auto" pr={2}>
                                                <VStack spacing={6} align="stretch">
                                                    {/* Conversational ICP (UI placeholder) */}
                                                    <ConversationalICP onICPParsed={(parsedICP) => {console.log("parsed icps", parsedICP)}} />

                                                    <Divider />

                                                    {/* Fine-tune filters (UI placeholder for ApolloFilters) */}
                                                    <Box>
                                                        <Text fontSize="sm" fontWeight="semibold" color="purple.600" mb={4}>
                                                            Fine-tune Your Filters
                                                        </Text>

                                                        <Card p={4} borderRadius="md">
                                                            <VStack align="stretch" spacing={3}>
                                                                <Box>
                                                                    <Text fontSize="xs" color="gray.600">Job Titles</Text>
                                                                    <Text fontSize="sm" color="gray.700">Head of Sales, VP Sales</Text>
                                                                </Box>
                                                                <Box>
                                                                    <Text fontSize="xs" color="gray.600">Locations</Text>
                                                                    <Text fontSize="sm" color="gray.700">San Francisco, Remote</Text>
                                                                </Box>
                                                                <Box>
                                                                    <Text fontSize="xs" color="gray.600">Company Size</Text>
                                                                    <Text fontSize="sm" color="gray.700">51-200</Text>
                                                                </Box>
                                                                <Box pt={2}>
                                                                    <Button size="sm" variant="ghost">Save Profile</Button>
                                                                </Box>
                                                            </VStack>
                                                        </Card>
                                                    </Box>
                                                </VStack>
                                            </Box>
                                        </VStack>
                                    </CardBody>
                                </Card>

                                {/* Search Actions (UI-only) */}
                                <VStack spacing={4}>
                                    <GradientButton size="lg" w="full">🔍 Search Prospects</GradientButton>

                                    <Box p={3} bg="blue.50" borderRadius="md" border="1px solid" borderColor="blue.200" w="full">
                                        <Text fontSize="sm" color="blue.700" textAlign="center">
                                            💡 <strong>Tip:</strong> Continue to pitch creation with filters, or search to preview results.
                                        </Text>
                                    </Box>

                                    <Button variant="outline" size="md" w="full" bg="white" color="purple.600" borderColor="purple.300" borderWidth="2px" fontWeight="600">
                                        🗑️ Clear All Filters
                                    </Button>
                                </VStack>
                            </VStack>
                        </GridItem>

                        {/* Right column: Results */}
                        <GridItem>
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
                                        <Box>
                                            <Button size="sm" variant="ghost" mr={2}>Export</Button>
                                            <Button size="sm">Select</Button>
                                        </Box>
                                    </HStack>

                                    {/* Results placeholder (keeps layout for SearchResults) */}
                                    <Box flex={1} overflow="auto" borderRadius="md" p={2} bg="transparent">
                                        <Card p={4} mb={3}>
                                            <HStack justify="space-between">
                                                <Box>
                                                    <Text fontWeight="600">Jane Doe</Text>
                                                    <Text fontSize="sm" color="gray.600">Head of Sales — Acme Co.</Text>
                                                </Box>
                                                <Text fontSize="sm" color="gray.500">Email: jane@acme.com</Text>
                                            </HStack>
                                        </Card>

                                        <Card p={4} mb={3}>
                                            <HStack justify="space-between">
                                                <Box>
                                                    <Text fontWeight="600">John Smith</Text>
                                                    <Text fontSize="sm" color="gray.600">VP Sales — Example Inc.</Text>
                                                </Box>
                                                <Text fontSize="sm" color="gray.500">Email: john@example.com</Text>
                                            </HStack>
                                        </Card>

                                        {/* End of static results */}
                                        <Box textAlign="center" mt={6} color="gray.500">
                                            <Text fontSize="sm">End of preview results (static)</Text>
                                        </Box>
                                    </Box>
                                </CardBody>
                            </Card>
                        </GridItem>
                    </Grid>

                    {/* Navigation actions */}
                    <Flex justify="space-between" align="center">
                        <Button size="lg" bg="white" color="purple.600" borderColor="purple.300" borderWidth="2px" variant="outline" minW="160px">
                            ← Back to Campaign
                        </Button>

                        <GradientButton size="lg" minW="180px">Continue to Pitch →</GradientButton>
                    </Flex>
                </VStack>
            </Container>
        </Box>
    )
}

// Selected Filters Display Component
function SelectedFiltersDisplay({ filters, searchType }: { filters: any, searchType: string }) {
    const cardBg = useColorModeValue('rgba(255, 255, 255, 0.95)', 'rgba(26, 32, 44, 0.95)')
    const borderColor = useColorModeValue('rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0.2)')
    const filterChipBg = useColorModeValue('purple.50', 'purple.900')
    const filterChipBorderColor = useColorModeValue('purple.200', 'purple.700')

    // Helper function to format filter values
    const formatFilterValue = (value: any): string => {
        if (Array.isArray(value)) {
            return value.length > 0 ? value.join(', ') : ''
        }
        if (typeof value === 'boolean') {
            return value ? 'Yes' : 'No'
        }
        if (typeof value === 'number') {
            // Format large numbers with commas
            return value.toLocaleString()
        }
        if (typeof value === 'string' && value.trim()) {
            return value
        }
        return ''
    }

    // Get active filters
    const activeFilters: Array<{ label: string; value: string }> = []

    if (searchType === 'people') {
        // People-specific filters (whitelisted only)
        if (filters.jobTitles?.length > 0) {
            activeFilters.push({ label: 'Job Titles', value: formatFilterValue(filters.jobTitles) })
        }
        if (filters.excludeJobTitles?.length > 0) {
            activeFilters.push({ label: 'Exclude Titles', value: formatFilterValue(filters.excludeJobTitles) })
        }
        if (filters.hasEmail) {
            activeFilters.push({ label: 'Require Email', value: formatFilterValue(filters.hasEmail) })
        }
        if (filters.companyDomains?.length > 0) {
            activeFilters.push({ label: 'Company Domains', value: formatFilterValue(filters.companyDomains) })
        }
        if (filters.industries?.length > 0) {
            activeFilters.push({ label: 'Industries', value: formatFilterValue(filters.industries) })
        }
        if (filters.intentTopics?.length > 0) {
            activeFilters.push({ label: 'Intent Topics', value: formatFilterValue(filters.intentTopics) })
        }
        if (filters.seniorities?.length > 0) {
            activeFilters.push({ label: 'Job Levels (Seniority)', value: formatFilterValue(filters.seniorities) })
        }
        if (filters.personLocations?.length > 0) {
            activeFilters.push({ label: 'Person Locations', value: formatFilterValue(filters.personLocations) })
        }
        if (filters.organizationLocations?.length > 0) {
            activeFilters.push({ label: 'Company Locations', value: formatFilterValue(filters.organizationLocations) })
        }
    }

    // Common filters (people & company) – whitelisted only
    if (filters.companyHeadcount?.length > 0) {
        activeFilters.push({ label: 'Company Size (Employees)', value: formatFilterValue(filters.companyHeadcount) })
    }
    if (filters.technologyUids?.length > 0) {
        activeFilters.push({ label: 'Technologies Used (UIDs)', value: formatFilterValue(filters.technologyUids) })
    }
    if (filters.excludeTechnologyUids?.length > 0) {
        activeFilters.push({ label: 'Exclude Technologies (UIDs)', value: formatFilterValue(filters.excludeTechnologyUids) })
    }

    // Annual revenue (Apollo / Explorium may attach via different keys)
    if (filters.annual_revenue?.length > 0 || filters.company_annual_revenue?.length > 0) {
        const value = filters.annual_revenue || filters.company_annual_revenue
        activeFilters.push({ label: 'Annual Revenue', value: formatFilterValue(value) })
    }
    else if ((typeof filters.revenueMin === 'number' && !isNaN(filters.revenueMin)) ||
        (typeof filters.revenueMax === 'number' && !isNaN(filters.revenueMax))) {
        // Format revenue values in a human-readable way
        const formatRevenue = (value: number | null | undefined) => {
            if (value === null || value === undefined || isNaN(value)) return 'Any';
            if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
            if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
            if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
            return `$${value}`;
        };

        const minRev = formatRevenue(filters.revenueMin);
        const maxRev = formatRevenue(filters.revenueMax);
        activeFilters.push({ label: 'Annual Revenue Range', value: `${minRev} - ${maxRev}` });
    }

    // Organization job related filters
    if (filters.organizationJobTitles?.length > 0) {
        activeFilters.push({ label: 'Organization Job Titles', value: formatFilterValue(filters.organizationJobTitles) })
    }
    if (filters.organizationJobLocations?.length > 0) {
        activeFilters.push({ label: 'Organization Job Locations', value: formatFilterValue(filters.organizationJobLocations) })
    }
    if (filters.organizationJobPostedAtMax && filters.organizationJobPostedAtMin) {
        activeFilters.push({ label: 'Organization Job Dates', value: formatFilterValue(filters.organizationJobPostedAtMin + ' To ' + filters.organizationJobPostedAtMax) })
    }
    if (filters.organizationJobPostedAtMin) {
        activeFilters.push({ label: 'Organization Job Dates', value: formatFilterValue(filters.organizationJobPostedAtMin) })
    }
    if (filters.organizationJobPostedAtMax) {
        activeFilters.push({ label: 'Organization Job Dates', value: formatFilterValue(filters.organizationJobPostedAtMin) })
    }
    if (filters.jobPostings) {
        activeFilters.push({ label: 'Has Job Posting', value: formatFilterValue(filters.jobPostings) })
    }
    if (filters.newsEvents) {
        activeFilters.push({ label: 'Recent News', value: formatFilterValue(filters.newsEvents) })
    }
    if (filters.webTraffic) {
        activeFilters.push({ label: 'High Web Traffic', value: formatFilterValue(filters.webTraffic) })
    }
    if ((filters.organizationNumJobsMin !== undefined && filters.organizationNumJobsMin !== null) ||
        (filters.organizationNumJobsMax !== undefined && filters.organizationNumJobsMax !== null)) {
        const min = filters.organizationNumJobsMin !== null ? filters.organizationNumJobsMin : 'Any'
        const max = filters.organizationNumJobsMax !== null ? filters.organizationNumJobsMax : 'Any'
        activeFilters.push({ label: 'Number of Active Job Postings', value: `${min} - ${max}` })
    }

    if (activeFilters.length === 0) {
        return null
    }

    return (
        <Card
            bg={cardBg}
            backdropFilter="blur(12px)"
            border="1px solid"
            borderColor={borderColor}
            shadow="lg"
            borderRadius="xl"
            mb={6}
        >
            <CardBody p={4}>
                <VStack spacing={3} align="stretch">
                    <HStack justify="space-between" align="center">
                        <Text fontSize="sm" fontWeight="600" color="purple.600">
                            Selected Filters ({activeFilters.length})
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                            {searchType === 'people' ? 'People Search' : searchType === 'company' ? 'Company Search' : 'CSV Upload'}
                        </Text>
                    </HStack>

                    <Box>
                        <Flex wrap="wrap" gap={2}>
                            {activeFilters.map((filter, index) => (
                                <Box
                                    key={index}
                                    bg={filterChipBg}
                                    border="1px solid"
                                    borderColor={filterChipBorderColor}
                                    borderRadius="lg"
                                    px={3}
                                    py={1}
                                    fontSize="xs"
                                >
                                    <Text as="span" fontWeight="600" color="purple.700">
                                        {filter.label}:
                                    </Text>
                                    <Text as="span" color="gray.700" ml={1}>
                                        {filter.value.length > 50 ? `${filter.value.substring(0, 50)}...` : filter.value}
                                    </Text>
                                </Box>
                            ))}
                        </Flex>
                    </Box>
                </VStack>
            </CardBody>
        </Card>
    )
}