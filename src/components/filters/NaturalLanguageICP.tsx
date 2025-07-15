'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Textarea,
  Button,
  Card,
  CardBody,
  Avatar,
  Badge,
  Spinner,
  Alert,
  AlertIcon,
  useColorModeValue,
  Flex,
  Icon,
  Tooltip,
  Fade,
  ScaleFade,
} from '@chakra-ui/react'
import { FiUser, FiZap, FiTarget, FiMessageCircle, FiCheck, FiArrowRight } from 'react-icons/fi'
import { GradientButton } from '@/components/ui/GradientButton'

// Simple animation styles
const pulseStyle = {
  transition: 'opacity 0.5s ease-in-out',
}

const floatStyle = {
  transition: 'transform 0.3s ease-in-out',
}

const typingStyle = {
  transition: 'opacity 0.2s ease-in-out',
}

interface ParsedICP {
  searchType: 'people' | 'company'
  industries: string[]
  locations: string[]
  jobTitles: string[]
  seniorities: string[]
  companySize: string[]
  technologies: string[]
  keywords: string[]
  confidence: number
  reasoning: string
}

interface ValidationResults {
  industries: { [key: string]: string[] }
  jobTitles: { [key: string]: { titles: string[], levels: string[], departments: string[] } }
  locations: { [key: string]: string[] }
  technologies: { [key: string]: string[] }
  isValid: boolean
  errors: string[]
}

interface ICPAnalysisResult {
  success: boolean
  parsedICP: ParsedICP
  originalICP?: ParsedICP
  validation?: ValidationResults
  error?: string
}

interface NaturalLanguageICPProps {
  onICPParsed: (parsedICP: ParsedICP) => void
  onReset?: () => void
  disabled?: boolean
}

const AI_SDR_MESSAGES = {
  welcome: "Hi! I'm Alex, your AI SDR assistant. I'll help you find your perfect prospects. Just describe your ideal customer in natural language and I'll translate that into precise targeting filters.",
  thinking: "Let me analyze your target profile...",
  parsing: "Understanding your requirements and mapping to our database...",
  validating: "Validating filters with Explorium's data platform...",
  success: "Perfect! I've identified and validated your ideal customer profile. Here's what I found:",
  successWithWarnings: "Great! I've processed your ICP, though some terms needed adjustment for better accuracy.",
  error: "I had trouble understanding that. Could you be more specific about your target audience?",
  examples: [
    "I want to target CTOs at mid-size B2B SaaS companies in the US with 50-500 employees",
    "Find marketing directors at fintech startups that raised Series A funding",
    "Target HR managers at healthcare companies in California with 100+ employees using Workday"
  ]
}

export function NaturalLanguageICP({ onICPParsed, onReset, disabled = false }: NaturalLanguageICPProps) {
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [aiMessage, setAiMessage] = useState(AI_SDR_MESSAGES.welcome)
  const [isTyping, setIsTyping] = useState(false)
  const [parsedICP, setParsedICP] = useState<ParsedICP | null>(null)
  const [validationResults, setValidationResults] = useState<ValidationResults | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'input' | 'processing' | 'results'>('input')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const cardBg = useColorModeValue('rgba(255, 255, 255, 0.95)', 'rgba(26, 32, 44, 0.95)')
  const borderColor = useColorModeValue('rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0.1)')
  const textColor = useColorModeValue('gray.800', 'white')
  const mutedColor = useColorModeValue('gray.600', 'gray.400')

  const typeMessage = async (message: string, delay = 50) => {
    setIsTyping(true)
    setAiMessage('')
    
    for (let i = 0; i <= message.length; i++) {
      await new Promise(resolve => setTimeout(resolve, delay))
      setAiMessage(message.slice(0, i))
    }
    
    setIsTyping(false)
  }

  const handleAnalyzeICP = async () => {
    if (!input.trim()) {
      setError('Please describe your ideal customer profile')
      return
    }

    setIsProcessing(true)
    setStep('processing')
    setError(null)

    try {
      // Show processing messages with typing effect
      await typeMessage(AI_SDR_MESSAGES.thinking, 30)
      await new Promise(resolve => setTimeout(resolve, 1000))
      await typeMessage(AI_SDR_MESSAGES.parsing, 40)
      await new Promise(resolve => setTimeout(resolve, 1500))
      await typeMessage(AI_SDR_MESSAGES.validating, 35)

      const response = await fetch('/api/parse-icp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          icpDescription: input.trim()
        })
      })

      const data: ICPAnalysisResult = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to parse ICP')
      }

      setParsedICP(data.parsedICP)
      setValidationResults(data.validation || null)
      setStep('results')
      
      // Show appropriate success message based on validation results
      const hasValidationWarnings = data.validation && (!data.validation.isValid || data.validation.errors.length > 0)
      const successMessage = hasValidationWarnings ? AI_SDR_MESSAGES.successWithWarnings : AI_SDR_MESSAGES.success
      await typeMessage(successMessage, 30)
      
      // Call the parent component's callback
      onICPParsed(data.parsedICP)

    } catch (error) {
      console.error('Error parsing ICP:', error)
      setError(error instanceof Error ? error.message : 'Failed to analyze your ICP')
      setStep('input')
      await typeMessage(AI_SDR_MESSAGES.error, 40)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReset = () => {
    setInput('')
    setParsedICP(null)
    setValidationResults(null)
    setError(null)
    setStep('input')
    setAiMessage(AI_SDR_MESSAGES.welcome)
    if (onReset) onReset()
  }

  const handleExampleClick = (example: string) => {
    setInput(example)
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }

  useEffect(() => {
    typeMessage(AI_SDR_MESSAGES.welcome, 20)
  }, [])

  return (
    <Card 
      bg={cardBg}
      backdropFilter="blur(10px)"
      border="1px solid"
      borderColor={borderColor}
      borderRadius="2xl"
      overflow="hidden"
      shadow="xl"
      position="relative"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        bgGradient: 'linear(to-r, #667eea, #764ba2, #f093fb)',
        opacity: step === 'processing' ? 0.8 : 1,
      }}
    >
      <CardBody p={8}>
        <VStack spacing={6} align="stretch">
          {/* AI SDR Header */}
          <HStack spacing={4} align="center">
            <Box position="relative">
              <Avatar
                size="lg"
                name="Alex AI"
                bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                color="white"
                transform={step === 'processing' ? 'scale(1.05)' : 'scale(1)'}
                transition="transform 0.3s ease-in-out"
              />
              <Badge
                position="absolute"
                bottom="-2px"
                right="-2px"
                bg="green.500"
                color="white"
                borderRadius="full"
                px={2}
                py={1}
                fontSize="xs"
                boxShadow="0 0 0 2px white"
              >
                <Icon as={FiZap} w={3} h={3} />
              </Badge>
            </Box>
            
            <VStack align="start" spacing={1} flex={1}>
              <HStack spacing={2}>
                <Text fontSize="xl" fontWeight="bold" color={textColor}>
                  Alex
                </Text>
                <Badge colorScheme="purple" fontSize="xs">
                  AI SDR Assistant
                </Badge>
              </HStack>
              <Box minH="24px">
                <Text 
                  fontSize="sm" 
                  color={mutedColor}
                  position="relative"
                >
                  {aiMessage}
                  {isTyping && (
                    <Box
                      as="span"
                      ml={1}
                      w={2}
                      h={4}
                      bg={mutedColor}
                      display="inline-block"
                      opacity={isTyping ? 1 : 0}
                      transition="opacity 0.5s ease-in-out"
                    />
                  )}
                </Text>
              </Box>
            </VStack>
          </HStack>

          {step === 'input' && (
            <ScaleFade in={step === 'input'} initialScale={0.9}>
              <VStack spacing={4} align="stretch">
                {/* Input Section */}
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={3} color={textColor}>
                    Describe your ideal customer profile:
                  </Text>
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="e.g., I want to target CTOs at mid-size B2B SaaS companies in the US with 50-500 employees..."
                    rows={4}
                    resize="vertical"
                    bg={useColorModeValue('white', 'gray.700')}
                    border="2px solid"
                    borderColor={useColorModeValue('gray.200', 'gray.600')}
                    _focus={{
                      borderColor: '#667eea',
                      boxShadow: '0 0 0 1px #667eea',
                    }}
                    disabled={disabled}
                  />
                </Box>

                {/* Example Prompts */}
                <Box>
                  <Text fontSize="xs" color={mutedColor} mb={2}>
                    💡 Try these examples:
                  </Text>
                  <VStack spacing={2} align="stretch">
                    {AI_SDR_MESSAGES.examples.map((example, index) => (
                      <Box
                        key={index}
                        p={3}
                        bg={useColorModeValue('gray.50', 'gray.700')}
                        borderRadius="lg"
                        cursor="pointer"
                        _hover={{
                          bg: useColorModeValue('gray.100', 'gray.600'),
                          transform: 'translateY(-1px)',
                        }}
                        transition="all 0.2s"
                        onClick={() => handleExampleClick(example)}
                      >
                        <Text fontSize="sm" color={mutedColor}>
                          "{example}"
                        </Text>
                      </Box>
                    ))}
                  </VStack>
                </Box>

                {/* Action Button */}
                <GradientButton
                  size="lg"
                  onClick={handleAnalyzeICP}
                  isDisabled={!input.trim() || isProcessing || disabled}
                  rightIcon={<FiArrowRight />}
                  _hover={{
                    transform: 'translateY(-2px)',
                    shadow: 'xl',
                  }}
                  transition="all 0.3s ease"
                >
                  Analyze My ICP
                </GradientButton>

                {error && (
                  <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    {error}
                  </Alert>
                )}
              </VStack>
            </ScaleFade>
          )}

          {step === 'processing' && (
            <Fade in={step === 'processing'}>
              <VStack spacing={6} py={8} align="center">
                <Spinner size="xl" color="purple.500" thickness="4px" />
                <VStack spacing={2} textAlign="center">
                  <Text fontSize="lg" fontWeight="semibold" color={textColor}>
                    Analyzing Your ICP...
                  </Text>
                  <Text fontSize="sm" color={mutedColor}>
                    This may take a few moments
                  </Text>
                </VStack>
              </VStack>
            </Fade>
          )}

          {step === 'results' && parsedICP && (
            <ScaleFade in={step === 'results'} initialScale={0.9}>
              <VStack spacing={4} align="stretch">
                {/* Results Summary */}
                <Box
                  p={4}
                  bg={useColorModeValue('green.50', 'green.900')}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor={useColorModeValue('green.200', 'green.700')}
                >
                  <HStack spacing={3} mb={3}>
                    <Icon as={FiCheck} color="green.500" w={5} h={5} />
                    <Text fontWeight="semibold" color={textColor}>
                      ICP Analysis Complete
                    </Text>
                    <Badge colorScheme="green" fontSize="xs">
                      {Math.round(parsedICP.confidence)}% confidence
                    </Badge>
                  </HStack>
                  
                  <Text fontSize="sm" color={mutedColor} mb={3}>
                    {parsedICP.reasoning}
                  </Text>

                  <VStack spacing={2} align="stretch">
                    {parsedICP.industries.length > 0 && (
                      <HStack>
                        <Text fontSize="sm" fontWeight="medium" minW="100px">Industries:</Text>
                        <Text fontSize="sm" color={mutedColor}>{parsedICP.industries.join(', ')}</Text>
                      </HStack>
                    )}
                    {parsedICP.jobTitles.length > 0 && (
                      <HStack>
                        <Text fontSize="sm" fontWeight="medium" minW="100px">Job Titles:</Text>
                        <Text fontSize="sm" color={mutedColor}>{parsedICP.jobTitles.join(', ')}</Text>
                      </HStack>
                    )}
                    {parsedICP.locations.length > 0 && (
                      <HStack>
                        <Text fontSize="sm" fontWeight="medium" minW="100px">Locations:</Text>
                        <Text fontSize="sm" color={mutedColor}>{parsedICP.locations.join(', ')}</Text>
                      </HStack>
                    )}
                    {parsedICP.companySize.length > 0 && (
                      <HStack>
                        <Text fontSize="sm" fontWeight="medium" minW="100px">Company Size:</Text>
                        <Text fontSize="sm" color={mutedColor}>{parsedICP.companySize.join(', ')}</Text>
                      </HStack>
                    )}
                  </VStack>
                </Box>

                {/* Validation Status */}
                {validationResults && (
                  <Box
                    p={3}
                    bg={validationResults.isValid 
                      ? useColorModeValue('blue.50', 'blue.900') 
                      : useColorModeValue('orange.50', 'orange.900')
                    }
                    borderRadius="md"
                    border="1px solid"
                    borderColor={validationResults.isValid 
                      ? useColorModeValue('blue.200', 'blue.700')
                      : useColorModeValue('orange.200', 'orange.700')
                    }
                  >
                    <HStack spacing={2} mb={2}>
                      <Icon 
                        as={validationResults.isValid ? FiCheck : FiZap} 
                        color={validationResults.isValid ? 'blue.500' : 'orange.500'} 
                        w={4} h={4} 
                      />
                      <Text fontSize="sm" fontWeight="semibold" color={textColor}>
                        {validationResults.isValid ? 'Data Validation Complete' : 'Filters Optimized'}
                      </Text>
                      <Badge 
                        colorScheme={validationResults.isValid ? 'blue' : 'orange'} 
                        fontSize="xs"
                      >
                        Verified
                      </Badge>
                    </HStack>
                    
                    {validationResults.errors.length > 0 && (
                      <Text fontSize="xs" color={mutedColor}>
                        {validationResults.errors.length} term{validationResults.errors.length !== 1 ? 's' : ''} 
                        {' '}optimized for better database matching
                      </Text>
                    )}
                    
                    {validationResults.isValid && (
                      <Text fontSize="xs" color={mutedColor}>
                        All filters validated against Explorium's B2B database
                      </Text>
                    )}
                  </Box>
                )}

                {/* Action Buttons */}
                <HStack spacing={3}>
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    leftIcon={<FiTarget />}
                  >
                    Refine ICP
                  </Button>
                  <Text fontSize="sm" color={mutedColor} flex={1}>
                    The filters below have been automatically populated and validated based on your ICP.
                  </Text>
                </HStack>
              </VStack>
            </ScaleFade>
          )}
        </VStack>
      </CardBody>
    </Card>
  )
}

export default NaturalLanguageICP 