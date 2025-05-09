document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const imageGallery = document.getElementById('imageGallery');
  const searchInput = document.getElementById('searchInput');
  const viewButtons = document.querySelectorAll('.view-btn');
  const refreshBtn = document.getElementById('refreshBtn');
  const imageModal = document.getElementById('imageModal');
  const closeModal = document.getElementById('closeModal');
  const modalImage = document.getElementById('modalImage');
  const modalPrompt = document.getElementById('modalPrompt');
  const modalDate = document.getElementById('modalDate');
  const modalSettings = document.getElementById('modalSettings');
  const modalImageTitle = document.getElementById('modalImageTitle');
  const downloadBtn = document.getElementById('downloadBtn');
  const deleteBtn = document.getElementById('deleteBtn');
  
  // State
  let images = [];
  let selectedImage = null;
  let viewMode = 'grid';
  
  // Initialize
  init();
  
  function init() {
    // Fetch images
    fetchImages();
    
    // Add event listeners
    searchInput.addEventListener('input', filterImages);
    
    viewButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-view');
        changeViewMode(mode);
      });
    });
    
    // Add refresh button event listener
    refreshBtn.addEventListener('click', async () => {
      // Show loading animation
      refreshBtn.innerHTML = '<i class="ti ti-loader ti-spin"></i>';
      refreshBtn.disabled = true;
      
      // Fetch images with rescan
      await fetchImages();
      
      // Restore button
      refreshBtn.innerHTML = '<i class="ti ti-refresh"></i>';
      refreshBtn.disabled = false;
      
      // Show toast notification
      showToast('Gallery refreshed', false);
    });
    
    closeModal.addEventListener('click', hideModal);
    deleteBtn.addEventListener('click', deleteSelectedImage);
    
    // Close modal when clicking outside content
    imageModal.addEventListener('click', (e) => {
      if (e.target === imageModal) {
        hideModal();
      }
    });
    
    // Listen for escape key to close modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && imageModal.classList.contains('active')) {
        hideModal();
      }
    });
  }
  
  // Fetch images from server
  async function fetchImages() {
    try {
      console.log('Fetching images from server...');
      
      // Always trigger a rescan to ensure we have the latest images
      const response = await fetch('/api/images?rescan=true');
      console.log('Response received:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Data received from API:', data);
      
      if (data.success) {
        images = data.images || [];
        console.log(`Loaded ${images.length} images from server`);
        
        // If no images returned from API, try scanning for images directly
        if (images.length === 0) {
          console.log('No images from API, trying to detect images in directory...');
          await scanImagesDirectory();
        } else if (images.length > 0) {
          console.log('Sample image data:', images[0]);
        }
        
        renderGallery();
      } else {
        console.error('Error from server:', data.error);
        showEmptyState('Failed to load images: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error fetching images:', error);
      showEmptyState('Error loading images: ' + error.message);
    }
  }
  
  // Scan for images in the directory directly (fallback)
  async function scanImagesDirectory() {
    try {
      console.log('Triggering server-side directory scan...');
      const response = await fetch('/api/images?rescan=true');
      
      if (!response.ok) {
        throw new Error(`API rescan returned status ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        images = data.images || [];
        console.log(`Rescan loaded ${images.length} images from server`);
      } else {
        throw new Error(data.error || 'Unknown error during rescan');
      }
    } catch (error) {
      console.error('Error scanning directory:', error);
      
      // Last resort: try to show some well-known image paths
      console.log('Falling back to known image paths...');
      const knownImagePaths = [
        'image_1746707539328.png',
        'image_1746708513886.png',
        'image_1746708650397.png',
        'image_1746709754968.png'
      ];
      
      // Create fallback image objects
      images = knownImagePaths.map((filename, index) => ({
        id: `fallback_${index}`,
        filename,
        url: `/images/${filename}`,
        localPath: `/images/${filename}`,
        prompt: 'Fallback image (no metadata available)',
        createdAt: new Date().toISOString(),
        settings: {
          size: 'unknown',
          quality: 'unknown',
          styleType: 'unknown',
          stylePreset: 'unknown'
        }
      }));
      
      console.log(`Created ${images.length} fallback image entries`);
    }
  }
  
  // Render image gallery
  function renderGallery(filteredImages = null) {
    const imagesToRender = filteredImages || images;
    console.log(`Rendering gallery with ${imagesToRender.length} images`);
    
    // Clear gallery
    imageGallery.innerHTML = '';
    
    if (imagesToRender.length === 0) {
      console.log('No images to display, showing empty state');
      showEmptyState();
      return;
    }
    
    // Add image cards
    imagesToRender.forEach((image, index) => {
      console.log(`Creating card for image ${index + 1}/${imagesToRender.length}:`, image.filename);
      const card = createImageCard(image);
      imageGallery.appendChild(card);
    });
  }
  
  // Create image card element
  function createImageCard(image) {
    console.log('Creating image card for:', image.filename);
    console.log('Image path:', image.localPath || image.url);
    
    const card = document.createElement('div');
    card.className = 'image-card';
    card.addEventListener('click', () => showImageDetails(image));
    
    // For grid view, just show the image
    if (viewMode === 'grid') {
      const img = document.createElement('img');
      img.className = 'card-image';
      
      // Make sure path starts with '/' for relative URLs
      const imagePath = (image.localPath || image.url);
      img.src = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
      
      console.log('Setting image src to:', img.src);
      img.alt = image.prompt || 'Generated image';
      
      // Add error handling for images
      img.onerror = function() {
        console.error('Failed to load image:', img.src);
        // If image fails to load, create a placeholder div
        const parent = this.parentElement;
        this.style.display = 'none';
        
        // Create a colored placeholder with an icon
        const placeholder = document.createElement('div');
        placeholder.className = 'card-placeholder';
        placeholder.innerHTML = '<i class="ti ti-photo-off"></i>';
        parent.appendChild(placeholder);
      };
      
      img.onload = function() {
        console.log('Image loaded successfully:', img.src);
      };
      
      card.appendChild(img);
    } 
    // For list view, show image and details
    else {
      const img = document.createElement('img');
      img.className = 'card-image';
      
      // Make sure path starts with '/' for relative URLs
      const imagePath = (image.localPath || image.url);
      img.src = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
      
      console.log('Setting list view image src to:', img.src);
      img.alt = image.prompt || 'Generated image';
      
      // Add error handling for images
      img.onerror = function() {
        console.error('Failed to load list view image:', img.src);
        // If image fails to load, create a placeholder div
        const parent = this.parentElement;
        this.style.display = 'none';
        
        // Create a colored placeholder with an icon
        const placeholder = document.createElement('div');
        placeholder.className = 'card-placeholder';
        placeholder.innerHTML = '<i class="ti ti-photo-off"></i>';
        parent.appendChild(placeholder);
      };
      
      img.onload = function() {
        console.log('List view image loaded successfully:', img.src);
      };
      
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
    }
    
    return card;
  }
  
  // Show empty state
  function showEmptyState(message = 'No images found') {
    imageGallery.innerHTML = `
      <div class="empty-state">
        <i class="ti ti-photo-off"></i>
        <p>${message}</p>
        <a href="index.html" class="btn btn-primary">Generate Your First Image</a>
      </div>
    `;
  }
  
  // Filter images based on search query
  function filterImages() {
    const query = searchInput.value.trim().toLowerCase();
    
    if (!query) {
      renderGallery();
      return;
    }
    
    const filtered = images.filter(image => {
      // Search in prompt
      if (image.prompt && image.prompt.toLowerCase().includes(query)) {
        return true;
      }
      
      // Search in settings
      if (image.settings) {
        const settingsStr = JSON.stringify(image.settings).toLowerCase();
        if (settingsStr.includes(query)) {
          return true;
        }
      }
      
      return false;
    });
    
    renderGallery(filtered);
  }
  
  // Change view mode (grid or list)
  function changeViewMode(mode) {
    viewMode = mode;
    
    // Update active button
    viewButtons.forEach(btn => {
      if (btn.getAttribute('data-view') === mode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    
    // Update gallery class
    imageGallery.className = `image-gallery ${mode}-view`;
    
    // Re-render gallery
    renderGallery();
  }
  
  // Show image details in modal
  function showImageDetails(image) {
    console.log('Showing image details for:', image.filename);
    console.log('Image data:', image);
    
    selectedImage = image;
    
    // Make sure path starts with '/' for relative URLs
    const imagePath = (image.localPath || image.url);
    const fixedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    
    // Set modal content
    console.log('Setting modal image src to:', fixedPath);
    modalImage.src = fixedPath;
    modalPrompt.textContent = image.prompt || 'No prompt available';
    modalDate.textContent = formatDate(image.createdAt);
    
    // Add error handling for modal image
    modalImage.onerror = function() {
      console.error('Failed to load modal image:', modalImage.src);
      // If image fails to load, create a placeholder
      const parent = this.parentElement;
      this.style.display = 'none';
      
      // Check if we already added an error message
      if (!document.getElementById('modalImageError')) {
        const errorMsg = document.createElement('div');
        errorMsg.id = 'modalImageError';
        errorMsg.className = 'modal-image-error';
        errorMsg.innerHTML = '<i class="ti ti-photo-off"></i><p>Image could not be loaded</p>';
        parent.appendChild(errorMsg);
      }
    };
    
    modalImage.onload = function() {
      console.log('Modal image loaded successfully:', modalImage.src);
      // Remove any error message if the image loads successfully
      const errorMsg = document.getElementById('modalImageError');
      if (errorMsg) {
        errorMsg.remove();
      }
      this.style.display = 'block';
    };
    
    // Format settings
    if (image.settings) {
      const { size, quality, styleType, stylePreset } = image.settings;
      let settingsText = '';
      
      if (size) settingsText += `Size: ${size}\n`;
      if (quality) settingsText += `Quality: ${quality}\n`;
      if (styleType) settingsText += `Style: ${styleType}\n`;
      if (stylePreset) settingsText += `Preset: ${stylePreset}`;
      
      modalSettings.textContent = settingsText || 'No settings available';
    } else {
      modalSettings.textContent = 'No settings available';
    }
    
    // Set title
    modalImageTitle.textContent = image.prompt ? 
      (image.prompt.length > 40 ? image.prompt.substring(0, 40) + '...' : image.prompt) : 
      'Image Details';
    
    // Set download link
    if (image.localPath) {
      downloadBtn.href = image.localPath;
      downloadBtn.download = image.filename || 'generated-image.png';
      downloadBtn.style.display = 'flex';
    } else {
      downloadBtn.style.display = 'none';
    }
    
    // Show modal
    imageModal.classList.add('active');
  }
  
  // Hide modal
  function hideModal() {
    imageModal.classList.remove('active');
    selectedImage = null;
  }
  
  // Delete selected image
  async function deleteSelectedImage() {
    if (!selectedImage || !selectedImage.id) return;
    
    try {
      const response = await fetch(`/api/images/${selectedImage.id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Remove from array
        images = images.filter(img => img.id !== selectedImage.id);
        
        // Hide modal
        hideModal();
        
        // Re-render gallery
        renderGallery();
        
        // Show success toast
        showToast('Image deleted successfully');
      } else {
        showToast('Failed to delete image', true);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      showToast('Error deleting image', true);
    }
  }
  
  // Format date
  function formatDate(dateStr) {
    if (!dateStr) return 'Unknown date';
    
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  // Show toast message
  function showToast(message, isError = false) {
    // Check if there's already a toast showing
    const existingToast = document.querySelector('.error-toast, .success-toast');
    if (existingToast) {
      existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = isError ? 'error-toast' : 'success-toast';
    toast.innerHTML = `
      <i class="${isError ? 'ti ti-alert-circle' : 'ti ti-check'}"></i>
      <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    // Animate and remove after timeout
    setTimeout(() => {
      toast.classList.add('show');
      
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    }, 10);
  }
}); 