// Simple test script to verify Unipile API configuration
require('dotenv').config({ path: '.env.local' });

console.log('Environment Variables:');
console.log('UNIPILE_API_URL:', process.env.UNIPILE_API_URL);
console.log('UNIPILE_API_KEY:', process.env.UNIPILE_API_KEY ? 'Set (length: ' + process.env.UNIPILE_API_KEY.length + ')' : 'Not set');
console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);

// Test if we can make a basic request to Unipile
async function testUnipileConnection() {
  if (!process.env.UNIPILE_API_KEY || !process.env.UNIPILE_API_URL) {
    console.error('❌ Unipile API credentials not configured');
    return;
  }

  try {
    console.log('\nTesting Unipile API connection...');
    const response = await fetch(`${process.env.UNIPILE_API_URL}/api/v1/accounts`, {
      headers: {
        'X-API-KEY': process.env.UNIPILE_API_KEY
      }
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      console.log('✅ Unipile API connection successful');
      const data = await response.json();
      console.log('Response data:', data);
    } else {
      console.log('❌ Unipile API connection failed');
      const errorText = await response.text();
      console.log('Error:', errorText);
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testUnipileConnection();
