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
  Database,
  UserPlus,
  // Eye, // TODO: Re-enable when Website Visitors page is ready
  // Inbox, // TODO: Re-enable when Inbox page is ready
  Megaphone,
  // Clock, // TODO: Re-enable when Pending Messages page is ready
  // Send // TODO: Re-enable when Senders page is ready
  UserCheck,
  MessageCircle,
  Headphones,
  Shield,
  MessageSquare,
  Activity,
  Filter,
  Clock,
  TrendingUp,
  PieChart,
  Calendar
} from 'lucide-react'
import { useState, useEffect } from 'react'
import OrganizationSwitcher from '../OrganizationSwitcher'
import { UserButton, UserProfile } from '@clerk/nextjs';
import { useUser } from '@clerk/nextjs';

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

const UserProfileButton = () => {
  const bgActive = useColorModeValue('purple.100', 'purple.800');
  const colorActive = useColorModeValue('purple.700', 'purple.200');
  const { user } = useUser();
  const userName = user?.fullName || user?.username || '';

  const handleClick = () => {
    const userButtonElement = document.querySelector('.cl-userButtonTrigger') as HTMLButtonElement;
    if (userButtonElement) {
      userButtonElement.click();
    }
  };

  return (
    <HStack
      w="100%"
      p={3}
      borderRadius="lg"
      cursor="pointer"
      bg={bgActive}
      color={colorActive}
      _hover={{
        bg: bgActive,
        color: colorActive
      }}
      transition="all 0.2s ease"
      onClick={handleClick}
    >
      <Box>
        <UserButton data-clerk-user-button />
      </Box>
      <Text fontSize="sm" fontWeight="semibold">
        {userName}
      </Text>
    </HStack>
  );
};

export default function Sidebar() {
  const pathname = usePathname()
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const [selectedAgent, setSelectedAgent] = useState<string>('ai-sdr')

  // Load selected agent from localStorage
  useEffect(() => {
    const savedAgent = localStorage.getItem('selectedAgent')
    if (savedAgent) {
      setSelectedAgent(savedAgent)
    }
  }, [])

  // Agent-specific navigation configurations
  const agentNavConfig = {
    'ai-sdr': {
      mainNavItems: [
        { icon: BarChart3, label: 'Analytics', href: '/analytics' },
        { icon: Users, label: 'Leads', href: '/leads' },
        { icon: Database, label: 'Lead Lists', href: '/lead-lists' },
        { icon: UserPlus, label: 'Accounts', href: '/accounts' },
      ],
      outboundNavItems: [
        { icon: Megaphone, label: 'Campaigns', href: '/dashboard' },
      ],
      outboundLabel: 'Outbound'
    },
    'ai-marketer': {
      mainNavItems: [
        { icon: BarChart3, label: 'Analytics', href: '/analytics' },
        { icon: MessageCircle, label: 'Contacts', href: '/leads' },
        { icon: Database, label: 'Contact Lists', href: '/lead-lists' },
        { icon: UserPlus, label: 'Accounts', href: '/accounts' },
      ],
      outboundNavItems: [
        { icon: Megaphone, label: 'Marketing Campaigns', href: '/dashboard' },
      ],
      outboundLabel: 'Marketing'
    },
    'ai-recruiter': {
      mainNavItems: [
        { icon: BarChart3, label: 'Analytics', href: '/analytics' },
        { icon: UserCheck, label: 'Candidates', href: '/leads' },
        { icon: Database, label: 'Candidate Lists', href: '/lead-lists' },
        { icon: UserPlus, label: 'Accounts', href: '/accounts' },
      ],
      outboundNavItems: [
        { icon: Megaphone, label: 'Recruitment Campaigns', href: '/dashboard' },
      ],
      outboundLabel: 'Recruitment'
    },
    'ai-sales-buddy': {
      mainNavItems: [
        { icon: MessageSquare, label: 'Conversation Intelligence', href: '/ai-sales-buddy' },
        { icon: Activity, label: 'Activity Dashboard', href: '/activity-dashboard' },
        { icon: BarChart3, label: 'Conversation Analytics', href: '/conversation-analytics' },
        { icon: Filter, label: 'Stage-based Filters', href: '/stage-filters' },
        { icon: Clock, label: 'Sales Prep Sessions', href: '/dashboard' },
        { icon: TrendingUp, label: 'Performance Metrics', href: '/performance-metrics' },
      ],
      outboundNavItems: [
        { icon: Calendar, label: 'Meeting Scheduler', href: '/meeting-scheduler' },
        { icon: PieChart, label: 'Team Analytics', href: '/team-analytics' },
      ],
      outboundLabel: 'Conversation Intelligence'
    },
    'asset-inventory-agent': {
      mainNavItems: [
        { icon: BarChart3, label: 'Analytics', href: '/analytics' },
        { icon: Shield, label: 'Assets', href: '/leads' },
        { icon: Database, label: 'Asset Lists', href: '/lead-lists' },
        { icon: UserPlus, label: 'Tenants', href: '/accounts' },
      ],
      outboundNavItems: [
        { icon: Megaphone, label: 'Security Queries', href: '/dashboard' },
      ],
      outboundLabel: 'Security'
    }
  }

  const currentConfig = agentNavConfig[selectedAgent as keyof typeof agentNavConfig] || agentNavConfig['ai-sdr']
  const mainNavItems = currentConfig.mainNavItems
  const outboundNavItems = currentConfig.outboundNavItems
  const outboundLabel = currentConfig.outboundLabel

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
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
    >
      <VStack spacing={6} align="stretch">
        {/* Logo/Brand */}
        <Box mb={4}>
          <Text fontSize="xl" fontWeight="bold" color="purple.600">
            Observe Agents
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
            {outboundLabel}
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

      {/* User Profile Button */}
      <Box mt={4}>
        <UserProfileButton />
      </Box>
    </Box>
  )
}