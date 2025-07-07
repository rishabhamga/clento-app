'use client'

import { SignUp } from '@clerk/nextjs'
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

export default function SignUpPage() {
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  return (
    <Box 
      minH="100vh" 
      bg="gray.50"
      display="flex"
      alignItems="center"
      justifyContent="center"
      py={8}
    >
      <Container maxW="md">
        <VStack spacing={8} textAlign="center">
          {/* Logo and branding */}
          <Box>
            <Heading 
              size="3xl" 
              bgGradient="linear(to-r, purple.400, purple.600, purple.800)" 
              bgClip="text"
              mb={4}
              fontWeight="bold"
            >
              clento
            </Heading>
            <Text fontSize="xl" color="gray.600" fontWeight="medium">
              AI-powered Sales Development Representative
            </Text>
          </Box>

          {/* Sign-up card */}
          <Card 
            maxW="lg" 
            w="full" 
            shadow="xl"
            bg={cardBg}
            border="1px solid"
            borderColor={borderColor}
            borderRadius="xl"
            overflow="hidden"
          >
            <CardBody p={8}>
              <SignUp 
                appearance={{
                  elements: {
                    rootBox: "mx-auto w-full",
                    card: "shadow-none border-0 bg-transparent w-full",
                    headerTitle: "text-2xl font-bold text-gray-900 mb-2",
                    headerSubtitle: "text-gray-600 mb-6",
                    socialButtonsBlockButton: "border-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50 text-gray-700 font-medium py-3 transition-all duration-200",
                    socialButtonsBlockButtonText: "text-gray-700 font-medium",
                    formFieldInput: "border-2 border-gray-200 focus:border-purple-400 focus:ring-purple-400 focus:ring-2 focus:ring-opacity-20 rounded-lg py-3 px-4 transition-all duration-200",
                    formButtonPrimary: "bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5",
                    footerActionLink: "text-purple-600 hover:text-purple-700 font-medium transition-colors duration-200",
                    identityPreviewText: "text-gray-900",
                    identityPreviewEditButtonIcon: "text-purple-500",
                    formFieldLabel: "text-gray-700 font-medium mb-2",
                    formFieldSuccessText: "text-green-600",
                    formFieldErrorText: "text-red-600",
                    dividerLine: "bg-gray-200",
                    dividerText: "text-gray-500 font-medium",
                    formResendCodeLink: "text-purple-600 hover:text-purple-700",
                    otpCodeFieldInput: "border-2 border-gray-200 focus:border-purple-400 focus:ring-purple-400 rounded-lg"
                  },
                  variables: {
                    colorPrimary: "#9333ea", // purple-600
                    colorBackground: "#ffffff",
                    colorInputBackground: "#ffffff",
                    colorInputText: "#1f2937", // gray-800
                    colorText: "#1f2937", // gray-800
                    colorTextSecondary: "#6b7280", // gray-500
                    colorSuccess: "#059669", // emerald-600
                    colorDanger: "#dc2626", // red-600
                    colorWarning: "#d97706", // amber-600
                    borderRadius: "0.5rem",
                    spacingUnit: "1rem",
                    fontFamily: "Inter, system-ui, sans-serif",
                    fontSize: "14px",
                    fontWeight: {
                      normal: "400",
                      medium: "500",
                      bold: "700"
                    }
                  },
                  layout: {
                    socialButtonsPlacement: "top",
                    socialButtonsVariant: "blockButton",
                    showOptionalFields: true
                  }
                }}
                redirectUrl="/dashboard"
                signInUrl="/sign-in"
              />
            </CardBody>
          </Card>

          {/* Footer text */}
          <Text fontSize="md" color="gray.600" textAlign="center">
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