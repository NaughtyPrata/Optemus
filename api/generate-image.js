import { OpenAI } from 'openai';

// Initialize OpenAI with more robust configuration for Vercel
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 60000, // 60 seconds timeout
  maxRetries: 2,
});

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
    // Debug environment
    console.log('Environment check:', {
      hasApiKey: !!process.env.OPENAI_API_KEY,
      apiKeyLength: process.env.OPENAI_API_KEY?.length || 0,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      region: process.env.VERCEL_REGION
    });

    const { prompt, size, quality, styleType, stylePreset, count = 1 } = req.body;
    
    // Validate count (only allow 1, 2, or 4)
    const imageCount = [1, 2, 4].includes(Number(count)) ? Number(count) : 1;

    if (!prompt) {
      return res.status(400).json({ success: false, error: 'Prompt is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('Missing OPENAI_API_KEY environment variable');
      return res.status(500).json({ success: false, error: 'API configuration error' });
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

    // For Vercel's serverless environment, we'll process images sequentially to avoid timeout
    // and generate them one by one to be more reliable
    const generatedImages = [];
    
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
      
      try {
        // Generate the image with the varied prompt
        const response = await openai.images.generate({
          model: "gpt-image-1",
          prompt: currentPrompt,
          size: size || "1024x1024",
          quality: quality || "medium",
          n: 1
        });
        
        if (response.data && response.data.length > 0) {
          const imageData = response.data[0];
          
          // Check different possible response formats and extract the image URL
          let imageUrl = '';
          if (imageData.url) {
            imageUrl = imageData.url;
          } else if (imageData.b64_json) {
            imageUrl = `data:image/png;base64,${imageData.b64_json}`;
          }
          
          if (imageUrl) {
            console.log(`Image ${i+1} generated successfully`);
            
            // Generate a filename
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `generated_${timestamp}_${i+1}.png`;
            
            // Create metadata for the image
            const metadata = {
              prompt: prompt,
              timestamp: new Date().toISOString(),
              settings: {
                size: size || "1024x1024",
                quality: quality || "medium",
                styleType: styleType || "standard",
                stylePreset: stylePreset || "default"
              },
              filename
            };
            
            generatedImages.push({
              image: imageUrl,
              filename: filename,
              metadata: metadata
            });
          } else {
            console.warn(`No URL or base64 data found for image ${i+1}`);
          }
        } else {
          console.warn(`No data received for image ${i+1}`);
        }
      } catch (imageError) {
        console.error(`Error generating image ${i+1}:`, {
          message: imageError.message,
          status: imageError.status,
          code: imageError.code
        });
        
        // If it's the first image and it fails, throw the error
        if (i === 0) {
          throw imageError;
        }
        // Otherwise, continue with remaining images
      }
    }
    
    // Check if we got any images back
    if (generatedImages.length === 0) {
      throw new Error('No images were successfully generated');
    }
    
    console.log(`Successfully generated ${generatedImages.length} images`);

    // Return success with all generated images
    res.json({
      success: true,
      images: generatedImages,
      count: generatedImages.length
    });
  } catch (error) {
    console.error('Error generating image:', {
      message: error.message,
      stack: error.stack?.substring(0, 500),
      name: error.name,
      status: error.status,
      code: error.code,
      type: error.type
    });
    
    // Return more detailed error information based on the error type
    let errorMessage = 'Failed to generate image';
    
    if (error.code === 'insufficient_quota') {
      errorMessage = 'OpenAI API quota exceeded';
    } else if (error.code === 'invalid_api_key') {
      errorMessage = 'Invalid API key';
    } else if (error.status === 429) {
      errorMessage = 'Rate limit exceeded, please try again later';
    } else if (error.status === 400) {
      errorMessage = 'Invalid request parameters';
    } else if (error.status === 401) {
      errorMessage = 'Authentication error';
    } else if (error.message?.includes('network') || error.message?.includes('connect')) {
      errorMessage = 'Network connection error';
    } else if (error.message?.includes('timeout') || error.code === 'TIMEOUT') {
      errorMessage = 'Request timeout - please try again';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(500).json({ 
      success: false, 
      error: errorMessage
    });
  }
}