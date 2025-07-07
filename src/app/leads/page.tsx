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
  useColorModeValue
} from '@chakra-ui/react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { GradientButton } from '@/components/ui/GradientButton'
import { Search, Filter, Download, Plus } from 'lucide-react'

const sampleLeads: any[] = []

function getStatusColor(status: string) {
  switch (status) {
    case 'new': return 'blue'
    case 'contacted': return 'yellow'
    case 'replied': return 'green'
    case 'interested': return 'purple'
    case 'not-interested': return 'red'
    default: return 'gray'
  }
}

export default function LeadsPage() {
  const cardBg = useColorModeValue('white', 'gray.700')

  return (
    <DashboardLayout>
      <Container maxW="7xl" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Box>
            <HStack justify="space-between" align="center" mb={4}>
              <VStack spacing={1} align="start">
                <Heading size="lg">Leads</Heading>
                <Text color="gray.600">
                  Manage and track all your leads in one place
                </Text>
              </VStack>
              <HStack spacing={3}>
                <GradientButton leftIcon={<Download size={16} />} variant="tertiary">
                  Export
                </GradientButton>
                <GradientButton leftIcon={<Plus size={16} />}>
                  Import Leads
                </GradientButton>
              </HStack>
            </HStack>

            {/* Filters */}
            <HStack spacing={4} mb={6}>
              <InputGroup flex={1} maxW="400px">
                <InputLeftElement>
                  <Search size={16} color="gray" />
                </InputLeftElement>
                <Input placeholder="Search leads..." />
              </InputGroup>
              <Select placeholder="All Statuses" maxW="150px">
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="replied">Replied</option>
                <option value="interested">Interested</option>
              </Select>
              <Select placeholder="All Sources" maxW="150px">
                <option value="linkedin">LinkedIn</option>
                <option value="apollo">Apollo</option>
                <option value="website">Website</option>
                <option value="csv">CSV Upload</option>
              </Select>
            </HStack>
          </Box>

          {/* Leads Table */}
          <Card bg={cardBg}>
            <CardBody>
              {sampleLeads.length === 0 ? (
                <VStack spacing={4} py={12} textAlign="center">
                  <Text fontSize="lg" color="gray.500">
                    No leads found
                  </Text>
                  <Text color="gray.400">
                    Start by importing leads or creating your first campaign
                  </Text>
                  <GradientButton>
                    Import Your First Leads
                  </GradientButton>
                </VStack>
              ) : (
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Lead</Th>
                      <Th>Company</Th>
                      <Th>Status</Th>
                      <Th>Source</Th>
                      <Th>Score</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {sampleLeads.map((lead) => (
                      <Tr key={lead.id}>
                        <Td>
                          <HStack spacing={3}>
                            <Avatar size="sm" name={lead.name} />
                            <VStack spacing={0} align="start">
                              <Text fontWeight="semibold">{lead.name}</Text>
                              <Text fontSize="sm" color="gray.600">{lead.email}</Text>
                              <Text fontSize="xs" color="gray.500">{lead.title}</Text>
                            </VStack>
                          </HStack>
                        </Td>
                        <Td>
                          <Text fontWeight="medium">{lead.company}</Text>
                        </Td>
                        <Td>
                          <Badge colorScheme={getStatusColor(lead.status)}>
                            {lead.status}
                          </Badge>
                        </Td>
                        <Td>
                          <Text fontSize="sm">{lead.source}</Text>
                        </Td>
                        <Td>
                          <Badge colorScheme={lead.score >= 80 ? 'green' : lead.score >= 60 ? 'yellow' : 'red'}>
                            {lead.score}
                          </Badge>
                        </Td>
                        <Td>
                          <GradientButton size="sm" variant="tertiary">
                            View
                          </GradientButton>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              )}
            </CardBody>
          </Card>

          {/* Enterprise Notice */}
          <Card bg="purple.50" border="2px solid" borderColor="purple.200">
            <CardBody textAlign="center" py={12}>
              <VStack spacing={4}>
                <Badge colorScheme="purple" fontSize="sm" px={3} py={1}>
                  ENTERPRISE FEATURE
                </Badge>
                <Heading size="md" color="purple.700">
                  Advanced Lead Management
                </Heading>
                <Text color="purple.600" maxW="md">
                  Unlock advanced lead scoring, custom fields, automated workflows, 
                  and team collaboration features with Enterprise plan.
                </Text>
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