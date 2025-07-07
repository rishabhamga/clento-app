require('dotenv').config();
const OpenAI = require('openai');

console.log('🔍 Testing OpenAI Connection...\n');

// Check environment variables
console.log('Environment Variables:');
console.log('- OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 
  `✅ Present (${process.env.OPENAI_API_KEY.length} chars, starts with: ${process.env.OPENAI_API_KEY.substring(0, 10)}...)` : 
  '❌ Missing');

if (!process.env.OPENAI_API_KEY) {
  console.log('\n🚨 OpenAI API Key is missing!');
  console.log('\n📝 To fix this:');
  console.log('1. Create a .env file in your project root');
  console.log('2. Add: OPENAI_API_KEY=your_actual_api_key_here');
  console.log('3. Get your API key from: https://platform.openai.com/api-keys');
  process.exit(1);
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function testOpenAI() {
  try {
    console.log('\n🧪 Testing OpenAI API connection...');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant. Respond with valid JSON only."
        },
        {
          role: "user",
          content: "Please respond with a simple JSON object containing a greeting message."
        }
      ],
      temperature: 0.1,
      max_tokens: 100
    });

    const response = completion.choices[0]?.message?.content;
    console.log('✅ OpenAI API connection successful!');
    console.log('📤 Response:', response);
    
    // Test JSON parsing
    try {
      const parsed = JSON.parse(response);
      console.log('✅ JSON parsing successful!');
      console.log('📊 Parsed response:', parsed);
    } catch (parseError) {
      console.log('⚠️ Response is not valid JSON, but API connection works');
    }
    
  } catch (error) {
    console.error('❌ OpenAI API test failed:');
    console.error('Error:', error.message);
    
    if (error.status === 401) {
      console.log('\n🔐 Authentication failed - check your API key');
    } else if (error.status === 429) {
      console.log('\n⏰ Rate limit exceeded - try again later');
    } else if (error.status === 500) {
      console.log('\n🔧 OpenAI server error - try again later');
    }
    
    console.log('\n🔗 Useful links:');
    console.log('- Get API key: https://platform.openai.com/api-keys');
    console.log('- Check usage: https://platform.openai.com/usage');
    console.log('- API documentation: https://platform.openai.com/docs/api-reference');
  }
}

testOpenAI(); 