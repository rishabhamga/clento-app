// src/app/campaigns/new/targeting/b2b-filters/ui-only.tsx
'use client'

import React, { useEffect, useState } from 'react'
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
    CardHeader,
} from '@chakra-ui/react'
import { keyframes } from '@emotion/react'

// Presentational components (no logic used here)
import { GradientButton } from '@/components/ui/GradientButton'
import { CampaignStepper } from '@/components/ui/CampaignStepper'
import { ConversationalICP } from '@/components/filters/ConversationalICP'
import CSVUpload from '@/components/filters/CSVUpload'
import ApolloFilters from '@/components/filters/ApolloFilters'
import SearchResults from '@/components/results/SearchResults'
import { useSearchFilters, ApolloSearchProvider, useApolloSearch, useSearchResults } from '../../../../../hooks/useApolloSearch'
import { ApolloPeopleFilters, ApolloCompanyFilters, IntentSignals, IIntentSignals } from '@/components/filters/ApolloFiltersNew'
import { ApolloFilterInput, CompanyFilterInput } from '../../../../../types/apollo'
import { ApolloCompanyInfo } from '../../../../../lib/data-providers/apollo-provider'
import { createCustomToast } from '../../../../../lib/utils/custom-toast'
import { toast } from '../../../../../hooks/use-toast'

// Animations (kept for visual parity)
const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
`
function LoadingSpinner() {
    return (
        <Box display="flex" justifyContent="center" alignItems="center" minH="200px">
            <Spinner size="lg" color="purple.500" />
        </Box>
    )
}
function B2BFiltersInner() {
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
    const customToast = createCustomToast(toast);

    const defaultIntentSignals: IIntentSignals = {
        jobPostings: [],
        socialMediaKeywords: [],
        searchQueries: [],
        fundsRaisedMin: 0,
        fundsRaisedMax: 1000000000,
        techStack: []
    }
    const [intentSignals, setIntentSignals] = useState<IIntentSignals>(defaultIntentSignals);
    const { companyResults } = useSearchResults();
    const { search, isSearching, clearResults, setSearchResults, state } = useApolloSearch();
    const { searchType, filters, hasActiveFilters, updateFilter, resetFilters, setSearchType, peopleFilters, companyFilters } = useSearchFilters();

    // Load filters from localStorage on mount
    useEffect(() => {
        const data = JSON.parse(localStorage.getItem('campaignTargeting') || '{}');
        if (data && data.filters) {
            Object.entries(data.filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    updateFilter(key, value);
                }
            });
            if (data.searchType && data.searchType !== searchType) {
                setSearchType(data.searchType);
            }
            if (data.intentSignals) {
                setIntentSignals(data.intentSignals);
            }
        }
    }, []);

    const handleFilterChange = (field: string, value: unknown) => {
        updateFilter(field, value)
    }
    const handleIntentSignalChange = (field: keyof IIntentSignals, value: string[]) => {
        setIntentSignals(prev => ({
            ...prev,
            [field]: value
        }));
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

    // Save filters to localStorage and proceed to next step
    const handleProceedToPitch = async () => {
        const targetingConfig = {
            searchType,
            filters,
            hasResults: (state.peopleResults && state.peopleResults.length > 0) ||
                (state.companyResults && state.companyResults.length > 0),
            resultsCount: searchType === 'people'
                ? (state.peopleResults?.length || 0)
                : (state.companyResults?.length || 0),
            intentSignals
        };
        localStorage.setItem('campaignTargeting', JSON.stringify(targetingConfig));
        customToast.success({
            title: 'Targeting Configuration Saved',
            description: `Your targeting filters have been saved successfully.`,
            duration: 2000,
        });
        // Navigate to pitch step
        setTimeout(() => {
            window.location.href = '/campaigns/new/pitch';
        }, 1000);
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
                    <SelectedFiltersDisplay companyFilters={companyFilters} peopleFilters={peopleFilters} searchType={searchType} />

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
                                                    <ConversationalICP onICPParsed={(parsedICP) => { console.log("parsed icps", parsedICP) }} />

                                                    <Divider />

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
                                                </VStack>
                                            </Box>
                                        </VStack>
                                    </CardBody>
                                </Card>

                                {/* Search Actions (UI-only) */}
                                <VStack spacing={4}>
                                    <GradientButton size="lg" w="full" onClick={handleSearch}>🔍 Search Prospects</GradientButton>

                                    <Box p={3} bg="blue.50" borderRadius="md" border="1px solid" borderColor="blue.200" w="full">
                                        <Text fontSize="sm" color="blue.700" textAlign="center">
                                            💡 <strong>Tip:</strong> Continue to pitch creation with filters, or search to preview results.
                                        </Text>
                                    </Box>

                                    <Button onClick={resetFilters} variant="outline" size="md" w="full" bg="white" color="purple.600" borderColor="purple.300" borderWidth="2px" fontWeight="600">
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
                        </GridItem>
                    </Grid>

                    {/* Navigation actions */}
                    <Flex justify="space-between" align="center">
                        <Button
                            size="lg"
                            bg="white"
                            color="purple.600"
                            borderColor="purple.300"
                            borderWidth="2px"
                            variant="outline"
                            minW="160px"
                            onClick={() => { window.location.href = '/campaigns/new'; }}
                        >
                            ← Back to Campaign
                        </Button>

                        <GradientButton
                            size="lg"
                            minW="180px"
                            onClick={handleProceedToPitch}
                        >
                            Continue to Pitch →
                        </GradientButton>
                    </Flex>
                </VStack>
            </Container>
        </Box>
    )
}

// Wrap the inner component with the provider so hooks have context
export default function B2BFilters() {
    return (
        <ApolloSearchProvider>
            <B2BFiltersInner />
        </ApolloSearchProvider>
    )
}

// Selected Filters Display Component
function SelectedFiltersDisplay({ companyFilters, peopleFilters, searchType }: { companyFilters: CompanyFilterInput, peopleFilters: ApolloFilterInput, searchType: string }) {
    const { companyResults } = useSearchResults();
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
    const activeFilters: Array<{ label: string; value: string }> = [];

    // People filters (show all fields explicitly)
    if (peopleFilters.jobTitles?.length > 0) {
        activeFilters.push({ label: 'Job Titles', value: formatFilterValue(peopleFilters.jobTitles) });
    }
    if (peopleFilters.companyDomains?.length > 0) {
        activeFilters.push({ label: 'Company Domains', value: formatFilterValue(peopleFilters.companyDomains) });
    }
    if (peopleFilters.industries?.length > 0) {
        activeFilters.push({ label: 'Industries', value: formatFilterValue(peopleFilters.industries) });
    }
    if (peopleFilters.intentTopics?.length > 0) {
        activeFilters.push({ label: 'Intent Topics', value: formatFilterValue(peopleFilters.intentTopics) });
    }
    if (peopleFilters.seniorities?.length > 0) {
        activeFilters.push({ label: 'Job Levels (Seniority)', value: formatFilterValue(peopleFilters.seniorities) });
    }
    if (peopleFilters.personLocations?.length > 0) {
        activeFilters.push({ label: 'Person Locations', value: formatFilterValue(peopleFilters.personLocations) });
    }
    if (peopleFilters.organizationLocations?.length > 0) {
        activeFilters.push({ label: 'Company Locations', value: formatFilterValue(peopleFilters.organizationLocations) });
    }
    if (peopleFilters.industries?.length > 0) {
        activeFilters.push({ label: 'Industries', value: formatFilterValue(peopleFilters.industries) });
    }
    if (peopleFilters.excludePersonLocations?.length > 0) {
        activeFilters.push({ label: 'Exclude Person Locations', value: formatFilterValue(peopleFilters.excludePersonLocations) });
    }
    if (peopleFilters.excludeOrganizationLocations?.length > 0) {
        activeFilters.push({ label: 'Exclude Company Locations', value: formatFilterValue(peopleFilters.excludeOrganizationLocations) });
    }

    // Company filters (show all fields explicitly from CompanyFilterInput)
    if (companyFilters.organizationNumEmployeesRange?.length > 0) {
        activeFilters.push({ label: 'Company Size (Employees)', value: formatFilterValue(companyFilters.organizationNumEmployeesRange) });
    }
    if (companyFilters.organizationLocations?.length > 0) {
        activeFilters.push({ label: 'Company Locations', value: formatFilterValue(companyFilters.organizationLocations) });
    }
    if (companyFilters.excludeOrganizationLocations?.length > 0) {
        activeFilters.push({ label: 'Exclude Company Locations', value: formatFilterValue(companyFilters.excludeOrganizationLocations) });
    }
    if (typeof companyFilters.revenueRangeMin === 'number' && typeof companyFilters.revenueRangeMax === 'number' && (companyFilters.revenueRangeMin > 0 || companyFilters.revenueRangeMax > 0)) {
        const formatRevenue = (value: number | null | undefined) => {
            if (value === null || value === undefined || isNaN(value)) return 'Any';
            if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
            if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
            if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
            return `$${value}`;
        };
        const minRev = formatRevenue(companyFilters.revenueRangeMin);
        const maxRev = formatRevenue(companyFilters.revenueRangeMax);
        activeFilters.push({ label: 'Annual Revenue Range', value: `${minRev} - ${maxRev}` });
    }
    if (companyFilters.companyTechnologies?.length > 0) {
        activeFilters.push({ label: 'Technologies Used', value: formatFilterValue(companyFilters.companyTechnologies) });
    }
    if (companyFilters.companyKeywords?.length > 0) {
        activeFilters.push({ label: 'Company Keywords', value: formatFilterValue(companyFilters.companyKeywords) });
    }
    if (companyFilters.organizationName && companyFilters.organizationName.trim()) {
        activeFilters.push({ label: 'Organization Name', value: formatFilterValue(companyFilters.organizationName) });
    }
    if (companyFilters.latestFundingAmountMin > 0 || companyFilters.latestFundingAmountMax > 0) {
        activeFilters.push({ label: 'Latest Funding Amount', value: `${companyFilters.latestFundingAmountMin} - ${companyFilters.latestFundingAmountMax}` });
    }
    if (companyFilters.totalFundingMin > 0 || companyFilters.totalFundingMax > 0) {
        activeFilters.push({ label: 'Total Funding', value: `${companyFilters.totalFundingMin} - ${companyFilters.totalFundingMax}` });
    }
    if (companyFilters.latestFundingDateRangeMin || companyFilters.latestFundingDateRangeMax) {
        activeFilters.push({ label: 'Latest Funding Date Range', value: `${companyFilters.latestFundingDateRangeMin || ''} - ${companyFilters.latestFundingDateRangeMax || ''}` });
    }
    if (companyFilters.organizationJobTitles?.length > 0) {
        activeFilters.push({ label: 'Organization Job Titles', value: formatFilterValue(companyFilters.organizationJobTitles) });
    }
    if (companyFilters.organizationJobLocations?.length > 0) {
        activeFilters.push({ label: 'Organization Job Locations', value: formatFilterValue(companyFilters.organizationJobLocations) });
    }
    if (companyFilters.organizationJobsMin > 0 || companyFilters.organizationJobsMax > 0) {
        activeFilters.push({ label: 'Number of Active Job Postings', value: `${companyFilters.organizationJobsMin} - ${companyFilters.organizationJobsMax}` });
    }
    if (companyFilters.organizationJobPostedAtRangeMin && !companyFilters.organizationJobPostedAtRangeMax) {
        activeFilters.push({ label: 'Organization Job Dates Minimum', value: `${companyFilters.organizationJobPostedAtRangeMin || ''}` });
    }
    if (!companyFilters.organizationJobPostedAtRangeMin && companyFilters.organizationJobPostedAtRangeMax) {
        activeFilters.push({ label: 'Organization Job Dates Maximum', value: `${companyFilters.organizationJobPostedAtRangeMax || ''}` });
    }
    if (companyFilters.organizationJobPostedAtRangeMin && companyFilters.organizationJobPostedAtRangeMax) {
        activeFilters.push({ label: 'Organization Job Dates', value: `${companyFilters.organizationJobPostedAtRangeMin || ''} To ${companyFilters.organizationJobPostedAtRangeMax || ''}` });
    }
    if (searchType === 'people' && companyResults.length !== 0) {
        activeFilters.push({ label: 'Searching Using Company Results', value: companyResults.map(company => company.name).join(', ') });
    }

    if (activeFilters.length === 0) {
        return null;
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