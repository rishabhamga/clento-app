'use client'

import {
    Box,
    Container,
    VStack,
    HStack,
    Text,
    Card,
    CardBody,
    Badge,
    useColorModeValue,
} from '@chakra-ui/react'
import { keyframes } from '@emotion/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GradientButton } from '@/components/ui/GradientButton'
import { Enhanced3DStepper } from '@/components/ui/Enhanced3DStepper'

// Enhanced animations
const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
`

const glow = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(102, 126, 234, 0.3); }
  50% { box-shadow: 0 0 30px rgba(102, 126, 234, 0.5); }
`

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`

const campaignSteps = [
    { title: 'Targeting', description: 'Select your target ICP' },
    { title: 'Pitch', description: 'Product/Service analysis' },
    { title: 'Outreach', description: 'Configure outreach settings' },
    { title: 'Workflow', description: 'Design your sequence' },
    { title: 'Launch', description: 'Review and launch campaign' }
]

export default function NewCampaignPage() {
    const [activeStep, setActiveStep] = useState(0)
    const router = useRouter()

    // Enhanced color mode values with 3D styling
    const cardBg = useColorModeValue('rgba(255, 255, 255, 0.9)', 'rgba(26, 32, 44, 0.9)')
    const glassBg = useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(26, 32, 44, 0.8)')
    const borderColor = useColorModeValue('rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)')
    const grayBg = useColorModeValue('rgba(247, 250, 252, 0.9)', 'rgba(45, 55, 72, 0.9)')
    const gradientBg = useColorModeValue(
        'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        'linear-gradient(135deg, #4c1d95 0%, #5b21b6 50%, #7c3aed 100%)'
    )
    const accentGradient = useColorModeValue(
        'linear-gradient(45deg, #667eea, #764ba2)',
        'linear-gradient(45deg, #5b21b6, #7c3aed)'
    )

    const handleStepClick = (stepIndex: number) => {
        // Only allow navigation to completed or current step
        if (stepIndex <= activeStep) {
            setActiveStep(stepIndex)
        }
    }

    const handleStartTargeting = () => {
        router.push('/campaigns/new/targeting/b2b-filters')
    }

    return (
        <Box
            minH="100vh"
            bg={gradientBg}
            position="relative"
            overflow="hidden"
        >
            {/* Animated background elements */}
            <Box
                position="absolute"
                top="10%"
                right="10%"
                w="300px"
                h="300px"
                borderRadius="50%"
                bg={accentGradient}
                opacity={0.1}
                animation={`${float} 6s ease-in-out infinite`}
                zIndex={0}
            />
            <Box
                position="absolute"
                bottom="20%"
                left="5%"
                w="200px"
                h="200px"
                borderRadius="50%"
                bg={accentGradient}
                opacity={0.08}
                animation={`${float} 8s ease-in-out infinite reverse`}
                zIndex={0}
            />

            <Container maxW="7xl" py={8} position="relative" zIndex={1}>
                <VStack spacing={8} align="stretch">
                    {/* Header */}
                    <Box textAlign="center">
                        <Text
                            fontSize="4xl"
                            fontWeight="bold"
                            mb={2}
                            color={useColorModeValue('white', 'gray.100')}
                            textShadow="0 2px 4px rgba(0,0,0,0.3)"
                        >
                            Create New Campaign
                        </Text>
                        <Text
                            fontSize="xl"
                            color={useColorModeValue('whiteAlpha.900', 'gray.200')}
                            maxW="2xl"
                            mx="auto"
                            textShadow="0 1px 2px rgba(0,0,0,0.2)"
                        >
                            Let your AI SDR find and engage prospects automatically with personalized outreach
                        </Text>
                    </Box>

                    {/* Progress Stepper */}
                    <Enhanced3DStepper
                        currentStep={activeStep}
                        steps={campaignSteps}
                        variant="detailed"
                        colorScheme="purple"
                        showProgress={true}
                        animated={true}
                    />

                    {/* Current Step Content */}
                    <Card
                        bg={cardBg}
                        backdropFilter="blur(10px)"
                        border="1px solid"
                        borderColor={borderColor}
                        shadow="xl"
                        borderRadius="2xl"
                        overflow="hidden"
                        animation={`${glow} 4s ease-in-out infinite`}
                    >
                        <CardBody p={12}>
                            {activeStep === 0 && (
                                <VStack spacing={8} align="center" textAlign="center">
                                    <Box>
                                        <Text fontSize="3xl" fontWeight="bold" mb={4} color={useColorModeValue('gray.800', 'white')}>
                                            Step 1: Select Your Target Audience
                                        </Text>
                                        <Text fontSize="lg" color={useColorModeValue('gray.700', 'gray.300')} mb={8} maxW="2xl">
                                            Choose your lead source and define your ideal customer profile with advanced filtering
                                        </Text>
                                    </Box>

                                    <VStack spacing={4} align="start" w="full" maxW="md">
                                        <HStack spacing={3}>
                                            <Box w={2} h={2} bg="purple.500" borderRadius="full" />
                                            <Text color={useColorModeValue('gray.700', 'gray.300')}>300M+ verified B2B contacts</Text>
                                        </HStack>
                                        <HStack spacing={3}>
                                            <Box w={2} h={2} bg="purple.500" borderRadius="full" />
                                            <Text color={useColorModeValue('gray.700', 'gray.300')}>Advanced filtering by title, industry, company size</Text>
                                        </HStack>
                                        <HStack spacing={3}>
                                            <Box w={2} h={2} bg="purple.500" borderRadius="full" />
                                            <Text color={useColorModeValue('gray.700', 'gray.300')}>Real-time contact verification</Text>
                                        </HStack>
                                        <HStack spacing={3}>
                                            <Box w={2} h={2} bg="purple.500" borderRadius="full" />
                                            <Text color={useColorModeValue('gray.700', 'gray.300')}>Intent data and technographics</Text>
                                        </HStack>
                                    </VStack>

                                    <Badge
                                        colorScheme="purple"
                                        px={6}
                                        py={3}
                                        fontSize="md"
                                        borderRadius="full"
                                        bg="purple.500"
                                        color="white"
                                        boxShadow="0 4px 12px rgba(128, 90, 213, 0.4)"
                                    >
                                        AI-Powered Targeting
                                    </Badge>

                                    <GradientButton
                                        size="lg"
                                        onClick={handleStartTargeting}
                                        mt={6}
                                        px={12}
                                        py={6}
                                        fontSize="lg"
                                        _hover={{
                                            transform: 'translateY(-2px)',
                                            shadow: 'xl',
                                        }}
                                        transition="all 0.3s ease"
                                    >
                                        Start Targeting
                                    </GradientButton>
                                </VStack>
                            )}

                            {activeStep === 1 && (
                                <VStack spacing={8} align="center" textAlign="center">
                                    <Box>
                                        <Text fontSize="3xl" fontWeight="bold" mb={4} color={useColorModeValue('gray.800', 'white')}>
                                            Step 2: AI Website Analysis & Pitch Creation
                                        </Text>
                                        <Text fontSize="lg" color={useColorModeValue('gray.700', 'gray.300')} mb={8} maxW="2xl">
                                            Our AI will analyze your website to create personalized messaging that resonates
                                        </Text>
                                    </Box>

                                    <Badge
                                        colorScheme="gray"
                                        px={6}
                                        py={3}
                                        fontSize="md"
                                        borderRadius="full"
                                        bg="gray.500"
                                        color="white"
                                    >
                                        🤖 Complete Previous Step
                                    </Badge>

                                    <Text color={useColorModeValue('gray.600', 'gray.400')} fontSize="lg">
                                        Complete Step 1 to unlock this feature
                                    </Text>
                                </VStack>
                            )}

                            {activeStep === 2 && (
                                <VStack spacing={8} align="center" textAlign="center">
                                    <Box>
                                        <Text fontSize="3xl" fontWeight="bold" mb={4} color={useColorModeValue('gray.800', 'white')}>
                                            Step 3: Outreach Configuration
                                        </Text>
                                        <Text fontSize="lg" color={useColorModeValue('gray.700', 'gray.300')} mb={8} maxW="2xl">
                                            Configure your outreach settings and personalization options for maximum impact
                                        </Text>
                                    </Box>

                                    <Badge
                                        colorScheme="gray"
                                        px={6}
                                        py={3}
                                        fontSize="md"
                                        borderRadius="full"
                                        bg="gray.500"
                                        color="white"
                                    >
                                        🤖 Complete Previous Steps
                                    </Badge>

                                    <Text color={useColorModeValue('gray.600', 'gray.400')} fontSize="lg">
                                        Complete previous steps to unlock this feature
                                    </Text>
                                </VStack>
                            )}

                            {activeStep === 3 && (
                                <VStack spacing={8} align="center" textAlign="center">
                                    <Box>
                                        <Text fontSize="3xl" fontWeight="bold" mb={4} color={useColorModeValue('gray.800', 'white')}>
                                            Step 4: Workflow Design
                                        </Text>
                                        <Text fontSize="lg" color={useColorModeValue('gray.700', 'gray.300')} mb={8} maxW="2xl">
                                            Design your multi-channel outreach sequence for optimal engagement and response rates
                                        </Text>
                                    </Box>

                                    <Badge
                                        colorScheme="gray"
                                        px={6}
                                        py={3}
                                        fontSize="md"
                                        borderRadius="full"
                                        bg="gray.500"
                                        color="white"
                                    >
                                        Complete Previous Steps
                                    </Badge>

                                    <Text color={useColorModeValue('gray.600', 'gray.400')} fontSize="lg">
                                        Complete previous steps to unlock this feature
                                    </Text>
                                </VStack>
                            )}

                            {activeStep === 4 && (
                                <VStack spacing={8} align="center" textAlign="center">
                                    <Box>
                                        <Text fontSize="3xl" fontWeight="bold" mb={4} color={useColorModeValue('gray.800', 'white')}>
                                            Step 5: Launch Campaign
                                        </Text>
                                        <Text fontSize="lg" color={useColorModeValue('gray.700', 'gray.300')} mb={8} maxW="2xl">
                                            Review your campaign settings and launch your AI-powered outreach
                                        </Text>
                                    </Box>

                                    <Badge
                                        colorScheme="gray"
                                        px={6}
                                        py={3}
                                        fontSize="md"
                                        borderRadius="full"
                                        bg="gray.500"
                                        color="white"
                                    >
                                        Complete Previous Steps
                                    </Badge>

                                    <Text color={useColorModeValue('gray.600', 'gray.400')} fontSize="lg">
                                        Complete previous steps to unlock this feature
                                    </Text>
                                </VStack>
                            )}
                        </CardBody>
                    </Card>
                </VStack>
            </Container>
        </Box>
    )
}