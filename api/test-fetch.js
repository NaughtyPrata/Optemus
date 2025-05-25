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

    console.log('Testing OpenAI with fetch...');
    
    // Test using fetch directly instead of the OpenAI client
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Check for gpt-image-1 model
    const gptImageModel = data.data?.find(m => m.id === 'gpt-image-1');
    
    console.log('Fetch test successful');

    res.json({
      success: true,
      method: 'fetch',
      tests: {
        modelsApi: {
          success: true,
          count: data.data?.length || 0,
          hasGptImage1: !!gptImageModel,
          gptImageModel: gptImageModel || null
        }
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
        region: process.env.VERCEL_REGION
      }
    });
  } catch (error) {
    console.error('OpenAI fetch test error:', {
      message: error.message,
      stack: error.stack?.substring(0, 200)
    });

    res.status(500).json({
      success: false,
      method: 'fetch',
      error: error.message,
      details: {
        name: error.name,
        cause: error.cause?.message || null
      }
    });
  }
}