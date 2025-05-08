# Image Generator

A modern web application for generating AI images using OpenAI's API.

## Features

- Clean, intuitive UI with a simple layout
- Generates high-quality AI images based on text prompts
- Allows customization of image size and quality
- Automatically saves generated images
- Download functionality for generated images
- Responsive design

## Tech Stack

- **Frontend**:
  - HTML5
  - CSS3 (with reset.css)
  - JavaScript (vanilla)
  - Tailwind CSS (via CDN)
  - Anime.js for animations
  - Tabler Icons

- **Backend**:
  - Node.js
  - Express.js
  - OpenAI API

## Getting Started

### Prerequisites

- Node.js (v14+ recommended)
- OpenAI API key

### Installation

1. Clone this repository
2. Create a `.env` file in the root directory with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Start the server:
   ```
   node server.js
   ```
5. Open your browser and navigate to:
   ```
   http://localhost:4000
   ```

## Usage

1. Enter a descriptive prompt in the text area
2. Select desired image size and quality
3. Click "Generate" button
4. Wait for the image to be generated
5. Download the image using the download button

## License

MIT

## Acknowledgements

- OpenAI for the image generation API
- Tailwind CSS for the utility-first CSS framework
- Anime.js for the animation library
- Tabler Icons for the icon set