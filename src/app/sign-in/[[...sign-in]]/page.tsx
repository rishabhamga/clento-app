'use client'

import { SignIn } from '@clerk/nextjs'
import { 
  Box, 
  Container, 
  VStack, 
  Heading, 
  Text
} from '@chakra-ui/react'

export default function SignInPage() {
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
      <Container maxW="md" centerContent>
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

          {/* Sign-in component */}
          <SignIn 
            appearance={{
              elements: {
                rootBox: "mx-auto w-full",
                card: "shadow-xl border border-gray-200 bg-white w-full rounded-2xl",
                headerTitle: "text-2xl font-bold text-gray-900 mb-2 text-center",
                headerSubtitle: "text-gray-600 mb-6 text-center",
                socialButtonsBlockButton: "border-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50 text-gray-700 font-medium py-3 transition-all duration-200 rounded-xl w-full",
                socialButtonsBlockButtonText: "text-gray-700 font-medium",
                formFieldInput: "border-2 border-gray-200 focus:border-purple-400 focus:ring-purple-400 focus:ring-2 focus:ring-opacity-20 rounded-xl py-3 px-4 transition-all duration-200 w-full",
                formButtonPrimary: "bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 w-full",
                footerActionLink: "text-purple-600 hover:text-purple-700 font-medium transition-colors duration-200",
                identityPreviewText: "text-gray-900",
                identityPreviewEditButtonIcon: "text-purple-500",
                formFieldLabel: "text-gray-700 font-medium mb-2",
                formFieldSuccessText: "text-green-600",
                formFieldErrorText: "text-red-600",
                dividerLine: "bg-gray-200",
                dividerText: "text-gray-500 font-medium",
                formResendCodeLink: "text-purple-600 hover:text-purple-700",
                otpCodeFieldInput: "border-2 border-gray-200 focus:border-purple-400 focus:ring-purple-400 rounded-xl"
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
                borderRadius: "0.75rem",
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
            signUpUrl="/sign-up"
          />

          {/* Footer text */}
          <Text fontSize="sm" color="gray.600" textAlign="center">
            Don&apos;t have an account?{' '}
            <Text 
              as="a" 
              href="/sign-up" 
              color="purple.600" 
              fontWeight="semibold"
              _hover={{ color: "purple.700", textDecoration: "underline" }}
              transition="all 0.2s"
            >
              Sign up for free
            </Text>
          </Text>
        </VStack>
      </Container>
    </Box>
  )
} 