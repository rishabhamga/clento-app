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
    useColorModeValue,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    Button,
    Icon,
    useToast,
    Spinner,
    Spacer
} from '@chakra-ui/react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { GradientButton } from '@/components/ui/GradientButton'
import { Search, Filter, Download, Plus, CheckCircle, Mail } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ILeads, IRecentActivity } from '../api/leads/view/route'

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
    const { isOpen, onOpen, onClose } = useDisclosure()
    const [leads, setLeads] = useState<ILeads[]>();
    const toast = useToast()
    const [loading, setLoading] = useState<boolean>(false)
    const [selectedLead, setSelectedLead] = useState<string>();
    const [recentActivity, setRecentActivity] = useState<IRecentActivity[]>();
    const [selectedLeadData, setSelectedLeadData] = useState<ILeads>();
    const [campaigns, setCampaigns] = useState<{ id: string, name: string }[]>();

    const [searchTerm, setSearchTerm] = useState<string>("");

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    // Filter leads on the client side based on searchTerm
    const filteredLeads = !searchTerm
        ? leads || []
        : leads?.filter((lead) => {
            const term = searchTerm.toLowerCase();
            return (
                lead.contactName?.toLowerCase().includes(term) ||
                lead.email?.toLowerCase().includes(term) ||
                lead.companyName?.toLowerCase().includes(term) ||
                lead.designation?.toLowerCase().includes(term)
            );
        }) || [];

    const handleCampaignSelect = async (campaignId: string) => {
        if (!campaignId || campaignId === '') {
            return
        }
        setLoading(true)
        try {
            const response = await fetch(`/api/leads/view?campaignId=${campaignId}&limit=20`)
            if (response.status === 200) {
                const data = await response.json();
                setLeads(data.leads);
            }
        } catch (err) {
            toast({
                title: "Error",
                description: "An error occured while fetching the leads",
                status: "error",
                duration: 3000,
                isClosable: true,
            })
            console.log(err)
        } finally {
            setLoading(false)
        }
    }


    const handleViewClick = (id: string) => {
        onOpen();
        console.log('opening')
        setSelectedLead(id);
        setSelectedLeadData(undefined)
    }

    const handleClose = () => {
        onClose();
        setSelectedLead(undefined);
    }

    useEffect(() => {
        setSelectedLeadData(leads?.find((lead) => lead.id === selectedLead));
    }, [selectedLead])

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                const response = await fetch(`/api/leads/view`)
                if (response.status === 200) {
                    const data = await response.json();
                    setRecentActivity(data.recentActivity);
                    setCampaigns(data.campaigns);
                }
            } catch (err) {
                toast({
                    title: "Error",
                    description: "An error occured while fetching the leads",
                    status: "error",
                    duration: 3000,
                    isClosable: true,
                })
                console.log(err)
            } finally {
                setLoading(false)
            }

            // campaignId
            // limit
            // offset
        }
        fetchData();

    }, [])

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
                            {/* <HStack spacing={3}>
                                <GradientButton leftIcon={<Download size={16} />} variant="tertiary">
                                    Export
                                </GradientButton>
                            </HStack> */}
                        </HStack>

                        {/* Filters */}
                        <HStack spacing={4} mb={6}>
                            <InputGroup flex={1} maxW="400px">
                                <InputLeftElement>
                                    <Search size={16} color="gray" />
                                </InputLeftElement>
                                <Input placeholder="Search leads..." onChange={handleSearchChange} />
                            </InputGroup>
                            <Select
                                placeholder="Campaigns"
                                maxW="150px"
                                onChange={(e) => handleCampaignSelect(e.target.value)}
                            >
                                {campaigns && campaigns?.map((campaign) => (
                                    <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
                                ))}
                            </Select>
                        </HStack>
                    </Box>

                    <Modal isOpen={isOpen} onClose={handleClose} size="4xl">
                        <ModalOverlay bg="blackAlpha.600" />
                        <ModalContent mx={4} borderRadius="xl" overflow="hidden" maxW="900px" maxH={'85vh'}>
                            <ModalHeader color={'CaptionText'} py={6} borderBottom={'1px solid'} borderColor={'blackAlpha.300'} alignItems={'start'}>
                                <HStack>
                                    <Text fontSize="xl" fontWeight="bold">
                                        Viewing Contact:
                                    </Text>
                                    <Text fontSize="xl" fontWeight="bold" textColor={'blackAlpha.700'}>
                                        {selectedLeadData?.contactName || 'unknown'}
                                    </Text>
                                </HStack>
                                <Text fontSize="sm" color="gray.600">{selectedLeadData?.email}</Text>
                                <Text fontSize="xs" color="gray.500">{selectedLeadData?.designation}</Text>
                            </ModalHeader>
                            <ModalCloseButton color="black" />

                            <ModalBody py={8}>
                                <Heading size="md" color="gray.700" mb={3}>
                                    LinkedIn Chat
                                </Heading>
                                <Card p={4} maxH="300px" overflowY="auto" bg={useColorModeValue('gray.50', 'gray.800')}>
                                    <VStack spacing={3} align="stretch">
                                        {!selectedLeadData || selectedLeadData?.linkedInMessages.length === 0 ? (
                                            <Text fontSize="md" color="gray.500" textAlign="center" py={8}>
                                                No LinkedIn messages found.
                                            </Text>
                                        ) : (
                                            selectedLeadData.linkedInMessages.map((message, idx) => (
                                                <Box
                                                    key={idx}
                                                    alignSelf={message.from === 'you' ? 'flex-end' : 'flex-start'}
                                                    bg={message.from === 'you' ? 'blue.100' : 'gray.200'}
                                                    color="gray.800"
                                                    px={4}
                                                    py={2}
                                                    borderRadius="lg"
                                                    maxW="70%"
                                                    boxShadow="sm"
                                                    position="relative"
                                                >
                                                    <Text fontSize="md" mb={1}>{message.message}</Text>
                                                    <HStack justify="space-between" spacing={2}>
                                                        <Text fontSize="xs" color="gray.500">{message.date}</Text>
                                                        <Text fontSize="xs" color="gray.400" fontStyle="italic">{message.from}</Text>
                                                    </HStack>
                                                </Box>
                                            ))
                                        )}
                                    </VStack>
                                </Card>
                                <Spacer height="30px" />
                                <Heading size="md" color="gray.700" mb={3}>
                                    Emails
                                </Heading>
                                <Card p={4} maxH="300px" overflowY="auto" bg={useColorModeValue('gray.50', 'gray.800')}>
                                    <VStack spacing={3} align="stretch">
                                        {!selectedLeadData || selectedLeadData?.emailMessages.length === 0 ? (
                                            <Text fontSize="md" color="gray.500" textAlign="center" py={8}>
                                                No emails found.
                                            </Text>
                                        ) : (
                                            selectedLeadData.emailMessages.map((message, idx) => (
                                                <Box
                                                    key={idx}
                                                    alignSelf={message.from === 'you' ? 'flex-end' : 'flex-start'}
                                                    bg={message.from === 'you' ? 'green.100' : 'gray.200'}
                                                    color="gray.800"
                                                    px={4}
                                                    py={2}
                                                    borderRadius="lg"
                                                    maxW="70%"
                                                    boxShadow="sm"
                                                    position="relative"
                                                >
                                                    <Text fontSize="md" mb={1}>{message.message}</Text>
                                                    <HStack justify="space-between" spacing={2}>
                                                        <Text fontSize="xs" color="gray.500">{message.date}</Text>
                                                        <Text fontSize="xs" color="gray.400" fontStyle="italic">{message.from}</Text>
                                                    </HStack>
                                                </Box>
                                            ))
                                        )}
                                    </VStack>
                                </Card>
                            </ModalBody>
                        </ModalContent>
                    </Modal>

                    {recentActivity && recentActivity.length !== 0 && (
                        <Box>
                            <Heading size="md" mb={4}>Recent Activity</Heading>
                            <HStack spacing={4} overflowX="auto" pb={2}>
                                {recentActivity.map((activity, idx) => (
                                    <Card key={idx} minW="280px" bg={cardBg} boxShadow="md">
                                        <CardBody>
                                            <HStack spacing={3} mb={2}>
                                                <Avatar size="sm" name={activity.contactName} />
                                                <VStack align="start" spacing={0}>
                                                    <Text fontWeight="semibold">{activity.contactName}</Text>
                                                    <Text fontSize="xs" color="gray.500">{activity.companyName}</Text>
                                                </VStack>
                                            </HStack>
                                            <Text fontSize="sm" color="gray.600" mb={2} fontWeight={'bold'}>
                                                {activity.taskTitle}
                                            </Text>
                                            <Text fontSize="sm" color="gray.600" mb={2}>
                                                {activity.taskDescription}
                                            </Text>
                                            <Text fontSize="xs" color="gray.400">
                                                {activity.time}
                                            </Text>
                                        </CardBody>
                                    </Card>
                                ))}
                            </HStack>
                        </Box>
                    )}

                    {loading && (
                        <Box p={8} display={'flex'} justifyContent={'flex-start'} flexDirection={'column'}>
                            <Container maxW="7xl" py={8}>
                                <VStack spacing={8}>
                                    <Spinner size="xl" />
                                    <Text>Loading Leads....</Text>
                                </VStack>
                            </Container>
                        </Box>
                    )}
                    {/*Leads Placeholder*/}
                    {!loading && !leads && (
                        <Card bg={cardBg} p={12} alignItems={'center'}>
                            <Text fontWeight={'semibold'} color={'blackAlpha.400'}>Select A Campaign To See The Leads</Text>
                        </Card>)}
                    {/* Leads Table */}
                    {/* Leads table will be shown when leads are available */}
                    {leads && leads?.length > 0 && (
                        <Card bg={cardBg}>
                            <CardBody>
                                <Table variant="simple">
                                    <Thead>
                                        <Tr>
                                            <Th>Lead</Th>
                                            <Th>Company</Th>
                                            <Th>Status</Th>
                                            <Th>Score</Th>
                                            <Th>Actions</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {filteredLeads.map((lead) => (
                                            <Tr key={lead.id}>
                                                <Td>
                                                    <HStack spacing={3}>
                                                        <Avatar size="sm" name={lead.contactName} />
                                                        <VStack spacing={0} align="start">
                                                            <Text fontWeight="semibold">{lead.contactName}</Text>
                                                            <Text fontSize="sm" color="gray.600">{lead.email}</Text>
                                                            <Text fontSize="xs" color="gray.500">{lead.designation}</Text>
                                                        </VStack>
                                                    </HStack>
                                                </Td>
                                                <Td>
                                                    <Text fontWeight="medium">{lead.companyName}</Text>
                                                </Td>
                                                <Td>
                                                    <Badge colorScheme={getStatusColor(lead.status)}>
                                                        {lead.status}
                                                    </Badge>
                                                </Td>
                                                <Td>
                                                    {/* <Badge colorScheme={lead.score >= 80 ? 'green' : lead.score >= 60 ? 'yellow' : 'red'}> */}
                                                    <Badge colorScheme={'green'}>
                                                        {50}
                                                    </Badge>
                                                </Td>
                                                <Td>
                                                    <GradientButton size="sm" variant="tertiary" onClick={() => handleViewClick(lead.id)}>
                                                        View
                                                    </GradientButton>
                                                </Td>
                                            </Tr>
                                        ))}
                                    </Tbody>
                                </Table>
                            </CardBody>
                        </Card>
                    )}
                </VStack>
            </Container>
        </DashboardLayout>
    )
}