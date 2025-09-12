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
  Badge,
  useColorModeValue,
  Button,
  Switch,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  Checkbox,
  CheckboxGroup,
  Stack,
  Divider,
  Flex,
  Tag,
  TagLabel,
  TagCloseButton,
  IconButton,
  Tooltip
} from '@chakra-ui/react'
import { 
  Filter, 
  Plus, 
  Search, 
  Calendar,
  Users,
  Target,
  Clock,
  MessageSquare,
  Settings,
  Save,
  RefreshCw
} from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useState } from 'react'

// Mock filter data
const mockFilterData = {
  conversationPurposes: [
    'Discovery Call', 'Product Demo', 'Follow-up Meeting', 'Closing Call', 
    'Support Call', 'Onboarding Session', 'Check-in Call', 'Renewal Discussion'
  ],
  conversationStages: [
    'Prospecting', 'Qualification', 'Needs Analysis', 'Proposal', 
    'Negotiation', 'Closing', 'Won', 'Lost'
  ],
  outcomes: [
    'Qualified Lead', 'Demo Scheduled', 'Proposal Sent', 'Contract Signed',
    'Follow-up Required', 'Not Interested', 'Competitor Chosen', 'Budget Issues'
  ],
  teams: ['Sales Team', 'Customer Success', 'Marketing', 'Support'],
  participants: [
    'Sarah Johnson', 'Mike Chen', 'Alex Rivera', 'Emma Davis', 
    'John Smith', 'Lisa Wong', 'David Brown', 'Maria Garcia'
  ]
}

export default function StageFilters() {
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const cardBg = useColorModeValue('white', 'gray.700')
  
  const [selectedPurposes, setSelectedPurposes] = useState<string[]>(['Discovery Call', 'Product Demo'])
  const [selectedStages, setSelectedStages] = useState<string[]>(['Qualification', 'Needs Analysis'])
  const [selectedOutcomes, setSelectedOutcomes] = useState<string[]>(['Qualified Lead'])
  const [isInternalOnly, setIsInternalOnly] = useState(false)
  const [isExternalOnly, setIsExternalOnly] = useState(false)
  const [dateRange, setDateRange] = useState('30')

  const activeFiltersCount = selectedPurposes.length + selectedStages.length + selectedOutcomes.length + 
    (isInternalOnly ? 1 : 0) + (isExternalOnly ? 1 : 0)

  return (
    <DashboardLayout>
      <VStack spacing={8} align="stretch" w="full">
        {/* Header */}
        <Box>
          <VStack spacing={4} align="start">
            <HStack spacing={3}>
              <Filter size={32} color="#805AD5" />
              <VStack align="start" spacing={0}>
                <Heading size="xl" color="purple.600">
                  Stage-based Filters
                </Heading>
                <Text color="gray.600" fontSize="lg">
                  Filter conversations based on purposes, outcomes, stages and more
                </Text>
              </VStack>
            </HStack>
            
            <HStack spacing={4}>
              <Badge colorScheme="purple" size="lg" px={3} py={1}>
                {activeFiltersCount} Active Filters
              </Badge>
              <Button leftIcon={<Save size={16} />} colorScheme="purple" size="sm">
                Save Filter Set
              </Button>
              <Button leftIcon={<RefreshCw size={16} />} variant="outline" size="sm">
                Reset All
              </Button>
            </HStack>
          </VStack>
        </Box>

        {/* Quick Filter Actions */}
        <Card bg={cardBg} shadow="sm">
          <CardBody p={6}>
            <VStack spacing={4} align="stretch">
              <Heading size="md" color="gray.700">
                Quick Filters
              </Heading>
              
              <SimpleGrid columns={{ base: 2, md: 4, lg: 6 }} spacing={4}>
                <Button 
                  variant="outline" 
                  size="sm" 
                  leftIcon={<Target size={16} />}
                  colorScheme="blue"
                >
                  High-Value Prospects
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  leftIcon={<Clock size={16} />}
                  colorScheme="green"
                >
                  This Week's Calls
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  leftIcon={<Users size={16} />}
                  colorScheme="orange"
                >
                  Team Calls Only
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  leftIcon={<MessageSquare size={16} />}
                  colorScheme="purple"
                >
                  Long Conversations
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  leftIcon={<Calendar size={16} />}
                  colorScheme="red"
                >
                  Overdue Follow-ups
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  leftIcon={<Plus size={16} />}
                  colorScheme="gray"
                >
                  Custom Filter
                </Button>
              </SimpleGrid>
            </VStack>
          </CardBody>
        </Card>

        {/* Filter Configuration */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
          {/* Conversation Properties */}
          <Card bg={cardBg} shadow="sm">
            <CardBody p={6}>
              <VStack spacing={6} align="stretch">
                <Heading size="md" color="gray.700">
                  Conversation Properties
                </Heading>
                
                {/* Date Range */}
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={2} color="gray.700">
                    Date Range
                  </Text>
                  <Select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 90 days</option>
                    <option value="custom">Custom Range</option>
                  </Select>
                </Box>

                {/* Internal/External */}
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={3} color="gray.700">
                    Conversation Type
                  </Text>
                  <VStack spacing={2} align="start">
                    <HStack justify="space-between" w="full">
                      <Text fontSize="sm">Internal Conversations Only</Text>
                      <Switch 
                        isChecked={isInternalOnly} 
                        onChange={(e) => setIsInternalOnly(e.target.checked)}
                        colorScheme="purple"
                      />
                    </HStack>
                    <HStack justify="space-between" w="full">
                      <Text fontSize="sm">External Conversations Only</Text>
                      <Switch 
                        isChecked={isExternalOnly} 
                        onChange={(e) => setIsExternalOnly(e.target.checked)}
                        colorScheme="purple"
                      />
                    </HStack>
                  </VStack>
                </Box>

                {/* Duration Filter */}
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={2} color="gray.700">
                    Duration Filter
                  </Text>
                  <HStack spacing={2}>
                    <Input placeholder="Min (minutes)" size="sm" type="number" />
                    <Text fontSize="sm" color="gray.500">to</Text>
                    <Input placeholder="Max (minutes)" size="sm" type="number" />
                  </HStack>
                </Box>

                {/* Participant Count */}
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={2} color="gray.700">
                    Participant Count
                  </Text>
                  <Select placeholder="Any number of participants">
                    <option value="2">2 participants</option>
                    <option value="3-5">3-5 participants</option>
                    <option value="6+">6+ participants</option>
                  </Select>
                </Box>
              </VStack>
            </CardBody>
          </Card>

          {/* Team & Participants */}
          <Card bg={cardBg} shadow="sm">
            <CardBody p={6}>
              <VStack spacing={6} align="stretch">
                <Heading size="md" color="gray.700">
                  Team & Participants
                </Heading>
                
                {/* Team Filter */}
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={3} color="gray.700">
                    Teams
                  </Text>
                  <CheckboxGroup>
                    <Stack spacing={2}>
                      {mockFilterData.teams.map((team) => (
                        <Checkbox key={team} size="sm" colorScheme="purple">
                          {team}
                        </Checkbox>
                      ))}
                    </Stack>
                  </CheckboxGroup>
                </Box>

                {/* Participant Search */}
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={2} color="gray.700">
                    Specific Participants
                  </Text>
                  <InputGroup size="sm">
                    <InputLeftElement>
                      <Search size={16} />
                    </InputLeftElement>
                    <Input placeholder="Search participants..." />
                  </InputGroup>
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Type to search and select specific team members
                  </Text>
                </Box>

                {/* Role Filter */}
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={3} color="gray.700">
                    Participant Roles
                  </Text>
                  <CheckboxGroup>
                    <Stack spacing={2}>
                      <Checkbox size="sm" colorScheme="purple">Sales Rep</Checkbox>
                      <Checkbox size="sm" colorScheme="purple">Sales Manager</Checkbox>
                      <Checkbox size="sm" colorScheme="purple">Customer Success</Checkbox>
                      <Checkbox size="sm" colorScheme="purple">Technical Expert</Checkbox>
                      <Checkbox size="sm" colorScheme="purple">Executive</Checkbox>
                    </Stack>
                  </CheckboxGroup>
                </Box>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Business Context Filters */}
        <Card bg={cardBg} shadow="sm">
          <CardBody p={6}>
            <VStack spacing={6} align="stretch">
              <Heading size="md" color="gray.700">
                Business Context Filters
              </Heading>
              
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
                {/* Conversation Purposes */}
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={3} color="gray.700">
                    Conversation Purposes
                  </Text>
                  <VStack spacing={2} align="stretch" maxH="200px" overflowY="auto">
                    {mockFilterData.conversationPurposes.map((purpose) => (
                      <Checkbox 
                        key={purpose} 
                        size="sm" 
                        colorScheme="purple"
                        isChecked={selectedPurposes.includes(purpose)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPurposes([...selectedPurposes, purpose])
                          } else {
                            setSelectedPurposes(selectedPurposes.filter(p => p !== purpose))
                          }
                        }}
                      >
                        {purpose}
                      </Checkbox>
                    ))}
                  </VStack>
                </Box>

                {/* Conversation Stages */}
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={3} color="gray.700">
                    Conversation Stages
                  </Text>
                  <VStack spacing={2} align="stretch" maxH="200px" overflowY="auto">
                    {mockFilterData.conversationStages.map((stage) => (
                      <Checkbox 
                        key={stage} 
                        size="sm" 
                        colorScheme="purple"
                        isChecked={selectedStages.includes(stage)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStages([...selectedStages, stage])
                          } else {
                            setSelectedStages(selectedStages.filter(s => s !== stage))
                          }
                        }}
                      >
                        {stage}
                      </Checkbox>
                    ))}
                  </VStack>
                </Box>

                {/* Outcomes */}
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={3} color="gray.700">
                    Conversation Outcomes
                  </Text>
                  <VStack spacing={2} align="stretch" maxH="200px" overflowY="auto">
                    {mockFilterData.outcomes.map((outcome) => (
                      <Checkbox 
                        key={outcome} 
                        size="sm" 
                        colorScheme="purple"
                        isChecked={selectedOutcomes.includes(outcome)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedOutcomes([...selectedOutcomes, outcome])
                          } else {
                            setSelectedOutcomes(selectedOutcomes.filter(o => o !== outcome))
                          }
                        }}
                      >
                        {outcome}
                      </Checkbox>
                    ))}
                  </VStack>
                </Box>
              </SimpleGrid>
            </VStack>
          </CardBody>
        </Card>

        {/* Active Filters Summary */}
        <Card bg="purple.50" borderColor="purple.200" borderWidth="1px">
          <CardBody p={6}>
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between">
                <Heading size="md" color="purple.700">
                  Active Filters Summary
                </Heading>
                <Button size="sm" variant="outline" colorScheme="purple">
                  Apply Filters
                </Button>
              </HStack>
              
              <Flex wrap="wrap" gap={2}>
                {selectedPurposes.map((purpose) => (
                  <Tag key={purpose} size="sm" colorScheme="blue" borderRadius="full">
                    <TagLabel>{purpose}</TagLabel>
                    <TagCloseButton 
                      onClick={() => setSelectedPurposes(selectedPurposes.filter(p => p !== purpose))}
                    />
                  </Tag>
                ))}
                {selectedStages.map((stage) => (
                  <Tag key={stage} size="sm" colorScheme="green" borderRadius="full">
                    <TagLabel>{stage}</TagLabel>
                    <TagCloseButton 
                      onClick={() => setSelectedStages(selectedStages.filter(s => s !== stage))}
                    />
                  </Tag>
                ))}
                {selectedOutcomes.map((outcome) => (
                  <Tag key={outcome} size="sm" colorScheme="orange" borderRadius="full">
                    <TagLabel>{outcome}</TagLabel>
                    <TagCloseButton 
                      onClick={() => setSelectedOutcomes(selectedOutcomes.filter(o => o !== outcome))}
                    />
                  </Tag>
                ))}
                {isInternalOnly && (
                  <Tag size="sm" colorScheme="purple" borderRadius="full">
                    <TagLabel>Internal Only</TagLabel>
                    <TagCloseButton onClick={() => setIsInternalOnly(false)} />
                  </Tag>
                )}
                {isExternalOnly && (
                  <Tag size="sm" colorScheme="purple" borderRadius="full">
                    <TagLabel>External Only</TagLabel>
                    <TagCloseButton onClick={() => setIsExternalOnly(false)} />
                  </Tag>
                )}
              </Flex>
              
              {activeFiltersCount === 0 && (
                <Text fontSize="sm" color="gray.600" fontStyle="italic">
                  No filters applied. All conversations will be shown.
                </Text>
              )}
            </VStack>
          </CardBody>
        </Card>

        {/* Filter Results Preview */}
        <Card bg={cardBg} shadow="sm">
          <CardBody p={6}>
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between">
                <Heading size="md" color="gray.700">
                  Filter Results Preview
                </Heading>
                <Badge colorScheme="green" size="lg" px={3} py={1}>
                  847 Conversations Match
                </Badge>
              </HStack>
              
              <Text fontSize="sm" color="gray.600">
                Based on your current filter settings, 847 conversations match your criteria out of 1,247 total conversations. 
                This represents 67.9% of all conversations in the selected time period.
              </Text>
              
              <HStack spacing={6}>
                <Button colorScheme="purple" leftIcon={<Search size={16} />}>
                  View Filtered Results
                </Button>
                <Button variant="outline" leftIcon={<Settings size={16} />}>
                  Advanced Settings
                </Button>
              </HStack>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </DashboardLayout>
  )
}
