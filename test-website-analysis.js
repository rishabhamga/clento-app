// Simple test script for website analysis API
const testWebsiteAnalysis = async () => {
  const testUrl = 'https://example.com'
  
  try {
    console.log('Testing website analysis API...')
    console.log('Test URL:', testUrl)
    
    const response = await fetch('http://localhost:3004/api/analyze-site', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In a real app, you'd need proper authentication
      },
      body: JSON.stringify({ url: testUrl })
    })
    
    console.log('Response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error response:', errorText)
      return
    }
    
    const data = await response.json()
    console.log('Response data structure:')
    console.log('- success:', data.success)
    console.log('- analysis keys:', Object.keys(data.analysis || {}))
    console.log('- suggestions keys:', Object.keys(data.suggestions || {}))
    
    if (data.analysis) {
      console.log('\nAnalysis data:')
      console.log('- summary:', data.analysis.summary ? 'present' : 'missing')
      console.log('- valueProposition:', data.analysis.valueProposition ? 'present' : 'missing')
      console.log('- painPoints:', Array.isArray(data.analysis.painPoints) ? `${data.analysis.painPoints.length} items` : 'missing')
      console.log('- proofPoints:', Array.isArray(data.analysis.proofPoints) ? `${data.analysis.proofPoints.length} items` : 'missing')
      
      if (data.analysis.painPoints && data.analysis.painPoints.length > 0) {
        console.log('\nFirst pain point:', data.analysis.painPoints[0])
      }
      
      if (data.analysis.proofPoints && data.analysis.proofPoints.length > 0) {
        console.log('First proof point:', data.analysis.proofPoints[0])
      }
    }
    
    if (data.suggestions) {
      console.log('\nSuggestions data:')
      console.log('- painPoints:', Array.isArray(data.suggestions.painPoints) ? `${data.suggestions.painPoints.length} items` : 'missing')
      console.log('- proofPoints:', Array.isArray(data.suggestions.proofPoints) ? `${data.suggestions.proofPoints.length} items` : 'missing')
    }
    
  } catch (error) {
    console.error('Test failed:', error.message)
  }
}

// Run the test
testWebsiteAnalysis() 