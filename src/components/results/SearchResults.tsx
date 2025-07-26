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

        {/* Results grid with improved spacing */}
        <Box flex={1} overflow="auto" pr={2}>
          <SimpleGrid columns={{ base: 1, lg: 1 }} spacing={6}>
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

        {/* Results Count Display */}
        {pagination && pagination.total_entries > 0 && (
          <Box flexShrink={0} p={4} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="lg">
            <Text fontSize="sm" color="gray.600" textAlign="center">
              Showing {((pagination.page - 1) * pagination.per_page) + 1} to {Math.min(pagination.page * pagination.per_page, pagination.total_entries)} of {pagination.total_entries.toLocaleString()} results
            </Text>
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
    // Try organization logo first
    if (person.organization?.logo_url) {
      return person.organization.logo_url
    }

    // Try account logo
    if (person.account?.logo_url) {
      return person.account.logo_url
    }

    if (person.company_logo_url) {
      return person.company_logo_url
    }

    // Fallback to domain-based logo
    const domain = person.organization?.primary_domain ||
                   person.account?.primary_domain ||
                   person.company_website?.replace(/^https?:\/\//, '').replace(/\/.*$/, '')

    if (domain) {
      return `https://logo.clearbit.com/${domain}`
    }

    return undefined
  }

  const formatDate = (dateValue?: string | Date) => {
    if (!dateValue) return undefined

    try {
      const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short'
      })
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
        fontWeight="medium"
      >
        {isPositive ? '+' : ''}{percentage}%
      </Badge>
    )
  }

  const getCurrentCompany = () => {
    return person.organization || person.account
  }

  const getCompanySize = () => {
    const org = getCurrentCompany()
    if (!org) return null

    // For now, we'll use a placeholder since headcount isn't directly in the response
    // This could be enhanced with actual employee count data
    return null
  }

  const formatPhoneNumber = (phone?: string) => {
    if (!phone) return null
    // Simple phone formatting - could be enhanced
    return phone.replace(/^\+?1?/, '').replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')
  }

  const currentCompany = getCurrentCompany()

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
        shadow: 'xl',
        transform: 'translateY(-2px)',
        borderColor: 'blue.400',
      }}
      transition="all 0.3s ease"
      position="relative"
    >
      <CardBody p={0}>
        {/* Header Section - Always Visible */}
        <Box p={6}>
          <VStack spacing={5} align="stretch">
            {/* Person Info Row - Improved layout */}
            <HStack spacing={5} align="start">
              <Avatar
                size="lg"
                src={person.photo_url}
                name={person.name || `${person.first_name} ${person.last_name}`}
                bg="blue.500"
                color="white"
                border="3px solid"
                borderColor="blue.100"
              />
              <Box flex={1} minW={0}>
                <VStack align="start" spacing={2}>
                  <Text fontWeight="bold" fontSize="xl" noOfLines={1} color="gray.800">
                    {person.name || `${person.first_name} ${person.last_name}`}
                  </Text>
                  {person.title && (
                    <Text fontSize="md" color="gray.600" noOfLines={1} fontWeight="medium">
                      {person.title}
                    </Text>
                  )}

                  {/* Location - With improved styling */}
                  {(person.city || person.state || person.country) && (
                    <HStack spacing={2} mt={1}>
                      <FiMapPin size={16} color="#718096" />
                      <Text fontSize="sm" color="gray.600" fontWeight="medium">
                        {[person.city, person.state, person.country].filter(Boolean).join(', ')}
                      </Text>
                    </HStack>
                  )}

                  {/* Seniority & Department - Moved here for better organization */}
                  <HStack spacing={3} mt={1}>
                    {person.seniority && (
                      <Badge colorScheme="blue" variant="subtle" fontSize="xs" px={2} py={1}>
                        {person.seniority.replace('_', ' ').toUpperCase()}
                      </Badge>
                    )}

                    {person.departments && person.departments.length > 0 && (
                      <Badge colorScheme="purple" variant="subtle" fontSize="xs" px={2} py={1}>
                        {person.departments[0].replace('_', ' ').toUpperCase()}
                      </Badge>
                    )}
                  </HStack>
                </VStack>
              </Box>

              {/* Confidence Badge - Enhanced */}
              {person.confidence && (
                <Badge
                  colorScheme="purple"
                  variant="solid"
                  fontSize="xs"
                  px={2}
                  py={1}
                  borderRadius="md"
                >
                  {Math.round(person.confidence * 100)}% MATCH
                </Badge>
              )}
            </HStack>

            {/* Company Info Row - Enhanced */}
            {currentCompany && (
              <Box
                bg="gray.50"
                p={4}
                borderRadius="lg"
                border="1px solid"
                borderColor="gray.200"
              >
                <HStack spacing={4} align="center">
                  <Avatar
                    size="sm"
                    src={getCompanyLogo()}
                    name={currentCompany.name}
                    bg="gray.400"
                    color="white"
                  />
                  <VStack align="start" spacing={0} flex={1}>
                    <Text fontSize="md" fontWeight="semibold" color="gray.800" noOfLines={1}>
                      {currentCompany.name}
                    </Text>
                    <HStack spacing={4}>
                      {currentCompany.primary_domain && (
                        <Text fontSize="xs" color="gray.500">
                          {currentCompany.primary_domain}
                        </Text>
                      )}
                      {currentCompany.founded_year && (
                        <Text fontSize="xs" color="gray.500">
                          Founded {currentCompany.founded_year}
                        </Text>
                      )}
                    </HStack>
                  </VStack>

                  {/* Growth Indicators */}
                  <HStack spacing={3}>
                    {currentCompany.organization_headcount_six_month_growth !== undefined && (
                      <VStack spacing={0} align="center">
                        <Text fontSize="xs" color="gray.500" fontWeight="medium">6M</Text>
                        {formatGrowthPercentage(currentCompany.organization_headcount_six_month_growth)}
                      </VStack>
                    )}
                    {currentCompany.organization_headcount_twelve_month_growth !== undefined && (
                      <VStack spacing={0} align="center">
                        <Text fontSize="xs" color="gray.500" fontWeight="medium">12M</Text>
                        {formatGrowthPercentage(currentCompany.organization_headcount_twelve_month_growth)}
                      </VStack>
                    )}
                  </HStack>
                </HStack>
              </Box>
            )}

            {/* Show More Button - Centered */}
            <Flex justify="center">
              <Button
                size="sm"
                variant="ghost"
                rightIcon={isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                color="gray.500"
                _hover={{ bg: 'gray.50' }}
                fontWeight="normal"
              >
                {isExpanded ? "Show less" : "Show more details"}
              </Button>
            </Flex>
          </VStack>
        </Box>

        {/* Expanded content remains unchanged */}
        <Collapse in={isExpanded} animateOpacity>
          <Box px={6} pb={6}>
            <VStack spacing={5} align="stretch">
              <Divider />

              {/* Career History */}
              {person.employment_history && person.employment_history.length > 0 && (
                <Box>
                  <Text fontSize="md" fontWeight="semibold" color="gray.700" mb={3}>
                    Career History
                  </Text>
                  <VStack align="stretch" spacing={3}>
                    {person.employment_history.slice(0, 4).map((job, index) => (
                      <HStack key={job.id || index} spacing={3} align="start">
                        <Box
                          w="8px"
                          h="8px"
                          bg={job.current ? "green.400" : "gray.300"}
                          borderRadius="full"
                          mt={1}
                          flexShrink={0}
                        />
                        <Box flex={1}>
                          <VStack align="start" spacing={0}>
                            <Text fontSize="sm" fontWeight="medium" color="gray.800">
                              {job.title}
                            </Text>
                            <Text fontSize="sm" color="gray.600">
                              {job.organization_name}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              {formatDate(job.start_date)} - {job.current ? 'Present' : formatDate(job.end_date)}
                            </Text>
                          </VStack>
                        </Box>
                        {job.current && (
                          <Badge colorScheme="green" size="xs" variant="solid">
                            Current
                          </Badge>
                        )}
                      </HStack>
                    ))}
                    {person.employment_history.length > 4 && (
                      <Text fontSize="xs" color="gray.500" fontStyle="italic" textAlign="center">
                        +{person.employment_history.length - 4} more positions
                      </Text>
                    )}
                  </VStack>
                </Box>
              )}

              {/* Skills & Functions */}
              {((person.skills && person.skills.length > 0) ||
                (person.functions && person.functions.length > 0) ||
                (person.subdepartments && person.subdepartments.length > 0)) && (
                <Box>
                  <Text fontSize="md" fontWeight="semibold" color="gray.700" mb={3}>
                    Skills & Expertise
                  </Text>
                  <VStack align="stretch" spacing={3}>
                    {person.functions && person.functions.length > 0 && (
                      <Box>
                        <Text fontSize="sm" color="gray.600" mb={2}>Functions</Text>
                        <Flex wrap="wrap" gap={2}>
                          {person.functions.map((func, index) => (
                            <Badge key={index} colorScheme="blue" variant="subtle" size="sm">
                              {func.replace('_', ' ').toUpperCase()}
                            </Badge>
                          ))}
                        </Flex>
                      </Box>
                    )}

                    {person.subdepartments && person.subdepartments.length > 0 && (
                      <Box>
                        <Text fontSize="sm" color="gray.600" mb={2}>Specializations</Text>
                        <Flex wrap="wrap" gap={2}>
                          {person.subdepartments.map((dept, index) => (
                            <Badge key={index} colorScheme="purple" variant="subtle" size="sm">
                              {dept.replace('_', ' ').toUpperCase()}
                            </Badge>
                          ))}
                        </Flex>
                      </Box>
                    )}

                    {person.skills && person.skills.length > 0 && (
                      <Box>
                        <Text fontSize="sm" color="gray.600" mb={2}>Skills</Text>
                        <Flex wrap="wrap" gap={2}>
                          {person.skills.slice(0, 12).map((skill, index) => (
                            <Badge key={index} colorScheme="gray" variant="outline" size="sm">
                              {skill}
                            </Badge>
                          ))}
                          {person.skills.length > 12 && (
                            <Badge colorScheme="gray" variant="solid" size="sm">
                              +{person.skills.length - 12} more
                            </Badge>
                          )}
                        </Flex>
                      </Box>
                    )}
                  </VStack>
                </Box>
              )}

              {/* Company Details */}
              {currentCompany && (
                <Box>
                  <Text fontSize="md" fontWeight="semibold" color="gray.700" mb={3}>
                    Company Information
                  </Text>
                  <SimpleGrid columns={2} spacing={4}>
                    {currentCompany.website_url && (
                      <HStack spacing={2}>
                        <FiGlobe size={14} color="gray" />
                        <Link
                          href={currentCompany.website_url}
                          isExternal
                          fontSize="sm"
                          color="blue.500"
                          _hover={{ textDecoration: 'underline' }}
                        >
                          {currentCompany.website_url.replace(/^https?:\/\//, '')}
                        </Link>
                      </HStack>
                    )}

                    {currentCompany.linkedin_url && (
                      <HStack spacing={2}>
                        <FiLinkedin size={14} color="gray" />
                        <Link
                          href={currentCompany.linkedin_url}
                          isExternal
                          fontSize="sm"
                          color="blue.500"
                          _hover={{ textDecoration: 'underline' }}
                        >
                          Company LinkedIn
                        </Link>
                      </HStack>
                    )}

                    {currentCompany.primary_phone && (
                      <HStack spacing={2}>
                        <FiPhone size={14} color="gray" />
                        <Text fontSize="sm" color="gray.600">
                          {formatPhoneNumber(currentCompany.primary_phone.number)}
                        </Text>
                      </HStack>
                    )}

                    {(currentCompany.city || currentCompany.state || currentCompany.country) && (
                      <HStack spacing={2}>
                        <FiMapPin size={14} color="gray" />
                        <Text fontSize="sm" color="gray.600">
                          {[currentCompany.city, currentCompany.state, currentCompany.country].filter(Boolean).join(', ')}
                        </Text>
                      </HStack>
                    )}
                  </SimpleGrid>
                </Box>
              )}

              {/* Contact Information */}
              <Box>
                <Text fontSize="md" fontWeight="semibold" color="gray.700" mb={3}>
                  Contact Information
                </Text>
                <VStack align="stretch" spacing={2}>
                  {person.email && person.email_status !== 'unavailable' && (
                    <HStack justify="space-between">
                      <HStack spacing={2}>
                        <FiMail size={14} color="gray" />
                        <Text fontSize="sm" color="gray.600">
                          {person.email}
                        </Text>
                      </HStack>
                      <Badge
                        colorScheme={person.email_status === 'verified' ? 'green' : person.email_status === 'likely' ? 'blue' : person.email_status === 'guessed' ? 'yellow' : 'red'}
                        size="sm"
                        variant="subtle"
                      >
                        {person.email_status === 'verified' ? 'Verified' : person.email_status === 'likely' ? 'Likely' : person.email_status === 'guessed' ? 'Guessed' : 'Not Available'}
                      </Badge>
                    </HStack>
                  )}

                  {person.linkedin_url && (
                    <HStack spacing={2}>
                      <FiLinkedin size={14} color="gray" />
                      <Link
                        href={person.linkedin_url}
                        isExternal
                        fontSize="sm"
                        color="blue.500"
                        _hover={{ textDecoration: 'underline' }}
                        isTruncated
                      >
                        {person.linkedin_url}
                      </Link>
                    </HStack>
                  )}

                  {person.twitter_url && (
                    <HStack spacing={2}>
                      <Text fontSize="sm" color="gray.400">𝕏</Text>
                      <Link
                        href={person.twitter_url}
                        isExternal
                        fontSize="sm"
                        color="blue.500"
                        _hover={{ textDecoration: 'underline' }}
                      >
                        Twitter Profile
                      </Link>
                    </HStack>
                  )}
                </VStack>
              </Box>
            </VStack>
          </Box>
        </Collapse>
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
      <CardBody p={5}>
        <VStack spacing={4} align="stretch">
          {/* Header with company info - Improved layout */}
          <HStack spacing={4} align="start">
            <Avatar
              size="lg"
              src={getCompanyLogo()}
              name={company.name}
              bg="blue.500"
              color="white"
              border="2px solid"
              borderColor="blue.100"
            />
            <Box flex={1} minW={0}>
              <VStack align="start" spacing={2} flex={1} minW={0}>
                <Text fontWeight="bold" fontSize="lg" noOfLines={1}>
                  {company.name}
                </Text>
                {company.industry && (
                  <Text fontSize="sm" color="gray.600" noOfLines={1}>
                    {company.industry}
                  </Text>
                )}

                {/* Location - With improved styling */}
                {company.headquarters_city && (
                  <HStack spacing={2} mt={1}>
                    <FiMapPin color="#718096" size={16} />
                    <Text fontSize="sm" color="gray.600" fontWeight="medium">
                      {[company.headquarters_city, company.headquarters_state, company.headquarters_country]
                        .filter(Boolean)
                        .join(', ')}
                    </Text>
                  </HStack>
                )}

                {/* Company metrics - Better organized */}
                <HStack spacing={6} mt={1}>
                  {company.employee_count && (
                    <HStack spacing={2}>
                      <FiUsers color="#718096" size={16} />
                      <Text fontSize="sm" color="gray.600" fontWeight="medium">
                        {company.employee_count.toLocaleString()} employees
                      </Text>
                    </HStack>
                  )}

                  {company.estimated_annual_revenue && (
                    <HStack spacing={2}>
                      <FiDollarSign color="#718096" size={16} />
                      <Text fontSize="sm" color="gray.600" fontWeight="medium">
                        {formatRevenue(company.estimated_annual_revenue)} revenue
                      </Text>
                    </HStack>
                  )}
                </HStack>
              </VStack>

              {/* Confidence badge - Enhanced */}
              {company.confidence && (
                <Badge
                  colorScheme="blue"
                  variant="solid"
                  fontSize="xs"
                  px={2}
                  py={1}
                  borderRadius="md"
                >
                  {Math.round(company.confidence * 100)}% MATCH
                </Badge>
              )}
            </Box>
          </HStack>

          {/* Show More Button - Centered */}
          <Flex justify="center">
            <Button
              size="sm"
              variant="ghost"
              rightIcon={isExpanded ? <FiChevronUp /> : <FiChevronDown />}
              color="gray.500"
              _hover={{ bg: 'gray.50' }}
              fontWeight="normal"
            >
              {isExpanded ? "Show less" : "Show more details"}
            </Button>
          </Flex>

          {/* Expanded content remains unchanged */}
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