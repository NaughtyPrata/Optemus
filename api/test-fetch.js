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

    console.log('Testing direct fetch to OpenAI API...');

    // Try direct fetch to OpenAI API
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt: "A simple red circle",
        size: "1024x1024",
        quality: "medium",
        n: 1
      })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      return res.status(500).json({ 
        success: false, 
        error: `OpenAI API error: ${response.status}`,
        details: errorText,
        type: 'api_error'
      });
    }

    const data = await response.json();
    console.log('Success! Got response:', JSON.stringify(data));

    res.json({
      success: true,
      message: 'Direct fetch to OpenAI API successful',
      hasImages: data.data?.length > 0,
      imageCount: data.data?.length || 0,
      imageUrl: data.data?.[0]?.url || null
    });

  } catch (error) {
    console.error('Fetch error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Direct fetch failed',
      errorName: error.name,
      errorType: typeof error,
      details: error.toString()
    });
  }
}
