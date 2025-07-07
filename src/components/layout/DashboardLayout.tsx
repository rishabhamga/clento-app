'use client'

import { Box, useColorModeValue } from '@chakra-ui/react'
import Sidebar from './Sidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const bgColor = useColorModeValue('gray.50', 'gray.900')

  return (
    <Box minH="100vh" bg={bgColor}>
      <Sidebar />
      <Box ml="280px" p={8}>
        {children}
      </Box>
    </Box>
  )
} 