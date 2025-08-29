'use client'

import React, { useState, useEffect, useRef } from 'react'
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
    const { isOpen, onOpen, onClose } = useDisclosure()
    const { organization } = useOrganization();

    useEffect(() => {
        const isFirstRun = useRef(true);

        if (isFirstRun.current) {
            isFirstRun.current = false;
            return; // skip first run
        }
        const clearLocalStorage = () => {
            localStorage.removeItem('campaignTargeting')
            localStorage.removeItem('campaignPitchData')
            localStorage.removeItem('campaignOutreachData')
            localStorage.removeItem('campaignWorkflow')
            localStorage.removeItem('campaignLaunch')
            localStorage.removeItem('selectedLeads')
        }
        clearLocalStorage();
    }, [organization])
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