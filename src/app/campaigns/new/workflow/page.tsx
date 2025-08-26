'use client'

import React, { useState, useEffect, useCallback } from 'react'
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
} from '@chakra-ui/react'
import { keyframes } from '@emotion/react'
import {
    ChevronRightIcon,
} from '@chakra-ui/icons'
import { CampaignStepper } from '@/components/ui/CampaignStepper'
import { GradientButton } from '@/components/ui/GradientButton'
import { useRouter } from 'next/navigation'
import {
    FiPlay,
    FiSettings,
} from 'react-icons/fi'
import { createCustomToast } from '@/lib/utils/custom-toast'
import WorkflowBuilder from '@/components/workflow/WorkflowBuilder'
import { FlowData } from '@/components/workflow/types/WorkflowTypes'

// Animations
const glow = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(102, 126, 234, 0.3); }
  50% { box-shadow: 0 0 30px rgba(102, 126, 234, 0.5); }
`

// Import the actual sample flow data
import sampleFlowData from '../../../../../sample-flow.json';

// Sample workflow data for demonstration (using actual sample-flow.json)
const sampleWorkflowData: FlowData = sampleFlowData as FlowData;

export default function WorkflowPage() {
    const router = useRouter()
    const toast = useToast()
    const customToast = createCustomToast(toast)
    const [currentFlow, setCurrentFlow] = useState<FlowData | undefined>(undefined)
    const [validationState, setValidationState] = useState({
        isValid: true,
        errors: [] as string[],
        warnings: [] as string[]
    })

    // Enhanced color values for glassmorphism
    const bgGradient = useColorModeValue(
        'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        'linear-gradient(135deg, #4c1d95 0%, #5b21b6 50%, #7c3aed 100%)'
    )

    useEffect(() => {
        // Load saved workflow data
        const savedData = localStorage.getItem('campaignWorkflow')
        if (savedData) {
            try {
            const parsed = JSON.parse(savedData)
                if (parsed.flowData) {
                    setCurrentFlow(parsed.flowData)
                } else {
                    // Load sample data for first-time users
                    setCurrentFlow(sampleWorkflowData)
                }
            } catch (error) {
                console.error('Failed to load saved workflow:', error)
                setCurrentFlow(sampleWorkflowData)
            }
        } else {
            // Load sample data for first-time users
            setCurrentFlow(sampleWorkflowData)
        }
    }, [])

    const handleSaveWorkflow = useCallback(async (flowData: FlowData) => {
        try {
            // Save to localStorage for draft state
            const workflowData = {
                flowData,
                timestamp: new Date().toISOString()
            }
            localStorage.setItem('campaignWorkflow', JSON.stringify(workflowData))
            setCurrentFlow(flowData)

            // If we have a campaign ID, also save to GCS
            const campaignId = localStorage.getItem('currentCampaignId')
            if (campaignId) {
                console.log('🔄 Saving workflow to GCS for campaign:', campaignId)
                
                const response = await fetch(`/api/campaigns/${campaignId}/workflow`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ workflow: flowData }),
                })

                if (!response.ok) {
                    const errorData = await response.json()
                    throw new Error(errorData.error || 'Failed to save workflow to cloud storage')
                }

                const result = await response.json()
                console.log('✅ Workflow saved to GCS:', result)

            customToast.success({
                title: 'Workflow Saved',
                    description: 'Your campaign workflow has been saved to cloud storage.',
                })
            } else {
                customToast.success({
                    title: 'Workflow Draft Saved',
                    description: 'Your workflow draft has been saved locally.',
                })
            }
        } catch (error: any) {
            console.error('Error saving workflow:', error)
            customToast.error({
                title: 'Save Failed',
                description: error.message || 'Failed to save workflow. Please try again.',
            })
        }
    }, [])

    const handleValidationChange = useCallback((isValid: boolean, errors: string[], warnings: string[]) => {
        setValidationState({ isValid, errors, warnings })
    }, [])

    const handleContinue = () => {
        if (currentFlow) {
            handleSaveWorkflow(currentFlow)
        }
        router.push('/campaigns/new/launch')
    }

    const handleBack = () => {
        router.push('/campaigns/new/outreach')
    }

    const handleLoadSample = () => {
        setCurrentFlow(sampleWorkflowData)
    }

    const handleStartFresh = () => {
        setCurrentFlow(undefined)
    }

    return (
        <Box
            minH="100vh"
            bg={bgGradient}
            position="relative"
            overflow="hidden"
        >
            {/* Animated background elements */}
            <Box
                position="absolute"
                top="-50%"
                left="-50%"
                width="200%"
                height="200%"
                opacity="0.1"
                backgroundImage="radial-gradient(circle at 25% 25%, white 2px, transparent 2px)"
                backgroundSize="50px 50px"
            />

            <Container maxW="7xl" py={8} position="relative" zIndex="1">
                <VStack spacing={8} align="stretch">
                    <CampaignStepper currentStep={4} />

                    {/* Header */}
                    <Box textAlign="center" mb={8}>
                        <Heading
                            as="h1"
                            size="2xl"
                            mb={4}
                            bgGradient="linear(to-r, white, purple.100)"
                            bgClip="text"
                            fontWeight="800"
                            letterSpacing="-0.02em"
                            animation={`${glow} 2s ease-in-out infinite`}
                        >
                            Workflow Designer
                        </Heading>
                    </Box>

                    {/* Quick Actions */}
                    <HStack justify="center" spacing={4} mb={4}>
                        <Button
                            onClick={handleLoadSample}
                            leftIcon={<FiSettings />}
                            size="sm"
                            bg="whiteAlpha.200"
                            color="white"
                            borderColor="whiteAlpha.300"
                            borderWidth="1px"
                            _hover={{
                                bg: 'whiteAlpha.300',
                                borderColor: 'whiteAlpha.400'
                            }}
                        >
                            Load Sample
                        </Button>
                        <Button
                            onClick={handleStartFresh}
                            leftIcon={<FiPlay />}
                            size="sm"
                            bg="whiteAlpha.200"
                                    color="white"
                            borderColor="whiteAlpha.300"
                            borderWidth="1px"
                                        _hover={{
                                bg: 'whiteAlpha.300',
                                borderColor: 'whiteAlpha.400'
                            }}
                        >
                            Start Fresh
                        </Button>
                                                </HStack>

                    {/* Validation Status */}
                    {(!validationState.isValid || validationState.warnings.length > 0) && (
                        <Box
                            bg={validationState.isValid ? 'yellow.100' : 'red.100'}
                            color={validationState.isValid ? 'yellow.800' : 'red.800'}
                            p={4}
                            borderRadius="lg"
                            border="1px solid"
                            borderColor={validationState.isValid ? 'yellow.300' : 'red.300'}
                        >
                            {!validationState.isValid && (
                                <Box mb={2}>
                                    <Text fontWeight="bold">
                                        {validationState.errors.length} Error(s):
                                    </Text>
                                    {validationState.errors.map((error, index) => (
                                        <Text key={index} fontSize="sm">• {error}</Text>
                                    ))}
                                        </Box>
                            )}
                            
                            {validationState.warnings.length > 0 && (
                                <Box>
                                    <Text fontWeight="bold">
                                        {validationState.warnings.length} Warning(s):
                                                                        </Text>
                                    {validationState.warnings.map((warning, index) => (
                                        <Text key={index} fontSize="sm">• {warning}</Text>
                                    ))}
                                </Box>
                            )}
                        </Box>
                    )}

                    {/* Workflow Builder */}
                    <Box
                        height="600px"
                            borderRadius="2xl"
                        overflow="hidden"
                            border="1px solid"
                            borderColor="whiteAlpha.200"
                        bg="white"
                            boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                        >
                        <WorkflowBuilder
                            initialFlow={currentFlow}
                            onSave={handleSaveWorkflow}
                            onValidationChange={handleValidationChange}
                            className="h-full"
                        />
                    </Box>

                    {/* Navigation */}
                    <HStack justify="space-between" pt={4}>
                        <Button
                            onClick={handleBack}
                            leftIcon={<ChevronRightIcon transform="rotate(180deg)" />}
                            size="lg"
                            bg="white"
                            color="purple.600"
                            borderColor="purple.300"
                            borderWidth="2px"
                            variant="outline"
                            _hover={{
                                bg: 'purple.50',
                                borderColor: 'purple.400',
                                transform: 'translateY(-2px)',
                                shadow: 'lg',
                            }}
                            _active={{
                                bg: 'purple.100'
                            }}
                            transition="all 0.3s ease"
                            fontWeight="600"
                            minW="160px"
                        >
                            Back to Outreach
                        </Button>

                            <GradientButton
                                onClick={handleContinue}
                            isDisabled={!validationState.isValid}
                                rightIcon={<FiPlay />}
                                size="lg"
                                _hover={{
                                    transform: 'translateY(-2px)',
                                    shadow: 'xl',
                                }}
                                transition="all 0.3s ease"
                                minW="180px"
                            >
                                🚀 Launch Campaign
                            </GradientButton>
                    </HStack>
                </VStack>
            </Container>
        </Box>
    )
}