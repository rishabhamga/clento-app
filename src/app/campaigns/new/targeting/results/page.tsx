'use client'

import React, { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Container,
  VStack,
  HStack,
  Box,
  Text,
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Checkbox,
  Avatar,
  Badge,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue,
  useToast,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Heading,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  StatGroup,
  SimpleGrid,
  Spinner,
  Flex,
  Spacer,
  Divider,
  Link,
} from '@chakra-ui/react'
import {
  FiSearch,
  FiDownload,
  FiEye,
  FiMoreVertical,
  FiFilter,
  FiUser,
  FiMail,
  FiPhone,
  FiHome,
  FiMapPin,
  FiExternalLink,
} from 'react-icons/fi'
import { createCustomToast, commonToasts } from '@/lib/utils/custom-toast'

interface Lead {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  title: string
  company: string
  industry: string
  location: string
  employeeCount: number
  revenue: number
  linkedinUrl?: string
  verified: boolean
  source: string
}

// Mock data for development - in production this would come from the search API
const mockLeads: Lead[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Amore Jr',
    email: 'john.amore@gradientcyber.com',
    phone: '+1-555-0123',
    title: 'Regional Sales Director',
    company: 'Gradient Cyber',
    industry: 'Cybersecurity',
    location: 'San Francisco, CA',
    employeeCount: 250,
    revenue: 15,
    linkedinUrl: 'https://linkedin.com/in/johnamore',
    verified: true,
    source: 'ZoomInfo'
  },
  {
    id: '2',
    firstName: 'Molly',
    lastName: 'Marts',
    email: 'molly.marts@wiwa.com',
    phone: '+1-555-0124',
    title: 'Director, Sales Marketing, Us',
    company: 'Wiwa',
    industry: 'Technology',
    location: 'New York, NY',
    employeeCount: 180,
    revenue: 8,
    linkedinUrl: 'https://linkedin.com/in/mollymarts',
    verified: true,
    source: 'Apollo'
  },
  {
    id: '3',
    firstName: 'Matt',
    lastName: 'Karpowitz',
    email: 'matt.k@nextiva.com',
    title: 'Sr. Director Sales Operations',
    company: 'Nextiva',
    industry: 'Communications',
    location: 'Phoenix, AZ',
    employeeCount: 500,
    revenue: 45,
    linkedinUrl: 'https://linkedin.com/in/mattkarpowitz',
    verified: true,
    source: 'ZoomInfo'
  },
  {
    id: '4',
    firstName: 'Zachary',
    lastName: 'Trant',
    email: 'z.trant@checkmarx.com',
    phone: '+1-555-0126',
    title: 'Regional Director, Americas',
    company: 'Checkmarx',
    industry: 'Security Software',
    location: 'Boston, MA',
    employeeCount: 800,
    revenue: 120,
    linkedinUrl: 'https://linkedin.com/in/zacharytrant',
    verified: true,
    source: 'Apollo'
  }
]

function TargetingResultsContent() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('relevance')
  const [filterBy, setFilterBy] = useState('all')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const { isOpen, onOpen, onClose } = useDisclosure()
  const router = useRouter()
  const searchParams = useSearchParams()
  const toast = useToast()
  const customToast = createCustomToast(toast)
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const hoverBg = useColorModeValue('gray.50', 'gray.700')
  const tableHeaderBg = useColorModeValue('gray.50', 'gray.700')

  useEffect(() => {
    // Simulate API call
    const loadLeads = async () => {
      setIsLoading(true)
      // In production, this would be:
      // const response = await fetch('/api/campaigns/search-leads', { ... })
      // const data = await response.json()
      await new Promise(resolve => setTimeout(resolve, 1000))
      setLeads(mockLeads)
      setIsLoading(false)
    }

    loadLeads()
  }, [])

  const handleSelectAll = () => {
    if (selectedLeads.length === leads.length) {
      setSelectedLeads([])
    } else {
      setSelectedLeads(leads.map(lead => lead.id))
    }
  }

  const handleSelectLead = (leadId: string) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    )
  }

  const handleViewLead = (lead: Lead) => {
    setSelectedLead(lead)
    onOpen()
  }

  const handleExportCSV = () => {
    const selectedLeadData = leads.filter(lead => selectedLeads.includes(lead.id))
    
    if (selectedLeadData.length === 0) {
      toast({
        title: 'No leads selected',
        description: 'Please select leads to export',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    // Create CSV content
    const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Title', 'Company', 'Industry', 'Location', 'LinkedIn']
    const csvContent = [
      headers.join(','),
      ...selectedLeadData.map(lead => [
        lead.firstName,
        lead.lastName,
        lead.email,
        lead.phone || '',
        lead.title,
        lead.company,
        lead.industry,
        lead.location,
        lead.linkedinUrl || ''
      ].join(','))
    ].join('\n')

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    customToast.success({
      title: 'Export successful',
      description: `Exported ${selectedLeadData.length} leads`,
    })
  }

  const handleSaveAndCreateCampaign = async () => {
    if (selectedLeads.length === 0) {
      customToast.warning({
        title: 'No leads selected',
        description: 'Please select leads to save',
      })
      return
    }

    setIsSaving(true)

    try {
      const selectedLeadData = leads.filter(lead => selectedLeads.includes(lead.id))
      
      // Save leads to database
      const response = await fetch('/api/leads/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leads: selectedLeadData.map(lead => ({
            firstName: lead.firstName,
            lastName: lead.lastName,
            email: lead.email,
            phone: lead.phone,
            title: lead.title,
            company: lead.company,
            industry: lead.industry,
            location: lead.location,
            linkedin: lead.linkedinUrl,
            source: lead.source,
            verified: lead.verified,
          }))
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save leads')
      }

      const result = await response.json()

      customToast.success({
        title: 'Leads saved successfully',
        description: `Saved ${result.count} leads to your database`,
      })

      // Store selected leads in session storage for the campaign creation
      sessionStorage.setItem('selectedLeads', JSON.stringify(selectedLeadData))
      
      // Navigate to campaign creation
      router.push('/campaigns/new/pitch')

    } catch (error) {
      console.error('Error saving leads:', error)
      customToast.error({
        title: 'Error saving leads',
        description: 'Please try again',
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Filter and sort leads
  const filtered = leads.filter(lead => {
    const matchesSearch = searchTerm === '' || (
      lead.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.title.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const matchesFilter = filterBy === 'all' || (
      filterBy === 'verified' && lead.verified ||
      filterBy === 'unverified' && !lead.verified
    )

    return matchesSearch && matchesFilter
  })

  const sortedLeads = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.firstName.localeCompare(b.firstName)
      case 'company':
        return a.company.localeCompare(b.company)
      case 'title':
        return a.title.localeCompare(b.title)
      default:
        return 0
    }
  })

  if (isLoading) {
    return (
      <Container maxW="7xl" py={8}>
        <VStack spacing={6}>
          <Text>Loading leads...</Text>
        </VStack>
      </Container>
    )
  }

  return (
    <Container maxW="7xl" py={6}>
      <VStack spacing={6} align="stretch">
        {/* Header Stats */}
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
          <Stat>
            <StatLabel>Total Leads</StatLabel>
            <StatNumber>{leads.length.toLocaleString()}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Verified</StatLabel>
            <StatNumber>{leads.filter(l => l.verified).length}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Selected</StatLabel>
            <StatNumber>{selectedLeads.length}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Avg Company Size</StatLabel>
            <StatNumber>{Math.round(leads.reduce((acc, l) => acc + l.employeeCount, 0) / leads.length)}</StatNumber>
          </Stat>
        </SimpleGrid>

        {/* Controls */}
        <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
          <CardBody>
            <HStack spacing={4} wrap="wrap">
              <HStack spacing={2} flex={1} minW="300px">
                <FiSearch />
                <Input
                  placeholder="Search leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  size="sm"
                />
              </HStack>
              
              <Select
                size="sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                maxW="150px"
              >
                <option value="relevance">Relevance</option>
                <option value="name">Name</option>
                <option value="company">Company</option>
                <option value="title">Title</option>
              </Select>

              <Select
                size="sm" 
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                maxW="150px"
              >
                <option value="all">All Leads</option>
                <option value="verified">Verified Only</option>
                <option value="unverified">Unverified</option>
              </Select>

              <Button
                leftIcon={<FiDownload />}
                size="sm"
                variant="secondary"
                onClick={handleExportCSV}
                isDisabled={selectedLeads.length === 0}
              >
                Export CSV
              </Button>
            </HStack>
          </CardBody>
        </Card>

        {/* Results Table */}
        <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
          <CardBody p={0}>
            <Table variant="simple">
              <Thead bg={tableHeaderBg}>
                <Tr>
                  <Th w="50px">
                    <Checkbox
                      isChecked={selectedLeads.length === sortedLeads.length && sortedLeads.length > 0}
                      isIndeterminate={selectedLeads.length > 0 && selectedLeads.length < sortedLeads.length}
                      onChange={handleSelectAll}
                    />
                  </Th>
                  <Th>Contact</Th>
                  <Th>Title & Company</Th>
                  <Th>Location</Th>
                  <Th>Company Size</Th>
                  <Th>Status</Th>
                  <Th w="100px">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {sortedLeads.map((lead) => (
                  <Tr key={lead.id} _hover={{ bg: hoverBg }}>
                    <Td>
                      <Checkbox
                        isChecked={selectedLeads.includes(lead.id)}
                        onChange={() => handleSelectLead(lead.id)}
                      />
                    </Td>
                    <Td>
                      <HStack spacing={3}>
                        <Avatar size="sm" name={`${lead.firstName} ${lead.lastName}`} />
                        <VStack spacing={0} align="start">
                          <Text fontWeight="semibold" fontSize="sm">
                            {lead.firstName} {lead.lastName}
                          </Text>
                          <Text fontSize="xs" color="gray.600">
                            {lead.email}
                          </Text>
                          {lead.phone && (
                            <Text fontSize="xs" color="gray.500">
                              {lead.phone}
                            </Text>
                          )}
                        </VStack>
                      </HStack>
                    </Td>
                    <Td>
                      <VStack spacing={0} align="start">
                        <Text fontSize="sm" fontWeight="medium">
                          {lead.title}
                        </Text>
                        <Text fontSize="xs" color="gray.600">
                          {lead.company}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {lead.industry}
                        </Text>
                      </VStack>
                    </Td>
                    <Td>
                      <Text fontSize="sm">{lead.location}</Text>
                    </Td>
                    <Td>
                      <VStack spacing={0} align="start">
                        <Text fontSize="sm">{lead.employeeCount} employees</Text>
                        <Text fontSize="xs" color="gray.600">
                          ${lead.revenue}M revenue
                        </Text>
                      </VStack>
                    </Td>
                    <Td>
                      <Badge colorScheme={lead.verified ? 'green' : 'yellow'} size="sm">
                        {lead.verified ? 'Verified' : 'Unverified'}
                      </Badge>
                    </Td>
                    <Td>
                      <HStack spacing={1}>
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => handleViewLead(lead)}
                        >
                          View
                        </Button>
                        {lead.linkedinUrl && (
                          <Button
                            as="a"
                            href={lead.linkedinUrl}
                            target="_blank"
                            size="xs"
                            variant="ghost"
                            leftIcon={<FiExternalLink />}
                          >
                            LinkedIn
                          </Button>
                        )}
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardBody>
        </Card>

        {/* Action Buttons */}
        <HStack justify="space-between" align="center">
          <Button
            variant="secondary"
            onClick={() => router.push('/campaigns/new/targeting/b2b-filters')}
          >
            ← Back to Filters
          </Button>

          <HStack spacing={4}>
            <Text fontSize="sm" color="gray.600">
              {selectedLeads.length} of {sortedLeads.length} leads selected
            </Text>
            
            <Button
              size="lg"
              onClick={handleSaveAndCreateCampaign}
              isLoading={isSaving}
              isDisabled={selectedLeads.length === 0}
            >
              Save & Create Campaign ({selectedLeads.length})
            </Button>
          </HStack>
        </HStack>

        {/* Lead Detail Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Lead Details</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {selectedLead && (
                <VStack spacing={4} align="stretch">
                  <HStack spacing={4}>
                    <Avatar 
                      size="lg" 
                      name={`${selectedLead.firstName} ${selectedLead.lastName}`}
                    />
                    <VStack spacing={1} align="start">
                      <Text fontSize="xl" fontWeight="bold">
                        {selectedLead.firstName} {selectedLead.lastName}
                      </Text>
                      <Text color="gray.600">{selectedLead.title}</Text>
                      <Text fontSize="sm" color="gray.500">{selectedLead.company}</Text>
                    </VStack>
                  </HStack>

                  <VStack spacing={3} align="stretch">
                    <HStack justify="space-between">
                      <Text fontWeight="semibold">Email:</Text>
                      <Text>{selectedLead.email}</Text>
                    </HStack>
                    {selectedLead.phone && (
                      <HStack justify="space-between">
                        <Text fontWeight="semibold">Phone:</Text>
                        <Text>{selectedLead.phone}</Text>
                      </HStack>
                    )}
                    <HStack justify="space-between">
                      <Text fontWeight="semibold">Industry:</Text>
                      <Text>{selectedLead.industry}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontWeight="semibold">Location:</Text>
                      <Text>{selectedLead.location}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontWeight="semibold">Company Size:</Text>
                      <Text>{selectedLead.employeeCount} employees</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontWeight="semibold">Revenue:</Text>
                      <Text>${selectedLead.revenue}M</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontWeight="semibold">Source:</Text>
                      <Text>{selectedLead.source}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontWeight="semibold">Verified:</Text>
                      <Badge colorScheme={selectedLead.verified ? 'green' : 'yellow'}>
                        {selectedLead.verified ? 'Verified' : 'Unverified'}
                      </Badge>
                    </HStack>
                  </VStack>
                </VStack>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Close
              </Button>
              {selectedLead?.linkedinUrl && (
                <Button
                  as="a"
                  href={selectedLead.linkedinUrl}
                  target="_blank"
                  colorScheme="blue"
                  leftIcon={<FiExternalLink />}
                >
                  View LinkedIn
                </Button>
              )}
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Container>
  )
}

export default function TargetingResultsPage() {
  return (
    <Suspense fallback={
      <Container maxW="7xl" py={8}>
        <VStack spacing={6}>
          <Text>Loading targeting results...</Text>
        </VStack>
      </Container>
    }>
      <TargetingResultsContent />
    </Suspense>
  )
} 