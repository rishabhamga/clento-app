'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  Card,
  CardBody,
  Avatar,
  Badge,
  Spinner,
  Alert,
  AlertIcon,
  useColorModeValue,
  Flex,
  Icon,
  Tooltip,
  Fade,
  ScaleFade,
  IconButton,
  Textarea,
  Divider,
  useToast
} from '@chakra-ui/react'
import { FiUser, FiZap, FiTarget, FiMessageCircle, FiCheck, FiArrowRight, FiSend, FiPlus, FiRefreshCw } from 'react-icons/fi'
import { GradientButton } from '@/components/ui/GradientButton'
import { useSearchFilters } from '../../hooks/useApolloSearch'

interface ParsedICP {
  // Basic search info
  searchType: 'people' | 'company'

  // Person-level filters
  jobTitles: string[]
  seniorities: string[]
  personLocations?: string[]

  // Company-level filters
  organizationLocations?: string[]
  companySize: string[]
  revenueMin?: number | null
  revenueMax?: number | null
  technologies: string[]
  excludeTechnologies?: string[]

  // Organization job filters (hiring signals)
  organizationJobTitles?: string[]
  organizationJobLocations?: string[]
  organizationNumJobsMin?: number | null
  organizationNumJobsMax?: number | null
  organizationJobPostedAtMin?: string | null
  organizationJobPostedAtMax?: string | null

  // Funding & growth signals
  fundingAmountMin?: number | null
  fundingAmountMax?: number | null

  // Other filters
  keywords: string[]
  companyDomains?: string[]

  // Metadata
  confidence: number
  reasoning?: string
}

interface ConversationMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  metadata?: {
    confidence?: number
    filtersApplied?: string[]
    reasoningExplanation?: string
    conflictsDetected?: string[]
    clarificationNeeded?: string[]
  }
}

interface ConversationalICPProps {
  onICPParsed: (parsedICP: ParsedICP) => void
  onReset?: () => void
  disabled?: boolean
}

const AI_SDR_MESSAGES = {
  welcome: "👋 Hi! I'm Alex, your AI SDR. Tell me about your ideal customer and I'll help you build the perfect targeting filters. You can click on the examples below or describe your own requirements!",
  thinking: "🤔 Let me analyze that...",
  processing: "⚡ Building your target audience...",
  success: "✅ Perfect! I've updated your filters.",
  error: "❌ Sorry, I had trouble understanding that. Could you rephrase?",
  followup: "💡 Want to refine anything else?"
}

const SAMPLE_MESSAGES = [
  {
    title: "Basic Targeting",
    message: "I want to target CTOs at mid-size tech companies in the US with 50-500 employees",
    category: "basic"
  },
  {
    title: "With Hiring Signals",
    message: "Find VPs of Engineering at SaaS companies who are actively hiring React developers in the past 30 days",
    category: "hiring"
  },
  {
    title: "Technology Stack",
    message: "Target marketing managers at companies using Salesforce and HubSpot with $10M-100M revenue",
    category: "tech"
  },
  {
    title: "Funding & Growth",
    message: "Show me founders at Series A-B startups in fintech that raised funding in the last 12 months",
    category: "funding"
  },
  {
    title: "Geographic Focus",
    message: "I need sales directors at manufacturing companies in Texas, California, and New York",
    category: "location"
  },
  {
    title: "Refinement Example",
    message: "Change CTO to CMO and add companies with 100+ employees",
    category: "refine"
  }
]

// Whitelist of supported filter keys (should match ParsedICP interface)
const SUPPORTED_FILTER_KEYS = [
  'searchType',
  'jobTitles',
  'seniorities',
  'personLocations',
  'organizationLocations',
  'companySize',
  'revenueMin',
  'revenueMax',
  'technologies',
  'excludeTechnologies',
  'organizationJobTitles',
  'organizationJobLocations',
  'organizationNumJobsMin',
  'organizationNumJobsMax',
  'organizationJobPostedAtMin',
  'organizationJobPostedAtMax',
  'fundingAmountMin',
  'fundingAmountMax',
  'keywords',
  'companyDomains',
  'confidence',
  'reasoning',
];

function filterSupportedFields(obj: any): ParsedICP {
  if (!obj) return {
    searchType: 'people',
    jobTitles: [],
    seniorities: [],
    companySize: [],
    technologies: [],
    keywords: [],
    confidence: 0,
    // Add all other required fields with safe defaults
    personLocations: [],
    organizationLocations: [],
    revenueMin: null,
    revenueMax: null,
    excludeTechnologies: [],
    organizationJobTitles: [],
    organizationJobLocations: [],
    organizationNumJobsMin: null,
    organizationNumJobsMax: null,
    organizationJobPostedAtMin: null,
    organizationJobPostedAtMax: null,
    fundingAmountMin: null,
    fundingAmountMax: null,
    companyDomains: [],
    reasoning: '',
  };
  // Start with defaults, then override with filtered values
  const defaults: ParsedICP = {
    searchType: 'people',
    jobTitles: [],
    seniorities: [],
    companySize: [],
    technologies: [],
    keywords: [],
    confidence: 0,
    personLocations: [],
    organizationLocations: [],
    revenueMin: null,
    revenueMax: null,
    excludeTechnologies: [],
    organizationJobTitles: [],
    organizationJobLocations: [],
    organizationNumJobsMin: null,
    organizationNumJobsMax: null,
    organizationJobPostedAtMin: null,
    organizationJobPostedAtMax: null,
    fundingAmountMin: null,
    fundingAmountMax: null,
    companyDomains: [],
    reasoning: '',
  };
  const filtered = Object.fromEntries(
    Object.entries(obj).filter(([key]) => SUPPORTED_FILTER_KEYS.includes(key))
  );
  return { ...defaults, ...filtered };
}

export function ConversationalICP({ onICPParsed, onReset, disabled = false }: ConversationalICPProps) {
  // Conversation state
  const { filters } = useSearchFilters()
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentFilters, setCurrentFilters] = useState<ParsedICP | null>(null)

  // UI state
  const [showWelcome, setShowWelcome] = useState(true)
  const [showSampleMessages, setShowSampleMessages] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const toast = useToast()

  // Colors
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const userMessageBg = useColorModeValue('purple.500', 'purple.400')
  const assistantMessageBg = useColorModeValue('gray.100', 'gray.700')
  const mutedColor = useColorModeValue('gray.600', 'gray.400')
  const inputBoxBg = useColorModeValue('white', 'gray.800')
  const suggestionsBg = useColorModeValue('gray.50', 'gray.700')
  const purpleBorderColor = useColorModeValue('purple.100', 'purple.800')

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Show welcome message on mount
  useEffect(() => {
    if (showWelcome && messages.length === 0) {
      const welcomeMessage: ConversationMessage = {
        id: 'welcome',
        role: 'assistant',
        content: AI_SDR_MESSAGES.welcome,
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
    }
  }, [showWelcome, messages.length])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const ta = e.currentTarget
    ta.style.height = 'auto'                    // reset to measure
    ta.style.height = ta.scrollHeight + 'px'    // grow to fit
    setInput(ta.value)                          // update input state
  }

  const addMessage = (role: 'user' | 'assistant', content: string, metadata?: any) => {
    const message: ConversationMessage = {
      id: `${role}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role,
      content,
      timestamp: new Date(),
      metadata
    }
    setMessages(prev => [...prev, message])
  }

  const handleSampleMessageClick = (sampleMessage: string) => {
    setInput(sampleMessage)
    setShowSampleMessages(false)
    // Focus the input field after setting the message
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        inputRef.current.style.height = 'auto'
        inputRef.current.style.height = inputRef.current.scrollHeight + 'px'
      }
    }, 50)
  }

  const handleSendMessage = async () => {
    if (!input.trim() || isProcessing) return

    const userMessage = input.trim()
    setInput('')
    setError(null)
    setIsProcessing(true)
    setShowSampleMessages(false) // Hide sample messages when user starts typing

    // Add user message immediately
    addMessage('user', userMessage)

    try {
      // Call conversational API
      const response = await fetch('/api/parse-icp/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userMessage,
          ...(conversationId && { conversationId }),
          intent: conversationId ? 'refine' : 'initial'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process message')
      }

      if (data.success && data.conversation) {
        const conversation = data.conversation

        // Filter updatedFilters to only supported fields
        const filteredFilters = filterSupportedFields(conversation.updatedFilters)

        // Filter filterChanges to only supported fields
        const filteredFilterChanges = (conversation.filterChanges || []).filter((fc: any) =>
          SUPPORTED_FILTER_KEYS.includes(fc.field)
        )

        // Update conversation ID if this is the first message
        if (!conversationId) {
          setConversationId(conversation.conversationId)
          setShowWelcome(false)
        }

        // Add Alex's response (with filtered filterChanges)
        addMessage('assistant', conversation.assistantMessage, {
          confidence: conversation.confidence,
          filtersApplied: filteredFilterChanges.map((fc: any) => fc.field) || [],
          reasoningExplanation: conversation.reasoningExplanation,
          conflictsDetected: conversation.conflictsDetected,
          clarificationNeeded: conversation.clarificationNeeded
        })

        // Update current filters
        setCurrentFilters(filteredFilters)

        // Notify parent component about filter updates
        onICPParsed(filteredFilters)

        // Show success toast with filter changes
        if (filteredFilterChanges.length > 0) {
          toast({
            title: 'Filters Updated!',
            description: `Updated ${filteredFilterChanges.length} filter categories`,
            status: 'success',
            duration: 3000,
            isClosable: true,
          })
        }

      } else {
        throw new Error('Invalid response format')
      }

    } catch (error) {
      console.error('Error in conversation:', error)
      setError(error instanceof Error ? error.message : 'Unknown error occurred')

      // Add error message from Alex
      addMessage('assistant', AI_SDR_MESSAGES.error + ' ' + (error instanceof Error ? error.message : ''))
    } finally {
      setIsProcessing(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const startNewConversation = () => {
    setConversationId(null)
    setMessages([])
    setCurrentFilters(null)
    setInput('')
    setError(null)
    setShowWelcome(true)
    setShowSampleMessages(true) // Show sample messages again for new conversation

    if (onReset) onReset()

    toast({
      title: 'New Conversation Started',
      description: 'You can now describe a new ideal customer profile',
      status: 'info',
      duration: 2000,
      isClosable: true,
    })
  }

  const renderSampleMessages = () => {
    if (!showSampleMessages || conversationId || messages.length > 1) return null

    return (
      <ScaleFade in={showSampleMessages} initialScale={0.9}>
        <Box mt={4} mb={4}>
          <Text fontSize="sm" color={mutedColor} mb={3} textAlign="center">
            💡 Try these examples to get started:
          </Text>

          <VStack spacing={2} align="stretch">
            {SAMPLE_MESSAGES.slice(0, 4).map((sample, index) => (
              <Card
                key={index}
                size="sm"
                variant="outline"
                cursor="pointer"
                _hover={{
                  borderColor: 'purple.300',
                  transform: 'translateY(-1px)',
                  shadow: 'sm'
                }}
                transition="all 0.2s"
                onClick={() => handleSampleMessageClick(sample.message)}
                bg={suggestionsBg}
                borderColor={borderColor}
              >
                <CardBody p={3}>
                  <HStack spacing={3}>
                    <Icon
                      as={
                        sample.category === 'basic' ? FiTarget :
                        sample.category === 'hiring' ? FiZap :
                        sample.category === 'tech' ? FiMessageCircle :
                        sample.category === 'funding' ? FiArrowRight :
                        sample.category === 'location' ? FiUser :
                        FiRefreshCw
                      }
                      color="purple.500"
                      flexShrink={0}
                    />
                    <VStack align="start" spacing={1} flex={1}>
                      <Text fontSize="xs" fontWeight="semibold" color="purple.600">
                        {sample.title}
                      </Text>
                      <Text fontSize="xs" color={mutedColor} noOfLines={2}>
                        "{sample.message}"
                      </Text>
                    </VStack>
                    <Icon as={FiArrowRight} color={mutedColor} size="12px" />
                  </HStack>
                </CardBody>
              </Card>
            ))}
          </VStack>

          <Text fontSize="xs" color={mutedColor} mt={3} textAlign="center">
            Click on any example above or type your own message below
          </Text>
        </Box>
      </ScaleFade>
    )
  }

  const renderRefinementSuggestions = () => {
    if (!conversationId || !currentFilters) return null

    const refinementSamples = SAMPLE_MESSAGES.filter(sample => sample.category === 'refine').slice(0, 2)

    return (
      <Box mt={2} mb={2}>
        <Text fontSize="xs" color={mutedColor} mb={2} textAlign="center">
          💬 Need to refine? Try:
        </Text>
        <HStack spacing={2} justify="center" flexWrap="wrap">
          {refinementSamples.map((sample, index) => (
            <Button
              key={index}
              size="xs"
              variant="outline"
              colorScheme="purple"
              onClick={() => handleSampleMessageClick(sample.message)}
              leftIcon={<Icon as={FiRefreshCw} />}
            >
              {sample.title}
            </Button>
          ))}
        </HStack>
      </Box>
    )
  }

  const renderMessage = (message: ConversationMessage) => {
    const isUser = message.role === 'user'
    const isWelcome = message.id === 'welcome'

    return (
      <Fade key={message.id} in={true}>
        <Flex
          justify={isUser ? 'flex-end' : 'flex-start'}
          mb={4}
          align="flex-start"
        >
          {!isUser && (
            <Avatar
              size="sm"
              mr={3}
              bg="purple.500"
              icon={<Icon as={FiZap} color="white" />}
              flexShrink={0}
            />
          )}

          <Box
            maxW="80%"
            bg={isUser ? userMessageBg : assistantMessageBg}
            color={isUser ? 'white' : 'inherit'}
            p={4}
            borderRadius="lg"
            borderBottomLeftRadius={isUser ? 'lg' : 'sm'}
            borderBottomRightRadius={isUser ? 'sm' : 'lg'}
            position="relative"
            border={isUser ? "none" : "1px solid"}
            borderColor={purpleBorderColor}
            boxShadow={isUser ? '0 4px 12px rgba(128, 90, 213, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)'}
            _before={!isUser ? {
              content: '""',
              position: 'absolute',
              left: '-8px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: 0,
              height: 0,
              borderTop: '8px solid transparent',
              borderBottom: '8px solid transparent',
              borderRight: `8px solid ${assistantMessageBg}`,
            } : undefined}
            _after={isUser ? {
              content: '""',
              position: 'absolute',
              right: '-8px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: 0,
              height: 0,
              borderTop: '8px solid transparent',
              borderBottom: '8px solid transparent',
              borderLeft: `8px solid ${userMessageBg}`,
            } : undefined}
          >
            {!isUser && !isWelcome && (
              <HStack mb={2} spacing={2}>
                <Text fontSize="xs" fontWeight="bold" opacity={0.8}>
                  Alex
                </Text>
                {message.metadata?.confidence && (
                  <Badge size="xs" colorScheme="green">
                    {message.metadata.confidence}% confident
                  </Badge>
                )}
              </HStack>
            )}

            <Text fontSize="sm" whiteSpace="pre-wrap">
              {message.content}
            </Text>

            {message.metadata?.filtersApplied && message.metadata.filtersApplied.length > 0 && (
              <HStack mt={2} spacing={1} flexWrap="wrap">
                <Text fontSize="xs" opacity={0.7}>
                  Updated:
                </Text>
                {message.metadata.filtersApplied.map((filter: string) => (
                  <Badge key={filter} size="xs" variant="outline">
                    {filter}
                  </Badge>
                ))}
              </HStack>
            )}

            {message.metadata?.reasoningExplanation && (
              <Box mt={2} p={2} bg="purple.50" borderRadius="md" border="1px solid" borderColor="purple.200">
                <Text fontSize="xs" fontWeight="semibold" color="purple.600">
                  Reasoning:
                </Text>
                <Text fontSize="sm" whiteSpace="pre-wrap">{message.metadata.reasoningExplanation}</Text>
              </Box>
            )}

            {message.metadata?.conflictsDetected && message.metadata.conflictsDetected.length > 0 && (
              <Box mt={2} p={2} bg="red.50" borderRadius="md" border="1px solid" borderColor="red.200">
                <Text fontSize="xs" fontWeight="semibold" color="red.600">
                  Conflicts:
                </Text>
                <Text fontSize="sm" whiteSpace="pre-wrap">{message.metadata.conflictsDetected.join(', ')}</Text>
              </Box>
            )}

            {message.metadata?.clarificationNeeded && message.metadata.clarificationNeeded.length > 0 && (
              <Box mt={2} p={2} bg="yellow.50" borderRadius="md" border="1px solid" borderColor="yellow.200">
                <Text fontSize="xs" fontWeight="semibold" color="yellow.600">
                  Clarification Needed:
                </Text>
                <Text fontSize="sm" whiteSpace="pre-wrap">{message.metadata.clarificationNeeded.join(', ')}</Text>
              </Box>
            )}

            <Text fontSize="xs" opacity={0.6} mt={1}>
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </Box>

          {isUser && (
            <Avatar
              size="sm"
              ml={3}
              bg="gray.500"
              icon={<Icon as={FiUser} color="white" />}
              flexShrink={0}
            />
          )}
        </Flex>
      </Fade>
    )
  }

  return (
    <Card bg={cardBg} border="1px solid" borderColor={borderColor} h="600px" display="flex" flexDirection="column" boxShadow="lg">
      <CardBody p={0} display="flex" flexDirection="column" h="100%">
        {/* Header */}
        <HStack p={4} borderBottom="1px solid" borderColor={borderColor} flexShrink={0}>
          <Avatar
            size="sm"
            bg="purple.500"
            icon={<Icon as={FiZap} color="white" />}
          />
          <VStack align="start" spacing={0} flex={1}>
            <Text fontWeight="bold" fontSize="sm">
              Alex - AI SDR Assistant
            </Text>
            <Text fontSize="xs" color={mutedColor}>
              {conversationId ? 'Conversation active' : 'Ready to help you target the perfect audience'}
            </Text>
          </VStack>

          <Tooltip label="Start new conversation" hasArrow>
            <IconButton
              aria-label="Start new conversation"
              icon={<FiPlus />}
              size="sm"
              variant="ghost"
              onClick={startNewConversation}
              disabled={!conversationId && messages.length <= 1}
            />
          </Tooltip>
        </HStack>

        {/* Messages */}
        <Box flex={1} overflowY="auto" p={4}>
          <VStack spacing={0} align="stretch">
            {messages.map(renderMessage)}

            {/* Sample Messages */}
            {renderSampleMessages()}

            {isProcessing && (
              <ScaleFade in={isProcessing} initialScale={0.8}>
                <Flex justify="flex-start" mb={4}>
                  <Avatar
                    size="sm"
                    mr={3}
                    bg="purple.500"
                    icon={<Spinner size="xs" color="white" />}
                    flexShrink={0}
                  />
                  <Box
                    bg={assistantMessageBg}
                    p={4}
                    borderRadius="lg"
                    borderBottomLeftRadius="sm"
                    border="1px solid"
                    borderColor={purpleBorderColor}
                    position="relative"
                    _before={{
                      content: '""',
                      position: 'absolute',
                      left: '-8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 0,
                      height: 0,
                      borderTop: '8px solid transparent',
                      borderBottom: '8px solid transparent',
                      borderRight: `8px solid ${assistantMessageBg}`,
                    }}
                  >
                    <HStack spacing={3}>
                      <Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box
                            w="3px"
                            h="3px"
                            bg="purple.400"
                            borderRadius="full"
                            animation="pulse 1.5s ease-in-out infinite"
                          />
                          <Box
                            w="3px"
                            h="3px"
                            bg="purple.400"
                            borderRadius="full"
                            animation="pulse 1.5s ease-in-out infinite 0.2s"
                          />
                          <Box
                            w="3px"
                            h="3px"
                            bg="purple.400"
                            borderRadius="full"
                            animation="pulse 1.5s ease-in-out infinite 0.4s"
                          />
                        </Box>
                      </Box>
                      <Text fontSize="sm" color={mutedColor} fontStyle="italic">
                        Alex is analyzing your request...
                      </Text>
                    </HStack>
                  </Box>
                </Flex>
              </ScaleFade>
            )}

            <div ref={messagesEndRef} />
          </VStack>
        </Box>

        {/* Error Alert */}
        {error && (
          <Box p={4} pt={0}>
            <Alert status="error" size="sm" borderRadius="md">
              <AlertIcon />
              <Text fontSize="sm">{error}</Text>
            </Alert>
          </Box>
        )}

        {/* Input */}
        <Box p={4} borderTop="1px solid" borderColor={borderColor} flexShrink={0}>
          {/* Refinement Suggestions */}
          {renderRefinementSuggestions()}

          <Box
            position="relative"
            bg={inputBoxBg}
            border="2px solid"
            borderColor={input.trim() ? 'purple.300' : borderColor}
            borderRadius="xl"
            transition="all 0.2s"
            _focusWithin={{
              borderColor: 'purple.500',
              boxShadow: '0 0 0 1px rgba(128, 90, 213, 0.4)',
              transform: 'translateY(-1px)'
            }}
            overflow="hidden"
          >
            <HStack spacing={0} align="end">
              <Textarea
                ref={inputRef}
                value={input}
                onInput={handleInput}
                onKeyPress={handleKeyPress}
                placeholder={conversationId ? "Tell me how to refine your targeting..." : "Describe your ideal customer (e.g., 'CTOs at SaaS companies hiring developers')"}
                resize="none"
                rows={Math.min(input.split('\n').length || 1, 4)}
                disabled={disabled || isProcessing}
                bg="transparent"
                border="none"
                _focus={{
                  border: 'none',
                  boxShadow: 'none'
                }}
                fontSize="sm"
                lineHeight="1.4"
                py={3}
                px={4}
                minH="60px"
                maxH="200px"
              />
              <Box p={2}>
                <IconButton
                  aria-label="Send message"
                  icon={<FiSend />}
                  colorScheme="purple"
                  size="sm"
                  onClick={handleSendMessage}
                  disabled={disabled || isProcessing || !input.trim()}
                  isLoading={isProcessing}
                  borderRadius="lg"
                  _hover={{
                    transform: 'scale(1.05)',
                    bg: 'purple.600'
                  }}
                  transition="all 0.2s"
                />
              </Box>
            </HStack>
          </Box>

          <HStack mt={2} spacing={4} justify="space-between">
            <Text fontSize="xs" color={mutedColor}>
              {conversationId ? `Conversation: ${conversationId.slice(-8)}` : 'Press Enter to send'}
            </Text>

            {currentFilters && (
              <HStack spacing={2}>
                <Text fontSize="xs" color={mutedColor}>
                  Active filters:
                </Text>
                <Badge size="xs" colorScheme="purple">
                  {/* Only count supported and non-empty filters */}
                  {Object.entries(filters || {}).filter(
                    ([key, val]) =>
                      SUPPORTED_FILTER_KEYS.includes(key) &&
                      key !== 'confidence' && key !== 'reasoning' && key !== 'searchType' &&
                      ((Array.isArray(val) && val.length > 0) ||
                        (typeof val === 'number' && val !== null && val !== undefined) ||
                        (typeof val === 'string' && val) ||
                        (typeof val === 'boolean' && val !== null && val !== undefined))
                  ).length} applied
                </Badge>
              </HStack>
            )}
          </HStack>
        </Box>
      </CardBody>
    </Card>
  )
}