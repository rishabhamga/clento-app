'use client'

import React, { useState, useEffect } from 'react'
import {
    Box,
    HStack,
    VStack,
    Text,
    Avatar,
    Badge,
    Button,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    MenuDivider,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    useColorModeValue,
    useToast,
    Icon,
    Spinner
} from '@chakra-ui/react'
import {
    OrganizationSwitcher as ClerkOrganizationSwitcher,
    useOrganization,
    useOrganizationList,
    useUser,
    CreateOrganization
} from '@clerk/nextjs'
import { ChevronDownIcon, AddIcon } from '@chakra-ui/icons'
import { FiUsers, FiPlus } from 'react-icons/fi'
import { HiOutlineOfficeBuilding } from 'react-icons/hi'
import { GradientButton } from './ui/GradientButton'
import { createCustomToast, commonToasts } from '@/lib/utils/custom-toast'

export interface Organization {
    id: string
    name: string
    slug: string
    logoUrl?: string
    role: string
    memberCount?: number
}

interface OrganizationSwitcherProps {
    onOrganizationChange?: (orgId: string | null) => void
}

export default function OrganizationSwitcher({ onOrganizationChange }: OrganizationSwitcherProps) {
    const { organization } = useOrganization()
    const { userMemberships, setActive } = useOrganizationList()
    const { user } = useUser()
    const { isOpen, onOpen, onClose } = useDisclosure()
    const toast = useToast()
    const customToast = createCustomToast(toast)

    const [isLoading, setIsLoading] = useState(false)
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        industry: '',
        companySize: ''
    })

    // Color mode values
    const menuBg = useColorModeValue('white', 'gray.800')
    const borderColor = useColorModeValue('gray.200', 'gray.600')
    const hoverBg = useColorModeValue('gray.50', 'gray.700')

    const handleOrganizationSwitch = async (orgId: string | null) => {
        if (!setActive) {
            console.error('setActive function is not available')
            return
        }

        setIsLoading(true)
        try {
            await setActive({ organization: orgId })
            onOrganizationChange?.(orgId)

            customToast.success({
                title: 'Organization Switched',
                description: 'Successfully switched to the new organization',
            })
        } catch (error) {
            customToast.error({
                title: 'Switch Failed',
                description: 'Failed to switch organization. Please try again.',
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleCreateOrganization = async () => {
        if (!formData.name.trim()) {
            customToast.warning({
                title: 'Name required',
                description: 'Please enter an organization name.',
            });
            return;
        }

        if ((userMemberships?.data?.length ?? 0) >= 2) {
            customToast.error({
                title: 'Limit Reached',
                description: 'You can only create up to 2 organizations.',
            });
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('/api/organizations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name,
                    slug: formData.slug,
                    industry: formData.industry,
                    companySize: formData.companySize,
                    clerkOrgId: user?.id, // Include user ID to link organization
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to create organization');
            }

            customToast.success({
                title: 'Organization Created',
                description: 'Your organization has been successfully created and linked to your account.',
            });

            setShowCreateForm(false);
            onClose();
        } catch (err) {
            const error = err as Error;
            customToast.error({
                title: 'Creation Failed',
                description: error.message || 'Failed to create organization. Please try again.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Get current organization display info
    const currentOrgInfo = organization ? {
        name: organization.name,
        slug: organization.slug,
        logoUrl: organization.imageUrl,
        memberCount: organization.membersCount
    } : null

    return (
        <>
            {/* Clerk Organization Switcher outside the modal */}
            <Box mb={4}>
                <ClerkOrganizationSwitcher
                    hidePersonal
                />
            </Box>

            {/* Create Organization Modal */}
            <Modal isOpen={isOpen} onClose={onClose} size="lg">
                <ModalOverlay backdropFilter="blur(4px)" />
                <ModalContent>
                    <ModalHeader>Manage Organizations</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        <VStack spacing={6} align="stretch">
                            {/* Clerk Organization Switcher inside the modal */}
                            <Box>
                                <ClerkOrganizationSwitcher
                                    hidePersonal
                                />
                            </Box>

                            {/* Clerk Create Organization Component */}
                            <Box>
                                <CreateOrganization
                                    appearance={{
                                        elements: {
                                            card: {
                                                boxShadow: 'none',
                                                border: 'none',
                                            },
                                        },
                                    }}
                                />
                            </Box>
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </>
    )
}