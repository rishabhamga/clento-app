import { UseToastOptions } from '@chakra-ui/react'
import { toastConfig } from '../theme'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface CustomToastOptions {
  title: string
  description?: string
  duration?: number
  isClosable?: boolean
  onClose?: () => void
}

export const createCustomToast = (toast: any) => {
  const showToast = (type: ToastType, options: CustomToastOptions) => {
    const config = toastConfig[type]
    
    return toast({
      title: options.title,
      description: options.description,
      status: type,
      duration: options.duration || config.duration,
      isClosable: options.isClosable ?? config.isClosable,
      position: config.position,
      variant: config.variant,
      containerStyle: config.containerStyle,
      onCloseComplete: options.onClose,
    } as UseToastOptions)
  }

  return {
    success: (options: CustomToastOptions) => showToast('success', options),
    error: (options: CustomToastOptions) => showToast('error', options),
    warning: (options: CustomToastOptions) => showToast('warning', options),
    info: (options: CustomToastOptions) => showToast('info', options),
  }
}

// Pre-configured common toasts
export const commonToasts = {
  success: {
    saved: {
      title: 'Successfully Saved!',
      description: 'Your changes have been saved successfully.',
    },
    created: {
      title: 'Created Successfully!',
      description: 'Your item has been created successfully.',
    },
    updated: {
      title: 'Updated Successfully!',
      description: 'Your changes have been updated successfully.',
    },
    deleted: {
      title: 'Deleted Successfully!',
      description: 'The item has been deleted successfully.',
    },
    connected: {
      title: 'Connected Successfully!',
      description: 'Your account has been connected successfully.',
    },
    launched: {
      title: 'Campaign Launched!',
      description: 'Your campaign has been successfully launched.',
    },
    completed: {
      title: 'Process Completed!',
      description: 'The operation has been completed successfully.',
    }
  },
  error: {
    generic: {
      title: 'Something went wrong',
      description: 'An unexpected error occurred. Please try again.',
    },
    network: {
      title: 'Network Error',
      description: 'Unable to connect. Please check your internet connection.',
    },
    validation: {
      title: 'Validation Error',
      description: 'Please check your input and try again.',
    },
    unauthorized: {
      title: 'Access Denied',
      description: 'You do not have permission to perform this action.',
    },
    failed: {
      title: 'Operation Failed',
      description: 'The operation could not be completed. Please try again.',
    }
  },
  warning: {
    unsaved: {
      title: 'Unsaved Changes',
      description: 'You have unsaved changes that will be lost.',
    },
    incomplete: {
      title: 'Incomplete Information',
      description: 'Please fill in all required fields.',
    },
    limit: {
      title: 'Limit Reached',
      description: 'You have reached the maximum limit.',
    }
  },
  info: {
    loading: {
      title: 'Processing...',
      description: 'Please wait while we process your request.',
    },
    noResults: {
      title: 'No Results Found',
      description: 'No items match your current criteria.',
    },
    tip: {
      title: 'Pro Tip',
      description: 'Here\'s a helpful tip to improve your experience.',
    }
  }
} 