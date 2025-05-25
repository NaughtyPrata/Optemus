export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        openAIKeyLength: process.env.OPENAI_API_KEY?.length || 0,
        openAIKeyPreview: process.env.OPENAI_API_KEY ? 
          process.env.OPENAI_API_KEY.substring(0, 20) + '...' : 'Not found'
      },
      vercel: {
        region: process.env.VERCEL_REGION,
        deployment: process.env.VERCEL_DEPLOYMENT,
        url: process.env.VERCEL_URL
      }
    };

    // Test OpenAI connection
    if (process.env.OPENAI_API_KEY) {
      try {
        const { OpenAI } = await import('openai');
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
        
        // Try to make a simple API call
        const models = await openai.models.list();
        diagnostics.openai = {
          connected: true,
          modelsCount: models.data?.length || 0,
          hasGptImage1: models.data?.some(m => m.id === 'gpt-image-1') || false
        };
      } catch (openaiError) {
        diagnostics.openai = {
          connected: false,
          error: openaiError.message
        };
      }
    } else {
      diagnostics.openai = {
        connected: false,
        error: 'No API key provided'
      };
    }

    res.json({
      success: true,
      diagnostics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      diagnostics: {
        timestamp: new Date().toISOString(),
        hasOpenAIKey: !!process.env.OPENAI_API_KEY
      }
    });
  }
}