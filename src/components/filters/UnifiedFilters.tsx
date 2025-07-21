'use client'

import React, { useEffect, useState } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  Heading,
  Spinner,
  Alert,
  AlertIcon,
  Badge,
  useColorModeValue,
} from '@chakra-ui/react'
import ApolloFilters from './ApolloFilters'
import { ExplorimFilters } from './ExplorimFilters'
import { type ApolloFilterInput, DEFAULT_APOLLO_FILTERS } from '@/types/apollo'
import { type ExplorimFilters as ExplorimFiltersType, type ICPFilterProfile } from '@/types/explorium'

interface UnifiedFiltersProps {
  // Apollo filters
  apolloFilters?: ApolloFilterInput
  onApolloFilterChange?: (field: keyof ApolloFilterInput, value: any) => void
  
  // Explorium filters
  explorimFilters?: ExplorimFiltersType
  onExplorimFilterChange?: (field: keyof ExplorimFiltersType, value: any) => void
  
  // Shared props
  savedProfiles?: ICPFilterProfile[]
  onSaveProfile?: (name: string, description?: string) => void
  onLoadProfile?: (profile: ICPFilterProfile) => void
  
  // Provider selection
  forceProvider?: 'apollo' | 'explorium'
}

interface ProviderInfo {
  currentProvider: 'apollo' | 'explorium'
  available: boolean
  features: any
  filterOptions: any
}

export function UnifiedFilters({
  apolloFilters,
  onApolloFilterChange,
  explorimFilters,
  onExplorimFilterChange,
  savedProfiles,
  onSaveProfile,
  onLoadProfile,
  forceProvider
}: UnifiedFiltersProps) {
  const [providerInfo, setProviderInfo] = useState<ProviderInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const borderColor = useColorModeValue('purple.200', 'purple.600')
  const bgColor = useColorModeValue('white', 'gray.800')

  // Fetch provider information
  useEffect(() => {
    const fetchProviderInfo = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const response = await fetch('/api/leads/search', {
          method: 'GET'
        })
        
        if (!response.ok) {
          throw new Error('Failed to fetch provider information')
        }
        
        const data = await response.json()
        
        if (data.success) {
          setProviderInfo({
            currentProvider: data.data.currentProvider,
            available: data.data.available,
            features: data.data.providerConfig.features,
            filterOptions: data.data.filterOptions
          })
        } else {
          throw new Error(data.message || 'Failed to get provider info')
        }
      } catch (err) {
        console.error('Error fetching provider info:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProviderInfo()
  }, [])

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="200px">
        <VStack spacing={4}>
          <Spinner size="lg" color="purple.500" />
          <Text color="gray.600">Loading provider information...</Text>
        </VStack>
      </Box>
    )
  }

  if (error) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        <Box>
          <Text fontWeight="bold">Provider Error</Text>
          <Text fontSize="sm">{error}</Text>
        </Box>
      </Alert>
    )
  }

  if (!providerInfo) {
    return (
      <Alert status="warning" borderRadius="md">
        <AlertIcon />
        <Text>No provider information available</Text>
      </Alert>
    )
  }

  if (!providerInfo.available) {
    return (
      <Alert status="warning" borderRadius="md">
        <AlertIcon />
        <Box>
          <Text fontWeight="bold">Provider Not Available</Text>
          <Text fontSize="sm">
            {providerInfo.currentProvider === 'apollo' ? 'Apollo API key not configured' : 'Explorium API key not configured'}
          </Text>
        </Box>
      </Alert>
    )
  }

  const currentProvider = forceProvider || providerInfo.currentProvider

  return (
    <Box>
      {/* Provider Status Badge */}
      <HStack mb={4} justify="space-between" align="center">
        <Heading size="sm" color="purple.600">
          Data Source Filters
        </Heading>
        <Badge 
          colorScheme={currentProvider === 'apollo' ? 'blue' : 'green'}
          variant="subtle"
          fontSize="xs"
          px={2}
          py={1}
          borderRadius="md"
        >
          {currentProvider === 'apollo' ? '🚀 Apollo.io' : '🔍 Explorium'}
        </Badge>
      </HStack>

      {/* Provider Features Info */}
      <Box mb={4} p={3} bg={bgColor} borderRadius="md" border="1px solid" borderColor={borderColor}>
        <Text fontSize="xs" color="gray.600" mb={2}>
          Provider Features:
        </Text>
        <HStack spacing={2} wrap="wrap">
          {providerInfo.features.emailVerification && (
            <Badge size="sm" colorScheme="green">✉️ Email Verification</Badge>
          )}
          {providerInfo.features.phoneNumbers && (
            <Badge size="sm" colorScheme="blue">📞 Phone Numbers</Badge>
          )}
          {providerInfo.features.socialProfiles && (
            <Badge size="sm" colorScheme="purple">🔗 Social Profiles</Badge>
          )}
          {providerInfo.features.technographics && (
            <Badge size="sm" colorScheme="orange">🔧 Technographics</Badge>
          )}
          {providerInfo.features.intentData && (
            <Badge size="sm" colorScheme="red">🎯 Intent Data</Badge>
          )}
        </HStack>
      </Box>

      {/* Render Provider-Specific Filters */}
      {currentProvider === 'apollo' ? (
        <ApolloFilters
          filters={apolloFilters || DEFAULT_APOLLO_FILTERS}
          onChange={onApolloFilterChange || (() => {})}
          savedProfiles={savedProfiles}
          onSaveProfile={onSaveProfile}
          onLoadProfile={onLoadProfile}
        />
      ) : (
        <ExplorimFilters
          filters={explorimFilters || {}}
          onChange={onExplorimFilterChange || (() => {})}
          savedProfiles={savedProfiles}
          onSaveProfile={onSaveProfile}
          onLoadProfile={onLoadProfile}
        />
      )}

      {/* Provider-Specific Help Text */}
      <Box mt={4} p={3} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
        <Text fontSize="xs" color="gray.600">
          {currentProvider === 'apollo' ? (
            <>
              <strong>Apollo.io:</strong> Direct prospect search with LinkedIn integration. 
              Supports similar titles, verified email status, and technology filtering.
            </>
          ) : (
            <>
              <strong>Explorium:</strong> AI-powered prospect search with business intelligence. 
              Supports two-stage search, intent data, and advanced company filtering.
            </>
          )}
        </Text>
      </Box>
    </Box>
  )
} 