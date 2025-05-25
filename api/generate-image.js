import { put } from '@vercel/blob';
import https from 'https';
import { randomUUID } from 'crypto';

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

// Helper function to call OpenAI API directly with fetch
async function generateImageWithFetch(prompt, size, quality) {
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt: prompt,
      size: size || "1024x1024",
      quality: quality || "medium",
      n: 1
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`);
  }

  return await response.json();
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { prompt, size, quality, styleType, stylePreset, count = 1 } = req.body;
    
    // Validate count (only allow 1, 2, or 4)
    const imageCount = [1, 2, 4].includes(Number(count)) ? Number(count) : 1;

    if (!prompt) {
      return res.status(400).json({ success: false, error: 'Prompt is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ success: false, error: 'OpenAI API key not configured' });
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

    // Request images from OpenAI using direct fetch calls
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
      
      // Generate the image with the varied prompt using fetch
      const response = await generateImageWithFetch(currentPrompt, size, quality);
      
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
      
      // Create image record for viewer
      const imageRecord = {
        id: randomUUID(),
        prompt: prompt,
        url: blobUrl,
        localPath: blobUrl,
        filename: filename,
        createdAt: new Date().toISOString(),
        settings: {
          size: size || "1024x1024",
          quality: quality || "medium",
          styleType: styleType || "standard",
          stylePreset: stylePreset || "default"
        }
      };
      
      generatedImages.push({
        image: blobUrl,
        filename: filename,
        metadata: metadata
      });
    }

    // Save metadata to the images API for the viewer
    if (generatedImages.length > 0) {
      try {
        const imageRecords = [];
        for (let i = 0; i < generatedImages.length; i++) {
          const imageRecord = {
            id: randomUUID(),
            prompt: prompt,
            url: generatedImages[i].image,
            localPath: generatedImages[i].image,
            filename: generatedImages[i].filename,
            createdAt: new Date().toISOString(),
            settings: {
              size: size || "1024x1024",
              quality: quality || "medium",
              styleType: styleType || "standard",
              stylePreset: stylePreset || "default"
            }
          };
          imageRecords.push(imageRecord);
        }
        
        console.log(`Created ${imageRecords.length} image records for Notion:`, JSON.stringify(imageRecords, null, 2));
        
        // Save metadata via the images API
        // Determine the correct base URL for the API call
        let baseUrl;
        if (req.headers.host) {
          // If we have a host header, use it (works for both local and deployed)
          const protocol = req.headers.host.includes('localhost') ? 'http' : 'https';
          baseUrl = `${protocol}://${req.headers.host}`;
        } else {
          // Fallback for local development
          baseUrl = 'http://localhost:3000';
        }
        console.log(`Attempting to save metadata to: ${baseUrl}/api/images`);
        const metadataResponse = await fetch(`${baseUrl}/api/images`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imageData: imageRecords })
        });
        
        if (metadataResponse.ok) {
          const responseData = await metadataResponse.json();
          console.log(`Successfully saved metadata for ${imageRecords.length} images:`, responseData);
        } else {
          const errorText = await metadataResponse.text();
          console.error(`Failed to save image metadata (${metadataResponse.status}):`, errorText);
        }
      } catch (metadataError) {
        console.warn('Error saving image metadata:', metadataError.message);
        // Don't fail the whole request if metadata saving fails
      }
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
}