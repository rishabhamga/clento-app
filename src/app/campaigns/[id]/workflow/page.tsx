'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
    Box,
    Container,
    VStack,
    HStack,
    Text,
    Heading,
    useColorModeValue,
    useToast,
    Button,
    Spinner,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    useDisclosure,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    IconButton,
} from '@chakra-ui/react'
import { ArrowBackIcon, DownloadIcon, AttachmentIcon } from '@chakra-ui/icons'
import { createCustomToast } from '@/lib/utils/custom-toast'
import WorkflowBuilder from '@/components/workflow/WorkflowBuilder'
import { FlowData } from '@/components/workflow/types/WorkflowTypes'
import { useWorkflowStorage } from '@/hooks/useWorkflowStorage'

export default function CampaignWorkflowPage() {
    const params = useParams()
    const router = useRouter()
    const toast = useToast()
    const customToast = createCustomToast(toast)
    const { isOpen, onOpen, onClose } = useDisclosure()
    
    const [currentFlow, setCurrentFlow] = useState<FlowData | undefined>(undefined)
    const [isLoading, setIsLoading] = useState(true)
    const [campaignName, setCampaignName] = useState<string>('')
    const [validationState, setValidationState] = useState({
        isValid: true,
        errors: [] as string[],
        warnings: [] as string[]
    })

    const { loading: storageLoading, error: storageError, saveWorkflow, loadWorkflow } = useWorkflowStorage()

    // Enhanced color values for glassmorphism
    const bgGradient = useColorModeValue(
        'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        'linear-gradient(135deg, #4c1d95 0%, #5b21b6 50%, #7c3aed 100%)'
    )
    
    const glassBg = useColorModeValue(
        'rgba(255, 255, 255, 0.8)',
        'rgba(26, 32, 44, 0.8)'
    )
    
    const borderColor = useColorModeValue(
        'rgba(255, 255, 255, 0.2)',
        'rgba(255, 255, 255, 0.1)'
    )

    // Load workflow data for the campaign
    useEffect(() => {
        const fetchCampaignWorkflow = async () => {
            if (!params.id) return

            try {
                setIsLoading(true)

                // First, get campaign details
                const campaignResponse = await fetch(`/api/campaigns/${params.id}`)
                if (!campaignResponse.ok) {
                    throw new Error('Campaign not found')
                }

                const campaignData = await campaignResponse.json()
                setCampaignName(campaignData.campaign?.name || 'Unnamed Campaign')

                // Load workflow using the hook
                const workflowData = await loadWorkflow(params.id as string)
                
                if (workflowData) {
                    setCurrentFlow(workflowData)
                    console.log('✅ Loaded existing workflow for campaign:', params.id)
                } else {
                    console.log('ℹ️ No workflow found for campaign, starting with empty workflow')
                    // Start with a basic workflow structure
                    setCurrentFlow({
                        nodes: [],
                        edges: [],
                        timestamp: new Date().toISOString()
                    })
                }
            } catch (error: any) {
                console.error('❌ Error loading campaign workflow:', error)
                customToast.error({
                    title: 'Failed to Load Workflow',
                    description: error.message || 'Could not load campaign workflow'
                })
            } finally {
                setIsLoading(false)
            }
        }

        fetchCampaignWorkflow()
    }, [params.id, loadWorkflow])

    const handleSaveWorkflow = useCallback(async (flowData: FlowData) => {
        if (!params.id) return

        try {
            const success = await saveWorkflow(params.id as string, flowData)
            
            if (success) {
                setCurrentFlow(flowData)
                customToast.success({
                    title: 'Workflow Saved',
                    description: 'Your campaign workflow has been saved successfully.'
                })
            } else {
                throw new Error(storageError || 'Failed to save workflow')
            }
        } catch (error: any) {
            console.error('Error saving workflow:', error)
            customToast.error({
                title: 'Save Failed',
                description: error.message || 'Failed to save workflow. Please try again.'
            })
        }
    }, [params.id, saveWorkflow, storageError])

    const handleValidationChange = useCallback((isValid: boolean, errors: string[], warnings: string[]) => {
        setValidationState({ isValid, errors, warnings })
    }, [])

    const handleExportWorkflow = useCallback(() => {
        if (!currentFlow) return

        const dataStr = JSON.stringify(currentFlow, null, 2)
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
        
        const exportFileDefaultName = `workflow-${campaignName}-${new Date().toISOString().split('T')[0]}.json`
        
        const linkElement = document.createElement('a')
        linkElement.setAttribute('href', dataUri)
        linkElement.setAttribute('download', exportFileDefaultName)
        linkElement.click()
    }, [currentFlow, campaignName])

    const handleImportWorkflow = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const importedWorkflow = JSON.parse(e.target?.result as string) as FlowData
                
                // Validate the imported workflow structure
                if (!importedWorkflow.nodes || !importedWorkflow.edges) {
                    throw new Error('Invalid workflow file format')
                }

                setCurrentFlow(importedWorkflow)
                customToast.success({
                    title: 'Workflow Imported',
                    description: 'Workflow has been imported successfully. Remember to save it.'
                })
            } catch (error) {
                console.error('Failed to import workflow:', error)
                customToast.error({
                    title: 'Import Failed',
                    description: 'Failed to import workflow. Please check the file format.'
                })
            }
        }
        reader.readAsText(file)
        
        // Reset input
        event.target.value = ''
    }, [])

    if (isLoading) {
        return (
            <Box
                minH="100vh"
                bg={bgGradient}
                display="flex"
                alignItems="center"
                justifyContent="center"
            >
                <VStack spacing={4}>
                    <Spinner size="xl" color="white" />
                    <Text color="white" fontSize="lg">Loading campaign workflow...</Text>
                </VStack>
            </Box>
        )
    }

    return (
        <Box
            minH="100vh"
            bg={bgGradient}
            position="relative"
            overflow="hidden"
        >
            {/* Background Pattern */}
            <Box
                position="absolute"
                top="0"
                left="0"
                right="0"
                bottom="0"
                opacity="0.1"
                bgImage="radial-gradient(circle at 50% 50%, white 1px, transparent 1px)"
                bgSize="30px 30px"
                pointerEvents="none"
            />

            <Container maxW="8xl" py={4}>
                <VStack spacing={6} align="stretch">
                    {/* Header */}
                    <HStack justify="space-between" align="center">
                        <HStack spacing={4}>
                            <IconButton
                                aria-label="Back to campaign"
                                icon={<ArrowBackIcon />}
                                size="lg"
                                colorScheme="whiteAlpha"
                                variant="ghost"
                                onClick={() => router.push(`/campaigns/${params.id}`)}
                                _hover={{
                                    bg: 'whiteAlpha.200',
                                }}
                            />
                            <VStack align="start" spacing={1}>
                                <Heading size="lg" color="white">
                                    Workflow Editor
                                </Heading>
                                <Text color="whiteAlpha.800" fontSize="md">
                                    {campaignName}
                                </Text>
                            </VStack>
                        </HStack>

                        <HStack spacing={3}>
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleImportWorkflow}
                                style={{ display: 'none' }}
                                id="workflow-import"
                            />
                            <Button
                                leftIcon={<AttachmentIcon />}
                                size="md"
                                colorScheme="whiteAlpha"
                                variant="ghost"
                                onClick={() => document.getElementById('workflow-import')?.click()}
                                _hover={{
                                    bg: 'whiteAlpha.200',
                                }}
                            >
                                Import
                            </Button>
                            <Button
                                leftIcon={<DownloadIcon />}
                                size="md"
                                colorScheme="whiteAlpha"
                                variant="ghost"
                                onClick={handleExportWorkflow}
                                isDisabled={!currentFlow}
                                _hover={{
                                    bg: 'whiteAlpha.200',
                                }}
                            >
                                Export
                            </Button>
                        </HStack>
                    </HStack>

                    {/* Validation Status */}
                    {(!validationState.isValid || validationState.warnings.length > 0) && (
                        <Alert
                            status={validationState.isValid ? 'warning' : 'error'}
                            borderRadius="lg"
                            bg={glassBg}
                            border="1px solid"
                            borderColor={borderColor}
                        >
                            <AlertIcon />
                            <Box>
                                <AlertTitle>
                                    {validationState.isValid ? 'Workflow Warnings' : 'Workflow Errors'}
                                </AlertTitle>
                                <AlertDescription>
                                    {[...validationState.errors, ...validationState.warnings].join(', ')}
                                </AlertDescription>
                            </Box>
                        </Alert>
                    )}

                    {/* Workflow Builder */}
                    <Box
                        h="calc(100vh - 200px)"
                        bg={glassBg}
                        borderRadius="2xl"
                        border="1px solid"
                        borderColor={borderColor}
                        backdropFilter="blur(20px)"
                        overflow="hidden"
                    >
                        {currentFlow ? (
                            <WorkflowBuilder
                                initialFlow={currentFlow}
                                onSave={handleSaveWorkflow}
                                onValidationChange={handleValidationChange}
                                className="h-full"
                            />
                        ) : (
                            <VStack
                                h="full"
                                justify="center"
                                align="center"
                                spacing={4}
                            >
                                <Text fontSize="xl" color="gray.500">
                                    No workflow data available
                                </Text>
                                <Button
                                    colorScheme="purple"
                                    onClick={() => router.refresh()}
                                >
                                    Retry Loading
                                </Button>
                            </VStack>
                        )}
                    </Box>
                </VStack>
            </Container>

            {/* Loading Overlay */}
            {storageLoading && (
                <Box
                    position="fixed"
                    top="0"
                    left="0"
                    right="0"
                    bottom="0"
                    bg="blackAlpha.500"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    zIndex="modal"
                >
                    <VStack spacing={4}>
                        <Spinner size="xl" color="white" />
                        <Text color="white" fontSize="lg">
                            Saving workflow...
                        </Text>
                    </VStack>
                </Box>
            )}
        </Box>
    )
}
