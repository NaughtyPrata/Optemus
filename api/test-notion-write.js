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

  try {
    console.log('Testing Notion write operation...');
    
    // First, let's get the database schema
    const database = await notion.databases.retrieve({
      database_id: DATABASE_ID,
    });
    
    console.log('Database properties:', Object.keys(database.properties));
    
    // Try to create a test entry
    const testData = {
      'ID': {
        rich_text: [
          {
            text: {
              content: 'test-vercel-' + Date.now(),
            },
          },
        ],
      },
      'Prompt': {
        rich_text: [
          {
            text: {
              content: 'Test from Vercel API',
            },
          },
        ],
      },
      'Image URL': {
        url: 'https://example.com/test.png',
      },
      'Filename': {
        rich_text: [
          {
            text: {
              content: 'test.png',
            },
          },
        ],
      },
      'Created At': {
        date: {
          start: new Date().toISOString(),
        },
      },
    };
    
    console.log('Attempting to create page with data:', JSON.stringify(testData, null, 2));
    
    const response = await notion.pages.create({
      parent: {
        database_id: DATABASE_ID,
      },
      properties: testData,
    });
    
    res.json({
      success: true,
      message: 'Successfully wrote to Notion database',
      pageId: response.id,
      databaseProperties: Object.keys(database.properties),
      testData: testData
    });
    
  } catch (error) {
    console.error('Error writing to Notion:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
      details: error.body || error.response?.data || 'No additional details'
    });
  }
} 