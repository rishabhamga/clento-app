import { 
  Box, 
  VStack, 
  HStack, 
  Text, 
  Badge, 
  Switch, 
  Icon,
  useColorModeValue
} from '@chakra-ui/react'
import { MoreHorizontal, Sparkles } from 'lucide-react'

interface CampaignCardProps {
  name: string
  type: 'Standard' | 'Watchtower' | 'Local'
  leads: {
    current: number
    total: number
  }
  country: string
  flag: string
  isPrivate: boolean
  onTogglePrivate: () => void
  onClick?: () => void
}

export default function CampaignCard({
  name,
  type,
  leads,
  flag,
  isPrivate,
  onTogglePrivate,
  onClick
}: CampaignCardProps) {
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const textColor = useColorModeValue('gray.600', 'gray.400')

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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Watchtower':
        return Sparkles
      default:
        return null
    }
  }

  const TypeIcon = getTypeIcon(type)

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
            <Text fontSize="2xl">{flag}</Text>
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
          </HStack>
          <Icon 
            as={MoreHorizontal} 
            boxSize={5} 
            color="gray.400"
            cursor="pointer"
            _hover={{ color: "gray.600" }}
          />
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

        {/* Privacy Toggle */}
        <HStack justify="space-between" align="center">
          <Text fontSize="sm" color={textColor}>
            Private
          </Text>
          <Switch 
            size="sm"
            colorScheme="purple"
            isChecked={isPrivate}
            onChange={onTogglePrivate}
          />
        </HStack>
      </VStack>
    </Box>
  )
} 