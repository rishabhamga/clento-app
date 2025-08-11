'use client'

import { createCustomToast } from '@/lib/utils/custom-toast'
import {
    Alert,
    AlertIcon,
    Box,
    Button,
    Card,
    CardHeader,
    Container,
    Divider,
    FormLabel,
    HStack,
    Heading,
    Input,
    Select,
    SimpleGrid,
    Spacer,
    Spinner,
    Table,
    TableContainer,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tr,
    VStack,
    useToast
} from '@chakra-ui/react'
import { useParams } from 'next/navigation'
import Papa from 'papaparse'
import { useEffect, useRef, useState } from 'react'
import { Organization } from '../page'

export interface CampaignData {
    id: string;
    user_id: string;
    name: string;
    description: string;
    status: string;
    sequence_template: string;
    settings: CampaignSettings;
    created_at: Date;
    updated_at: Date;
    organization_id: string;
}

export interface CampaignSettings {
    pitch: PitchSettings;
    country: string;
    industry: string | null;
    language: string;
    timezone: string;
    outreach: OutreachSettings;
    workflow: WorkflowSettings;
    autopilot: boolean;
    startDate: Date;
    startedAt: Date | null;
    targeting: TargetingSettings;
    dailyLimit: number;
    campaignType: string;
    doNotContact: string[];
    reviewRequired: boolean;
    trackingEnabled: boolean;
}

export interface PitchSettings {
    painPoints: PainPoint[];
    proofPoints: ProofPoint[];
    coachingPoints: CoachingPoint[];
    emailCoachingPoints: CoachingPoint[];
    offeringDescription: string;
    websiteUrl: string;
    websiteAnalysis: WebsiteAnalysis;
}

export interface PainPoint {
    id: string;
    title: string;
    description: string;
}

export interface ProofPoint {
    id: string;
    title: string;
    description: string;
}

export interface CoachingPoint {
    id: string;
    editable: boolean;
    instruction: string;
}

export interface WebsiteAnalysis {
    id: string;
    status: string;
    industry: string;
    core_offer: string;
    started_at: string;
    completed_at: string;
    website_url: string;
    tech_stack: string[];
    icp_summary: string;
    business_model: string;
    pages_analyzed: number;
    total_pages_found: number;
    confidence_score: number;
    competitive_advantages: string[];
    lead_magnets: LeadMagnet[];
    social_proof: SocialProof;
    case_studies: CaseStudy[];
    target_personas: TargetPersona[];
    analysis_duration_seconds: number;
}

export interface LeadMagnet {
    url: string;
    type: string;
    title: string;
    description: string;
    call_to_action: string;
    target_audience: string;
}

export interface SocialProof {
    metrics: {
        value: string;
        metric: string;
    }[];
    client_logos: string[];
    testimonials: Testimonial[];
}

export interface Testimonial {
    quote: string;
    author: string;
    company: string;
    position: string;
}

export interface CaseStudy {
    title: string;
    metrics: string;
    results: string[];
    industry: string;
    solution: string;
    challenge: string;
    client_info: string;
}

export interface TargetPersona {
    title: string;
    industry: string;
    challenges: string[];
    pain_points: string[];
    company_size: string;
    demographics: {
        department: string;
        seniority_level: string;
        decision_making_authority: string;
    };
    desired_outcomes: string[];
}

export interface OutreachSettings {
    signOffs: string[];
    toneOfVoice: string;
    callsToAction: string[];
    maxResourceAge: number;
    campaignLanguage: string;
    messagePersonalization: boolean;
    personalizationSources: string[];
}

export interface WorkflowSettings {
    isCustom: boolean;
    templateId: string;
    customSteps: CustomStep[];
}

export interface CustomStep {
    id: string;
    delay: number;
    channel: string;
    template: string;
    subject?: string;
    actionType: string;
    completed?: boolean;
    isActive?: boolean;
    conditions?: string[];
}

export interface TargetingSettings {
    filters: TargetingFilters;
    hasResults: boolean;
    searchType: string;
    resultsCount: number;
}

export interface TargetingFilters {
    page: number;
    perPage: number;
    hasEmail: boolean | null;
    keywords: string[];
    jobTitles: string[];
    industries: string[];
    newsEvents: string | null;
    revenueMax: number | null;
    revenueMin: number | null;
    webTraffic: number | null;
    jobPostings: number | null;
    seniorities: string[];
    intentTopics: string[];
    technologies: string[];
    fundingStages: string[];
    companyDomains: string[];
    foundedYearMax: number | null;
    foundedYearMin: number | null;
    technologyUids: string[];
    personLocations: string[];
    companyHeadcount: number[];
    fundingAmountMax: number | null;
    fundingAmountMin: number | null;
    excludeTechnologyUids: string[];
    organizationJobTitles: string[];
    organizationLocations: string[];
    excludePersonLocations: string[];
    organizationNumJobsMax: number | null;
    organizationNumJobsMin: number | null;
    organizationJobLocations: string[];
    organizationJobPostedAtMax: string | null;
    organizationJobPostedAtMin: string | null;
    excludeOrganizationLocations: string[];
}

function OrgDetailPage() {
    const params = useParams()
    const toast = useToast()
    const customToast = createCustomToast(toast)
    const [organization, setOrganization] = useState<Organization | null>(null)
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null)
    const [headers, setHeaders] = useState<string[]>();
    const [csvData, setCsvData] = useState<string[][]>([]);
    const [campaignsMeta, setCampaignsMeta] = useState<{ id: string, name: string }[]>();
    const [viewCampaignId, setViewCampaignId] = useState<string>();
    const [uploadCampaignId, setUploadCampaignId] = useState<string>();
    const [selectedCampaignData, setSelectedCampaignData] = useState<CampaignData | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [timezone, setTimezone] = useState<string>('America/Los_Angeles');
    const [dayOfWeek, setDayOfWeek] = useState<number[]>([1, 2, 3, 4, 5]);
    const [startHour, setStartHour] = useState<string>('09:00');
    const [endHour, setEndHour] = useState<string>('17:00');
    const [minTimeBetweenEmails, setMinTimeBetweenEmails] = useState<number>(10);
    const [maxNewLeadsPerDay, setMaxNewLeadsPerDay] = useState<number>(20);
    const [scheduleStartTime, setScheduleStartTime] = useState<string>(new Date().toISOString());
    const [timezones, setTimezones] = useState<{ value: string; label: string }[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                const response = await fetch(`/api/console/orgs/${params.id}`)
                if (response.ok) {
                    const data = await response.json()
                    setOrganization(data?.orgData);
                    setCampaignsMeta(data?.campaignData);
                }
            } catch (err) {
                console.log(err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    useEffect(() => {
        const handleFetchCampaignData = async () => {
            setLoading(true);
            try {
                const response = await fetch(`/api/console/campaigns/${viewCampaignId}`);
                if (response.ok) {
                    const data = await response.json();
                    setSelectedCampaignData(data?.campaignData);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        if (viewCampaignId) {
            handleFetchCampaignData();
        }
    }, [viewCampaignId])

    useEffect(() => {
        const fetchTimezones = async () => {
            const response = await fetch('/smartlead-timezones.csv');
            const csvText = await response.text();
            const parsed = Papa.parse(csvText, { header: true });
            const options = parsed.data.map((row: any) => ({
                value: row['Timezone (use this)'],
                label: row.label,
            }));
            setTimezones(options);
        };
        fetchTimezones();
    }, []);

    function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (file) {
            Papa.parse(file, {
                header: false,
                skipEmptyLines: true,
                complete: function (results) {
                    const data: string[][] = results.data as string[][];
                    if (data.length > 0) {
                        setHeaders(data[0]);
                        setCsvData(data.slice(1));
                    }
                },
            });
        }
    }

    const handleUpload = async () => {
        if (!fileInputRef.current?.files?.[0] || !uploadCampaignId) {
            customToast.error({ title: 'Error', description: 'Please provide all required fields' });
            return;
        }

        const formData = new FormData();
        formData.append('orgId', Array.isArray(params.id) ? params.id[0] : params.id!);
        formData.append('campaignId', uploadCampaignId);
        formData.append('csv', fileInputRef.current.files[0]);
        formData.append('timezone', timezone);
        formData.append('dayOfWeek', JSON.stringify(dayOfWeek));
        formData.append('startHour', startHour);
        formData.append('endHour', endHour);
        formData.append('minTimeBetweenEmails', minTimeBetweenEmails.toString());
        formData.append('maxNewLeadsPerDay', maxNewLeadsPerDay.toString());
        formData.append('scheduleStartTime', scheduleStartTime);

        try {
            const response = await fetch('/api/console/orgs/upload', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                customToast.success({ title: 'Success', description: 'List uploaded successfully' });
            } else {
                const errorData = await response.json();
                customToast.error({ title: 'Error', description: errorData.error || 'Failed to upload list' });
            }
        } catch (error) {
            console.error('Error uploading list:', error);
            customToast.error({ title: 'Error', description: 'An unexpected error occurred' });
        }
    };

    // Render campaign details
    const renderCampaignDetails = () => {
        if (!selectedCampaignData) return null;

        return (
            <Card bg="white" p={8} mt={8} boxShadow="md" borderRadius="lg">
                <Heading size="lg" mb={2} color="teal.700">{selectedCampaignData.name}</Heading>
                <Text fontSize="md" color="gray.700" mb={4}>{selectedCampaignData.description}</Text>
                <HStack mb={4} spacing={8}>
                    <VStack align="start" spacing={1}>
                        <Text fontWeight="bold">Status:</Text>
                        <Text fontWeight="bold">Created At:</Text>
                        <Text fontWeight="bold">Updated At:</Text>
                        <Text fontWeight="bold">Start Date:</Text>
                        <Text fontWeight="bold">Daily Limit:</Text>
                        <Text fontWeight="bold">Campaign Type:</Text>
                        <Text fontWeight="bold">Review Required:</Text>
                        <Text fontWeight="bold">Tracking Enabled:</Text>
                    </VStack>
                    <VStack align="start" spacing={1}>
                        <Text>{selectedCampaignData.status}</Text>
                        <Text>{selectedCampaignData.created_at ? selectedCampaignData.created_at.toLocaleString() : '-'}</Text>
                        <Text>{selectedCampaignData.updated_at ? selectedCampaignData.updated_at.toLocaleString() : '-'}</Text>
                        <Text>{selectedCampaignData.settings?.startDate ? selectedCampaignData.settings.startDate.toLocaleString() : '-'}</Text>
                        <Text>{selectedCampaignData.settings?.dailyLimit}</Text>
                        <Text>{selectedCampaignData.settings?.campaignType}</Text>
                        <Text>{selectedCampaignData.settings?.reviewRequired ? 'Yes' : 'No'}</Text>
                        <Text>{selectedCampaignData.settings?.trackingEnabled ? 'Yes' : 'No'}</Text>
                    </VStack>
                </HStack>

                <Divider my={6} />

                <Heading size="md" mb={2} color="teal.600">Settings</Heading>
                <SimpleGrid columns={[1, 2, 3]} spacing={4} mb={4}>
                    <Box>
                        <Text fontWeight="bold">Country:</Text>
                        <Text>{selectedCampaignData.settings?.country}</Text>
                    </Box>
                    <Box>
                        <Text fontWeight="bold">Industry:</Text>
                        <Text>{selectedCampaignData.settings?.industry}</Text>
                    </Box>
                    <Box>
                        <Text fontWeight="bold">Language:</Text>
                        <Text>{selectedCampaignData.settings?.language}</Text>
                    </Box>
                    <Box>
                        <Text fontWeight="bold">Timezone:</Text>
                        <Text>{selectedCampaignData.settings?.timezone}</Text>
                    </Box>
                    <Box>
                        <Text fontWeight="bold">Autopilot:</Text>
                        <Text>{selectedCampaignData.settings?.autopilot ? 'Yes' : 'No'}</Text>
                    </Box>
                </SimpleGrid>



                <Divider my={6} />
                <TableContainer mb={4}>
                    <Table variant="striped" colorScheme="gray">
                        <Thead>
                            <Tr>
                                <Th>Step</Th>
                                <Th>Channel</Th>
                                <Th>Template</Th>
                                <Th>Action Type</Th>
                                <Th>Delay (days)</Th>
                                <Th>Conditions</Th>
                                <Th>Subject</Th>
                                <Th>Completed</Th>
                                <Th>Active</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {selectedCampaignData.settings?.workflow?.customSteps?.map((step, index) => (
                                <Tr key={index}>
                                    <Td>{index + 1}</Td>
                                    <Td>{step.channel}</Td>
                                    <Td>{step.template}</Td>
                                    <Td>{step.actionType}</Td>
                                    <Td>{step.delay}</Td>
                                    <Td>{step.conditions?.join(', ') || '-'}</Td>
                                    <Td>{step.subject || '-'}</Td>
                                    <Td>{step.completed ? 'Yes' : 'No'}</Td>
                                    <Td>{step.isActive ? 'Yes' : 'No'}</Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                </TableContainer>
                <Divider my={6} />

                <Heading size="md" mb={2} color="teal.600">Targeting</Heading>
                <Spacer height={20} />
                <SimpleGrid columns={[1, 2]} spacing={4} mb={4}>
                    {Object.entries(selectedCampaignData.settings?.targeting?.filters || {}).map(([key, value]) => {
                        if (key === 'page' || key === 'perPage') return null;
                        if (Array.isArray(value)) {
                            if (value.length === 0) return null;
                            return (
                                <HStack key={key} style={{ alignItems: "start", border: "1px solid", borderRadius: "8px", padding: "12px" }}>
                                    <Text fontWeight="bold">{key}:</Text>
                                    <Text>{value.join(', ')}</Text>
                                </HStack>
                            );
                        } else if (
                            value !== null &&
                            value !== undefined &&
                            value !== '' &&
                            !(typeof value === 'object' && Object.keys(value).length === 0)
                        ) {
                            return (
                                <HStack key={key} style={{ alignItems: "start", border: "1px solid", borderRadius: "8px", padding: "12px" }}>
                                    <Text fontWeight="bold">{key}:</Text>
                                    <Text>{value.toString()}</Text>
                                </HStack>
                            );
                        }
                        return null;
                    })}
                </SimpleGrid>

                <Divider my={6} />

                <Heading size="md" mb={2} color="teal.600">Pitch Data</Heading>
                <SimpleGrid columns={[1, 2]} spacing={4} mb={4}>
                    <Box>
                        <Text fontWeight="bold">Website URL:</Text>
                        <Text>{selectedCampaignData.settings?.pitch?.websiteUrl}</Text>
                    </Box>
                    <Box>
                        <Text fontWeight="bold">Offering Description:</Text>
                        <Text>{selectedCampaignData.settings?.pitch?.offeringDescription}</Text>
                    </Box>
                </SimpleGrid>

                <Heading size="sm" mt={4} mb={2} color="teal.500">Pain Points</Heading>
                <VStack align="start" spacing={2} mb={4}>
                    {selectedCampaignData.settings?.pitch?.painPoints?.map((point, index) => (
                        <Box key={index} p={2} bg="gray.50" borderRadius="md" w="100%">
                            <Text fontWeight="bold">{point.title}</Text>
                            <Text fontSize="sm">{point.description}</Text>
                        </Box>
                    ))}
                </VStack>

                <Heading size="sm" mt={4} mb={2} color="teal.500">Proof Points</Heading>
                <VStack align="start" spacing={2} mb={4}>
                    {selectedCampaignData.settings?.pitch?.proofPoints?.map((point, index) => (
                        <Box key={index} p={2} bg="gray.50" borderRadius="md" w="100%">
                            <Text fontWeight="bold">{point.title}</Text>
                            <Text fontSize="sm">{point.description}</Text>
                        </Box>
                    ))}
                </VStack>

                <Heading size="sm" mt={4} mb={2} color="teal.500">Coaching Points</Heading>
                <VStack align="start" spacing={2} mb={4}>
                    {selectedCampaignData.settings?.pitch?.coachingPoints?.map((cp, idx) => (
                        <Box key={idx} p={2} bg="gray.50" borderRadius="md" w="100%">
                            <Text fontWeight="bold">{cp.instruction}</Text>
                            <Text fontSize="sm">Editable: {cp.editable ? 'Yes' : 'No'}</Text>
                        </Box>
                    ))}
                </VStack>

                <Heading size="sm" mt={4} mb={2} color="teal.500">Email Coaching Points</Heading>
                <VStack align="start" spacing={2} mb={4}>
                    {selectedCampaignData.settings?.pitch?.emailCoachingPoints?.map((ecp, idx) => (
                        <Box key={idx} p={2} bg="gray.50" borderRadius="md" w="100%">
                            <Text fontWeight="bold">{ecp.instruction}</Text>
                            <Text fontSize="sm">Editable: {ecp.editable ? 'Yes' : 'No'}</Text>
                        </Box>
                    ))}
                </VStack>

                <Divider my={6} />

                <Heading size="md" mb={2} color="teal.600">Outreach Data</Heading>
                <SimpleGrid columns={[1, 2, 3]} spacing={4} mb={4}>
                    <Box>
                        <Text fontWeight="bold">Tone of Voice:</Text>
                        <Text>{selectedCampaignData.settings?.outreach?.toneOfVoice}</Text>
                    </Box>
                    <Box>
                        <Text fontWeight="bold">Campaign Language:</Text>
                        <Text>{selectedCampaignData.settings?.outreach?.campaignLanguage}</Text>
                    </Box>
                    <Box>
                        <Text fontWeight="bold">Sign Offs:</Text>
                        <Text>{selectedCampaignData.settings?.outreach?.signOffs?.join(', ')}</Text>
                    </Box>
                    <Box>
                        <Text fontWeight="bold">Calls To Action:</Text>
                        <VStack align="start" spacing={1}>
                            {selectedCampaignData.settings?.outreach?.callsToAction?.map((cta, index) => (
                                <Text key={index}>{cta}</Text>
                            ))}
                        </VStack>
                    </Box>
                    <Box>
                        <Text fontWeight="bold">Max Resource Age:</Text>
                        <Text>{selectedCampaignData.settings?.outreach?.maxResourceAge}</Text>
                    </Box>
                    <Box>
                        <Text fontWeight="bold">Message Personalization:</Text>
                        <Text>{selectedCampaignData.settings?.outreach?.messagePersonalization ? 'Yes' : 'No'}</Text>
                    </Box>
                    <Box>
                        <Text fontWeight="bold">Personalization Sources:</Text>
                        <Text>{selectedCampaignData.settings?.outreach?.personalizationSources?.join(', ')}</Text>
                    </Box>
                </SimpleGrid>

                <Divider my={6} />

                <Heading size="md" mb={2} color="teal.600">Do Not Contact</Heading>
                <Box p={2} bg="gray.50" borderRadius="md">
                    {selectedCampaignData.settings?.doNotContact && selectedCampaignData.settings.doNotContact.length > 0 ? (
                        <Text fontSize="sm">{selectedCampaignData.settings.doNotContact.join(', ')}</Text>
                    ) : (
                        <Text fontSize="sm">None</Text>
                    )}
                </Box>
            </Card>
        );
    };

    if (loading) {
        return (
            <Box p={8} display={'flex'} justifyContent={'flex-start'} flexDirection={'column'}>
                <Container maxW="7xl" py={8}>
                    <VStack spacing={8}>
                        <Spinner size="xl" />
                        <Text>Loading organization...</Text>
                    </VStack>
                </Container>
            </Box>
        )
    }

    if (error) {
        return (
            <Box p={8} display={'flex'} justifyContent={'flex-start'} flexDirection={'column'}>
                <Container maxW="7xl" py={8}>
                    <Alert status="error" borderRadius="lg">
                        <AlertIcon />
                        <VStack spacing={2} align="start">
                            <Text fontWeight="bold">Error Loading Campaign</Text>
                            <Text>{error}</Text>
                        </VStack>
                    </Alert>
                </Container>
            </Box>
        )
    }

    if (!organization) {
        return (
            <Box p={8} display={'flex'} justifyContent={'flex-start'} flexDirection={'column'}>
                <Container maxW="7xl" py={8}>
                    <Alert status="warning" borderRadius="lg">
                        <AlertIcon />
                        <Text>Organisation not found</Text>
                    </Alert>
                </Container>
            </Box>
        )
    }

    return (
        <Box p={8} display={'flex'} justifyContent={'flex-start'} flexDirection={'column'}>
            <Container maxW="7xl" py={8}>
                <VStack spacing={8} align="stretch">
                    <Card style={{ background: "white" }} p={8}>
                        <HStack justifyContent={'space-between'}>
                            <HStack>
                                <img src={organization.logo_url} alt="logo" style={{ width: "50px", height: "50px" }} />
                                <CardHeader>
                                    <Heading size="lg">{organization.name}</Heading>
                                    <HStack>
                                        <Text fontWeight={600} fontSize={18} color={"GrayText"}>Org Id: </Text>
                                        <Text fontWeight={400} fontSize={16} color={"GrayText"}>{organization.id}</Text>
                                    </HStack>
                                </CardHeader>
                            </HStack>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                style={{ display: 'none' }}
                                id="csv-upload"
                                onChange={(e) => handleFileUpload(e)}
                            />
                            <Button
                                onClick={() => {
                                    const input = document.getElementById('csv-upload') as HTMLInputElement | null;
                                    if (input) {
                                        input.value = '';
                                        input.click();
                                    }
                                }}
                            >
                                Upload Leads
                            </Button>
                        </HStack>
                        <Card bg={'InfoBackground'} p={6}>
                            <HStack>
                                <Text fontWeight={600} fontSize={14} color={"GrayText"}>Plan:</Text>
                                <Text fontWeight={400} fontSize={12} color={"GrayText"}>{organization.plan}</Text>
                            </HStack>
                            <HStack>
                                <Text fontWeight={600} fontSize={14} color={"GrayText"}>Plan Status</Text>
                                <Text fontWeight={400} fontSize={12} color={"GrayText"}>{organization.subscription_status}</Text>
                            </HStack>
                        </Card>
                    </Card>
                    <Spacer height={20} />
                    <Card style={{ background: "white" }} p={8}>
                        <VStack gap={5} alignItems={'start'}>
                            <Text fontWeight={600} fontSize={18} color={"GrayText"}>View Campaigns</Text>
                            <Select placeholder="Select Campaign to View" onChange={(e) => setViewCampaignId(e.target.value)} value={viewCampaignId}>
                                {campaignsMeta && campaignsMeta.map((campaign) => (
                                    <option key={campaign.id} value={campaign.id}>
                                        {campaign.name}
                                    </option>
                                ))}
                            </Select>
                        </VStack>
                    </Card>

                    {/* csv view */}
                    {headers && (
                        <>
                            {/* <HStack justifyContent={'space-between'}>
                                <Input placeholder='File Input' value={listName} w={'500px'} onChange={(e) => setListName(e.target.value)} />
                                <Select placeholder="Select Campaign to Upload" onChange={(e) => setUploadCampaignId(e.target.value)} value={uploadCampaignId}>
                                    {campaignsMeta && campaignsMeta.map((campaign) => (
                                        <option key={campaign.id} value={campaign.id}>
                                            {campaign.name}
                                        </option>
                                    ))}
                                </Select>
                            </HStack> */}
                            <Card style={{ background: "white" }} p={8} mt={8}>
                                <Heading size="md" mb={4} color="teal.600">Upload List</Heading>
                                <VStack spacing={4} align="stretch">
                                    <Select
                                        placeholder="Select Campaign"
                                        value={uploadCampaignId || ''}
                                        onChange={(e) => setUploadCampaignId(e.target.value)}
                                    >
                                        {campaignsMeta?.map((campaign) => (
                                            <option key={campaign.id} value={campaign.id}>
                                                {campaign.name}
                                            </option>
                                        ))}
                                    </Select>
                                    <SimpleGrid columns={2} spacing={4}>
                                        <Box>
                                            <FormLabel>Timezone</FormLabel>
                                            <Select
                                                placeholder="Select Timezone"
                                                value={timezone}
                                                onChange={(e) => setTimezone(e.target.value)}
                                            >
                                                {timezones.map((tz, idx) => (
                                                    <option key={idx} value={tz.value}>
                                                        {tz.label}
                                                    </option>
                                                ))}
                                            </Select>
                                        </Box>
                                        <Box>
                                            <FormLabel>Start Hour</FormLabel>
                                            <Input
                                                placeholder="Start Hour (HH:mm)"
                                                value={startHour}
                                                onChange={(e) => setStartHour(e.target.value)}
                                            />
                                        </Box>
                                        <Box>
                                            <FormLabel>End Hour</FormLabel>
                                            <Input
                                                placeholder="End Hour (HH:mm)"
                                                value={endHour}
                                                onChange={(e) => setEndHour(e.target.value)}
                                            />
                                        </Box>
                                        <Box>
                                            <FormLabel>Minimum Time Between Emails</FormLabel>
                                            <Input
                                                type="number"
                                                placeholder="Min Time Between Emails (minutes)"
                                                value={minTimeBetweenEmails}
                                                onChange={(e) => setMinTimeBetweenEmails(Number(e.target.value))}
                                            />
                                        </Box>
                                        <Box>
                                            <FormLabel>Max New Leads Per Day</FormLabel>
                                            <Input
                                                type="number"
                                                placeholder="Max New Leads Per Day"
                                                value={maxNewLeadsPerDay}
                                                onChange={(e) => setMaxNewLeadsPerDay(Number(e.target.value))}
                                            />
                                        </Box>
                                        <Box>
                                            <FormLabel>Schedule start time</FormLabel>
                                            <Input
                                                type="datetime-local"
                                                placeholder="Schedule Start Time"
                                                value={scheduleStartTime}
                                                onChange={(e) => setScheduleStartTime(e.target.value)}
                                            />
                                        </Box>
                                    </SimpleGrid>
                                    <Button colorScheme="blue" onClick={handleUpload}>Upload</Button>
                                </VStack>
                            </Card>
                        </>
                    )}
                    {headers && (
                        <TableContainer border={'1px'} borderColor={'blackAlpha.400'}>
                            <Table variant="simple" size="md" sx={{ borderCollapse: 'separate', borderSpacing: 0, width: '100%' }}>
                                <Thead>
                                    <Tr color={'GrayText'} backgroundColor={'Menu'}>
                                        {headers && headers.map((header, idx) => (
                                            <Th key={idx} border={'1px solid'} borderColor={'blackAlpha.400'}>{header}</Th>
                                        ))}
                                        {/* <Td border={'1px'} borderColor={'blackAlpha.400'} >id</Td>
                                    <Td border={'1px'} borderColor={'blackAlpha.400'} >name</Td>
                                    <Td border={'1px'} borderColor={'blackAlpha.400'} >slug</Td>
                                    <Td border={'1px'} borderColor={'blackAlpha.400'} >plan</Td>
                                    <Td border={'1px'} borderColor={'blackAlpha.400'} >subscription_status</Td> */}
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {csvData && csvData.map((row, idx) => (
                                        <Tr key={idx} color={'GrayText'} backgroundColor={'Menu'}>
                                            {row.map((data, idxx) => (
                                                <Td key={idxx} border={'1px'} borderColor={'blackAlpha.400'} >{data}</Td>
                                            ))}
                                        </Tr>
                                    ))}
                                </Tbody>
                            </Table>
                        </TableContainer>
                    )}
                    {renderCampaignDetails()}
                </VStack>
            </Container>
        </Box>
    )
}

export default OrgDetailPage;