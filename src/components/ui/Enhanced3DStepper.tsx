/**
 * Enhanced3DStepper - A beautiful, animated stepper component with 3D design effects
 * 
 * Features:
 * - Glassmorphism design with blur effects
 * - Smooth animations with Framer Motion
 * - Customizable variants (default, compact, detailed)
 * - Progress indicator with percentage
 * - Gradient backgrounds and glowing effects
 * - Support for light/dark modes
 * - Shimmer effects on active steps
 * 
 * Used in both onboarding and campaign creation flows
 */

'use client'

import React from 'react'
import {
  Box,
  Card,
  CardBody,
  Step,
  StepIcon,
  StepIndicator,
  StepNumber,
  StepSeparator,
  StepStatus,
  StepTitle,
  StepDescription,
  Stepper,
  Text,
  useColorModeValue,
  VStack,
  HStack,
  Icon,
  Badge,
  Flex
} from '@chakra-ui/react'
import { keyframes } from '@emotion/react'
import { CheckIcon } from '@chakra-ui/icons'
import { motion } from 'framer-motion'

// Enhanced 3D animations
const float = keyframes`
  0%, 100% { transform: translateY(0px) scale(1); }
  50% { transform: translateY(-3px) scale(1.02); }
`

const glow = keyframes`
  0%, 100% { 
    box-shadow: 
      0 4px 15px rgba(102, 126, 234, 0.2),
      0 8px 25px rgba(102, 126, 234, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
  50% { 
    box-shadow: 
      0 6px 20px rgba(102, 126, 234, 0.3),
      0 12px 35px rgba(102, 126, 234, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.15);
  }
`

const shimmer = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`

const pulse = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.9; transform: scale(1.05); }
`

const gradientMove = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`

interface StepData {
  title: string
  description?: string
  icon?: React.ElementType
}

interface Enhanced3DStepperProps {
  currentStep: number
  steps: StepData[]
  variant?: 'default' | 'compact' | 'detailed'
  colorScheme?: string
  showProgress?: boolean
  animated?: boolean
}

const MotionBox = motion(Box)
const MotionCard = motion(Card)

export function Enhanced3DStepper({ 
  currentStep, 
  steps, 
  variant = 'default',
  colorScheme = 'purple',
  showProgress = true,
  animated = true
}: Enhanced3DStepperProps) {
  // Enhanced color mode values with 3D styling
  const cardBg = useColorModeValue(
    'rgba(255, 255, 255, 0.95)', 
    'rgba(26, 32, 44, 0.95)'
  )
  const glassBg = useColorModeValue(
    'rgba(255, 255, 255, 0.8)', 
    'rgba(26, 32, 44, 0.8)'
  )
  const borderColor = useColorModeValue(
    'rgba(102, 126, 234, 0.2)', 
    'rgba(159, 122, 234, 0.2)'
  )
  const shadowColor = useColorModeValue(
    'rgba(102, 126, 234, 0.1)',
    'rgba(159, 122, 234, 0.1)'
  )
  
  // Dynamic gradient backgrounds
  const activeGradient = useColorModeValue(
    'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    'linear-gradient(135deg, #5b21b6 0%, #7c3aed 50%, #a855f7 100%)'
  )
  
  const completedGradient = useColorModeValue(
    'linear-gradient(135deg, #48bb78 0%, #38a169 50%, #2f855a 100%)',
    'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)'
  )

  const pendingGradient = useColorModeValue(
    'linear-gradient(135deg, #e2e8f0 0%, #cbd5e0 50%, #a0aec0 100%)',
    'linear-gradient(135deg, #4a5568 0%, #2d3748 50%, #1a202c 100%)'
  )

  // Calculate progress percentage
  const progressPercentage = ((currentStep + 1) / steps.length) * 100

  const StepperContent = () => (
    <Stepper 
      index={currentStep} 
      size={variant === 'compact' ? 'sm' : 'md'} 
      colorScheme={colorScheme}
      gap={variant === 'compact' ? 2 : 4}
    >
      {steps.map((step, index) => {
        const isCompleted = index < currentStep
        const isActive = index === currentStep
        const isPending = index > currentStep

        return (
          <Step key={index}>
            <MotionBox
              initial={animated ? { scale: 0.8, opacity: 0 } : undefined}
              animate={animated ? { scale: 1, opacity: 1 } : undefined}
              transition={animated ? { delay: index * 0.1, duration: 0.3 } : undefined}
            >
              <StepIndicator
                bg={
                  isCompleted ? completedGradient :
                  isActive ? activeGradient :
                  pendingGradient
                }
                border="2px solid"
                borderColor={
                  isCompleted ? 'green.300' :
                  isActive ? `${colorScheme}.300` :
                  'gray.300'
                }
                boxShadow={
                  isActive ? `0 0 20px rgba(102, 126, 234, 0.4)` :
                  isCompleted ? `0 0 15px rgba(72, 187, 120, 0.3)` :
                  '0 2px 8px rgba(0, 0, 0, 0.1)'
                }
                animation={isActive && animated ? `${pulse} 2s ease-in-out infinite` : undefined}
                position="relative"
                overflow="hidden"
                _before={isActive ? {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                  animation: `${shimmer} 2s ease-in-out infinite`
                } : undefined}
              >
                <StepStatus
                  complete={
                    <MotionBox
                      initial={animated ? { scale: 0 } : undefined}
                      animate={animated ? { scale: 1 } : undefined}
                      transition={animated ? { duration: 0.3 } : undefined}
                    >
                      <Icon as={CheckIcon} color="white" w={4} h={4} />
                    </MotionBox>
                  }
                  incomplete={
                    <StepNumber 
                      color={isPending ? 'gray.500' : 'white'}
                      fontWeight="bold"
                      fontSize="sm"
                    />
                  }
                  active={
                    <MotionBox
                      animate={animated ? { rotate: 360 } : undefined}
                      transition={animated ? { duration: 0.5 } : undefined}
                    >
                      <StepNumber 
                        color="white"
                        fontWeight="bold"
                        fontSize="sm"
                      />
                    </MotionBox>
                  }
                />
              </StepIndicator>
            </MotionBox>

            {variant !== 'compact' && (
              <Box flexShrink="0" ml={3}>
                <MotionBox
                  initial={animated ? { x: -10, opacity: 0 } : undefined}
                  animate={animated ? { x: 0, opacity: 1 } : undefined}
                  transition={animated ? { delay: index * 0.1 + 0.2, duration: 0.3 } : undefined}
                >
                  <StepTitle 
                    fontSize={variant === 'detailed' ? 'md' : 'sm'} 
                    fontWeight="bold"
                    color={
                      isCompleted ? 'green.600' :
                      isActive ? `${colorScheme}.600` :
                      'gray.500'
                    }
                    bgGradient={isActive ? activeGradient : undefined}
                    bgClip={isActive ? 'text' : undefined}
                  >
                    {step.title}
                  </StepTitle>
                  {variant === 'detailed' && step.description && (
                    <StepDescription 
                      fontSize="sm" 
                      color="gray.600"
                      mt={1}
                    >
                      {step.description}
                    </StepDescription>
                  )}
                </MotionBox>
              </Box>
            )}

            <StepSeparator 
              bg={index < currentStep ? completedGradient : 'gray.200'}
              height="2px"
              position="relative"
              overflow="hidden"
              _after={index === currentStep - 1 ? {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: `linear-gradient(90deg, ${completedGradient}, transparent)`,
                animation: animated ? `${gradientMove} 2s ease-in-out infinite` : undefined
              } : undefined}
            />
          </Step>
        )
      })}
    </Stepper>
  )

  return (
    <MotionCard
      initial={animated ? { y: 20, opacity: 0 } : undefined}
      animate={animated ? { y: 0, opacity: 1 } : undefined}
      transition={animated ? { duration: 0.5 } : undefined}
      bg={cardBg}
      backdropFilter="blur(20px)"
      border="1px solid"
      borderColor={borderColor}
      shadow={`0 8px 32px ${shadowColor}, 0 4px 16px rgba(0, 0, 0, 0.05)`}
      borderRadius="2xl"
      overflow="hidden"
      position="relative"
      mb={6}
      animation={animated ? `${glow} 4s ease-in-out infinite` : undefined}
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '1px',
        background: useColorModeValue(
          'linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.5), transparent)',
          'linear-gradient(90deg, transparent, rgba(159, 122, 234, 0.5), transparent)'
        )
      }}
    >
      <CardBody p={variant === 'compact' ? 3 : 4} pt={variant === 'compact' ? 2 : 3}>
        <VStack spacing={4} align="stretch">
          {showProgress && (
            <MotionBox
              initial={animated ? { scaleX: 0 } : undefined}
              animate={animated ? { scaleX: 1 } : undefined}
              transition={animated ? { duration: 1, delay: 0.3 } : undefined}
            >
              <Flex justify="space-between" align="center" mb={2}>
                <Text fontSize="sm" fontWeight="medium" color="gray.600">
                  Progress
                </Text>
                <Text fontSize="sm" fontWeight="bold" color={`${colorScheme}.600`}>
                  {Math.round(progressPercentage)}%
                </Text>
              </Flex>
              <Box
                h="3px"
                bg="gray.200"
                borderRadius="full"
                overflow="hidden"
                position="relative"
              >
                <MotionBox
                  h="full"
                  bg={activeGradient}
                  borderRadius="full"
                  initial={animated ? { width: 0 } : { width: `${progressPercentage}%` }}
                  animate={animated ? { width: `${progressPercentage}%` } : undefined}
                  transition={animated ? { duration: 1, delay: 0.5 } : undefined}
                  position="relative"
                  _after={{
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                    animation: animated ? `${shimmer} 2s ease-in-out infinite` : undefined
                  }}
                />
              </Box>
            </MotionBox>
          )}
          
          <StepperContent />
        </VStack>
      </CardBody>
    </MotionCard>
  )
} 