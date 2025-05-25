import { OpenAI } from 'openai';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Check if API key exists
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ 
        success: false, 
        error: 'OpenAI API key not configured' 
      });
    }

    console.log('API Key exists:', !!process.env.OPENAI_API_KEY);
    console.log('API Key length:', process.env.OPENAI_API_KEY?.length);
    console.log('API Key starts with:', process.env.OPENAI_API_KEY?.substring(0, 10));

    // Initialize OpenAI client with additional config for serverless
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 60000, // 60 second timeout
      maxRetries: 2,
    });

    console.log('OpenAI client initialized');

    // Try a simple model list call first
    try {
      console.log('Testing models list...');
      const models = await openai.models.list();
      console.log('Models list successful, count:', models.data?.length);
    } catch (modelsError) {
      console.error('Models list error:', modelsError);
      return res.status(500).json({ 
        success: false, 
        error: 'OpenAI API connection failed',
        details: modelsError.message,
        type: 'models_error'
      });
    }

    // Try image generation with dall-e-3 first
    console.log('Testing image generation with dall-e-3...');
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: "A simple red circle",
      size: "1024x1024",
      quality: "standard",
      n: 1
    });

    console.log('Image generation successful');
    console.log('Response:', JSON.stringify(response, null, 2));

    res.json({
      success: true,
      message: 'OpenAI API test successful',
      hasImages: response.data?.length > 0,
      imageCount: response.data?.length || 0
    });

  } catch (error) {
    console.error('Test error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Test failed',
      errorName: error.name,
      errorType: typeof error,
      details: error.toString()
    });
  }
}
