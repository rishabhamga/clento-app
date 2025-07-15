// Test script to verify provider switching functionality
// Run: node test-provider-switching.js

const { spawn } = require('child_process')
const path = require('path')

// Test cases for provider switching
const testCases = [
  {
    name: 'Test Apollo Provider',
    env: { DATA_PROVIDER: 'apollo', APOLLO_API_KEY: 'test_key' },
    expectedProvider: 'apollo'
  },
  {
    name: 'Test Explorium Provider',
    env: { DATA_PROVIDER: 'explorium', EXPLORIUM_API_KEY: 'test_key' },
    expectedProvider: 'explorium'
  },
  {
    name: 'Test Invalid Provider (should default to Apollo)',
    env: { DATA_PROVIDER: 'invalid_provider' },
    expectedProvider: 'apollo'
  },
  {
    name: 'Test No Provider Set (should default to Apollo)',
    env: {},
    expectedProvider: 'apollo'
  }
]

// Simple test runner
async function runTest(testCase) {
  console.log(`\n🧪 Running: ${testCase.name}`)
  
  return new Promise((resolve, reject) => {
    // Create a test script that imports the provider manager
    const testScript = `
      const { getDataProviderManager } = require('./src/lib/data-providers/provider-manager.ts');
      
      try {
        const manager = getDataProviderManager();
        const currentProvider = manager.getCurrentProvider();
        const config = manager.getProviderInfo();
        
        console.log('Provider:', currentProvider);
        console.log('Config:', JSON.stringify(config, null, 2));
        
        // Output result for parsing
        console.log('TEST_RESULT:', currentProvider);
      } catch (error) {
        console.error('Error:', error.message);
        console.log('TEST_ERROR:', error.message);
      }
    `
    
    // Write the test script
    require('fs').writeFileSync('temp-test.js', testScript)
    
    // Run the test with specific environment
    const env = { ...process.env, ...testCase.env }
    const child = spawn('node', ['temp-test.js'], { env, stdio: 'pipe' })
    
    let output = ''
    let error = ''
    
    child.stdout.on('data', (data) => {
      output += data.toString()
    })
    
    child.stderr.on('data', (data) => {
      error += data.toString()
    })
    
    child.on('close', (code) => {
      // Clean up temp file
      require('fs').unlinkSync('temp-test.js')
      
      if (code === 0) {
        // Parse the result
        const resultMatch = output.match(/TEST_RESULT: (.+)/)
        if (resultMatch) {
          const actualProvider = resultMatch[1].trim()
          if (actualProvider === testCase.expectedProvider) {
            console.log('✅ PASS: Provider is', actualProvider)
            resolve({ passed: true, provider: actualProvider })
          } else {
            console.log('❌ FAIL: Expected', testCase.expectedProvider, 'but got', actualProvider)
            resolve({ passed: false, expected: testCase.expectedProvider, actual: actualProvider })
          }
        } else {
          console.log('❌ FAIL: Could not parse result')
          console.log('Output:', output)
          console.log('Error:', error)
          resolve({ passed: false, error: 'Could not parse result' })
        }
      } else {
        console.log('❌ FAIL: Process exited with code', code)
        console.log('Error:', error)
        resolve({ passed: false, error: `Process exited with code ${code}` })
      }
    })
  })
}

async function runAllTests() {
  console.log('🚀 Starting Provider Switching Tests')
  console.log('=====================================')
  
  const results = []
  
  for (const testCase of testCases) {
    const result = await runTest(testCase)
    results.push({ ...testCase, result })
  }
  
  console.log('\n📊 Test Results Summary')
  console.log('========================')
  
  let passed = 0
  let failed = 0
  
  results.forEach(({ name, result }) => {
    if (result.passed) {
      console.log(`✅ ${name}`)
      passed++
    } else {
      console.log(`❌ ${name}`)
      failed++
    }
  })
  
  console.log(`\n📈 Overall Results: ${passed} passed, ${failed} failed`)
  
  if (failed === 0) {
    console.log('🎉 All tests passed! Provider switching is working correctly.')
  } else {
    console.log('⚠️  Some tests failed. Please check the implementation.')
  }
}

// Run the tests
runAllTests().catch(console.error) 