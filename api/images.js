// Simplified images API - no complex metadata file system
// This will help us determine if we need an external database

import { Client } from '@notionhq/client';

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID?.trim();

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    // Handle adding new image metadata to Notion
    try {
      console.log('POST request to add image metadata to Notion');
      const { imageData } = req.body;
      
      if (!imageData) {
        return res.status(400).json({ success: false, error: 'Image data required' });
      }

      const images = Array.isArray(imageData) ? imageData : [imageData];
      console.log(`Adding ${images.length} image(s) to Notion database`);

      // Add each image to Notion database
      const addedImages = [];
      for (const image of images) {
        try {
          const response = await notion.pages.create({
            parent: {
              database_id: DATABASE_ID,
            },
            properties: {
              'ID': {
                rich_text: [
                  {
                    text: {
                      content: image.id || 'Unknown ID',
                    },
                  },
                ],
              },
              'Prompt': {
                rich_text: [
                  {
                    text: {
                      content: image.prompt || 'No prompt provided',
                    },
                  },
                ],
              },
              'Image URL': {
                url: image.url || image.localPath || '',
              },
              'Filename': {
                rich_text: [
                  {
                    text: {
                      content: image.filename || 'unknown.png',
                    },
                  },
                ],
              },
              'Created At': {
                date: {
                  start: image.createdAt || new Date().toISOString(),
                },
              },
              'Size': {
                select: {
                  name: image.settings?.size || '1024x1024',
                },
              },
              'Quality': {
                select: {
                  name: image.settings?.quality || 'standard',
                },
              },
              'Style Type': {
                select: {
                  name: image.settings?.styleType || 'standard',
                },
              },
              'Style Preset': {
                select: {
                  name: image.settings?.stylePreset || 'default',
                },
              },
            },
          });
          
          addedImages.push(response);
          console.log(`Successfully added image ${image.id} to Notion`);
        } catch (imageError) {
          console.error(`Failed to add image ${image.id} to Notion:`, imageError);
        }
      }
      
      return res.json({
        success: true,
        message: `Added ${addedImages.length} image(s) to Notion database`,
        count: addedImages.length,
        addedImages: addedImages.length
      });
    } catch (error) {
      console.error('Error adding image metadata to Notion:', error);
      return res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to add image metadata to Notion' 
      });
    }
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    console.log('GET request - fetching images from Notion database');
    
    // Query the Notion database for all images
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      sorts: [
        {
          property: 'Created At',
          direction: 'descending',
        },
      ],
    });

    console.log(`Found ${response.results.length} images in Notion database`);

    // Transform Notion pages to our image format
    const images = response.results.map(page => {
      const properties = page.properties;
      
      return {
        id: properties.ID?.rich_text?.[0]?.text?.content || page.id,
        prompt: properties.Prompt?.rich_text?.[0]?.text?.content || 'No prompt',
        url: properties['Image URL']?.url || '',
        localPath: properties['Image URL']?.url || '',
        filename: properties.Filename?.rich_text?.[0]?.text?.content || 'unknown.png',
        createdAt: properties['Created At']?.date?.start || page.created_time,
        settings: {
          size: properties.Size?.select?.name || '1024x1024',
          quality: properties.Quality?.select?.name || 'standard',
          styleType: properties['Style Type']?.select?.name || 'standard',
          stylePreset: properties['Style Preset']?.select?.name || 'default',
        }
      };
    });
    
    const message = images.length === 0 
      ? 'Notion database is connected! Generate some images and they will appear here.'
      : `Found ${images.length} generated image${images.length === 1 ? '' : 's'} in Notion database`;
    
    res.json({
      success: true,
      images: images,
      count: images.length,
      message: message,
      source: 'notion'
    });
    
  } catch (error) {
    console.error('Error fetching images from Notion:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch images from Notion database' 
    });
  }
} 