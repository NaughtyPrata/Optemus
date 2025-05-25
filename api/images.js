// Simplified images API - no complex metadata file system
// This will help us determine if we need an external database

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    // Handle adding new image metadata
    try {
      console.log('POST request to add image metadata');
      const { imageData } = req.body;
      
      if (!imageData) {
        return res.status(400).json({ success: false, error: 'Image data required' });
      }

      console.log(`Received ${Array.isArray(imageData) ? imageData.length : 1} image(s) to add`);
      console.log('Image data:', JSON.stringify(imageData, null, 2));
      
      // For now, just log that we received the data
      // In a real implementation, this would save to a database
      
      return res.json({
        success: true,
        message: `Received ${Array.isArray(imageData) ? imageData.length : 1} image(s) - logged for debugging`,
        received: true
      });
    } catch (error) {
      console.error('Error processing image metadata:', error);
      return res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to process image metadata' 
      });
    }
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    console.log('GET request - returning test data to verify the flow works');
    
    // Return empty for now, but with detailed logging
    console.log('Images API called successfully - serverless functions are working');
    
    res.json({
      success: true,
      images: [],
      count: 0,
      message: 'Images API is working! The issue is that Vercel Blob storage requires authentication to list files. We need an external database solution.',
      debug: {
        timestamp: new Date().toISOString(),
        serverlessWorking: true,
        blobStorageIssue: 'Cannot list files without authentication',
        recommendation: 'Use external database (Supabase, PlanetScale, etc.)'
      }
    });
    
  } catch (error) {
    console.error('Error in images API:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch images' 
    });
  }
} 