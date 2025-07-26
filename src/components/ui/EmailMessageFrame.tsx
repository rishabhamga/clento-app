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
  Divider,
  useColorModeValue,
} from '@chakra-ui/react'
import { 
  FiMail, 
  FiStar, 
  FiArchive, 
  FiTrash2, 
  FiMoreHorizontal,
  FiPaperclip,
  FiClock
} from 'react-icons/fi'
import { parseSimpleMarkdown } from '@/lib/utils/markdown-parser'

interface EmailMessageProps {
  senderName: string
  senderEmail: string
  senderAvatar?: string
  subject: string
  message: string
  timestamp: string
  isRead?: boolean
  isStarred?: boolean
  hasAttachment?: boolean
  isImportant?: boolean
}

export const EmailMessageFrame: React.FC<EmailMessageProps> = ({
  senderName,
  senderEmail,
  senderAvatar,
  subject,
  message,
  timestamp,
  isRead = false,
  isStarred = false,
  hasAttachment = false,
  isImportant = false
}) => {
  const frameBg = useColorModeValue('white', 'gray.800')
  const headerBg = useColorModeValue('#f8f9fa', 'gray.700')
  const toolbarBg = useColorModeValue('#ffffff', 'gray.750')
  const contentBg = useColorModeValue('#ffffff', 'gray.800')
  const textColor = useColorModeValue('gray.800', 'white')
  const metaColor = useColorModeValue('gray.600', 'gray.400')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const unreadBg = useColorModeValue('#e3f2fd', 'rgba(66, 165, 245, 0.1)')

  return (
    <Box
      maxW="450px"
      w="full"
      bg={frameBg}
      borderRadius="lg"
      overflow="hidden"
      border="1px solid"
      borderColor={borderColor}
      boxShadow="0 8px 30px rgba(0, 0, 0, 0.12)"
      position="relative"
    >
      {/* Email Client Header */}
      <Box bg={headerBg} px={4} py={3} borderBottom="1px solid" borderColor={borderColor}>
        <HStack spacing={3}>
          <Icon as={FiMail} color="blue.500" boxSize={5} />
          <VStack align="start" spacing={0} flex={1}>
            <Text fontSize="sm" fontWeight="600" color={textColor}>
              Gmail
            </Text>
            <Text fontSize="xs" color={metaColor}>
              1 of 127 conversations
            </Text>
          </VStack>
          <HStack spacing={2}>
            <Box w={2} h={2} bg="green.400" borderRadius="full" />
            <Text fontSize="xs" color="green.500" fontWeight="500">
              Online
            </Text>
          </HStack>
        </HStack>
      </Box>

      {/* Email Toolbar */}
      <Box bg={toolbarBg} px={4} py={2} borderBottom="1px solid" borderColor={borderColor}>
        <HStack spacing={4} justify="space-between">
          <HStack spacing={3}>
            <Icon as={FiArchive} boxSize={4} color={metaColor} cursor="pointer" />
            <Icon as={FiTrash2} boxSize={4} color={metaColor} cursor="pointer" />
                            <Icon as={FiMail} boxSize={4} color={metaColor} cursor="pointer" />
          </HStack>
          <HStack spacing={3}>
            <Icon 
              as={FiStar} 
              boxSize={4} 
              color={isStarred ? 'yellow.400' : metaColor} 
              cursor="pointer" 
            />
            <Icon as={FiMoreHorizontal} boxSize={4} color={metaColor} cursor="pointer" />
          </HStack>
        </HStack>
      </Box>

      {/* Email Header Info */}
      <Box 
        bg={!isRead ? unreadBg : contentBg} 
        px={4} 
        py={4} 
        borderBottom="1px solid" 
        borderColor={borderColor}
      >
        <VStack spacing={3} align="stretch">
          {/* Subject line */}
          <HStack spacing={2} align="start">
            <Text 
              fontSize="lg" 
              fontWeight={!isRead ? "700" : "600"} 
              color={textColor} 
              flex={1}
              lineHeight="short"
            >
              {subject}
            </Text>
            {isImportant && (
              <Badge colorScheme="red" size="sm">
                Important
              </Badge>
            )}
            {hasAttachment && (
              <Icon as={FiPaperclip} boxSize={4} color={metaColor} />
            )}
          </HStack>

          {/* Sender info */}
          <HStack spacing={3}>
            <Avatar
              src={senderAvatar}
              name={senderName}
              size="sm"
              border="1px solid"
              borderColor={borderColor}
            />
            <VStack align="start" spacing={0} flex={1}>
              <HStack spacing={2}>
                <Text 
                  fontSize="sm" 
                  fontWeight={!isRead ? "600" : "500"} 
                  color={textColor}
                >
                  {senderName}
                </Text>
                <Text fontSize="xs" color={metaColor}>
                  &lt;{senderEmail}&gt;
                </Text>
              </HStack>
              <HStack spacing={2} fontSize="xs" color={metaColor}>
                <Text>to me</Text>
                <Icon as={FiClock} boxSize={3} />
                <Text>{timestamp}</Text>
              </HStack>
            </VStack>
            
            {!isRead && (
              <Box
                w={2}
                h={2}
                bg="blue.500"
                borderRadius="full"
              />
            )}
          </HStack>
        </VStack>
      </Box>

      {/* Email Content */}
      <Box bg={contentBg} px={4} py={6} minH="250px">
        <VStack spacing={4} align="stretch">
          {/* Email body */}
          <Text 
            fontSize="sm" 
            lineHeight="tall" 
            color={textColor}
            whiteSpace="pre-wrap"
          >
            {parseSimpleMarkdown(message)}
          </Text>

          <Divider />

          {/* Email signature area */}
          <VStack spacing={2} align="start">
            <Text fontSize="xs" color={metaColor} fontStyle="italic">
              Best regards,
            </Text>
            <Text fontSize="xs" fontWeight="600" color={textColor}>
              {senderName}
            </Text>
            <Text fontSize="xs" color={metaColor}>
              {senderEmail}
            </Text>
          </VStack>
        </VStack>
      </Box>

      {/* Reply Actions */}
      <Box 
        bg={headerBg} 
        px={4} 
        py={3} 
        borderTop="1px solid" 
        borderColor={borderColor}
      >
        <HStack spacing={4} justify="center">
          <HStack spacing={2} cursor="pointer">
                          <Icon as={FiMail} boxSize={4} color="blue.500" />
            <Text fontSize="xs" color="blue.500" fontWeight="600">
              Reply
            </Text>
          </HStack>
          <Text fontSize="xs" color={metaColor} cursor="pointer">
            Forward
          </Text>
          <Text fontSize="xs" color={metaColor} cursor="pointer">
            Reply All
          </Text>
        </HStack>
      </Box>

      {/* Inbox preview indicator */}
      <Box
        position="absolute"
        top={0}
        left={0}
        w={!isRead ? "4px" : "0"}
        h="full"
        bg="blue.500"
        transition="width 0.2s"
      />

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