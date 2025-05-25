import fs from 'fs/promises';
import path from 'path';
import { put } from '@vercel/blob';
import https from 'https';
import { randomUUID } from 'crypto';

// File store configuration
const IMAGES_DIR = './public/generated-images';
const METADATA_FILE = './data/images-metadata.json';

// Ensure directories exist
async function ensureDirectories() {
  try {
    await fs.mkdir(IMAGES_DIR, { recursive: true });
    await fs.mkdir('./data', { recursive: true });
  } catch (error) {
    console.log('Directories already exist or created');
  }
}

// Download image to buffer
async function downloadImageToBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }
      
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    });
  });
}

// Load existing metadata
async function loadMetadata() {
  try {
    const data = await fs.readFile(METADATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { images: [] };
  }
}

// Save metadata
async function saveMetadata(metadata) {
  try {
    await fs.writeFile(METADATA_FILE, JSON.stringify(metadata, null, 2));
    return true;
  } catch (error) {
    console.error('Failed to save metadata:', error);
    return false;
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
    try {
      console.log('POST request to file store');
      const { imageData } = req.body;
      
      if (!imageData) {
        return res.status(400).json({ success: false, error: 'Image data required' });
      }

      await ensureDirectories();
      
      const images = Array.isArray(imageData) ? imageData : [imageData];
      const savedImages = [];
      
      for (const image of images) {
        try {
          const imageId = image.id || randomUUID();
          const filename = `${imageId}.png`;
          const localPath = path.join(IMAGES_DIR, filename);
          
          let finalUrl = image.url || image.blobUrl;
          let localSaved = false;
          let blobSaved = false;
          
          // Download and save image
          if (image.url && image.url.startsWith('http')) {
            const imageBuffer = await downloadImageToBuffer(image.url);
            
            // Save locally (for development)
            try {
              await fs.writeFile(localPath, imageBuffer);
              localSaved = true;
              console.log(`Saved image locally: ${localPath}`);
            } catch (localError) {
              console.warn('Failed to save locally:', localError.message);
            }
            
            // Save to Vercel Blob (for production)
            try {
              const blob = await put(filename, imageBuffer, {
                access: 'public',
                contentType: 'image/png'
              });
              finalUrl = blob.url;
              blobSaved = true;
              console.log(`Saved to Vercel Blob: ${blob.url}`);
            } catch (blobError) {
              console.warn('Failed to save to Vercel Blob:', blobError.message);
            }
          }
          
          // Create image metadata
          const imageMetadata = {
            id: imageId,
            prompt: image.prompt,
            url: finalUrl,
            localPath: localSaved ? `/generated-images/${filename}` : null,
            blobUrl: blobSaved ? finalUrl : null,
            filename: filename,
            createdAt: image.timestamp || new Date().toISOString(),
            settings: image.settings || {},
            storage: {
              local: localSaved,
              blob: blobSaved,
              originalUrl: image.url
            }
          };
          
          savedImages.push(imageMetadata);
          
        } catch (imageError) {
          console.error(`Failed to process image:`, imageError);
        }
      }
      
      // Save metadata to JSON file
      const metadata = await loadMetadata();
      metadata.images.push(...savedImages);
      await saveMetadata(metadata);
      
      return res.json({
        success: true,
        message: `Saved ${savedImages.length} image(s) to file store`,
        count: savedImages.length,
        images: savedImages
      });
      
    } catch (error) {
      console.error('Error in file store POST:', error);
      return res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to save to file store' 
      });
    }
  }

  if (req.method === 'GET') {
    try {
      console.log('GET request - fetching images from file store');
      
      const metadata = await loadMetadata();
      const images = metadata.images || [];
      
      // Sort by creation date (newest first)
      images.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      const message = images.length === 0 
        ? 'File store is ready! Generate some images and they will be saved here.'
        : `Found ${images.length} image${images.length === 1 ? '' : 's'} in file store`;
      
      res.json({
        success: true,
        images: images,
        count: images.length,
        message: message,
        source: 'file-store'
      });
      
    } catch (error) {
      console.error('Error fetching from file store:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to fetch from file store' 
      });
    }
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
} 