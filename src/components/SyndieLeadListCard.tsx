// External libraries
import {
    Badge,
    Card,
    Divider,
    HStack,
    IconButton,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    Text,
    useColorModeValue,
    useToast,
    VStack
} from '@chakra-ui/react'
import {
    MoreVertical,
    View
} from 'lucide-react'

// Internal components

// Types
import { SyndieLeadList } from '@/app/api/lead-lists/route'
import { createCustomToast } from '../lib/utils/custom-toast'

// Syndie Lead List Card Component
const SyndieLeadListCard = ({
    leadList,
    isLoading,
    borderColor,
    onClickCard
}: {
    leadList: SyndieLeadList
    isLoading: boolean,
    borderColor?: string,
    onClickCard?: () => void
}) => {
    const cardBg = useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(26, 32, 44, 0.8)')
    const cardBorder = 'rgba(255, 255, 255, 0.2)';
    const textColor = useColorModeValue('gray.600', 'gray.400');
    const toast = useToast();
    const customToast = createCustomToast(toast);

    const getSearchUrlTypeConfig = (searchUrlType: string) => {
        switch (searchUrlType) {
            case 'linkedin':
                return { color: 'blue', text: 'LinkedIn' }
            case 'apollo':
                return { color: 'purple', text: 'Apollo' }
            case 'sales_navigator':
                return { color: 'green', text: 'Sales Navigator' }
            default:
                return { color: 'gray', text: searchUrlType }
        }
    }

    const searchUrlTypeConfig = getSearchUrlTypeConfig(leadList.searchUrlType)

    const onView = () => {
        fetch(`/api/lead-lists/view`, {
            method: 'POST',
            body: JSON.stringify({ id: leadList.id })
        })
    }

    return (
        <Card
            bg={cardBg}
            backdropFilter="blur(10px)"
            border="1px solid"
            borderColor={borderColor ?? cardBorder}
            borderRadius="xl"
            p={6}
            _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
            transition="all 0.2s ease"
            position="relative"
            onClick={onClickCard ?? undefined}
        >
            <VStack spacing={4} align="stretch">
                {/* Header */}
                <HStack justify="space-between" align="start">
                    <VStack align="start" spacing={1} flex={1}>
                        <HStack spacing={2} align="center">
                            <Text fontWeight="semibold" fontSize="lg" noOfLines={1} >
                                {leadList.name}
                            </Text>
                        </HStack>
                        <HStack spacing={2}>
                            <Badge
                                colorScheme={searchUrlTypeConfig.color}
                                variant="outline"
                                fontSize="xs"
                                px={2}
                                py={1}
                                borderRadius="md"
                            >
                                {searchUrlTypeConfig.text}
                            </Badge>
                        </HStack>
                    </VStack>
                </HStack>

                {/* Last Updated */}
                <Text fontSize="xs" color={textColor}>
                    Created {new Date(leadList.createdAt).toLocaleDateString()}
                </Text>

                {/* Actions */}
                {/* <HStack spacing={2} justify="flex-end">
                    <Button
                        size="sm"
                        variant="ghost"
                        leftIcon={<ExternalLink size={14} />}
                        onClick={() => onView(leadList.id)}
                    >
                        View in Syndie
                    </Button>
                </HStack> */}
            </VStack>
        </Card>
    )
}

export default SyndieLeadListCard
