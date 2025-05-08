import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import fs from 'fs';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 4001; // Changed port to 4001 since 4000 is in use

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// API endpoint to generate an image
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, size, quality } = req.body;
    
    console.log('Generating image with prompt:', prompt);
    
    // Convert quality values to match OpenAI's API requirements
    let apiQuality = "high";
    if (quality === "medium") {
      apiQuality = "medium";
    } else if (quality === "low") {
      apiQuality = "low";
    } else if (quality === "auto") {
      apiQuality = "auto";
    }
    
    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: size || "1024x1024",
      quality: apiQuality
    });
    
    console.log('Generation successful');
    
    // Check if response contains b64_json
    if (result.data && result.data[0] && result.data[0].b64_json) {
      // Ensure the images directory exists
      if (!fs.existsSync(join(__dirname, 'public', 'images'))) {
        fs.mkdirSync(join(__dirname, 'public', 'images'), { recursive: true });
      }
      
      // Save the image to disk
      const timestamp = Date.now();
      const filename = `image_${timestamp}.png`;
      const filePath = join(__dirname, 'public', 'images', filename);
      
      // Save base64 image to file
      const imageBuffer = Buffer.from(result.data[0].b64_json, 'base64');
      fs.writeFileSync(filePath, imageBuffer);
      
      // Return both the base64 data and local file path
      res.json({
        success: true,
        image: `data:image/png;base64,${result.data[0].b64_json}`,
        localImage: `/images/${filename}`,
        filename
      });
    }
    // Check if response contains URL
    else if (result.data && result.data[0] && result.data[0].url) {
      // Ensure the images directory exists
      if (!fs.existsSync(join(__dirname, 'public', 'images'))) {
        fs.mkdirSync(join(__dirname, 'public', 'images'), { recursive: true });
      }
      
      // Return the URL directly
      res.json({
        success: true,
        image: result.data[0].url,
        filename: 'direct_url_image'
      });
    } 
    else {
      throw new Error('No image data in the OpenAI response');
    }
  } catch (error) {
    console.error('Error generating image:', error);
    
    // Check if it's a safety system rejection error
    let errorMessage = error.message;
    if (errorMessage && errorMessage.includes('Your request was rejected as a result of our safety system')) {
      errorMessage = "Lol Nice try!";
    }
    
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('API Key is configured and ready to use');
});