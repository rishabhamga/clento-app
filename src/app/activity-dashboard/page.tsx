'use client'

import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Card,
  CardBody,
  SimpleGrid,
  Progress,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  useColorModeValue,
  Flex,
  Avatar,
  AvatarGroup,
  Select,
  Button,
  Divider
} from '@chakra-ui/react'
import { 
  Activity, 
  Clock, 
  Users, 
  TrendingUp, 
  Calendar,
  MessageSquare,
  Filter,
  BarChart3
} from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'

// Mock data similar to Avoma's activity dashboard
const mockActivityData = {
  totalConversations: 201,
  totalHours: 100.82,
  averageHours: 12.72,
  teamMembers: [
    {
      id: 1,
      name: 'Sarah Johnson',
      avatar: 'SJ',
      conversations: 78,
      hours: 42.5,
      color: 'pink.500'
    },
    {
      id: 2,
      name: 'Mike Chen',
      avatar: 'MC',
      conversations: 65,
      hours: 28.3,
      color: 'blue.500'
    },
    {
      id: 3,
      name: 'Alex Rivera',
      avatar: 'AR',
      conversations: 42,
      hours: 22.1,
      color: 'orange.500'
    },
    {
      id: 4,
      name: 'Emma Davis',
      avatar: 'ED',
      conversations: 16,
      hours: 7.9,
      color: 'purple.500'
    }
  ],
  conversationTypes: [
    { type: 'Discovery', count: 89, percentage: 44, color: 'blue.500' },
    { type: 'Demo', count: 56, percentage: 28, color: 'green.500' },
    { type: 'Follow-up', count: 34, percentage: 17, color: 'orange.500' },
    { type: 'Closing', count: 22, percentage: 11, color: 'purple.500' }
  ],
  weeklyTrend: [
    { week: 'Week 1', conversations: 45, hours: 22.5 },
    { week: 'Week 2', conversations: 52, hours: 26.8 },
    { week: 'Week 3', conversations: 48, hours: 24.2 },
    { week: 'Week 4', conversations: 56, hours: 27.3 }
  ]
}

export default function ActivityDashboard() {
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const headerBg = useColorModeValue('gray.50', 'gray.900')
  const cardBg = useColorModeValue('white', 'gray.700')

  return (
    <DashboardLayout>
      <VStack spacing={8} align="stretch" w="full">
        {/* Header Section */}
        <Box>
          <VStack spacing={4} align="start">
            <HStack spacing={3}>
              <Activity size={32} color="#805AD5" />
              <VStack align="start" spacing={0}>
                <Heading size="xl" color="purple.600">
                  Activity Dashboard
                </Heading>
                <Text color="gray.600" fontSize="lg">
                  Get an instant overview of conversations across the organization
                </Text>
              </VStack>
            </HStack>
            
            <HStack spacing={4}>
              <Select placeholder="All Teams" maxW="200px">
                <option value="sales">Sales Team</option>
                <option value="cs">Customer Success</option>
                <option value="marketing">Marketing</option>
              </Select>
              <Select placeholder="Last 30 days" maxW="200px">
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </Select>
              <Button leftIcon={<Filter size={16} />} variant="outline">
                More Filters
              </Button>
            </HStack>
          </VStack>
        </Box>

        {/* Activity Statistics */}
        <Card bg={cardBg} shadow="sm">
          <CardBody p={8}>
            <VStack spacing={6} align="stretch">
              <HStack justify="space-between">
                <Heading size="lg" color="gray.700">
                  Activity Statistics
                </Heading>
                <Badge colorScheme="purple" size="lg" px={3} py={1}>
                  Live Data
                </Badge>
              </HStack>
              
              <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={8}>
                <Stat textAlign="center">
                  <StatLabel fontSize="sm" color="gray.600">Number of Conversations</StatLabel>
                  <StatNumber fontSize="4xl" color="purple.600" fontWeight="bold">
                    {mockActivityData.totalConversations}
                  </StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    12.5% from last month
                  </StatHelpText>
                </Stat>
                
                <Stat textAlign="center">
                  <StatLabel fontSize="sm" color="gray.600">Time Spent in Conversations</StatLabel>
                  <StatNumber fontSize="4xl" color="blue.600" fontWeight="bold">
                    {mockActivityData.totalHours}
                  </StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    8.2% from last month
                  </StatHelpText>
                </Stat>
                
                <Stat textAlign="center">
                  <StatLabel fontSize="sm" color="gray.600">Average Hours per User</StatLabel>
                  <StatNumber fontSize="4xl" color="green.600" fontWeight="bold">
                    {mockActivityData.averageHours}
                  </StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    5.1% from last month
                  </StatHelpText>
                </Stat>
                
                <Stat textAlign="center">
                  <StatLabel fontSize="sm" color="gray.600">Active Team Members</StatLabel>
                  <StatNumber fontSize="4xl" color="orange.600" fontWeight="bold">
                    {mockActivityData.teamMembers.length}
                  </StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    2 new this month
                  </StatHelpText>
                </Stat>
              </SimpleGrid>
            </VStack>
          </CardBody>
        </Card>

        {/* Team Performance */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
          {/* Team Member Breakdown */}
          <Card bg={cardBg} shadow="sm">
            <CardBody p={6}>
              <VStack spacing={6} align="stretch">
                <HStack justify="space-between">
                  <Heading size="md" color="gray.700">
                    Team Member Performance
                  </Heading>
                  <HStack spacing={4}>
                    <HStack spacing={2}>
                      <Box w={3} h={3} bg="blue.500" borderRadius="full" />
                      <Text fontSize="xs" color="gray.600">Conversations</Text>
                    </HStack>
                    <HStack spacing={2}>
                      <Box w={3} h={3} bg="green.500" borderRadius="full" />
                      <Text fontSize="xs" color="gray.600">Hours</Text>
                    </HStack>
                  </HStack>
                </HStack>
                
                <VStack spacing={4} align="stretch">
                  {mockActivityData.teamMembers.map((member) => (
                    <Box key={member.id}>
                      <HStack justify="space-between" mb={2}>
                        <HStack spacing={3}>
                          <Avatar size="sm" name={member.name} bg={member.color} />
                          <Text fontWeight="medium" fontSize="sm">
                            {member.name}
                          </Text>
                        </HStack>
                        <HStack spacing={4}>
                          <Text fontSize="sm" color="gray.600">
                            {member.conversations} calls
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            {member.hours}h
                          </Text>
                        </HStack>
                      </HStack>
                      
                      <HStack spacing={2}>
                        <Progress 
                          value={(member.conversations / mockActivityData.totalConversations) * 100} 
                          colorScheme="blue" 
                          size="sm" 
                          flex={1}
                          borderRadius="full"
                        />
                        <Progress 
                          value={(member.hours / mockActivityData.totalHours) * 100} 
                          colorScheme="green" 
                          size="sm" 
                          flex={1}
                          borderRadius="full"
                        />
                      </HStack>
                    </Box>
                  ))}
                </VStack>
              </VStack>
            </CardBody>
          </Card>

          {/* Conversation Types */}
          <Card bg={cardBg} shadow="sm">
            <CardBody p={6}>
              <VStack spacing={6} align="stretch">
                <Heading size="md" color="gray.700">
                  Conversation Types
                </Heading>
                
                <VStack spacing={4} align="stretch">
                  {mockActivityData.conversationTypes.map((type) => (
                    <Box key={type.type}>
                      <HStack justify="space-between" mb={2}>
                        <HStack spacing={3}>
                          <Box w={4} h={4} bg={type.color} borderRadius="full" />
                          <Text fontWeight="medium" fontSize="sm">
                            {type.type}
                          </Text>
                        </HStack>
                        <HStack spacing={2}>
                          <Text fontSize="sm" fontWeight="bold">
                            {type.count}
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            ({type.percentage}%)
                          </Text>
                        </HStack>
                      </HStack>
                      
                      <Progress 
                        value={type.percentage} 
                        colorScheme={type.color.split('.')[0]} 
                        size="sm" 
                        borderRadius="full"
                      />
                    </Box>
                  ))}
                </VStack>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Stage-based Filters Preview */}
        <Card bg={cardBg} shadow="sm">
          <CardBody p={6}>
            <VStack spacing={6} align="stretch">
              <HStack justify="space-between">
                <VStack align="start" spacing={1}>
                  <Heading size="md" color="gray.700">
                    Stage-based Filters
                  </Heading>
                  <Text fontSize="sm" color="gray.600">
                    Filter conversations based on purposes, outcomes and more
                  </Text>
                </VStack>
                <Button 
                  rightIcon={<Filter size={16} />} 
                  colorScheme="purple" 
                  variant="outline"
                  size="sm"
                >
                  Configure Filters
                </Button>
              </HStack>
              
              <SimpleGrid columns={{ base: 2, md: 4, lg: 6 }} spacing={4}>
                <Badge colorScheme="blue" p={2} textAlign="center" borderRadius="md">
                  Discovery Calls
                </Badge>
                <Badge colorScheme="green" p={2} textAlign="center" borderRadius="md">
                  Product Demos
                </Badge>
                <Badge colorScheme="orange" p={2} textAlign="center" borderRadius="md">
                  Follow-ups
                </Badge>
                <Badge colorScheme="purple" p={2} textAlign="center" borderRadius="md">
                  Closing Calls
                </Badge>
                <Badge colorScheme="red" p={2} textAlign="center" borderRadius="md">
                  Support Calls
                </Badge>
                <Badge colorScheme="gray" p={2} textAlign="center" borderRadius="md">
                  Internal Meetings
                </Badge>
              </SimpleGrid>
              
              <Text fontSize="sm" color="gray.600">
                Get a quick understanding of the type of meetings across the organization based on purpose, 
                conversation stage, and more including filtering of your internal vs. external conversations.
              </Text>
            </VStack>
          </CardBody>
        </Card>

        {/* Quick Actions */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          <Card bg="purple.50" borderColor="purple.200" borderWidth="1px">
            <CardBody p={6} textAlign="center">
              <VStack spacing={4}>
                <BarChart3 size={32} color="#805AD5" />
                <VStack spacing={2}>
                  <Text fontWeight="bold" color="purple.700">
                    Conversation Analytics
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Deep dive into conversation patterns and trends
                  </Text>
                </VStack>
                <Button colorScheme="purple" size="sm" w="full">
                  View Analytics
                </Button>
              </VStack>
            </CardBody>
          </Card>

          <Card bg="blue.50" borderColor="blue.200" borderWidth="1px">
            <CardBody p={6} textAlign="center">
              <VStack spacing={4}>
                <Clock size={32} color="#3182CE" />
                <VStack spacing={2}>
                  <Text fontWeight="bold" color="blue.700">
                    Meeting Insights
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Analyze meeting effectiveness and outcomes
                  </Text>
                </VStack>
                <Button colorScheme="blue" size="sm" w="full">
                  View Insights
                </Button>
              </VStack>
            </CardBody>
          </Card>

          <Card bg="green.50" borderColor="green.200" borderWidth="1px">
            <CardBody p={6} textAlign="center">
              <VStack spacing={4}>
                <TrendingUp size={32} color="#38A169" />
                <VStack spacing={2}>
                  <Text fontWeight="bold" color="green.700">
                    Performance Metrics
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Track team and individual performance
                  </Text>
                </VStack>
                <Button colorScheme="green" size="sm" w="full">
                  View Metrics
                </Button>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>
      </VStack>
    </DashboardLayout>
  )
}
