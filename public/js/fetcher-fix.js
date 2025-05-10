// Enhanced image fetching with better sorting logic
// This will be loaded after the main viewer.js file

document.addEventListener('DOMContentLoaded', () => {
  console.log('Image fetcher fix loaded');
  
  // Wait for the original code to initialize
  setTimeout(() => {
    // Override the fetchImages function with our improved version
    window.fetchImagesWithBetterSorting = async function() {
      try {
        console.log('Fetching images with improved sorting...');
        
        // Use the same API endpoint
        const response = await fetch('/api/images?rescan=true');
        
        if (!response.ok) {
          throw new Error(`API returned status ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          const images = data.images || [];
          console.log(`Loaded ${images.length} images, applying enhanced sorting`);
          
          // Enhanced sorting logic
          images.sort((a, b) => {
            // Function to safely extract a timestamp from various formats
            function getTimestamp(img) {
              // Try different methods to get a valid date
              const attempts = [
                // 1. Try createdAt property
                () => new Date(img.createdAt || 0),
                
                // 2. Try to extract ISO timestamp from filename
                () => {
                  const match = img.filename?.match(/(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/);
                  if (match && match[1]) {
                    return new Date(match[1].replace(/-/g, (m, i) => i > 10 ? ':' : m));
                  }
                  return null;
                },
                
                // 3. Try to extract numeric timestamp from filename (like image_1746707539328.png)
                () => {
                  const match = img.filename?.match(/image_(\d+)/);
                  if (match && match[1]) {
                    return new Date(parseInt(match[1]));
                  }
                  return null;
                },
                
                // 4. Try generated_ prefix with UUID
                () => {
                  const match = img.filename?.match(/generated_(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/);
                  if (match && match[1]) {
                    return new Date(match[1].replace(/-/g, (m, i) => i > 10 ? ':' : m));
                  }
                  return null;
                }
              ];
              
              // Try each method until we get a valid date
              for (const attempt of attempts) {
                const result = attempt();
                if (result instanceof Date && !isNaN(result.getTime())) {
                  return result.getTime();
                }
              }
              
              // Default to 0 (oldest) if all methods fail
              return 0;
            }
            
            const timeA = getTimestamp(a);
            const timeB = getTimestamp(b);
            
            // Sort newest first
            return timeB - timeA;
          });
          
          // For debugging - log the first few sorted images
          console.log('First 5 images after enhanced sorting:');
          images.slice(0, 5).forEach((img, i) => {
            console.log(`${i+1}. ${img.filename}: ${img.createdAt}`);
          });
          
          // Replace the existing images array and re-render
          window.images = images;
          window.renderGallery();
          
          // Add a "sorted" class to the container for CSS targeting
          const gallery = document.getElementById('imageGallery');
          if (gallery) {
            gallery.classList.add('sorted-images');
          }
          
          return true;
        } else {
          console.error('Error from server:', data.error);
          return false;
        }
      } catch (error) {
        console.error('Error in enhanced image fetching:', error);
        return false;
      }
    };
    
    // Automatically run our enhanced fetching once
    window.fetchImagesWithBetterSorting();
    
    // Also hook into the refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        console.log('Using enhanced fetching for refresh');
        
        // Show loading state
        refreshBtn.innerHTML = '<i class="ti ti-loader ti-spin"></i>';
        refreshBtn.disabled = true;
        
        // Use our enhanced fetching
        await window.fetchImagesWithBetterSorting();
        
        // Restore button
        refreshBtn.innerHTML = '<i class="ti ti-refresh"></i>';
        refreshBtn.disabled = false;
        
        // Show a toast to confirm refresh
        if (window.showToast) {
          window.showToast('Gallery refreshed with enhanced sorting', false);
        }
      }, true); // true to capture the event before the original handler
    }
  }, 500); // Short delay to ensure the main script has initialized
});
