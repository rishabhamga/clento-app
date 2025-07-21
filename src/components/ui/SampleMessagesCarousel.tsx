'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  Box,
  HStack,
  VStack,
  Text,
  IconButton,
  Flex,
  Badge,
  useColorModeValue,
  Heading,
  Card,
  CardBody,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  SimpleGrid,
} from '@chakra-ui/react'
import { 
  FiChevronLeft, 
  FiChevronRight, 
  FiLinkedin, 
  FiMail,
  FiRefreshCw,
  FiEye
} from 'react-icons/fi'
import { keyframes } from '@emotion/react'
import { LinkedInMessageFrame } from './LinkedInMessageFrame'
import { EmailMessageFrame } from './EmailMessageFrame'

// Animation for carousel
const slideIn = keyframes`
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`

const slideOut = keyframes`
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(-100%); opacity: 0; }
`

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-4px); }
`

interface SampleMessage {
  id: string
  type: 'linkedin' | 'email'
  senderName: string
  senderRole?: string
  senderCompany?: string
  senderEmail?: string
  senderImage?: string
  subject?: string
  message: string
  timestamp: string
  isRead?: boolean
  isStarred?: boolean
  hasAttachment?: boolean
  isImportant?: boolean
}

interface SampleMessagesCarouselProps {
  linkedinMessages?: SampleMessage[]
  emailMessages?: SampleMessage[]
  isLoading?: boolean
  onRegenerateMessages?: () => void
}

// Sample data for demonstration
const defaultLinkedInMessages: SampleMessage[] = [
  {
    id: 'li-1',
    type: 'linkedin',
    senderName: 'Sarah Chen',
    senderRole: 'VP of Sales',
    senderCompany: 'TechFlow Solutions',
    senderImage: 'https://images.unsplash.com/photo-1494790108755-2616b4b0a02b?w=150',
    message: `Hi [Prospect Name],

I noticed your recent post about scaling your sales operations - the challenges you mentioned around lead qualification really resonated with our experience at TechFlow.

We've helped companies like yours:
• Increase qualified leads by 340% in 90 days
• Reduce sales cycle time by 45%
• Achieve 85%+ demo conversion rates

Would love to share how we helped a similar [Industry] company overcome the exact challenges you mentioned. Open to a quick chat this week?

Best,
Sarah`,
    timestamp: '2 hours ago',
    isRead: false,
  },
  {
    id: 'li-2',
    type: 'linkedin',
    senderName: 'Marcus Rodriguez',
    senderRole: 'Head of Growth',
    senderCompany: 'ScaleUp Inc',
    senderImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    message: `Hey [Prospect Name],

Congrats on the recent funding round! 🎉 Saw the announcement on TechCrunch.

With your expansion plans, I imagine lead generation is becoming even more critical. We've helped other Series B companies in [Industry] scale their pipeline 3x while maintaining quality.

Quick question: What's your biggest challenge with lead gen right now? 

Happy to share some insights that might help.

Cheers,
Marcus`,
    timestamp: '4 hours ago',
    isRead: true,
  },
  {
    id: 'li-3',
    type: 'linkedin',
    senderName: 'Elena Vasquez',
    senderRole: 'Director of Business Development',
    senderCompany: 'Growth Partners',
    message: `Hi [Prospect Name],

Your insight on [Recent Post Topic] was spot-on! The point about [Specific Detail] really highlights why traditional lead gen approaches aren't working anymore.

We're seeing similar challenges across [Industry] - companies are struggling with:
• Low response rates (< 2%)
• Poor lead quality
• Manual processes that don't scale

We've developed an AI-powered approach that's helping companies like [Similar Company] achieve 15%+ response rates with higher-quality conversations.

Would you be interested in a brief case study?

Best regards,
Elena`,
    timestamp: '1 day ago',
    isRead: true,
  }
]

const defaultEmailMessages: SampleMessage[] = [
  {
    id: 'em-1',
    type: 'email',
    senderName: 'David Kim',
    senderEmail: 'david.kim@growthlabs.com',
    senderImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    subject: 'Quick question about [Company] lead generation',
    message: `Hi [Prospect Name],

I came across [Company]'s recent [Achievement/News] and was impressed by your growth trajectory.

Given your expansion into [Market/Geography], I imagine generating qualified leads at scale is becoming increasingly important. 

We've helped similar [Industry] companies like [Similar Company 1] and [Similar Company 2] achieve:

• 340% increase in qualified leads within 90 days
• 67% reduction in cost per lead  
• 85%+ demo booking conversion rates

I'd love to share a brief case study showing exactly how we helped [Similar Company] overcome similar challenges.

Would you be open to a 15-minute conversation this week?

Best regards,
David Kim`,
    timestamp: '3 hours ago',
    isRead: false,
    isImportant: true,
  },
  {
    id: 'em-2',
    type: 'email',
    senderName: 'Jessica Thompson',
    senderEmail: 'jessica@scalepartners.io',
    subject: 'Following up on your lead generation challenges',
    message: `Hi [Prospect Name],

Hope you're doing well! I saw your recent LinkedIn post about the challenges of scaling lead generation while maintaining quality.

This resonates strongly with what we're seeing across the [Industry] sector. Companies are hitting walls around the 50-100 lead/month mark because:

1. Manual processes become bottlenecks
2. Lead quality drops as volume increases  
3. Sales teams get overwhelmed with unqualified prospects

We've developed a solution that maintains quality while 10x-ing volume. Our [Industry] clients typically see:

→ 5x more qualified conversations
→ 40% shorter sales cycles
→ 25% higher close rates

I'd love to show you a quick demo of how this could work for [Company]. Are you available for a brief call this week?

Best,
Jessica`,
    timestamp: '6 hours ago',
    isRead: true,
    hasAttachment: true,
  },
  {
    id: 'em-3',
    type: 'email',
    senderName: 'Alex Chen',
    senderEmail: 'alex.chen@revopsolutions.com',
    subject: 'How [Similar Company] scaled to 500 qualified leads/month',
    message: `Hi [Prospect Name],

I noticed you've been posting about lead generation challenges, particularly around scaling quality pipeline.

Thought you might find this interesting: We recently helped [Similar Company], a [Industry] company of similar size to [Company], scale from 50 to 500+ qualified leads per month while actually improving lead quality scores.

The key was implementing an AI-powered lead qualification system that:

• Analyzes 50+ data points per prospect
• Personalizes outreach at scale  
• Identifies buying intent signals
• Automates follow-up sequences

The results were pretty impressive:
→ 340% increase in qualified leads
→ 45% improvement in demo show rates
→ 67% reduction in cost per qualified lead

Would you be interested in seeing how this approach could work for [Company]? I can share the full case study and show you the platform in action.

Happy to jump on a quick 15-minute call this week if you're interested.

Best regards,
Alex Chen`,
    timestamp: '1 day ago',
    isRead: true,
    isStarred: true,
  }
]

export const SampleMessagesCarousel: React.FC<SampleMessagesCarouselProps> = ({
  linkedinMessages = defaultLinkedInMessages,
  emailMessages = defaultEmailMessages,
  isLoading = false,
  onRegenerateMessages,
}) => {
  console.log('🎨 [CAROUSEL] SampleMessagesCarousel rendered with:', {
    linkedinCount: linkedinMessages?.length || 0,
    emailCount: emailMessages?.length || 0,
    isLoading,
    usingDefaults: linkedinMessages === defaultLinkedInMessages && emailMessages === defaultEmailMessages,
    linkedinSample: linkedinMessages?.[0]?.message?.substring(0, 100),
    emailSample: emailMessages?.[0]?.message?.substring(0, 100),
    hasOnRegenerateMessages: !!onRegenerateMessages
  })

  const [activeTab, setActiveTab] = useState(0)
  const [currentLinkedInIndex, setCurrentLinkedInIndex] = useState(0)
  const [currentEmailIndex, setCurrentEmailIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Log when messages change
  React.useEffect(() => {
    console.log('📝 [CAROUSEL] Messages updated:', {
      linkedinMessages: linkedinMessages?.length || 0,
      emailMessages: emailMessages?.length || 0,
      linkedinStructure: linkedinMessages?.[0] ? Object.keys(linkedinMessages[0]) : [],
      emailStructure: emailMessages?.[0] ? Object.keys(emailMessages[0]) : []
    })
  }, [linkedinMessages, emailMessages])

  // Color mode values
  const cardBg = useColorModeValue('rgba(255, 255, 255, 0.9)', 'rgba(26, 32, 44, 0.9)')
  const glassBg = useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(26, 32, 44, 0.8)')
  const borderColor = useColorModeValue('rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)')
  const accentGradient = useColorModeValue(
    'linear-gradient(45deg, #667eea, #764ba2)',
    'linear-gradient(45deg, #5b21b6, #7c3aed)'
  )

  const handleNext = (type: 'linkedin' | 'email') => {
    setIsTransitioning(true)
    setTimeout(() => {
      if (type === 'linkedin') {
        setCurrentLinkedInIndex((prev) => 
          prev < linkedinMessages.length - 1 ? prev + 1 : 0
        )
      } else {
        setCurrentEmailIndex((prev) => 
          prev < emailMessages.length - 1 ? prev + 1 : 0
        )
      }
      setIsTransitioning(false)
    }, 150)
  }

  const handlePrevious = (type: 'linkedin' | 'email') => {
    setIsTransitioning(true)
    setTimeout(() => {
      if (type === 'linkedin') {
        setCurrentLinkedInIndex((prev) => 
          prev > 0 ? prev - 1 : linkedinMessages.length - 1
        )
      } else {
        setCurrentEmailIndex((prev) => 
          prev > 0 ? prev - 1 : emailMessages.length - 1
        )
      }
      setIsTransitioning(false)
    }, 150)
  }

  const currentLinkedInMessage = linkedinMessages[currentLinkedInIndex]
  const currentEmailMessage = emailMessages[currentEmailIndex]

  return (
    <Card 
      bg={cardBg}
      backdropFilter="blur(10px)"
      border="1px solid"
      borderColor={borderColor}
      shadow="xl"
      borderRadius="2xl"
      overflow="hidden"
      w="full"
      maxW="6xl"
    >
      <CardBody p={8}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <VStack spacing={4} textAlign="center">
            <Heading 
              size="lg" 
              bgGradient={accentGradient} 
              bgClip="text"
              animation={`${float} 3s ease-in-out infinite`}
            >
              🎯 Sample Outreach Messages
            </Heading>
            <Text color="gray.600" maxW="2xl">
              See how our AI crafts hyper-personalized LinkedIn messages and emails 
              tailored to your ideal customers. Each message includes real personalization 
              elements and compelling value propositions.
            </Text>
            
            {onRegenerateMessages && (
              <Button
                size="sm"
                variant="ghost"
                leftIcon={<FiRefreshCw />}
                onClick={onRegenerateMessages}
                isLoading={isLoading}
                loadingText="Generating..."
                colorScheme="purple"
              >
                Generate New Messages
              </Button>
            )}
          </VStack>

          {/* Message Type Tabs */}
          <Tabs 
            index={activeTab} 
            onChange={setActiveTab}
            variant="enclosed"
            colorScheme="purple"
          >
            <TabList justifyContent="center" border="none">
              <Tab 
                px={6} 
                py={3} 
                fontWeight="600"
                _selected={{ 
                  color: 'white',
                  bg: 'linear-gradient(45deg, #667eea, #764ba2)',
                  borderColor: 'transparent'
                }}
              >
                <HStack spacing={2}>
                  <FiLinkedin />
                  <Text>LinkedIn Messages</Text>
                  <Badge colorScheme="blue" size="sm">
                    {linkedinMessages.length}
                  </Badge>
                </HStack>
              </Tab>
              <Tab 
                px={6} 
                py={3} 
                fontWeight="600"
                _selected={{ 
                  color: 'white',
                  bg: 'linear-gradient(45deg, #667eea, #764ba2)',
                  borderColor: 'transparent'
                }}
              >
                <HStack spacing={2}>
                  <FiMail />
                  <Text>Email Messages</Text>
                  <Badge colorScheme="green" size="sm">
                    {emailMessages.length}
                  </Badge>
                </HStack>
              </Tab>
            </TabList>

            <TabPanels>
              {/* LinkedIn Messages */}
              <TabPanel px={0} py={6}>
                <VStack spacing={6}>
                  {/* Navigation */}
                  <HStack spacing={4} justify="center" w="full">
                    <IconButton
                      aria-label="Previous LinkedIn message"
                      icon={<FiChevronLeft />}
                      onClick={() => handlePrevious('linkedin')}
                      size="lg"
                      variant="ghost"
                      colorScheme="purple"
                      borderRadius="full"
                      isDisabled={isTransitioning}
                    />
                    
                    <VStack spacing={1}>
                      <Text fontSize="sm" fontWeight="600" color="gray.700">
                        LinkedIn Message
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {currentLinkedInIndex + 1} of {linkedinMessages.length}
                      </Text>
                    </VStack>
                    
                    <IconButton
                      aria-label="Next LinkedIn message"
                      icon={<FiChevronRight />}
                      onClick={() => handleNext('linkedin')}
                      size="lg"
                      variant="ghost"
                      colorScheme="purple"
                      borderRadius="full"
                      isDisabled={isTransitioning}
                    />
                  </HStack>

                  {/* Message Display */}
                  <Flex justify="center" w="full">
                    <Box
                      animation={isTransitioning ? `${slideOut} 0.15s ease-out` : `${slideIn} 0.3s ease-out`}
                      transition="all 0.2s"
                    >
                      {currentLinkedInMessage && (
                        <LinkedInMessageFrame
                          senderName={currentLinkedInMessage.senderName}
                          senderRole={currentLinkedInMessage.senderRole || ''}
                          senderCompany={currentLinkedInMessage.senderCompany || ''}
                          senderImage={currentLinkedInMessage.senderImage}
                          message={currentLinkedInMessage.message}
                          timestamp={currentLinkedInMessage.timestamp}
                          isRead={currentLinkedInMessage.isRead}
                          variant="sent"
                        />
                      )}
                    </Box>
                  </Flex>

                  {/* Dots indicator */}
                  <HStack spacing={2}>
                    {linkedinMessages.map((_, index) => (
                      <Box
                        key={index}
                        w={2}
                        h={2}
                        borderRadius="full"
                        bg={index === currentLinkedInIndex ? 'purple.500' : 'gray.300'}
                        cursor="pointer"
                        onClick={() => setCurrentLinkedInIndex(index)}
                        transition="all 0.2s"
                        _hover={{ transform: 'scale(1.2)' }}
                      />
                    ))}
                  </HStack>
                </VStack>
              </TabPanel>

              {/* Email Messages */}
              <TabPanel px={0} py={6}>
                <VStack spacing={6}>
                  {/* Navigation */}
                  <HStack spacing={4} justify="center" w="full">
                    <IconButton
                      aria-label="Previous email message"
                      icon={<FiChevronLeft />}
                      onClick={() => handlePrevious('email')}
                      size="lg"
                      variant="ghost"
                      colorScheme="purple"
                      borderRadius="full"
                      isDisabled={isTransitioning}
                    />
                    
                    <VStack spacing={1}>
                      <Text fontSize="sm" fontWeight="600" color="gray.700">
                        Email Message
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {currentEmailIndex + 1} of {emailMessages.length}
                      </Text>
                    </VStack>
                    
                    <IconButton
                      aria-label="Next email message"
                      icon={<FiChevronRight />}
                      onClick={() => handleNext('email')}
                      size="lg"
                      variant="ghost"
                      colorScheme="purple"
                      borderRadius="full"
                      isDisabled={isTransitioning}
                    />
                  </HStack>

                  {/* Message Display */}
                  <Flex justify="center" w="full">
                    <Box
                      animation={isTransitioning ? `${slideOut} 0.15s ease-out` : `${slideIn} 0.3s ease-out`}
                      transition="all 0.2s"
                    >
                      {currentEmailMessage && (
                        <EmailMessageFrame
                          senderName={currentEmailMessage.senderName}
                          senderEmail={currentEmailMessage.senderEmail || ''}
                          senderAvatar={currentEmailMessage.senderImage}
                          subject={currentEmailMessage.subject || ''}
                          message={currentEmailMessage.message}
                          timestamp={currentEmailMessage.timestamp}
                          isRead={currentEmailMessage.isRead}
                          isStarred={currentEmailMessage.isStarred}
                          hasAttachment={currentEmailMessage.hasAttachment}
                          isImportant={currentEmailMessage.isImportant}
                        />
                      )}
                    </Box>
                  </Flex>

                  {/* Dots indicator */}
                  <HStack spacing={2}>
                    {emailMessages.map((_, index) => (
                      <Box
                        key={index}
                        w={2}
                        h={2}
                        borderRadius="full"
                        bg={index === currentEmailIndex ? 'purple.500' : 'gray.300'}
                        cursor="pointer"
                        onClick={() => setCurrentEmailIndex(index)}
                        transition="all 0.2s"
                        _hover={{ transform: 'scale(1.2)' }}
                      />
                    ))}
                  </HStack>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>

          {/* Footer */}
          <Box 
            bg={glassBg} 
            p={4} 
            borderRadius="xl" 
            border="1px solid" 
            borderColor={borderColor}
            textAlign="center"
          >
            <Text fontSize="sm" color="gray.600">
              💡 <strong>Pro Tip:</strong> These messages are automatically generated based on your 
              website analysis, target personas, and competitive advantages. Each message includes 
              realistic personalization that would come from prospect research.
            </Text>
          </Box>
        </VStack>
      </CardBody>
    </Card>
  )
} 