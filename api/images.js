import { list } from '@vercel/blob';

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
    console.log('Fetching images from Vercel Blob storage...');
    
    // List all blobs from Vercel Blob storage
    const { blobs } = await list();
    
    console.log(`Found ${blobs.length} blobs in storage`);
    
    // Filter for image files and transform to expected format
    const images = blobs
      .filter(blob => {
        const filename = blob.pathname || '';
        const ext = filename.toLowerCase().split('.').pop();
        return ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext);
      })
      .map(blob => {
        // Extract metadata from filename if possible
        const filename = blob.pathname || `image_${Date.now()}.png`;
        const timestamp = blob.uploadedAt || new Date().toISOString();
        
        // Try to extract prompt from filename (if it follows our naming convention)
        let prompt = 'Generated image';
        const match = filename.match(/^generated_(.+?)_\d{4}-\d{2}-\d{2}T/);
        if (match) {
          prompt = match[1].replace(/-/g, ' ');
        }
        
        return {
          id: blob.pathname,
          filename: filename,
          url: blob.url,
          localPath: blob.url, // For compatibility with viewer.js
          image: blob.url,     // For compatibility with main.js
          createdAt: timestamp,
          prompt: prompt,
          settings: {
            size: "1024x1024", // Default values since we don't store this in blob metadata
            quality: "medium",
            styleType: "standard",
            stylePreset: "default"
          },
          metadata: {
            size: blob.size,
            contentType: blob.contentType || 'image/png'
          }
        };
      })
      .sort((a, b) => {
        // Sort by creation date, newest first
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });

    console.log(`Returning ${images.length} images to viewer`);
    
    res.json({
      success: true,
      images: images,
      count: images.length
    });
    
  } catch (error) {
    console.error('Error fetching images from Vercel Blob:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch images' 
    });
  }
} 