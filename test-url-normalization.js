// Test the URL normalization functionality
// This demonstrates all the different input formats that are now supported

const testCases = [
  // Basic domain additions
  { input: 'google.com', expected: 'https://google.com' },
  { input: 'www.google.com', expected: 'https://www.google.com' },
  { input: 'example.org', expected: 'https://example.org' },
  { input: 'stripe.com/pricing', expected: 'https://stripe.com/pricing' },
  
  // Protocol handling
  { input: 'https://google.com', expected: 'https://google.com' },
  { input: 'http://google.com', expected: 'https://google.com' }, // HTTP -> HTTPS upgrade
  { input: 'HTTPS://GOOGLE.COM', expected: 'https://google.com' }, // Case normalization
  
  // Local development (should stay HTTP)
  { input: 'localhost:3000', expected: 'http://localhost:3000' },
  { input: 'localhost', expected: 'http://localhost' },
  { input: '127.0.0.1:8080', expected: 'http://127.0.0.1:8080' },
  { input: '192.168.1.1', expected: 'http://192.168.1.1' },
  
  // Single word domains (add .com)
  { input: 'google', expected: 'https://google.com' },
  { input: 'facebook', expected: 'https://facebook.com' },
  { input: 'amazon', expected: 'https://amazon.com' },
  
  // Trailing slash handling
  { input: 'google.com/', expected: 'https://google.com' },
  { input: 'google.com//', expected: 'https://google.com' },
  { input: 'google.com/path/', expected: 'https://google.com/path' },
  
  // Complex paths
  { input: 'github.com/user/repo', expected: 'https://github.com/user/repo' },
  { input: 'docs.stripe.com/api/charges', expected: 'https://docs.stripe.com/api/charges' },
];

const errorCases = [
  // Should throw helpful errors
  { input: '', error: 'URL cannot be empty' },
  { input: '   ', error: 'URL cannot be empty' },
  { input: 'hello world', error: 'URL cannot contain spaces' },
  { input: 'www', error: 'Incomplete URL' },
  { input: 'not a url at all', error: 'URL cannot contain spaces' },
];

// Import the normalization function
function normalizeAndValidateUrl(input) {
  if (!input || typeof input !== 'string') {
    throw new Error('URL is required and must be a string');
  }

  // Clean up the input
  let url = input.trim();
  
  if (url.length === 0) {
    throw new Error('URL cannot be empty');
  }

  // Remove trailing slashes for consistency
  url = url.replace(/\/+$/, '');

  try {
    // Case 1: Already has protocol
    if (url.match(/^https?:\/\//i)) {
      const parsedUrl = new URL(url);
      
      // Upgrade HTTP to HTTPS for security (with some exceptions)
      if (parsedUrl.protocol === 'http:') {
        // Allow HTTP for localhost and IP addresses for development
        const isLocalhost = parsedUrl.hostname === 'localhost' || 
                           parsedUrl.hostname === '127.0.0.1' ||
                           parsedUrl.hostname.startsWith('192.168.') ||
                           parsedUrl.hostname.startsWith('10.') ||
                           parsedUrl.hostname.match(/^172\.(1[6-9]|2\d|3[01])\./);
        
        if (!isLocalhost) {
          console.log(`Upgrading HTTP to HTTPS for: ${url}`);
          parsedUrl.protocol = 'https:';
        }
      }
      
      return parsedUrl.toString().replace(/\/$/, ''); // Remove trailing slash
    }

    // Case 2: No protocol - add HTTPS
    // Handle common patterns like www.example.com, example.com, etc.
    
    // Check if it looks like a valid domain
    const domainPattern = /^([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/.*)?$/;
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}(:\d+)?(\/.*)?$/;
    const localhostPattern = /^localhost(:\d+)?(\/.*)?$/;
    
    if (domainPattern.test(url) || ipPattern.test(url) || localhostPattern.test(url)) {
      // For localhost and IP addresses, prefer HTTP for development
      if (url.startsWith('localhost') || url.startsWith('127.0.0.1') || 
          url.match(/^192\.168\./) || url.match(/^10\./) || 
          url.match(/^172\.(1[6-9]|2\d|3[01])\./)) {
        const testUrl = `http://${url}`;
        console.log(`Using HTTP for local development: ${testUrl}`);
        return new URL(testUrl).toString().replace(/\/$/, '');
      } else {
        // For all other domains, use HTTPS
        const testUrl = `https://${url}`;
        console.log(`Adding HTTPS protocol to: ${url} -> ${testUrl}`);
        return new URL(testUrl).toString().replace(/\/$/, '');
      }
    }

    // Case 3: Might be a subdirectory or malformed URL
    // Try to fix common issues
    
    // Remove leading slashes or dots
    url = url.replace(/^[.\/]+/, '');
    
    // If it still doesn't look like a domain, try to help
    if (!domainPattern.test(url) && !ipPattern.test(url) && !localhostPattern.test(url)) {
      // Check if it might be missing TLD
      if (url.includes('.') && !url.includes(' ')) {
        // Try adding .com if it looks like a domain without TLD
        const parts = url.split('.');
        if (parts.length === 2 && parts[0].length > 0 && parts[1].length > 0) {
          // Looks like domain.something but not a valid TLD, might be intentional
          const testUrl = `https://${url}`;
          console.log(`Attempting to use as-is with HTTPS: ${testUrl}`);
          return new URL(testUrl).toString().replace(/\/$/, '');
        }
      }
      
      // If no dots at all, might be a single word - try adding .com
      if (!url.includes('.') && url.match(/^[a-zA-Z0-9-]+$/)) {
        const suggestedUrl = `https://${url}.com`;
        console.log(`Single word domain detected, trying: ${suggestedUrl}`);
        return new URL(suggestedUrl).toString().replace(/\/$/, '');
      }
      
      throw new Error(`Invalid URL format: "${input}". Please provide a valid domain like "example.com" or "https://example.com"`);
    }
    
    // Final attempt - add HTTPS
    const finalUrl = `https://${url}`;
    return new URL(finalUrl).toString().replace(/\/$/, '');
    
  } catch (error) {
    // Provide helpful error messages for common mistakes
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes(' ')) {
      throw new Error(`URL cannot contain spaces: "${input}". Did you mean "${input.replace(/\s+/g, '')}"?`);
    }
    
    if (lowerInput.startsWith('www') && !lowerInput.includes('.')) {
      throw new Error(`Incomplete URL: "${input}". Did you mean "www.${input.slice(3)}.com"?`);
    }
    
    if (!lowerInput.includes('.') && lowerInput.length > 0) {
      throw new Error(`URL must include a domain: "${input}". Did you mean "${input}.com"?`);
    }
    
    throw new Error(`Invalid URL: "${input}". Please provide a valid URL like "example.com" or "https://example.com"`);
  }
}

async function runTests() {
  console.log('🧪 Testing URL Normalization Function\n');
  console.log('=' .repeat(60));
  
  let passed = 0;
  let failed = 0;
  
  // Test successful cases
  console.log('\n✅ SUCCESS CASES:');
  console.log('-'.repeat(40));
  
  for (const testCase of testCases) {
    try {
      const result = normalizeAndValidateUrl(testCase.input);
      if (result === testCase.expected) {
        console.log(`✓ "${testCase.input}" -> "${result}"`);
        passed++;
      } else {
        console.log(`✗ "${testCase.input}" -> "${result}" (expected: "${testCase.expected}")`);
        failed++;
      }
    } catch (error) {
      console.log(`✗ "${testCase.input}" -> ERROR: ${error.message}`);
      failed++;
    }
  }
  
  // Test error cases
  console.log('\n❌ ERROR CASES (Should throw errors):');
  console.log('-'.repeat(40));
  
  for (const errorCase of errorCases) {
    try {
      const result = normalizeAndValidateUrl(errorCase.input);
      console.log(`✗ "${errorCase.input}" -> "${result}" (should have thrown error)`);
      failed++;
    } catch (error) {
      if (error.message.includes(errorCase.error)) {
        console.log(`✓ "${errorCase.input}" -> ERROR: ${error.message}`);
        passed++;
      } else {
        console.log(`✗ "${errorCase.input}" -> ERROR: ${error.message} (expected error containing: "${errorCase.error}")`);
        failed++;
      }
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed! URL normalization is working correctly.');
  } else {
    console.log('❌ Some tests failed. Please check the implementation.');
  }
}

// Run the tests
runTests().catch(console.error); 