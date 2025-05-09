import fs from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Generate a simple SVG placeholder
function generatePlaceholder() {
  try {
    // SVG content for a placeholder
    const svgContent = `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="300" fill="#2c3e50" />
      <text x="200" y="150" font-family="Arial" font-size="24" text-anchor="middle" fill="#95a5a6">
        Image Not Available
      </text>
      <path d="M 160 100 L 240 100 L 240 120 L 160 120 Z" fill="#95a5a6" />
      <path d="M 180 130 L 220 130 L 220 200 L 180 200 Z" fill="#95a5a6" />
    </svg>`;
    
    // Output path
    const outputPath = join(__dirname, 'public', 'images', 'placeholder.svg');
    
    // Write to file
    fs.writeFileSync(outputPath, svgContent);
    
    console.log(`Placeholder SVG created at: ${outputPath}`);
  } catch (error) {
    console.error('Error generating placeholder:', error);
  }
}

// Run the function
generatePlaceholder();
