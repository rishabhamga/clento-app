// External libraries
import {
    Avatar,
    Badge,
    Box,
    Card,
    Divider,
    HStack,
    Icon,
    IconButton,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    Progress,
    SimpleGrid,
    Text,
    useColorModeValue,
    useToast,
    VStack
} from '@chakra-ui/react'
import {
    AlertCircle,
    CheckCircle,
    Clock,
    Download,
    FileText,
    MoreVertical,
    Trash2,
    XCircle
} from 'lucide-react'

// Internal components

// Types
import {
    Database as DatabaseType,
    LeadListWithAccount
} from '@/types/database'
import { createCustomToast } from '../lib/utils/custom-toast'

type UserAccount = DatabaseType['public']['Tables']['user_accounts']['Row']

// Lead List Card Component
const LeadListCard = ({
    leadList,
    onView,
    onEdit,
    onDelete,
    isLoading,
    borderColor,
    onClickCard
}: {
    leadList: LeadListWithAccount
    onView: (id: string) => void
    onEdit: (leadList: LeadListWithAccount) => void
    onDelete: (id: string) => void
    isLoading: boolean,
    borderColor?: string,
    onClickCard?: () => void
}) => {
    const cardBg = useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(26, 32, 44, 0.8)')
    const cardBorder = 'rgba(255, 255, 255, 0.2)';
    const textColor = useColorModeValue('gray.600', 'gray.400');
    const toast = useToast();
    const customToast = createCustomToast(toast);


    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'completed':
                return { color: 'green', icon: CheckCircle, text: 'Completed' }
            case 'processing':
                return { color: 'blue', icon: Clock, text: 'Processing' }
            case 'failed':
                return { color: 'red', icon: XCircle, text: 'Failed' }
            case 'draft':
            default:
                return { color: 'gray', icon: FileText, text: 'Draft' }
        }
    }

    const statusConfig = getStatusConfig(leadList.status)
    const StatusIcon = statusConfig.icon
    const completionRate = leadList.total_leads > 0 ?
        Math.round((leadList.processed_leads / leadList.total_leads) * 100) : 0

    const onExport = () => {
        customToast.warning({
            title: 'Upgrade to enterprise to export Leads',
            // description: 'Export CSV functionality will be available soon.',
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
                            {/* <Badge
                                colorScheme={statusConfig.color}
                                variant="subtle"
                                fontSize="xs"
                                px={2}
                                py={1}
                                borderRadius="md"
                            >
                                <HStack spacing={1}>
                                    <Icon as={StatusIcon} boxSize={3} />
                                    <Text>{statusConfig.text}</Text>
                                </HStack>
                            </Badge> */}
                        </HStack>
                        {leadList.description && (
                            <Text fontSize="sm" color={textColor} noOfLines={2}>
                                {leadList.description}
                            </Text>
                        )}
                    </VStack>
                    <Menu placement="bottom-end">
                        <MenuButton
                            as={IconButton}
                            icon={<MoreVertical size={16} />}
                            variant="ghost"
                            size="sm"
                            isLoading={isLoading}
                            zIndex={10}
                        />
                        <MenuList
                            zIndex={1500}
                            bg={cardBg}
                            border="1px solid"
                            borderColor={cardBorder}
                            boxShadow="xl"
                            borderRadius="md"
                            backdropFilter="blur(10px)"
                        >
                            {/* <MenuItem icon={<Eye size={16} />} onClick={() => onView(leadList.id)}>
                                View Details
                            </MenuItem>
                            <MenuItem icon={<Settings size={16} />} onClick={() => onEdit(leadList)}>
                                Edit
                            </MenuItem> */}
                            <MenuItem icon={<Download size={16} />} onClick={onExport}>
                                Export CSV
                            </MenuItem>
                            <Divider />
                            <MenuItem
                                icon={<Trash2 size={16} />}
                                color="red.500"
                                onClick={() => onDelete(leadList.id)}
                            >
                                Delete
                            </MenuItem>
                        </MenuList>
                    </Menu>
                </HStack>

                {/* Stats */}
                <HStack spacing={1}>
                    <Text fontSize="md" color={'gray.700'}>Total Leads :</Text>
                    <Text fontSize="md" fontWeight="bold" color="purple.500">
                        {leadList.total_leads}
                    </Text>
                </HStack>

                {/* Last Updated */}
                <Text fontSize="xs" color={textColor}>
                    Updated {new Date(leadList.updated_at).toLocaleDateString()}
                </Text>

                {/* Actions */}
                {/* <HStack spacing={2} justify="flex-end">
                    <Button
                        size="sm"
                        variant="ghost"
                        leftIcon={<Eye size={14} />}
                        onClick={() => onView(leadList.id)}
                    >
                        View
                    </Button>
                </HStack> */}
            </VStack>
        </Card>
    )
}

export default LeadListCard