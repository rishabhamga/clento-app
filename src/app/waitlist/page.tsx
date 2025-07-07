'use client'

import { Waitlist } from '@clerk/nextjs'
import { 
  Box, 
  Container, 
  VStack, 
  Heading, 
  Text,
  Card,
  CardBody,
  useColorModeValue
} from '@chakra-ui/react'

export default function WaitlistPage() {
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  return (
    <Box 
      minH="100vh" 
      bg="gray.50"
      display="flex"
      alignItems="center"
      justifyContent="center"
      py={12}
      px={4}
    >
      <Container maxW="2xl" centerContent>
        <VStack spacing={8} textAlign="center" w="full">
          {/* Logo and branding */}
          <Box>
            <Heading 
              size="3xl" 
              bgGradient="linear(to-r, purple.400, purple.600)" 
              bgClip="text"
              mb={2}
              fontWeight="bold"
            >
              clento
            </Heading>
            <Text fontSize="lg" color="gray.600" fontWeight="medium">
              AI-powered Sales Development Representative
            </Text>
          </Box>

          {/* Waitlist card */}
          <Card 
            maxW="xl" 
            w="full" 
            shadow="xl"
            bg={cardBg}
            border="1px solid"
            borderColor={borderColor}
            borderRadius="2xl"
            overflow="hidden"
            mx="auto"
          >
            <CardBody px={12} py={10}>
              <VStack spacing={8} align="center">
                {/* Card header */}
                <Box textAlign="center" maxW="md">
                  <Heading 
                    size="xl" 
                    color="gray.900" 
                    mb={4}
                    fontWeight="bold"
                  >
                    Join the Waitlist
                  </Heading>
                  <Text color="gray.600" fontSize="md" lineHeight="tall">
                    Be the first to know when we launch and get early access to our AI SDR platform
                  </Text>
                </Box>

                {/* Waitlist form */}
                <Box 
                  w="full"
                  maxW="sm"
                  mx="auto"
                  sx={{
                    '& .cl-card': {
                      boxShadow: 'none !important',
                      border: 'none !important',
                      backgroundColor: 'transparent !important',
                      padding: '0 !important',
                      margin: '0 !important'
                    },
                    '& .cl-rootBox': {
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'center'
                    },
                    '& .cl-form': {
                      width: '100%',
                      maxWidth: '320px',
                      margin: '0 auto'
                    }
                  }}
                >
                  <Waitlist 
                    appearance={{
                      elements: {
                        rootBox: "w-full flex justify-center",
                        card: "shadow-none border-0 bg-transparent p-0 m-0",
                        headerTitle: "hidden",
                        headerSubtitle: "hidden", 
                        footer: "hidden",
                        formFieldInput: "border-2 border-gray-200 focus:border-purple-400 focus:ring-purple-400 focus:ring-2 focus:ring-opacity-20 rounded-lg py-2.5 px-3.5 transition-all duration-200 w-full text-sm",
                        formButtonPrimary: "bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white font-semibold pt-2.5 pb-4 px-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 w-full mt-4 mb-6",
                        formFieldLabel: "text-gray-700 font-medium mb-2 text-center block text-sm",
                        formFieldSuccessText: "text-green-600 text-xs mt-2 text-center",
                        formFieldErrorText: "text-red-600 text-xs mt-2 text-center",
                        form: "space-y-3 w-full",
                        formField: "w-full space-y-2"
                      },
                      variables: {
                        colorPrimary: "#9333ea",
                        colorBackground: "transparent",
                        colorInputBackground: "#ffffff",
                        colorInputText: "#1f2937",
                        colorText: "#1f2937", 
                        colorTextSecondary: "#6b7280",
                        colorSuccess: "#059669",
                        colorDanger: "#dc2626",
                        borderRadius: "0.5rem",
                        spacingUnit: "0.75rem",
                        fontFamily: "Inter, system-ui, sans-serif",
                        fontSize: "14px",
                        fontWeight: {
                          normal: "400",
                          medium: "500", 
                          bold: "600"
                        }
                      }
                    }}
                  />
                </Box>
              </VStack>
            </CardBody>
          </Card>

          {/* Footer text */}
          <Text fontSize="sm" color="gray.600" textAlign="center">
            Already have an account?{' '}
            <Text 
              as="a" 
              href="/sign-in" 
              color="purple.600" 
              fontWeight="semibold"
              _hover={{ color: "purple.700", textDecoration: "underline" }}
              transition="all 0.2s"
            >
              Sign in
            </Text>
          </Text>
        </VStack>
      </Container>
    </Box>
  )
} 