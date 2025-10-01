'use client'

import { Box, Heading, HStack, Text, VStack, Button, Spinner, useToast, SimpleGrid, Card, Icon, useColorModeValue, Th, Tr, Thead, Tbody, TableContainer, Td, Table, Spacer, Avatar, Badge } from "@chakra-ui/react"
import { Container } from "@chakra-ui/react"
import DashboardLayout from "../../components/layout/DashboardLayout"
import { useState, useEffect } from "react"
import { MailOpen, Mail, Reply, SendToBackIcon, Droplet, Mails } from "lucide-react"
import { MousePointerClick } from "lucide-react"

interface Analytics {
    sentCount: number
    openCount: number
    clickCount: number
    replyCount: number
    uniqueSentCount: number
    bounceCount: number
    totalCount: number
}

interface Lead {
    campaign_lead_map_id: string,
    lead_category_id: string,
    status: string,
    created_at: string,
    lead: {
        id: string,
        first_name: string,
        last_name: string,
        email: string,
        phone_number: string,
        company_name: string,
        website: string,
        location: string,
        custom_fields: {
            Custom_Message: string,
        },
        linkedin_profile: string,
        company_url: string,
        is_unsubscribed: false,
        unsubscribed_client_id_map: Record<string, string>
    }
}

const EmailLeads = () => {
    const [leads, setLeads] = useState<Lead[]>([])
    const [analytics, setAnalytics] = useState<Analytics>();
    const [loading, setLoading] = useState(false)
    const [pagination, setPagination] = useState({
        page: 1,
        perPage: 10,
        total: 0,
        totalPages: 0
    })
    const toast = useToast()

    const cardBg = useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(26, 32, 44, 0.8)')
    const glassBg = useColorModeValue('rgba(255, 255, 255, 0.1)', 'rgba(26, 32, 44, 0.1)')
    const borderColor = useColorModeValue('rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)')

    const fetchData = async (page: number = 1, perPage: number = 10) => {
        setLoading(true)
        try {
            const res = await fetch(`/api/email-leads?page=${page}&per_page=${perPage}`)
            const data = await res.json()

            if (data.success) {
                console.log('Fetched leads:', data)
                setLeads(data.data || [])
                setAnalytics(data.analytics);
                setPagination(data.pagination)
            } else {
                toast({
                    title: 'Error',
                    description: data.error || 'Failed to fetch leads',
                    status: 'error',
                    duration: 3000,
                })
            }
        } catch (error) {
            console.error('Error fetching leads:', error)
            toast({
                title: 'Error',
                description: 'Failed to fetch leads',
                status: 'error',
                duration: 3000,
            })
        } finally {
            setLoading(false)
        }
    }

    const handlePageChange = (newPage: number) => {
        fetchData(newPage, pagination.perPage)
    }

    const handlePerPageChange = (newPerPage: number) => {
        fetchData(1, newPerPage) // Reset to page 1 when changing items per page
    }

    const handleSelectLead = async(email: string, leadId: string, campaignId: string) => {
        try{
            const res = await fetch(`/api/email-leads/${leadId}`, {
                method: 'POST',
                body: JSON.stringify({ email, campaignId })
            })
            const data = await res.json()
            console.log(data);
        }catch(err){
            console.log(err);
        }
    }

    useEffect(() => {
        fetchData(pagination.page, pagination.perPage);
    }, [])

    return (
        <>
            <DashboardLayout>
                <Container maxW="7xl" py={8}>
                    {/* Header Section */}
                    <Box>
                        <HStack justify="space-between" align="center" mb={6}>
                            <VStack spacing={1} align="start">
                                <Heading
                                    size="xl"
                                    bgGradient="linear(to-r, purple.400, blue.400)"
                                    bgClip="text"
                                    fontWeight="bold"
                                >
                                    Email Lead Management
                                </Heading>
                                <Text color="gray.600" fontSize="lg">
                                    Track and manage your email leads
                                </Text>
                            </VStack>
                        </HStack>
                        <Spacer height={10} />
                        {/* Loading State */}
                        {loading && (
                            <Box textAlign="center" py={8}>
                                <Spinner size="xl" color="purple.500" />
                                <Text mt={4} color="gray.600">Loading leads...</Text>
                            </Box>
                        )}
                        {analytics && (
                            <>
                                <SimpleGrid columns={{ base: 2, md: 7 }} spacing={6}>
                                    <Card
                                        bg={cardBg}
                                        border="1px solid"
                                        borderColor={borderColor}
                                        borderRadius="xl"
                                        p={4}
                                        _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                                        transition="all 0.2s ease"
                                    >
                                        <VStack spacing={1}>
                                            <Icon as={Mails} boxSize={5} color="purple.500" />
                                            <Text fontSize="2xl" fontWeight="bold">
                                                {analytics.totalCount}
                                            </Text>
                                            <Text fontSize="xs" color="gray.600">Total</Text>
                                        </VStack>
                                    </Card>
                                    <Card
                                        bg={cardBg}
                                        border="1px solid"
                                        borderColor={borderColor}
                                        borderRadius="xl"
                                        p={4}
                                        _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                                        transition="all 0.2s ease"
                                    >
                                        <VStack spacing={1}>
                                            <Icon as={Mail} boxSize={5} color="purple.500" />
                                            <Text fontSize="2xl" fontWeight="bold">
                                                {analytics.sentCount}
                                            </Text>
                                            <Text fontSize="xs" color="gray.600">Email Sent</Text>
                                        </VStack>
                                    </Card>
                                    <Card
                                        bg={cardBg}
                                        border="1px solid"
                                        borderColor={borderColor}
                                        borderRadius="xl"
                                        p={4}
                                        _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                                        transition="all 0.2s ease"
                                    >
                                        <VStack spacing={1}>
                                            <Icon as={MailOpen} boxSize={5} color="purple.500" />
                                            <Text fontSize="2xl" fontWeight="bold">
                                                {analytics.openCount}
                                            </Text>
                                            <Text fontSize="xs" color="gray.600">Email Opened</Text>
                                        </VStack>
                                    </Card>
                                    <Card
                                        bg={cardBg}
                                        border="1px solid"
                                        borderColor={borderColor}
                                        borderRadius="xl"
                                        p={4}
                                        _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                                        transition="all 0.2s ease"
                                    >
                                        <VStack spacing={1}>
                                            <Icon as={MousePointerClick} boxSize={5} color="purple.500" />
                                            <Text fontSize="2xl" fontWeight="bold">
                                                {analytics.clickCount}
                                            </Text>
                                            <Text fontSize="xs" color="gray.600">Clicks</Text>
                                        </VStack>
                                    </Card>
                                    <Card
                                        bg={cardBg}
                                        border="1px solid"
                                        borderColor={borderColor}
                                        borderRadius="xl"
                                        p={4}
                                        _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                                        transition="all 0.2s ease"
                                    >
                                        <VStack spacing={1}>
                                            <Icon as={Reply} boxSize={5} color="purple.500" />
                                            <Text fontSize="2xl" fontWeight="bold">
                                                {analytics.bounceCount}
                                            </Text>
                                            <Text fontSize="xs" color="gray.600">Email Replied</Text>
                                        </VStack>
                                    </Card>
                                    <Card
                                        bg={cardBg}
                                        border="1px solid"
                                        borderColor={borderColor}
                                        borderRadius="xl"
                                        p={4}
                                        _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                                        transition="all 0.2s ease"
                                    >
                                        <VStack spacing={1}>
                                            <Icon as={SendToBackIcon} boxSize={5} color="purple.500" />
                                            <Text fontSize="2xl" fontWeight="bold">
                                                {analytics.uniqueSentCount}
                                            </Text>
                                            <Text fontSize="xs" color="gray.600">Unique Sent</Text>
                                        </VStack>
                                    </Card>
                                    <Card
                                        bg={cardBg}
                                        border="1px solid"
                                        borderColor={borderColor}
                                        borderRadius="xl"
                                        p={4}
                                        _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                                        transition="all 0.2s ease"
                                    >
                                        <VStack spacing={1}>
                                            <Icon as={Droplet} boxSize={5} color="purple.500" />
                                            <Text fontSize="2xl" fontWeight="bold">
                                                {analytics.bounceCount}
                                            </Text>
                                            <Text fontSize="xs" color="gray.600">Bounced</Text>
                                        </VStack>
                                    </Card>
                                </SimpleGrid>
                                <Spacer height={10} />
                            </>
                        )}

                        {/* Leads Display - You can add your lead cards/table here */}
                        {!loading && leads.length > 0 && (
                            <Card
                                bg={cardBg}
                                backdropFilter="blur(10px)"
                                border="1px solid"
                                borderColor={borderColor}
                                borderRadius="xl"
                                overflow="hidden"
                            >
                                <TableContainer>
                                    <Table variant="simple" size="sm">
                                        <Thead bg={glassBg}>
                                            <Tr>
                                                <Th color="gray.600" fontWeight="semibold" py={4}>Lead</Th>
                                                <Th color="gray.600" fontWeight="semibold">Company</Th>
                                                <Th color="gray.600" fontWeight="semibold">Account</Th>
                                                <Th color="gray.600" fontWeight="semibold">Status</Th>
                                                <Th color="gray.600" fontWeight="semibold">Location</Th>
                                            </Tr>
                                        </Thead>
                                        <Tbody>
                                            {leads.map((lead) => (
                                                <Tr key={lead.lead.id}
                                                    _hover={{
                                                        bgGradient: 'linear(to-r, purple.50 0%, white 100%)',
                                                        transform: 'scale(1.01)',
                                                        cursor: 'pointer',
                                                        transition: 'background 0.8s cubic-bezier(0.4,0,0.2,1)'
                                                    }}
                                                    transition="all 0.2s ease"
                                                    onClick={() => handleSelectLead(lead.lead.email, lead.lead.id, lead.campaign_lead_map_id)}
                                                >
                                                    <Td>
                                                        <HStack spacing={3}>
                                                            <Avatar
                                                                src={lead.lead.first_name}
                                                                size="sm"
                                                                name={lead.lead.first_name + ' ' + lead.lead.last_name}
                                                            // borderColor={borderColor}
                                                            />
                                                            <VStack align="start" spacing={0}>
                                                                <Text fontWeight="semibold" fontSize="sm" noOfLines={1}>
                                                                    {lead.lead.first_name + ' ' + lead.lead.last_name}
                                                                </Text>
                                                                <Text fontSize="xs" color="gray.500" noOfLines={1}>
                                                                    {lead.lead.company_name?.length > 40
                                                                        ? `${lead.lead.company_name.slice(0, 40)}...`
                                                                        : lead.lead.company_name}
                                                                </Text>
                                                            </VStack>
                                                        </HStack>
                                                    </Td>
                                                    <Td>{lead.lead.company_name}</Td>
                                                    <Td>{lead.lead.email}</Td>
                                                    <Td>
                                                        <Badge
                                                            colorScheme={lead.status === 'new' ? 'blue' : 'gray'}
                                                            variant="subtle"
                                                            fontSize="xs"
                                                        >
                                                            {lead.status}
                                                        </Badge>
                                                    </Td>
                                                    <Td>{lead.lead.location}</Td>
                                                </Tr>
                                            ))}
                                        </Tbody>
                                    </Table>
                                </TableContainer>
                            </Card>
                        )}

                        {/* Pagination Controls */}
                        {!loading && pagination.totalPages > 0 && (
                            <HStack spacing={4} justify="space-between" mt={8}>
                                <HStack spacing={2}>
                                    <Button
                                        size="sm"
                                        onClick={() => handlePageChange(pagination.page - 1)}
                                        isDisabled={pagination.page === 1}
                                    >
                                        Previous
                                    </Button>
                                    <Text fontSize="sm" color="gray.600">
                                        Page {pagination.page} of {pagination.totalPages}
                                    </Text>
                                    <Button
                                        size="sm"
                                        onClick={() => handlePageChange(pagination.page + 1)}
                                        isDisabled={pagination.page >= pagination.totalPages}
                                    >
                                        Next
                                    </Button>
                                </HStack>

                                <HStack spacing={2}>
                                    <Text fontSize="sm" color="gray.600">Per page:</Text>
                                    {[10, 25, 50, 100].map((size) => (
                                        <Button
                                            key={size}
                                            size="sm"
                                            variant={pagination.perPage === size ? 'solid' : 'outline'}
                                            colorScheme="purple"
                                            onClick={() => handlePerPageChange(size)}
                                        >
                                            {size}
                                        </Button>
                                    ))}
                                </HStack>
                            </HStack>
                        )}
                    </Box>
                </Container>
            </DashboardLayout>
        </>
    )
}
export default EmailLeads