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
    console.log('Images API called - returning empty list for now');
    
    // For now, return an empty list since we can't access Vercel Blob list without authentication
    // In a real implementation, you would store image metadata in a database
    // or use a different approach to track generated images
    
    const images = [];
    
    console.log(`Returning ${images.length} images to viewer`);
    
    res.json({
      success: true,
      images: images,
      count: images.length,
      message: 'Viewer page is working! Generate some images first, then they will appear here.'
    });
    
  } catch (error) {
    console.error('Error in images API:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch images' 
    });
  }
} 