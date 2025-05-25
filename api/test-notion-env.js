export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const hasToken = !!process.env.NOTION_TOKEN;
    const hasDatabaseId = !!process.env.NOTION_DATABASE_ID;
    const tokenLength = process.env.NOTION_TOKEN ? process.env.NOTION_TOKEN.length : 0;
    const databaseIdLength = process.env.NOTION_DATABASE_ID ? process.env.NOTION_DATABASE_ID.length : 0;

    res.json({
      success: true,
      environment: {
        hasNotionToken: hasToken,
        hasNotionDatabaseId: hasDatabaseId,
        tokenLength: tokenLength,
        databaseIdLength: databaseIdLength,
        tokenPrefix: process.env.NOTION_TOKEN ? process.env.NOTION_TOKEN.substring(0, 10) + '...' : 'Not set',
        databaseIdPrefix: process.env.NOTION_DATABASE_ID ? process.env.NOTION_DATABASE_ID.substring(0, 10) + '...' : 'Not set'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
} 