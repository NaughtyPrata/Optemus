import fetch from 'node-fetch';

// Simple base64 encoded image (1x1 pixel PNG)
const imageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAgAB/1h9LkAAAAAASUVORK5CYII=';
const imageName = 'test_image.png';

fetch('http://localhost:4001/save-image', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ imageData, imageName }),
})
  .then(response => response.text())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
