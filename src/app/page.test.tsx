import { render, screen } from '@testing-library/react'
import { ChakraProvider } from '@chakra-ui/react'
import Home from './page'
import { theme } from '@/lib/theme'
import { describe, it, expect, vi } from 'vitest'

// Mock Clerk components
vi.mock('@clerk/nextjs', () => ({
  SignedIn: ({ children }: { children: React.ReactNode }) => <div data-testid="signed-in">{children}</div>,
  SignedOut: ({ children }: { children: React.ReactNode }) => <div data-testid="signed-out">{children}</div>,
  UserButton: () => <div data-testid="user-button">User Button</div>,
}))

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ChakraProvider theme={theme}>
      {component}
    </ChakraProvider>
  )
}

describe('Home', () => {
  it('renders the main heading', () => {
    renderWithProviders(<Home />)
    expect(screen.getByText('AI-Powered Sales Development')).toBeInTheDocument()
  })

  it('renders the observe.ai logo', () => {
    renderWithProviders(<Home />)
    expect(screen.getByText('Observe Agents')).toBeInTheDocument()
  })

  it('renders feature cards', () => {
    renderWithProviders(<Home />)
    expect(screen.getByText('Smart Lead Discovery')).toBeInTheDocument()
    expect(screen.getByText('Personalized Outreach')).toBeInTheDocument()
    expect(screen.getByText('Multi-Channel Sequences')).toBeInTheDocument()
  })

  it('shows sign-up and sign-in buttons for unauthenticated users', () => {
    renderWithProviders(<Home />)
    const signedOutSections = screen.getAllByTestId('signed-out')
    expect(signedOutSections.length).toBeGreaterThan(0)
    
    // Check that sign-up buttons exist
    expect(screen.getByText('Get Started Free')).toBeInTheDocument()
    expect(screen.getByText('Start Free Trial')).toBeInTheDocument()
  })

  it('shows dashboard button for authenticated users', () => {
    renderWithProviders(<Home />)
    const signedInSections = screen.getAllByTestId('signed-in')
    expect(signedInSections.length).toBeGreaterThan(0)
    
    // Check that dashboard buttons exist
    expect(screen.getAllByText('Go to Dashboard')).toHaveLength(2)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })
}) 