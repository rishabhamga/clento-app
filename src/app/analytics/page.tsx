'use client'

import {
    Box,
    Container,
    VStack,
    Heading,
    Text,
    Card,
    CardBody,
    SimpleGrid,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    Badge,
    useColorModeValue,
    Icon,
    Spinner,
    Center,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription
} from '@chakra-ui/react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { GradientButton } from '@/components/ui/GradientButton'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Campaign, DbCampaign } from '../dashboard/page'
import { emailAnalytics } from '../email-leads/page'
import CampaignCard from '@/components/ui/CampaignCard'
import { Droplet, Mails, SendToBackIcon } from 'lucide-react'
import { Mail } from 'lucide-react'
import { MailOpen } from 'lucide-react'
import { MousePointerClick } from 'lucide-react'
import { Reply } from 'lucide-react'

interface LinkedinStats {
    requestsSent: number,
    accepted: number,
    replied: number,
    profileVisits: number,
    likePosts: number,
    commentPosts: number,
    sendFollowup: number
}

interface Analytics {
    campaigns: Campaign[]
    linkedinStats: LinkedinStats
    emailStats: emailAnalytics
}

export default function AnalyticsPage() {
    const router = useRouter()
    const cardBg = useColorModeValue('white', 'gray.700')
    const glassBg = useColorModeValue('rgba(255, 255, 255, 0.1)', 'rgba(26, 32, 44, 0.1)')
    const borderColor = useColorModeValue('rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)')
    const subjectBg = useColorModeValue('purple.50', 'purple.900')
    const [campaigns, setCampaigns] = useState<Campaign[]>()
    const [linkedinStats, setLinkedinStats] = useState<LinkedinStats>()
    const [emailStats, setEmailStats] = useState<emailAnalytics>()
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)

            const res = await fetch('/api/analytics')
            const data = await res.json()

                const uiCampaigns = data.campaigns?.map((campaign: DbCampaign) => {
                    const leadCount = campaign.settings?.leadCount || 0
                    const totalLeads = campaign.settings?.totalLeads || 0

                    let type: 'Standard' | 'Watchtower' | 'Local' = 'Standard'
                    if (campaign.settings?.campaignType === 'watchtower') {
                        type = 'Watchtower'
                    } else if (campaign.settings?.campaignType === 'local') {
                        type = 'Local'
                    }
                    return {
                        id: campaign.id,
                        name: campaign.name,
                        type,
                        leads: {
                            current: leadCount,
                            total: totalLeads
                        },
                        createdAt: campaign.created_at,
                        status: campaign.status
                    }
                }) || []

                setCampaigns(uiCampaigns)
                setLinkedinStats(data.linkedinStats || {})
                setEmailStats(data.emailStats || {})
            } catch (err) {
                console.error('Error fetching analytics:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    // Loading state
    if (loading) {
        return (
            <DashboardLayout>
                <Container maxW="7xl" py={8}>
                    <Center h="400px">
                        <VStack spacing={4}>
                            <Spinner size="xl" color="purple.500" thickness="4px" />
                            <Text color="gray.600" fontSize="lg">
                                Loading analytics data...
                            </Text>
                        </VStack>
                    </Center>
                </Container>
            </DashboardLayout>
        )
    }

    // No data state
    const hasData = campaigns && campaigns.length > 0
    const hasStats = linkedinStats && Object.keys(linkedinStats).length > 0 ||
                     emailStats && Object.keys(emailStats).length > 0

    if (!hasData && !hasStats) {
        return (
            <DashboardLayout>
                <Container maxW="7xl" py={8}>
                    <VStack spacing={8} align="stretch">
                        {/* Header */}
                        <Box>
                            <Heading size="lg" mb={2}>Analytics</Heading>
                            <Text color="gray.600">
                                Track your campaign performance and lead generation metrics
                            </Text>
                        </Box>

                        {/* No Data State */}
                        <Center h="400px">
                            <VStack spacing={4} textAlign="center">
                                <Icon as={Mails} boxSize={16} color="gray.400" />
                                <Heading size="md" color="gray.600">
                                    No Analytics Data Available
                                </Heading>
                                <Text color="gray.500" maxW="md">
                                    Start creating campaigns and generating leads to see your analytics here.
                                    Your performance metrics will appear once you have active campaigns.
                                </Text>
                            </VStack>
                        </Center>
                    </VStack>
                </Container>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <Container maxW="7xl" py={8}>
                <VStack spacing={8} align="stretch">
                    {/* Header */}
                    <Box>
                        <Heading size="lg" mb={2}>Analytics</Heading>
                        <Text color="gray.600">
                            Track your campaign performance and lead generation metrics
                        </Text>
                    </Box>

                    {hasStats && (
                        <Box>
                            <Text color="gray.600" fontSize="lg" fontWeight="bold" mb={4}>
                                LinkedIn Stats
                            </Text>
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
                                    <Icon as={SendToBackIcon} boxSize={5} color="blue.500" />
                                    <Text fontSize="2xl" fontWeight="bold">
                                        {linkedinStats?.requestsSent || 0}
                                    </Text>
                                    <Text fontSize="xs" color="gray.600">Requests Sent</Text>
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
                                    <Icon as={Mail} boxSize={5} color="green.500" />
                                    <Text fontSize="2xl" fontWeight="bold">
                                        {linkedinStats?.accepted || 0}
                                    </Text>
                                    <Text fontSize="xs" color="gray.600">Accepted</Text>
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
                                        {linkedinStats?.replied || 0}
                                    </Text>
                                    <Text fontSize="xs" color="gray.600">Replied</Text>
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
                                    <Icon as={MailOpen} boxSize={5} color="orange.500" />
                                    <Text fontSize="2xl" fontWeight="bold">
                                        {linkedinStats?.profileVisits || 0}
                                    </Text>
                                    <Text fontSize="xs" color="gray.600">Profile Visits</Text>
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
                                    <Icon as={MousePointerClick} boxSize={5} color="red.500" />
                                    <Text fontSize="2xl" fontWeight="bold">
                                        {linkedinStats?.likePosts || 0}
                                    </Text>
                                    <Text fontSize="xs" color="gray.600">Like Posts</Text>
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
                                    <Icon as={Mails} boxSize={5} color="teal.500" />
                                    <Text fontSize="2xl" fontWeight="bold">
                                        {linkedinStats?.commentPosts || 0}
                                    </Text>
                                    <Text fontSize="xs" color="gray.600">Comment Posts</Text>
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
                                    <Icon as={Droplet} boxSize={5} color="pink.500" />
                                    <Text fontSize="2xl" fontWeight="bold">
                                        {linkedinStats?.sendFollowup || 0}
                                    </Text>
                                    <Text fontSize="xs" color="gray.600">Send Followup</Text>
                                </VStack>
                            </Card>
                        </SimpleGrid>
                        </Box>
                    )}

                    {hasStats && (
                        <Box>
                            <Text color="gray.600" fontSize="lg" fontWeight="bold" mb={4}>
                                Email Stats
                            </Text>
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
                                        {emailStats?.totalCount || 0}
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
                                        {emailStats?.sentCount || 0}
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
                                        {emailStats?.openCount || 0}
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
                                        {emailStats?.clickCount || 0}
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
                                        {emailStats?.replyCount || 0}
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
                                        {emailStats?.uniqueSentCount || 0}
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
                                        {emailStats?.bounceCount || 0}
                                    </Text>
                                    <Text fontSize="xs" color="gray.600">Bounced</Text>
                                </VStack>
                        </Card>
                        </SimpleGrid>
                        </Box>
                    )}

                    {hasData && (
                        <Box>
                            <Text color="gray.600" fontSize="lg" fontWeight="bold" mb={4}>
                                Campaigns
                            </Text>
                            {campaigns?.map((campaign) => (
                        <CampaignCard key={campaign.id} id={campaign.id} name={campaign.name} type={campaign.type} leads={campaign.leads} createdAt={campaign.createdAt}
                            onClick={() => router.push(`/campaigns/${campaign.id}`)}
                            onMenuClick={() => {
                                router.push(`/campaigns/${campaign.id}`)
                            }}
                            />
                            ))}
                        </Box>
                    )}
                </VStack>
            </Container>
        </DashboardLayout>
    )
}