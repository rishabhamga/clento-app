// Enhanced test script for website analysis API with performance testing
const testWebsiteAnalysis = async () => {
  const testUrl = 'https://example.com'
  
  try {
    console.log('🚀 Testing FAST website analysis API...')
    console.log('Test URL:', testUrl)
    
    const startTime = Date.now()
    
    const response = await fetch('http://localhost:3002/api/analyze-site', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In a real app, you'd need proper authentication
      },
      body: JSON.stringify({ 
        url: testUrl,
        force: true // Force fresh analysis to test performance
      })
    })
    
    const responseTime = Date.now() - startTime
    console.log('⏱️  Response time:', responseTime + 'ms')
    console.log('📊 Response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Error response:', errorText)
      return
    }
    
    const data = await response.json()
    console.log('✅ Analysis started successfully!')
    console.log('📋 Response structure:')
    console.log('- success:', data.success)
    console.log('- analysisId:', data.analysisId)
    console.log('- status:', data.status)
    console.log('- message:', data.message)
    
    if (data.analysisId) {
      console.log('\n🔄 Polling for completion...')
      
      // Poll for completion
      let attempts = 0
      const maxAttempts = 30 // 1 minute max
      const pollStartTime = Date.now()
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000))
        attempts++
        
        try {
          const statusResponse = await fetch(`http://localhost:3002/api/analyze-site?id=${data.analysisId}`)
          
          if (statusResponse.ok) {
            const statusData = await statusResponse.json()
            
            if (statusData.success && statusData.analysis) {
              const status = statusData.analysis.status
              console.log(`📈 Attempt ${attempts}: Status = ${status}`)
              
              if (status === 'completed') {
                const totalTime = Date.now() - pollStartTime
                console.log('\n🎉 ANALYSIS COMPLETED!')
                console.log('⏱️  Total analysis time:', totalTime + 'ms (' + Math.round(totalTime/1000) + 's)')
                console.log('📊 Analysis results:')
                console.log('- Core Offer:', statusData.analysis.core_offer?.substring(0, 100) + '...')
                console.log('- Industry:', statusData.analysis.industry)
                console.log('- Business Model:', statusData.analysis.business_model)
                console.log('- Confidence Score:', statusData.analysis.confidence_score)
                console.log('- Target Personas:', statusData.analysis.target_personas?.length || 0)
                console.log('- Case Studies:', statusData.analysis.case_studies?.length || 0)
                console.log('- Pages Analyzed:', statusData.analysis.pages_analyzed || 'N/A')
                break
              } else if (status === 'failed') {
                console.error('❌ Analysis failed')
                break
              }
            }
          }
        } catch (pollError) {
          console.error('❌ Error during polling:', pollError.message)
        }
      }
      
      if (attempts >= maxAttempts) {
        console.log('⏰ Polling timeout - analysis may still be processing')
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

console.log('🧪 Starting Website Analysis Performance Test')
console.log('==========================================')
testWebsiteAnalysis() 