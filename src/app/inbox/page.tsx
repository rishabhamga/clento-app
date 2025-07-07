'use client'

import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Card,
  CardBody,
  HStack,
  Avatar,
  Badge,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Divider,
  useColorModeValue
} from '@chakra-ui/react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { GradientButton } from '@/components/ui/GradientButton'
import { Search, Mail, Reply, Archive, Trash2 } from 'lucide-react'

const sampleMessages = [
  {
    id: '1',
    from: 'Sarah Johnson',
    email: 'sarah.johnson@techcorp.com',
    subject: 'Re: Partnership Opportunity',
    preview: 'Thanks for reaching out! I\'d love to learn more about your solution...',
    timestamp: '2 hours ago',
    status: 'unread',
    type: 'reply'
  },
  {
    id: '2',
    from: 'Michael Chen',
    email: 'michael.chen@innovate.io',
    subject: 'Interested in your product',
    preview: 'Hi, I saw your LinkedIn message and I\'m very interested in scheduling a demo...',
    timestamp: '4 hours ago',
    status: 'unread',
    type: 'reply'
  },
  {
    id: '3',
    from: 'Emily Rodriguez',
    email: 'emily.r@startup.com',
    subject: 'Out of office',
    preview: 'Thank you for your email. I am currently out of office until...',
    timestamp: '1 day ago',
    status: 'read',
    type: 'auto-reply'
  },
  {
    id: '4',
    from: 'David Kim',
    email: 'david@enterprise.com',
    subject: 'Re: Enterprise Solutions Demo',
    preview: 'Not interested at this time, but please check back in Q2...',
    timestamp: '2 days ago',
    status: 'read',
    type: 'not-interested'
  }
]

function getStatusColor(type: string) {
  switch (type) {
    case 'reply': return 'green'
    case 'auto-reply': return 'blue'
    case 'not-interested': return 'red'
    case 'bounce': return 'orange'
    default: return 'gray'
  }
}

export default function InboxPage() {
  const cardBg = useColorModeValue('white', 'gray.700')

  return (
    <DashboardLayout>
      <Container maxW="7xl" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Box>
            <HStack justify="space-between" align="center" mb={4}>
              <VStack spacing={1} align="start">
                <Heading size="lg">Inbox</Heading>
                <Text color="gray.600">
                  Manage replies and responses to your outreach campaigns
                </Text>
              </VStack>
              <HStack spacing={3}>
                <GradientButton leftIcon={<Archive size={16} />} variant="tertiary">
                  Archive All
                </GradientButton>
                <GradientButton leftIcon={<Reply size={16} />}>
                  Bulk Reply
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
              <Select placeholder="All Types" maxW="150px">
                <option value="reply">Replies</option>
                <option value="auto-reply">Auto Replies</option>
                <option value="not-interested">Not Interested</option>
                <option value="bounce">Bounces</option>
              </Select>
              <Select placeholder="All Status" maxW="150px">
                <option value="unread">Unread</option>
                <option value="read">Read</option>
                <option value="archived">Archived</option>
              </Select>
            </HStack>
          </Box>

          {/* Enterprise Notice */}
          <Card bg="purple.50" border="2px solid" borderColor="purple.200">
            <CardBody textAlign="center" py={12}>
              <VStack spacing={4}>
                <Mail size={48} color="purple" />
                <Badge colorScheme="purple" fontSize="sm" px={3} py={1}>
                  ENTERPRISE FEATURE
                </Badge>
                <Heading size="md" color="purple.700">
                  Unified Inbox Management
                </Heading>
                <Text color="purple.600" maxW="md">
                  Centralize all your prospect replies, auto-categorize responses, 
                  and use AI-powered reply suggestions to maintain conversations at scale.
                </Text>
                <VStack spacing={2} align="center">
                  <Text fontSize="sm" color="purple.600" fontWeight="semibold">
                    Features include:
                  </Text>
                  <HStack spacing={6} fontSize="sm" color="purple.600">
                    <Text>• Auto-categorization</Text>
                    <Text>• AI reply suggestions</Text>
                    <Text>• Sentiment analysis</Text>
                    <Text>• Team collaboration</Text>
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