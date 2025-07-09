import { createCustomToast } from './custom-toast'

// This is a demo of the new toast system capabilities
export const demoToastShowcase = (toast: any) => {
  const customToast = createCustomToast(toast)

  // Demo function to show different toast types
  const showToastTypes = () => {
    // Success toast with glassmorphism effect
    setTimeout(() => {
      customToast.success({
        title: 'Success!',
        description: 'Your action completed successfully with beautiful animations',
        duration: 4000,
      })
    }, 500)

    // Warning toast with gradient styling
    setTimeout(() => {
      customToast.warning({
        title: 'Heads up!',
        description: 'This is a stylish warning notification with smooth effects',
        duration: 4000,
      })
    }, 1500)

    // Error toast with enhanced styling
    setTimeout(() => {
      customToast.error({
        title: 'Oops!',
        description: 'Error notifications now match your app theme perfectly',
        duration: 4000,
      })
    }, 2500)

    // Info toast with theme consistency
    setTimeout(() => {
      customToast.info({
        title: 'Just so you know',
        description: 'Info toasts now have consistent styling across the app',
        duration: 4000,
      })
    }, 3500)
  }

  return { showToastTypes }
} 