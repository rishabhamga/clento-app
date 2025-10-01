'use client'

import {
    Box, Heading, HStack, Text, VStack, Button, Spinner, useToast, SimpleGrid, Card,
    Icon, useColorModeValue, Th, Tr, Thead, Tbody, TableContainer, Td, Table, Spacer,
    Avatar, Badge, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter,
    ModalBody, ModalCloseButton, useDisclosure, Divider
} from "@chakra-ui/react"
import { Container } from "@chakra-ui/react"
import DashboardLayout from "../../components/layout/DashboardLayout"
import { useState, useEffect } from "react"
import { MailOpen, Mail, Reply, SendToBackIcon, Droplet, Mails, Clock } from "lucide-react"
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
    campaign_id: string,
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

interface MessageHistory {
    stats_id: string
    from: string
    to: string
    type: string
    message_id: string
    time: string
    email_body: string
    subject: string
    email_seq_number: string
    open_count: number
    click_count: number
    click_details: Record<string, any>
}

const EmailLeads = () => {
    const [leads, setLeads] = useState<Lead[]>([])
    const [analytics, setAnalytics] = useState<Analytics>();
    const [loading, setLoading] = useState(false)
    const [loadingHistory, setLoadingHistory] = useState(false)
    const [selectedLead, setSelectedLead] = useState<any>(null)
    const [messageHistory, setMessageHistory] = useState<MessageHistory[]>([])
    const [pagination, setPagination] = useState({
        page: 1,
        perPage: 10,
        total: 0,
        totalPages: 0
    })
    const toast = useToast()
    const { isOpen, onOpen, onClose } = useDisclosure()

    const cardBg = useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(26, 32, 44, 0.8)')
    const glassBg = useColorModeValue('rgba(255, 255, 255, 0.1)', 'rgba(26, 32, 44, 0.1)')
    const borderColor = useColorModeValue('rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)')
    const subjectBg = useColorModeValue('purple.50', 'purple.900')

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

    const handleSelectLead = async (lead: Lead) => {
        setLoadingHistory(true)
        // Set the lead info immediately (we already have it from the table)
        setSelectedLead(lead.lead)
        onOpen() // Open modal right away

        console.log('Selected lead:', {
            campaign_id: lead.campaign_id,
            lead_id: lead.lead.id,
            campaign_lead_map_id: lead.campaign_lead_map_id
        })

        try {
            const url = `/api/email-leads/${lead.campaign_lead_map_id}?campaign_id=${lead.campaign_id}&lead_id=${lead.lead.id}`
            console.log('Fetching message history from URL:', url)
            const res = await fetch(url)
            const data = await res.json()

            if (data.success) {
                setMessageHistory(data.data.messageHistory || [])
                console.log('Message history loaded:', data.data.messageHistory?.length || 0, 'messages')
            } else {
                toast({
                    title: 'Error',
                    description: data.error || 'Failed to load email history',
                    status: 'error',
                    duration: 3000,
                })
                setMessageHistory([])
            }
        } catch (err: any) {
            console.error('Error loading lead history:', err);
            toast({
                title: 'Error',
                description: err.message || 'Failed to load email history',
                status: 'error',
                duration: 3000,
            })
            setMessageHistory([])
        } finally {
            setLoadingHistory(false)
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
                                                    onClick={() => handleSelectLead(lead)}
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

                        {/* Message History Modal */}
                        <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
                            <ModalOverlay backdropFilter="blur(10px)" />
                            <ModalContent>
                                <ModalHeader>
                                    <VStack align="start" spacing={2}>
                                        <HStack spacing={3}>
                                            <Avatar
                                                size="md"
                                                name={selectedLead ? `${selectedLead.first_name} ${selectedLead.last_name}` : ''}
                                            />
                                            <VStack align="start" spacing={0}>
                                                <Text fontSize="lg" fontWeight="bold">
                                                    {selectedLead?.first_name} {selectedLead?.last_name}
                                                </Text>
                                                <Text fontSize="sm" color="gray.500">
                                                    {selectedLead?.email}
                                                </Text>
                                            </VStack>
                                        </HStack>
                                        <Text fontSize="sm" color="gray.600">
                                            {selectedLead?.company_name} • {selectedLead?.location}
                                        </Text>
                                    </VStack>
                                </ModalHeader>
                                <ModalCloseButton />
                                <ModalBody>
                                    {loadingHistory ? (
                                        <VStack spacing={4} py={8}>
                                            <Spinner size="lg" color="purple.500" />
                                            <Text color="gray.600">Loading message history...</Text>
                                        </VStack>
                                    ) : messageHistory.length > 0 ? (
                                        <VStack spacing={4} align="stretch">
                                            {messageHistory.map((message: MessageHistory, index: number) => {
                                                const isFromLead = message.from === selectedLead?.email
                                                const isReply = message.type === 'replied'

                                                return (
                                                    <Card
                                                        key={message.message_id || index}
                                                        bg={cardBg}
                                                        backdropFilter="blur(10px)"
                                                        border="2px solid"
                                                        borderColor={isFromLead ? 'green.200' : 'blue.200'}
                                                        borderRadius="xl"
                                                        p={5}
                                                        boxShadow="md"
                                                    >
                                                        <VStack align="stretch" spacing={3}>
                                                            {/* Header with From/To and Type */}
                                                            <HStack justify="space-between" align="start">
                                                                <VStack align="start" spacing={1}>
                                                                    <HStack spacing={2}>
                                                                        <Badge
                                                                            colorScheme={isFromLead ? 'green' : 'blue'}
                                                                            fontSize="xs"
                                                                            px={3}
                                                                            py={1}
                                                                            borderRadius="full"
                                                                        >
                                                                            {isFromLead ? '📨 FROM LEAD' : '📤 TO LEAD'}
                                                                        </Badge>
                                                                        <Badge
                                                                            colorScheme={isReply ? 'purple' : 'gray'}
                                                                            variant="outline"
                                                                            fontSize="xs"
                                                                        >
                                                                            {message.type.toUpperCase()}
                                                                        </Badge>
                                                                        <Badge
                                                                            colorScheme="orange"
                                                                            variant="subtle"
                                                                            fontSize="xs"
                                                                        >
                                                                            Sequence #{message.email_seq_number}
                                                                        </Badge>
                                                                    </HStack>
                                                                    <HStack spacing={2} fontSize="xs" color="gray.600">
                                                                        <Text fontWeight="semibold">From:</Text>
                                                                        <Text>{message.from}</Text>
                                                                        <Text mx={2}>→</Text>
                                                                        <Text fontWeight="semibold">To:</Text>
                                                                        <Text>{message.to}</Text>
                                                                    </HStack>
                                                                </VStack>
                                                                <VStack align="end" spacing={1}>
                                                                    <HStack spacing={2} color="gray.500" fontSize="xs">
                                                                        <Icon as={Clock} boxSize={3} />
                                                                        <Text fontWeight="medium">
                                                                            {new Date(message.time).toLocaleString('en-US', {
                                                                                month: 'short',
                                                                                day: 'numeric',
                                                                                year: 'numeric',
                                                                                hour: '2-digit',
                                                                                minute: '2-digit'
                                                                            })}
                                                                        </Text>
                                                                    </HStack>
                                                                </VStack>
                                                            </HStack>

                                                            {/* Subject Line */}
                                                            {message.subject && (
                                                                <Box
                                                                    bg={subjectBg}
                                                                    p={3}
                                                                    borderRadius="md"
                                                                >
                                                                    <Text fontSize="sm" fontWeight="bold" color="purple.700">
                                                                        📧 {message.subject}
                                                                    </Text>
                                                                </Box>
                                                            )}

                                                            <Divider />

                                                            {/* Email Body */}
                                                            <Box
                                                                fontSize="sm"
                                                                color="gray.700"
                                                                lineHeight="1.6"
                                                                dangerouslySetInnerHTML={{ __html: message.email_body || 'No content' }}
                                                                sx={{
                                                                    'p': { mb: 2 },
                                                                    'a': { color: 'blue.500', textDecoration: 'underline' }
                                                                }}
                                                            />

                                                            {/* Engagement Stats */}
                                                            <Divider />
                                                            <SimpleGrid columns={2} spacing={3}>
                                                                <HStack spacing={2} p={2} bg={glassBg} borderRadius="md">
                                                                    <Icon as={MailOpen} boxSize={4} color="blue.500" />
                                                                    <VStack align="start" spacing={0}>
                                                                        <Text fontSize="xs" color="gray.500">Opens</Text>
                                                                        <Text fontSize="md" fontWeight="bold">{message.open_count}</Text>
                                                                    </VStack>
                                                                </HStack>
                                                                <HStack spacing={2} p={2} bg={glassBg} borderRadius="md">
                                                                    <Icon as={MousePointerClick} boxSize={4} color="purple.500" />
                                                                    <VStack align="start" spacing={0}>
                                                                        <Text fontSize="xs" color="gray.500">Clicks</Text>
                                                                        <Text fontSize="md" fontWeight="bold">{message.click_count}</Text>
                                                                    </VStack>
                                                                </HStack>
                                                            </SimpleGrid>

                                                            {/* Click Details */}
                                                            {message.click_count > 0 && Object.keys(message.click_details || {}).length > 0 && (
                                                                <Box mt={2}>
                                                                    <Text fontSize="xs" color="gray.500" mb={2}>Links Clicked:</Text>
                                                                    <VStack align="stretch" spacing={1}>
                                                                        {Object.entries(message.click_details).map(([url, count]: [string, any]) => (
                                                                            <HStack
                                                                                key={url}
                                                                                fontSize="xs"
                                                                                p={2}
                                                                                bg={glassBg}
                                                                                borderRadius="md"
                                                                                justify="space-between"
                                                                            >
                                                                                <Text noOfLines={1} flex={1} color="blue.600">
                                                                                    {url}
                                                                                </Text>
                                                                                <Badge colorScheme="purple" size="sm">
                                                                                    {count}x
                                                                                </Badge>
                                                                            </HStack>
                                                                        ))}
                                                                    </VStack>
                                                                </Box>
                                                            )}
                                                        </VStack>
                                                    </Card>
                                                )
                                            })}
                                        </VStack>
                                    ) : (
                                        <Box textAlign="center" py={12}>
                                            <Icon as={Mail} boxSize={12} color="gray.300" mb={4} />
                                            <Text color="gray.500" fontSize="lg">
                                                No message history available
                                            </Text>
                                        </Box>
                                    )}
                                </ModalBody>
                                <ModalFooter>
                                    <Button onClick={onClose}>Close</Button>
                                </ModalFooter>
                            </ModalContent>
                        </Modal>
                    </Box>
                </Container>
            </DashboardLayout>
        </>
    )
}
export default EmailLeads