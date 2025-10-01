'use client'

// External libraries
import { useUser } from '@clerk/nextjs'
import { useOrganization } from '@clerk/nextjs'
import {
    Box,
    Heading,
    Text,
    VStack,
    HStack,
    Grid,
    SimpleGrid,
    Input,
    InputGroup,
    InputLeftElement,
    Icon,
    useColorModeValue,
    Spinner,
    Alert,
    AlertIcon,
    Badge,
    Card,
    CardBody,
    Button,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    useToast,
    Tooltip,
    Avatar
} from '@chakra-ui/react'
import {
    Search,
    Plus,
    RefreshCw,
    Settings,
    Trash2,
    CheckCircle,
    AlertCircle,
    Clock,
    XCircle,
    ExternalLink,
    Linkedin,
    Mail,
    Twitter,
    Facebook,
    Instagram,
    MessageSquare,
    Send
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

// Internal components
import DashboardLayout from '@/components/layout/DashboardLayout'
import { GradientButton } from '@/components/ui/GradientButton'

// Types
interface UserAccount {
    id: string
    user_id: string
    organization_id: string | null
    unipile_account_id: string | null
    provider: 'linkedin' | 'email' | 'twitter' | 'facebook' | 'instagram' | 'whatsapp' | 'telegram' | 'messenger'
    account_type: 'personal' | 'business' | 'page'
    display_name: string
    username: string | null
    email: string | null
    profile_picture_url: string | null
    connection_status: 'connected' | 'disconnected' | 'expired' | 'error' | 'pending' | 'credentials'
    last_sync_at: string | null
    expires_at: string | null
    unipile_data: {
        premium_status?: {
            is_premium: boolean;
            premium_id: string | null;
            premium_features: string[];
            premium_contract_id: string | null;
        };
        [key: string]: any;
    }
    capabilities: Record<string, unknown>[]
    created_at: string
    updated_at: string
}

interface SyndieSeat {
    id: string,
    name: string,
    profilePictureUrl: string,
    accountType: string,
    isLinkedInConnected: boolean,
    totalCampaigns: number,
    totalLeads: number,
    activeCampaigns: number,
    totalDailyOutreach: number,
    linkedinProfile: any,
    createdAt: Date,
    updatedAt: Date
}

interface AccountStats {
    total_accounts: number
    connected_accounts: number
    by_provider: Record<string, { total: number; connected: number }>
}

// Provider configuration
const PROVIDERS = {
    linkedin: {
        name: 'LinkedIn',
        icon: Linkedin,
        color: 'blue',
        available: true,
        description: 'Connect your LinkedIn account for professional outreach'
    },
    email: {
        name: 'Email',
        icon: Mail,
        color: 'green',
        available: false,
        description: 'Connect your email accounts'
    },
    twitter: {
        name: 'Twitter',
        icon: Twitter,
        color: 'blue',
        available: false,
        description: 'Connect your Twitter account'
    },
    facebook: {
        name: 'Facebook',
        icon: Facebook,
        color: 'blue',
        available: false,
        description: 'Connect your Facebook account'
    },
    instagram: {
        name: 'Instagram',
        icon: Instagram,
        color: 'purple',
        available: false,
        description: 'Connect your Instagram account'
    }
} as const

// Syndie Seat Card Component
const SyndieSeatCard = ({
    seat
}: {
    seat: SyndieSeat
}) => {
    const cardBg = useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(26, 32, 44, 0.8)')
    const cardBorder = useColorModeValue('rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)')
    const textColor = useColorModeValue('gray.600', 'gray.400')

    return (
        <Card
            bg={cardBg}
            backdropFilter="blur(10px)"
            border="1px solid"
            borderColor={cardBorder}
            borderRadius="xl"
            p={6}
            _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
            transition="all 0.2s ease"
            position="relative"
        >
            <VStack spacing={4} align="stretch">
                {/* Header */}
                <HStack justify="space-between" align="start">
                    <HStack spacing={3}>
                        <Avatar
                            size="md"
                            src={seat.profilePictureUrl || undefined}
                            name={seat.name}
                            bg="purple.500"
                            icon={<Icon as={Linkedin} boxSize={5} />}
                        />
                        <VStack align="start" spacing={1}>
                            <Text fontWeight="semibold" fontSize="md">
                                {seat.name}
                            </Text>
                        </VStack>
                    </HStack>
                    <Badge
                        colorScheme={seat.isLinkedInConnected ? 'green' : 'gray'}
                        variant="subtle"
                        fontSize="xs"
                        px={2}
                        py={1}
                        borderRadius="md"
                    >
                        <HStack spacing={1}>
                            <Icon as={seat.isLinkedInConnected ? CheckCircle : XCircle} boxSize={3} />
                            <Text>{seat.isLinkedInConnected ? 'Connected' : 'Disconnected'}</Text>
                        </HStack>
                    </Badge>
                </HStack>

                {/* Account Type */}
                <HStack spacing={2}>
                    <Icon as={Linkedin} boxSize={4} color="blue.500" />
                    <Text fontSize="sm" color={textColor}>
                        LinkedIn • {seat.accountType}
                    </Text>
                </HStack>

                {/* Last Updated */}
                {seat.updatedAt && (
                    <Text fontSize="xs" color={textColor}>
                        Last updated: {new Date(seat.updatedAt).toLocaleDateString()}
                    </Text>
                )}
            </VStack>
        </Card>
    )
}

// Account Card Component
const AccountCard = ({
    account,
    onSync,
    onDisconnect,
    onTestMessage,
    isLoading,
    isTestingMessage
}: {
    account: UserAccount
    onSync: (id: string) => void
    onDisconnect: (id: string) => void
    onTestMessage: (id: string) => void
    isLoading: boolean
    isTestingMessage: boolean
}) => {
    const cardBg = useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(26, 32, 44, 0.8)')
    const cardBorder = useColorModeValue('rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)')
    const textColor = useColorModeValue('gray.600', 'gray.400')

    const provider = PROVIDERS[account.provider] || {
        name: account.provider,
        icon: Settings,
        color: 'gray',
        available: false,
        description: ''
    }

    const getStatusConfig = (status: UserAccount['connection_status']) => {
        switch (status) {
            case 'connected':
                return { color: 'green', icon: CheckCircle, text: 'Connected' }
            case 'pending':
                return { color: 'blue', icon: Clock, text: 'Connecting...' }
            case 'expired':
            case 'credentials':
                return { color: 'orange', icon: AlertCircle, text: 'Needs Attention' }
            case 'error':
                return { color: 'red', icon: XCircle, text: 'Error' }
            case 'disconnected':
            default:
                return { color: 'gray', icon: XCircle, text: 'Disconnected' }
        }
    }

    const statusConfig = getStatusConfig(account.connection_status)
    const StatusIcon = statusConfig.icon

    return (
        <Card
            bg={cardBg}
            backdropFilter="blur(10px)"
            border="1px solid"
            borderColor={cardBorder}
            borderRadius="xl"
            p={6}
            _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
            transition="all 0.2s ease"
            position="relative"
        >
            <VStack spacing={4} align="stretch">
                {/* Header */}
                <HStack justify="space-between" align="start">
                    <HStack spacing={3}>
                        <Avatar
                            size="md"
                            src={account.profile_picture_url || undefined}
                            name={account.display_name}
                            bg={`${provider.color}.500`}
                            icon={<Icon as={provider.icon} boxSize={5} />}
                        />
                        <VStack align="start" spacing={1}>
                            <HStack spacing={2} align="center">
                                <Text fontWeight="semibold" fontSize="md">
                                    {account.display_name}
                                </Text>
                                {/* Premium Status Badge */}
                                {account.unipile_data?.premium_status?.is_premium && (
                                    <Badge
                                        colorScheme="yellow"
                                        variant="solid"
                                        fontSize="xs"
                                        px={2}
                                        py={0.5}
                                        borderRadius="full"
                                    >
                                        Premium
                                    </Badge>
                                )}

                            </HStack>
                            {account.username && (
                                <Text fontSize="sm" color={textColor}>
                                    @{account.username}
                                </Text>
                            )}
                        </VStack>
                    </HStack>
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

                {/* Provider Info */}
                <HStack spacing={2}>
                    <Icon as={provider.icon} boxSize={4} color={`${provider.color}.500`} />
                    <Text fontSize="sm" color={textColor}>
                        {provider.name} • {account.account_type}
                    </Text>
                </HStack>

                {/* Last Sync */}
                {account.last_sync_at && (
                    <Text fontSize="xs" color={textColor}>
                        Last synced: {new Date(account.last_sync_at).toLocaleDateString()}
                    </Text>
                )}

                {/* Actions */}
                <HStack spacing={2} justify="flex-end">
                    {account.connection_status === 'connected' && (
                        <>
                            <Tooltip label="Send test message">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    colorScheme="green"
                                    leftIcon={<Send size={14} />}
                                    onClick={() => onTestMessage(account.id)}
                                    isLoading={isTestingMessage}
                                    loadingText="Testing"
                                >
                                    Test
                                </Button>
                            </Tooltip>
                            <Tooltip label="Sync account data">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    leftIcon={<RefreshCw size={14} />}
                                    onClick={() => onSync(account.id)}
                                    isLoading={isLoading}
                                    loadingText="Syncing"
                                >
                                    Sync
                                </Button>
                            </Tooltip>
                        </>
                    )}
                    <Tooltip label="Disconnect account">
                        <Button
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            leftIcon={<Trash2 size={14} />}
                            onClick={() => onDisconnect(account.id)}
                            isLoading={isLoading}
                        >
                            Disconnect
                        </Button>
                    </Tooltip>
                </HStack>
            </VStack>
        </Card>
    )
}

// Connect New Account Card Component
const ConnectAccountCard = ({
    provider,
    config,
    onConnect,
    isLoading
}: {
    provider: string
    config: typeof PROVIDERS[keyof typeof PROVIDERS]
    onConnect: (provider: string) => void
    isLoading: boolean
}) => {
    const cardBg = useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(26, 32, 44, 0.8)')
    const cardBorder = useColorModeValue('rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)')

    return (
        <Card
            bg={cardBg}
            backdropFilter="blur(10px)"
            border="1px solid"
            borderColor={cardBorder}
            borderRadius="xl"
            p={6}
            _hover={config.available ? { transform: 'translateY(-2px)', boxShadow: 'lg' } : {}}
            transition="all 0.2s ease"
            opacity={config.available ? 1 : 0.6}
            cursor={config.available ? 'pointer' : 'not-allowed'}
            onClick={config.available ? () => onConnect(provider) : undefined}
        >
            <VStack spacing={4}>
                <Icon as={config.icon} boxSize={8} color={`${config.color}.500`} />
                <VStack spacing={1}>
                    <Text fontWeight="semibold" fontSize="md">
                        {config.name}
                    </Text>
                    <Text fontSize="sm" color="gray.500" textAlign="center">
                        {config.description}
                    </Text>
                </VStack>
                {config.available ? (
                    <GradientButton
                        size="sm"
                        variant="primary"
                        leftIcon={<Plus size={14} />}
                        isLoading={isLoading}
                        loadingText="Connecting"
                        onClick={(e) => {
                            e.stopPropagation()
                            onConnect(provider)
                        }}
                    >
                        Connect
                    </GradientButton>
                ) : (
                    <Badge colorScheme="gray" variant="subtle">
                        Coming Soon
                    </Badge>
                )}
            </VStack>
        </Card>
    )
}

// Component that uses useSearchParams (needs to be wrapped in Suspense)
function AccountsPageContent() {
    const { user, isLoaded } = useUser()
    const { organization } = useOrganization()
    const router = useRouter()
    const searchParams = useSearchParams()
    const toast = useToast()
    const { isOpen, onOpen, onClose } = useDisclosure()

    const [state, setState] = useState({
        accounts: [] as UserAccount[],
        syndieSeats: [] as SyndieSeat[],
        isSyndieAccount: false,
        stats: null as AccountStats | null,
        loading: true,
        error: null as string | null,
        searchQuery: '',
        syncingAccountId: null as string | null,
        disconnectingAccountId: null as string | null,
        connectingProvider: null as string | null,
        testingMessageAccountId: null as string | null
    })

    const cardBg = useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(26, 32, 44, 0.8)')
    const cardBorder = useColorModeValue('rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)')
    const searchBg = useColorModeValue('white', 'gray.800')
    const searchBorder = useColorModeValue('gray.200', 'gray.700')

    // Check for connection success/error in URL params
    useEffect(() => {
        const connected = searchParams.get('connected')
        const error = searchParams.get('error')

        if (connected === 'true') {
            toast({
                title: 'Account Connected',
                description: 'Your account has been successfully connected!',
                status: 'success',
                duration: 5000,
                isClosable: true,
            })
            // Clean up URL
            router.replace('/accounts')
        } else if (error) {
            toast({
                title: 'Connection Failed',
                description: 'Failed to connect your account. Please try again.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            })
            // Clean up URL
            router.replace('/accounts')
        }
    }, [searchParams, toast, router])

    // Fetch accounts
    useEffect(() => {
        const fetchAccounts = async () => {
            if (!user) return

            try {
                const params = new URLSearchParams()
                if (organization?.id) {
                    params.append('organizationId', organization.id)
                }

                const url = `/api/accounts${params.toString() ? `?${params.toString()}` : ''}`
                const response = await fetch(url)

                if (!response.ok) {
                    throw new Error('Failed to fetch accounts')
                }

                const data = await response.json()

                // Check if the backend sent syndie seats
                if(data.syndieSeats === true){
                    setState(prev => ({
                        ...prev,
                        syndieSeats: data.accounts || [],
                        isSyndieAccount: true,
                        accounts: [],
                        stats: null,
                        loading: false
                    }))
                } else {
                    // Filter out disconnected accounts from the UI
                    const activeAccounts = (data.accounts || []).filter((account: UserAccount) =>
                        account.connection_status !== 'disconnected'
                    )
                    setState(prev => ({
                        ...prev,
                        accounts: activeAccounts,
                        syndieSeats: [],
                        isSyndieAccount: false,
                        stats: data.stats,
                        loading: false
                    }))
                }
            } catch (err) {
                setState(prev => ({
                    ...prev,
                    error: 'Failed to load accounts. Please try refreshing the page.',
                    loading: false
                }))
            }
        }

        if (isLoaded && user) {
            fetchAccounts()
        }
    }, [isLoaded, user, organization?.id])

    const handleConnect = async (provider: string) => {
        setState(prev => ({ ...prev, connectingProvider: provider }))

        try {
            const response = await fetch('/api/accounts/connect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    provider,
                    organization_id: organization?.id,
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to initiate connection')
            }

            const data = await response.json()

            // Redirect to Unipile hosted auth
            window.location.href = data.connection_url

        } catch (error) {
            console.error('Error connecting account:', error)
            toast({
                title: 'Connection Failed',
                description: 'Failed to start the connection process. Please try again.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            })
        } finally {
            setState(prev => ({ ...prev, connectingProvider: null }))
        }
    }

    const handleSync = async (accountId: string) => {
        setState(prev => ({ ...prev, syncingAccountId: accountId }))

        try {
            const response = await fetch(`/api/accounts/sync/${accountId}`, {
                method: 'POST',
            })

            if (!response.ok) {
                throw new Error('Failed to sync account')
            }

            const data = await response.json()

            // Update the account in state
            setState(prev => ({
                ...prev,
                accounts: prev.accounts.map(acc =>
                    acc.id === accountId ? data.account : acc
                )
            }))

            toast({
                title: 'Account Synced',
                description: data.message || 'Account data has been updated.',
                status: 'success',
                duration: 3000,
                isClosable: true,
            })

        } catch (error) {
            console.error('Error syncing account:', error)
            toast({
                title: 'Sync Failed',
                description: 'Failed to sync account data. Please try again.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            })
        } finally {
            setState(prev => ({ ...prev, syncingAccountId: null }))
        }
    }

    const handleDisconnect = async (accountId: string) => {
        setState(prev => ({ ...prev, disconnectingAccountId: accountId }))

        try {
            const response = await fetch(`/api/accounts/disconnect/${accountId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    deleteAccount: false // Just disconnect, don't delete
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to disconnect account')
            }

            const data = await response.json()

            // Update the account in state
            setState(prev => ({
                ...prev,
                accounts: prev.accounts.map(acc =>
                    acc.id === accountId ? data.account : acc
                )
            }))

            toast({
                title: 'Account Disconnected',
                description: data.message || 'Account has been disconnected.',
                status: 'info',
                duration: 3000,
                isClosable: true,
            })

        } catch (error) {
            console.error('Error disconnecting account:', error)
            toast({
                title: 'Disconnect Failed',
                description: 'Failed to disconnect account. Please try again.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            })
        } finally {
            setState(prev => ({ ...prev, disconnectingAccountId: null }))
        }
    }

    const handleTestMessage = async (accountId: string) => {
        setState(prev => ({ ...prev, testingMessageAccountId: accountId }))

        try {
            const response = await fetch(`/api/accounts/${accountId}/test-message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Failed to send test message')
            }

            const data = await response.json()

            // Handle different types of successful actions
            const actionTaken = data.data.actionTaken
            let toastTitle = 'Test Successful! 🚀'
            let toastDescription = ''

            if (actionTaken === 'connection_request') {
                toastTitle = 'Connection Request Sent! 🤝'
                toastDescription = `Sent connection request to ${data.data.recipientProfile.name}. Direct messaging wasn't possible.`
            } else {
                toastTitle = 'Test Message Sent! 💬'
                toastDescription = `Successfully sent test message to ${data.data.recipientProfile.name}`
            }

            toast({
                title: toastTitle,
                description: toastDescription,
                status: 'success',
                duration: 6000,
                isClosable: true,
            })

        } catch (error: any) {
            console.error('Error sending test message:', error)

            let errorTitle = 'Test Failed'
            let errorDescription = 'Failed to send test message. Please try again.'

            if (error.message.includes('Profile not found')) {
                errorTitle = 'Profile Not Found'
                errorDescription = 'The test contact profile could not be found on LinkedIn.'
            } else if (error.message.includes('Connection required')) {
                errorTitle = 'Connection Required'
                errorDescription = 'You need to connect with the test contact first before sending messages.'
            } else if (error.message.includes('Rate limit')) {
                errorTitle = 'Rate Limited'
                errorDescription = 'LinkedIn messaging rate limit reached. Please try again later.'
            } else if (error.message.includes('Invalid request parameters')) {
                errorTitle = 'API Format Error'
                errorDescription = 'There was an issue with the request format. This has been logged for debugging.'
            } else if (error.message.includes('Recipient cannot be reached')) {
                errorTitle = 'Cannot Reach Recipient'
                errorDescription = 'The recipient may not be a first-degree connection. Try sending a connection request first.'
            } else if (error.message.includes('Invalid credentials')) {
                errorTitle = 'API Credentials Error'
                errorDescription = 'There was an issue with the Unipile API credentials. Please check the configuration.'
            } else if (error.message.includes('Account appears to be disconnected')) {
                errorTitle = 'Account Disconnected'
                errorDescription = 'Your LinkedIn account appears to be disconnected from Unipile. Please reconnect.'
            } else if (error.message.includes('Invalid request parameters')) {
                errorTitle = 'API Parameter Error'
                errorDescription = 'There was an issue with the request format. This has been logged for debugging.'
            }

            toast({
                title: errorTitle,
                description: errorDescription,
                status: 'error',
                duration: 8000,
                isClosable: true,
            })
        } finally {
            setState(prev => ({ ...prev, testingMessageAccountId: null }))
        }
    }

    const filteredAccounts = state.accounts.filter(account =>
        account.display_name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        account.provider.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        (account.username && account.username.toLowerCase().includes(state.searchQuery.toLowerCase()))
    )

    const filteredSyndieSeats = state.syndieSeats.filter(seat =>
        seat.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        seat.accountType.toLowerCase().includes(state.searchQuery.toLowerCase())
    )

    if (!isLoaded || state.loading) {
        return (
            <DashboardLayout>
                <VStack spacing={6} justify="center" h="400px">
                    <Spinner size="xl" color="purple.500" />
                    <Text>Loading your accounts...</Text>
                </VStack>
            </DashboardLayout>
        )
    }

    if (state.error) {
        return (
            <DashboardLayout>
                <Alert status="error">
                    <AlertIcon />
                    {state.error}
                </Alert>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <VStack spacing={8} align="stretch">
                {/* Header */}
                <HStack justify="space-between" align="center">
                    <VStack spacing={1} align="start">
                        <Heading
                            size="xl"
                            bgGradient="linear(to-r, purple.400, blue.400)"
                            bgClip="text"
                            fontWeight="bold"
                        >
                            Connected Accounts
                        </Heading>
                        <Text color="gray.600" fontSize="lg">
                            Manage your social media and communication accounts for automated outreach
                        </Text>
                    </VStack>
                    <GradientButton
                        leftIcon={<Plus size={16} />}
                        variant="primary"
                        size="lg"
                        onClick={onOpen}
                    >
                        Connect Account
                    </GradientButton>
                </HStack>

                {/* Search Bar */}
                <InputGroup maxW="400px">
                    <InputLeftElement>
                        <Icon as={Search} boxSize={5} color="gray.400" />
                    </InputLeftElement>
                    <Input
                        placeholder="Search accounts"
                        value={state.searchQuery}
                        onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
                        bg={searchBg}
                        border="1px"
                        borderColor={searchBorder}
                        borderRadius="lg"
                        _focus={{
                            borderColor: "purple.400",
                            boxShadow: "0 0 0 1px var(--chakra-colors-purple-400)"
                        }}
                    />
                </InputGroup>

                {/* Stats Cards */}
                {state.stats && (
                    <SimpleGrid columns={{ base: 2, md: 4 }} spacing={6}>
                        <Card
                            bg={cardBg}
                            backdropFilter="blur(10px)"
                            border="1px solid"
                            borderColor={cardBorder}
                            borderRadius="xl"
                            p={4}
                            _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                            transition="all 0.2s ease"
                        >
                            <VStack spacing={1}>
                                <Icon as={Settings} boxSize={5} color="purple.500" />
                                <Text fontSize="2xl" fontWeight="bold">
                                    {state.stats.total_accounts}
                                </Text>
                                <Text fontSize="xs" color="gray.600">Total Accounts</Text>
                            </VStack>
                        </Card>

                        <Card
                            bg={cardBg}
                            backdropFilter="blur(10px)"
                            border="1px solid"
                            borderColor={cardBorder}
                            borderRadius="xl"
                            p={4}
                            _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                            transition="all 0.2s ease"
                        >
                            <VStack spacing={1}>
                                <Icon as={CheckCircle} boxSize={5} color="green.500" />
                                <Text fontSize="2xl" fontWeight="bold">
                                    {state.stats.connected_accounts}
                                </Text>
                                <Text fontSize="xs" color="gray.600">Connected</Text>
                            </VStack>
                        </Card>

                        <Card
                            bg={cardBg}
                            backdropFilter="blur(10px)"
                            border="1px solid"
                            borderColor={cardBorder}
                            borderRadius="xl"
                            p={4}
                            _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                            transition="all 0.2s ease"
                        >
                            <VStack spacing={1}>
                                <Icon as={Linkedin} boxSize={5} color="blue.500" />
                                <Text fontSize="2xl" fontWeight="bold">
                                    {state.stats.by_provider.linkedin?.connected || 0}
                                </Text>
                                <Text fontSize="xs" color="gray.600">LinkedIn</Text>
                            </VStack>
                        </Card>

                        <Card
                            bg={cardBg}
                            backdropFilter="blur(10px)"
                            border="1px solid"
                            borderColor={cardBorder}
                            borderRadius="xl"
                            p={4}
                            _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                            transition="all 0.2s ease"
                        >
                            <VStack spacing={1}>
                                <Icon as={ExternalLink} boxSize={5} color="orange.500" />
                                <Text fontSize="2xl" fontWeight="bold">
                                    {Object.keys(state.stats.by_provider).length}
                                </Text>
                                <Text fontSize="xs" color="gray.600">Platforms</Text>
                            </VStack>
                        </Card>
                    </SimpleGrid>
                )}

                {/* Accounts Grid */}
                <Box>
                    {state.isSyndieAccount ? (
                        // Display Syndie Seats
                        <>
                            <Heading size="md" mb={4} color="purple.600">
                                Accounts
                            </Heading>
                            <Grid
                                templateColumns="repeat(auto-fill, minmax(300px, 1fr))"
                                gap={6}
                                w="100%"
                            >
                                {filteredSyndieSeats.map((seat) => (
                                    <SyndieSeatCard
                                        key={seat.id}
                                        seat={seat}
                                    />
                                ))}
                            </Grid>

                            {filteredSyndieSeats.length === 0 && state.searchQuery && (
                                <Box textAlign="center" py={12}>
                                    <Text color="gray.500" fontSize="lg">
                                        No accounts found
                                    </Text>
                                </Box>
                            )}

                            {state.syndieSeats.length === 0 && (
                                <Box textAlign="center" py={12}>
                                    <Text color="gray.500" fontSize="lg">
                                        No syndie accounts found.
                                    </Text>
                                </Box>
                            )}
                        </>
                    ) : (
                        // Display Regular Accounts
                        <>
                            <Grid
                                templateColumns="repeat(auto-fill, minmax(300px, 1fr))"
                                gap={6}
                                w="100%"
                            >
                                {filteredAccounts.map((account) => (
                                    <AccountCard
                                        key={account.id}
                                        account={account}
                                        onSync={handleSync}
                                        onDisconnect={handleDisconnect}
                                        onTestMessage={handleTestMessage}
                                        isLoading={
                                            state.syncingAccountId === account.id ||
                                            state.disconnectingAccountId === account.id
                                        }
                                        isTestingMessage={state.testingMessageAccountId === account.id}
                                    />
                                ))}
                            </Grid>

                            {filteredAccounts.length === 0 && state.searchQuery && (
                                <Box textAlign="center" py={12}>
                                    <Text color="gray.500" fontSize="lg">
                                        No accounts found matching &quot;{state.searchQuery}&quot;
                                    </Text>
                                </Box>
                            )}

                            {state.accounts.length === 0 && (
                                <Box textAlign="center" py={12}>
                                    <VStack spacing={4}>
                                        <Text color="gray.500" fontSize="lg">
                                            {organization
                                                ? `No accounts connected yet in ${organization.name}. Connect your first account to get started!`
                                                : "No accounts connected yet. Connect your first account to get started!"
                                            }
                                        </Text>
                                        <GradientButton onClick={onOpen}>
                                            Connect Your First Account
                                        </GradientButton>
                                    </VStack>
                                </Box>
                            )}
                        </>
                    )}
                </Box>

                {/* Connect New Account Modal */}
                <Modal isOpen={isOpen} onClose={onClose} size="xl">
                    <ModalOverlay />
                    <ModalContent>
                        <ModalHeader>Connect New Account</ModalHeader>
                        <ModalCloseButton />
                        <ModalBody>
                            <Text mb={6} color="gray.600">
                                Choose a platform to connect your account for automated outreach.
                            </Text>
                            <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
                                {Object.entries(PROVIDERS).map(([provider, config]) => (
                                    <ConnectAccountCard
                                        key={provider}
                                        provider={provider}
                                        config={config}
                                        onConnect={handleConnect}
                                        isLoading={state.connectingProvider === provider}
                                    />
                                ))}
                            </Grid>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="ghost" onClick={onClose}>
                                Cancel
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </VStack>
        </DashboardLayout>
    )
}

// Main component with Suspense wrapper
export default function AccountsPage() {
    return (
        <Suspense fallback={
            <DashboardLayout>
                <VStack spacing={6} justify="center" h="400px">
                    <Spinner size="xl" color="purple.500" />
                    <Text>Loading accounts...</Text>
                </VStack>
            </DashboardLayout>
        }>
            <AccountsPageContent />
        </Suspense>
    )
}
