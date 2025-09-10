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
    Spinner,
    Grid,
    useToast,
    Menu,
    MenuButton,
    IconButton,
    MenuList,
    MenuItem,
    Divider,
    SimpleGrid,
    Progress,
    Icon,
    Avatar,
} from '@chakra-ui/react'
import { keyframes } from '@emotion/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { GradientButton } from '@/components/ui/GradientButton'
import { Enhanced3DStepper } from '@/components/ui/Enhanced3DStepper'
import { LeadListWithAccount } from '../../../types/database'
import { createCustomToast } from '../../../lib/utils/custom-toast'
import { AlertCircle, CheckCircle, Clock, Download, FileText, MoreVertical, Trash2, XCircle } from 'lucide-react'

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
    const router = useRouter();
    const toast = useToast();
    const [loading, setLoading] = useState<boolean>(false);
    const [lists, setLists] = useState<LeadListWithAccount[]>();
    const [selectedList, setSelectedList] = useState<string>();

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
    const customToast = createCustomToast(toast);

    const handleStepClick = (stepIndex: number) => {
        // Only allow navigation to completed or current step
        if (stepIndex <= activeStep) {
            setActiveStep(stepIndex)
        }
    }

    const handleSelectList = (id: string) => {
        setSelectedList(id);
    }

    const handleProceedToPitch = async () => {
        const targetingConfig = {
            selectedList
        };
        localStorage.setItem('campaignTargeting', JSON.stringify(targetingConfig));
        customToast.success({
            title: 'Targeting Configuration Saved',
            description: `Your targeting filters have been saved successfully.`,
            duration: 2000,
        });
        // Navigate to pitch step
        setTimeout(() => {
            window.location.href = '/campaigns/new/pitch';
        }, 1000);
    }

    useEffect(() => {
        const fetchLists = async () => {
            // Fetch lead lists
            setLoading(true);
            try {
                const leadListsUrl = `/api/lead-lists`;
                const leadListsResponse = await fetch(leadListsUrl);

                if (!leadListsResponse.ok) {
                    throw new Error('Failed to fetch lead lists');
                }

                const leadListsData = await leadListsResponse.json();
                setLists(leadListsData.lead_lists);
            } catch (error) {
                console.log(error);
            } finally {
                setLoading(false);
            }
        }
        fetchLists();
    }, [])

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

                                    {loading && (
                                        <VStack spacing={6} justify="center" h="400px">
                                            <Spinner size="xl" color="purple.500" />
                                            <Text>Loading your lead lists...</Text>
                                        </VStack>
                                    )}

                                    <Grid
                                        templateColumns="repeat(auto-fill, minmax(350px, 1fr))"
                                        gap={6}
                                        w="100%"
                                        maxH={'30rem'}
                                        overflowY={'auto'}
                                        border={'1px solid'}
                                        borderColor={'gray.300'}
                                        borderRadius={'12px'}
                                        padding={4}
                                    >
                                        {lists && lists.map((leadList) => (
                                            <LeadListCard
                                                onClickCard={() => handleSelectList(leadList.id)}
                                                borderColor={selectedList === leadList.id ? 'purple.500' : 'rgba(255, 255, 255, 0.2)'}
                                                key={leadList.id}
                                                leadList={leadList}
                                                onView={() => { }}
                                                onEdit={() => { }}
                                                onDelete={() => toast({
                                                    title: 'lists can only be deleted from the lead list page',
                                                    status: 'info',
                                                    duration: 3000,
                                                    isClosable: true,
                                                })}
                                                isLoading={false}
                                            />
                                        ))}
                                    </Grid>

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
                                        onClick={handleProceedToPitch}
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
                                        Proceed To Pitch
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

const LeadListCard = ({
    leadList,
    onView,
    onEdit,
    onDelete,
    isLoading,
    borderColor,
    onClickCard
}: {
    leadList: LeadListWithAccount
    onView: (id: string) => void
    onEdit: (leadList: LeadListWithAccount) => void
    onDelete: (id: string) => void
    isLoading: boolean,
    borderColor?: string,
    onClickCard?: () => void
}) => {
    const cardBg = useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(26, 32, 44, 0.8)')
    const cardBorder = 'rgba(255, 255, 255, 0.2)';
    const textColor = useColorModeValue('gray.600', 'gray.400');
    const toast = useToast();
    const customToast = createCustomToast(toast);


    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'completed':
                return { color: 'green', icon: CheckCircle, text: 'Completed' }
            case 'processing':
                return { color: 'blue', icon: Clock, text: 'Processing' }
            case 'failed':
                return { color: 'red', icon: XCircle, text: 'Failed' }
            case 'draft':
            default:
                return { color: 'gray', icon: FileText, text: 'Draft' }
        }
    }

    const statusConfig = getStatusConfig(leadList.status)
    const StatusIcon = statusConfig.icon
    const completionRate = leadList.total_leads > 0 ?
        Math.round((leadList.processed_leads / leadList.total_leads) * 100) : 0

    const onExport = () => {
        customToast.warning({
            title: 'Upgrade to enterprise to export Leads',
            // description: 'Export CSV functionality   will be available soon.',
        })
    }

    return (
        <Card
            bg={cardBg}
            backdropFilter="blur(10px)"
            border="1px solid"
            borderColor={borderColor ?? cardBorder}
            borderRadius="xl"
            p={6}
            _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
            transition="all 0.2s ease"
            position="relative"
            onClick={onClickCard ?? undefined}
        >
            <VStack spacing={4} align="stretch">
                {/* Header */}
                <HStack justify="space-between" align="start">
                    <VStack align="start" spacing={1} flex={1}>
                        <HStack spacing={2} align="center">
                            <Text fontWeight="semibold" fontSize="lg" noOfLines={1}>
                                {leadList.name}
                            </Text>
                            <Badge
                                colorScheme={statusConfig.color}
                                variant="subtle"
                                fontSize="xs"
                                px={2}
                                py={1}
                                borderRadius="md"
                            >
                                <HStack spacing={1}>
                                    <Icon as={StatusIcon} boxSize={3} />
                                    <Text>{statusConfig.text}</Text>
                                </HStack>
                            </Badge>
                        </HStack>
                        {leadList.description && (
                            <Text fontSize="sm" color={textColor} noOfLines={2}>
                                {leadList.description}
                            </Text>
                        )}
                    </VStack>
                    <Menu placement="bottom-end">
                        <MenuButton
                            as={IconButton}
                            icon={<MoreVertical size={16} />}
                            variant="ghost"
                            size="sm"
                            isLoading={isLoading}
                            zIndex={10}
                        />
                        <MenuList
                            zIndex={1500}
                            bg={cardBg}
                            border="1px solid"
                            borderColor={cardBorder}
                            boxShadow="xl"
                            borderRadius="md"
                            backdropFilter="blur(10px)"
                        >
                            {/* <MenuItem icon={<Eye size={16} />} onClick={() => onView(leadList.id)}>
                                View Details
                            </MenuItem>
                            <MenuItem icon={<Settings size={16} />} onClick={() => onEdit(leadList)}>
                                Edit
                            </MenuItem> */}
                            <MenuItem icon={<Download size={16} />} onClick={onExport}>
                                Export CSV
                            </MenuItem>
                            <Divider />
                            <MenuItem
                                icon={<Trash2 size={16} />}
                                color="red.500"
                                onClick={() => onDelete(leadList.id)}
                            >
                                Delete
                            </MenuItem>
                        </MenuList>
                    </Menu>
                </HStack>

                {/* Stats */}
                <SimpleGrid columns={3} spacing={4}>
                    <VStack spacing={1}>
                        <Text fontSize="2xl" fontWeight="bold" color="purple.500">
                            {leadList.total_leads}
                        </Text>
                        <Text fontSize="xs" color={textColor}>Total Leads</Text>
                    </VStack>
                    <VStack spacing={1}>
                        <Text fontSize="2xl" fontWeight="bold" color="green.500">
                            {leadList.processed_leads}
                        </Text>
                        <Text fontSize="xs" color={textColor}>Processed</Text>
                    </VStack>
                    <VStack spacing={1}>
                        <Text fontSize="2xl" fontWeight="bold" color="red.500">
                            {leadList.failed_leads}
                        </Text>
                        <Text fontSize="xs" color={textColor}>Failed</Text>
                    </VStack>
                </SimpleGrid>

                {/* Progress Bar */}
                {leadList.status === 'processing' && (
                    <Box>
                        <HStack justify="space-between" mb={2}>
                            <Text fontSize="sm" color={textColor}>Processing Progress</Text>
                            <Text fontSize="sm" color={textColor}>{completionRate}%</Text>
                        </HStack>
                        <Progress
                            value={completionRate}
                            colorScheme="purple"
                            size="sm"
                            borderRadius="full"
                        />
                    </Box>
                )}

                {/* Connected Account */}
                <HStack spacing={2}>
                    {leadList.connected_account ? (
                        <>
                            <Avatar
                                size="xs"
                                src={leadList.connected_account.profile_picture_url || undefined}
                                name={leadList.connected_account.display_name}
                            />
                            <Text fontSize="sm" color={textColor}>
                                Connected to {leadList.connected_account.display_name}
                            </Text>
                            <Badge
                                size="sm"
                                colorScheme={leadList.connected_account.connection_status === 'connected' ? 'green' : 'red'}
                            >
                                {leadList.connected_account.connection_status}
                            </Badge>
                        </>
                    ) : (
                        <>
                            <Icon as={AlertCircle} boxSize={4} color="gray.400" />
                            <Text fontSize="sm" color="gray.400">
                                No account connected
                            </Text>
                        </>
                    )}
                </HStack>
                {/* Last Updated */}
                <Text fontSize="xs" color={textColor}>
                    Updated {new Date(leadList.updated_at).toLocaleDateString()}
                </Text>

                {/* Actions */}
                {/* <HStack spacing={2} justify="flex-end">
                    <Button
                        size="sm"
                        variant="ghost"
                        leftIcon={<Eye size={14} />}
                        onClick={() => onView(leadList.id)}
                    >
                        View
                    </Button>
                </HStack> */}
            </VStack>
        </Card>
    )
}