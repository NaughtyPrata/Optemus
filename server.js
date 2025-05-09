import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';

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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure the images directory exists
const imagesDir = path.join(__dirname, 'public/images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
  console.log(`Created images directory at ${imagesDir}`);
}

// Endpoint to save image (original endpoint)
app.post('/save-image', (req, res) => {
  const { imageData, imageName } = req.body;
  const imagePath = path.join(__dirname, 'public/images', imageName);

  // Decode base64 image data and save to file
  const base64Data = imageData.replace(/^data:image\/png;base64,/, "");
  fs.writeFile(imagePath, base64Data, 'base64', (err) => {
    if (err) {
      return res.status(500).send('Error saving image');
    }
    res.send('Image saved successfully');
  });
});

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
      
      console.log(`Image ${i+1} generated successfully${imageUrl ? ': ' + imageUrl.substring(0, 50) + '...' : ''}`);
      
      // Generate a random filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `generated_${timestamp}_${randomUUID().substring(0, 8)}_${i+1}.png`;
      const filePath = path.join(imagesDir, filename);
      
      // If we have a URL, download the image so it's available for direct download
      if (imageUrl && imageUrl.startsWith('http')) {
        try {
          console.log(`Downloading image ${i+1} from URL to make it available locally: ${imageUrl.substring(0, 50)}...`);
          await downloadImage(imageUrl, filePath);
          console.log(`Image ${i+1} saved locally at: ${filePath}`);
        } catch (downloadError) {
          console.warn(`Warning: Could not download image ${i+1} from URL:`, downloadError.message);
          // Continue anyway, as we still have the URL to display the image
        }
      }
      // If we have base64 data, save it to disk
      else if (imageUrl && imageUrl.startsWith('data:image')) {
        try {
          console.log(`Saving base64 image ${i+1} data to file...`);
          const data = imageUrl.replace(/^data:image\/\w+;base64,/, '');
          fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
          console.log(`Image ${i+1} saved locally at: ${filePath}`);
        } catch (saveError) {
          console.warn(`Warning: Could not save base64 image ${i+1} data:`, saveError.message);
        }
      }
      
      // Create metadata file with image details
      const metadataPath = path.join(imagesDir, `${path.basename(filename, '.png')}.json`);
      const metadata = {
        prompt: prompt, // Store the original prompt without the variations
        timestamp: new Date().toISOString(),
        settings: {
          size: size || "1024x1024",
          quality: quality || "medium",
          styleType: styleType || "standard",
          stylePreset: stylePreset || "default"
        },
        filename
      };
      
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
      console.log(`Metadata saved at: ${metadataPath}`);
      
      generatedImages.push({
        image: imageUrl,
        filename: filename
      });
    }

    // Return success with all generated images
    res.json({
      success: true,
      images: generatedImages,
      count: generatedImages.length
      // Don't include raw responses as they could be very large with multiple images
    });
  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to generate image' 
    });
  }
});

// Save image from URL or base64 data to file system
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
    const imagePath = path.join(imagesDir, filename);

    console.log(`Saving image to: ${imagePath}`);

    if (base64Data) {
      // Save from base64 data
      const data = base64Data.replace(/^data:image\/\w+;base64,/, '');
      fs.writeFileSync(imagePath, Buffer.from(data, 'base64'));
    } else if (imageUrl) {
      // Save from URL
      await downloadImage(imageUrl, imagePath);
    }

    // Create a metadata file with image details
    const metadataPath = path.join(imagesDir, `${path.basename(filename, '.png')}.json`);
    const metadata = {
      prompt,
      timestamp: new Date().toISOString(),
      settings,
      filename
    };
    
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    res.json({
      success: true,
      image: {
        filename,
        path: `/images/${filename}`,
        fullPath: imagePath
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
      timestamp: new Date().toISOString()
    };
    res.json({ success: true, debug: debugInfo });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint to download generated images
app.get('/api/download/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(imagesDir, filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return res.status(404).send('File not found');
    }
    
    console.log(`Downloading file: ${filePath}`);
    
    // Set content disposition header for download
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Set appropriate content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    if (ext === '.png') {
      res.setHeader('Content-Type', 'image/png');
    } else if (ext === '.jpg' || ext === '.jpeg') {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (ext === '.svg') {
      res.setHeader('Content-Type', 'image/svg+xml');
    } else {
      res.setHeader('Content-Type', 'application/octet-stream');
    }
    
    // Stream the file to the response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).send('Error downloading file');
  }
});

// Endpoint to list all images in the gallery
app.get('/api/images', (req, res) => {
  try {
    const rescan = req.query.rescan === 'true';
    console.log(`Getting images with rescan=${rescan}`);
    
    // Get all files in the images directory
    const files = fs.readdirSync(imagesDir);
    
    // Filter for image files
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.svg';
    });
    
    // Create array of image metadata
    const images = imageFiles.map(filename => {
      // Check if there's a corresponding JSON metadata file
      const baseName = path.basename(filename, path.extname(filename));
      const metadataPath = path.join(imagesDir, `${baseName}.json`);
      
      // Default image data
      let imageData = {
        id: baseName,
        filename,
        localPath: `/images/${filename}`,
        url: `/images/${filename}`,
        createdAt: new Date().toISOString(),
        prompt: 'No prompt available',
        settings: {}
      };
      
      // If metadata file exists, read it
      if (fs.existsSync(metadataPath)) {
        try {
          const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
          imageData = {
            ...imageData,
            prompt: metadata.prompt || imageData.prompt,
            createdAt: metadata.timestamp || imageData.createdAt,
            settings: metadata.settings || {}
          };
          console.log(`Found metadata for ${filename}: prompt="${imageData.prompt.substring(0, 50)}..."`);
        } catch (err) {
          console.warn(`Error reading metadata for ${filename}:`, err.message);
        }
      } else {
        // See if we can extract any prompt info from the filename
        // Many generated image filenames start with a part of the prompt
        if (filename.includes('_')) {
          const possiblePrompt = filename.split('_')[0].replace(/-/g, ' ');
          if (possiblePrompt && possiblePrompt.length > 5) {
            imageData.prompt = possiblePrompt;
            console.log(`Extracted prompt from filename: "${possiblePrompt}"`);
          }
        }
      }
      
      return imageData;
    });
    
    console.log(`Found ${images.length} images`);
    
    // Sort images by creation date, newest first
    images.sort((a, b) => {
      // Parse dates safely with error handling
      let dateA, dateB;
      try {
        dateA = new Date(a.createdAt);
        if (isNaN(dateA.getTime())) {
          // If invalid date, extract from filename if possible
          const timestampMatch = a.filename.match(/_(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/);
          if (timestampMatch && timestampMatch[1]) {
            const cleanTimestamp = timestampMatch[1].replace(/-/g, (i, idx) => idx <= 10 ? '-' : ':');
            dateA = new Date(cleanTimestamp);
          }
        }
      } catch (e) {
        console.warn(`Invalid date format for ${a.filename}: ${a.createdAt}`);
        dateA = new Date(0); // Default to epoch time if parsing fails
      }
      
      try {
        dateB = new Date(b.createdAt);
        if (isNaN(dateB.getTime())) {
          // If invalid date, extract from filename if possible
          const timestampMatch = b.filename.match(/_(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/);
          if (timestampMatch && timestampMatch[1]) {
            const cleanTimestamp = timestampMatch[1].replace(/-/g, (i, idx) => idx <= 10 ? '-' : ':');
            dateB = new Date(cleanTimestamp);
          }
        }
      } catch (e) {
        console.warn(`Invalid date format for ${b.filename}: ${b.createdAt}`);
        dateB = new Date(0); // Default to epoch time if parsing fails
      }
      
      // Fall back to filesystem stats if dates are still invalid
      if (isNaN(dateA.getTime())) {
        try {
          const statsA = fs.statSync(path.join(imagesDir, a.filename));
          dateA = statsA.mtime;
        } catch (e) {
          dateA = new Date(0);
        }
      }
      
      if (isNaN(dateB.getTime())) {
        try {
          const statsB = fs.statSync(path.join(imagesDir, b.filename));
          dateB = statsB.mtime;
        } catch (e) {
          dateB = new Date(0);
        }
      }
      
      return dateB.getTime() - dateA.getTime(); // Sort descending (newest first)
    });
    
    res.json({
      success: true,
      images: images
    });
  } catch (error) {
    console.error('Error getting images:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint to delete an image
app.delete('/api/images/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // Look for image and metadata files
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.svg'];
    let imageDeleted = false;
    
    // Try each possible extension
    for (const ext of imageExtensions) {
      const filePath = path.join(imagesDir, `${id}${ext}`);
      if (fs.existsSync(filePath)) {
        // Delete the image file
        fs.unlinkSync(filePath);
        imageDeleted = true;
        console.log(`Deleted image: ${filePath}`);
      }
    }
    
    // Delete metadata file if it exists
    const metadataPath = path.join(imagesDir, `${id}.json`);
    if (fs.existsSync(metadataPath)) {
      fs.unlinkSync(metadataPath);
      console.log(`Deleted metadata: ${metadataPath}`);
    }
    
    if (!imageDeleted) {
      return res.status(404).json({
        success: false,
        error: 'Image not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

app.listen(4001, () => {
  console.log('Server running on http://localhost:4001');
});

// Helper function to download image from URL
async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }

      const file = fs.createWriteStream(filepath);
      response.pipe(file);

      file.on('finish', () => {
        file.close();
        resolve(filepath);
      });

      file.on('error', (err) => {
        fs.unlink(filepath, () => {});
        reject(err);
      });
    }).on('error', reject);
  });
}