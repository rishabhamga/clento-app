'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Card,
  CardHeader,
  CardBody,
  SimpleGrid,
  Progress,
  Badge,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  Alert,
  AlertIcon,
  useColorModeValue,
  useToast,
  Avatar,
  Image,
  Link,
  Collapse,
  useDisclosure,
  Divider,
  Wrap,
  WrapItem,
  Tooltip,
  Stack,
  Button,
  useClipboard
} from '@chakra-ui/react'
import { ChevronDownIcon, MoreHorizontal, RefreshCw, ExternalLink, Mail, Phone, MapPin, Building, Calendar, ChevronDown, ChevronUp, Linkedin, Twitter, Facebook, Github, Globe, Briefcase, Award, Target, Copy, Check } from 'lucide-react'
import { FiActivity, FiBarChart2, FiCalendar, FiClock, FiMail, FiPause, FiPlay, FiSettings, FiUserCheck } from 'react-icons/fi'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { GradientButton } from '@/components/ui/GradientButton'
import SearchResults from '@/components/results/SearchResults'
import { ApolloSearchProvider, useApolloSearch } from '@/hooks/useApolloSearch'
import { format } from 'date-fns'

interface CampaignProgress {
  totalLeads: number
  completionPercentage: number
  responseRate: number
  leadsByStatus: Record<string, number>
  stepsByStatus: Record<string, number>
  messageStats: Record<string, number>
  startDate: string
  lastActivity: string
  recentActivity: any[]
}

interface Campaign {
  id: string
  name: string
  description?: string
  status: 'active' | 'paused' | 'completed' | 'draft'
  created_at: string
  updated_at: string
  settings?: any
}

function getCampaignStatusColor(status: string) {
  switch (status) {
    case 'active':
      return 'green'
    case 'paused':
      return 'yellow'
    case 'completed':
      return 'blue'
    case 'draft':
      return 'gray'
    default:
      return 'gray'
  }
}

function getSeniorityColor(seniority: string) {
  switch (seniority.toLowerCase()) {
    case 'entry':
      return 'green'
    case 'senior':
      return 'blue'
    case 'manager':
      return 'purple'
    case 'director':
      return 'orange'
    case 'vp':
    case 'executive':
      return 'red'
    default:
      return 'gray'
  }
}

function formatGrowthPercentage(growth?: number) {
  if (!growth) return null
  const percentage = Math.round(growth * 100)
  return percentage > 0 ? `+${percentage}%` : `${percentage}%`
}

function CampaignDetailInner() {
  const params = useParams()
  const router = useRouter()
  const toast = useToast()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [progress, setProgress] = useState<CampaignProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [selectedLeads, setSelectedLeads] = useState<any[]>([])
  const [loadingLeads, setLoadingLeads] = useState(false)
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([])

  const bgColor = useColorModeValue('gray.50', 'gray.900')
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  // Get Apollo search context to populate with leads
  const { setSearchResults } = useApolloSearch()

  useEffect(() => {
    const fetchCampaignData = async () => {
      setLoading(true)
      try {
        // Fetch campaign progress
        const response = await fetch(`/api/campaigns/progress?campaignId=${params.id}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch campaign data')
        }
        
        const data = await response.json()
        setCampaign(data.campaign)
        setProgress(data.progress)
      } catch (err) {
        console.error('Error fetching campaign:', err)
        setError('Unable to load campaign data. Please try refreshing the page.')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchCampaignData()
    }
  }, [params.id])

  useEffect(() => {
    const fetchCampaignLeads = async () => {
      if (!params.id) return

      setLoadingLeads(true)
      try {
        const response = await fetch(`/api/leads?campaignId=${params.id}&limit=10`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch campaign leads')
        }
        
        const data = await response.json()
        
        // Transform the leads data to match SearchResults component format
        const transformedLeads = (data.leads || []).map((leadData: any) => {
          const lead = leadData.leads || leadData;
          
          // Parse enrichment data if available
          const enrichmentData = lead.enrichment_data ? JSON.parse(lead.enrichment_data) : {};
          
          return {
            // Basic identification
            id: lead.id || `lead-${Math.random()}`,
            external_id: lead.external_id || '',
            
            // Name fields
            first_name: lead.first_name || enrichmentData.first_name || '',
            last_name: lead.last_name || enrichmentData.last_name || '',
            full_name: lead.full_name || lead.name || `${lead.first_name || enrichmentData.first_name || ''} ${lead.last_name || enrichmentData.last_name || ''}`.trim() || 'Unknown Name',
            
            // Contact information
            email: lead.email || '',
            email_status: lead.email_status || enrichmentData.email_status || 'unknown',
            phone: lead.phone || enrichmentData.phone_numbers?.[0] || '',
            linkedin_url: lead.linkedin_url || enrichmentData.linkedin_url || '',
            
            // Professional details
            title: lead.title || enrichmentData.job_title || '',
            company: lead.company || enrichmentData.job_company_name || '',
            headline: enrichmentData.headline || `${lead.title || enrichmentData.job_title || ''} at ${lead.company || enrichmentData.job_company_name || ''}`,
            seniority: enrichmentData.job_seniority || enrichmentData.seniority || 'unknown',
            departments: enrichmentData.departments || [],
            subdepartments: enrichmentData.subdepartments || [],
            
            // Location
            location: lead.location || enrichmentData.location_name || '',
            country: enrichmentData.location_country || '',
            state: enrichmentData.location_region || '',
            city: enrichmentData.location_locality || '',
            
            // Experience and skills
            experience_level: enrichmentData.work_experience?.length || 0,
            skills: enrichmentData.skills || [],
            technologies: enrichmentData.technologies || [],
            
            // Additional details
            photo_url: enrichmentData.photo_url || null,
            summary: enrichmentData.summary || '',
            interests: enrichmentData.interests || [],
            
            // Company details
            company_size: enrichmentData.job_company_size || null,
            company_industry: enrichmentData.job_company_industry || '',
            company_revenue: enrichmentData.job_company_revenue || null,
            company_founded: enrichmentData.job_company_founded || null,
            
            // Data quality
            confidence: lead.confidence || enrichmentData.pdl_id ? 0.9 : 0.6,
            last_updated: lead.last_updated || lead.updated_at || new Date().toISOString(),
            data_source: lead.source || 'database',
            
            // Campaign status
            campaign_status: leadData.campaign_status || leadData.status || 'unknown',
            
            // Keep all original data for backward compatibility
            ...lead,
            ...enrichmentData
          }
        })
        
        setSelectedLeads(transformedLeads)
        
        // Also populate the Apollo search context with the leads
        setSearchResults(transformedLeads)
      } catch (err) {
        console.error('Error fetching leads:', err)
      } finally {
        setLoadingLeads(false)
      }
    }

    fetchCampaignLeads()
  }, [params.id])

  const handleStatusChange = async (newStatus: 'active' | 'paused' | 'completed') => {
    if (!campaign) return
    
    setIsUpdating(true)
    try {
      const response = await fetch('/api/campaigns/progress', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignId: campaign.id,
          status: newStatus
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update campaign status')
      }

      const data = await response.json()
      setCampaign(data.campaign)
      
      toast({
        title: 'Campaign updated',
        description: `Campaign status changed to ${newStatus}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
        variant: 'solid',
        containerStyle: {
          background: 'linear-gradient(45deg, #667eea, #764ba2)',
          color: 'white',
          boxShadow: '0 10px 25px rgba(102, 126, 234, 0.3)',
        }
      })
    } catch (err) {
      console.error('Error updating campaign:', err)
      toast({
        title: 'Update failed',
        description: 'Failed to update campaign status',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const refreshCampaignData = async () => {
    // Refetch campaign data
    const response = await fetch(`/api/campaigns/progress?campaignId=${params.id}`)
    if (response.ok) {
      const data = await response.json()
      setCampaign(data.campaign)
      setProgress(data.progress)
    }
  }

  const handleLeadSelect = (leadId: string, selected: boolean) => {
    setSelectedLeadIds(prev => 
      selected 
        ? [...prev, leadId]
        : prev.filter(id => id !== leadId)
    )
  }

  if (loading) {
    return (
      <DashboardLayout>
        <Container maxW="7xl" py={8}>
          <VStack spacing={8}>
            <Spinner size="xl" />
            <Text>Loading campaign...</Text>
          </VStack>
        </Container>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <Container maxW="7xl" py={8}>
          <Alert status="error" borderRadius="lg">
            <AlertIcon />
            <VStack spacing={2} align="start">
              <Text fontWeight="bold">Error Loading Campaign</Text>
              <Text>{error}</Text>
            </VStack>
          </Alert>
        </Container>
      </DashboardLayout>
    )
  }

  if (!campaign || !progress) {
    return (
      <DashboardLayout>
        <Container maxW="7xl" py={8}>
          <Alert status="warning" borderRadius="lg">
            <AlertIcon />
            <Text>Campaign not found</Text>
          </Alert>
        </Container>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <Container maxW="7xl" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Campaign Header */}
          <HStack justify="space-between" align="start" wrap="wrap" gap={4}>
            <VStack spacing={2} align="start">
              <HStack spacing={3} align="center">
                <Heading size="lg">{campaign.name}</Heading>
                <Badge 
                  colorScheme={getCampaignStatusColor(campaign.status)} 
                  px={3} 
                  py={1}
                  textTransform="uppercase"
                  fontWeight="bold"
                >
                  {campaign.status}
                </Badge>
              </HStack>
              {campaign.description && (
                <Text color="gray.600" maxW="2xl">
                  {campaign.description}
                </Text>
              )}
              <HStack spacing={4} fontSize="sm" color="gray.500">
                <HStack spacing={1}>
                  <FiCalendar />
                  <Text>Created {format(new Date(campaign.created_at), 'MMM d, yyyy')}</Text>
                </HStack>
                <HStack spacing={1}>
                  <FiActivity />
                  <Text>Last activity {format(new Date(progress.lastActivity || campaign.updated_at), 'MMM d, yyyy')}</Text>
                </HStack>
              </HStack>
            </VStack>
            
            {/* Campaign Actions */}
            <HStack spacing={3}>
              <Menu>
                <MenuButton 
                  as={Button} 
                  variant="outline" 
                  size="sm"
                  rightIcon={<ChevronDownIcon />}
                  isLoading={isUpdating}
                >
                  Change Status
                </MenuButton>
                <MenuList>
                  <MenuItem 
                    icon={<FiPlay />}
                    onClick={() => handleStatusChange('active')}
                    isDisabled={campaign.status === 'active'}
                  >
                    Activate Campaign
                  </MenuItem>
                  <MenuItem 
                    icon={<FiPause />}
                    onClick={() => handleStatusChange('paused')}
                    isDisabled={campaign.status === 'paused'}
                  >
                    Pause Campaign
                  </MenuItem>
                  <MenuItem 
                    icon={<FiUserCheck />}
                    onClick={() => handleStatusChange('completed')}
                    isDisabled={campaign.status === 'completed'}
                  >
                    Mark Complete
                  </MenuItem>
                </MenuList>
              </Menu>
              
              <IconButton 
                aria-label="Campaign settings" 
                icon={<FiSettings />} 
                variant="outline" 
                size="sm" 
              />
              
              <Menu>
                <MenuButton as={IconButton} icon={<MoreHorizontal />} variant="outline" size="sm" />
                <MenuList>
                  <MenuItem>Duplicate Campaign</MenuItem>
                  <MenuItem>Export Results</MenuItem>
                  <MenuItem color="red.500">Delete Campaign</MenuItem>
                </MenuList>
              </Menu>
            </HStack>
          </HStack>

          {/* Stats Overview */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
            <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
              <CardBody>
                <Stat>
                  <StatLabel>Total Leads</StatLabel>
                  <StatNumber>{progress?.totalLeads || 0}</StatNumber>
                  <StatHelpText>In this campaign</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            
            <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
              <CardBody>
                <Stat>
                  <StatLabel>Completion</StatLabel>
                  <StatNumber>{progress?.completionPercentage || 0}%</StatNumber>
                  <Progress 
                    value={progress?.completionPercentage || 0} 
                    colorScheme="purple" 
                    size="sm" 
                    mt={2} 
                    borderRadius="full" 
                  />
                </Stat>
              </CardBody>
            </Card>
            
            <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
              <CardBody>
                <Stat>
                  <StatLabel>Response Rate</StatLabel>
                  <StatNumber>{progress?.responseRate || 0}%</StatNumber>
                  <StatHelpText>
                    {Object.keys(progress?.messageStats || {})
                      .filter(key => key.startsWith('inbound_'))
                      .reduce((sum, key) => sum + (progress?.messageStats[key] || 0), 0)} 
                    responses
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            
            <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
              <CardBody>
                <Stat>
                  <StatLabel>Messages Sent</StatLabel>
                  <StatNumber>
                    {Object.keys(progress?.messageStats || {})
                      .filter(key => key.startsWith('outbound_'))
                      .reduce((sum, key) => sum + (progress?.messageStats[key] || 0), 0)}
                  </StatNumber>
                  <StatHelpText>0 steps completed</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Recent Activity */}
          {progress.recentActivity && progress.recentActivity.length > 0 && (
            <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
              <CardHeader>
                <HStack justify="space-between">
                  <Heading size="md">Recent Activity</Heading>
                  <IconButton 
                    aria-label="Refresh data" 
                    icon={<RefreshCw />} 
                    size="sm" 
                    onClick={refreshCampaignData}
                  />
                </HStack>
              </CardHeader>
              <CardBody>
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Lead</Th>
                      <Th>Action</Th>
                      <Th>Status</Th>
                      <Th>Date</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {progress.recentActivity.map((activity: any) => (
                      <Tr key={activity.id}>
                        <Td>
                          {activity.lead ? (
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="medium">{activity.lead.full_name}</Text>
                              <Text fontSize="xs" color="gray.500">{activity.lead.company}</Text>
                            </VStack>
                          ) : (
                            'Unknown Lead'
                          )}
                        </Td>
                        <Td>{activity.channel === 'email' ? 'Email' : 'LinkedIn'}</Td>
                        <Td>
                          <Badge colorScheme={
                            activity.status === 'completed' ? 'green' : 
                            activity.status === 'scheduled' ? 'blue' :
                            activity.status === 'failed' ? 'red' : 'gray'
                          }>
                            {activity.status}
                          </Badge>
                        </Td>
                        <Td>{format(new Date(activity.updated_at || activity.send_time), 'MMM d, h:mm a')}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </CardBody>
            </Card>
          )}

          {/* Campaign Details Tabs */}
          <Card bg={cardBg} shadow="sm">
            <CardBody>
              <Tabs colorScheme="purple">
                <TabList>
                  <Tab>Overview</Tab>
                  <Tab>Leads</Tab>
                  <Tab>Messages</Tab>
                  <Tab>Settings</Tab>
                </TabList>

                <TabPanels>
                  {/* Overview Tab */}
                  <TabPanel>
                    <VStack spacing={6} align="stretch">
                      <Heading size="md" color={useColorModeValue('gray.800', 'white')}>Campaign Overview</Heading>
                      
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                        <Card variant="outline">
                          <CardHeader pb={0}>
                            <Heading size="sm">Campaign Settings</Heading>
                          </CardHeader>
                          <CardBody>
                            <VStack spacing={3} align="stretch">
                              <HStack justify="space-between">
                                <Text fontWeight="medium">Status</Text>
                                <Badge colorScheme={getCampaignStatusColor(campaign.status)}>
                                  {campaign.status}
                                </Badge>
                              </HStack>
                              
                              <HStack justify="space-between">
                                <Text fontWeight="medium">Start Date</Text>
                                <Text>{format(new Date(progress.startDate || campaign.created_at), 'MMM d, yyyy')}</Text>
                              </HStack>
                              
                              <HStack justify="space-between">
                                <Text fontWeight="medium">Total Leads</Text>
                                <Text>{progress.totalLeads}</Text>
                              </HStack>
                            </VStack>
                          </CardBody>
                        </Card>
                        
                        <Card variant="outline">
                          <CardHeader pb={0}>
                            <Heading size="sm">Workflow Summary</Heading>
                          </CardHeader>
                          <CardBody>
                            <VStack spacing={3} align="stretch">
                              <HStack justify="space-between">
                                <Text fontWeight="medium">Template</Text>
                                <Text>{(campaign as any).sequence_template || 'Custom'}</Text>
                              </HStack>
                              
                              <HStack justify="space-between">
                                <Text fontWeight="medium">Steps</Text>
                                <Text>{campaign.settings?.workflow?.customSteps?.length || 0} touchpoints</Text>
                              </HStack>
                              
                              <HStack justify="space-between">
                                <Text fontWeight="medium">Duration</Text>
                                <Text>
                                  {campaign.settings?.workflow?.customSteps?.length > 0 
                                    ? Math.max(...campaign.settings.workflow.customSteps.map((step: any) => step.delay || 0)) + 1
                                    : 0} days
                                </Text>
                              </HStack>
                            </VStack>
                          </CardBody>
                        </Card>
                      </SimpleGrid>
                      
                      {/* Activity Feed Placeholder */}
                      <Card variant="outline">
                        <CardHeader pb={0}>
                          <Heading size="sm">Recent Activity</Heading>
                        </CardHeader>
                        <CardBody>
                          <Text color="gray.500">No recent activity to display</Text>
                        </CardBody>
                      </Card>
                    </VStack>
                  </TabPanel>
                  
                  {/* Leads Tab */}
                  <TabPanel>
                    <VStack spacing={6} align="stretch">
                      <HStack justify="space-between" wrap="wrap">
                        <Heading size="md">Campaign Leads</Heading>
                        <HStack spacing={3}>
                          {selectedLeadIds.length > 0 && (
                            <Badge colorScheme="purple" px={3} py={1} borderRadius="full">
                              {selectedLeadIds.length} selected
                            </Badge>
                          )}
                          <GradientButton size="sm">Add Leads</GradientButton>
                        </HStack>
                      </HStack>
                      
                      {loadingLeads ? (
                        <VStack py={8}>
                          <Spinner />
                          <Text>Loading leads...</Text>
                        </VStack>
                      ) : selectedLeads.length > 0 ? (
                        <>
                          {/* Leads Summary */}
                          <SimpleGrid columns={{ base: 2, md: 5 }} spacing={4}>
                            <Card size="sm" variant="outline">
                              <CardBody>
                                <VStack spacing={1}>
                                  <Text fontSize="2xl" fontWeight="bold" color="purple.500">
                                    {selectedLeads.length}
                                  </Text>
                                  <Text fontSize="sm" color="gray.600">Total Leads</Text>
                                </VStack>
                              </CardBody>
                            </Card>
                            
                            <Card size="sm" variant="outline">
                              <CardBody>
                                <VStack spacing={1}>
                                  <Text fontSize="2xl" fontWeight="bold" color="green.500">
                                    {selectedLeads.filter(l => l.email_status === 'verified').length}
                                  </Text>
                                  <Text fontSize="sm" color="gray.600">Verified Emails</Text>
                                </VStack>
                              </CardBody>
                            </Card>
                            
                            <Card size="sm" variant="outline">
                              <CardBody>
                                <VStack spacing={1}>
                                  <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                                    {selectedLeads.filter(l => l.linkedin_url).length}
                                  </Text>
                                  <Text fontSize="sm" color="gray.600">LinkedIn Profiles</Text>
                                </VStack>
                              </CardBody>
                            </Card>
                            
                            <Card size="sm" variant="outline">
                              <CardBody>
                                <VStack spacing={1}>
                                  <Text fontSize="2xl" fontWeight="bold" color="teal.500">
                                    {[...new Set(selectedLeads.map(l => l.country).filter(Boolean))].length}
                                  </Text>
                                  <Text fontSize="sm" color="gray.600">Countries</Text>
                                </VStack>
                              </CardBody>
                            </Card>
                            
                            <Card size="sm" variant="outline">
                              <CardBody>
                                <VStack spacing={1}>
                                  <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                                    {selectedLeads.filter(l => l.campaign_status === 'contacted').length}
                                  </Text>
                                  <Text fontSize="sm" color="gray.600">Contacted</Text>
                                </VStack>
                              </CardBody>
                            </Card>
                          </SimpleGrid>
                          
                          {/* Use SearchResults component for leads display */}
                          <SearchResults />
                        </>
                      ) : (
                        <Card variant="outline">
                          <CardBody>
                            <VStack py={8} spacing={4}>
                              <Box
                                w="80px"
                                h="80px"
                                bg="gray.100"
                                borderRadius="full"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                              >
                                <Building size={32} color="gray" />
                              </Box>
                              <VStack spacing={2}>
                                <Text fontWeight="medium" fontSize="lg">No leads found</Text>
                                <Text color="gray.500" textAlign="center" maxW="md">
                                  Start building your prospect list by adding leads to this campaign. 
                                  You can upload a CSV file or search for prospects using our B2B database.
                                </Text>
                              </VStack>
                              <GradientButton size="sm">Add Your First Lead</GradientButton>
                            </VStack>
                          </CardBody>
                        </Card>
                      )}
                    </VStack>
                  </TabPanel>
                  
                  {/* Messages Tab */}
                  <TabPanel>
                    <VStack spacing={6} align="stretch">
                      <Heading size="md">Message Performance</Heading>
                      <Text color="gray.500">Message analytics and performance data will be displayed here.</Text>
                    </VStack>
                  </TabPanel>
                  
                  {/* Settings Tab */}
                  <TabPanel>
                    <VStack spacing={6} align="stretch">
                      <Heading size="md">Campaign Settings</Heading>
                      <Text color="gray.500">Campaign configuration options will be displayed here.</Text>
                    </VStack>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </DashboardLayout>
  )
}

export default function CampaignDetailPage() {
  return (
    <ApolloSearchProvider>
      <CampaignDetailInner />
    </ApolloSearchProvider>
  )
} 