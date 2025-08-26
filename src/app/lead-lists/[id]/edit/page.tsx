'use client'

import { useUser } from '@clerk/nextjs'
import { useOrganization } from '@clerk/nextjs'
import {
    Box,
    Heading,
    Text,
    VStack,
    HStack,
    Input,
    useColorModeValue,
    Spinner,
    Alert,
    AlertIcon,
    Card,
    Button,
    useToast,
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    FormControl,
    FormLabel,
    Textarea,
    Select,
    Divider,
    Step,
    StepDescription,
    StepIcon,
    StepIndicator,
    StepNumber,
    StepSeparator,
    StepStatus,
    StepTitle,
    Stepper,
    useSteps,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableContainer,
    Checkbox,
    Badge,
    Progress,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    useDisclosure
} from '@chakra-ui/react'
import {
    ArrowLeft,
    Upload,
    FileText,
    Download,
    CheckCircle,
    AlertCircle,
    ChevronRight,
    Play,
    Eye
} from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { useDropzone } from 'react-dropzone'

// Internal components
import DashboardLayout from '@/components/layout/DashboardLayout'
import { GradientButton } from '@/components/ui/GradientButton'

// Types
import { 
    LeadListWithAccount, 
    Database,
    CSVPreviewData, 
    CSVColumnMapping,
    UpdateLeadListRequest 
} from '@/types/database'

type UserAccount = Database['public']['Tables']['user_accounts']['Row']

const steps = [
    { title: 'Basic Info', description: 'Edit list details' },
    { title: 'Upload CSV', description: 'Upload your leads file' },
    { title: 'Map Columns', description: 'Map CSV columns to fields' },
    { title: 'Process', description: 'Process and import leads' }
]

export default function EditLeadListPage() {
    const { user, isLoaded } = useUser()
    const { organization } = useOrganization()
    const router = useRouter()
    const params = useParams()
    const toast = useToast()
    const leadListId = params.id as string
    const { isOpen, onOpen, onClose } = useDisclosure()

    const [state, setState] = useState({
        leadList: null as LeadListWithAccount | null,
        accounts: [] as UserAccount[],
        campaigns: [] as any[],
        loading: true,
        error: null as string | null,
        saving: false,
        uploading: false,
        processing: false,
        csvPreview: null as CSVPreviewData | null,
        columnMappings: [] as CSVColumnMapping[],
        formData: {
            name: '',
            description: '',
            connected_account_id: '',
            campaign_id: ''
        }
    })

    const { activeStep, setActiveStep } = useSteps({
        index: 0,
        count: steps.length,
    })

    const cardBg = useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(26, 32, 44, 0.8)')
    const cardBorder = useColorModeValue('rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)')

    // Fetch lead list and accounts
    useEffect(() => {
        const fetchData = async () => {
            if (!user || !leadListId) return

            try {
                // Fetch lead list
                const leadListResponse = await fetch(`/api/lead-lists/${leadListId}`)
                if (!leadListResponse.ok) {
                    throw new Error('Failed to fetch lead list')
                }
                const leadListData = await leadListResponse.json()

                // Fetch accounts
                const params = new URLSearchParams()
                if (organization?.id) {
                    params.append('organizationId', organization.id)
                }
                const accountsResponse = await fetch(`/api/accounts${params.toString() ? `?${params.toString()}` : ''}`)
                if (!accountsResponse.ok) {
                    throw new Error('Failed to fetch accounts')
                }
                const accountsData = await accountsResponse.json()

                // Fetch campaigns
                const campaignsResponse = await fetch(`/api/campaigns${params.toString() ? `?${params.toString()}` : ''}`)
                if (!campaignsResponse.ok) {
                    throw new Error('Failed to fetch campaigns')
                }
                const campaignsData = await campaignsResponse.json()

                setState(prev => ({
                    ...prev,
                    leadList: leadListData.lead_list,
                    accounts: accountsData.accounts || [],
                    campaigns: campaignsData.campaigns || [],
                    formData: {
                        name: leadListData.lead_list.name,
                        description: leadListData.lead_list.description || '',
                        connected_account_id: leadListData.lead_list.connected_account_id || '',
                        campaign_id: leadListData.lead_list.campaign_id || ''
                    },
                    loading: false
                }))

                // If CSV is already uploaded, move to step 2
                if (leadListData.lead_list.csv_file_url) {
                    setActiveStep(2)
                    fetchCSVPreview()
                }

            } catch (err: any) {
                setState(prev => ({
                    ...prev,
                    error: err.message || 'Failed to load data.',
                    loading: false
                }))
            }
        }

        if (isLoaded && user) {
            fetchData()
        }
    }, [isLoaded, user, leadListId, organization?.id])

    const fetchCSVPreview = async () => {
        try {
            const response = await fetch(`/api/lead-lists/${leadListId}/preview`)
            if (!response.ok) return

            const data = await response.json()
            setState(prev => ({
                ...prev,
                csvPreview: data.preview,
                columnMappings: data.column_mappings
            }))
        } catch (error) {
            console.error('Error fetching CSV preview:', error)
        }
    }

    const handleBasicInfoSave = async () => {
        setState(prev => ({ ...prev, saving: true }))

        try {
            const updateData: UpdateLeadListRequest = {
                name: state.formData.name.trim(),
                description: state.formData.description.trim() || undefined,
                connected_account_id: state.formData.connected_account_id || undefined,
                campaign_id: state.formData.campaign_id || undefined
            }

            const response = await fetch(`/api/lead-lists/${leadListId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData),
            })

            if (!response.ok) {
                throw new Error('Failed to update lead list')
            }

            const result = await response.json()
            setState(prev => ({
                ...prev,
                leadList: result.lead_list
            }))

            toast({
                title: 'Updated',
                description: 'Lead list details have been updated.',
                status: 'success',
                duration: 3000,
                isClosable: true,
            })

            setActiveStep(1)

        } catch (error) {
            toast({
                title: 'Update Failed',
                description: 'Failed to update lead list details.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            })
        } finally {
            setState(prev => ({ ...prev, saving: false }))
        }
    }

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0]
        if (!file) return

        setState(prev => ({ ...prev, uploading: true }))

        try {
            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch(`/api/lead-lists/${leadListId}/upload`, {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to upload file')
            }

            const result = await response.json()
            setState(prev => ({
                ...prev,
                leadList: result.lead_list,
                csvPreview: result.preview,
                columnMappings: (result.preview?.headers || []).map((header: string) => ({
                    csv_column: header,
                    mapped_field: 'unmapped',
                    required: false,
                    sample_data: []
                }))
            }))

            toast({
                title: 'File Uploaded',
                description: 'CSV file has been uploaded successfully.',
                status: 'success',
                duration: 3000,
                isClosable: true,
            })

            setActiveStep(2)

        } catch (error: any) {
            toast({
                title: 'Upload Failed',
                description: error.message || 'Failed to upload CSV file.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            })
        } finally {
            setState(prev => ({ ...prev, uploading: false }))
        }
    }, [leadListId, toast])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/csv': ['.csv'],
            'application/vnd.ms-excel': ['.csv']
        },
        maxFiles: 1,
        maxSize: 10 * 1024 * 1024 // 10MB
    })

    const handleColumnMappingChange = (csvColumn: string, mappedField: string) => {
        setState(prev => ({
            ...prev,
            columnMappings: prev.columnMappings.map(mapping =>
                mapping.csv_column === csvColumn
                    ? { ...mapping, mapped_field: mappedField }
                    : mapping
            )
        }))
    }

    const handleProcessCSV = async () => {
        setState(prev => ({ ...prev, processing: true }))

        try {
            const response = await fetch(`/api/lead-lists/${leadListId}/process`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    column_mapping: state.columnMappings,
                    skip_duplicates: true,
                    validate_emails: false
                }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to start processing')
            }

            toast({
                title: 'Processing Started',
                description: 'Your CSV is being processed in the background.',
                status: 'success',
                duration: 5000,
                isClosable: true,
            })

            setActiveStep(3)

            // Redirect to detail page to monitor progress
            setTimeout(() => {
                router.push(`/lead-lists/${leadListId}`)
            }, 2000)

        } catch (error: any) {
            toast({
                title: 'Processing Failed',
                description: error.message || 'Failed to start CSV processing.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            })
        } finally {
            setState(prev => ({ ...prev, processing: false }))
        }
    }

    const handleDownloadSample = async () => {
        try {
            const response = await fetch('/api/lead-lists/sample-csv')
            if (!response.ok) throw new Error('Failed to download sample CSV')

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'sample_leads.csv'
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)

        } catch (error) {
            toast({
                title: 'Download Failed',
                description: 'Failed to download sample CSV.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            })
        }
    }

    if (!isLoaded || state.loading) {
        return (
            <DashboardLayout>
                <VStack spacing={6} justify="center" h="400px">
                    <Spinner size="xl" color="purple.500" />
                    <Text>Loading lead list...</Text>
                </VStack>
            </DashboardLayout>
        )
    }

    if (state.error || !state.leadList) {
        return (
            <DashboardLayout>
                <VStack spacing={6} align="center" py={12}>
                    <Alert status="error" maxW="md">
                        <AlertIcon />
                        {state.error || 'Lead list not found'}
                    </Alert>
                    <Button leftIcon={<ArrowLeft size={16} />} onClick={() => router.push('/lead-lists')}>
                        Back to Lead Lists
                    </Button>
                </VStack>
            </DashboardLayout>
        )
    }

    const availableFields = [
        { value: 'unmapped', label: 'Do not import' },
        { value: 'first_name', label: 'First Name' },
        { value: 'last_name', label: 'Last Name' },
        { value: 'full_name', label: 'Full Name' },
        { value: 'email', label: 'Email Address' },
        { value: 'company', label: 'Company' },
        { value: 'title', label: 'Job Title' },
        { value: 'phone', label: 'Phone Number' },
        { value: 'linkedin_url', label: 'LinkedIn URL' },
        { value: 'location', label: 'Location' },
        { value: 'industry', label: 'Industry' }
    ]

    return (
        <DashboardLayout>
            <VStack spacing={8} align="stretch">
                {/* Breadcrumb */}
                <Breadcrumb spacing="8px" separator={<ChevronRight size={16} />}>
                    <BreadcrumbItem>
                        <BreadcrumbLink onClick={() => router.push('/lead-lists')}>
                            Lead Lists
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbItem>
                        <BreadcrumbLink onClick={() => router.push(`/lead-lists/${leadListId}`)}>
                            {state.leadList.name}
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbItem isCurrentPage>
                        <Text>Edit</Text>
                    </BreadcrumbItem>
                </Breadcrumb>

                {/* Header */}
                <HStack justify="space-between" align="center">
                    <VStack spacing={1} align="start">
                        <Heading 
                            size="xl" 
                            bgGradient="linear(to-r, purple.400, blue.400)"
                            bgClip="text"
                            fontWeight="bold"
                        >
                            Edit Lead List
                        </Heading>
                        <Text color="gray.600" fontSize="lg">
                            Update your lead list details and upload CSV data
                        </Text>
                    </VStack>
                    <Button
                        leftIcon={<ArrowLeft size={16} />}
                        variant="outline"
                        onClick={() => router.push(`/lead-lists/${leadListId}`)}
                    >
                        Back to List
                    </Button>
                </HStack>

                {/* Stepper */}
                <Card 
                    bg={cardBg}
                    backdropFilter="blur(10px)"
                    border="1px solid" 
                    borderColor={cardBorder}
                    borderRadius="xl"
                    p={6}
                >
                    <Stepper index={activeStep} colorScheme="purple">
                        {steps.map((step, index) => (
                            <Step key={index}>
                                <StepIndicator>
                                    <StepStatus
                                        complete={<StepIcon />}
                                        incomplete={<StepNumber />}
                                        active={<StepNumber />}
                                    />
                                </StepIndicator>

                                <Box flexShrink="0">
                                    <StepTitle>{step.title}</StepTitle>
                                    <StepDescription>{step.description}</StepDescription>
                                </Box>

                                <StepSeparator />
                            </Step>
                        ))}
                    </Stepper>
                </Card>

                {/* Step Content */}
                <Card 
                    bg={cardBg}
                    backdropFilter="blur(10px)"
                    border="1px solid" 
                    borderColor={cardBorder}
                    borderRadius="xl"
                    p={8}
                >
                    {/* Step 0: Basic Info */}
                    {activeStep === 0 && (
                        <VStack spacing={6} align="stretch">
                            <Text fontSize="lg" fontWeight="semibold">Update Lead List Details</Text>
                            
                            <FormControl isRequired>
                                <FormLabel>List Name</FormLabel>
                                <Input
                                    value={state.formData.name}
                                    onChange={(e) => setState(prev => ({
                                        ...prev,
                                        formData: { ...prev.formData, name: e.target.value }
                                    }))}
                                    placeholder="Enter lead list name"
                                />
                            </FormControl>

                            <FormControl>
                                <FormLabel>Description</FormLabel>
                                <Textarea
                                    value={state.formData.description}
                                    onChange={(e) => setState(prev => ({
                                        ...prev,
                                        formData: { ...prev.formData, description: e.target.value }
                                    }))}
                                    placeholder="Optional description for this lead list"
                                    rows={3}
                                />
                            </FormControl>

                            <FormControl>
                                <FormLabel>Connected Account</FormLabel>
                                <Select
                                    value={state.formData.connected_account_id}
                                    onChange={(e) => setState(prev => ({
                                        ...prev,
                                        formData: { ...prev.formData, connected_account_id: e.target.value }
                                    }))}
                                    placeholder="Select an account for outreach"
                                >
                                    {state.accounts.filter(acc => acc.connection_status === 'connected').map(account => (
                                        <option key={account.id} value={account.id}>
                                            {account.display_name} ({account.provider})
                                        </option>
                                    ))}
                                </Select>
                                <Text fontSize="sm" color="gray.500" mt={1}>
                                    Connect this list to a social media account for automated outreach
                                </Text>
                            </FormControl>

                            <FormControl>
                                <FormLabel>Campaign (Optional)</FormLabel>
                                <Select
                                    value={state.formData.campaign_id}
                                    onChange={(e) => setState(prev => ({
                                        ...prev,
                                        formData: { ...prev.formData, campaign_id: e.target.value }
                                    }))}
                                    placeholder="Select a campaign for this lead list"
                                >
                                    {state.campaigns.map(campaign => (
                                        <option key={campaign.id} value={campaign.id}>
                                            {campaign.name}
                                        </option>
                                    ))}
                                </Select>
                                <Text fontSize="sm" color="gray.500" mt={1}>
                                    Associate this lead list with a specific campaign for better organization
                                </Text>
                            </FormControl>

                            <HStack justify="flex-end" pt={4}>
                                <GradientButton
                                    onClick={handleBasicInfoSave}
                                    isLoading={state.saving}
                                    loadingText="Saving..."
                                    isDisabled={!state.formData.name.trim()}
                                >
                                    Save & Continue
                                </GradientButton>
                            </HStack>
                        </VStack>
                    )}

                    {/* Step 1: Upload CSV */}
                    {activeStep === 1 && (
                        <VStack spacing={6} align="stretch">
                            <HStack justify="space-between" align="center">
                                <Text fontSize="lg" fontWeight="semibold">Upload CSV File</Text>
                                <Button
                                    leftIcon={<Download size={16} />}
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDownloadSample}
                                >
                                    Download Sample
                                </Button>
                            </HStack>

                            <Box
                                {...getRootProps()}
                                p={12}
                                border="2px dashed"
                                borderColor={isDragActive ? "purple.400" : "gray.300"}
                                borderRadius="xl"
                                bg={isDragActive ? "purple.50" : "gray.50"}
                                cursor="pointer"
                                transition="all 0.2s ease"
                                _hover={{ borderColor: "purple.400", bg: "purple.50" }}
                            >
                                <input {...getInputProps()} />
                                <VStack spacing={4}>
                                    <Upload size={48} color={isDragActive ? "#805AD5" : "#A0AEC0"} />
                                    <VStack spacing={2}>
                                        <Text fontSize="lg" fontWeight="semibold" color={isDragActive ? "purple.600" : "gray.600"}>
                                            {isDragActive ? "Drop your CSV file here" : "Drag & drop your CSV file here"}
                                        </Text>
                                        <Text fontSize="sm" color="gray.500">
                                            or click to browse files (max 10MB)
                                        </Text>
                                    </VStack>
                                </VStack>
                            </Box>

                            {state.uploading && (
                                <VStack spacing={3}>
                                    <Progress size="lg" isIndeterminate colorScheme="purple" w="100%" />
                                    <Text color="gray.600">Uploading and validating your CSV file...</Text>
                                </VStack>
                            )}

                            <Alert status="info">
                                <AlertIcon />
                                <VStack align="start" spacing={1}>
                                    <Text fontWeight="semibold">CSV Requirements:</Text>
                                    <Text fontSize="sm">
                                        • First row must contain column headers
                                        • At least one column with email addresses or names
                                        • Maximum file size: 10MB
                                        • Supported format: CSV (.csv)
                                    </Text>
                                </VStack>
                            </Alert>
                        </VStack>
                    )}

                    {/* Step 2: Map Columns */}
                    {activeStep === 2 && state.csvPreview && (
                        <VStack spacing={6} align="stretch">
                            <HStack justify="space-between" align="center">
                                <Text fontSize="lg" fontWeight="semibold">Map CSV Columns</Text>
                                <Button
                                    leftIcon={<Eye size={16} />}
                                    variant="outline"
                                    size="sm"
                                    onClick={onOpen}
                                >
                                    Preview Data
                                </Button>
                            </HStack>

                            <Text color="gray.600">
                                Map your CSV columns to the appropriate lead fields. Required fields are marked with an asterisk.
                            </Text>

                            <TableContainer>
                                <Table variant="simple">
                                    <Thead>
                                        <Tr>
                                            <Th>CSV Column</Th>
                                            <Th>Sample Data</Th>
                                            <Th>Map to Field</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {(state.columnMappings || []).map((mapping, index) => (
                                            <Tr key={mapping.csv_column}>
                                                <Td fontWeight="medium">{mapping.csv_column}</Td>
                                                <Td color="gray.600" fontSize="sm">
                                                    {state.csvPreview?.rows[0]?.[index] || '-'}
                                                </Td>
                                                <Td>
                                                    <Select
                                                        value={mapping.mapped_field}
                                                        onChange={(e) => handleColumnMappingChange(mapping.csv_column, e.target.value)}
                                                        size="sm"
                                                    >
                                                        {availableFields.map(field => (
                                                            <option key={field.value} value={field.value}>
                                                                {field.label}
                                                            </option>
                                                        ))}
                                                    </Select>
                                                </Td>
                                            </Tr>
                                        ))}
                                    </Tbody>
                                </Table>
                            </TableContainer>

                            <Alert status="warning">
                                <AlertIcon />
                                <Text fontSize="sm">
                                    Make sure to map at least one column to either "Email Address" or "Full Name" to successfully import leads.
                                </Text>
                            </Alert>

                            <HStack justify="flex-end" pt={4}>
                                <Button
                                    variant="outline"
                                    onClick={() => setActiveStep(1)}
                                >
                                    Back
                                </Button>
                                <GradientButton
                                    leftIcon={<Play size={16} />}
                                    onClick={handleProcessCSV}
                                    isLoading={state.processing}
                                    loadingText="Processing..."
                                >
                                    Process CSV
                                </GradientButton>
                            </HStack>
                        </VStack>
                    )}

                    {/* Step 3: Processing */}
                    {activeStep === 3 && (
                        <VStack spacing={6} align="center" py={8}>
                            <CheckCircle size={64} color="#48BB78" />
                            <VStack spacing={2} textAlign="center">
                                <Text fontSize="xl" fontWeight="semibold">Processing Started!</Text>
                                <Text color="gray.600">
                                    Your CSV file is being processed in the background. 
                                    You'll be redirected to the lead list details page to monitor progress.
                                </Text>
                            </VStack>
                            <Progress size="lg" isIndeterminate colorScheme="green" w="300px" />
                        </VStack>
                    )}
                </Card>

                {/* CSV Preview Modal */}
                <Modal isOpen={isOpen} onClose={onClose} size="6xl">
                    <ModalOverlay />
                    <ModalContent>
                        <ModalHeader>CSV Data Preview</ModalHeader>
                        <ModalCloseButton />
                        <ModalBody>
                            {state.csvPreview && (
                                <VStack spacing={4} align="stretch">
                                    <Text color="gray.600">
                                        Showing first {state.csvPreview.sample_size} rows of {state.csvPreview.total_rows} total rows
                                    </Text>
                                    <TableContainer maxH="400px" overflowY="auto">
                                        <Table variant="simple" size="sm">
                                            <Thead position="sticky" top={0} bg="white" zIndex={1}>
                                                <Tr>
                                                    {state.csvPreview.headers.map((header, index) => (
                                                        <Th key={index}>{header}</Th>
                                                    ))}
                                                </Tr>
                                            </Thead>
                                            <Tbody>
                                                {state.csvPreview.rows.map((row, rowIndex) => (
                                                    <Tr key={rowIndex}>
                                                        {row.map((cell, cellIndex) => (
                                                            <Td key={cellIndex} fontSize="sm">
                                                                {cell || '-'}
                                                            </Td>
                                                        ))}
                                                    </Tr>
                                                ))}
                                            </Tbody>
                                        </Table>
                                    </TableContainer>
                                </VStack>
                            )}
                        </ModalBody>
                        <ModalFooter>
                            <Button onClick={onClose}>Close</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </VStack>
        </DashboardLayout>
    )
}
