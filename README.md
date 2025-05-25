# AI Image Generator

A web application for generating and managing AI-generated images using the OpenAI DALL-E 3 API.

## Features

- Generate high-quality images with customizable prompts
- Choose from different size options: Square, Landscape, Portrait
- Select quality levels: Low, Medium, High, or Auto
- Apply style modifiers: Dark/Light and General/Internal/Proposals
- View and manage generated images in a responsive gallery
- Download generated images for use in other applications

## Installation and Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```
4. Start the server:
   ```
   npm start
   ```
5. Open your browser and navigate to: `http://localhost:4001`

## Deployment

### Vercel Deployment

This application is configured for deployment on Vercel with the following considerations:

- **Serverless Function Timeout**: Set to 60 seconds in `vercel.json` for image generation
- **OpenAI API Integration**: Uses direct fetch calls instead of OpenAI client library for Vercel compatibility
- **Environment Variables**: Configure `OPENAI_API_KEY` in Vercel dashboard
- **Blob Storage**: Utilizes Vercel Blob for storing generated images

#### Important Fix for Vercel Deployment

**Issue**: The OpenAI client library (`openai` npm package) was causing "Connection error" in Vercel's serverless environment, despite working perfectly in local development.

**Solution**: Replaced the OpenAI client library with direct fetch calls to the OpenAI API in `api/generate-image.js`. This maintains all functionality while ensuring compatibility with Vercel's serverless functions.

**Technical Details**:
- Direct API calls to `https://api.openai.com/v1/images/generations`
- Maintained support for all features: multiple images, style modifiers, Vercel Blob storage
- No changes required to frontend code or user experience
- Improved reliability in serverless environments

## Using the Image Generator

1. Enter a descriptive prompt in the text area
2. Select desired image size (Square, Landscape, Portrait)
3. Choose quality level (higher quality uses more API tokens)
4. Select style type (Dark or Light)
5. Choose a style preset (General, Internal, or Proposals)
6. Click "Generate" to create your image
7. Once generated, you can download the image using the download button

## Gallery View

- Click "View Gallery" to see all your generated images
- Use the search box to filter images by prompt text
- Toggle between grid and list views using the view buttons
- Click on any image to see its details, download it, or delete it

## Project Structure

- `/public`: Frontend assets and HTML
  - `/css`: Stylesheets
  - `/js`: Frontend JavaScript
  - `/images`: Saved generated images
  - `/prompts`: Style modifier text files
- `/server.js`: Express server and API endpoints
- `/test-api-call.js`: Test script for API connectivity
- `/test-api-params.js`: Test script for prompt formatting

## Troubleshooting

- **Images not showing in gallery**: Make sure the server has write permissions to the `/public/images` directory
- **API errors**: Check your OpenAI API key in the `.env` file and ensure you have available tokens
- **Style modifiers not working**: Verify that the prompt files in `/public/prompts` directory are correctly formatted

## License

MIT
