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
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'No OpenAI API key configured'
      });
    }

    console.log('Testing OpenAI connection...');
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 30000, // 30 seconds
      maxRetries: 1,
    });

    // Test 1: List models
    console.log('Fetching models...');
    const models = await openai.models.list();
    
    // Test 2: Check for gpt-image-1 model
    const gptImageModel = models.data.find(m => m.id === 'gpt-image-1');
    
    // Test 3: Try a simple completion call to verify API connectivity
    console.log('Testing chat completion...');
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Hello" }],
      max_tokens: 5
    });

    res.json({
      success: true,
      tests: {
        modelsApi: {
          success: true,
          count: models.data.length,
          hasGptImage1: !!gptImageModel
        },
        chatCompletion: {
          success: true,
          response: completion.choices[0]?.message?.content || 'No response'
        }
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
        region: process.env.VERCEL_REGION
      }
    });
  } catch (error) {
    console.error('OpenAI test error:', {
      message: error.message,
      status: error.status,
      code: error.code,
      type: error.type
    });

    res.status(500).json({
      success: false,
      error: error.message,
      details: {
        status: error.status,
        code: error.code,
        type: error.type
      }
    });
  }
}