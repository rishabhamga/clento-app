'use client'

import React, { useState, useEffect, Suspense } from 'react'
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
  useToast,
  Grid,
  GridItem,
  Button,
  Flex,
  Spinner,
} from '@chakra-ui/react'
import { keyframes } from '@emotion/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { GradientButton } from '@/components/ui/GradientButton'
import { CampaignStepper } from '@/components/ui/CampaignStepper'
import { ApolloSearchProvider } from '@/hooks/useApolloSearch'
import { PeopleFilters, CommonFilters } from '@/components/filters/ApolloFilters'
import SearchResults from '@/components/results/SearchResults'
import { useSearchFilters, useApolloSearch } from '@/hooks/useApolloSearch'
import { 
  type ApolloFilterInput,
} from '@/types/apollo'
import CSVUpload from '@/components/filters/CSVUpload'
import type { CSVLeadData } from '@/types/csv'
import { createCustomToast, commonToasts } from '@/lib/utils/custom-toast'

// Enhanced animations
const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
`

const glow = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(102, 126, 234, 0.3); }
  50% { box-shadow: 0 0 30px rgba(102, 126, 234, 0.5); }
`

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`

// Loading component
function LoadingSpinner() {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" minH="200px">
      <Spinner size="lg" color="purple.500" />
    </Box>
  )
}

// Selected Filters Display Component
function SelectedFiltersDisplay({ filters, searchType }: { filters: any, searchType: string }) {
  const cardBg = useColorModeValue('rgba(255, 255, 255, 0.95)', 'rgba(26, 32, 44, 0.95)')
  const borderColor = useColorModeValue('rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0.2)')

  // Helper function to format filter values
  const formatFilterValue = (value: any): string => {
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : ''
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No'
    }
    if (typeof value === 'string' && value.trim()) {
      return value
    }
    return ''
  }

  // Get active filters
  const activeFilters: Array<{ label: string; value: string }> = []

  if (searchType === 'people') {
    // People-specific filters
    if (filters.jobTitles?.length > 0) {
      activeFilters.push({ label: 'Job Titles', value: formatFilterValue(filters.jobTitles) })
    }
    if (filters.seniorities?.length > 0) {
      activeFilters.push({ label: 'Seniority', value: formatFilterValue(filters.seniorities) })
    }
    if (filters.locations?.length > 0) {
      activeFilters.push({ label: 'Locations', value: formatFilterValue(filters.locations) })
    }
    if (filters.timeInCurrentRole?.length > 0) {
      activeFilters.push({ label: 'Time in Role', value: formatFilterValue(filters.timeInCurrentRole) })
    }
    if (filters.totalYearsExperience?.length > 0) {
      activeFilters.push({ label: 'Experience', value: formatFilterValue(filters.totalYearsExperience) })
    }
    if (filters.hasEmail !== null) {
      activeFilters.push({ label: 'Has Email', value: formatFilterValue(filters.hasEmail) })
    }
    if (filters.excludeJobTitles?.length > 0) {
      activeFilters.push({ label: 'Exclude Job Titles', value: formatFilterValue(filters.excludeJobTitles) })
    }
    if (filters.excludeLocations?.length > 0) {
      activeFilters.push({ label: 'Exclude Locations', value: formatFilterValue(filters.excludeLocations) })
    }
  }

  // Common filters for both people and companies
  if (filters.industries?.length > 0) {
    activeFilters.push({ label: 'Industries', value: formatFilterValue(filters.industries) })
  }
  if (filters.companyHeadcount?.length > 0) {
    activeFilters.push({ label: 'Company Size', value: formatFilterValue(filters.companyHeadcount) })
  }
  if (filters.technologies?.length > 0) {
    activeFilters.push({ label: 'Technologies', value: formatFilterValue(filters.technologies) })
  }
  if (filters.intentTopics?.length > 0) {
    activeFilters.push({ label: 'Intent Topics', value: formatFilterValue(filters.intentTopics) })
  }
  if (filters.keywords?.length > 0) {
    activeFilters.push({ label: 'Keywords', value: formatFilterValue(filters.keywords) })
  }
  if (filters.companyDomains?.length > 0) {
    activeFilters.push({ label: 'Company Domains', value: formatFilterValue(filters.companyDomains) })
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
                  bg={useColorModeValue('purple.50', 'purple.900')}
                  border="1px solid"
                  borderColor={useColorModeValue('purple.200', 'purple.700')}
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

// Component that uses useSearchParams
function B2BFiltersPageWithParams() {
  const searchParams = useSearchParams()
  const typeParam = searchParams.get('type')
  
  // Set initial search type - only support people and csv_upload
  const initialSearchType = typeParam === 'csv_upload' ? 'csv_upload' : 'people'
  
  return (
    <ApolloSearchProvider initialState={{ searchType: initialSearchType }}>
      <B2BFiltersContent />
    </ApolloSearchProvider>
  )
}

// Main page component wrapped with Suspense
export default function B2BFiltersPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <B2BFiltersPageWithParams />
    </Suspense>
  )
}

// Main content component
function B2BFiltersContent() {
  const router = useRouter()
  const toast = useToast()
  const customToast = createCustomToast(toast)
  const searchParams = useSearchParams()
  
  // Apollo search hooks
  const { search, isSearching, clearResults, setSearchResults, state } = useApolloSearch()
  const { searchType, filters, hasActiveFilters, updateFilter, resetFilters, setSearchType } = useSearchFilters()
  
  // Enhanced color mode values with glassmorphism
  const cardBg = useColorModeValue('rgba(255, 255, 255, 0.9)', 'rgba(26, 32, 44, 0.9)')
  const glassBg = useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(26, 32, 44, 0.8)')
  const borderColor = useColorModeValue('rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)')
  const grayBg = useColorModeValue('rgba(247, 250, 252, 0.9)', 'rgba(45, 55, 72, 0.9)')
  const gradientBg = useColorModeValue(
    'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    'linear-gradient(135deg, #4c1d95 0%, #5b21b6 50%, #7c3aed 100%)'
  )
  const accentGradient = useColorModeValue(
    'linear-gradient(45deg, #667eea, #764ba2)',
    'linear-gradient(45deg, #5b21b6, #7c3aed)'
  )

  // Handle URL parameter for search type
  useEffect(() => {
    const typeParam = searchParams.get('type')
    if (typeParam === 'csv_upload' && searchType !== 'csv_upload') {
      setSearchType('csv_upload')
    }
  }, [searchParams, searchType, setSearchType])

  // Handle filter changes
  const handleFilterChange = (field: string, value: unknown) => {
    updateFilter(field, value)
  }

  // Handle search
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

  // Handle proceed to next step
  const handleProceedToPitch = async () => {
    // Save only the filters and search configuration for the next step
    const targetingConfig = {
      searchType,
      filters,
      hasResults: (state.peopleResults && state.peopleResults.length > 0) || 
                   (state.companyResults && state.companyResults.length > 0),
      resultsCount: searchType === 'people' 
        ? (state.peopleResults?.length || 0)
        : (state.companyResults?.length || 0)
    }

    localStorage.setItem('campaignTargeting', JSON.stringify(targetingConfig))

    customToast.success({
      title: 'Targeting Configuration Saved',
      description: `Your targeting filters have been saved successfully.`,
      duration: 2000,
    })

    // Navigate to pitch step
    setTimeout(() => {
      router.push('/campaigns/new/pitch')
    }, 1000)
  }

  // Handle leads selected from CSV upload
  const handleLeadsSelected = (leads: CSVLeadData[]) => {
    console.log('CSV leads loaded for preview:', leads)
    
    // Convert CSV leads to the format expected by search results
    const convertedLeads = leads.map((lead, index) => {
      // Extract compatible fields and exclude/convert problematic ones
      const { 
        department, 
        source, 
        upload_date, 
        validation_status, 
        validation_message, 
        company_size,
        ...compatibleFields 
      } = lead
      
      return {
        id: `csv_${index}_${Date.now()}`,
        external_id: `csv_${index}_${Date.now()}`,
        full_name: `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown',
        data_source: 'csv_upload' as const,
        confidence: 0.9,
        last_updated: new Date(),
        // Convert company_size from string to number if present
        ...(company_size && { company_size: parseInt(company_size) || undefined }),
        ...compatibleFields
      }
    })
    
    setSearchResults(convertedLeads)
    
    customToast.success({
      title: 'CSV Data Loaded for Preview',
      description: `${leads.length} leads loaded for preview.`,
    })
  }

  const handleBackToCampaigns = () => {
    router.push('/campaigns/new')
  }

  // Check if we can proceed to pitch
  const canProceedToPitch = hasActiveFilters && (
    (searchType === 'csv_upload' && state.peopleResults && state.peopleResults.length > 0) ||
    (searchType === 'people' && state.peopleResults && state.peopleResults.length > 0) ||
    (searchType === 'company' && state.companyResults && state.companyResults.length > 0)
  )

  return (
    <Box 
      minH="100vh"
      bg={gradientBg}
      position="relative"
      overflow="hidden"
    >
      {/* Animated background elements */}
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
          {/* Header with Campaign Stepper */}
          <CampaignStepper currentStep={0} />

          {/* Page Title */}
          <Box textAlign="center">
            <Heading 
              size="2xl" 
              mb={4}
              color={useColorModeValue('white', 'gray.100')}
              textShadow="0 2px 4px rgba(0,0,0,0.3)"
            >
              Ideal Customer Profile Preview
            </Heading>
            <Text 
              fontSize="lg" 
              color={useColorModeValue('whiteAlpha.900', 'gray.200')}
              maxW="2xl"
              mx="auto"
              textShadow="0 1px 2px rgba(0,0,0,0.2)"
            >
              Use our advanced filters to find your perfect people prospects from 200M+ verified contacts
            </Text>
          </Box>

          {/* Selected Filters Display */}
          <SelectedFiltersDisplay filters={filters} searchType={searchType} />

          {/* Filters and Results Grid */}
          <Grid templateColumns={{ base: "1fr", lg: "380px 1fr" }} gap={6} alignItems="start">
            {/* Filters Column */}
            <GridItem>
              <VStack spacing={6} align="stretch">
                {/* Filters Card */}
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
                    {searchType === 'csv_upload' ? (
                      <CSVUpload onLeadsSelected={handleLeadsSelected} />
                    ) : (
                      <VStack spacing={6} align="stretch" flex={1} overflow="hidden">
                        <Heading size="md" color="purple.500" flexShrink={0}>
                          Select Filters
                        </Heading>
                        
                        <Box flex={1} overflow="auto" pr={2}>
                          <PeopleFilters
                            filters={filters}
                            onChange={handleFilterChange}
                          />
                          
                          <CommonFilters
                            searchType={searchType}
                            filters={filters}
                            onChange={handleFilterChange}
                          />
                        </Box>
                      </VStack>
                    )}
                  </CardBody>
                </Card>

                {/* Search Actions */}
                {searchType !== 'csv_upload' && (
                  <VStack spacing={4}>
                    <GradientButton
                      onClick={handleSearch}
                      isLoading={isSearching}
                      loadingText="Searching..."
                      size="lg"
                      w="full"
                      disabled={!hasActiveFilters}
                      _hover={{
                        transform: 'translateY(-2px)',
                        shadow: 'xl',
                      }}
                      transition="all 0.3s ease"
                    >
                      🔍 Search Prospects
                    </GradientButton>
                    
                    {hasActiveFilters && (
                      <Button
                        variant="outline"
                        size="md"
                        onClick={resetFilters}
                        w="full"
                        bg="white"
                        color="purple.600"
                        borderColor="purple.300"
                        borderWidth="2px"
                        _hover={{ 
                          bg: 'purple.50',
                          borderColor: 'purple.400',
                          transform: 'translateY(-1px)',
                          shadow: 'md'
                        }}
                        _active={{
                          bg: 'purple.100'
                        }}
                        transition="all 0.2s ease"
                        fontWeight="600"
                      >
                        🗑️ Clear All Filters
                      </Button>
                    )}
                  </VStack>
                )}
              </VStack>
            </GridItem>

            {/* Results Column */}
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
                  <SearchResults />
                </CardBody>
              </Card>
            </GridItem>
          </Grid>

          {/* Navigation Actions */}
          <Flex justify="space-between" align="center">
            <Button
              onClick={handleBackToCampaigns}
              leftIcon={<Text>←</Text>}
              size="lg"
              bg="white"
              color="purple.600"
              borderColor="purple.300"
              borderWidth="2px"
              variant="outline"
              _hover={{
                bg: 'purple.50',
                borderColor: 'purple.400',
                transform: 'translateY(-2px)',
                shadow: 'lg',
              }}
              _active={{
                bg: 'purple.100'
              }}
              transition="all 0.3s ease"
              fontWeight="600"
              minW="160px"
            >
              Back to Campaign
            </Button>

            <GradientButton
              onClick={handleProceedToPitch}
              disabled={!canProceedToPitch}
              rightIcon={<Text>→</Text>}
              size="lg"
              _hover={{
                transform: 'translateY(-2px)',
                shadow: 'xl',
              }}
              transition="all 0.3s ease"
              minW="180px"
            >
              Continue to Pitch
            </GradientButton>
          </Flex>
        </VStack>
      </Container>
    </Box>
  )
} 