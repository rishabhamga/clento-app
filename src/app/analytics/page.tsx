'use client'

import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Card,
  CardBody,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Badge,
  useColorModeValue
} from '@chakra-ui/react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { GradientButton } from '@/components/ui/GradientButton'

export default function AnalyticsPage() {
  const cardBg = useColorModeValue('white', 'gray.700')

  return (
    <DashboardLayout>
      <Container maxW="7xl" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Box>
            <Heading size="lg" mb={2}>Analytics</Heading>
            <Text color="gray.600">
              Track your campaign performance and lead generation metrics
            </Text>
          </Box>

          {/* Stats Grid */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
            <Card bg={cardBg}>
              <CardBody>
                <Stat>
                  <StatLabel>Total Campaigns</StatLabel>
                  <StatNumber>0</StatNumber>
                  <StatHelpText>Active campaigns</StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card bg={cardBg}>
              <CardBody>
                <Stat>
                  <StatLabel>Leads Generated</StatLabel>
                  <StatNumber>0</StatNumber>
                  <StatHelpText>This month</StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card bg={cardBg}>
              <CardBody>
                <Stat>
                  <StatLabel>Response Rate</StatLabel>
                  <StatNumber>0%</StatNumber>
                  <StatHelpText>Average across campaigns</StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card bg={cardBg}>
              <CardBody>
                <Stat>
                  <StatLabel>Meetings Booked</StatLabel>
                  <StatNumber>0</StatNumber>
                  <StatHelpText>This month</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Upgrade Notice */}
          <Card bg="purple.50" border="2px solid" borderColor="purple.200">
            <CardBody textAlign="center" py={12}>
              <VStack spacing={4}>
                <Badge colorScheme="purple" fontSize="sm" px={3} py={1}>
                  PRO FEATURE
                </Badge>
                <Heading size="md" color="purple.700">
                  Advanced Analytics Dashboard
                </Heading>
                <Text color="purple.600" maxW="md">
                  Get detailed insights into your campaign performance, lead quality scores, 
                  conversion funnels, and ROI tracking. Unlock the full analytics suite with Pro.
                </Text>
                <GradientButton size="lg">
                  Upgrade to Pro
                </GradientButton>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </DashboardLayout>
  )
} 