'use client'

import { 
  Box, 
  VStack, 
  HStack, 
  Text, 
  Icon, 
  useColorModeValue,
  Divider
} from '@chakra-ui/react'
import { useRouter, usePathname } from 'next/navigation'
import { 
  BarChart3, 
  // Settings, // TODO: Re-enable when Integrations page is ready
  Users, 
  // Eye, // TODO: Re-enable when Website Visitors page is ready
  // Inbox, // TODO: Re-enable when Inbox page is ready
  Megaphone, 
  // Clock, // TODO: Re-enable when Pending Messages page is ready
  // Send // TODO: Re-enable when Senders page is ready
} from 'lucide-react'
import OrganizationSwitcher from '../OrganizationSwitcher'

interface NavItemProps {
  icon: React.ComponentType<{ size?: number | string; className?: string }>
  label: string
  href: string
  isActive?: boolean
  onClick?: () => void
}

const NavItem = ({ icon, label, href, isActive, onClick }: NavItemProps) => {
  const router = useRouter()
  const bgActive = useColorModeValue('purple.100', 'purple.800')
  const colorActive = useColorModeValue('purple.700', 'purple.200')
  const colorInactive = useColorModeValue('gray.600', 'gray.400')

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      router.push(href)
    }
  }

  return (
    <HStack
      w="100%"
      p={3}
      borderRadius="lg"
      cursor="pointer"
      bg={isActive ? bgActive : 'transparent'}
      color={isActive ? colorActive : colorInactive}
      _hover={{
        bg: bgActive,
        color: colorActive
      }}
      onClick={handleClick}
      transition="all 0.2s ease"
    >
      <Icon as={icon} boxSize={5} />
      <Text fontSize="sm" fontWeight={isActive ? 'semibold' : 'medium'}>
        {label}
      </Text>
    </HStack>
  )
}

export default function Sidebar() {
  const pathname = usePathname()
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  const mainNavItems = [
    { icon: BarChart3, label: 'Analytics', href: '/analytics' },
    // { icon: Settings, label: 'Integrations', href: '/integrations' }, // TODO: Re-enable when ready
    { icon: Users, label: 'Leads', href: '/leads' },
    // { icon: Eye, label: 'Website Visitors', href: '/website-visitors' }, // TODO: Re-enable when ready
  ]

  const outboundNavItems = [
    // { icon: Inbox, label: 'Inbox', href: '/inbox' }, // TODO: Re-enable when ready
    { icon: Megaphone, label: 'Campaigns', href: '/dashboard' },
    // { icon: Clock, label: 'Pending Messages', href: '/pending-messages' }, // TODO: Re-enable when ready
    // { icon: Send, label: 'Senders', href: '/senders' }, // TODO: Re-enable when ready
  ]

  return (
    <Box
      w="280px"
      h="100vh"
      bg={bgColor}
      borderRight="1px"
      borderColor={borderColor}
      p={6}
      position="fixed"
      left={0}
      top={0}
      overflowY="auto"
    >
      <VStack spacing={6} align="stretch">
        {/* Logo/Brand */}
        <Box mb={4}>
          <Text fontSize="xl" fontWeight="bold" color="purple.600">
            Clento
          </Text>
        </Box>

        {/* Organization Switcher */}
        <Box>
          <Text 
            fontSize="xs" 
            fontWeight="bold" 
            color="gray.500" 
            textTransform="uppercase" 
            letterSpacing="wider"
            mb={2}
          >
            Workspace
          </Text>
          <OrganizationSwitcher />
        </Box>

        <Divider />

        {/* Main Navigation */}
        <VStack spacing={2} align="stretch">
          {mainNavItems.map((item) => (
            <NavItem
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
              isActive={pathname === item.href}
            />
          ))}
        </VStack>

        <Divider />

        {/* Outbound Section */}
        <VStack spacing={2} align="stretch">
          <Text 
            fontSize="xs" 
            fontWeight="bold" 
            color="gray.500" 
            textTransform="uppercase" 
            letterSpacing="wider"
            mb={2}
          >
            Outbound
          </Text>
          {outboundNavItems.map((item) => (
            <NavItem
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
              isActive={pathname === item.href}
            />
          ))}
        </VStack>
      </VStack>
    </Box>
  )
} 