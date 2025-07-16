'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
    Box,
    Container,
    VStack,
    HStack,
    Heading,
    Text,
    Spinner,
    Alert,
    AlertIcon,
    useToast,
    Card,
    CardHeader,
    Button,
    TableContainer,
    Thead,
    Tr,
    Td,
    Tbody,
    Table,
} from '@chakra-ui/react'
import { createCustomToast } from '@/lib/utils/custom-toast'
import { useUser } from '@clerk/nextjs'
import { Organization } from '../page'
import Papa from 'papaparse';

function OrgDetailPage() {
    const { user } = useUser()
    const params = useParams()
    const router = useRouter()
    const toast = useToast()
    const customToast = createCustomToast(toast)
    const [organization, setOrganization] = useState<Organization | null>(null)
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null)
    const [headers, setHeaders] = useState<string[]>();
    const [isViewingExistingLeads, setIsViewingExistingLeads] = useState<boolean>();
    const [csvData, setCsvData] = useState<string[][]>([]);
    const [listName, setListName] = useState<string>();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                const response = await fetch(`/api/console/orgs/${params.id}`)
                if (response.ok) {
                    const data = await response.json()
                    setOrganization(data?.orgData)
                    console.log(data?.orgData);
                }
            } catch (err) {
                console.log(err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

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
                        setIsViewingExistingLeads(false);
                    }
                },
            });

            setListName('');
        }
    }

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
                                        input.value = ''; // reset file input so same file can be uploaded again
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
                    {headers && (
                        <TableContainer border={'1px'} borderColor={'blackAlpha.400'} borderRadius={'8px'}>
                            <Table>
                                <Thead>
                                    <Tr color={'MenuText'} backgroundColor={'Menu'}>
                                        {headers && headers.map((header, idx) => (
                                            <Td key={idx} border={'1px'} borderColor={'blackAlpha.400'} >{header}</Td>
                                        ))}
                                        {/* <Td border={'1px'} borderColor={'blackAlpha.400'} >id</Td>
                                    <Td border={'1px'} borderColor={'blackAlpha.400'} >name</Td>
                                    <Td border={'1px'} borderColor={'blackAlpha.400'} >slug</Td>
                                    <Td border={'1px'} borderColor={'blackAlpha.400'} >plan</Td>
                                    <Td border={'1px'} borderColor={'blackAlpha.400'} >subscription_status</Td> */}
                                    </Tr>
                                </Thead>
                                <Tbody>
                                </Tbody>
                            </Table>
                        </TableContainer>
                    )}
                </VStack>
            </Container>
        </Box>
    )
}

export default OrgDetailPage;