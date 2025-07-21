'use client'

import { useUser } from "@clerk/nextjs"
import { useEffect, useState } from "react"
import { Box, Container, Spacer, Table, TableContainer, Tbody, Td, Text, Thead, Tr } from "@chakra-ui/react"
import { useRouter } from "next/navigation"

export interface Organization {
    id: string,
    name: string,
    clerk_org_id: string
    slug: string,
    logo_url: string,
    plan: string,
    subscription_status: string
}

const ConsoleHome = () => {
    const [orgs, setOrgs] = useState<Organization[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const response = await fetch('/api/console/orgs');
            const data = await response.json()
            setOrgs(data.organizations);
        }
        fetchData()
    }, [])

    const router = useRouter();

    const handleClick = (orgId: string) => {
        router.push(`console/${orgId}`)
    }

    return (
        <div>
            <Box p={8} display="flex" justifyContent="flex-start" flexDirection={'column'}>
                <Text fontSize={'4xl'}>Organisations</Text>
                <Box height="15px" />
                {orgs && orgs.length !== 0 && (
                    <TableContainer border={'1px'} borderColor={'blackAlpha.400'} borderRadius={'8px'}>
                        <Table>
                            <Thead>
                                <Tr color={'MenuText'} backgroundColor={'Menu'}>
                                    <Td border={'1px'} borderColor={'blackAlpha.400'} > </Td>
                                    <Td border={'1px'} borderColor={'blackAlpha.400'} >id</Td>
                                    <Td border={'1px'} borderColor={'blackAlpha.400'} >name</Td>
                                    <Td border={'1px'} borderColor={'blackAlpha.400'} >slug</Td>
                                    <Td border={'1px'} borderColor={'blackAlpha.400'} >plan</Td>
                                    <Td border={'1px'} borderColor={'blackAlpha.400'} >subscription_status</Td>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {orgs.map((org) => (
                                    <Tr key={org.clerk_org_id} color={'GrayText'} _hover={{
                                        transform: 'translateY(-2px)',
                                        shadow: 'xl',
                                    }}
                                        onClick={() => handleClick(org.id)}
                                    >
                                        <Td><img src={org.logo_url} alt={org.id} width={'50px'} height={'50px'} /></Td>
                                        <Td>{org.id}</Td>
                                        <Td>{org.name}</Td>
                                        <Td>{org.slug}</Td>
                                        <Td>{org.plan}</Td>
                                        <Td>{org.subscription_status}</Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                    </TableContainer>
                )}
            </Box>
        </div>
    )
}
export default ConsoleHome