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
  FormControl,
  FormLabel,
  Input,
  Select,
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

interface Organization {
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
        description: 'Please enter an organization name',
      })
      return
    }

    setIsLoading(true)
    try {
      // Let Clerk handle the organization creation
      // This will trigger the organization creation flow
      setShowCreateForm(false)
      onClose()
      
      customToast.info({
        title: 'Creating organization...',
        description: 'Your organization is being set up',
      })
    } catch (error) {
      customToast.error({
        title: 'Creation Failed',
        description: 'Failed to create organization. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Get current organization display info
  const currentOrgInfo = organization ? {
    name: organization.name,
    slug: organization.slug,
    logoUrl: organization.imageUrl,
    memberCount: organization.membersCount
  } : null

  return (
    <>
      <Menu>
        <MenuButton
          as={Button}
          variant="ghost"
          size="sm"
          rightIcon={<ChevronDownIcon />}
          leftIcon={currentOrgInfo ? <Avatar src={currentOrgInfo.logoUrl} size="xs" name={currentOrgInfo.name} /> : <Icon as={FiUsers} />}
          maxW="200px"
          justifyContent="flex-start"
          _hover={{ bg: hoverBg }}
          isLoading={isLoading}
        >
          <VStack spacing={0} align="start" maxW="140px">
            <Text fontSize="sm" fontWeight="medium" isTruncated>
              {currentOrgInfo ? currentOrgInfo.name : 'Personal Account'}
            </Text>
            {currentOrgInfo && (
              <Text fontSize="xs" color="gray.500" isTruncated>
                {currentOrgInfo.memberCount} member{currentOrgInfo.memberCount !== 1 ? 's' : ''}
              </Text>
            )}
          </VStack>
        </MenuButton>

        <MenuList bg={menuBg} borderColor={borderColor} shadow="lg" minW="250px">
          {/* Personal Account Option */}
          <MenuItem
            onClick={() => handleOrganizationSwitch(null)}
            bg={!organization ? hoverBg : 'transparent'}
            _hover={{ bg: hoverBg }}
          >
            <HStack spacing={3} w="full">
              <Avatar src={user?.imageUrl} size="sm" name={user?.fullName || 'Personal'} />
              <VStack spacing={0} align="start" flex={1}>
                <Text fontSize="sm" fontWeight="medium">Personal Account</Text>
                <Text fontSize="xs" color="gray.500">Your individual workspace</Text>
              </VStack>
              {!organization && <Badge colorScheme="blue" size="sm">Current</Badge>}
            </HStack>
          </MenuItem>

          <MenuDivider />

          {/* Organization List */}
          {userMemberships && userMemberships.data && userMemberships.data.length > 0 && (
            <>
              {userMemberships.data.map((membership) => (
                <MenuItem
                  key={membership.organization.id}
                  onClick={() => handleOrganizationSwitch(membership.organization.id)}
                  bg={organization?.id === membership.organization.id ? hoverBg : 'transparent'}
                  _hover={{ bg: hoverBg }}
                >
                  <HStack spacing={3} w="full">
                    <Avatar 
                      src={membership.organization.imageUrl} 
                      size="sm" 
                      name={membership.organization.name}
                      icon={<HiOutlineOfficeBuilding />}
                    />
                    <VStack spacing={0} align="start" flex={1}>
                      <Text fontSize="sm" fontWeight="medium" isTruncated>
                        {membership.organization.name}
                      </Text>
                      <Text fontSize="xs" color="gray.500" isTruncated>
                        {membership.organization.membersCount} member{membership.organization.membersCount !== 1 ? 's' : ''}
                      </Text>
                    </VStack>
                    {organization?.id === membership.organization.id && (
                      <Badge colorScheme="blue" size="sm">Current</Badge>
                    )}
                  </HStack>
                </MenuItem>
              ))}
              <MenuDivider />
            </>
          )}

          {/* Create Organization */}
          <MenuItem onClick={onOpen} _hover={{ bg: hoverBg }}>
            <HStack spacing={3}>
              <Box
                w="32px"
                h="32px"
                borderRadius="md"
                bg="gray.100"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Icon as={FiPlus} color="gray.600" />
              </Box>
              <Text fontSize="sm" fontWeight="medium">Create Organization</Text>
            </HStack>
          </MenuItem>
        </MenuList>
      </Menu>

      {/* Create Organization Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent>
          <ModalHeader>Create New Organization</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {!showCreateForm ? (
              // Use Clerk's built-in CreateOrganization component
              <Box>
                <CreateOrganization 
                  afterCreateOrganizationUrl="/dashboard"
                  appearance={{
                    elements: {
                      card: {
                        boxShadow: 'none',
                        border: 'none'
                      }
                    }
                  }}
                />
              </Box>
            ) : (
              // Custom form (if needed for additional fields)
              <VStack spacing={4} align="stretch">
                <FormControl isRequired>
                  <FormLabel>Organization Name</FormLabel>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Acme Corp"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Slug (Optional)</FormLabel>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="acme-corp"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Industry</FormLabel>
                  <Select
                    value={formData.industry}
                    onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                    placeholder="Select industry"
                  >
                    <option value="technology">Technology</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="finance">Finance</option>
                    <option value="education">Education</option>
                    <option value="retail">Retail</option>
                    <option value="manufacturing">Manufacturing</option>
                    <option value="other">Other</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Company Size</FormLabel>
                  <Select
                    value={formData.companySize}
                    onChange={(e) => setFormData(prev => ({ ...prev, companySize: e.target.value }))}
                    placeholder="Select company size"
                  >
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-1000">201-1000 employees</option>
                    <option value="1000+">1000+ employees</option>
                  </Select>
                </FormControl>

                <HStack spacing={3} pt={4}>
                  <Button variant="ghost" onClick={onClose}>Cancel</Button>
                  <GradientButton
                    onClick={handleCreateOrganization}
                    isLoading={isLoading}
                    loadingText="Creating..."
                  >
                    Create Organization
                  </GradientButton>
                </HStack>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
} 