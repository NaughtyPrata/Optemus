/**
 * Viewer Fixes - This script fixes issues with the viewer page
 * 1. Fixes image sorting to ensure newest images appear first
 * 2. Fixes list view not working properly
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('Viewer Fixes loaded');
  
  // 1. Fix for sorting issue
  // Override the original sorting function in the fetchImages function
  const originalFetchImages = window.fetchImages;
  
  if (typeof originalFetchImages === 'function') {
    console.log('Original fetchImages function found, applying fixes');
    
    window.fetchImages = async function() {
      try {
        const response = await fetch('/api/images?rescan=true');
        
        if (!response.ok) {
          throw new Error(`API returned status ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          window.images = data.images || [];
          console.log(`Fixed sorting: Loaded ${window.images.length} images from server`);
          
          // Improved sorting logic with better date parsing
          window.images.sort((a, b) => {
            // First try parsing the timestamp directly
            let dateA = new Date(a.createdAt || 0);
            let dateB = new Date(b.createdAt || 0);
            
            // Check if dates are valid
            if (isNaN(dateA.getTime())) {
              // Try to extract date from filename which often contains a timestamp
              const timestampMatch = a.filename?.match(/(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/);
              if (timestampMatch && timestampMatch[1]) {
                dateA = new Date(timestampMatch[1].replace(/-/g, (match, idx) => idx >= 10 ? ':' : match));
              } else {
                // Use file modified time as last resort
                const fileTimeMatch = a.filename?.match(/image_(\d+)/);
                if (fileTimeMatch && fileTimeMatch[1]) {
                  dateA = new Date(parseInt(fileTimeMatch[1]));
                }
              }
            }
            
            if (isNaN(dateB.getTime())) {
              const timestampMatch = b.filename?.match(/(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/);
              if (timestampMatch && timestampMatch[1]) {
                dateB = new Date(timestampMatch[1].replace(/-/g, (match, idx) => idx >= 10 ? ':' : match));
              } else {
                const fileTimeMatch = b.filename?.match(/image_(\d+)/);
                if (fileTimeMatch && fileTimeMatch[1]) {
                  dateB = new Date(parseInt(fileTimeMatch[1]));
                }
              }
            }
            
            // If we still have invalid dates, use the filenames for comparison
            if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) {
              return (b.filename || '').localeCompare(a.filename || '');
            } else if (isNaN(dateA.getTime())) {
              return 1; // Place invalid dates at the end
            } else if (isNaN(dateB.getTime())) {
              return -1; // Place invalid dates at the end
            }
            
            // Finally sort by parsed dates
            return dateB.getTime() - dateA.getTime();
          });
          
          // Print timestamps for debugging
          console.log('Sorted images timestamps:');
          window.images.slice(0, 5).forEach(img => {
            console.log(`- ${img.filename}: ${img.createdAt}`);
          });
          
          window.renderGallery();
        } else {
          console.error('Error from server:', data.error);
          window.showEmptyState('Failed to load images: ' + (data.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error fetching images:', error);
        window.showEmptyState('Error loading images: ' + error.message);
      }
    };
  }
  
  // 2. Fix for list view not working
  // Override the changeViewMode function to ensure list view works
  const viewButtons = document.querySelectorAll('.view-btn');
  if (viewButtons.length > 0) {
    console.log('View buttons found, applying list view fix');
    
    // Clean up button event listeners and re-add them
    viewButtons.forEach(btn => {
      // Clone the button to remove existing event listeners
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      
      // Add new event listener
      newBtn.addEventListener('click', () => {
        const mode = newBtn.getAttribute('data-view');
        console.log('Changing view mode to:', mode);
        
        // Update active button styling
        document.querySelectorAll('.view-btn').forEach(otherBtn => {
          if (otherBtn.getAttribute('data-view') === mode) {
            otherBtn.classList.add('active');
          } else {
            otherBtn.classList.remove('active');
          }
        });
        
        // Update view mode in the window/global state
        window.viewMode = mode;
        
        // Update gallery class
        const gallery = document.getElementById('imageGallery');
        if (gallery) {
          gallery.className = `image-gallery ${mode}-view`;
          console.log(`Set gallery class to: image-gallery ${mode}-view`);
        }
        
        // Call the original render function
        if (typeof window.renderGallery === 'function') {
          window.renderGallery();
        } else {
          // Fallback: re-render gallery from scratch
          const imageGallery = document.getElementById('imageGallery');
          imageGallery.innerHTML = '';
          
          if (!window.images || window.images.length === 0) {
            imageGallery.innerHTML = `
              <div class="empty-state">
                <i class="ti ti-photo-off"></i>
                <p>No images found</p>
                <a href="index.html" class="btn btn-primary">Generate Your First Image</a>
              </div>
            `;
            return;
          }
          
          // Create cards for each image
          window.images.forEach((image, index) => {
            console.log(`Creating card for image ${index + 1}/${window.images.length}:`, image.filename);
            
            const card = document.createElement('div');
            card.className = 'image-card';
            card.setAttribute('data-timestamp', image.createdAt || '');
            
            // For list view
            if (mode === 'list') {
              const img = document.createElement('img');
              img.className = 'card-image';
              
              const imagePath = (image.localPath || image.url);
              img.src = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
              img.alt = image.prompt || 'Generated image';
              
              const content = document.createElement('div');
              content.className = 'card-content';
              
              const title = document.createElement('div');
              title.className = 'card-title';
              title.textContent = image.prompt ? 
                (image.prompt.length > 60 ? image.prompt.substring(0, 60) + '...' : image.prompt) : 
                'Untitled image';
              
              const date = document.createElement('div');
              date.className = 'card-date';
              date.textContent = formatDate(image.createdAt);
              
              content.appendChild(title);
              content.appendChild(date);
              
              card.appendChild(img);
              card.appendChild(content);
            } else {
              // Grid view
              const img = document.createElement('img');
              img.className = 'card-image';
              
              const imagePath = (image.localPath || image.url);
              img.src = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
              img.alt = image.prompt || 'Generated image';
              
              card.appendChild(img);
            }
            
            // Add click handler
            card.addEventListener('click', () => {
              if (typeof window.showImageDetails === 'function') {
                window.showImageDetails(image);
              }
            });
            
            imageGallery.appendChild(card);
          });
        }
      });
    });
  }
  
  // Helper function to format date (in case the original is not available)
  function formatDate(dateStr) {
    if (!dateStr) return 'Unknown date';
    
    let date;
    try {
      date = new Date(dateStr);
      
      if (isNaN(date.getTime())) {
        const match = dateStr.match(/_(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/);
        if (match && match[1]) {
          const formattedStr = match[1].replace(/-(\d{2})-(\d{2})-(\d{2})$/, 'T$1:$2:$3');
          date = new Date(formattedStr);
        } else {
          return 'Unknown date';
        }
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.warn(`Error formatting date: ${dateStr}`, e);
      return 'Unknown date';
    }
  }
});
