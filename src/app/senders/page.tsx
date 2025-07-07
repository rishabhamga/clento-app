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
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  useColorModeValue
} from '@chakra-ui/react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { GradientButton } from '@/components/ui/GradientButton'
import { Search, Send, Plus, Settings, TrendingUp, Mail } from 'lucide-react'

const sampleSenders: any[] = []

function getStatusColor(status: string) {
  switch (status) {
    case 'active': return 'green'
    case 'paused': return 'yellow'
    case 'warming-up': return 'blue'
    case 'error': return 'red'
    case 'disconnected': return 'gray'
    default: return 'gray'
  }
}

export default function SendersPage() {
  const cardBg = useColorModeValue('white', 'gray.700')

  return (
    <DashboardLayout>
      <Container maxW="7xl" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Box>
            <HStack justify="space-between" align="center" mb={4}>
              <VStack spacing={1} align="start">
                <Heading size="lg">Senders</Heading>
                <Text color="gray.600">
                  Manage your email sending accounts and deliverability
                </Text>
              </VStack>
              <HStack spacing={3}>
                <GradientButton leftIcon={<Settings size={16} />} variant="tertiary">
                  Settings
                </GradientButton>
                <GradientButton leftIcon={<Plus size={16} />}>
                  Add Sender
                </GradientButton>
              </HStack>
            </HStack>

            {/* Stats */}
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={6}>
              <Card bg={cardBg}>
                <CardBody>
                  <Stat>
                    <StatLabel>Total Senders</StatLabel>
                    <StatNumber>0</StatNumber>
                    <StatHelpText>No senders configured</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card bg={cardBg}>
                <CardBody>
                  <Stat>
                    <StatLabel>Messages Sent Today</StatLabel>
                    <StatNumber>0</StatNumber>
                    <StatHelpText>of 0 daily limit</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card bg={cardBg}>
                <CardBody>
                  <Stat>
                    <StatLabel>Avg Delivery Rate</StatLabel>
                    <StatNumber>0%</StatNumber>
                    <StatHelpText>Across all senders</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card bg={cardBg}>
                <CardBody>
                  <Stat>
                    <StatLabel>Avg Reply Rate</StatLabel>
                    <StatNumber>0%</StatNumber>
                    <StatHelpText>Last 30 days</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            </SimpleGrid>

            {/* Filters */}
            <HStack spacing={4} mb={6}>
              <InputGroup flex={1} maxW="400px">
                <InputLeftElement>
                  <Search size={16} color="gray" />
                </InputLeftElement>
                <Input placeholder="Search senders..." />
              </InputGroup>
              <Select placeholder="All Providers" maxW="150px">
                <option value="gmail">Gmail</option>
                <option value="outlook">Outlook</option>
                <option value="custom">Custom SMTP</option>
              </Select>
              <Select placeholder="All Status" maxW="150px">
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="warming-up">Warming Up</option>
                <option value="error">Error</option>
              </Select>
            </HStack>
          </Box>

          {/* Enterprise Notice */}
          <Card bg="purple.50" border="2px solid" borderColor="purple.200">
            <CardBody textAlign="center" py={12}>
              <VStack spacing={4}>
                <Send size={48} color="purple" />
                <Badge colorScheme="purple" fontSize="sm" px={3} py={1}>
                  ENTERPRISE FEATURE
                </Badge>
                <Heading size="md" color="purple.700">
                  Advanced Sender Management
                </Heading>
                <Text color="purple.600" maxW="md">
                  Manage multiple sending accounts, advanced deliverability monitoring, 
                  automatic warmup sequences, and reputation management across your entire team.
                </Text>
                <VStack spacing={2} align="center">
                  <Text fontSize="sm" color="purple.600" fontWeight="semibold">
                    Features include:
                  </Text>
                  <HStack spacing={6} fontSize="sm" color="purple.600">
                    <Text>• Multi-sender rotation</Text>
                    <Text>• Deliverability monitoring</Text>
                    <Text>• Auto warmup</Text>
                    <Text>• Reputation tracking</Text>
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