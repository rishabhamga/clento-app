'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Badge,
  Flex,
  Select,
  Divider,
  IconButton,
  Collapse,
  useDisclosure,
  useColorModeValue,
  Spinner,
  Avatar,
  Tooltip,
  SimpleGrid,
  Progress,
  Textarea,
  useToast
} from '@chakra-ui/react'
import { 
  ChevronDownIcon, 
  ChevronUpIcon, 
  ChatIcon, 
  CalendarIcon,
  TimeIcon,
  SearchIcon,
  StarIcon,
  InfoIcon,
  CheckIcon,
  WarningIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@chakra-ui/icons'
import { FiSend, FiUsers, FiFileText, FiClock, FiTrendingUp, FiMessageCircle, FiUser, FiCalendar } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { mockTranscripts, mockAccounts, type MeetingTranscript } from '@/data/mockTranscripts'

interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  sources?: {
    meetingId: string
    meetingDate: string
    snippet: string
  }[]
}

export default function AISalesBuddyPage() {
  const [selectedAccount, setSelectedAccount] = useState(mockAccounts[0].id)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [actionItems, setActionItems] = useState<string[]>([])
  const [expandedMeeting, setExpandedMeeting] = useState<string | null>(null)
  const [showActionItems, setShowActionItems] = useState(false)
  const [isChatCollapsed, setIsChatCollapsed] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const toast = useToast()

  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const sidebarBg = useColorModeValue('gray.50', 'gray.900')
  const hoverBg = useColorModeValue('gray.100', 'gray.700')
  const headerBg = useColorModeValue('white', 'gray.800')
  const chatBg = useColorModeValue('gray.50', 'gray.900')

  const selectedAccountData = mockAccounts.find(acc => acc.id === selectedAccount)
  const accountTranscripts = mockTranscripts.filter(t => 
    t.accountName.toLowerCase().replace(/\s+/g, '-') === selectedAccount
  )

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setChatMessages(prev => [...prev, userMessage])
    const currentQuery = inputMessage
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai-sales-buddy/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: currentQuery,
          accountId: selectedAccount
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }

      const data = await response.json()
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.response,
        timestamp: new Date(),
        sources: data.sources?.map((source: any) => ({
          meetingId: source.meetingId,
          meetingDate: source.meetingDate,
          snippet: source.snippet
        }))
      }

      setChatMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, errorMessage])
      
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const extractActionItems = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/ai-sales-buddy/action-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId: selectedAccount
        })
      })

      if (!response.ok) {
        throw new Error('Failed to extract action items')
      }

      const data = await response.json()
      
      const formattedItems = data.actionItems.map((item: any) => 
        `[${item.meetingDate}] ${item.text}`
      )
      
      setActionItems(formattedItems)
      setShowActionItems(true)
      
      toast({
        title: "Action Items Extracted",
        description: `Found ${formattedItems.length} action items across all meetings`,
        status: "success",
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      console.error('Error extracting action items:', error)
      // Fallback to local extraction
      const allActionItems: string[] = []
      accountTranscripts.forEach(transcript => {
        if (transcript.actionItems) {
          allActionItems.push(...transcript.actionItems.map(item => 
            `[${transcript.date}] ${item}`
          ))
        }
      })
      setActionItems(allActionItems)
      setShowActionItems(true)
      
      toast({
        title: "Action Items Extracted (Offline)",
        description: `Found ${allActionItems.length} action items from stored data`,
        status: "warning",
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getMeetingStatusColor = (meetingType: string) => {
    const colors = {
      discovery: 'blue',
      demo: 'purple',
      technical: 'orange',
      closing: 'green',
      implementation: 'teal',
      'follow-up': 'gray'
    }
    return colors[meetingType as keyof typeof colors] || 'gray'
  }

  const getAccountProgress = () => {
    const totalMeetings = accountTranscripts.length
    const completedPhases = new Set(accountTranscripts.map(t => t.meetingType)).size
    return Math.round((completedPhases / 6) * 100) // 6 possible meeting types
  }

  const getRecentActivity = () => {
    const sortedMeetings = accountTranscripts.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    return sortedMeetings[0] || null
  }

  const suggestedQueries = [
    {
      text: "What security concerns were mentioned?",
      icon: "🔒",
      category: "Security & Compliance"
    },
    {
      text: "What are the next steps and action items?",
      icon: "✅",
      category: "Action Items"
    },
    {
      text: "Tell me about integration requirements",
      icon: "🔗",
      category: "Technical Integration"
    },
    {
      text: "Summarize the key points from all meetings",
      icon: "📋",
      category: "Meeting Summary"
    },
    {
      text: "What pricing discussions took place?",
      icon: "💰",
      category: "Commercial"
    },
    {
      text: "Who are the key decision makers?",
      icon: "👥",
      category: "Stakeholders"
    }
  ]

  return (
    <DashboardLayout>
      <Box h="calc(100vh - 80px)" display="flex" bg={chatBg}>
        {/* Enhanced Sidebar */}
        <Box
          w={isChatCollapsed ? "100%" : "400px"}
          bg={sidebarBg}
          borderRight={isChatCollapsed ? "none" : "1px"}
          borderColor={borderColor}
          overflowY="auto"
          display="flex"
          flexDirection="column"
          transition="width 0.3s ease"
        >
          {/* Account Header */}
          <Box p={6} bg={headerBg} borderBottom="1px" borderColor={borderColor}>
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between">
                <Heading size={isChatCollapsed ? "lg" : "md"} color="purple.600">
                  Meeting Intelligence
                </Heading>
                {isChatCollapsed && (
                  <Badge colorScheme="purple" size="lg" px={3} py={1}>
                    Full View
                  </Badge>
                )}
              </HStack>
              
              <Box>
                <Text fontSize="sm" color="gray.600" mb={3}>Select Account</Text>
                <SimpleGrid 
                  columns={isChatCollapsed ? 3 : 1} 
                  spacing={isChatCollapsed ? 4 : 2} 
                  w="full"
                >
                  {mockAccounts.map(account => {
                    const isSelected = account.id === selectedAccount
                    const accountMeetings = mockTranscripts.filter(t => 
                      t.accountName.toLowerCase().replace(/\s+/g, '-') === account.id
                    )
                    return (
                      <Card
                        key={account.id}
                        cursor="pointer"
                        onClick={() => setSelectedAccount(account.id)}
                        bg={isSelected ? 'purple.50' : bgColor}
                        borderColor={isSelected ? 'purple.300' : borderColor}
                        borderWidth="1px"
                        _hover={{ 
                          bg: isSelected ? 'purple.100' : hoverBg,
                          borderColor: isSelected ? 'purple.400' : 'purple.200'
                        }}
                        transition="all 0.2s"
                        shadow={isSelected ? 'md' : 'sm'}
                        h={isChatCollapsed ? "auto" : "auto"}
                      >
                        <CardBody p={isChatCollapsed ? 4 : 3}>
                          {isChatCollapsed ? (
                            // Expanded view when chat is collapsed
                            <VStack spacing={3} align="stretch">
                              <HStack justify="space-between">
                                <VStack align="start" spacing={1}>
                                  <Text fontWeight="bold" fontSize="lg">
                                    {account.name}
                                  </Text>
                                  <Badge colorScheme="blue" size="sm">
                                    {account.industry}
                                  </Badge>
                                </VStack>
                                <Avatar 
                                  size="lg" 
                                  name={account.name}
                                  bg={isSelected ? 'purple.500' : 'gray.400'}
                                />
                              </HStack>
                              
                              <SimpleGrid columns={2} spacing={3}>
                                <VStack spacing={1}>
                                  <Text fontSize="xl" fontWeight="bold" color="purple.600">
                                    {accountMeetings.length}
                                  </Text>
                                  <Text fontSize="xs" color="gray.600" textAlign="center">
                                    Total Meetings
                                  </Text>
                                </VStack>
                                <VStack spacing={1}>
                                  <Text fontSize="xl" fontWeight="bold" color="green.600">
                                    {account.status === 'active' ? 'Active' : 'Prospect'}
                                  </Text>
                                  <Text fontSize="xs" color="gray.600" textAlign="center">
                                    Status
                                  </Text>
                                </VStack>
                              </SimpleGrid>
                              
                              {accountMeetings.length > 0 && (
                                <Box>
                                  <Text fontSize="xs" color="gray.600" mb={1}>
                                    Last Meeting: {accountMeetings[accountMeetings.length - 1].date}
                                  </Text>
                                  <Progress 
                                    value={Math.round((accountMeetings.length / 5) * 100)} 
                                    colorScheme="purple" 
                                    size="sm" 
                                    borderRadius="full"
                                  />
                                </Box>
                              )}
                            </VStack>
                          ) : (
                            // Compact view when chat is open
                            <HStack justify="space-between">
                              <VStack align="start" spacing={1}>
                                <Text fontWeight={isSelected ? 'bold' : 'medium'} fontSize="sm">
                                  {account.name}
                                </Text>
                                <HStack spacing={2}>
                                  <Badge colorScheme="blue" size="xs">
                                    {account.industry}
                                  </Badge>
                                  <HStack spacing={1} fontSize="xs" color="gray.600">
                                    <FiCalendar />
                                    <Text>{accountMeetings.length} meetings</Text>
                                  </HStack>
                                </HStack>
                              </VStack>
                              <Avatar 
                                size="sm" 
                                name={account.name}
                                bg={isSelected ? 'purple.500' : 'gray.400'}
                              />
                            </HStack>
                          )}
                        </CardBody>
                      </Card>
                    )
                  })}
                </SimpleGrid>
              </Box>

              {selectedAccountData && !isChatCollapsed && (
                <Card bg={bgColor} shadow="sm">
                  <CardBody p={4}>
                    <VStack spacing={3} align="stretch">
                      <HStack justify="space-between">
                        <VStack align="start" spacing={0}>
                          <Text fontSize="lg" fontWeight="bold">
                            {selectedAccountData.name}
                          </Text>
                          <Badge colorScheme="blue" size="sm">
                            {selectedAccountData.industry}
                          </Badge>
                        </VStack>
                        <Avatar 
                          size="md" 
                          name={selectedAccountData.name}
                          bg="purple.500"
                        />
                      </HStack>
                      
                      <SimpleGrid columns={2} spacing={4}>
                        <Box textAlign="center">
                          <Text fontSize="2xl" fontWeight="bold" color="purple.600">
                            {accountTranscripts.length}
                          </Text>
                          <Text fontSize="xs" color="gray.600">Total Meetings</Text>
                        </Box>
                        <Box textAlign="center">
                          <Text fontSize="2xl" fontWeight="bold" color="green.600">
                            {getAccountProgress()}%
                          </Text>
                          <Text fontSize="xs" color="gray.600">Progress</Text>
                        </Box>
                      </SimpleGrid>
                      
                      <Progress 
                        value={getAccountProgress()} 
                        colorScheme="purple" 
                        size="sm" 
                        borderRadius="full"
                      />
                      
                      {getRecentActivity() && (
                        <HStack spacing={2} fontSize="sm" color="gray.600">
                          <FiClock />
                          <Text>Last meeting: {getRecentActivity()?.date}</Text>
                        </HStack>
                      )}
                    </VStack>
                  </CardBody>
                </Card>
              )}
            </VStack>
          </Box>

          {/* Action Items Button */}
          <Box p={4}>
            <Button
              leftIcon={<FiFileText />}
              colorScheme="purple"
              variant="outline"
              width="100%"
              onClick={extractActionItems}
              isLoading={isLoading}
              loadingText="Extracting..."
            >
              Extract Action Items
            </Button>
          </Box>

          {/* Action Items Panel */}
          <Collapse in={showActionItems} animateOpacity>
            {actionItems.length > 0 && (
              <Box px={4} pb={4}>
                <Card bg={bgColor} shadow="sm">
                  <CardHeader pb={2}>
                    <HStack justify="space-between">
                      <Heading size="sm">Action Items</Heading>
                      <Badge colorScheme="purple">{actionItems.length}</Badge>
                    </HStack>
                  </CardHeader>
                  <CardBody pt={0} maxH="200px" overflowY="auto">
                    <VStack align="stretch" spacing={2}>
                      {actionItems.map((item, index) => (
                        <Box 
                          key={index} 
                          p={3} 
                          bg={sidebarBg} 
                          borderRadius="md" 
                          fontSize="sm"
                          borderLeft="3px solid"
                          borderLeftColor="purple.400"
                        >
                          {item}
                        </Box>
                      ))}
                    </VStack>
                  </CardBody>
                </Card>
              </Box>
            )}
          </Collapse>

          {/* Meeting Timeline */}
          <Box flex={1} p={isChatCollapsed ? 6 : 4}>
            <HStack justify="space-between" mb={4}>
              <Heading size={isChatCollapsed ? "md" : "sm"} color="gray.700">
                Meeting Timeline
              </Heading>
              {isChatCollapsed && (
                <Badge colorScheme="green" size="lg">
                  {accountTranscripts.length} Meetings
                </Badge>
              )}
            </HStack>
            <SimpleGrid 
              columns={isChatCollapsed ? 2 : 1} 
              spacing={isChatCollapsed ? 6 : 3}
              w="full"
            >
              {accountTranscripts.map((meeting, index) => (
                <Card 
                  key={meeting.id}
                  bg={bgColor}
                  shadow="sm"
                  cursor="pointer"
                  _hover={{ shadow: 'md', transform: 'translateY(-1px)' }}
                  transition="all 0.2s"
                  onClick={() => setExpandedMeeting(
                    expandedMeeting === meeting.id ? null : meeting.id
                  )}
                  h={isChatCollapsed ? "auto" : "auto"}
                >
                  <CardBody p={isChatCollapsed ? 6 : 4}>
                    <VStack align="stretch" spacing={isChatCollapsed ? 4 : 3}>
                      <HStack justify="space-between">
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="medium" fontSize={isChatCollapsed ? "lg" : "sm"}>
                            {meeting.date}
                          </Text>
                          <HStack spacing={2}>
                            <Badge 
                              colorScheme={getMeetingStatusColor(meeting.meetingType)}
                              size={isChatCollapsed ? "md" : "sm"}
                            >
                              {meeting.meetingType}
                            </Badge>
                            <HStack spacing={1} fontSize="xs" color="gray.600">
                              <FiClock />
                              <Text>{meeting.duration}</Text>
                            </HStack>
                            {isChatCollapsed && (
                              <HStack spacing={1} fontSize="xs" color="gray.600">
                                <FiUsers />
                                <Text>{meeting.participants.length} participants</Text>
                              </HStack>
                            )}
                          </HStack>
                        </VStack>
                        <IconButton
                          size={isChatCollapsed ? "md" : "sm"}
                          variant="ghost"
                          aria-label="Toggle meeting details"
                          icon={expandedMeeting === meeting.id ? <ChevronUpIcon /> : <ChevronDownIcon />}
                        />
                      </HStack>
                      
                      {/* Show summary in collapsed mode without expanding */}
                      {isChatCollapsed && meeting.summary && (
                        <Box>
                          <Text fontSize="sm" color="gray.700" lineHeight="tall">
                            {meeting.summary}
                          </Text>
                        </Box>
                      )}
                      
                      {/* Show key topics in collapsed mode */}
                      {isChatCollapsed && meeting.keyTopics && meeting.keyTopics.length > 0 && (
                        <Box>
                          <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={2}>
                            Key Topics
                          </Text>
                          <Flex wrap="wrap" gap={1}>
                            {meeting.keyTopics.map((topic, idx) => (
                              <Badge key={idx} size="sm" colorScheme="gray" variant="subtle">
                                {topic}
                              </Badge>
                            ))}
                          </Flex>
                        </Box>
                      )}

                      <Collapse in={expandedMeeting === meeting.id}>
                        <VStack align="stretch" spacing={3} pt={2}>
                          <Divider />
                          
                          <Box>
                            <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={2}>
                              Participants ({meeting.participants.length})
                            </Text>
                            <VStack align="stretch" spacing={2}>
                              {meeting.participants.map((participant, idx) => (
                                <HStack key={idx} spacing={3}>
                                  <Avatar 
                                    size="xs" 
                                    name={participant.name}
                                    bg={participant.company === 'Observe.ai' ? 'purple.500' : 'blue.500'}
                                  />
                                  <VStack align="start" spacing={0} flex={1}>
                                    <Text fontSize="xs" fontWeight="medium">
                                      {participant.name}
                                    </Text>
                                    <Text fontSize="xs" color="gray.500">
                                      {participant.role}, {participant.company}
                                    </Text>
                                  </VStack>
                                </HStack>
                              ))}
                            </VStack>
                          </Box>
                          
                          {meeting.keyTopics && meeting.keyTopics.length > 0 && (
                            <Box>
                              <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={2}>
                                Key Topics
                              </Text>
                              <Flex wrap="wrap" gap={1}>
                                {meeting.keyTopics.map((topic, idx) => (
                                  <Badge key={idx} size="sm" colorScheme="gray" variant="subtle">
                                    {topic}
                                  </Badge>
                                ))}
                              </Flex>
                            </Box>
                          )}
                          
                          {meeting.summary && (
                            <Box>
                              <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={1}>
                                Summary
                              </Text>
                              <Text fontSize="xs" color="gray.600" lineHeight="tall">
                                {meeting.summary}
                              </Text>
                            </Box>
                          )}
                        </VStack>
                      </Collapse>
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          </Box>
        </Box>

        {/* Enhanced Chat Area */}
        <Box 
          flex={1} 
          display="flex" 
          flexDirection="column"
          w={isChatCollapsed ? "60px" : "auto"}
          transition="width 0.3s ease"
        >
          {/* Chat Header */}
          <Box
            bg={headerBg}
            borderBottom="1px"
            borderColor={borderColor}
            p={isChatCollapsed ? 3 : 6}
          >
            <HStack justify="space-between">
              {!isChatCollapsed && (
                <VStack align="start" spacing={1}>
                  <Heading size="lg" color="gray.800">
                    AI Meeting Assistant
                  </Heading>
                  <Text color="gray.600" fontSize="md">
                    Ask me anything about your meetings with {selectedAccountData?.name}
                  </Text>
                </VStack>
              )}
              
              <HStack spacing={isChatCollapsed ? 2 : 6}>
                {!isChatCollapsed && (
                  <>
                    <VStack spacing={0} textAlign="center">
                      <Text fontSize="sm" color="gray.500">Conversations</Text>
                      <Text fontWeight="bold" fontSize="lg" color="purple.600">
                        {accountTranscripts.length}
                      </Text>
                    </VStack>
                    <VStack spacing={0} textAlign="center">
                      <Text fontSize="sm" color="gray.500">Last Activity</Text>
                      <Text fontWeight="bold" fontSize="lg" color="green.600">
                        {accountTranscripts.length > 0 
                          ? accountTranscripts[accountTranscripts.length - 1].date 
                          : 'N/A'
                        }
                      </Text>
                    </VStack>
                  </>
                )}
                <IconButton
                  aria-label={isChatCollapsed ? "Expand chat" : "Collapse chat"}
                  icon={isChatCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                  onClick={() => setIsChatCollapsed(!isChatCollapsed)}
                  variant="ghost"
                  size="md"
                  color="purple.600"
                  _hover={{ bg: 'purple.50' }}
                />
              </HStack>
            </HStack>
          </Box>

          {/* Chat Messages Area */}
          {!isChatCollapsed && (
            <Box
              flex={1}
              overflowY="auto"
              p={6}
              bg={chatBg}
            >
            {chatMessages.length === 0 ? (
              <VStack spacing={8} align="center" justify="center" h="100%" maxW="4xl" mx="auto">
                <VStack spacing={4} textAlign="center">
                  <Box p={4} bg="purple.100" borderRadius="full">
                    <FiMessageCircle size={48} color="purple.600" />
                  </Box>
                  <Heading size="xl" color="gray.700">
                    Start Your Conversation
                  </Heading>
                  <Text color="gray.600" fontSize="lg" maxW="2xl" lineHeight="tall">
                    I can help you find insights from your meetings with {selectedAccountData?.name}. 
                    Ask about compliance requirements, action items, technical discussions, or get meeting summaries.
                  </Text>
                </VStack>
                
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4} w="full" maxW="4xl">
                  {suggestedQueries.map((query, index) => (
                    <Card
                      key={index}
                      cursor="pointer"
                      _hover={{ 
                        transform: 'translateY(-2px)', 
                        shadow: 'lg',
                        borderColor: 'purple.300'
                      }}
                      transition="all 0.2s"
                      onClick={() => setInputMessage(query.text)}
                      bg={bgColor}
                      border="1px solid"
                      borderColor="gray.200"
                    >
                      <CardBody p={4}>
                        <VStack spacing={3} align="center" textAlign="center">
                          <Text fontSize="2xl">{query.icon}</Text>
                          <VStack spacing={1}>
                            <Text fontWeight="semibold" color="gray.800" fontSize="sm">
                              {query.category}
                            </Text>
                            <Text fontSize="xs" color="gray.600" lineHeight="short">
                              {query.text}
                            </Text>
                          </VStack>
                        </VStack>
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>
              </VStack>
            ) : (
              <VStack spacing={6} align="stretch" maxW="4xl" mx="auto">
                <AnimatePresence>
                  {chatMessages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Box
                        alignSelf={message.type === 'user' ? 'flex-end' : 'flex-start'}
                        maxW="85%"
                        ml={message.type === 'assistant' ? 0 : 'auto'}
                      >
                        <Card
                          bg={message.type === 'user' ? 'purple.500' : bgColor}
                          color={message.type === 'user' ? 'white' : 'inherit'}
                          shadow="md"
                        >
                          <CardBody p={4}>
                            <VStack align="stretch" spacing={3}>
                              <HStack justify="space-between" align="start">
                                <HStack spacing={2}>
                                  <Avatar 
                                    size="sm" 
                                    name={message.type === 'user' ? 'User' : 'AI Assistant'}
                                    bg={message.type === 'user' ? 'purple.600' : 'blue.500'}
                                  />
                                  <Text fontWeight="medium" fontSize="sm">
                                    {message.type === 'user' ? 'You' : 'AI Assistant'}
                                  </Text>
                                </HStack>
                                <Text fontSize="xs" color={message.type === 'user' ? 'purple.200' : 'gray.500'}>
                                  {message.timestamp.toLocaleTimeString()}
                                </Text>
                              </HStack>
                              
                              <Text whiteSpace="pre-line" lineHeight="tall">
                                {message.content}
                              </Text>
                              
                              {message.sources && message.sources.length > 0 && (
                                <Box 
                                  mt={4} 
                                  pt={4} 
                                  borderTop="1px" 
                                  borderColor="gray.200"
                                >
                                  <HStack spacing={2} mb={3}>
                                    <InfoIcon boxSize={4} color="blue.500" />
                                    <Text fontSize="sm" fontWeight="semibold" color="blue.600">
                                      Sources ({message.sources.length})
                                    </Text>
                                  </HStack>
                                  <VStack spacing={2} align="stretch">
                                    {message.sources.map((source, idx) => (
                                      <Box 
                                        key={idx} 
                                        p={3} 
                                        bg="blue.50" 
                                        borderRadius="md"
                                        borderLeft="3px solid"
                                        borderLeftColor="blue.400"
                                      >
                                        <HStack justify="space-between" mb={1}>
                                          <Text fontSize="xs" fontWeight="semibold" color="blue.700">
                                            Meeting: {source.meetingDate}
                                          </Text>
                                          <Badge size="sm" colorScheme="blue">
                                            Source {idx + 1}
                                          </Badge>
                                        </HStack>
                                        <Text fontSize="xs" color="gray.700" lineHeight="tall">
                                          "{source.snippet.substring(0, 150)}..."
                                        </Text>
                                      </Box>
                                    ))}
                                  </VStack>
                                </Box>
                              )}
                            </VStack>
                          </CardBody>
                        </Card>
                      </Box>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {isLoading && (
                  <Box alignSelf="flex-start" maxW="85%">
                    <Card bg={bgColor} shadow="md">
                      <CardBody p={4}>
                        <HStack spacing={3}>
                          <Avatar size="sm" bg="blue.500" />
                          <VStack align="start" spacing={1}>
                            <Text fontSize="sm" fontWeight="medium">AI Assistant</Text>
                            <HStack spacing={2}>
                              <Spinner size="sm" color="purple.500" />
                              <Text fontSize="sm" color="gray.600">
                                Analyzing your meetings...
                              </Text>
                            </HStack>
                          </VStack>
                        </HStack>
                      </CardBody>
                    </Card>
                  </Box>
                )}
                
                <div ref={chatEndRef} />
              </VStack>
            )}
            </Box>
          )}

          {/* Collapsed Chat Indicator */}
          {isChatCollapsed && (
            <Box 
              flex={1} 
              display="flex" 
              alignItems="center" 
              justifyContent="center"
              bg={chatBg}
            >
              <VStack spacing={3} color="gray.500">
                <FiMessageCircle size={32} />
                <Box
                  transform="rotate(-90deg)"
                  whiteSpace="nowrap"
                >
                  <Text fontSize="sm" textAlign="center">
                    Chat
                  </Text>
                </Box>
              </VStack>
            </Box>
          )}

          {/* Enhanced Input Area */}
          {!isChatCollapsed && (
            <Box
              bg={headerBg}
              borderTop="1px"
              borderColor={borderColor}
              p={6}
            >
            <VStack spacing={4} maxW="4xl" mx="auto">
              <HStack spacing={3} w="full">
                <Box flex={1} position="relative">
                  <Textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask about your meetings... (e.g., 'What security concerns were discussed?')"
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                    disabled={isLoading}
                    resize="none"
                    rows={1}
                    bg={bgColor}
                    borderColor="gray.300"
                    _focus={{ borderColor: 'purple.400', boxShadow: '0 0 0 1px purple.400' }}
                  />
                </Box>
                <IconButton
                  aria-label="Send message"
                  icon={<FiSend />}
                  colorScheme="purple"
                  size="lg"
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  isLoading={isLoading}
                />
              </HStack>
              
              <HStack spacing={2} fontSize="xs" color="gray.500" justify="center">
                <Text>💡 Tip: Try asking about security, integrations, action items, or meeting summaries</Text>
              </HStack>
            </VStack>
            </Box>
          )}
        </Box>
      </Box>
    </DashboardLayout>
  )
}