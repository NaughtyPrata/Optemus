export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    res.json({
      success: true,
      message: 'Optemus API is running on Vercel!',
      timestamp: new Date().toISOString(),
      environment: {
        vercel: !!process.env.VERCEL,
        openaiConfigured: !!process.env.OPENAI_API_KEY,
        blobConfigured: !!process.env.BLOB_READ_WRITE_TOKEN,
        nodeVersion: process.version
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}