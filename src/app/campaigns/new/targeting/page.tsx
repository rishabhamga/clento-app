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
  SimpleGrid,
  Icon,
  Badge,
  useColorModeValue,
  Heading,
  Button,
} from '@chakra-ui/react'
import { keyframes } from '@emotion/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FiDatabase, /* FiShoppingCart, FiMapPin, */ FiUpload } from 'react-icons/fi'
import { GradientButton } from '@/components/ui/GradientButton'

// Enhanced animations
const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
`

const glow = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(102, 126, 234, 0.3); }
  50% { box-shadow: 0 0 30px rgba(102, 126, 234, 0.5); }
`

const leadSources = [
  {
    id: 'b2b',
    title: 'B2B Data',
    subtitle: 'People Data Labs',
    description: 'Access 300M+ verified business contacts',
    icon: FiDatabase,
    features: [
      '300M+ verified contacts',
      'Company & personal emails',
      'Direct phone numbers',
      'Technographics data',
      'Intent signals'
    ],
    popular: true,
    path: '/campaigns/new/targeting/b2b-filters'
  },
  {
    id: 'csv_upload',
    title: 'Upload CSV',
    subtitle: 'Import your own leads',
    description: 'Use your existing lead database',
    icon: FiUpload,
    features: [
      'Import your own lead lists',
      'Validate contact information',
      'Preview and select leads',
      'Bulk import support',
      'Custom field mapping'
    ],
    popular: false,
    path: '/campaigns/new/targeting/b2b-filters'
  },
  // TODO: Re-enable E-commerce option when ready
  // {
  //   id: 'ecommerce',
  //   title: 'E-commerce',
  //   subtitle: 'Store owners & managers',
  //   description: 'Target online store decision makers',
  //   icon: FiShoppingCart,
  //   features: [
  //     'Shopify store owners',
  //     'WooCommerce sites',
  //     'Revenue estimates',
  //     'Technology stack',
  //     'Growth stage analysis'
  //   ],
  //   popular: false,
  //   path: '/campaigns/new/targeting/ecommerce-filters'
  // },
  // TODO: Re-enable Local Data option when ready
  // {
  //   id: 'local',
  //   title: 'Local Data', 
  //   subtitle: 'Local businesses',
  //   description: 'Find local business owners and managers',
  //   icon: FiMapPin,
  //   features: [
  //     'Local business directory',
  //     'Google My Business data',
  //     'Contact information',
  //     'Business hours',
  //     'Review analysis'
  //   ],
  //   popular: false,
  //   path: '/campaigns/new/targeting/local-filters'
  // }
]

export default function TargetingPage() {
  const [selectedSource, setSelectedSource] = useState<string | null>(null)
  const router = useRouter()
  
  // Enhanced color mode values with glassmorphism
  const cardBg = useColorModeValue('rgba(255, 255, 255, 0.9)', 'rgba(26, 32, 44, 0.9)')
  const borderColor = useColorModeValue('rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)')
  const gradientBg = useColorModeValue(
    'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    'linear-gradient(135deg, #4c1d95 0%, #5b21b6 50%, #7c3aed 100%)'
  )
  const accentGradient = useColorModeValue(
    'linear-gradient(45deg, #667eea, #764ba2)',
    'linear-gradient(45deg, #5b21b6, #7c3aed)'
  )

  const handleSourceSelect = (source: typeof leadSources[0]) => {
    setSelectedSource(source.id)
    
    if (source.id === 'csv_upload') {
      // For CSV upload, go to B2B filters page with csv_upload search type
      router.push('/campaigns/new/targeting/b2b-filters?type=csv_upload')
    } else {
      // For other sources, use their defined paths
      router.push(source.path)
    }
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
        top="10%"
        right="10%"
        w="300px"
        h="300px"
        borderRadius="50%"
        bg={accentGradient}
        opacity={0.1}
        animation={`${float} 6s ease-in-out infinite`}
        zIndex={0}
      />
      <Box
        position="absolute"
        bottom="20%"
        left="5%"
        w="200px"
        h="200px"
        borderRadius="50%"
        bg={accentGradient}
        opacity={0.08}
        animation={`${float} 8s ease-in-out infinite reverse`}
        zIndex={0}
      />

      <Container maxW="7xl" py={8} position="relative" zIndex={1}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Box textAlign="center" mb={8}>
            <Heading 
              as="h1" 
              size="2xl" 
              mb={4}
              bgGradient="linear(to-r, white, purple.100)"
              bgClip="text"
              fontWeight="800"
              letterSpacing="-0.02em"
              animation={`${glow} 2s ease-in-out infinite`}
            >
              Select Your Lead Source
            </Heading>
            <Text 
              fontSize="xl" 
              color="whiteAlpha.900"
              fontWeight="500"
              maxW="2xl"
              mx="auto"
            >
              Choose where you'd like to find your ideal prospects
            </Text>
          </Box>

          {/* Lead Source Grid */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            {leadSources.map((source) => (
              <Card
                key={source.id}
                bg={cardBg}
                backdropFilter="blur(10px)"
                border="2px solid"
                borderColor={selectedSource === source.id ? 'purple.400' : borderColor}
                cursor="pointer"
                transition="all 0.3s ease"
                _hover={{
                  borderColor: 'purple.400',
                  transform: 'translateY(-2px)',
                  shadow: 'xl'
                }}
                onClick={() => handleSourceSelect(source)}
                position="relative"
                borderRadius="2xl"
                overflow="hidden"
              >
                {source.popular && (
                  <Badge
                    position="absolute"
                    top={4}
                    right={4}
                    colorScheme="purple"
                    px={3}
                    py={1}
                    borderRadius="full"
                    zIndex={1}
                    bg="purple.500"
                    color="white"
                    boxShadow="0 4px 12px rgba(128, 90, 213, 0.4)"
                    fontSize="xs"
                    fontWeight="600"
                  >
                    Most Popular
                  </Badge>
                )}
                
                <CardBody p={6}>
                  <VStack spacing={4} align="start">
                    {/* Header */}
                    <HStack spacing={3} align="center" w="full">
                      <Box
                        p={3}
                        bg="purple.500"
                        rounded="xl"
                        color="white"
                        boxShadow="0 4px 12px rgba(128, 90, 213, 0.3)"
                      >
                        <Icon 
                          as={source.icon} 
                          boxSize={6}
                        />
                      </Box>
                      
                      <VStack spacing={0} align="start" flex={1}>
                        <Text fontSize="xl" fontWeight="bold" color={useColorModeValue('gray.800', 'white')}>
                          {source.title}
                        </Text>
                        <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')}>
                          {source.subtitle}
                        </Text>
                      </VStack>
                    </HStack>

                    {/* Description */}
                    <Text color={useColorModeValue('gray.700', 'gray.300')} fontSize="md">
                      {source.description}
                    </Text>

                    {/* Features */}
                    <VStack spacing={2} align="start" w="full">
                      {source.features.map((feature, index) => (
                        <HStack key={index} spacing={2}>
                          <Box
                            w={1.5}
                            h={1.5}
                            bg="purple.500"
                            rounded="full"
                          />
                          <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')}>
                            {feature}
                          </Text>
                        </HStack>
                      ))}
                    </VStack>

                    {/* CTA Button */}
                    <GradientButton
                      size="md"
                      w="full"
                      mt={4}
                      _hover={{
                        transform: 'translateY(-2px)',
                        shadow: 'lg',
                      }}
                      transition="all 0.3s ease"
                    >
                      Select {source.title}
                    </GradientButton>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>

          {/* Bottom Navigation */}
          <HStack justify="space-between" align="center" pt={4}>
            <Button
              onClick={() => router.push('/campaigns/new')}
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
              minW="200px"
              backdropFilter="blur(10px)"
            >
              ← Back to Campaign Setup
            </Button>
            
            <Box />
          </HStack>
        </VStack>
      </Container>
    </Box>
  )
} 