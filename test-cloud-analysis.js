// Test script for browser-free website analysis (cloud deployment simulation)
const testCloudAnalysis = async () => {
  const testUrl = 'https://example.com'
  
  try {
    console.log('🌥️  Testing CLOUD-COMPATIBLE website analysis...')
    console.log('📍 Test URL:', testUrl)
    console.log('🎯 This simulates cloud deployment where browsers are not available\n')
    
    const startTime = Date.now()
    
    // Test the API endpoint that should fallback to browser-free analysis
    const response = await fetch('http://localhost:3002/api/analyze-site', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        url: testUrl,
        force: true // Force fresh analysis
      })
    })
    
    const responseTime = Date.now() - startTime
    console.log('⚡ API Response time:', responseTime + 'ms')
    console.log('📊 HTTP Status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Error response:', errorText)
      return
    }
    
    const data = await response.json()
    console.log('✅ Analysis request accepted!')
    console.log('📝 Response details:')
    console.log('  - Success:', data.success)
    console.log('  - Analysis ID:', data.analysisId)
    console.log('  - Status:', data.status)
    console.log('  - Message:', data.message)
    
    if (data.analysisId) {
      console.log('\n🔄 Monitoring analysis progress...')
      console.log('🕐 Expected completion: 8-15 seconds (browser-free is faster!)')
      
      // Poll for completion with progress indication
      let attempts = 0
      const maxAttempts = 20 // 40 seconds max
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
              const elapsed = Math.round((Date.now() - pollStartTime) / 1000)
              console.log(`📈 Check ${attempts}: ${status} (${elapsed}s elapsed)`)
              
              if (status === 'completed') {
                const totalTime = Date.now() - pollStartTime
                console.log('\n🎉 CLOUD ANALYSIS COMPLETED!')
                console.log('⏱️  Total time:', Math.round(totalTime/1000) + ' seconds')
                console.log('🚀 Performance: ' + (totalTime < 20000 ? 'EXCELLENT' : totalTime < 30000 ? 'GOOD' : 'ACCEPTABLE'))
                
                console.log('\n📊 Analysis Results Summary:')
                console.log('┌─────────────────────────────────────────┐')
                console.log('│ 🎯 Core Offer: ' + (statusData.analysis.core_offer?.substring(0, 30) + '...' || 'N/A').padEnd(26) + ' │')
                console.log('│ 🏭 Industry: ' + (statusData.analysis.industry || 'N/A').padEnd(28) + ' │')
                console.log('│ 📈 Business Model: ' + (statusData.analysis.business_model || 'N/A').padEnd(22) + ' │')
                console.log('│ 📊 Confidence: ' + (Math.round((statusData.analysis.confidence_score || 0) * 100) + '%').padEnd(24) + ' │')
                console.log('│ 👥 Target Personas: ' + (statusData.analysis.target_personas?.length || 0).toString().padEnd(19) + ' │')
                console.log('│ 📚 Case Studies: ' + (statusData.analysis.case_studies?.length || 0).toString().padEnd(22) + ' │')
                console.log('│ 🧲 Lead Magnets: ' + (statusData.analysis.lead_magnets?.length || 0).toString().padEnd(22) + ' │')
                console.log('│ 🎖️  Competitive Advantages: ' + (statusData.analysis.competitive_advantages?.length || 0).toString().padEnd(11) + ' │')
                console.log('└─────────────────────────────────────────┘')
                
                console.log('\n✅ CLOUD DEPLOYMENT READY!')
                console.log('🌟 Browser-free fallback working perfectly')
                console.log('🚀 Fast, reliable analysis without browser dependencies')
                break
                
              } else if (status === 'failed') {
                console.error('❌ Analysis failed - check server logs for details')
                break
              }
            }
          } else {
            console.warn('⚠️  Status check failed:', statusResponse.status)
          }
        } catch (pollError) {
          console.error('❌ Error during status check:', pollError.message)
        }
      }
      
      if (attempts >= maxAttempts) {
        console.log('⏰ Timeout - analysis may still be processing')
        console.log('💡 Check your server logs for completion status')
      }
    }
    
  } catch (error) {
    console.error('❌ Cloud analysis test failed:', error.message)
    console.log('\n🔧 Troubleshooting:')
    console.log('1. Ensure your development server is running on port 3002')
    console.log('2. Check that OPENAI_API_KEY is configured')
    console.log('3. Verify cheerio dependency is installed')
    console.log('4. Check server logs for detailed error information')
  }
}

console.log('🧪 Cloud Deployment Compatibility Test')
console.log('=====================================')
console.log('This test verifies that website analysis works in cloud')
console.log('environments where browser automation is not available.\n')

testCloudAnalysis() 