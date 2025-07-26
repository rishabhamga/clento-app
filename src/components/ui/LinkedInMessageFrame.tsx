'use client'

import React from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Avatar,
  Badge,
  Icon,
  useColorModeValue,
} from '@chakra-ui/react'
import { FiLinkedin, FiCheck } from 'react-icons/fi'
import { parseSimpleMarkdown } from '@/lib/utils/markdown-parser'

interface LinkedInMessageProps {
  senderName: string
  senderRole: string
  senderCompany: string
  senderImage?: string
  message: string
  timestamp: string
  isRead?: boolean
  variant?: 'sent' | 'received'
}

export const LinkedInMessageFrame: React.FC<LinkedInMessageProps> = ({
  senderName,
  senderRole,
  senderCompany,
  senderImage,
  message,
  timestamp,
  isRead = false,
  variant = 'sent'
}) => {
  const frameBg = useColorModeValue('white', 'gray.800')
  const headerBg = useColorModeValue('#0A66C2', '#0A66C2') // LinkedIn blue
  const messageBg = useColorModeValue('gray.50', 'gray.700')
  const sentMessageBg = useColorModeValue('#0A66C2', '#0A66C2')
  const receivedMessageBg = useColorModeValue('white', 'gray.600')
  const textColor = useColorModeValue('gray.800', 'white')
  const metaColor = useColorModeValue('gray.600', 'gray.400')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  return (
    <Box
      maxW="380px"
      w="full"
      bg={frameBg}
      borderRadius="lg"
      overflow="hidden"
      border="1px solid"
      borderColor={borderColor}
      boxShadow="0 8px 30px rgba(0, 0, 0, 0.12)"
      position="relative"
    >
      {/* LinkedIn Header */}
      <Box bg={headerBg} p={3}>
        <HStack spacing={3}>
          <Icon as={FiLinkedin} color="white" boxSize={5} />
          <VStack align="start" spacing={0} flex={1}>
            <Text color="white" fontSize="sm" fontWeight="600">
              LinkedIn Messaging
            </Text>
            <Text color="whiteAlpha.800" fontSize="xs">
              Professional Network
            </Text>
          </VStack>
          <Box>
            <Box
              w={2}
              h={2}
              bg="green.400"
              borderRadius="full"
              border="1px solid white"
            />
          </Box>
        </HStack>
      </Box>

      {/* Chat Header */}
      <Box p={4} borderBottom="1px solid" borderColor={borderColor} bg={messageBg}>
        <HStack spacing={3}>
          <Avatar
            src={senderImage}
            name={senderName}
            size="md"
            border="2px solid"
            borderColor="white"
            boxShadow="0 2px 8px rgba(0, 0, 0, 0.1)"
          />
          <VStack align="start" spacing={0} flex={1}>
            <HStack>
              <Text fontWeight="700" fontSize="sm" color={textColor}>
                {senderName}
              </Text>
              {variant === 'sent' && (
                <Badge size="sm" colorScheme="blue" variant="solid">
                  1st
                </Badge>
              )}
            </HStack>
            <Text fontSize="xs" color={metaColor} lineHeight="short">
              {senderRole} at {senderCompany}
            </Text>
            <Text fontSize="xs" color="green.500" fontWeight="500">
              • Online now
            </Text>
          </VStack>
        </HStack>
      </Box>

      {/* Message Content */}
      <VStack spacing={3} p={4} align="stretch" bg={messageBg} minH="200px">
        {/* Message Bubble */}
        <HStack
          align="end"
          justify={variant === 'sent' ? 'flex-end' : 'flex-start'}
          spacing={2}
        >
          {variant === 'received' && (
            <Avatar
              src={senderImage}
              name={senderName}
              size="xs"
            />
          )}
          <Box
            maxW="85%"
            bg={variant === 'sent' ? sentMessageBg : receivedMessageBg}
            color={variant === 'sent' ? 'white' : textColor}
            px={4}
            py={3}
            borderRadius="18px"
            borderBottomRightRadius={variant === 'sent' ? '6px' : '18px'}
            borderBottomLeftRadius={variant === 'received' ? '6px' : '18px'}
            boxShadow="0 2px 8px rgba(0, 0, 0, 0.1)"
            position="relative"
          >
            <Text fontSize="sm" lineHeight="tall" whiteSpace="pre-wrap">
              {parseSimpleMarkdown(message)}
            </Text>
          </Box>
        </HStack>

        {/* Message Meta */}
        <HStack
          justify={variant === 'sent' ? 'flex-end' : 'flex-start'}
          spacing={1}
          px={variant === 'sent' ? 0 : 8}
        >
          <Text fontSize="xs" color={metaColor}>
            {timestamp}
          </Text>
          {variant === 'sent' && (
            <HStack spacing={1}>
              <Icon 
                as={FiCheck} 
                boxSize={3} 
                color={isRead ? 'blue.500' : metaColor} 
              />
              {isRead && (
                <Icon as={FiCheck} boxSize={3} color="blue.500" ml="-2px" />
              )}
            </HStack>
          )}
        </HStack>

        {/* Typing indicator for received messages */}
        {variant === 'received' && (
          <HStack spacing={2} px={8}>
            <Avatar src={senderImage} name={senderName} size="xs" />
            <Box
              bg={receivedMessageBg}
              borderRadius="18px"
              borderBottomLeftRadius="6px"
              px={4}
              py={3}
              boxShadow="0 2px 8px rgba(0, 0, 0, 0.1)"
            >
              <HStack spacing={1}>
                <Box w={2} h={2} bg="gray.400" borderRadius="full" />
                <Box w={2} h={2} bg="gray.400" borderRadius="full" />
                <Box w={2} h={2} bg="gray.400" borderRadius="full" />
              </HStack>
            </Box>
          </HStack>
        )}
      </VStack>

      {/* Bottom Actions Bar */}
      <Box
        p={3}
        borderTop="1px solid"
        borderColor={borderColor}
        bg={messageBg}
      >
        <HStack spacing={4} justify="center">
          <Text fontSize="xs" color="blue.500" fontWeight="600" cursor="pointer">
            Reply
          </Text>
          <Text fontSize="xs" color={metaColor} cursor="pointer">
            View Profile
          </Text>
          <Text fontSize="xs" color={metaColor} cursor="pointer">
            More
          </Text>
        </HStack>
      </Box>

      {/* Mobile-style notch indicator */}
      <Box
        position="absolute"
        top={2}
        left="50%"
        transform="translateX(-50%)"
        w={12}
        h={1}
        bg="whiteAlpha.300"
        borderRadius="full"
      />
    </Box>
  )
} 