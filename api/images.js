import { put, head, list } from '@vercel/blob';

// Simple file-based storage using Vercel Blob for metadata
const METADATA_FILE = 'image-metadata.json';

async function getImageMetadata() {
  try {
    console.log('Attempting to fetch image metadata...');
    
    // Try to list all blobs to see what's available (for debugging)
    try {
      const { blobs } = await list();
      console.log(`Found ${blobs.length} blobs in storage:`, blobs.map(b => b.pathname));
      
      // Look for our metadata file
      const metadataBlob = blobs.find(blob => blob.pathname === METADATA_FILE);
      if (metadataBlob) {
        console.log('Found metadata file:', metadataBlob.url);
        const response = await fetch(metadataBlob.url);
        if (response.ok) {
          const metadata = await response.json();
          console.log(`Successfully loaded ${metadata.length} images from metadata`);
          return Array.isArray(metadata) ? metadata : [];
        } else {
          console.log('Failed to fetch metadata file:', response.status);
        }
      } else {
        console.log('No metadata file found in blob storage');
      }
    } catch (listError) {
      console.log('Could not list blobs (might need authentication):', listError.message);
      
      // Fallback: try direct URL access
      const directUrl = `https://${process.env.BLOB_READ_WRITE_TOKEN?.split('_')[1]}.blob.vercel-storage.com/${METADATA_FILE}`;
      console.log('Trying direct URL access...');
      
      const response = await fetch(directUrl);
      if (response.ok) {
        const metadata = await response.json();
        console.log(`Successfully loaded ${metadata.length} images from direct URL`);
        return Array.isArray(metadata) ? metadata : [];
      } else {
        console.log('Direct URL access failed:', response.status);
      }
    }
  } catch (error) {
    console.log('Error fetching metadata:', error.message);
  }
  
  console.log('Returning empty array - no metadata found');
  return [];
}

async function saveImageMetadata(images) {
  try {
    console.log(`Saving metadata for ${images.length} images...`);
    const jsonData = JSON.stringify(images, null, 2);
    
    const blob = await put(METADATA_FILE, jsonData, {
      access: 'public',
      contentType: 'application/json'
    });
    
    console.log('Image metadata saved successfully to:', blob.url);
    return blob.url;
  } catch (error) {
    console.error('Failed to save image metadata:', error);
    throw error;
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
      console.log('POST request to add image metadata');
      const { imageData } = req.body;
      
      if (!imageData) {
        return res.status(400).json({ success: false, error: 'Image data required' });
      }

      console.log(`Received ${Array.isArray(imageData) ? imageData.length : 1} image(s) to add`);

      // Get existing metadata
      const existingImages = await getImageMetadata();
      console.log(`Found ${existingImages.length} existing images`);
      
      // Add new image(s)
      const newImages = Array.isArray(imageData) ? imageData : [imageData];
      const updatedImages = [...existingImages, ...newImages];
      
      // Keep only the last 100 images
      const limitedImages = updatedImages.slice(-100);
      
      // Save updated metadata
      const savedUrl = await saveImageMetadata(limitedImages);
      
      console.log(`Successfully saved ${limitedImages.length} total images`);
      
      return res.json({
        success: true,
        message: `Added ${newImages.length} image(s) to metadata`,
        count: limitedImages.length,
        metadataUrl: savedUrl
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
    console.log('GET request - fetching stored image metadata');
    
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