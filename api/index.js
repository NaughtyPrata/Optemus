import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';
import { put } from '@vercel/blob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();

// Middleware to parse JSON and form data
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Generate image using OpenAI API with GPT-4o (gpt-image-1)
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, size, quality, styleType, stylePreset, count = 1 } = req.body;
    
    // Validate count (only allow 1, 2, or 4)
    const imageCount = [1, 2, 4].includes(Number(count)) ? Number(count) : 1;

    if (!prompt) {
      return res.status(400).json({ success: false, error: 'Prompt is required' });
    }

    console.log(`Generating ${imageCount} images with prompt: ${prompt}`);
    console.log(`Settings: size=${size}, quality=${quality}, styleType=${styleType}, stylePreset=${stylePreset}`);

    // Enhanced prompt based on style settings
    let enhancedPrompt = prompt;
    
    // Add style modifiers based on settings
    if (styleType === 'dark') {
      enhancedPrompt += " Use darker colors, shadows, and dramatic lighting.";
    } else if (styleType === 'light') {
      enhancedPrompt += " Use lighter colors, soft lighting, and a cheerful atmosphere.";
    }
    
    if (stylePreset === 'internal') {
      enhancedPrompt += " Use a corporate style, professional and clean.";
    } else if (stylePreset === 'proposals') {
      enhancedPrompt += " Make it bold, attention-grabbing, and visually striking.";
    }

    // Request image from OpenAI using GPT-4o's image generation (gpt-image-1)
    const generatedResponses = [];
    
    // For multiple images, we'll create variations on the prompt to encourage diversity
    for (let i = 0; i < imageCount; i++) {
      let currentPrompt = enhancedPrompt;
      
      // Add variation instructions based on the image index
      if (imageCount > 1) {
        if (i === 0) {
          currentPrompt += " Make this version unique with its own distinctive style and perspective.";
        } else if (i === 1) {
          currentPrompt += " Create a completely different interpretation from the first version, with contrasting elements and viewpoint.";
        } else if (i === 2) {
          currentPrompt += " Create a third unique version with different lighting, angle, and artistic approach from the previous versions.";
        } else if (i === 3) {
          currentPrompt += " Create a fourth distinct version that explores a different aspect of the concept, with its own unique composition and elements.";
        }
      }
      
      console.log(`Generating image ${i+1}/${imageCount} with prompt: ${currentPrompt.substring(0, 100)}...`);
      
      // Generate the image with the varied prompt
      const response = await openai.images.generate({
        model: "gpt-image-1",
        prompt: currentPrompt,
        size: size || "1024x1024",
        quality: quality || "medium", // gpt-image-1 supports 'low', 'medium', 'high', and 'auto'
        n: 1
      });
      
      if (response.data && response.data.length > 0) {
        generatedResponses.push(response.data[0]);
      }
    }
    
    // Check if we got any images back
    if (generatedResponses.length === 0) {
      throw new Error('No image data received from OpenAI');
    }
    
    console.log(`Successfully generated ${generatedResponses.length} images`);
    
    // Process each image in the responses
    const generatedImages = [];
    
    for (let i = 0; i < generatedResponses.length; i++) {
      let imageUrl = '';
      const imageData = generatedResponses[i];
      
      // Check different possible response formats and extract the image URL
      if (imageData.url) {
        imageUrl = imageData.url;
      } else if (imageData.b64_json) {
        imageUrl = `data:image/png;base64,${imageData.b64_json}`;
      }
      
      if (!imageUrl) {
        console.warn(`No URL or base64 data found for image ${i+1}`);
        continue;
      }
      
      console.log(`Image ${i+1} generated successfully`);
      
      // Generate a filename for Vercel Blob storage
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `generated_${timestamp}_${randomUUID().substring(0, 8)}_${i+1}.png`;
      
      let blobUrl = imageUrl; // Default to original URL
      
      // If we have a URL, download and store in Vercel Blob
      if (imageUrl && imageUrl.startsWith('http')) {
        try {
          console.log(`Storing image ${i+1} in Vercel Blob storage...`);
          const imageBuffer = await downloadImageToBuffer(imageUrl);
          
          const blob = await put(filename, imageBuffer, {
            access: 'public',
            contentType: 'image/png'
          });
          
          blobUrl = blob.url;
          console.log(`Image ${i+1} stored in Vercel Blob: ${blobUrl}`);
        } catch (blobError) {
          console.warn(`Warning: Could not store image ${i+1} in Vercel Blob:`, blobError.message);
          // Continue with original URL
        }
      }
      
      // Create metadata for the image
      const metadata = {
        prompt: prompt, // Store the original prompt without the variations
        timestamp: new Date().toISOString(),
        settings: {
          size: size || "1024x1024",
          quality: quality || "medium",
          styleType: styleType || "standard",
          stylePreset: stylePreset || "default"
        },
        filename,
        blobUrl
      };
      
      generatedImages.push({
        image: blobUrl,
        filename: filename,
        metadata: metadata
      });
    }

    // Return success with all generated images
    res.json({
      success: true,
      images: generatedImages,
      count: generatedImages.length
    });
  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to generate image' 
    });
  }
});

// Save image from URL or base64 data to Vercel Blob storage
app.post('/api/save-image', async (req, res) => {
  try {
    const { prompt, base64Data, imageUrl, settings } = req.body;
    
    if (!base64Data && !imageUrl) {
      return res.status(400).json({ 
        success: false, 
        error: 'Image data or URL is required' 
      });
    }

    // Generate filename with timestamp and a portion of the prompt
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const promptSlug = prompt ? prompt.substring(0, 20).replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'untitled';
    const filename = `${promptSlug}_${timestamp}.png`;

    console.log(`Saving image to Vercel Blob: ${filename}`);

    let imageBuffer;
    
    if (base64Data) {
      // Convert base64 to buffer
      const data = base64Data.replace(/^data:image\/\w+;base64,/, '');
      imageBuffer = Buffer.from(data, 'base64');
    } else if (imageUrl) {
      // Download from URL to buffer
      imageBuffer = await downloadImageToBuffer(imageUrl);
    }

    // Store in Vercel Blob
    const blob = await put(filename, imageBuffer, {
      access: 'public',
      contentType: 'image/png'
    });

    // Create metadata
    const metadata = {
      prompt,
      timestamp: new Date().toISOString(),
      settings,
      filename,
      blobUrl: blob.url
    };

    res.json({
      success: true,
      image: {
        filename,
        url: blob.url,
        blobUrl: blob.url,
        metadata
      }
    });
  } catch (error) {
    console.error('Error saving image:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to save image' 
    });
  }
});

// Debug endpoint to help diagnose image data issues
app.post('/api/debug-image-data', (req, res) => {
  try {
    const data = req.body;
    const debugInfo = {
      receivedKeys: Object.keys(data),
      hasBase64: !!data.base64Data,
      hasUrl: !!data.imageUrl,
      base64Length: data.base64Data ? data.base64Data.length : 0,
      base64Preview: data.base64Data ? data.base64Data.substring(0, 50) + '...' : null,
      urlPreview: data.imageUrl ? data.imageUrl.substring(0, 50) + '...' : null,
      timestamp: new Date().toISOString(),
      environment: {
        vercel: !!process.env.VERCEL,
        blobToken: !!process.env.BLOB_READ_WRITE_TOKEN
      }
    };
    res.json({ success: true, debug: debugInfo });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Simplified endpoint for image gallery (since we're using Vercel Blob now)
app.get('/api/images', (req, res) => {
  try {
    // For now, return empty array since we're not persisting gallery data
    // In a full implementation, you'd store image metadata in a database
    res.json({
      success: true,
      images: [],
      message: "Gallery feature requires database integration for Vercel deployment"
    });
  } catch (error) {
    console.error('Error getting images:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint to delete an image (simplified for Vercel Blob)
app.delete('/api/images/:id', (req, res) => {
  try {
    // For now, return success but note that full deletion requires database
    res.json({
      success: true,
      message: 'Image deletion requires database integration for full implementation'
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Optemus API is running on Vercel!',
    timestamp: new Date().toISOString(),
    environment: {
      vercel: !!process.env.VERCEL,
      openaiConfigured: !!process.env.OPENAI_API_KEY,
      blobConfigured: !!process.env.BLOB_READ_WRITE_TOKEN
    }
  });
});

// Helper function to download image from URL to buffer
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
    }).on('error', reject);
  });
}

// Export the Express app for Vercel
export default app;
