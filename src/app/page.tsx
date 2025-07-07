'use client'

import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  SimpleGrid,
  Card,
  CardBody,
  useColorModeValue,
  Link
} from '@chakra-ui/react'

export default function Home() {
  const cardBg = useColorModeValue('white', 'gray.700')

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
      {/* Header */}
      <Box bg="white" shadow="sm" borderBottom="1px" borderColor="gray.200">
        <Container maxW="7xl" py={4}>
          <HStack justify="space-between">
            <Heading 
              size="lg" 
              bgGradient="linear(to-r, primary.500, primary.600)" 
              bgClip="text"
            >
              clento
            </Heading>
            <HStack spacing={4}>
              <SignedOut>
                <Button as={Link} href="/sign-in" variant="ghost">
                  Sign In
                </Button>
                <Button as={Link} href="/sign-up" colorScheme="blue">
                  Sign Up
                </Button>
              </SignedOut>
              <SignedIn>
                <Button as={Link} href="/dashboard" colorScheme="blue">
                  Dashboard
                </Button>
                <UserButton />
              </SignedIn>
            </HStack>
          </HStack>
        </Container>
      </Box>

      {/* Hero Section */}
      <Container maxW="7xl" py={20}>
        <VStack spacing={8} textAlign="center">
          <Box>
            <Heading 
              size="3xl" 
              bgGradient="linear(to-r, primary.500, primary.600)" 
              bgClip="text"
              mb={4}
            >
              AI-Powered Sales Development
            </Heading>
            <Text fontSize="xl" color="gray.600" maxW="2xl">
              Automate lead generation and outreach with AI. Find prospects, craft personalized messages, 
              and book meetings while you focus on closing deals.
            </Text>
          </Box>

          <HStack spacing={4}>
            <SignedOut>
              <Button as={Link} href="/sign-up" size="lg" colorScheme="blue">
                Get Started Free
              </Button>
              <Button as={Link} href="/sign-in" size="lg" variant="secondary">
                Sign In
              </Button>
            </SignedOut>
            <SignedIn>
              <Button as={Link} href="/dashboard" size="lg" colorScheme="blue">
                Go to Dashboard
              </Button>
            </SignedIn>
          </HStack>
        </VStack>
      </Container>

      {/* Features Section */}
      <Container maxW="7xl" py={16}>
        <VStack spacing={12}>
          <Box textAlign="center">
            <Heading size="xl" mb={4}>
              Everything You Need for Outbound Sales
            </Heading>
            <Text fontSize="lg" color="gray.600">
              Your AI SDR handles the entire sales process from lead discovery to booking meetings
            </Text>
          </Box>

          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
            <Card bg={cardBg} shadow="lg">
              <CardBody p={8}>
                <VStack spacing={4} align="start">
                  <Text fontSize="3xl">🎯</Text>
                  <Heading size="md">Smart Lead Discovery</Heading>
                  <Text color="gray.600">
                    Find ideal prospects using AI-powered search across millions of contacts. 
                    Filter by industry, role, company size, and more.
                  </Text>
                </VStack>
              </CardBody>
            </Card>

            <Card bg={cardBg} shadow="lg">
              <CardBody p={8}>
                <VStack spacing={4} align="start">
                  <Text fontSize="3xl">✍️</Text>
                  <Heading size="md">Personalized Outreach</Heading>
                  <Text color="gray.600">
                    AI crafts personalized emails and LinkedIn messages for each prospect, 
                    incorporating their company info and pain points.
                  </Text>
                </VStack>
              </CardBody>
            </Card>

            <Card bg={cardBg} shadow="lg">
              <CardBody p={8}>
                <VStack spacing={4} align="start">
                  <Text fontSize="3xl">📊</Text>
                  <Heading size="md">Multi-Channel Sequences</Heading>
                  <Text color="gray.600">
                    Automate follow-ups across email and LinkedIn with intelligent timing 
                    and conditional workflows.
                  </Text>
                </VStack>
              </CardBody>
            </Card>

            <Card bg={cardBg} shadow="lg">
              <CardBody p={8}>
                <VStack spacing={4} align="start">
                  <Text fontSize="3xl">🤖</Text>
                  <Heading size="md">AI Reply Handling</Heading>
                  <Text color="gray.600">
                    Automatically classify responses and get AI-suggested replies to 
                    keep conversations moving forward.
                  </Text>
                </VStack>
              </CardBody>
            </Card>

            <Card bg={cardBg} shadow="lg">
              <CardBody p={8}>
                <VStack spacing={4} align="start">
                  <Text fontSize="3xl">📈</Text>
                  <Heading size="md">Performance Analytics</Heading>
                  <Text color="gray.600">
                    Track open rates, reply rates, and meeting bookings with detailed 
                    analytics and optimization insights.
                  </Text>
                </VStack>
              </CardBody>
            </Card>

            <Card bg={cardBg} shadow="lg">
              <CardBody p={8}>
                <VStack spacing={4} align="start">
                  <Text fontSize="3xl">🔗</Text>
                  <Heading size="md">Seamless Integrations</Heading>
                  <Text color="gray.600">
                    Connect your existing email accounts, LinkedIn, and CRM tools 
                    for a unified sales workflow.
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          </SimpleGrid>
        </VStack>
      </Container>

      {/* CTA Section */}
      <Box bg="primary.500" color="white" py={16}>
        <Container maxW="7xl">
          <VStack spacing={8} textAlign="center">
            <Heading size="xl">
              Ready to Scale Your Outbound Sales?
            </Heading>
            <Text fontSize="lg" opacity={0.9}>
              Join thousands of sales teams using AI to generate more qualified leads and book more meetings.
            </Text>
            <SignedOut>
              <Button as={Link} href="/sign-up" size="lg" bg="white" color="primary.600" _hover={{ bg: 'gray.100' }}>
                Start Free Trial
              </Button>
            </SignedOut>
            <SignedIn>
              <Button as={Link} href="/dashboard" size="lg" bg="white" color="primary.600" _hover={{ bg: 'gray.100' }}>
                Go to Dashboard
              </Button>
            </SignedIn>
          </VStack>
        </Container>
      </Box>
    </Box>
  )
}
