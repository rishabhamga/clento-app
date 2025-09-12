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
  Select,
  Button,
  Divider,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer
} from '@chakra-ui/react'
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Users, 
  MessageSquare,
  Target,
  Award,
  Zap
} from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'

// Mock conversation analytics data
const mockAnalyticsData = {
  overallMetrics: {
    totalConversations: 1247,
    avgDuration: 28.5,
    conversionRate: 23.8,
    satisfactionScore: 4.6
  },
  conversationOutcomes: [
    { outcome: 'Qualified Lead', count: 297, percentage: 23.8, trend: '+12%' },
    { outcome: 'Follow-up Scheduled', count: 374, percentage: 30.0, trend: '+8%' },
    { outcome: 'Demo Requested', count: 187, percentage: 15.0, trend: '+15%' },
    { outcome: 'Not Interested', count: 249, percentage: 20.0, trend: '-5%' },
    { outcome: 'Information Gathered', count: 140, percentage: 11.2, trend: '+3%' }
  ],
  topPerformers: [
    { name: 'Sarah Johnson', conversations: 89, conversionRate: 34.8, avgDuration: 32.1 },
    { name: 'Mike Chen', conversations: 76, conversionRate: 28.9, avgDuration: 29.4 },
    { name: 'Alex Rivera', conversations: 68, conversionRate: 25.0, avgDuration: 26.8 },
    { name: 'Emma Davis', conversations: 54, conversionRate: 22.2, avgDuration: 24.5 }
  ],
  conversationStages: [
    { stage: 'Opening', avgDuration: 3.2, successRate: 95.2 },
    { stage: 'Discovery', avgDuration: 12.8, successRate: 78.4 },
    { stage: 'Presentation', avgDuration: 8.5, successRate: 65.1 },
    { stage: 'Objection Handling', avgDuration: 4.2, successRate: 42.8 },
    { stage: 'Closing', avgDuration: 2.8, successRate: 23.8 }
  ],
  sentimentAnalysis: {
    positive: 68.5,
    neutral: 22.3,
    negative: 9.2
  }
}

export default function ConversationAnalytics() {
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const cardBg = useColorModeValue('white', 'gray.700')

  return (
    <DashboardLayout>
      <VStack spacing={8} align="stretch" w="full">
        {/* Header */}
        <Box>
          <VStack spacing={4} align="start">
            <HStack spacing={3}>
              <BarChart3 size={32} color="#805AD5" />
              <VStack align="start" spacing={0}>
                <Heading size="xl" color="purple.600">
                  Conversation Analytics
                </Heading>
                <Text color="gray.600" fontSize="lg">
                  Deep insights into conversation patterns, outcomes, and performance
                </Text>
              </VStack>
            </HStack>
            
            <HStack spacing={4}>
              <Select placeholder="All Conversation Types" maxW="250px">
                <option value="discovery">Discovery Calls</option>
                <option value="demo">Product Demos</option>
                <option value="followup">Follow-up Calls</option>
                <option value="closing">Closing Calls</option>
              </Select>
              <Select placeholder="Last 30 days" maxW="200px">
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </Select>
            </HStack>
          </VStack>
        </Box>

        {/* Key Metrics */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          <Card bg={cardBg} shadow="sm">
            <CardBody p={6} textAlign="center">
              <VStack spacing={3}>
                <MessageSquare size={32} color="#805AD5" />
                <Stat textAlign="center">
                  <StatLabel fontSize="sm">Total Conversations</StatLabel>
                  <StatNumber fontSize="2xl" color="purple.600">
                    {mockAnalyticsData.overallMetrics.totalConversations.toLocaleString()}
                  </StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    15.2% vs last month
                  </StatHelpText>
                </Stat>
              </VStack>
            </CardBody>
          </Card>

          <Card bg={cardBg} shadow="sm">
            <CardBody p={6} textAlign="center">
              <VStack spacing={3}>
                <Clock size={32} color="#3182CE" />
                <Stat textAlign="center">
                  <StatLabel fontSize="sm">Avg Duration</StatLabel>
                  <StatNumber fontSize="2xl" color="blue.600">
                    {mockAnalyticsData.overallMetrics.avgDuration}m
                  </StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    2.3m vs last month
                  </StatHelpText>
                </Stat>
              </VStack>
            </CardBody>
          </Card>

          <Card bg={cardBg} shadow="sm">
            <CardBody p={6} textAlign="center">
              <VStack spacing={3}>
                <Target size={32} color="#38A169" />
                <Stat textAlign="center">
                  <StatLabel fontSize="sm">Conversion Rate</StatLabel>
                  <StatNumber fontSize="2xl" color="green.600">
                    {mockAnalyticsData.overallMetrics.conversionRate}%
                  </StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    3.1% vs last month
                  </StatHelpText>
                </Stat>
              </VStack>
            </CardBody>
          </Card>

          <Card bg={cardBg} shadow="sm">
            <CardBody p={6} textAlign="center">
              <VStack spacing={3}>
                <Award size={32} color="#F56500" />
                <Stat textAlign="center">
                  <StatLabel fontSize="sm">Satisfaction Score</StatLabel>
                  <StatNumber fontSize="2xl" color="orange.600">
                    {mockAnalyticsData.overallMetrics.satisfactionScore}/5
                  </StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    0.2 vs last month
                  </StatHelpText>
                </Stat>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Conversation Outcomes & Sentiment */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
          {/* Conversation Outcomes */}
          <Card bg={cardBg} shadow="sm">
            <CardBody p={6}>
              <VStack spacing={6} align="stretch">
                <Heading size="md" color="gray.700">
                  Conversation Outcomes
                </Heading>
                
                <VStack spacing={4} align="stretch">
                  {mockAnalyticsData.conversationOutcomes.map((outcome, index) => (
                    <Box key={outcome.outcome}>
                      <HStack justify="space-between" mb={2}>
                        <Text fontWeight="medium" fontSize="sm">
                          {outcome.outcome}
                        </Text>
                        <HStack spacing={2}>
                          <Text fontSize="sm" fontWeight="bold">
                            {outcome.count}
                          </Text>
                          <Badge 
                            colorScheme={outcome.trend.startsWith('+') ? 'green' : 'red'}
                            size="sm"
                          >
                            {outcome.trend}
                          </Badge>
                        </HStack>
                      </HStack>
                      
                      <Progress 
                        value={outcome.percentage} 
                        colorScheme={index % 2 === 0 ? 'purple' : 'blue'} 
                        size="sm" 
                        borderRadius="full"
                      />
                      
                      <Text fontSize="xs" color="gray.600" mt={1}>
                        {outcome.percentage}% of total conversations
                      </Text>
                    </Box>
                  ))}
                </VStack>
              </VStack>
            </CardBody>
          </Card>

          {/* Sentiment Analysis */}
          <Card bg={cardBg} shadow="sm">
            <CardBody p={6}>
              <VStack spacing={6} align="stretch">
                <Heading size="md" color="gray.700">
                  Sentiment Analysis
                </Heading>
                
                <VStack spacing={4} align="stretch">
                  <Box>
                    <HStack justify="space-between" mb={2}>
                      <HStack spacing={2}>
                        <Box w={3} h={3} bg="green.500" borderRadius="full" />
                        <Text fontWeight="medium" fontSize="sm">Positive</Text>
                      </HStack>
                      <Text fontSize="sm" fontWeight="bold" color="green.600">
                        {mockAnalyticsData.sentimentAnalysis.positive}%
                      </Text>
                    </HStack>
                    <Progress 
                      value={mockAnalyticsData.sentimentAnalysis.positive} 
                      colorScheme="green" 
                      size="sm" 
                      borderRadius="full"
                    />
                  </Box>

                  <Box>
                    <HStack justify="space-between" mb={2}>
                      <HStack spacing={2}>
                        <Box w={3} h={3} bg="gray.500" borderRadius="full" />
                        <Text fontWeight="medium" fontSize="sm">Neutral</Text>
                      </HStack>
                      <Text fontSize="sm" fontWeight="bold" color="gray.600">
                        {mockAnalyticsData.sentimentAnalysis.neutral}%
                      </Text>
                    </HStack>
                    <Progress 
                      value={mockAnalyticsData.sentimentAnalysis.neutral} 
                      colorScheme="gray" 
                      size="sm" 
                      borderRadius="full"
                    />
                  </Box>

                  <Box>
                    <HStack justify="space-between" mb={2}>
                      <HStack spacing={2}>
                        <Box w={3} h={3} bg="red.500" borderRadius="full" />
                        <Text fontWeight="medium" fontSize="sm">Negative</Text>
                      </HStack>
                      <Text fontSize="sm" fontWeight="bold" color="red.600">
                        {mockAnalyticsData.sentimentAnalysis.negative}%
                      </Text>
                    </HStack>
                    <Progress 
                      value={mockAnalyticsData.sentimentAnalysis.negative} 
                      colorScheme="red" 
                      size="sm" 
                      borderRadius="full"
                    />
                  </Box>
                </VStack>

                <Box bg="blue.50" p={4} borderRadius="md" borderLeft="4px" borderColor="blue.500">
                  <Text fontSize="sm" color="blue.700">
                    <strong>Insight:</strong> 68.5% positive sentiment indicates strong conversation quality. 
                    Focus on reducing the 9.2% negative sentiment through better objection handling.
                  </Text>
                </Box>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Top Performers */}
        <Card bg={cardBg} shadow="sm">
          <CardBody p={6}>
            <VStack spacing={6} align="stretch">
              <HStack justify="space-between">
                <Heading size="md" color="gray.700">
                  Top Performers
                </Heading>
                <Badge colorScheme="purple" size="lg" px={3} py={1}>
                  This Month
                </Badge>
              </HStack>
              
              <TableContainer>
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Team Member</Th>
                      <Th isNumeric>Conversations</Th>
                      <Th isNumeric>Conversion Rate</Th>
                      <Th isNumeric>Avg Duration</Th>
                      <Th>Performance</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {mockAnalyticsData.topPerformers.map((performer, index) => (
                      <Tr key={performer.name}>
                        <Td>
                          <HStack spacing={3}>
                            <Avatar size="sm" name={performer.name} />
                            <Text fontWeight="medium">{performer.name}</Text>
                            {index === 0 && <Badge colorScheme="gold" size="sm">🏆 Top</Badge>}
                          </HStack>
                        </Td>
                        <Td isNumeric fontWeight="bold">{performer.conversations}</Td>
                        <Td isNumeric>
                          <Text color="green.600" fontWeight="bold">
                            {performer.conversionRate}%
                          </Text>
                        </Td>
                        <Td isNumeric>{performer.avgDuration}m</Td>
                        <Td>
                          <Progress 
                            value={performer.conversionRate} 
                            colorScheme="green" 
                            size="sm" 
                            borderRadius="full"
                            maxW="100px"
                          />
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </VStack>
          </CardBody>
        </Card>

        {/* Conversation Stage Analysis */}
        <Card bg={cardBg} shadow="sm">
          <CardBody p={6}>
            <VStack spacing={6} align="stretch">
              <Heading size="md" color="gray.700">
                Conversation Stage Analysis
              </Heading>
              
              <SimpleGrid columns={{ base: 1, md: 5 }} spacing={6}>
                {mockAnalyticsData.conversationStages.map((stage, index) => (
                  <Card key={stage.stage} bg="gray.50" borderWidth="1px" borderColor={borderColor}>
                    <CardBody p={4} textAlign="center">
                      <VStack spacing={3}>
                        <Text fontWeight="bold" fontSize="sm" color="gray.700">
                          {stage.stage}
                        </Text>
                        
                        <VStack spacing={1}>
                          <Text fontSize="xs" color="gray.600">Avg Duration</Text>
                          <Text fontSize="lg" fontWeight="bold" color="blue.600">
                            {stage.avgDuration}m
                          </Text>
                        </VStack>
                        
                        <VStack spacing={1}>
                          <Text fontSize="xs" color="gray.600">Success Rate</Text>
                          <Text fontSize="lg" fontWeight="bold" color="green.600">
                            {stage.successRate}%
                          </Text>
                        </VStack>
                        
                        <Progress 
                          value={stage.successRate} 
                          colorScheme="green" 
                          size="sm" 
                          borderRadius="full"
                          w="full"
                        />
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>
              
              <Box bg="purple.50" p={4} borderRadius="md" borderLeft="4px" borderColor="purple.500">
                <Text fontSize="sm" color="purple.700">
                  <strong>Optimization Tip:</strong> The biggest drop-off happens during objection handling (42.8% → 23.8%). 
                  Consider additional training on objection handling techniques to improve conversion rates.
                </Text>
              </Box>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </DashboardLayout>
  )
}
