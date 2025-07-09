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
}

function SearchResults({ className }: SearchResultsProps) {
  const { results, loading, error, searchType, pagination } = useSearchResults()
  const { hasActiveFilters } = useApolloSearch()

  if (loading) {
    return (
      <Box className={className} flex={1} display="flex" alignItems="center" justifyContent="center" textAlign="center" py={12}>
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
      <Box className={className} flex={1} display="flex" alignItems="center">
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
      <Box className={className} flex={1} display="flex" alignItems="center" justifyContent="center" textAlign="center" py={12}>
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
      <Box className={className} flex={1} display="flex" alignItems="center" justifyContent="center" textAlign="center" py={12}>
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
    <Box className={className} flex={1} display="flex" flexDirection="column" overflow="hidden">
      <VStack spacing={6} align="stretch" flex={1} overflow="hidden">
        {/* Results header */}
        <Flex align="center" justify="space-between" flexShrink={0}>
          <Text fontSize="lg" fontWeight="600" color="gray.700">
            Preview Results
          </Text>
        </Flex>

        {/* Results grid */}
        <Box flex={1} overflow="auto" pr={2}>
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
            {results
              .sort((a, b) => (b.confidence || 0) - (a.confidence || 0)) // Sort by confidence descending
              .map((result) => 
              searchType === 'people' 
                ? <PersonCard 
                    key={result.id} 
                    person={result as LeadSearchResult}
                  />
                : <CompanyCard 
                    key={result.id} 
                    company={result as CompanySearchResult}
                  />
            )}
          </SimpleGrid>
        </Box>

        {/* Pagination */}
        {pagination && pagination.total_pages > 1 && (
          <Box flexShrink={0}>
            <SearchPagination />
          </Box>
        )}
      </VStack>
    </Box>
  )
}

export default SearchResults

// Person Card Component
interface PersonCardProps {
  person: LeadSearchResult
}

function PersonCard({ person }: PersonCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  const handleCardClick = () => {
    setIsExpanded(!isExpanded)
  }

  const getCompanyLogo = (companyName?: string, websiteUrl?: string) => {
    if (person.company_logo_url) {
      return person.company_logo_url
    }
    
    // Fallback to domain-based logo
    if (websiteUrl) {
      const domain = websiteUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
      return `https://logo.clearbit.com/${domain}`
    }
    
    return undefined
  }

  const formatDate = (dateValue?: string | Date) => {
    if (!dateValue) return undefined
    
    try {
      const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue
      return date.toLocaleDateString()
    } catch {
      return undefined
    }
  }

  const formatGrowthPercentage = (growth?: number) => {
    if (growth === undefined || growth === null) return null
    
    const percentage = Math.round(growth * 100)
    const isPositive = percentage > 0
    
    return (
      <Badge 
        colorScheme={isPositive ? 'green' : percentage < 0 ? 'red' : 'gray'}
        size="sm"
      >
        {isPositive ? '+' : ''}{percentage}%
      </Badge>
    )
  }

  return (
    <Card
      bg={cardBg}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="xl"
      overflow="hidden"
      cursor="pointer"
      onClick={handleCardClick}
      _hover={{
        shadow: 'lg',
        transform: 'translateY(-2px)',
        borderColor: 'purple.300',
      }}
      transition="all 0.2s ease"
      position="relative"
    >
      <CardBody p={4}>
        <VStack spacing={3} align="stretch">
          {/* Header with person info */}
          <HStack spacing={3} align="start">
            <Avatar
              size="md"
              src={person.photo_url}
              name={person.full_name}
              bg="purple.500"
              color="white"
            />
            <Box flex={1} minW={0}>
              <HStack justify="space-between" align="start">
                <VStack align="start" spacing={0} flex={1} minW={0}>
                  <Text fontWeight="bold" fontSize="md" noOfLines={1}>
                    {person.full_name}
                  </Text>
                  {person.title && (
                    <Text fontSize="sm" color="gray.600" noOfLines={1}>
                      {person.title}
                    </Text>
                  )}
                </VStack>
                {person.confidence && (
                  <Badge 
                    colorScheme="purple" 
                    variant="subtle"
                    fontSize="xs"
                    px={2}
                  >
                    {Math.round(person.confidence * 100)}% MATCH
                  </Badge>
                )}
              </HStack>
            </Box>
          </HStack>

          {/* Company info */}
          {person.company && (
            <HStack spacing={2} align="center">
              <Avatar
                size="xs"
                src={getCompanyLogo(person.company, person.company_website)}
                name={person.company}
                bg="gray.500"
              />
              <Text fontSize="sm" fontWeight="medium" color="gray.700" noOfLines={1}>
                {person.company}
              </Text>
            </HStack>
          )}

          {/* Quick contact info */}
          <HStack spacing={4} justify="space-between">
            <HStack spacing={3}>
              {person.email && (
                <Tooltip label={person.email}>
                  <IconButton
                    aria-label="Email"
                    icon={<FiMail />}
                    size="sm"
                    variant="ghost"
                    color="blue.500"
                    _hover={{ bg: 'blue.50' }}
                  />
                </Tooltip>
              )}
              {person.linkedin_url && (
                <Tooltip label="LinkedIn Profile">
                  <IconButton
                    aria-label="LinkedIn"
                    icon={<FiLinkedin />}
                    size="sm"
                    variant="ghost"
                    color="blue.600"
                    _hover={{ bg: 'blue.50' }}
                    as={Link}
                    href={person.linkedin_url}
                    isExternal
                  />
                </Tooltip>
              )}
              {person.phone && (
                <Tooltip label={person.phone}>
                  <IconButton
                    aria-label="Phone"
                    icon={<FiPhone />}
                    size="sm"
                    variant="ghost"
                    color="green.500"
                    _hover={{ bg: 'green.50' }}
                  />
                </Tooltip>
              )}
            </HStack>
            
            <IconButton
              aria-label={isExpanded ? "Show less" : "Show more"}
              icon={isExpanded ? <FiChevronUp /> : <FiChevronDown />}
              size="sm"
              variant="ghost"
              color="gray.500"
            />
          </HStack>

          {/* Expanded content */}
          <Collapse in={isExpanded} animateOpacity>
            <VStack spacing={4} align="stretch" pt={4}>
              <Divider />
              
              {/* Location and basic info */}
              <SimpleGrid columns={2} spacing={3}>
                {person.location && (
                  <HStack spacing={2}>
                    <FiMapPin color="gray" size={14} />
                    <Text fontSize="sm" color="gray.600">
                      {person.location}
                    </Text>
                  </HStack>
                )}
                
                {person.seniority_level && (
                  <HStack spacing={2}>
                    <FiBriefcase color="gray" size={14} />
                    <Text fontSize="sm" color="gray.600" textTransform="capitalize">
                      {person.seniority_level.replace('_', ' ')}
                    </Text>
                  </HStack>
                )}
                
                {person.years_experience && (
                  <HStack spacing={2}>
                    <FiCalendar color="gray" size={14} />
                    <Text fontSize="sm" color="gray.600">
                      {person.years_experience} years exp.
                    </Text>
                  </HStack>
                )}
                
                {person.department && (
                  <HStack spacing={2}>
                    <FiTarget color="gray" size={14} />
                    <Text fontSize="sm" color="gray.600" textTransform="capitalize">
                      {person.department}
                    </Text>
                  </HStack>
                )}
              </SimpleGrid>

              {/* Company details */}
              {(person.industry || person.company_size || person.company_website) && (
                <>
                  <Divider />
                  <Box>
                    <Text fontSize="sm" fontWeight="semibold" color="gray.700" mb={2}>
                      Company Details
                    </Text>
                    <SimpleGrid columns={1} spacing={2}>
                      {person.industry && (
                        <HStack spacing={2}>
                          <Text fontSize="xs" color="gray.500" minW="60px">Industry:</Text>
                          <Text fontSize="sm" color="gray.600">{person.industry}</Text>
                        </HStack>
                      )}
                      
                      {person.company_size && (
                        <HStack spacing={2}>
                          <FiUsers color="gray" size={12} />
                          <Text fontSize="sm" color="gray.600">
                            {person.company_size.toLocaleString()} employees
                          </Text>
                        </HStack>
                      )}
                      
                      {person.company_revenue && (
                        <HStack spacing={2}>
                          <FiDollarSign color="gray" size={12} />
                          <Text fontSize="sm" color="gray.600">
                            ${(person.company_revenue / 1000000).toFixed(1)}M revenue
                          </Text>
                        </HStack>
                      )}
                      
                      {person.company_website && (
                        <HStack spacing={2}>
                          <FiGlobe color="gray" size={12} />
                          <Link 
                            href={person.company_website} 
                            isExternal 
                            fontSize="sm" 
                            color="blue.500"
                            _hover={{ textDecoration: 'underline' }}
                          >
                            {person.company_website.replace(/^https?:\/\//, '')}
                          </Link>
                        </HStack>
                      )}
                    </SimpleGrid>
                  </Box>
                </>
              )}

              {/* Growth metrics */}
              {(person.company_headcount_six_month_growth || 
                person.company_headcount_twelve_month_growth || 
                person.company_headcount_twenty_four_month_growth) && (
                <>
                  <Divider />
                  <Box>
                    <Text fontSize="sm" fontWeight="semibold" color="gray.700" mb={2}>
                      Company Growth
                    </Text>
                    <HStack spacing={4} wrap="wrap">
                      {person.company_headcount_six_month_growth !== undefined && (
                        <VStack spacing={1} align="center">
                          <Text fontSize="xs" color="gray.500">6 months</Text>
                          {formatGrowthPercentage(person.company_headcount_six_month_growth)}
                        </VStack>
                      )}
                      
                      {person.company_headcount_twelve_month_growth !== undefined && (
                        <VStack spacing={1} align="center">
                          <Text fontSize="xs" color="gray.500">12 months</Text>
                          {formatGrowthPercentage(person.company_headcount_twelve_month_growth)}
                        </VStack>
                      )}
                      
                      {person.company_headcount_twenty_four_month_growth !== undefined && (
                        <VStack spacing={1} align="center">
                          <Text fontSize="xs" color="gray.500">24 months</Text>
                          {formatGrowthPercentage(person.company_headcount_twenty_four_month_growth)}
                        </VStack>
                      )}
                    </HStack>
                  </Box>
                </>
              )}

              {/* Technologies */}
              {person.technologies && person.technologies.length > 0 && (
                <>
                  <Divider />
                  <Box>
                    <Text fontSize="sm" fontWeight="semibold" color="gray.700" mb={2}>
                      Technologies
                    </Text>
                    <Flex wrap="wrap" gap={1}>
                      {person.technologies.slice(0, 8).map((tech, index) => (
                        <Badge key={index} variant="outline" colorScheme="blue" fontSize="xs">
                          {tech}
                        </Badge>
                      ))}
                      {person.technologies.length > 8 && (
                        <Badge variant="outline" colorScheme="gray" fontSize="xs">
                          +{person.technologies.length - 8} more
                        </Badge>
                      )}
                    </Flex>
                  </Box>
                </>
              )}

              {/* Metadata */}
              <Divider />
              <HStack justify="space-between" fontSize="xs" color="gray.500">
                <Text>Source: {person.data_source === 'apollo' ? 'Apollo' : 'CSV Upload'}</Text>
                {person.last_updated && (
                  <Text>Updated: {formatDate(person.last_updated)}</Text>
                )}
              </HStack>
            </VStack>
          </Collapse>
        </VStack>
      </CardBody>
    </Card>
  )
}

// Company Card Component
interface CompanyCardProps {
  company: CompanySearchResult
}

function CompanyCard({ company }: CompanyCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  const handleCardClick = () => {
    setIsExpanded(!isExpanded)
  }

  const getCompanyLogo = () => {
    if (company.domain) {
      return `https://logo.clearbit.com/${company.domain}`
    }
    return undefined
  }

  const formatRevenue = (revenue?: number) => {
    if (!revenue) return null
    
    if (revenue >= 1000000000) {
      return `$${(revenue / 1000000000).toFixed(1)}B`
    } else if (revenue >= 1000000) {
      return `$${(revenue / 1000000).toFixed(1)}M`
    } else if (revenue >= 1000) {
      return `$${(revenue / 1000).toFixed(1)}K`
    } else {
      return `$${revenue}`
    }
  }

  return (
    <Card
      bg={cardBg}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="xl"
      overflow="hidden"
      cursor="pointer"
      onClick={handleCardClick}
      _hover={{
        shadow: 'lg',
        transform: 'translateY(-2px)',
        borderColor: 'purple.300',
      }}
      transition="all 0.2s ease"
    >
      <CardBody p={4}>
        <VStack spacing={3} align="stretch">
          {/* Header with company info */}
          <HStack spacing={3} align="start">
            <Avatar
              size="md"
              src={getCompanyLogo()}
              name={company.name}
              bg="blue.500"
              color="white"
            />
            <Box flex={1} minW={0}>
              <HStack justify="space-between" align="start">
                <VStack align="start" spacing={0} flex={1} minW={0}>
                  <Text fontWeight="bold" fontSize="md" noOfLines={1}>
                    {company.name}
                  </Text>
                  {company.industry && (
                    <Text fontSize="sm" color="gray.600" noOfLines={1}>
                      {company.industry}
                    </Text>
                  )}
                </VStack>
                {company.confidence && (
                  <Badge 
                    colorScheme="blue" 
                    variant="subtle"
                    fontSize="xs"
                    px={2}
                  >
                    {Math.round(company.confidence * 100)}% MATCH
                  </Badge>
                )}
              </HStack>
            </Box>
          </HStack>

          {/* Quick company metrics */}
          <HStack spacing={4} justify="space-between">
            <HStack spacing={3}>
              {company.employee_count && (
                <HStack spacing={1}>
                  <FiUsers color="gray" size={14} />
                  <Text fontSize="sm" color="gray.600">
                    {company.employee_count.toLocaleString()}
                  </Text>
                </HStack>
              )}
              
              {company.estimated_annual_revenue && (
                <HStack spacing={1}>
                  <FiDollarSign color="gray" size={14} />
                  <Text fontSize="sm" color="gray.600">
                    {formatRevenue(company.estimated_annual_revenue)}
                  </Text>
                </HStack>
              )}
              
              {company.website_url && (
                <Tooltip label={company.website_url}>
                  <IconButton
                    aria-label="Website"
                    icon={<FiGlobe />}
                    size="sm"
                    variant="ghost"
                    color="blue.500"
                    _hover={{ bg: 'blue.50' }}
                    as={Link}
                    href={company.website_url}
                    isExternal
                  />
                </Tooltip>
              )}
            </HStack>
            
            <IconButton
              aria-label={isExpanded ? "Show less" : "Show more"}
              icon={isExpanded ? <FiChevronUp /> : <FiChevronDown />}
              size="sm"
              variant="ghost"
              color="gray.500"
            />
          </HStack>

          {/* Expanded content */}
          <Collapse in={isExpanded} animateOpacity>
            <VStack spacing={4} align="stretch" pt={4}>
              <Divider />
              
              {/* Company description */}
              {company.description && (
                <Box>
                  <Text fontSize="sm" fontWeight="semibold" color="gray.700" mb={1}>
                    Description
                  </Text>
                  <Text fontSize="sm" color="gray.600" noOfLines={3}>
                    {company.description}
                  </Text>
                </Box>
              )}

              {/* Location and basic info */}
              <SimpleGrid columns={2} spacing={3}>
                {company.headquarters_city && (
                  <HStack spacing={2}>
                    <FiMapPin color="gray" size={14} />
                    <Text fontSize="sm" color="gray.600">
                      {[company.headquarters_city, company.headquarters_state, company.headquarters_country]
                        .filter(Boolean)
                        .join(', ')}
                    </Text>
                  </HStack>
                )}
                
                {company.founded_year && (
                  <HStack spacing={2}>
                    <FiCalendar color="gray" size={14} />
                    <Text fontSize="sm" color="gray.600">
                      Founded {company.founded_year}
                    </Text>
                  </HStack>
                )}
              </SimpleGrid>

              {/* Technologies */}
              {company.technologies && company.technologies.length > 0 && (
                <>
                  <Divider />
                  <Box>
                    <Text fontSize="sm" fontWeight="semibold" color="gray.700" mb={2}>
                      Technologies
                    </Text>
                    <Flex wrap="wrap" gap={1}>
                      {company.technologies.slice(0, 8).map((tech, index) => (
                        <Badge key={index} variant="outline" colorScheme="blue" fontSize="xs">
                          {tech}
                        </Badge>
                      ))}
                      {company.technologies.length > 8 && (
                        <Badge variant="outline" colorScheme="gray" fontSize="xs">
                          +{company.technologies.length - 8} more
                        </Badge>
                      )}
                    </Flex>
                  </Box>
                </>
              )}

              {/* Funding info */}
              {(company.funding_stage || company.funding_total) && (
                <>
                  <Divider />
                  <Box>
                    <Text fontSize="sm" fontWeight="semibold" color="gray.700" mb={2}>
                      Funding
                    </Text>
                    <HStack spacing={4}>
                      {company.funding_stage && (
                        <Badge colorScheme="green" textTransform="capitalize">
                          {company.funding_stage.replace('_', ' ')}
                        </Badge>
                      )}
                      
                      {company.funding_total && (
                        <Text fontSize="sm" color="gray.600">
                          {formatRevenue(company.funding_total)} total
                        </Text>
                      )}
                    </HStack>
                  </Box>
                </>
              )}
            </VStack>
          </Collapse>
        </VStack>
      </CardBody>
    </Card>
  )
} 