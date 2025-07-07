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
import SearchTypeSelector from '@/components/filters/SearchTypeSelector'
import { PeopleFilters, CompanyFilters, CommonFilters } from '@/components/filters/ApolloFilters'
import SearchResults from '@/components/results/SearchResults'
import { useSearchFilters, useApolloSearch } from '@/hooks/useApolloSearch'
import { 
  type ApolloFilterInput, 
  type CompanyFilterInput,
  type SearchType,
} from '@/types/apollo'
import CSVUpload from '@/components/filters/CSVUpload'
import type { CSVLeadData } from '@/types/csv'

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

// Component that uses useSearchParams
function B2BFiltersPageWithParams() {
  const searchParams = useSearchParams()
  const typeParam = searchParams.get('type') as SearchType
  
  // Set initial search type based on URL parameter
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
  const searchParams = useSearchParams()
  
  // State for selected results
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([])
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([])
  const [isSavingLeads, setIsSavingLeads] = useState(false)
  
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
    const typeParam = searchParams.get('type') as SearchType
    if (typeParam === 'csv_upload' && searchType !== 'csv_upload') {
      setSearchType('csv_upload')
    }
  }, [searchParams, searchType, setSearchType])

  // Handle filter changes
  const handlePeopleFilterChange = (field: string, value: unknown) => {
    updateFilter(field, value)
  }

  const handleCompanyFilterChange = (field: string, value: unknown) => {
    updateFilter(field, value)
  }

  // Handle search
  const handleSearch = async () => {
    try {
      await search()
      toast({
        title: 'Search Complete',
        description: `Found results for your ${searchType} search`,
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
        variant: 'solid',
        containerStyle: {
          background: 'linear-gradient(45deg, #667eea, #764ba2)',
          color: 'white',
        }
      })
    } catch (error) {
      toast({
        title: 'Search Error',
        description: error instanceof Error ? error.message : 'Something went wrong',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  // Handle lead selection
  const handleLeadSelection = (leadId: string, selected: boolean) => {
    if (selected) {
      setSelectedLeadIds(prev => [...prev, leadId])
    } else {
      setSelectedLeadIds(prev => prev.filter(id => id !== leadId))
    }
  }

  // Handle company selection
  const handleCompanySelection = (companyId: string, selected: boolean) => {
    if (selected) {
      setSelectedCompanyIds(prev => [...prev, companyId])
    } else {
      setSelectedCompanyIds(prev => prev.filter(id => id !== companyId))
    }
  }

  // Handle proceed to next step
  const handleProceedToPitch = async () => {
    // For CSV upload and people search, we check selectedLeadIds
    // For company search, we check selectedCompanyIds
    const selectedCount = (searchType === 'people' || searchType === 'csv_upload') 
      ? selectedLeadIds.length 
      : selectedCompanyIds.length
    
    if (selectedCount === 0) {
      const entityType = searchType === 'company' ? 'company' : 'person'
      toast({
        title: 'No Results Selected',
        description: `Please select at least one ${entityType} to continue.`,
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    // Get the actual lead/company data for selected items
    const searchResults = (searchType === 'people' || searchType === 'csv_upload') 
      ? state.peopleResults 
      : state.companyResults
    const selectedLeads = searchResults?.filter(result => 
      (searchType === 'people' || searchType === 'csv_upload') 
        ? selectedLeadIds.includes(result.id)
        : selectedCompanyIds.includes(result.id)
    ) || []

    console.log('Selected leads to save:', selectedLeads)

    // Save leads to Supabase
    if (selectedLeads.length > 0) {
      setIsSavingLeads(true)
      try {
        const response = await fetch('/api/leads/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            leads: selectedLeads
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to save leads')
        }

        const result = await response.json()
        console.log('Leads saved successfully:', result)

        // Store selection for next step
        localStorage.setItem('selectedLeads', JSON.stringify(selectedLeads))
        localStorage.setItem('campaignTargeting', JSON.stringify({
          searchType,
          filters,
          selectedIds: searchType === 'company' ? selectedCompanyIds : selectedLeadIds,
          selectedCount
        }))

        toast({
          title: 'Leads Saved Successfully',
          description: `${selectedCount} ${searchType === 'company' ? 'companies' : 'people'} saved for your campaign.`,
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: 'top-right',
          variant: 'solid',
          containerStyle: {
            background: 'linear-gradient(45deg, #667eea, #764ba2)',
            color: 'white',
          }
        })

        // Navigate to pitch step
        setTimeout(() => {
          router.push('/campaigns/new/pitch')
        }, 1000)

      } catch (error) {
        console.error('Error saving leads:', error)
        toast({
          title: 'Error Saving Leads',
          description: error instanceof Error ? error.message : 'Failed to save leads',
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
      } finally {
        setIsSavingLeads(false)
      }
    }
  }

  // Handle leads selected from CSV upload
  const handleLeadsSelected = (leads: CSVLeadData[]) => {
    console.log('CSV leads selected:', leads)
    
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
    
    toast({
      title: 'CSV Data Loaded',
      description: `${leads.length} leads loaded from CSV file.`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    })
  }

  const handleBackToCampaigns = () => {
    router.push('/campaigns/new')
  }

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
          <Card 
            bg={cardBg}
            backdropFilter="blur(10px)"
            border="1px solid"
            borderColor={borderColor}
            shadow="xl"
            borderRadius="2xl"
            overflow="hidden"
          >
            <CardBody p={6}>
              <CampaignStepper currentStep={0} />
            </CardBody>
          </Card>

          {/* Page Title */}
          <Box textAlign="center">
            <Heading 
              size="2xl" 
              mb={4}
              color={useColorModeValue('white', 'gray.100')}
              textShadow="0 2px 4px rgba(0,0,0,0.3)"
            >
              Target Your Ideal Prospects
            </Heading>
            <Text 
              fontSize="lg" 
              color={useColorModeValue('whiteAlpha.900', 'gray.200')}
              maxW="2xl"
              mx="auto"
              textShadow="0 1px 2px rgba(0,0,0,0.2)"
            >
              Use our advanced filters to find and select your perfect prospects from 300M+ verified contacts
            </Text>
          </Box>

          {/* Search Type Selector */}
          <Card 
            bg={cardBg}
            backdropFilter="blur(10px)"
            border="1px solid"
            borderColor={borderColor}
            shadow="xl"
            borderRadius="2xl"
            overflow="hidden"
            _hover={{
              transform: 'translateY(-2px)',
              shadow: '2xl',
            }}
            transition="all 0.3s ease"
          >
            <CardBody p={6}>
              <SearchTypeSelector />
            </CardBody>
          </Card>

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
                  position="sticky"
                  top={4}
                >
                  <CardBody p={6}>
                    {searchType === 'csv_upload' ? (
                      <CSVUpload onLeadsSelected={handleLeadsSelected} />
                    ) : (
                      <VStack spacing={6} align="stretch">
                        <Heading size="md" color="purple.500">
                          {searchType === 'people' ? 'People Filters' : 'Company Filters'}
                        </Heading>
                        
                        {searchType === 'people' && (
                          <PeopleFilters
                            filters={filters}
                            onChange={handlePeopleFilterChange}
                          />
                        )}
                        
                        {searchType === 'company' && (
                          <CompanyFilters
                            filters={filters}
                            onChange={handleCompanyFilterChange}
                          />
                        )}
                        
                        <CommonFilters
                          searchType={searchType}
                          filters={filters}
                          onChange={handlePeopleFilterChange}
                        />
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
                        variant="ghost"
                        size="sm"
                        onClick={resetFilters}
                        color="purple.500"
                        _hover={{ bg: 'purple.50' }}
                      >
                        Clear All Filters
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
                minH="600px"
              >
                <CardBody p={6}>
                  <SearchResults
                    onLeadSelect={handleLeadSelection}
                    onCompanySelect={handleCompanySelection}
                    selectedLeadIds={selectedLeadIds}
                    selectedCompanyIds={selectedCompanyIds}
                  />
                </CardBody>
              </Card>
            </GridItem>
          </Grid>

          {/* Navigation Actions */}
          <Flex justify="space-between" align="center">
            <GradientButton
              variant="secondary"
              onClick={handleBackToCampaigns}
              leftIcon={<Text>←</Text>}
              _hover={{
                transform: 'translateY(-2px)',
                shadow: 'lg',
              }}
              transition="all 0.3s ease"
            >
              Back to Campaign
            </GradientButton>

            <GradientButton
              onClick={handleProceedToPitch}
              isLoading={isSavingLeads}
              loadingText="Saving leads..."
              disabled={selectedLeadIds.length === 0 && selectedCompanyIds.length === 0}
              rightIcon={<Text>→</Text>}
              size="lg"
              _hover={{
                transform: 'translateY(-2px)',
                shadow: 'xl',
              }}
              transition="all 0.3s ease"
            >
              Continue to Pitch ({(searchType === 'people' || searchType === 'csv_upload') ? selectedLeadIds.length : selectedCompanyIds.length} selected)
            </GradientButton>
          </Flex>
        </VStack>
      </Container>
    </Box>
  )
} 