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
  Button,
  IconButton,
  useColorModeValue
} from '@chakra-ui/react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { GradientButton } from '@/components/ui/GradientButton'
import { Search, Clock, Play, Pause, Edit, Trash2 } from 'lucide-react'

const samplePendingMessages = [
  {
    id: '1',
    recipient: 'Sarah Johnson',
    email: 'sarah.johnson@techcorp.com',
    company: 'TechCorp Inc.',
    subject: 'Follow-up: Partnership Discussion',
    campaign: 'Tech Companies Q4',
    scheduledFor: '2024-01-15 09:00 AM',
    status: 'scheduled',
    step: 2,
    totalSteps: 5
  },
  {
    id: '2',
    recipient: 'Michael Chen',
    email: 'michael.chen@innovate.io',
    company: 'Innovate Labs',
    subject: 'Quick question about your marketing stack',
    campaign: 'Marketing Directors',
    scheduledFor: '2024-01-15 02:00 PM',
    status: 'scheduled',
    step: 1,
    totalSteps: 3
  },
  {
    id: '3',
    recipient: 'Emily Rodriguez',
    email: 'emily.r@startup.com',
    company: 'StartupCo',
    subject: 'Final follow-up: Demo opportunity',
    campaign: 'Startup CEOs',
    scheduledFor: '2024-01-16 10:30 AM',
    status: 'paused',
    step: 4,
    totalSteps: 5
  },
  {
    id: '4',
    recipient: 'David Kim',
    email: 'david@enterprise.com',
    company: 'Enterprise Solutions',
    subject: 'Introduction to our platform',
    campaign: 'Enterprise CTOs',
    scheduledFor: '2024-01-16 03:00 PM',
    status: 'pending-approval',
    step: 1,
    totalSteps: 4
  }
]

function getStatusColor(status: string) {
  switch (status) {
    case 'scheduled': return 'blue'
    case 'paused': return 'yellow'
    case 'pending-approval': return 'orange'
    case 'failed': return 'red'
    default: return 'gray'
  }
}

export default function PendingMessagesPage() {
  const cardBg = useColorModeValue('white', 'gray.700')

  return (
    <DashboardLayout>
      <Container maxW="7xl" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Box>
            <HStack justify="space-between" align="center" mb={4}>
              <VStack spacing={1} align="start">
                <Heading size="lg">Pending Messages</Heading>
                <Text color="gray.600">
                  Manage scheduled and queued outreach messages
                </Text>
              </VStack>
              <HStack spacing={3}>
                <GradientButton leftIcon={<Pause size={16} />} variant="tertiary">
                  Pause All
                </GradientButton>
                <GradientButton leftIcon={<Play size={16} />}>
                  Resume All
                </GradientButton>
              </HStack>
            </HStack>

            {/* Filters */}
            <HStack spacing={4} mb={6}>
              <InputGroup flex={1} maxW="400px">
                <InputLeftElement>
                  <Search size={16} color="gray" />
                </InputLeftElement>
                <Input placeholder="Search messages..." />
              </InputGroup>
              <Select placeholder="All Campaigns" maxW="200px">
                <option value="tech-q4">Tech Companies Q4</option>
                <option value="marketing">Marketing Directors</option>
                <option value="startup">Startup CEOs</option>
                <option value="enterprise">Enterprise CTOs</option>
              </Select>
              <Select placeholder="All Status" maxW="150px">
                <option value="scheduled">Scheduled</option>
                <option value="paused">Paused</option>
                <option value="pending-approval">Pending Approval</option>
                <option value="failed">Failed</option>
              </Select>
            </HStack>
          </Box>

          {/* Enterprise Notice */}
          <Card bg="purple.50" border="2px solid" borderColor="purple.200">
            <CardBody textAlign="center" py={12}>
              <VStack spacing={4}>
                <Clock size={48} color="purple" />
                <Badge colorScheme="purple" fontSize="sm" px={3} py={1}>
                  ENTERPRISE FEATURE
                </Badge>
                <Heading size="md" color="purple.700">
                  Advanced Message Scheduling
                </Heading>
                <Text color="purple.600" maxW="md">
                  Schedule and manage thousands of personalized messages across multiple campaigns 
                  with advanced timing controls and approval workflows.
                </Text>
                <VStack spacing={2} align="center">
                  <Text fontSize="sm" color="purple.600" fontWeight="semibold">
                    Features include:
                  </Text>
                  <HStack spacing={6} fontSize="sm" color="purple.600">
                    <Text>• Bulk scheduling</Text>
                    <Text>• Time zone optimization</Text>
                    <Text>• Approval workflows</Text>
                    <Text>• Send rate limiting</Text>
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