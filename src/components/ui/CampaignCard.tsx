import { 
  Box, 
  VStack, 
  HStack, 
  Text, 
  Badge, 
  Switch, 
  Icon,
  useColorModeValue,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button,
  useDisclosure
} from '@chakra-ui/react'
import { MoreHorizontal, Sparkles, Eye, Copy, Trash2 } from 'lucide-react'
import { useState, useRef } from 'react'

interface CampaignCardProps {
  id: string
  name: string
  type: 'Standard' | 'Watchtower' | 'Local'
  agentType?: string
  leads: {
    current: number
    total: number
  }
  createdAt: string
  onClick?: () => void
  onMenuClick?: () => void
  onDelete?: (id: string) => void
}

export default function CampaignCard({
  id,
  name,
  type,
  agentType,
  leads,
  createdAt,
  onClick,
  onMenuClick,
  onDelete
}: CampaignCardProps) {
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const textColor = useColorModeValue('gray.600', 'gray.400')
  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [isDeleting, setIsDeleting] = useState(false)
  const cancelRef = useRef<HTMLButtonElement>(null)

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Standard':
        return 'blue'
      case 'Watchtower':
        return 'purple'
      case 'Local':
        return 'green'
      default:
        return 'gray'
    }
  }

  const getAgentInfo = (agentType: string) => {
    switch (agentType) {
      case 'ai-sdr':
        return { name: 'AI SDR', color: 'purple' }
      case 'ai-recruiter':
        return { name: 'AI Recruiter', color: 'green' }
      case 'ai-marketer':
        return { name: 'AI Marketer', color: 'blue' }
      case 'ai-sales-buddy':
        return { name: 'Conversation Intelligence Agent', color: 'orange' }
      case 'asset-inventory-agent':
        return { name: 'Asset Inventory AI', color: 'red' }
      default:
        return { name: 'AI SDR', color: 'purple' }
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Watchtower':
        return Sparkles
      default:
        return null
    }
  }

  const TypeIcon = getTypeIcon(type)
  const agentInfo = getAgentInfo(agentType || 'ai-sdr')

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/campaigns/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete campaign')
      }

      toast({
        title: 'Campaign deleted',
        description: 'The campaign has been successfully deleted.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })

      onDelete?.(id)
      onClose()
    } catch (error) {
      console.error('Error deleting campaign:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete campaign. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Box
      bg={bgColor}
      border="1px"
      borderColor={borderColor}
      borderRadius="xl"
      p={6}
      cursor={onClick ? "pointer" : "default"}
      onClick={onClick}
      _hover={onClick ? {
        transform: "translateY(-2px)",
        boxShadow: "0 8px 25px -5px rgba(0, 0, 0, 0.1)"
      } : {}}
      transition="all 0.2s ease"
      position="relative"
    >
      <VStack spacing={4} align="stretch">
        {/* Header */}
        <HStack justify="space-between" align="start">
          <HStack spacing={2}>
            <Badge 
              colorScheme={getTypeColor(type)} 
              variant="subtle"
              fontSize="xs"
              px={2}
              py={1}
              borderRadius="md"
            >
              {TypeIcon && <Icon as={TypeIcon} boxSize={3} mr={1} />}
              {type}
            </Badge>
            <Badge 
              colorScheme={agentInfo.color} 
              variant="solid"
              fontSize="xs"
              px={2}
              py={1}
              borderRadius="md"
            >
              {agentInfo.name}
            </Badge>
          </HStack>
          <Menu placement="bottom-end">
            <MenuButton
              as={IconButton}
              icon={<Icon as={MoreHorizontal} boxSize={5} />}
              variant="ghost"
              size="sm"
              color="gray.400"
              _hover={{ color: "gray.600", bg: "gray.100" }}
              onClick={(e) => e.stopPropagation()}
            />
            <MenuList
              bg={bgColor}
              border="1px solid"
              borderColor={borderColor}
              boxShadow="xl"
              borderRadius="md"
              zIndex={1500}
            >
              <MenuItem 
                icon={<Icon as={Eye} boxSize={4} />}
                onClick={(e) => {
                  e.stopPropagation()
                  onClick?.()
                }}
              >
                View Campaign
              </MenuItem>
              <MenuItem 
                icon={<Icon as={Copy} boxSize={4} />}
                onClick={(e) => {
                  e.stopPropagation()
                  onMenuClick?.()
                }}
              >
                Duplicate Campaign
              </MenuItem>
              <MenuItem 
                icon={<Icon as={Trash2} boxSize={4} />}
                color="red.500"
                onClick={(e) => {
                  e.stopPropagation()
                  onOpen()
                }}
              >
                Delete Campaign
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>

        {/* Progress */}
        <VStack spacing={2} align="stretch">
          <HStack justify="space-between">
            <Text fontSize="sm" color={textColor}>
              {leads.current} / {leads.total.toLocaleString()}
            </Text>
            <Icon as={Sparkles} boxSize={4} color="purple.500" />
          </HStack>
        </VStack>

        {/* Campaign Name */}
        <HStack spacing={2} align="center">
          <Icon as={Sparkles} boxSize={4} color="purple.500" />
          <Text fontWeight="semibold" fontSize="md">
            {name}
          </Text>
        </HStack>

        {/* Creation Date */}
        <HStack justify="space-between" align="center">
          <Text fontSize="sm" color={textColor}>
            Created
          </Text>
          <Text fontSize="sm" color={textColor}>
            {new Date(createdAt).toLocaleDateString()}
          </Text>
        </HStack>
      </VStack>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Campaign
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete <strong>{name}</strong>? This action cannot be undone and will permanently remove all campaign data, including leads and analytics.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button 
                colorScheme="red" 
                onClick={handleDelete} 
                ml={3}
                isLoading={isDeleting}
                loadingText="Deleting..."
              >
                Delete Campaign
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  )
} 