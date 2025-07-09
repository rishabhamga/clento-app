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
  useToast
} from '@chakra-ui/react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { GradientButton } from '@/components/ui/GradientButton'
import { Search, Filter, Download, Plus, CheckCircle, Mail } from 'lucide-react'

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
  const toast = useToast()

  const handleUpgradeClick = () => {
    onOpen()
  }

  const handleModalClose = () => {
    onClose()
    toast({
      title: "Thank you for your interest!",
      description: "Our sales team will contact you within 24 hours.",
      status: "success",
      duration: 5000,
      isClosable: true,
    })
  }

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
          {/* Leads table will be shown when leads are available */}
          {sampleLeads.length > 0 && (
            <Card bg={cardBg}>
              <CardBody>
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
              </CardBody>
            </Card>
          )}

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
                <GradientButton size="lg" onClick={handleUpgradeClick}>
                  Upgrade to Enterprise
                </GradientButton>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>

      {/* Upgrade Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent mx={4} borderRadius="xl" overflow="hidden">
          <ModalHeader 
            bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            color="white"
            textAlign="center"
            py={6}
          >
            <VStack spacing={3}>
              <Icon as={CheckCircle} w={8} h={8} />
              <Text fontSize="xl" fontWeight="bold">
                Request Submitted Successfully!
              </Text>
            </VStack>
          </ModalHeader>
          <ModalCloseButton color="white" />
          
          <ModalBody py={8} textAlign="center">
            <VStack spacing={4}>
              <Icon as={Mail} w={12} h={12} color="purple.500" />
              <Heading size="md" color="gray.700">
                We're excited to help you!
              </Heading>
              <Text color="gray.600" fontSize="lg" lineHeight="1.6">
                Clento AI sales executive will shortly reach out to you on your email
              </Text>
              <Box 
                bg="purple.50" 
                p={4} 
                borderRadius="lg" 
                border="1px solid" 
                borderColor="purple.200"
                w="full"
              >
                <Text fontSize="sm" color="purple.700" fontWeight="medium">
                  📧 Expected response time: Within 24 hours
                </Text>
              </Box>
            </VStack>
          </ModalBody>

          <ModalFooter justifyContent="center" pb={6}>
            <GradientButton onClick={handleModalClose} size="lg" w="full">
              Got it, thanks!
            </GradientButton>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </DashboardLayout>
  )
} 