// Technology utilities for Apollo integration
export interface TechnologyOption {
  value: string // The UID format (with underscores)
  label: string // The display name
  category: string
}

// Function to convert technology name to Apollo UID format
export function convertToApolloUID(technologyName: string): string {
  return technologyName
    .toLowerCase()
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/\./g, '_') // Replace periods with underscores
    .replace(/[^a-z0-9_]/g, '') // Remove any other special characters
}

// Parse CSV content into technology options
export function parseTechnologiesCSV(csvContent: string): TechnologyOption[] {
  const lines = csvContent.trim().split('\n')
  const technologies: TechnologyOption[] = []
  
  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    const [category, technology] = line.split(',').map(s => s.trim())
    if (category && technology) {
      technologies.push({
        value: convertToApolloUID(technology),
        label: technology,
        category: category
      })
    }
  }
  
  return technologies
}

// Load technologies from the CSV file
export async function loadSupportedTechnologies(): Promise<TechnologyOption[]> {
  try {
    const response = await fetch('/supported_technologies.csv')
    if (!response.ok) {
      throw new Error('Failed to load technologies CSV')
    }
    const csvContent = await response.text()
    return parseTechnologiesCSV(csvContent)
  } catch (error) {
    console.error('Error loading supported technologies:', error)
    // Return a fallback list of common technologies
    return [
      { value: 'salesforce', label: 'Salesforce', category: 'CRM' },
      { value: 'google_analytics', label: 'Google Analytics', category: 'Analytics' },
      { value: 'wordpress_org', label: 'WordPress.org', category: 'CMS' },
      { value: 'hubspot', label: 'HubSpot', category: 'CRM' },
      { value: 'slack', label: 'Slack', category: 'Communication' },
      { value: 'microsoft_office_365', label: 'Microsoft Office 365', category: 'Productivity' },
      { value: 'aws', label: 'AWS', category: 'Cloud' },
      { value: 'azure', label: 'Azure', category: 'Cloud' },
      { value: 'google_cloud', label: 'Google Cloud', category: 'Cloud' }
    ]
  }
}

// Group technologies by category for better UI organization
export function groupTechnologiesByCategory(technologies: TechnologyOption[]): Record<string, TechnologyOption[]> {
  const grouped: Record<string, TechnologyOption[]> = {}
  
  technologies.forEach(tech => {
    if (!grouped[tech.category]) {
      grouped[tech.category] = []
    }
    grouped[tech.category].push(tech)
  })
  
  // Sort technologies within each category
  Object.keys(grouped).forEach(category => {
    grouped[category].sort((a, b) => a.label.localeCompare(b.label))
  })
  
  return grouped
} 