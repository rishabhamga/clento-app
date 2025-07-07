'use client'

import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Card,
  CardBody,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  HStack,
  Avatar,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  useColorModeValue
} from '@chakra-ui/react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { GradientButton } from '@/components/ui/GradientButton'
import { Search, Eye, Globe, Users, TrendingUp } from 'lucide-react'

const sampleVisitors = [
  {
    id: '1',
    company: 'TechCorp Inc.',
    domain: 'techcorp.com',
    visitors: 12,
    location: 'San Francisco, CA',
    industry: 'Software',
    visitedPages: ['/pricing', '/features', '/contact'],
    lastVisit: '2 hours ago',
    identified: true
  },
  {
    id: '2',
    company: 'Innovate Labs',
    domain: 'innovate.io',
    visitors: 5,
    location: 'New York, NY',
    industry: 'Marketing',
    visitedPages: ['/home', '/about'],
    lastVisit: '1 day ago',
    identified: false
  },
  {
    id: '3',
    company: 'StartupCo',
    domain: 'startup.com',
    visitors: 8,
    location: 'Austin, TX',
    industry: 'Healthcare',
    visitedPages: ['/pricing', '/demo'],
    lastVisit: '3 hours ago',
    identified: true
  }
]

export default function WebsiteVisitorsPage() {
  const cardBg = useColorModeValue('white', 'gray.700')

  return (
    <DashboardLayout>
      <Container maxW="7xl" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Box>
            <Heading size="lg" mb={2}>Website Visitors</Heading>
            <Text color="gray.600">
              Track and identify companies visiting your website
            </Text>
          </Box>

          {/* Stats */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
            <Card bg={cardBg}>
              <CardBody>
                <Stat>
                  <StatLabel>Total Visitors</StatLabel>
                  <StatNumber>1,247</StatNumber>
                  <StatHelpText>This month</StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card bg={cardBg}>
              <CardBody>
                <Stat>
                  <StatLabel>Identified Companies</StatLabel>
                  <StatNumber>89</StatNumber>
                  <StatHelpText>7.1% identification rate</StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card bg={cardBg}>
              <CardBody>
                <Stat>
                  <StatLabel>High Intent Visitors</StatLabel>
                  <StatNumber>34</StatNumber>
                  <StatHelpText>Viewed pricing/demo pages</StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card bg={cardBg}>
              <CardBody>
                <Stat>
                  <StatLabel>Converted to Leads</StatLabel>
                  <StatNumber>12</StatNumber>
                  <StatHelpText>35% conversion rate</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Enterprise Notice */}
          <Card bg="purple.50" border="2px solid" borderColor="purple.200">
            <CardBody textAlign="center" py={12}>
              <VStack spacing={4}>
                <Eye size={48} color="purple" />
                <Badge colorScheme="purple" fontSize="sm" px={3} py={1}>
                  ENTERPRISE FEATURE
                </Badge>
                <Heading size="md" color="purple.700">
                  Website Visitor Tracking
                </Heading>
                <Text color="purple.600" maxW="md">
                  Identify anonymous website visitors, track their behavior, 
                  and automatically convert them into qualified leads with our advanced tracking technology.
                </Text>
                <VStack spacing={2} align="center">
                  <Text fontSize="sm" color="purple.600" fontWeight="semibold">
                    Features include:
                  </Text>
                  <HStack spacing={6} fontSize="sm" color="purple.600">
                    <Text>• Company identification</Text>
                    <Text>• Page visit tracking</Text>
                    <Text>• Intent scoring</Text>
                    <Text>• Lead enrichment</Text>
                  </HStack>
                </VStack>
                <GradientButton size="lg">
                  Upgrade to Enterprise
                </GradientButton>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </DashboardLayout>
  )
} 