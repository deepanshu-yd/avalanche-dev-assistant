// Quick test to verify Gemini integration is working
const axios = require('axios');

async function testGeminiIntegration() {
  try {
    console.log('Testing Gemini integration...');

    const response = await axios.post('http://localhost:3000/ask', {
      question: 'What is Avalanche blockchain?'
    });

    console.log('✅ Request successful!');
    console.log('Provider:', response.data.provider);
    console.log('Answer:', response.data.answer);
    console.log('Tokens used:', response.data.tokensUsed);
    console.log('Number of sources:', response.data.sources?.length || 0);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response?.data) {
      console.error('Error details:', error.response.data);
    }
  }
}

testGeminiIntegration();
