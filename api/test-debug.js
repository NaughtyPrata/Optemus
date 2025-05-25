import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('API Key present:', !!process.env.OPENAI_API_KEY);
    console.log('API Key starts with:', process.env.OPENAI_API_KEY?.substring(0, 10));
    
    // Test with dall-e-3 model instead
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: "A simple red apple on white background",
      size: "1024x1024",
      quality: "standard",
      n: 1
    });
    
    console.log('OpenAI Response:', response);
    
    res.json({
      success: true,
      message: 'OpenAI connection working',
      hasImage: !!response.data[0]?.url,
      imageUrl: response.data[0]?.url
    });
    
  } catch (error) {
    console.error('Debug Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      code: error.code,
      type: error.type
    });
  }
}
