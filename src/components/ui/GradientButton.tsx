import { Button, ButtonProps } from '@chakra-ui/react'
import { forwardRef } from 'react'

interface GradientButtonProps extends Omit<ButtonProps, 'colorScheme'> {
  variant?: 'primary' | 'secondary' | 'tertiary'
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export const GradientButton = forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ variant = 'primary', size = 'md', children, ...props }, ref) => {
    const getVariantStyles = () => {
      switch (variant) {
        case 'primary':
          return {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            _hover: {
              background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
              transform: 'translateY(-1px)',
              boxShadow: '0 10px 25px -5px rgba(102, 126, 234, 0.4)',
            },
            _active: {
              background: 'linear-gradient(135deg, #4c5bc9 0%, #5e377e 100%)',
              transform: 'translateY(0)',
              boxShadow: '0 5px 15px -3px rgba(102, 126, 234, 0.4)',
            },
            _focus: {
              boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.2)',
            },
            transition: 'all 0.2s ease-in-out',
          }
        case 'secondary':
          return {
            background: 'transparent',
            color: 'purple.600',
            border: '2px solid',
            borderColor: 'purple.200',
            _hover: {
              borderColor: 'purple.400',
              color: 'purple.700',
              transform: 'translateY(-1px)',
              boxShadow: '0 8px 20px -4px rgba(139, 92, 246, 0.2)',
            },
            _active: {
              borderColor: 'purple.500',
              color: 'purple.800',
              transform: 'translateY(0)',
              boxShadow: '0 4px 12px -2px rgba(139, 92, 246, 0.2)',
            },
            _focus: {
              boxShadow: '0 0 0 3px rgba(139, 92, 246, 0.1)',
            },
            transition: 'all 0.2s ease-in-out',
          }
        case 'tertiary':
          return {
            background: 'gray.50',
            color: 'gray.700',
            border: '1px solid',
            borderColor: 'gray.200',
            _hover: {
              background: 'gray.100',
              borderColor: 'gray.300',
              color: 'gray.800',
              transform: 'translateY(-1px)',
              boxShadow: '0 6px 16px -4px rgba(0, 0, 0, 0.1)',
            },
            _active: {
              background: 'gray.200',
              borderColor: 'gray.400',
              transform: 'translateY(0)',
              boxShadow: '0 3px 10px -2px rgba(0, 0, 0, 0.1)',
            },
            _focus: {
              boxShadow: '0 0 0 3px rgba(0, 0, 0, 0.05)',
            },
            transition: 'all 0.2s ease-in-out',
          }
        default:
          return {}
      }
    }

    const getSizeStyles = () => {
      switch (size) {
        case 'sm':
          return {
            fontSize: 'sm',
            px: 4,
            py: 2,
            h: 8,
            fontWeight: '600',
          }
        case 'md':
          return {
            fontSize: 'md',
            px: 6,
            py: 3,
            h: 10,
            fontWeight: '600',
          }
        case 'lg':
          return {
            fontSize: 'lg',
            px: 8,
            py: 4,
            h: 12,
            fontWeight: '700',
          }
        case 'xl':
          return {
            fontSize: 'xl',
            px: 10,
            py: 5,
            h: 14,
            fontWeight: '700',
          }
        default:
          return {}
      }
    }

    return (
      <Button
        ref={ref}
        borderRadius="xl"
        {...getSizeStyles()}
        {...getVariantStyles()}
        {...props}
      >
        {children}
      </Button>
    )
  }
)

GradientButton.displayName = 'GradientButton' 