'use client'

import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Card,
  CardBody,
  useColorModeValue,
  Icon,
  Flex
} from '@chakra-ui/react'
import Link from 'next/link'
import { GradientButton } from '@/components/ui/GradientButton'
import { Users, MessageCircle, UserCheck, Headphones, Shield } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const cardBg = useColorModeValue('white', 'gray.700')
  const cardHoverBg = useColorModeValue('gray.50', 'gray.600')

  const agents = [
    {
      id: 'ai-sdr',
      name: 'SDR AI',
      description: 'Automate lead generation and outreach with AI. Find prospects, craft personalized messages, and book meetings.',
      icon: Users,
      color: 'purple.500'
    },
    {
      id: 'ai-marketer',
      name: 'Marketer AI',
      description: 'Create personalized marketing campaigns and automate customer engagement across multiple channels.',
      icon: MessageCircle,
      color: 'blue.500'
    },
    {
      id: 'ai-recruiter',
      name: 'Recruiter AI',
      description: 'Engage top candidates with personalized job offers and automate recruitment outreach.',
      icon: UserCheck,
      color: 'green.500'
    },
    {
      id: 'ai-sales-buddy',
      name: 'Conversation Intelligence AI',
      description: 'Analyze 100% of conversations across teams, extract insights, automate quality assurance, and provide real-time coaching for enhanced customer experience.',
      icon: Headphones,
      color: 'orange.500'
    },
    {
      id: 'asset-inventory-agent',
      name: 'Asset Inventory AI',
      description: 'Query asset inventory, identify critical assets, vulnerabilities, and provide security insights.',
      icon: Shield,
      color: 'red.500'
    }
  ]

  const handleAgentSelect = (agentId: string) => {
    if (agentId === 'asset-inventory-agent') {
      // Redirect to Observe.AI Slack app for Asset Inventory AI
      window.open('https://observeai.slack.com/app_redirect?app=A08TXBQJGGK', '_blank')
      return
    }
    
    localStorage.setItem('selectedAgent', agentId)
    router.push('/dashboard')
  }

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
      <Container maxW="7xl" py={12}>
        <VStack spacing={6} textAlign="center" mb={8}>
          <Heading size="3xl" bgGradient="linear(to-r, purple.400, purple.600)" bgClip="text">
            Observe Agents
          </Heading>
          <Text fontSize="lg" color="gray.600" maxW="3xl">
            Your internal suite of AI-powered employees that automate repetitive tasks across functions. Choose your AI agent and transform how your teams work.
          </Text>
        </VStack>

        <Box>
          {/* First row with 3 agents */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8} mb={8}>
            {agents.slice(0, 3).map((agent) => (
              <Card 
                key={agent.id}
                bg={cardBg}
                shadow="lg"
                cursor="pointer"
                onClick={() => handleAgentSelect(agent.id)}
                _hover={{ bg: cardHoverBg, transform: 'translateY(-4px)', shadow: 'xl' }}
                transition="all 0.3s ease"
                borderRadius="xl"
                p={2}
              >
                <CardBody p={8}>
                  <VStack spacing={5} align="center" textAlign="center">
                    <Box p={4} borderRadius="full" bg={useColorModeValue('gray.100', 'gray.700')}>
                      <Icon as={agent.icon} boxSize={8} color={agent.color} />
                    </Box>
                    <Heading size="md">{agent.name}</Heading>
                    <Text color="gray.600" fontSize="sm">{agent.description}</Text>
                    <GradientButton size="sm">Get Started</GradientButton>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
          
          {/* Second row with 2 agents centered */}
          <Flex justify="center">
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} maxW="800px">
              {agents.slice(3).map((agent) => (
                <Card 
                  key={agent.id}
                  bg={cardBg}
                  shadow="lg"
                  cursor="pointer"
                  onClick={() => handleAgentSelect(agent.id)}
                  _hover={{ bg: cardHoverBg, transform: 'translateY(-4px)', shadow: 'xl' }}
                  transition="all 0.3s ease"
                  borderRadius="xl"
                  p={2}
                >
                  <CardBody p={8}>
                    <VStack spacing={5} align="center" textAlign="center">
                      <Box p={4} borderRadius="full" bg={useColorModeValue('gray.100', 'gray.700')}>
                        <Icon as={agent.icon} boxSize={8} color={agent.color} />
                      </Box>
                      <Heading size="md">{agent.name}</Heading>
                      <Text color="gray.600" fontSize="sm">{agent.description}</Text>
                      <GradientButton size="sm">Get Started</GradientButton>
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          </Flex>
        </Box>
      </Container>
    </Box>
  )
}
