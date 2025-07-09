import { extendTheme } from '@chakra-ui/react'

export const theme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
  colors: {
    primary: {
      50: '#e6f3ff',
      100: '#b3d9ff', 
      200: '#80bfff',
      300: '#4da6ff',
      400: '#1a8cff',
      500: '#0073e6',
      600: '#005bb3',
      700: '#004280',
      800: '#002a4d',
      900: '#00111a',
    },
  },
  styles: {
    global: {
      body: {
        bg: 'gray.50',
        color: 'gray.900',
      },
    },
  },
  fonts: {
    heading: 'Inter, system-ui, sans-serif',
    body: 'Inter, system-ui, sans-serif',
  },
  components: {
    Alert: {
      variants: {
        'custom-toast': {
          container: {
            backdropFilter: 'blur(12px)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), 0 4px 16px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            color: 'white',
            fontWeight: '500',
            fontSize: 'sm',
            transform: 'translateY(0)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            animation: 'slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '@keyframes slideInRight': {
              '0%': {
                transform: 'translateX(100%) scale(0.9)',
                opacity: 0,
              },
              '100%': {
                transform: 'translateX(0) scale(1)',
                opacity: 1,
              },
            },
            '&:hover': {
              transform: 'translateY(-2px) scale(1.02)',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15), 0 6px 20px rgba(0, 0, 0, 0.1)',
            }
          }
        }
      }
    }
  }
}) 

// Custom toast configurations with consistent styling
export const toastConfig = {
  success: {
    containerStyle: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #6366f1 100%)',
      backdropFilter: 'blur(12px)',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3), 0 4px 16px rgba(118, 75, 162, 0.2)',
      color: 'white',
      fontWeight: '500',
      overflow: 'hidden',
      position: 'relative' as const,
    },
    variant: 'solid' as const,
    duration: 4000,
    isClosable: true,
    position: 'top-right' as const,
  },
  error: {
    containerStyle: {
      background: 'linear-gradient(135deg, #f56565 0%, #e53e3e 50%, #c53030 100%)',
      backdropFilter: 'blur(12px)',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 8px 32px rgba(245, 101, 101, 0.3), 0 4px 16px rgba(229, 62, 62, 0.2)',
      color: 'white',
      fontWeight: '500',
      overflow: 'hidden',
      position: 'relative' as const,
    },
    variant: 'solid' as const,
    duration: 5000,
    isClosable: true,
    position: 'top-right' as const,
  },
  warning: {
    containerStyle: {
      background: 'linear-gradient(135deg, #ed8936 0%, #dd6b20 50%, #c05621 100%)',
      backdropFilter: 'blur(12px)',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 8px 32px rgba(237, 137, 54, 0.3), 0 4px 16px rgba(221, 107, 32, 0.2)',
      color: 'white',
      fontWeight: '500',
      overflow: 'hidden',
      position: 'relative' as const,
    },
    variant: 'solid' as const,
    duration: 4000,
    isClosable: true,
    position: 'top-right' as const,
  },
  info: {
    containerStyle: {
      background: 'linear-gradient(135deg, #4299e1 0%, #3182ce 50%, #2b77cb 100%)',
      backdropFilter: 'blur(12px)',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 8px 32px rgba(66, 153, 225, 0.3), 0 4px 16px rgba(49, 130, 206, 0.2)',
      color: 'white',
      fontWeight: '500',
      overflow: 'hidden',
      position: 'relative' as const,
    },
    variant: 'solid' as const,
    duration: 4000,
    isClosable: true,
    position: 'top-right' as const,
  }
} 