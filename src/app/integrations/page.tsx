'use client'

import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Card,
  CardBody,
  SimpleGrid,
  HStack,
  Icon,
  Badge,
  Switch,
  useColorModeValue
} from '@chakra-ui/react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { GradientButton } from '@/components/ui/GradientButton'
import { Settings, Mail, MessageSquare, Calendar, Database, Zap } from 'lucide-react'

const integrations = [
  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'Connect your LinkedIn account for outreach',
    icon: MessageSquare,
    status: 'connected',
    category: 'Social'
  },
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Send emails through your Gmail account',
    icon: Mail,
    status: 'disconnected',
    category: 'Email'
  },
  {
    id: 'outlook',
    name: 'Outlook',
    description: 'Send emails through your Outlook account',
    icon: Mail,
    status: 'disconnected',
    category: 'Email'
  },
  {
    id: 'calendly',
    name: 'Calendly',
    description: 'Automatically book meetings with prospects',
    icon: Calendar,
    status: 'disconnected',
    category: 'Scheduling'
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Sync leads and activities with HubSpot CRM',
    icon: Database,
    status: 'disconnected',
    category: 'CRM'
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Sync leads and activities with Salesforce',
    icon: Database,
    status: 'disconnected',
    category: 'CRM'
  }
]

export default function IntegrationsPage() {
  const cardBg = useColorModeValue('white', 'gray.700')

  return (
    <DashboardLayout>
      <Container maxW="7xl" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Box>
            <Heading size="lg" mb={2}>Integrations</Heading>
            <Text color="gray.600">
              Connect your favorite tools to streamline your sales workflow
            </Text>
          </Box>

          {/* Integrations Grid */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {integrations.map((integration) => (
              <Card key={integration.id} bg={cardBg}>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <HStack justify="space-between">
                      <HStack spacing={3}>
                        <Icon as={integration.icon} boxSize={6} color="purple.500" />
                        <VStack spacing={0} align="start">
                          <Text fontWeight="semibold">{integration.name}</Text>
                          <Badge 
                            colorScheme={integration.status === 'connected' ? 'green' : 'gray'} 
                            size="sm"
                          >
                            {integration.status}
                          </Badge>
                        </VStack>
                      </HStack>
                      <Switch 
                        colorScheme="purple" 
                        isChecked={integration.status === 'connected'}
                        size="lg"
                      />
                    </HStack>
                    
                    <Text fontSize="sm" color="gray.600">
                      {integration.description}
                    </Text>
                    
                    <GradientButton 
                      size="sm" 
                      variant={integration.status === 'connected' ? 'tertiary' : 'primary'}
                    >
                      {integration.status === 'connected' ? 'Configure' : 'Connect'}
                    </GradientButton>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>

          {/* Enterprise Notice */}
          <Card bg="purple.50" border="2px solid" borderColor="purple.200">
            <CardBody textAlign="center" py={12}>
              <VStack spacing={4}>
                <Icon as={Zap} boxSize={12} color="purple.500" />
                <Badge colorScheme="purple" fontSize="sm" px={3} py={1}>
                  ENTERPRISE FEATURE
                </Badge>
                <Heading size="md" color="purple.700">
                  Advanced Integrations
                </Heading>
                <Text color="purple.600" maxW="md">
                  Unlock advanced integrations with custom webhooks, API access, 
                  and enterprise-grade security features.
                </Text>
                <GradientButton size="lg">
                  Upgrade to Enterprise
                </GradientButton>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </DashboardLayout>
  )
} 