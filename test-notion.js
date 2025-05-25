import { Client } from '@notionhq/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID;

async function testNotionWrite() {
  try {
    console.log('Testing Notion database connection...');
    console.log('Database ID:', DATABASE_ID);
    console.log('Token exists:', !!process.env.NOTION_TOKEN);
    
    // Create a test entry
    const response = await notion.pages.create({
      parent: {
        database_id: DATABASE_ID,
      },
      properties: {
        'ID': {
          rich_text: [
            {
              text: {
                content: 'test-manual-' + Date.now(),
              },
            },
          ],
        },
        'Prompt': {
          rich_text: [
            {
              text: {
                content: 'Manual test entry from local script',
              },
            },
          ],
        },
        'Image URL': {
          url: 'https://example.com/test-image.png',
        },
        'Filename': {
          rich_text: [
            {
              text: {
                content: 'test-manual.png',
              },
            },
          ],
        },
        'Created At': {
          date: {
            start: new Date().toISOString(),
          },
        },
        'Size': {
          select: {
            name: '1024x1024',
          },
        },
        'Quality': {
          select: {
            name: 'standard',
          },
        },
        'Style Type': {
          select: {
            name: 'standard',
          },
        },
        'Style Preset': {
          select: {
            name: 'default',
          },
        },
      },
    });
    
    console.log('✅ Successfully created test entry in Notion!');
    console.log('Page ID:', response.id);
    console.log('Check your Notion database now!');
    
  } catch (error) {
    console.error('❌ Error writing to Notion:', error.message);
    console.error('Full error:', error);
  }
}

testNotionWrite(); 