'use client'

import React from 'react'
import {
  Box,
  HStack,
  VStack,
  Text,
  Button,
  Card,
  CardBody,
  Icon,
  Badge,
  useColorModeValue,
  Flex,
  Heading,
} from '@chakra-ui/react'
import { keyframes } from '@emotion/react'
import { FiUsers, FiTarget, FiZap } from 'react-icons/fi'
import { type SearchType } from '@/types/apollo'
import { useSearchFilters } from '@/hooks/useApolloSearch'

interface SearchTypeSelectorProps {
  className?: string
}

// Define animations
const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
`

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`

const glow = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(102, 126, 234, 0.3); }
  50% { box-shadow: 0 0 30px rgba(102, 126, 234, 0.5); }
`

export function SearchTypeSelector({ className }: SearchTypeSelectorProps) {
  const { searchType, setSearchType, hasActiveFilters } = useSearchFilters()
  
  // Enhanced theme colors
  const glassBg = 'rgba(255, 255, 255, 0.25)'
  const borderColor = 'rgba(255, 255, 255, 0.18)'
  const accentGradient = 'linear(135deg, #667eea 0%, #764ba2 100%)'
  const selectedGradient = 'linear(135deg, #667eea 0%, #764ba2 100%)'
  const hoverGradient = 'linear(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'

  const searchOptions = [
    {
      type: 'people' as SearchType,
      title: 'Find People',
      subtitle: 'Target decision makers & professionals',
      description: 'Search for specific individuals based on job titles, seniority, experience, and company profiles.',
      icon: FiUsers,
      color: 'linear(135deg, #667eea 0%, #764ba2 100%)',
      features: [
        'Job titles & roles',
        'Seniority levels', 
        'Years of experience',
        'Company information',
        'Contact details',
        'Professional background'
      ],
      stats: { total: '200M+', accuracy: '95%' }
    },
    {
      type: 'company' as SearchType,
      title: 'Find Companies',
      subtitle: 'Discover target organizations',
      description: 'Find companies based on size, industry, funding, technology stack, and growth signals.',
      icon: FiTarget,
      color: 'linear(135deg, #667eea 0%, #764ba2 100%)',
      features: [
        'Company size & revenue',
        'Industry & location', 
        'Funding & growth stage',
        'Technology stack',
        'Intent signals',
        'Engagement metrics'
      ],
      stats: { total: '15M+', accuracy: '92%' }
    }
  ]

  const handleTypeChange = (newType: SearchType) => {
    if (hasActiveFilters) {
      // Could add a confirmation dialog here if needed
      const confirmChange = window.confirm(
        'Switching search types will reset your current filters. Continue?'
      )
      if (!confirmChange) return
    }
    
    setSearchType(newType)
  }

  // Don't render the selector if we're in CSV upload mode
  if (searchType === 'csv_upload') {
    return null
  }

  return (
    <Box 
      className={className}
      position="relative"
      overflow="hidden"
    >
      {/* Background Elements */}
      <Box
        position="absolute"
        top="-50%"
        left="-50%"
        width="200%"
        height="200%"
        opacity="0.1"
        backgroundImage="radial-gradient(circle at 25% 25%, white 2px, transparent 2px)"
        backgroundSize="50px 50px"
        animation={`${float} 20s ease-in-out infinite`}
        pointerEvents="none"
      />

      <VStack spacing={8} align="stretch" position="relative" zIndex={1}>
        {/* Enhanced Header */}
        <Box textAlign="center" py={8}>
          <Heading
            size="2xl"
            mb={4}
            bgGradient={accentGradient}
            bgClip="text"
            fontWeight="800"
            letterSpacing="-0.02em"
          >
            🎯 Choose Your Target
          </Heading>
          <Text 
            fontSize="xl" 
            color="gray.600"
            fontWeight="500"
            maxW="2xl"
            mx="auto"
            lineHeight="1.6"
          >
            Select your preferred targeting approach to find high-quality prospects with precision
          </Text>
        </Box>

        {/* Enhanced Search Type Cards */}
        <Flex direction={{ base: 'column', xl: 'row' }} gap={8} justify="center">
          {searchOptions.map((option, index) => {
            const isSelected = searchType === option.type

            return (
              <Card
                key={option.type}
                bg={glassBg}
                borderRadius="2xl"
                border="1px solid"
                borderColor={isSelected ? 'purple.400' : borderColor}
                backdropFilter="blur(20px)"
                cursor="pointer"
                transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
                _hover={{
                  transform: 'translateY(-8px) scale(1.02)',
                  boxShadow: '0 25px 50px -12px rgba(102, 126, 234, 0.4)',
                  borderColor: 'purple.400',
                  bg: hoverGradient
                }}
                onClick={() => handleTypeChange(option.type)}
                maxW="500px"
                flex={1}
                position="relative"
                overflow="hidden"
                boxShadow={isSelected ? "0 25px 50px -12px rgba(102, 126, 234, 0.4)" : "0 10px 30px -5px rgba(0, 0, 0, 0.1)"}
                animation={isSelected ? `${glow} 3s ease-in-out infinite` : undefined}
              >
                {/* Animated background for selected card */}
                {isSelected && (
                  <Box
                    position="absolute"
                    top="0"
                    left="0"
                    right="0"
                    height="4px"
                    bg={selectedGradient}
                    animation={`${shimmer} 2s ease-in-out infinite`}
                    backgroundSize="200% 100%"
                  />
                )}

                {/* Selection Badge */}
                {isSelected && (
                  <Badge
                    position="absolute"
                    top={4}
                    right={4}
                    bg="green.500"
                    color="white"
                    px={4}
                    py={2}
                    borderRadius="xl"
                    fontSize="sm"
                    fontWeight="700"
                    zIndex={2}
                    boxShadow="0 4px 12px rgba(34, 197, 94, 0.5)"
                    border="2px solid white"
                  >
                    ✓ Selected
                  </Badge>
                )}
                
                <CardBody p={8}>
                  <VStack spacing={6} align="start">
                    {/* Enhanced Header */}
                    <HStack spacing={4} align="center" w="full">
                      <Box
                        p={4}
                        bg={isSelected ? selectedGradient : 'white'}
                        borderRadius="2xl"
                        color={isSelected ? 'white' : 'purple.600'}
                        boxShadow={isSelected ? "0 8px 20px rgba(102, 126, 234, 0.4)" : "0 4px 12px rgba(102, 126, 234, 0.2)"}
                        transition="all 0.3s ease-in-out"
                      >
                        <Icon 
                          as={option.icon} 
                          boxSize={8}
                        />
                      </Box>
                      
                      <VStack spacing={1} align="start" flex={1}>
                        <Text 
                          fontSize="2xl" 
                          fontWeight="bold"
                          color={isSelected ? 'purple.700' : 'gray.800'}
                        >
                          {option.title}
                        </Text>
                        <Text 
                          fontSize="md" 
                          color="gray.600"
                          fontWeight="500"
                        >
                          {option.subtitle}
                        </Text>
                      </VStack>
                    </HStack>

                    {/* Enhanced Description */}
                    <Text 
                      color="gray.700" 
                      fontSize="lg"
                      lineHeight="1.6"
                      fontWeight="400"
                    >
                      {option.description}
                    </Text>

                    {/* Stats */}
                    <HStack spacing={6} w="full">
                      <VStack spacing={1} align="start">
                        <Text fontSize="sm" color="gray.500" fontWeight="600">
                          Database Size
                        </Text>
                        <Text fontSize="xl" fontWeight="bold" color="green.500">
                          {option.stats.total}
                        </Text>
                      </VStack>
                      <VStack spacing={1} align="start">
                        <Text fontSize="sm" color="gray.500" fontWeight="600">
                          Accuracy
                        </Text>
                        <Text fontSize="xl" fontWeight="bold" color="blue.500">
                          {option.stats.accuracy}
                        </Text>
                      </VStack>
                    </HStack>

                    {/* Enhanced Features */}
                    <Box w="full">
                      <Text 
                        fontSize="md" 
                        fontWeight="bold" 
                        color="gray.700" 
                        mb={3}
                      >
                        🚀 Key Features:
                      </Text>
                      <VStack spacing={3} align="start" w="full">
                        {option.features.map((feature, featureIndex) => (
                          <HStack key={featureIndex} spacing={3}>
                            <Box
                              w={2}
                              h={2}
                              bg={isSelected ? 'purple.500' : 'purple.400'}
                              borderRadius="full"
                              flexShrink={0}
                            />
                            <Text 
                              fontSize="sm" 
                              color="gray.600"
                              fontWeight="500"
                            >
                              {feature}
                            </Text>
                          </HStack>
                        ))}
                      </VStack>
                    </Box>

                    {/* Enhanced CTA Button */}
                    <Button
                      size="lg"
                      w="full"
                      mt={4}
                      bg={isSelected ? "green.500" : 'white'}
                      color={isSelected ? 'white' : 'purple.600'}
                      border="2px solid"
                      borderColor={isSelected ? 'green.500' : 'purple.200'}
                      isDisabled={isSelected}
                      _hover={{
                        transform: !isSelected ? 'scale(1.02)' : undefined,
                        bg: !isSelected ? hoverGradient : undefined,
                        borderColor: !isSelected ? 'purple.400' : undefined
                      }}
                      _disabled={{
                        opacity: 1,
                        cursor: 'default',
                        transform: 'none',
                        bg: "green.500",
                        color: "white",
                        borderColor: "green.500"
                      }}
                      transition="all 0.2s ease-in-out"
                      borderRadius="xl"
                      fontWeight="700"
                      boxShadow={isSelected ? "0 4px 12px rgba(34, 197, 94, 0.3)" : "0 2px 8px rgba(0, 0, 0, 0.1)"}
                    >
                      {isSelected ? '✓ Currently Selected' : `Choose ${option.title}`}
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            )
          })}
        </Flex>

        {/* Enhanced Filter Status Alert */}
        {hasActiveFilters && (
          <Card
            bg="linear(135deg, orange.50, yellow.50)"
            border="2px solid"
            borderColor="orange.200"
            borderRadius="xl"
            overflow="hidden"
            position="relative"
          >
            <Box
              position="absolute"
              top="0"
              left="0"
              right="0"
              height="3px"
              bg="linear(135deg, orange.400, yellow.400)"
            />
            <CardBody p={6} textAlign="center">
              <HStack spacing={3} justify="center">
                <Icon as={FiZap} color="orange.500" boxSize={5} />
                <VStack spacing={1}>
                  <Text 
                    fontSize="lg" 
                    fontWeight="bold" 
                    color="orange.700"
                  >
                    Active Filters Detected
                  </Text>
                  <Text 
                    fontSize="md" 
                    color="orange.600"
                    maxW="md"
                  >
                    Switching search types will reset your current filters. Make sure to save any important configurations.
                  </Text>
                </VStack>
              </HStack>
            </CardBody>
          </Card>
        )}
      </VStack>
    </Box>
  )
}

export default SearchTypeSelector 