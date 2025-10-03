'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
    Box,
    Container,
    VStack,
    HStack,
    Heading,
    Text,
    Card,
    CardHeader,
    CardBody,
    SimpleGrid,
    Badge,
    Button,
    Spinner,
    Alert,
    AlertIcon,
    useColorModeValue,
    useToast,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    Icon,
    Select,
    Textarea,
    Flex,
    Wrap,
    WrapItem,
    Divider,
    Grid,
    List,
    ListItem,
    ListIcon,
    Tag,
    TagLabel,
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionIcon,
    AccordionPanel,
    Switch,
    FormLabel,
    Slider,
    SliderTrack,
    SliderFilledTrack,
    SliderThumb,
    Checkbox
} from '@chakra-ui/react'
import { keyframes } from '@emotion/react'
import { ArrowLeft, Lock, Target, MessageSquare, Workflow, Rocket, Globe, Edit3, PenTool, Users, Settings2Icon } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { GradientButton } from '@/components/ui/GradientButton'
import { CampaignStepper } from '@/components/ui/CampaignStepper'
import { FiBookOpen, FiGift, FiSettings, FiStar, FiTrendingUp, FiUsers } from 'react-icons/fi'
import { CheckCircleIcon, UpDownIcon, WarningIcon } from '@chakra-ui/icons'
import WorkflowViewer from '../../../components/workflow/WorkflowViewer'

// Enhanced animations matching campaign creation pages
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

interface Campaign {
    id: string
    name: string
    description: string
    status: string
    created_at: string
    sequence_template: string
    settings: any
}

const steps = [
    {
        id: 'targeting',
        title: 'Targeting',
        description: 'Define your ideal prospects',
        icon: Target
    },
    {
        id: 'pitch',
        title: 'Pitch',
        description: 'Create your value proposition',
        icon: MessageSquare
    },
    {
        id: 'outreach',
        title: 'Outreach',
        description: 'Configure messaging',
        icon: MessageSquare
    },
    {
        id: 'workflow',
        title: 'Workflow',
        description: 'Set up sequences',
        icon: Workflow
    },
    {
        id: 'launch',
        title: 'Launch',
        description: 'Start your campaign',
        icon: Rocket
    }
]

export default function CampaignDetailPage() {
    const params = useParams()
    const router = useRouter()
    const toast = useToast()
    const [campaign, setCampaign] = useState<Campaign | null>(null)
    const [loading, setLoading] = useState(true)
    const [currentStep, setCurrentStep] = useState(0)
    const { isOpen, onOpen, onClose } = useDisclosure()
    const personaBg = useColorModeValue('gray.50', 'gray.700')
    const personaBorderColor = useColorModeValue('gray.200', 'gray.600')

    // Enhanced glassmorphism colors matching campaign creation
    const cardBg = useColorModeValue('rgba(255, 255, 255, 0.9)', 'rgba(26, 32, 44, 0.9)')
    const glassBg = useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(26, 32, 44, 0.8)')
    const borderColor = useColorModeValue('rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)')
    const grayBg = useColorModeValue('rgba(247, 250, 252, 0.9)', 'rgba(45, 55, 72, 0.9)')
    const gradientBg = useColorModeValue(
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #4a5568 0%, #2d3748 100%)'
    )
    const accentGradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'

    useEffect(() => {
        const fetchCampaign = async () => {
            try {
                const response = await fetch(`/api/campaigns/view/${params.id}`)
                if (!response.ok) throw new Error('Failed to fetch campaign')

                const data = await response.json()
                setCampaign(data.campaignData)
            } catch (error) {
                console.error('Error fetching campaign:', error)
                toast({
                    title: 'Error',
                    description: 'Failed to load campaign details',
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                })
            } finally {
                setLoading(false)
            }
        }

        if (params.id) {
            fetchCampaign()
        }
    }, [params.id, toast])

    const handleEditAttempt = () => {
        onOpen()
    }

    const renderTargetingContent = () => {
        const targeting = campaign?.settings?.targeting || {}
        const filters = campaign?.settings?.targeting?.filters || {}

        const filterLabels = {
            hasEmail: "Has Email",
            keywords: "Keywords",
            jobTitles: "Job Titles",
            industries: "Industries",
            newsEvents: "News Events",
            revenueMax: "Revenue Max",
            revenueMin: "Revenue Min",
            webTraffic: "Web Traffic",
            jobPostings: "Job Postings",
            seniorities: "Seniorities",
            intentTopics: "Intent Topics",
            technologies: "Technologies",
            fundingStages: "Funding Stages",
            companyDomains: "Company Domains",
            foundedYearMax: "Founded Year Max",
            foundedYearMin: "Founded Year Min",
            technologyUids: "Technology UIDs",
            personLocations: "Person Locations",
            companyHeadcount: "Company Headcount",
            fundingAmountMax: "Funding Amount Max",
            fundingAmountMin: "Funding Amount Min",
            excludeTechnologyUids: "Exclude Technology UIDs",
            organizationJobTitles: "Organization Job Titles",
            organizationLocations: "Organization Locations",
            excludePersonLocations: "Exclude Person Locations",
            organizationNumJobsMax: "Organization Num Jobs Max",
            organizationNumJobsMin: "Organization Num Jobs Min",
            organizationJobLocations: "Organization Job Locations",
            organizationJobPostedAtMax: "Organization Job Posted At Max",
            organizationJobPostedAtMin: "Organization Job Posted At Min",
            excludeOrganizationLocations: "Exclude Organization Locations",
        }

        function isFilterActive(value) {
            if (value === null) return false;
            if (Array.isArray(value) && value.length === 0) return false;
            return value !== undefined && value !== '';
        }

        const activeFilters = Object.entries(filters)
            .filter(([key, value]) => isFilterActive(value) && key !== 'page' && key !== 'perPage');

        return (
            <Container maxW="7xl" py={8}>
                <VStack spacing={8} align="stretch">
                    {/* Header Section */}
                    <VStack spacing={4} textAlign="center">
                        <Heading
                            size="2xl"
                            fontWeight="bold"
                            bgGradient="linear(to-r, purple.400, blue.400)"
                            bgClip="text"
                        >
                            Ideal Customer Profile Preview
                        </Heading>
                        <Text fontSize="xl" color="gray.600" maxW="2xl">
                            View your configured ideal customer targeting criteria
                        </Text>
                    </VStack>

                    {/* Targeting Filters Display */}
                    <Card
                        bg={glassBg}
                        borderRadius="2xl"
                        border="1px solid"
                        borderColor={borderColor}
                        backdropFilter="blur(20px)"
                        boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                        _hover={{
                            transform: 'translateY(-4px)',
                            boxShadow: '0 35px 60px -12px rgba(102, 126, 234, 0.4)',
                            transition: 'all 0.3s ease-in-out'
                        }}
                        transition="all 0.3s ease-in-out"
                    >
                        <CardHeader pb={2}>
                            <HStack spacing={3} justify="space-between">
                                <HStack spacing={3}>
                                    <Box
                                        p={3}
                                        borderRadius="xl"
                                        bg={accentGradient}
                                        color="white"
                                        boxShadow="0 8px 20px rgba(102, 126, 234, 0.4)"
                                    >
                                        <Users size="20" />
                                    </Box>
                                    <VStack align="start" spacing={0}>
                                        <Heading size="md" color="gray.800">Selected Filters</Heading>
                                        <Text fontSize="sm" color="gray.600">Your targeting configuration</Text>
                                    </VStack>
                                </HStack>
                                <Button
                                    size="sm"
                                    leftIcon={<Lock size={16} />}
                                    onClick={handleEditAttempt}
                                    variant="outline"
                                    borderColor="purple.200"
                                    _hover={{ borderColor: 'purple.400' }}
                                >
                                    Edit
                                </Button>
                            </HStack>
                        </CardHeader>
                        <CardBody pt={0}>
                            {activeFilters.length === 0 ? (
                                <Box py={6} textAlign="center">
                                    <Text fontSize="lg" color="red.500" fontWeight="bold">
                                        Oops, no filters found on your ICPs
                                    </Text>
                                </Box>
                            ) : (
                                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                                    {activeFilters.map(([key, value]) => (
                                        <Box key={key}>
                                            <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={2}>
                                                {filterLabels[key] || key}
                                            </Text>
                                            {Array.isArray(value) ? (
                                                <HStack wrap="wrap" spacing={2}>
                                                    {value.map((item, idx) => (
                                                        <Tag
                                                            key={idx}
                                                            size="sm"
                                                            borderRadius="full"
                                                            variant="subtle"
                                                            colorScheme="purple"
                                                        >
                                                            <TagLabel>{item}</TagLabel>
                                                        </Tag>
                                                    ))}
                                                </HStack>
                                            ) : (
                                                <Text fontSize="sm" color="gray.800">
                                                    {String(value)}
                                                </Text>
                                            )}
                                        </Box>
                                    ))}
                                </SimpleGrid>
                            )}
                        </CardBody>
                    </Card>
                </VStack>
            </Container>
        )
    }

    const renderPitchContent = () => {
        const pitch = campaign?.settings?.pitch || {}
        const offering = campaign?.settings?.offering || {}
        const painPoints = pitch?.painPoints || []
        const proofPoints = pitch?.proofPoints || []

        const hasCoreOffering = Boolean(offering.description || pitch.coreOffering || campaign?.description);
        const hasIcpSummary = Boolean(pitch?.websiteAnalysis?.icpSummary);

        return (
            <Container maxW="7xl" py={8}>
                <VStack spacing={8} align="stretch">
                    {/* Header Section */}
                    <VStack spacing={4} textAlign="center">
                        <Heading
                            size="2xl"
                            fontWeight="bold"
                            bgGradient="linear(to-r, purple.400, blue.400)"
                            bgClip="text"
                        >
                            Create Your Pitch
                        </Heading>
                        <Text fontSize="xl" color="gray.600" maxW="2xl">
                            Analyze your website and create compelling messaging that converts prospects into customers
                        </Text>
                    </VStack>

                    {/* Core Offering */}
                    {hasCoreOffering && (
                        <Card
                            bg={glassBg}
                            borderRadius="2xl"
                            border="1px solid"
                            borderColor={borderColor}
                            backdropFilter="blur(20px)"
                            boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                            _hover={{
                                transform: 'translateY(-4px)',
                                boxShadow: '0 35px 60px -12px rgba(102, 126, 234, 0.4)',
                                transition: 'all 0.3s ease-in-out'
                            }}
                            transition="all 0.3s ease-in-out"
                        >
                            <CardHeader pb={2}>
                                <HStack spacing={3} justify="space-between">
                                    <HStack spacing={3}>
                                        <Box
                                            p={3}
                                            borderRadius="xl"
                                            bg={accentGradient}
                                            color="white"
                                            boxShadow="0 8px 20px rgba(102, 126, 234, 0.4)"
                                        >
                                            <Target size="20" />
                                        </Box>
                                        <VStack align="start" spacing={0}>
                                            <Heading size="md" color="gray.800">Core Offering</Heading>
                                            <Text fontSize="sm" color="gray.600">Your primary value proposition</Text>
                                        </VStack>
                                    </HStack>
                                    <Button
                                        size="sm"
                                        leftIcon={<Lock size={16} />}
                                        onClick={handleEditAttempt}
                                        variant="outline"
                                        borderColor="purple.200"
                                        _hover={{ borderColor: 'purple.400' }}
                                    >
                                        Edit
                                    </Button>
                                </HStack>
                            </CardHeader>
                            <CardBody pt={0}>
                                <Text fontSize="md" color="gray.800" lineHeight="1.6">
                                    {offering.description || pitch.coreOffering || campaign?.description}
                                </Text>
                            </CardBody>
                        </Card>
                    )}

                    {/* Ideal Customer Profile */}
                    {hasIcpSummary && (
                        <Card
                            bg={glassBg}
                            borderRadius="2xl"
                            border="1px solid"
                            borderColor={borderColor}
                            backdropFilter="blur(20px)"
                            boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                            _hover={{
                                transform: 'translateY(-4px)',
                                boxShadow: '0 35px 60px -12px rgba(102, 126, 234, 0.4)',
                                transition: 'all 0.3s ease-in-out'
                            }}
                            transition="all 0.3s ease-in-out"
                        >
                            <CardHeader pb={2}>
                                <HStack spacing={3} justify="space-between">
                                    <HStack spacing={3}>
                                        <Box
                                            p={3}
                                            borderRadius="xl"
                                            bg={accentGradient}
                                            color="white"
                                            boxShadow="0 8px 20px rgba(102, 126, 234, 0.4)"
                                        >
                                            <Users size="20" />
                                        </Box>
                                        <VStack align="start" spacing={0}>
                                            <Heading size="md" color="gray.800">Ideal Customer Profile</Heading>
                                            <Text fontSize="sm" color="gray.600">Your Ideal Customer</Text>
                                        </VStack>
                                    </HStack>
                                    <Button
                                        size="sm"
                                        leftIcon={<Lock size={16} />}
                                        onClick={handleEditAttempt}
                                        variant="outline"
                                        borderColor="purple.200"
                                        _hover={{ borderColor: 'purple.400' }}
                                    >
                                        Edit
                                    </Button>
                                </HStack>
                            </CardHeader>
                            <CardBody pt={0}>
                                <Text fontSize="md" color="gray.800" lineHeight="1.6">
                                    {pitch?.websiteAnalysis?.icpSummary}
                                </Text>
                            </CardBody>
                        </Card>
                    )}

                    {/* Target Personas */}
                    {pitch?.websiteAnalysis?.targetPersonas && pitch?.websiteAnalysis?.targetPersonas.length > 0 && (
                        <Card
                            bg={glassBg}
                            borderRadius="2xl"
                            border="1px solid"
                            borderColor={borderColor}
                            backdropFilter="blur(20px)"
                            boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                            _hover={{
                                transform: 'translateY(-4px)',
                                boxShadow: '0 35px 60px -12px rgba(102, 126, 234, 0.4)',
                                transition: 'all 0.3s ease-in-out'
                            }}
                            transition="all 0.3s ease-in-out"
                        >
                            <CardHeader pb={2}>
                                <HStack spacing={3} justify="space-between">
                                    <HStack spacing={3}>
                                        <Box
                                            p={3}
                                            borderRadius="xl"
                                            bg={accentGradient}
                                            color="white"
                                            boxShadow="0 8px 20px rgba(102, 126, 234, 0.4)"
                                        >
                                            <Target size="20" />
                                        </Box>
                                        <VStack align="start" spacing={0}>
                                            <Heading size="md" color="gray.800">Target Personas</Heading>
                                        </VStack>
                                    </HStack>
                                    <Button
                                        size="sm"
                                        leftIcon={<Lock size={16} />}
                                        onClick={handleEditAttempt}
                                        variant="outline"
                                        borderColor="purple.200"
                                        _hover={{ borderColor: 'purple.400' }}
                                    >
                                        Edit
                                    </Button>
                                </HStack>
                            </CardHeader>
                            <CardBody>
                                <Grid templateColumns={"repeat(auto-fit, minmax(400px, 1fr))"} gap={4}>
                                    {pitch?.websiteAnalysis?.targetPersonas.map((persona, index) => (
                                        <Box key={index} p={4} bg={personaBg} borderRadius="md" border="1px" borderColor={personaBorderColor}>
                                            <VStack align="start" spacing={3}>
                                                {persona.title && <Heading size="sm" color="blue.600">{persona.title}</Heading>}
                                                <HStack wrap="wrap">
                                                    {persona.company_size && <Badge colorScheme="blue">{persona.company_size}</Badge>}
                                                    {persona.industry && <Badge colorScheme="green">{persona.industry}</Badge>}
                                                    {persona.demographics?.seniority_level && <Badge colorScheme="purple">{persona.demographics.seniority_level}</Badge>}
                                                </HStack>

                                                <Box>
                                                    <Text fontWeight="semibold" fontSize="sm" color="red.600">Pain Points:</Text>
                                                    <List spacing={1} fontSize="sm">
                                                        {persona.pain_points.slice(0, 3).map((point, i) => (
                                                            <ListItem key={i}>
                                                                <ListIcon as={WarningIcon} color="red.400" />
                                                                {point}
                                                            </ListItem>
                                                        ))}
                                                    </List>
                                                </Box>

                                                <Box>
                                                    <Text fontWeight="semibold" fontSize="sm" color="green.600">Desired Outcomes:</Text>
                                                    <List spacing={1} fontSize="sm">
                                                        {persona.desired_outcomes.slice(0, 3).map((outcome, i) => (
                                                            <ListItem key={i}>
                                                                <ListIcon as={CheckCircleIcon} color="green.400" />
                                                                {outcome}
                                                            </ListItem>
                                                        ))}
                                                    </List>
                                                </Box>
                                            </VStack>
                                        </Box>
                                    ))}
                                </Grid>
                            </CardBody>
                        </Card>
                    )}

                    {/* Competetive Advantages */}
                    {pitch?.websiteAnalysis?.competitiveAdvantages && pitch?.websiteAnalysis?.competitiveAdvantages.length > 0 && (
                        <Card
                            bg={glassBg}
                            borderRadius="2xl"
                            border="1px solid"
                            borderColor={borderColor}
                            backdropFilter="blur(20px)"
                            boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                            _hover={{
                                transform: 'translateY(-4px)',
                                boxShadow: '0 35px 60px -12px rgba(102, 126, 234, 0.4)',
                                transition: 'all 0.3s ease-in-out'
                            }}
                            transition="all 0.3s ease-in-out"
                        >
                            <CardHeader pb={2}>
                                <HStack spacing={3} justify="space-between">
                                    <HStack spacing={3}>
                                        <Box
                                            p={3}
                                            borderRadius="xl"
                                            bg={accentGradient}
                                            color="white"
                                            boxShadow="0 8px 20px rgba(102, 126, 234, 0.4)"
                                        >
                                            <UpDownIcon boxSize={4} />
                                        </Box>
                                        <VStack align="start" spacing={0}>
                                            <Heading size="md" color="gray.800">Competitive Advantages</Heading>
                                        </VStack>
                                    </HStack>
                                    <Button
                                        size="sm"
                                        leftIcon={<Lock size={16} />}
                                        onClick={handleEditAttempt}
                                        variant="outline"
                                        borderColor="purple.200"
                                        _hover={{ borderColor: 'purple.400' }}
                                    >
                                        Edit
                                    </Button>
                                </HStack>
                            </CardHeader>
                            <CardBody>
                                <Wrap spacing={2}>
                                    {pitch?.websiteAnalysis?.competitiveAdvantages.map((advantage, index) => (
                                        <WrapItem key={index}>
                                            <Tag size="lg" colorScheme="orange" borderRadius="full">
                                                <TagLabel>{advantage}</TagLabel>
                                            </Tag>
                                        </WrapItem>
                                    ))}
                                </Wrap>
                            </CardBody>
                        </Card>
                    )}

                    {/* Technology Stack */}
                    {pitch?.websiteAnalysis?.techStack && pitch?.websiteAnalysis?.techStack.length > 0 && (
                        <Card
                            bg={glassBg}
                            borderRadius="2xl"
                            border="1px solid"
                            borderColor={borderColor}
                            backdropFilter="blur(20px)"
                            boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                            _hover={{
                                transform: 'translateY(-4px)',
                                boxShadow: '0 35px 60px -12px rgba(102, 126, 234, 0.4)',
                                transition: 'all 0.3s ease-in-out'
                            }}
                            transition="all 0.3s ease-in-out"
                        >
                            <CardHeader pb={2}>
                                <HStack spacing={3} justify="space-between">
                                    <HStack spacing={3}>
                                        <Box
                                            p={3}
                                            borderRadius="xl"
                                            bg={accentGradient}
                                            color="white"
                                            boxShadow="0 8px 20px rgba(102, 126, 234, 0.4)"
                                        >
                                            <Settings2Icon size="20" />
                                        </Box>
                                        <VStack align="start" spacing={0}>
                                            <Heading size="md" color="gray.800">Tech Stack</Heading>
                                        </VStack>
                                    </HStack>
                                    <Button
                                        size="sm"
                                        leftIcon={<Lock size={16} />}
                                        onClick={handleEditAttempt}
                                        variant="outline"
                                        borderColor="purple.200"
                                        _hover={{ borderColor: 'purple.400' }}
                                    >
                                        Edit
                                    </Button>
                                </HStack>
                            </CardHeader>
                            <CardBody>
                                <Wrap spacing={2}>
                                    {pitch?.websiteAnalysis?.techStack.map((stack, index) => (
                                        <WrapItem key={index}>
                                            <Tag size="md" colorScheme="gray" borderRadius="full">
                                                <TagLabel>{stack}</TagLabel>
                                            </Tag>
                                        </WrapItem>
                                    ))}
                                </Wrap>
                            </CardBody>
                        </Card>
                    )}


                    {/* Customer Pain Points */}
                    {painPoints.length > 0 && (
                        <Card
                            bg={glassBg}
                            borderRadius="2xl"
                            border="1px solid"
                            borderColor={borderColor}
                            backdropFilter="blur(20px)"
                            boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                            _hover={{
                                transform: 'translateY(-4px)',
                                boxShadow: '0 35px 60px -12px rgba(102, 126, 234, 0.4)',
                                transition: 'all 0.3s ease-in-out'
                            }}
                            transition="all 0.3s ease-in-out"
                        >
                            <CardHeader pb={2}>
                                <HStack spacing={3} justify="space-between">
                                    <HStack spacing={3}>
                                        <Box
                                            p={3}
                                            borderRadius="xl"
                                            bg="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
                                            color="white"
                                            boxShadow="0 8px 20px rgba(240, 147, 251, 0.4)"
                                        >
                                            <Text fontSize="lg">😣</Text>
                                        </Box>
                                        <VStack align="start" spacing={0}>
                                            <Heading size="md" color="gray.800">Customer Pain Points</Heading>
                                            <Text fontSize="sm" color="gray.600">Problems your solution addresses</Text>
                                        </VStack>
                                    </HStack>
                                    <Button
                                        size="sm"
                                        leftIcon={<Lock size={16} />}
                                        onClick={handleEditAttempt}
                                        variant="outline"
                                        borderColor="purple.200"
                                        _hover={{ borderColor: 'purple.400' }}
                                    >
                                        Edit
                                    </Button>
                                </HStack>
                            </CardHeader>
                            <CardBody pt={0}>
                                <VStack spacing={3} align="stretch">
                                    {painPoints.map((point, index) => (
                                        <Box
                                            key={index}
                                            p={4}
                                            borderRadius="xl"
                                            bg="rgba(248, 113, 113, 0.1)"
                                            border="1px solid"
                                            borderColor="red.200"
                                        >
                                            <HStack spacing={3}>
                                                <Text fontWeight="bold" color="red.500">{index + 1}</Text>
                                                <Text fontSize="sm" color="gray.800">{point.description}</Text>
                                            </HStack>
                                        </Box>
                                    ))}
                                </VStack>
                            </CardBody>
                        </Card>
                    )}

                    {/* Success Stories & Proof */}
                    {proofPoints.length > 0 && (
                        <Card
                            bg={glassBg}
                            borderRadius="2xl"
                            border="1px solid"
                            borderColor={borderColor}
                            backdropFilter="blur(20px)"
                            boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                            _hover={{
                                transform: 'translateY(-4px)',
                                boxShadow: '0 35px 60px -12px rgba(102, 126, 234, 0.4)',
                                transition: 'all 0.3s ease-in-out'
                            }}
                            transition="all 0.3s ease-in-out"
                        >
                            <CardHeader pb={2}>
                                <HStack spacing={3} justify="space-between">
                                    <HStack spacing={3}>
                                        <Box
                                            p={3}
                                            borderRadius="xl"
                                            bg="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
                                            color="white"
                                            boxShadow="0 8px 20px rgba(79, 172, 254, 0.4)"
                                        >
                                            <Text fontSize="lg">🏆</Text>
                                        </Box>
                                        <VStack align="start" spacing={0}>
                                            <Heading size="md" color="gray.800">Success Stories & Proof</Heading>
                                            <Text fontSize="sm" color="gray.600">Evidence of your solution's effectiveness</Text>
                                        </VStack>
                                    </HStack>
                                    <Button
                                        size="sm"
                                        leftIcon={<Lock size={16} />}
                                        onClick={handleEditAttempt}
                                        variant="outline"
                                        borderColor="purple.200"
                                        _hover={{ borderColor: 'purple.400' }}
                                    >
                                        Edit
                                    </Button>
                                </HStack>
                            </CardHeader>
                            <CardBody pt={0}>
                                <VStack spacing={3} align="stretch">
                                    {proofPoints.map((point, index) => (
                                        <Box
                                            key={index}
                                            p={4}
                                            borderRadius="xl"
                                            bg="rgba(34, 197, 94, 0.1)"
                                            border="1px solid"
                                            borderColor="green.200"
                                        >
                                            <HStack spacing={3}>
                                                <Text fontWeight="bold" color="green.500">{index + 1}</Text>
                                                <Text fontSize="sm" color="gray.800">{point.description}</Text>
                                            </HStack>
                                        </Box>
                                    ))}
                                </VStack>
                            </CardBody>
                        </Card>
                    )}

                    {/* Expandable Sections */}
                    {((pitch?.websiteAnalysis?.caseStudies && pitch?.websiteAnalysis?.caseStudies.length > 0) ||
                        (pitch?.websiteAnalysis?.leadMagnets && pitch?.websiteAnalysis?.leadMagnets.length > 0) ||
                        (pitch?.websiteAnalysis?.socialProof && pitch?.websiteAnalysis?.socialProof.testimonials && pitch?.websiteAnalysis?.socialProof.testimonials.length > 0)) && (
                            <Card bg={cardBg} shadow="lg" borderWidth="1px" borderColor={borderColor} w="full">
                                <CardBody>
                                    <Accordion allowMultiple>
                                        {/* Case Studies */}
                                        {pitch?.websiteAnalysis?.caseStudies && pitch?.websiteAnalysis?.caseStudies.length > 0 && (
                                            <AccordionItem>
                                                <AccordionButton>
                                                    <Box flex="1" textAlign="left">
                                                        <HStack>
                                                            <Icon as={FiBookOpen} color="blue.500" />
                                                            <Heading size="md">Case Studies ({pitch?.websiteAnalysis?.caseStudies.length})</Heading>
                                                        </HStack>
                                                    </Box>
                                                    <AccordionIcon />
                                                </AccordionButton>
                                                <AccordionPanel pb={4}>
                                                    <VStack spacing={4} align="stretch">
                                                        {pitch?.websiteAnalysis?.caseStudies.map((study, index) => (
                                                            <Box key={index} p={4} bg="blue.50" borderRadius="md" border="1px" borderColor="blue.200">
                                                                <VStack align="start" spacing={2}>
                                                                    <Heading size="sm" color="blue.700">{study.title}</Heading>
                                                                    <Badge colorScheme="blue">{study.industry}</Badge>
                                                                    <Text fontSize="sm"><strong>Challenge:</strong> {study.challenge}</Text>
                                                                    <Text fontSize="sm"><strong>Solution:</strong> {study.solution}</Text>
                                                                    {study.results.length > 0 && (
                                                                        <Box>
                                                                            <Text fontSize="sm" fontWeight="semibold">Results:</Text>
                                                                            <List spacing={1} fontSize="sm">
                                                                                {study.results.map((result, i) => (
                                                                                    <ListItem key={i}>
                                                                                        <ListIcon as={CheckCircleIcon} color="green.500" />
                                                                                        {result}
                                                                                    </ListItem>
                                                                                ))}
                                                                            </List>
                                                                        </Box>
                                                                    )}
                                                                </VStack>
                                                            </Box>
                                                        ))}
                                                    </VStack>
                                                </AccordionPanel>
                                            </AccordionItem>
                                        )}

                                        {/* Lead Magnets */}
                                        {pitch?.websiteAnalysis?.leadMagnets && pitch?.websiteAnalysis?.leadMagnets.length > 0 && (
                                            <AccordionItem>
                                                <AccordionButton>
                                                    <Box flex="1" textAlign="left">
                                                        <HStack>
                                                            <Icon as={FiGift} color="purple.500" />
                                                            <Heading size="md">Lead Magnets ({pitch?.websiteAnalysis?.leadMagnets.length})</Heading>
                                                        </HStack>
                                                    </Box>
                                                    <AccordionIcon />
                                                </AccordionButton>
                                                <AccordionPanel pb={4}>
                                                    <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={4}>
                                                        {pitch?.websiteAnalysis?.leadMagnets.map((magnet, index) => (
                                                            <Box key={index} p={4} bg="purple.50" borderRadius="md" border="1px" borderColor="purple.200">
                                                                <VStack align="start" spacing={2}>
                                                                    <HStack>
                                                                        <Heading size="sm" color="purple.700">{magnet.title}</Heading>
                                                                        <Badge colorScheme="purple">{magnet.type}</Badge>
                                                                    </HStack>
                                                                    <Text fontSize="sm">{magnet.description}</Text>
                                                                    <Text fontSize="sm"><strong>Target:</strong> {magnet.target_audience}</Text>
                                                                    <Text fontSize="sm"><strong>CTA:</strong> {magnet.call_to_action}</Text>
                                                                </VStack>
                                                            </Box>
                                                        ))}
                                                    </Grid>
                                                </AccordionPanel>
                                            </AccordionItem>
                                        )}

                                        {/* Social Proof */}
                                        {pitch?.websiteAnalysis?.socialProof && ((pitch?.websiteAnalysis?.socialProof.testimonials && pitch?.websiteAnalysis?.socialProof.testimonials.length > 0) || (pitch?.websiteAnalysis?.socialProof.metrics && pitch?.websiteAnalysis?.socialProof.metrics.length > 0)) && (
                                            <AccordionItem>
                                                <AccordionButton>
                                                    <Box flex="1" textAlign="left">
                                                        <HStack>
                                                            <Icon as={FiStar} color="yellow.500" />
                                                            <Heading size="md">Social Proof</Heading>
                                                        </HStack>
                                                    </Box>
                                                    <AccordionIcon />
                                                </AccordionButton>
                                                <AccordionPanel pb={4}>
                                                    <VStack spacing={4} align="stretch">
                                                        {/* Testimonials */}
                                                        {pitch?.websiteAnalysis?.socialProof.testimonials && pitch?.websiteAnalysis?.socialProof.testimonials.length > 0 && (
                                                            <Box>
                                                                <Heading size="sm" mb={3}>Testimonials</Heading>
                                                                <VStack spacing={3}>
                                                                    {pitch?.websiteAnalysis?.socialProof.testimonials.map((testimonial, index) => (
                                                                        <Box key={index} p={3} bg="yellow.50" borderRadius="md" border="1px" borderColor="yellow.200" w="full">
                                                                            <Text fontSize="sm" fontStyle="italic">"{testimonial.quote}"</Text>
                                                                            <Text fontSize="xs" mt={2} color="gray.600">
                                                                                - {testimonial.author}
                                                                                {testimonial.company && `, ${testimonial.company}`}
                                                                                {testimonial.position && ` (${testimonial.position})`}
                                                                            </Text>
                                                                        </Box>
                                                                    ))}
                                                                </VStack>
                                                            </Box>
                                                        )}

                                                        {/* Metrics */}
                                                        {pitch?.websiteAnalysis?.socialProof.metrics && pitch?.websiteAnalysis?.socialProof.metrics.length > 0 && (
                                                            <Box>
                                                                <Heading size="sm" mb={3}>Key Metrics</Heading>
                                                                <Wrap spacing={2}>
                                                                    {pitch?.websiteAnalysis?.socialProof.metrics.map((metric, index) => (
                                                                        <WrapItem key={index}>
                                                                            <Tag size="lg" colorScheme="green">
                                                                                <TagLabel>{metric.metric}: {metric.value}</TagLabel>
                                                                            </Tag>
                                                                        </WrapItem>
                                                                    ))}
                                                                </Wrap>
                                                            </Box>
                                                        )}
                                                    </VStack>
                                                </AccordionPanel>
                                            </AccordionItem>
                                        )}
                                    </Accordion>
                                </CardBody>
                            </Card>
                        )}
                </VStack>
            </Container>
        )
    }

    const renderOutreachContent = () => {
        const outreach = campaign?.settings?.outreach || {}
        const messaging = campaign?.settings?.messaging || {}
        const language = campaign?.settings?.campaign_language || 'English'
        const signOffs = campaign?.settings?.sign_offs || ['BEST', 'REGARDS', 'THANKS']

        return (
            <Container maxW="7xl" py={8}>
                <VStack spacing={8} align="stretch">
                    {/* Header Section */}
                    <VStack spacing={4} textAlign="center">
                        <Heading
                            size="2xl"
                            fontWeight="bold"
                            bgGradient="linear(to-r, purple.400, blue.400)"
                            bgClip="text"
                        >
                            Outreach Configuration
                        </Heading>
                        <Text fontSize="xl" color="gray.600" maxW="2xl">
                            Configure your messaging settings and personalization options with AI-powered precision
                        </Text>
                    </VStack>

                    {/* Campaign Language */}
                    <Card
                        bg={glassBg}
                        borderRadius="2xl"
                        border="1px solid"
                        borderColor={borderColor}
                        backdropFilter="blur(20px)"
                        boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                        _hover={{
                            transform: 'translateY(-4px)',
                            boxShadow: '0 35px 60px -12px rgba(102, 126, 234, 0.4)',
                            transition: 'all 0.3s ease-in-out'
                        }}
                        transition="all 0.3s ease-in-out"
                    >
                        <CardHeader pb={2}>
                            <HStack spacing={3} justify="space-between">
                                <HStack spacing={3}>
                                    <Box
                                        p={3}
                                        borderRadius="xl"
                                        bg={accentGradient}
                                        color="white"
                                        boxShadow="0 8px 20px rgba(102, 126, 234, 0.4)"
                                    >
                                        <Globe size="20" />
                                    </Box>
                                    <VStack align="start" spacing={0}>
                                        <Heading size="md" color="gray.800">Campaign Language</Heading>
                                        <Text fontSize="sm" color="gray.600">Choose your preferred communication language</Text>
                                    </VStack>
                                </HStack>
                                <Button
                                    size="sm"
                                    leftIcon={<Lock size={16} />}
                                    onClick={handleEditAttempt}
                                    variant="outline"
                                    borderColor="purple.200"
                                    _hover={{ borderColor: 'purple.400' }}
                                >
                                    Edit
                                </Button>
                            </HStack>
                        </CardHeader>
                        <CardBody pt={0}>
                            <Box
                                p={4}
                                borderRadius="xl"
                                border="2px solid"
                                borderColor="purple.200"
                                bg="white"
                                fontSize="lg"
                                fontWeight="600"
                                color="gray.800"
                            >
                                {language}
                            </Box>
                        </CardBody>
                    </Card>

                    {/* Message Sign Offs */}
                    <Card
                        bg={glassBg}
                        borderRadius="2xl"
                        border="1px solid"
                        borderColor={borderColor}
                        backdropFilter="blur(20px)"
                        boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                        _hover={{
                            transform: 'translateY(-4px)',
                            boxShadow: '0 35px 60px -12px rgba(102, 126, 234, 0.4)',
                            transition: 'all 0.3s ease-in-out'
                        }}
                        transition="all 0.3s ease-in-out"
                    >
                        <CardHeader pb={2}>
                            <HStack spacing={3} justify="space-between">
                                <HStack spacing={3}>
                                    <Box
                                        p={3}
                                        borderRadius="xl"
                                        bg={accentGradient}
                                        color="white"
                                        boxShadow="0 8px 20px rgba(102, 126, 234, 0.4)"
                                    >
                                        <Edit3 size="20" />
                                    </Box>
                                    <VStack align="start" spacing={0}>
                                        <Heading size="md" color="gray.800">Message Sign Offs In {language.split(' ')[0]}</Heading>
                                        <Text fontSize="sm" color="gray.600">Customize your message endings</Text>
                                    </VStack>
                                </HStack>
                                <Button
                                    size="sm"
                                    leftIcon={<Lock size={16} />}
                                    onClick={handleEditAttempt}
                                    variant="outline"
                                    borderColor="purple.200"
                                    _hover={{ borderColor: 'purple.400' }}
                                >
                                    Edit
                                </Button>
                            </HStack>
                        </CardHeader>
                        <CardBody pt={0}>
                            <VStack spacing={4} align="stretch">
                                <Flex wrap="wrap" gap={3}>
                                    {signOffs.map((signOff, index) => (
                                        <Badge
                                            key={index}
                                            px={4}
                                            py={2}
                                            borderRadius="xl"
                                            bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                                            color="white"
                                            fontSize="sm"
                                            fontWeight="600"
                                            boxShadow="0 4px 15px rgba(102, 126, 234, 0.4)"
                                            textTransform="none"
                                        >
                                            {signOff}
                                        </Badge>
                                    ))}
                                </Flex>
                            </VStack>
                        </CardBody>
                    </Card>

                    {/* Tone of Voice */}
                    <Card
                        bg={glassBg}
                        borderRadius="2xl"
                        border="1px solid"
                        borderColor={borderColor}
                        backdropFilter="blur(20px)"
                        boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                        _hover={{
                            transform: 'translateY(-4px)',
                            boxShadow: '0 35px 60px -12px rgba(102, 126, 234, 0.4)',
                            transition: 'all 0.3s ease-in-out'
                        }}
                        transition="all 0.3s ease-in-out"
                    >
                        <CardHeader pb={2}>
                            <HStack spacing={3} justify="space-between">
                                <HStack spacing={3}>
                                    <Box
                                        p={3}
                                        borderRadius="xl"
                                        bg={accentGradient}
                                        color="white"
                                        boxShadow="0 8px 20px rgba(102, 126, 234, 0.4)"
                                    >
                                        <PenTool size="20" />
                                    </Box>
                                    <VStack align="start" spacing={0}>
                                        <Heading size="md" color="gray.800">Tone of Voice</Heading>
                                        <Text fontSize="sm" color="gray.600">Define your communication style</Text>
                                    </VStack>
                                </HStack>
                                <Button
                                    size="sm"
                                    leftIcon={<Lock size={16} />}
                                    onClick={handleEditAttempt}
                                    variant="outline"
                                    borderColor="purple.200"
                                    _hover={{ borderColor: 'purple.400' }}
                                >
                                    Edit
                                </Button>
                            </HStack>
                        </CardHeader>
                        <CardBody pt={0}>
                            <Box
                                p={4}
                                borderRadius="xl"
                                border="2px solid"
                                borderColor="purple.200"
                                bg="white"
                                fontSize="lg"
                                fontWeight="600"
                                color="gray.800"
                            >
                                {campaign?.settings?.tone_of_voice || 'Urgent'}
                            </Box>
                        </CardBody>
                    </Card>

                    {/* Call to action */}
                    <Card
                        bg={glassBg}
                        borderRadius="2xl"
                        border="1px solid"
                        borderColor={borderColor}
                        backdropFilter="blur(20px)"
                        boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                        _hover={{
                            transform: 'translateY(-4px)',
                            boxShadow: '0 35px 60px -12px rgba(102, 126, 234, 0.4)',
                            transition: 'all 0.3s ease-in-out'
                        }}
                        transition="all 0.3s ease-in-out"
                    >
                        <CardHeader pb={2}>
                            <HStack spacing={3} justify="space-between">
                                <HStack spacing={3}>
                                    <Box
                                        p={3}
                                        borderRadius="xl"
                                        bg={accentGradient}
                                        color="white"
                                        boxShadow="0 8px 20px rgba(102, 126, 234, 0.4)"
                                    >
                                        <Target size={20} />
                                    </Box>
                                    <VStack align="start" spacing={0}>
                                        <Heading size="md" color="gray.800">Call To Action</Heading>
                                        <Text fontSize="sm" color="gray.600">Your campaign's calls to action</Text>
                                    </VStack>
                                </HStack>
                                <Button
                                    size="sm"
                                    leftIcon={<Lock size={16} />}
                                    onClick={handleEditAttempt}
                                    variant="outline"
                                    borderColor="green.200"
                                    _hover={{ borderColor: 'green.400' }}
                                >
                                    Edit
                                </Button>
                            </HStack>
                        </CardHeader>
                        <CardBody pt={0}>
                            <VStack spacing={3} align="stretch">
                                {(outreach?.callsToAction.length > 0 && outreach?.callsToAction).map((point: string, index: number) => (
                                    <Box
                                        key={index}
                                        p={4}
                                        borderRadius="xl"
                                        bg="rgba(34, 197, 94, 0.1)"
                                        border="1px solid"
                                        borderColor="green.200"
                                    >
                                        <HStack spacing={3}>
                                            <Text fontWeight="bold" color="green.500">{index + 1}</Text>
                                            <Text fontSize="sm" color="gray.800">{point}</Text>
                                        </HStack>
                                    </Box>
                                ))}
                            </VStack>
                        </CardBody>
                    </Card>

                    {/* Message Personalization */}
                    <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
                        <CardHeader pb={2}>
                            <HStack spacing={3} justify="space-between">
                                <HStack spacing={3}>
                                    <Box
                                        p={3}
                                        borderRadius="xl"
                                        bg={accentGradient}
                                        color="white"
                                        boxShadow="0 8px 20px rgba(102, 126, 234, 0.4)"
                                    >
                                        <FiSettings />
                                    </Box>
                                    <VStack align="start" spacing={0}>
                                        <Heading size="md" color="gray.800">Message Personalization</Heading>
                                    </VStack>
                                </HStack>
                                <Button
                                    size="sm"
                                    leftIcon={<Lock size={16} />}
                                    onClick={handleEditAttempt}
                                    variant="outline"
                                    borderColor="green.200"
                                    _hover={{ borderColor: 'green.400' }}
                                >
                                    Edit
                                </Button>
                            </HStack>
                        </CardHeader>
                        <CardBody>
                            <VStack spacing={6} align="stretch">
                                <Box>
                                    <FormLabel>Select Maximum Resource Age</FormLabel>
                                    <HStack spacing={4}>
                                        <Text fontSize="sm">2</Text>
                                        <Slider
                                            value={outreach.maxResourceAge}
                                            min={2}
                                            max={12}
                                            step={1}
                                            flex={1}
                                        >
                                            <SliderTrack>
                                                <SliderFilledTrack />
                                            </SliderTrack>
                                            <SliderThumb />
                                        </Slider>
                                        <Text fontSize="sm">12</Text>
                                        <Text fontWeight="semibold">{outreach.maxResourceAge} Months</Text>
                                    </HStack>
                                </Box>

                                <Box>
                                    <FormLabel mb={4}>Personalization Sources</FormLabel>
                                    <SimpleGrid columns={2} spacing={4}>
                                        {[
                                            { name: 'Website Scrape', description: 'Analyze the lead\'s website for achievements, goals, product updates, and recent blog posts.' },
                                            { name: 'X Posts', description: 'Highlight recent X (formerly Twitter) posts published by your prospects.' },
                                            { name: 'LinkedIn Posts', description: 'Feature recent LinkedIn updates shared by your prospects.' },
                                            { name: 'Press Release', description: 'Reference recent press releases and announcements.' },
                                            { name: 'Funding Announcement', description: 'Mention recent funding rounds and investment news.' }
                                        ].map((source) => (
                                            <Card key={source.name} variant="outline" p={4}>
                                                <VStack align="start" spacing={2}>
                                                    <HStack>
                                                        <Checkbox
                                                            isChecked={outreach.personalizationSources.includes(source.name)}
                                                        />
                                                        <Text fontWeight="semibold" fontSize="sm">{source.name}</Text>
                                                    </HStack>
                                                    <Text fontSize="xs" color="gray.600">{source.description}</Text>
                                                </VStack>
                                            </Card>
                                        ))}
                                    </SimpleGrid>
                                </Box>
                            </VStack>
                        </CardBody>
                    </Card>
                </VStack>
            </Container>
        )
    }

    const renderWorkflowContent = () => {
        const workflow = campaign?.settings?.workflow?.flowData || {}
        const sequence = campaign?.settings?.sequence || {}

        return (
            <Container maxW="7xl" py={8}>
                <VStack spacing={8} align="stretch">
                    {/* Header Section */}
                    <VStack spacing={4} textAlign="center">
                        <Heading
                            size="2xl"
                            fontWeight="bold"
                            bgGradient="linear(to-r, purple.400, blue.400)"
                            bgClip="text"
                        >
                            Workflow Configuration
                        </Heading>
                        <Text fontSize="xl" color="gray.600" maxW="2xl">
                            Review your automated sequence and workflow settings
                        </Text>
                    </VStack>

                    <Box h="600px" border="1px solid" borderColor="gray.300" borderRadius="md">
                        <WorkflowViewer
                            workflowData={workflow}
                            className="w-full h-full"
                        />
                    </Box>
                    {/* Sequence Details
                    <Card
                        bg={glassBg}
                        borderRadius="2xl"
                        border="1px solid"
                        borderColor={borderColor}
                        backdropFilter="blur(20px)"
                        boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                        _hover={{
                            transform: 'translateY(-4px)',
                            boxShadow: '0 35px 60px -12px rgba(102, 126, 234, 0.4)',
                            transition: 'all 0.3s ease-in-out'
                        }}
                        transition="all 0.3s ease-in-out"
                    >
                        <CardHeader pb={2}>
                            <HStack spacing={3} justify="space-between">
                                <HStack spacing={3}>
                                    <Box
                                        p={3}
                                        borderRadius="xl"
                                        bg={accentGradient}
                                        color="white"
                                        boxShadow="0 8px 20px rgba(102, 126, 234, 0.4)"
                                    >
                                        <Workflow size="20" />
                                    </Box>
                                    <VStack align="start" spacing={0}>
                                        <Heading size="md" color="gray.800">Sequence Setup</Heading>
                                        <Text fontSize="sm" color="gray.600">Your automation workflow configuration</Text>
                                    </VStack>
                                </HStack>
                                <Button
                                    size="sm"
                                    leftIcon={<Lock size={16} />}
                                    onClick={() => router.push(`/campaigns/${campaign?.id}/workflow`)}
                                    variant="outline"
                                    borderColor="purple.200"
                                    _hover={{ borderColor: 'purple.400' }}
                                >
                                    Edit Workflow
                                </Button>
                            </HStack>
                        </CardHeader>
                        <CardBody pt={0}>
                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                                <Box>
                                    <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={2}>Sequence Type</Text>
                                    <Text fontSize="md" color="gray.800">
                                        {campaign?.sequence_template || workflow.sequenceType || 'aggressive-multi'}
                                    </Text>
                                </Box>
                                <Box>
                                    <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={2}>Total Steps</Text>
                                    <Text fontSize="md" color="gray.800">
                                        {sequence.steps?.length ? `${sequence.steps.length} touchpoints` : workflow.totalSteps || '4 touchpoints'}
                                    </Text>
                                </Box>
                                <Box>
                                    <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={2}>Duration</Text>
                                    <Text fontSize="md" color="gray.800">
                                        {workflow.duration || sequence.duration || '6 days'}
                                    </Text>
                                </Box>
                                <Box>
                                    <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={2}>Channels</Text>
                                    <Text fontSize="md" color="gray.800">
                                        {workflow.channels?.join(' + ') || sequence.channels?.join(' + ') || 'LinkedIn + Email'}
                                    </Text>
                                </Box>
                            </SimpleGrid>
                        </CardBody>
                    </Card> */}
                </VStack>
            </Container>
        )
    }

    const renderLaunchContent = () => {
        const launch = campaign?.settings?.launch || {}
        const stats = campaign?.settings?.stats || {}

        return (
            <Container maxW="7xl" py={8}>
                <VStack spacing={8} align="stretch">
                    {/* Header Section */}
                    <VStack spacing={4} textAlign="center">
                        <Heading
                            size="2xl"
                            fontWeight="bold"
                            bgGradient="linear(to-r, purple.400, blue.400)"
                            bgClip="text"
                        >
                            Campaign Launch
                        </Heading>
                        <Text fontSize="xl" color="gray.600" maxW="2xl">
                            Review your campaign status and launch configuration
                        </Text>
                    </VStack>

                    {/* Launch Status */}
                    <Card
                        bg={glassBg}
                        borderRadius="2xl"
                        border="1px solid"
                        borderColor={borderColor}
                        backdropFilter="blur(20px)"
                        boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                        _hover={{
                            transform: 'translateY(-4px)',
                            boxShadow: '0 35px 60px -12px rgba(102, 126, 234, 0.4)',
                            transition: 'all 0.3s ease-in-out'
                        }}
                        transition="all 0.3s ease-in-out"
                    >
                        <CardHeader pb={2}>
                            <HStack spacing={3} justify="space-between">
                                <HStack spacing={3}>
                                    <Box
                                        p={3}
                                        borderRadius="xl"
                                        bg={accentGradient}
                                        color="white"
                                        boxShadow="0 8px 20px rgba(102, 126, 234, 0.4)"
                                    >
                                        <Rocket size="20" />
                                    </Box>
                                    <VStack align="start" spacing={0}>
                                        <Heading size="md" color="gray.800">Campaign Status</Heading>
                                        <Text fontSize="sm" color="gray.600">Current launch configuration</Text>
                                    </VStack>
                                </HStack>
                                <Button
                                    size="sm"
                                    leftIcon={<Lock size={16} />}
                                    onClick={handleEditAttempt}
                                    variant="outline"
                                    borderColor="purple.200"
                                    _hover={{ borderColor: 'purple.400' }}
                                >
                                    Edit
                                </Button>
                            </HStack>
                        </CardHeader>
                        <CardBody pt={0}>
                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                                <Box>
                                    <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={2}>Status</Text>
                                    <Badge
                                        colorScheme={campaign?.status === 'active' ? 'green' : 'yellow'}
                                        variant="subtle"
                                        fontSize="md"
                                        px={3}
                                        py={1}
                                        borderRadius="lg"
                                    >
                                        {campaign?.status?.toUpperCase() || 'DRAFT'}
                                    </Badge>
                                </Box>
                                <Box>
                                    <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={2}>Start Date</Text>
                                    <Text fontSize="md" color="gray.800">
                                        {launch.startDate
                                            ? new Date(launch.startDate).toLocaleDateString()
                                            : campaign?.created_at
                                                ? new Date(campaign.created_at).toLocaleDateString()
                                                : 'Not set'}
                                    </Text>
                                </Box>
                                <Box>
                                    <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={2}>Total Leads</Text>
                                    <Text fontSize="md" color="gray.800">
                                        {stats.totalLeads || campaign?.settings?.totalLeads || campaign?.settings?.leadCount || '0'}
                                    </Text>
                                </Box>
                                <Box>
                                    <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={2}>Template</Text>
                                    <Text fontSize="md" color="gray.800">
                                        {campaign?.sequence_template || launch.template || 'aggressive-multi'}
                                    </Text>
                                </Box>
                            </SimpleGrid>
                        </CardBody>
                    </Card>
                </VStack>
            </Container>
        )
    }

    const renderStepContent = () => {
        switch (currentStep) {
            case 0: return renderTargetingContent()
            case 1: return renderPitchContent()
            case 2: return renderOutreachContent()
            case 3: return renderWorkflowContent()
            case 4: return renderLaunchContent()
            default: return renderTargetingContent()
        }
    }

    if (loading) {
        return (
            <DashboardLayout>
                <Container maxW="7xl" py={8}>
                    <VStack spacing={6} justify="center" h="400px">
                        <Spinner size="xl" color="purple.500" />
                        <Text>Loading campaign details...</Text>
                    </VStack>
                </Container>
            </DashboardLayout>
        )
    }

    if (!campaign) {
        return (
            <DashboardLayout>
                <Container maxW="7xl" py={8}>
                    <Alert status="error">
                        <AlertIcon />
                        Campaign not found
                    </Alert>
                </Container>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            {/* Campaign Progress Header - exactly like campaign creation */}
            <Box
                bgGradient="linear(135deg, #667eea 0%, #764ba2 100%)"
                minH="100vh"
                position="relative"
                overflow="hidden"
            >
                {/* Background Animation */}
                <Box
                    position="absolute"
                    top="0"
                    left="0"
                    right="0"
                    bottom="0"
                    background="radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                     radial-gradient(circle at 70% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)"
                    animation={`${float} 6s ease-in-out infinite`}
                    zIndex="0"
                />

                <Container maxW="7xl" py={6} position="relative" zIndex="1">
                    <VStack spacing={8} align="stretch">
                        {/* Header with Back Button */}
                        <HStack spacing={4}>
                            <Button
                                leftIcon={<ArrowLeft size={16} />}
                                variant="ghost"
                                color="white"
                                _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
                                onClick={() => router.back()}
                            >
                                Back
                            </Button>
                            <VStack spacing={1} align="start" flex={1}>
                                <Heading
                                    size="xl"
                                    color="white"
                                    fontWeight="bold"
                                >
                                    {campaign.name}
                                </Heading>
                                <Text color="whiteAlpha.800" fontSize="lg">
                                    Campaign Overview
                                </Text>
                            </VStack>
                            <Badge
                                colorScheme={campaign.status === 'active' ? 'green' : 'yellow'}
                                variant="solid"
                                fontSize="sm"
                                px={3}
                                py={1}
                            >
                                {campaign.status.toUpperCase()}
                            </Badge>
                        </HStack>

                        {/* Progress Stepper - exactly like campaign creation */}
                        <Box
                            bg="rgba(255, 255, 255, 0.95)"
                            backdropFilter="blur(20px)"
                            borderRadius="2xl"
                            border="1px solid"
                            borderColor="rgba(255, 255, 255, 0.3)"
                            boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                            p={6}
                            w="full"
                        >
                            {/* Custom stepper without extra wrapper */}
                            <VStack spacing={4} align="stretch">
                                <Flex justify="space-between" align="center" mb={2}>
                                    <Text fontSize="sm" fontWeight="medium" color="gray.600">
                                        Progress
                                    </Text>
                                    <Text fontSize="sm" fontWeight="bold" color="purple.600">
                                        {Math.round(((currentStep + 1) / 5) * 100)}%
                                    </Text>
                                </Flex>
                                <Box
                                    h="3px"
                                    bg="gray.200"
                                    borderRadius="full"
                                    overflow="hidden"
                                    position="relative"
                                    mb={4}
                                >
                                    <Box
                                        h="full"
                                        bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                                        borderRadius="full"
                                        width={`${((currentStep + 1) / 5) * 100}%`}
                                        transition="width 0.3s ease"
                                    />
                                </Box>

                                {/* Manual stepper to avoid text overlap */}
                                <HStack spacing={0} justify="space-between" align="center">
                                    {steps.map((step, index) => {
                                        const isCompleted = index < currentStep
                                        const isActive = index === currentStep

                                        return (
                                            <React.Fragment key={index}>
                                                <VStack spacing={2} align="center" flex={1}>
                                                    <Box
                                                        w={10}
                                                        h={10}
                                                        borderRadius="full"
                                                        bg={
                                                            isCompleted ? "linear-gradient(135deg, #48bb78 0%, #38a169 100%)" :
                                                                isActive ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" :
                                                                    "gray.200"
                                                        }
                                                        color="white"
                                                        display="flex"
                                                        alignItems="center"
                                                        justifyContent="center"
                                                        fontWeight="bold"
                                                        fontSize="sm"
                                                        border="2px solid"
                                                        borderColor={
                                                            isCompleted ? "green.300" :
                                                                isActive ? "purple.300" :
                                                                    "gray.300"
                                                        }
                                                        boxShadow={
                                                            isActive ? "0 0 20px rgba(102, 126, 234, 0.4)" :
                                                                isCompleted ? "0 0 15px rgba(72, 187, 120, 0.3)" :
                                                                    "0 2px 8px rgba(0, 0, 0, 0.1)"
                                                        }
                                                    >
                                                        {isCompleted ? "✓" : index + 1}
                                                    </Box>
                                                    <VStack spacing={0} align="center" minH="45px" justify="start">
                                                        <Text
                                                            fontSize="sm"
                                                            fontWeight="bold"
                                                            color={
                                                                isCompleted ? "green.600" :
                                                                    isActive ? "purple.600" :
                                                                        "gray.500"
                                                            }
                                                            textAlign="center"
                                                            lineHeight="tight"
                                                            noOfLines={1}
                                                        >
                                                            {step.title}
                                                        </Text>
                                                        <Text
                                                            fontSize="xs"
                                                            color="gray.600"
                                                            textAlign="center"
                                                            lineHeight="tight"
                                                            noOfLines={2}
                                                            px={1}
                                                        >
                                                            {step.description}
                                                        </Text>
                                                    </VStack>
                                                </VStack>
                                                {index < steps.length - 1 && (
                                                    <Box
                                                        flex="0 0 auto"
                                                        h="2px"
                                                        w="8"
                                                        bg={index < currentStep ? "linear-gradient(90deg, #48bb78, #38a169)" : "gray.200"}
                                                        mx={2}
                                                        borderRadius="full"
                                                    />
                                                )}
                                            </React.Fragment>
                                        )
                                    })}
                                </HStack>
                            </VStack>
                        </Box>

                        {/* Step Content */}
                        <Box
                            bg="rgba(255, 255, 255, 0.95)"
                            backdropFilter="blur(20px)"
                            borderRadius="2xl"
                            border="1px solid"
                            borderColor="rgba(255, 255, 255, 0.3)"
                            boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                            overflow="hidden"
                        >
                            {renderStepContent()}
                        </Box>

                        {/* Navigation - exactly like campaign creation */}
                        <HStack justify="space-between" pt={4}>
                            <Button
                                variant="outline"
                                size="lg"
                                color="white"
                                borderColor="whiteAlpha.300"
                                _hover={{ borderColor: 'white', bg: 'rgba(255, 255, 255, 0.1)' }}
                                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                                isDisabled={currentStep === 0}
                            >
                                Previous
                            </Button>
                            <Button
                                size="lg"
                                bg="white"
                                color="purple.600"
                                _hover={{ bg: 'whiteAlpha.900' }}
                                onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                                isDisabled={currentStep === steps.length - 1}
                            >
                                Next
                            </Button>
                        </HStack>
                    </VStack>
                </Container>

                {/* Edit Attempt Modal */}
                <Modal isOpen={isOpen} onClose={onClose} size="md">
                    <ModalOverlay backdropFilter="blur(10px)" />
                    <ModalContent bg={cardBg} borderRadius="xl">
                        <ModalHeader>
                            <VStack spacing={2} align="center">
                                <Icon as={Lock} boxSize={8} color="purple.500" />
                                <Text>Campaign Editing Restricted</Text>
                            </VStack>
                        </ModalHeader>
                        <ModalCloseButton />
                        <ModalBody pb={6}>
                            <VStack spacing={4} align="center" textAlign="center">
                                <Text color="gray.600">
                                    Campaign editing is currently restricted. To make changes to this campaign,
                                    please connect with your account executive.
                                </Text>
                                <GradientButton variant="primary" onClick={onClose}>
                                    Contact Account Executive
                                </GradientButton>
                            </VStack>
                        </ModalBody>
                    </ModalContent>
                </Modal>
            </Box>
        </DashboardLayout>
    )
}