'use client'

import React, { useState } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  Badge,
  Avatar,
  IconButton,
  Tooltip,
  useColorModeValue,
  Flex,
  Spacer,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  SimpleGrid,
  Link,
  Button,
  Collapse,
  Divider,
} from '@chakra-ui/react'
import { 
  FiMail, 
  FiPhone, 
  FiLinkedin, 
  FiGlobe, 
  FiMapPin,
  FiUsers,
  FiDollarSign,
  FiCalendar,
  FiCheck,
  FiPlus,
  FiChevronDown,
  FiChevronUp,
  FiEye,
  FiBriefcase,
  FiTarget,
} from 'react-icons/fi'
import { 
  useSearchResults, 
  useApolloSearch 
} from '@/hooks/useApolloSearch'
import { 
  type LeadSearchResult, 
  type CompanySearchResult 
} from '@/types/apollo'
import SearchPagination from './SearchPagination'

interface SearchResultsProps {
  className?: string
  onLeadSelect?: (leadId: string, selected: boolean) => void
  onCompanySelect?: (companyId: string, selected: boolean) => void
  selectedLeadIds?: string[]
  selectedCompanyIds?: string[]
}

export function SearchResults({ 
  className, 
  onLeadSelect, 
  onCompanySelect,
  selectedLeadIds = [],
  selectedCompanyIds = []
}: SearchResultsProps) {
  const { results, loading, error, searchType, pagination } = useSearchResults()
  const { hasActiveFilters } = useApolloSearch()

  if (loading) {
    return (
      <Box className={className} textAlign="center" py={12}>
        <VStack spacing={4}>
          <Spinner size="xl" color="purple.500" />
          <Text fontSize="lg" color="gray.600">
            Searching {searchType === 'people' ? 'people' : 'companies'}...
          </Text>
        </VStack>
      </Box>
    )
  }

  if (error) {
    return (
      <Box className={className}>
        <Alert status="error" borderRadius="lg">
          <AlertIcon />
          <Box>
            <AlertTitle>Search Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Box>
        </Alert>
      </Box>
    )
  }

  if (!hasActiveFilters && (!results || results.length === 0)) {
    return (
      <Box className={className} textAlign="center" py={12}>
        <VStack spacing={4}>
          <Text fontSize="lg" color="gray.600">
            Apply filters to search for {searchType === 'people' ? 'people' : 'companies'}
          </Text>
          <Text fontSize="sm" color="gray.500">
            Use the filters above to find your ideal prospects
          </Text>
        </VStack>
      </Box>
    )
  }

  if (results.length === 0) {
    return (
      <Box className={className} textAlign="center" py={12}>
        <VStack spacing={4}>
          <Text fontSize="lg" color="gray.600">
            No {searchType} found matching your criteria
          </Text>
          <Text fontSize="sm" color="gray.500">
            Try adjusting your filters to see more results
          </Text>
        </VStack>
      </Box>
    )
  }

  return (
    <Box className={className}>
      <VStack spacing={6} align="stretch">
        {/* Results header */}
        <Flex align="center" justify="space-between">
          <Text fontSize="lg" fontWeight="semibold">
            {pagination ? pagination.total_entries.toLocaleString() : results.length} {' '}
            {searchType} found
          </Text>
          
          {(selectedLeadIds.length > 0 || selectedCompanyIds.length > 0) && (
            <Badge 
              colorScheme="green" 
              px={4} 
              py={2} 
              borderRadius="full"
              bg="green.500"
              color="white"
              fontWeight="700"
              fontSize="sm"
              boxShadow="0 4px 12px rgba(34, 197, 94, 0.3)"
            >
              {searchType === 'people' ? selectedLeadIds.length : selectedCompanyIds.length} selected
            </Badge>
          )}
        </Flex>

        {/* Results grid */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
          {results
            .sort((a, b) => (b.confidence || 0) - (a.confidence || 0)) // Sort by confidence descending
            .map((result) => 
            searchType === 'people' 
              ? <PersonCard 
                  key={result.id} 
                  person={result as LeadSearchResult}
                  isSelected={selectedLeadIds.includes(result.id)}
                  onSelect={onLeadSelect}
                />
              : <CompanyCard 
                  key={result.id} 
                  company={result as CompanySearchResult}
                  isSelected={selectedCompanyIds.includes(result.id)}
                  onSelect={onCompanySelect}
                />
          )}
        </SimpleGrid>

        {/* Pagination */}
        {pagination && pagination.total_pages > 1 && (
          <SearchPagination />
        )}
      </VStack>
    </Box>
  )
}

// Person card component with expandable details
interface PersonCardProps {
  person: LeadSearchResult
  isSelected: boolean
  onSelect?: (leadId: string, selected: boolean) => void
}

function PersonCard({ person, isSelected, onSelect }: PersonCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const selectedBorderColor = useColorModeValue('green.500', 'green.300')
  const expandedBg = useColorModeValue('gray.50', 'gray.700')
  
  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect?.(person.id, !isSelected)
  }

  const handleCardClick = () => {
    setIsExpanded(!isExpanded)
  }

  // Get company logo URL
  const getCompanyLogo = (companyName?: string, websiteUrl?: string) => {
    if (websiteUrl) {
      try {
        const domain = new URL(websiteUrl).hostname
        return `https://logo.clearbit.com/${domain}`
      } catch {
        // If invalid URL, fall back to company name
      }
    }
    if (companyName) {
      return `https://logo.clearbit.com/${companyName.toLowerCase().replace(/\s+/g, '')}.com`
    }
    return null
  }

  // Safe date formatting
  const formatDate = (dateValue?: string | Date) => {
    if (!dateValue) return 'Recently'
    try {
      const date = new Date(dateValue)
      return isNaN(date.getTime()) ? 'Recently' : date.toLocaleDateString()
    } catch {
      return 'Recently'
    }
  }

  // Format growth percentage
  const formatGrowthPercentage = (growth?: number) => {
    if (!growth) return null
    const percentage = Math.round(growth * 100)
    return percentage > 0 ? `+${percentage}%` : `${percentage}%`
  }

  const companyLogo = getCompanyLogo(person.company, person.company_website)

  return (
    <Card
      bg={cardBg}
      border="2px solid"
      borderColor={isSelected ? selectedBorderColor : borderColor}
      cursor="pointer"
      transition="all 0.3s ease"
      _hover={{
        borderColor: selectedBorderColor,
        shadow: 'lg',
        transform: 'translateY(-2px)'
      }}
      overflow="hidden"
      borderRadius="xl"
    >
      <CardBody p={0}>
        {/* Essential Info - Always Visible */}
        <Box p={4}>
          <HStack spacing={4} align="start">
            {/* Person Avatar */}
            <Avatar 
              size="lg" 
              name={person.full_name}
              src={person.photo_url || (person.linkedin_url ? `https://unavatar.io/linkedin/${person.linkedin_url.split('/').pop()}` : undefined)}
              bg="purple.100"
              color="purple.600"
            />
            
            <VStack spacing={2} align="start" flex={1}>
              {/* Name and Selection */}
              <HStack spacing={3} align="center" w="full">
                <VStack spacing={0} align="start" flex={1}>
                  <Text fontWeight="bold" fontSize="lg" lineHeight="shorter" color={useColorModeValue('gray.800', 'white')}>
                    {person.full_name}
                  </Text>
                  {person.title && (
                    <Text fontSize="md" color={useColorModeValue('gray.600', 'gray.300')} fontWeight="medium" lineHeight="shorter">
                      {person.title}
                    </Text>
                  )}
                </VStack>
                
                <IconButton
                  aria-label={isSelected ? 'Deselect' : 'Select'}
                  icon={isSelected ? <FiCheck /> : <FiPlus />}
                  size="sm"
                  colorScheme={isSelected ? 'green' : 'purple'}
                  variant={isSelected ? 'solid' : 'outline'}
                  onClick={handleSelect}
                  bg={isSelected ? 'green.500' : 'white'}
                  color={isSelected ? 'white' : 'purple.600'}
                  borderColor={isSelected ? 'green.500' : 'purple.400'}
                  _hover={{
                    bg: isSelected ? 'green.600' : 'purple.50',
                    borderColor: isSelected ? 'green.600' : 'purple.500',
                    transform: 'scale(1.05)'
                  }}
                  boxShadow={isSelected ? "0 2px 8px rgba(34, 197, 94, 0.3)" : "0 1px 4px rgba(0, 0, 0, 0.1)"}
                />
              </HStack>
              
              {/* Company Info */}
              {person.company && (
                <HStack spacing={2} align="center">
                  {companyLogo && (
                    <Avatar 
                      size="xs" 
                      src={companyLogo}
                      name={person.company}
                      bg="gray.100"
                    />
                  )}
                  <Text fontSize="sm" color={useColorModeValue('gray.700', 'gray.300')} fontWeight="medium">
                    {person.company}
                  </Text>
                </HStack>
              )}

              {/* Contact Options */}
              <HStack spacing={2} align="center">
                {person.linkedin_url && (
                  <Tooltip label="LinkedIn Profile">
                    <IconButton
                      aria-label="LinkedIn"
                      icon={<FiLinkedin />}
                      size="xs"
                      variant="ghost"
                      colorScheme="blue"
                      as={Link}
                      href={person.linkedin_url}
                      isExternal
                    />
                  </Tooltip>
                )}
                
                <Spacer />

                {/* Confidence Badge */}
                <Badge 
                  colorScheme={person.confidence > 0.8 ? 'green' : person.confidence > 0.6 ? 'yellow' : 'red'}
                  size="sm"
                  px={2}
                  py={1}
                  borderRadius="md"
                  fontSize="xs"
                  fontWeight="600"
                >
                  {Math.round(person.confidence * 100)}% match
                </Badge>

                {/* Expand Button */}
                <IconButton
                  aria-label={isExpanded ? 'Show less' : 'Show more'}
                  icon={isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                  size="xs"
                  variant="ghost"
                  onClick={handleCardClick}
                  color="gray.500"
                />
              </HStack>
            </VStack>
          </HStack>
        </Box>

        {/* Detailed Info - Collapsible */}
        <Collapse in={isExpanded} animateOpacity>
          <Box p={4} pt={0} bg={expandedBg}>
            <Divider mb={4} />
            
            <VStack spacing={4} align="start">
              {/* Contact Information */}
              {(person.email || person.phone) && (
                <Box w="full">
                  <Text fontSize="sm" fontWeight="bold" color="gray.700" mb={2}>
                    Contact Information
                  </Text>
                  <VStack spacing={2} align="start">
                    {person.email && (
                      <HStack spacing={2}>
                        <FiMail size="14" color="gray" />
                        <Text fontSize="sm" color="gray.600">
                          {person.email}
                        </Text>
                      </HStack>
                    )}
                    {person.phone && (
                      <HStack spacing={2}>
                        <FiPhone size="14" color="gray" />
                        <Text fontSize="sm" color="gray.600">
                          {person.phone}
                        </Text>
                      </HStack>
                    )}
                  </VStack>
                </Box>
              )}

              {/* Company Details */}
              {(person.company_size || person.industry || person.company_website) && (
                <Box w="full">
                  <Text fontSize="sm" fontWeight="bold" color="gray.700" mb={2}>
                    🏢 Company Details
                  </Text>
                  <VStack spacing={2} align="start">
                    {person.industry && (
                      <HStack spacing={2}>
                        <FiBriefcase size="14" color="gray" />
                        <Text fontSize="sm" color="gray.600">
                          {person.industry}
                        </Text>
                      </HStack>
                    )}
                    {person.company_size && (
                      <HStack spacing={2}>
                        <FiUsers size="14" color="gray" />
                        <Text fontSize="sm" color="gray.600">
                          {person.company_size} employees
                        </Text>
                      </HStack>
                    )}
                    {person.company_website && (
                      <HStack spacing={2}>
                        <FiGlobe size="14" color="gray" />
                        <Link 
                          href={person.company_website} 
                          isExternal
                          color="blue.600"
                          fontSize="sm"
                          _hover={{ textDecoration: 'underline' }}
                        >
                          {person.company_website}
                        </Link>
                      </HStack>
                    )}
                  </VStack>
                </Box>
              )}

              {/* Location & Experience */}
              {(person.location || person.seniority || person.years_experience) && (
                <Box w="full">
                  <Text fontSize="sm" fontWeight="bold" color="gray.700" mb={2}>
                    📍 Background
                  </Text>
                  <VStack spacing={2} align="start">
                    {person.location && (
                      <HStack spacing={2}>
                        <FiMapPin size="14" color="gray" />
                        <Text fontSize="sm" color="gray.600">
                          {person.location}
                        </Text>
                      </HStack>
                    )}
                    {person.seniority && (
                      <HStack spacing={2}>
                        <FiTarget size="14" color="gray" />
                        <Text fontSize="sm" color="gray.600">
                          {person.seniority} level
                        </Text>
                      </HStack>
                    )}
                    {person.years_experience && (
                      <HStack spacing={2}>
                        <FiCalendar size="14" color="gray" />
                        <Text fontSize="sm" color="gray.600">
                          {person.years_experience} years experience
                        </Text>
                      </HStack>
                    )}
                  </VStack>
                </Box>
              )}

              {/* Data Source & Freshness */}
              <Box w="full">
                <Text fontSize="sm" fontWeight="bold" color="gray.700" mb={2}>
                  Data Info
                </Text>
                <HStack spacing={4} fontSize="xs" color="gray.500">
                  <Text>Source: {person.data_source}</Text>
                  <Text>Updated: {formatDate(person.last_updated)}</Text>
                </HStack>
              </Box>
            </VStack>
          </Box>
        </Collapse>
      </CardBody>
    </Card>
  )
}

// Company card component
interface CompanyCardProps {
  company: CompanySearchResult
  isSelected: boolean
  onSelect?: (companyId: string, selected: boolean) => void
}

function CompanyCard({ company, isSelected, onSelect }: CompanyCardProps) {
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const selectedBorderColor = useColorModeValue('purple.500', 'purple.300')
  
  const handleSelect = () => {
    onSelect?.(company.id, !isSelected)
  }

  return (
    <Card
      bg={cardBg}
      border="2px solid"
      borderColor={isSelected ? selectedBorderColor : borderColor}
      cursor="pointer"
      transition="all 0.2s"
      _hover={{
        borderColor: selectedBorderColor,
        shadow: 'md'
      }}
      onClick={handleSelect}
    >
      <CardBody p={4}>
        <VStack spacing={3} align="start">
          {/* Header */}
          <HStack spacing={3} w="full">
            <Avatar 
              size="md" 
              name={company.name}
            />
            
            <VStack spacing={0} align="start" flex={1}>
              <Text fontWeight="bold" fontSize="md">
                {company.name}
              </Text>
              {company.industry && (
                <Text fontSize="sm" color="gray.600">
                  {company.industry}
                </Text>
              )}
              {company.domain && (
                <Text fontSize="sm" color="purple.600" fontWeight="medium">
                  {company.domain}
                </Text>
              )}
            </VStack>

            <IconButton
              aria-label={isSelected ? 'Deselect' : 'Select'}
              icon={isSelected ? <FiCheck /> : <FiPlus />}
              size="sm"
              colorScheme={isSelected ? 'green' : 'purple'}
              variant={isSelected ? 'solid' : 'outline'}
              onClick={handleSelect}
              bg={isSelected ? 'green.500' : 'white'}
              color={isSelected ? 'white' : 'purple.600'}
              borderColor={isSelected ? 'green.500' : 'purple.400'}
              _hover={{
                bg: isSelected ? 'green.600' : 'purple.50',
                borderColor: isSelected ? 'green.600' : 'purple.500',
                transform: 'scale(1.05)'
              }}
              boxShadow={isSelected ? "0 2px 8px rgba(34, 197, 94, 0.3)" : "0 1px 4px rgba(0, 0, 0, 0.1)"}
            />
          </HStack>

          {/* Location */}
          {(company.headquarters_city || company.headquarters_country) && (
            <HStack spacing={2}>
              <FiMapPin size={14} />
              <Text fontSize="sm" color="gray.600">
                {[company.headquarters_city, company.headquarters_state, company.headquarters_country]
                  .filter(Boolean)
                  .join(', ')}
              </Text>
            </HStack>
          )}

          {/* Company stats */}
          <HStack spacing={4} flexWrap="wrap">
            {company.employee_count && (
              <Badge colorScheme="blue" size="sm" display="flex" alignItems="center" gap={1}>
                <FiUsers size={12} />
                {company.employee_count.toLocaleString()} employees
              </Badge>
            )}
            
            {company.revenue_range && (
              <Badge colorScheme="green" size="sm" display="flex" alignItems="center" gap={1}>
                <FiDollarSign size={12} />
                {company.revenue_range}
              </Badge>
            )}
            
            {company.founded_year && (
              <Badge colorScheme="gray" size="sm" display="flex" alignItems="center" gap={1}>
                <FiCalendar size={12} />
                {company.founded_year}
              </Badge>
            )}
          </HStack>

          {/* Links and actions */}
          <HStack spacing={2} flexWrap="wrap">
            {company.website_url && (
              <Tooltip label={company.website_url}>
                <IconButton
                  aria-label="Website"
                  icon={<FiGlobe />}
                  size="xs"
                  variant="ghost"
                  colorScheme="blue"
                  as={Link}
                  href={company.website_url}
                  isExternal
                />
              </Tooltip>
            )}
            
            {company.linkedin_url && (
              <Tooltip label="LinkedIn Company Page">
                <IconButton
                  aria-label="LinkedIn"
                  icon={<FiLinkedin />}
                  size="xs"
                  variant="ghost"
                  colorScheme="blue"
                  as={Link}
                  href={company.linkedin_url}
                  isExternal
                />
              </Tooltip>
            )}

            <Spacer />

            {/* Confidence score */}
            <Badge 
              colorScheme={company.confidence > 0.8 ? 'green' : company.confidence > 0.6 ? 'yellow' : 'red'}
              size="sm"
            >
              {Math.round(company.confidence * 100)}% match
            </Badge>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  )
}

export default SearchResults 