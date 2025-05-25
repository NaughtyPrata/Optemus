import { put, head } from '@vercel/blob';

// Simple file-based storage using Vercel Blob for metadata
const METADATA_FILE = 'image-metadata.json';

async function getImageMetadata() {
  try {
    // Try to get the metadata file from Vercel Blob
    const response = await fetch(`https://blob.vercel-storage.com/${METADATA_FILE}`);
    if (response.ok) {
      const metadata = await response.json();
      return Array.isArray(metadata) ? metadata : [];
    }
  } catch (error) {
    console.log('No existing metadata file found, starting fresh');
  }
  return [];
}

async function saveImageMetadata(images) {
  try {
    const jsonData = JSON.stringify(images, null, 2);
    await put(METADATA_FILE, jsonData, {
      access: 'public',
      contentType: 'application/json'
    });
    console.log('Image metadata saved successfully');
  } catch (error) {
    console.error('Failed to save image metadata:', error);
  }
}

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
      const { imageData } = req.body;
      if (!imageData) {
        return res.status(400).json({ success: false, error: 'Image data required' });
      }

      // Get existing metadata
      const existingImages = await getImageMetadata();
      
      // Add new image(s)
      const newImages = Array.isArray(imageData) ? imageData : [imageData];
      const updatedImages = [...existingImages, ...newImages];
      
      // Keep only the last 100 images
      const limitedImages = updatedImages.slice(-100);
      
      // Save updated metadata
      await saveImageMetadata(limitedImages);
      
      return res.json({
        success: true,
        message: `Added ${newImages.length} image(s) to metadata`,
        count: limitedImages.length
      });
    } catch (error) {
      console.error('Error adding image metadata:', error);
      return res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to add image metadata' 
      });
    }
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    console.log('Images API called - fetching stored image metadata');
    
    // Get images from metadata file
    const images = await getImageMetadata();
    
    // Sort images by creation date (newest first)
    images.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.timestamp || 0);
      const dateB = new Date(b.createdAt || b.timestamp || 0);
      return dateB - dateA;
    });
    
    console.log(`Returning ${images.length} images to viewer`);
    
    const message = images.length === 0 
      ? 'Viewer page is working! Generate some images first, then they will appear here.'
      : `Found ${images.length} generated image${images.length === 1 ? '' : 's'}`;
    
    res.json({
      success: true,
      images: images,
      count: images.length,
      message: message
    });
    
  } catch (error) {
    console.error('Error in images API:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch images' 
    });
  }
} 