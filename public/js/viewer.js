/**
 * Image Gallery Viewer Script
 * 
 * Enhanced with:
 * - Advanced filtering and sorting
 * - Favorites system
 * - Improved UI and error handling
 * - Modern toast notifications
 */
document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const imageGallery = document.getElementById('imageGallery');
  const searchInput = document.getElementById('searchInput');
  const viewButtons = document.querySelectorAll('.view-btn');
  const refreshBtn = document.getElementById('refreshBtn');
  const filterSelect = document.getElementById('filterSelect');
  const sortSelect = document.getElementById('sortSelect');
  const imageModal = document.getElementById('imageModal');
  const closeModal = document.getElementById('closeModal');
  const modalImage = document.getElementById('modalImage');
  const modalPrompt = document.getElementById('modalPrompt');
  const modalDate = document.getElementById('modalDate');
  const modalSettings = document.getElementById('modalSettings');
  const modalImageTitle = document.getElementById('modalImageTitle');
  const downloadBtn = document.getElementById('downloadBtn');
  const deleteBtn = document.getElementById('deleteBtn');
  const favoriteBtn = document.getElementById('favoriteBtn');
  const toastContainer = document.getElementById('toastContainer');
  
  // State
  let images = [];
  let filteredImages = [];
  let selectedImage = null;
  let viewMode = 'grid';
  let favorites = loadFavorites();
  
  // Initialize
  init();
  
  function init() {
    // Fetch images
    fetchImages();
    
    // Add event listeners
    searchInput.addEventListener('input', filterImages);
    filterSelect.addEventListener('change', applyFilters);
    sortSelect.addEventListener('change', applyFilters);
    
    // View mode buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-view');
        console.log('Changing view mode to:', mode);
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
      showToast('Gallery refreshed successfully', 'success');
    });
    
    // Modal events
    closeModal.addEventListener('click', hideModal);
    deleteBtn.addEventListener('click', deleteSelectedImage);
    favoriteBtn.addEventListener('click', toggleFavorite);
    
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
      showLoading();
      
      const response = await fetch('/api/images?rescan=true');
      
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        images = data.images || [];
        
        // Sort by date (newest first) by default
        images.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB - dateA;
        });
        
        // If no images returned from API, try scanning for images directly
        if (images.length === 0) {
          await scanImagesDirectory();
        }
        
        // Apply any active filters/sorting
        applyFilters();
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error fetching images:', error);
      showEmptyState('Error loading images: ' + error.message);
      showToast('Failed to load images', 'error');
    } finally {
      hideLoading();
    }
  }
  
  // Scan for images in the directory (fallback)
  async function scanImagesDirectory() {
    try {
      const response = await fetch('/api/images?rescan=true');
      
      if (!response.ok) {
        throw new Error(`API rescan returned status ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        images = data.images || [];
      } else {
        throw new Error(data.error || 'Unknown error during rescan');
      }
    } catch (error) {
      console.error('Error scanning directory:', error);
      // Last resort: try to show some well-known image paths
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
    }
  }
  
  // Show loading state
  function showLoading() {
    imageGallery.innerHTML = `
      <div class="empty-state">
        <i class="ti ti-loader ti-spin"></i>
        <p>Loading images...</p>
      </div>
    `;
  }
  
  // Hide loading state
  function hideLoading() {
    // Will be replaced by renderGallery
  }
  
  // Apply filters and sorting
  function applyFilters() {
    const query = searchInput.value.trim().toLowerCase();
    const filter = filterSelect.value;
    const sort = sortSelect.value;
    
    // First apply search filter
    filteredImages = images.filter(image => {
      // Skip search if query is empty
      if (!query) return true;
      
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
    
    // Then apply dropdown filter
    if (filter !== 'all') {
      if (filter === 'favorite') {
        filteredImages = filteredImages.filter(image => 
          favorites.includes(image.id || image.filename)
        );
      } else if (filter === 'recent') {
        // Get images from the last 24 hours
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        
        filteredImages = filteredImages.filter(image => {
          const imageDate = new Date(image.createdAt || 0);
          return imageDate > oneDayAgo;
        });
      }
    }
    
    // Apply sorting
    if (sort === 'newest') {
      filteredImages.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });
    } else if (sort === 'oldest') {
      filteredImages.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateA - dateB;
      });
    } else if (sort === 'prompt') {
      filteredImages.sort((a, b) => {
        const promptA = (a.prompt || '').toLowerCase();
        const promptB = (b.prompt || '').toLowerCase();
        return promptA.localeCompare(promptB);
      });
    }
    
    // Render the filtered and sorted gallery
    renderGallery();
  }
  
  // Filter images based on search query
  function filterImages() {
    applyFilters();
  }
  
  // Render image gallery
  function renderGallery() {
    // Clear gallery
    imageGallery.innerHTML = '';
    
    if (filteredImages.length === 0) {
      showEmptyState();
      return;
    }
    
    // Set class based on view mode
    imageGallery.className = `image-gallery ${viewMode}-view`;
    
    // Remove any inline styles that might interfere with our CSS
    imageGallery.removeAttribute('style');
    
    // Add image cards
    filteredImages.forEach((image, index) => {
      const card = createImageCard(image);
      
      // Ensure no inline styles that could cause stacking issues
      card.style.position = 'relative';
      card.style.zIndex = '1';
      
      imageGallery.appendChild(card);
      
      // Staggered animation with CSS classes instead of inline styles
      setTimeout(() => {
        card.classList.add('fade-in');
      }, index * 50);
    });
  }
  
  // Create image card element
  function createImageCard(image) {
    const card = document.createElement('div');
    card.className = 'image-card';
    card.setAttribute('data-id', image.id || '');
    card.setAttribute('data-timestamp', image.createdAt || '');
    card.addEventListener('click', () => showImageDetails(image));
    
    // Check if image is a favorite
    const isFavorite = favorites.includes(image.id || image.filename);
    if (isFavorite) {
      card.classList.add('favorite');
    }
    
    if (viewMode === 'grid') {
      const img = document.createElement('img');
      img.className = 'card-image';
      
      // Make sure path starts with '/' for relative URLs
      const imagePath = (image.localPath || image.url);
      img.src = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
      img.alt = image.prompt || 'Generated image';
      img.loading = 'lazy';
      
      // Add error handling for images
      img.onerror = function() {
        const parent = this.parentElement;
        this.style.display = 'none';
        
        // Create placeholder
        const placeholder = document.createElement('div');
        placeholder.className = 'card-placeholder';
        placeholder.innerHTML = '<i class="ti ti-photo-off"></i>';
        parent.appendChild(placeholder);
      };
      
      card.appendChild(img);
    } 
    // List view
    else {
      const img = document.createElement('img');
      img.className = 'card-image';
      
      // Make sure path starts with '/' for relative URLs
      const imagePath = (image.localPath || image.url);
      img.src = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
      img.alt = image.prompt || 'Generated image';
      img.loading = 'lazy';
      
      // Add error handling for images
      img.onerror = function() {
        const parent = this.parentElement;
        this.style.display = 'none';
        
        // Create placeholder
        const placeholder = document.createElement('div');
        placeholder.className = 'card-placeholder';
        placeholder.innerHTML = '<i class="ti ti-photo-off"></i>';
        parent.insertBefore(placeholder, parent.firstChild);
      };
      
      const content = document.createElement('div');
      content.className = 'card-content';
      
      // Add favorite indicator for list view
      if (isFavorite) {
        const favoriteIndicator = document.createElement('div');
        favoriteIndicator.className = 'favorite-tag';
        favoriteIndicator.innerHTML = '<i class="ti ti-star"></i> Favorite';
        content.appendChild(favoriteIndicator);
      }
      
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
    // Check if it's specifically the favorites filter with no results
    if (filterSelect.value === 'favorite' && images.length > 0) {
      message = 'No favorite images found. Add some favorites first!';
    }
    
    imageGallery.innerHTML = `
      <div class="empty-state">
        <i class="ti ti-photo-off"></i>
        <p>${message}</p>
        <a href="index.html" class="gallery-btn">Generate Your First Image</a>
      </div>
    `;
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
    
    // Re-render gallery
    renderGallery();
  }
  
  // Show image details in modal
  function showImageDetails(image) {
    selectedImage = image;
    
    // Make sure path starts with '/' for relative URLs
    const imagePath = (image.localPath || image.url);
    const fixedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    
    // Set modal content
    modalImage.src = fixedPath;
    modalPrompt.textContent = image.prompt || 'No prompt available';
    modalDate.textContent = formatDate(image.createdAt);
    
    // Update favorite button state
    const isImageFavorite = favorites.includes(image.id || image.filename);
    if (isImageFavorite) {
      favoriteBtn.innerHTML = '<i class="ti ti-star-filled"></i> Remove from Favorites';
      favoriteBtn.classList.add('active');
    } else {
      favoriteBtn.innerHTML = '<i class="ti ti-star"></i> Add to Favorites';
      favoriteBtn.classList.remove('active');
    }
    
    // Handle image loading errors
    modalImage.onerror = function() {
      this.style.display = 'none';
      
      if (!document.getElementById('modalImageError')) {
        const errorMsg = document.createElement('div');
        errorMsg.id = 'modalImageError';
        errorMsg.className = 'modal-image-error';
        errorMsg.innerHTML = '<i class="ti ti-photo-off"></i><p>Image could not be loaded</p>';
        this.parentElement.appendChild(errorMsg);
      }
    };
    
    modalImage.onload = function() {
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
    
    if (!confirm('Are you sure you want to delete this image?')) return;
    
    try {
      const response = await fetch(`/api/images/${selectedImage.id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Remove from arrays
        images = images.filter(img => img.id !== selectedImage.id);
        filteredImages = filteredImages.filter(img => img.id !== selectedImage.id);
        
        // Remove from favorites if present
        const index = favorites.indexOf(selectedImage.id);
        if (index !== -1) {
          favorites.splice(index, 1);
          saveFavorites();
        }
        
        // Hide modal
        hideModal();
        
        // Re-render gallery
        renderGallery();
        
        // Show success toast
        showToast('Image deleted successfully', 'success');
      } else {
        showToast('Failed to delete image', 'error');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      showToast('Error deleting image', 'error');
    }
  }
  
  // Toggle favorite status for the selected image
  function toggleFavorite() {
    if (!selectedImage) return;
    
    const imageId = selectedImage.id || selectedImage.filename;
    const index = favorites.indexOf(imageId);
    
    if (index === -1) {
      // Add to favorites
      favorites.push(imageId);
      favoriteBtn.innerHTML = '<i class="ti ti-star-filled"></i> Remove from Favorites';
      favoriteBtn.classList.add('active');
      showToast('Added to favorites', 'success');
    } else {
      // Remove from favorites
      favorites.splice(index, 1);
      favoriteBtn.innerHTML = '<i class="ti ti-star"></i> Add to Favorites';
      favoriteBtn.classList.remove('active');
      showToast('Removed from favorites', 'success');
    }
    
    // Save favorites to localStorage
    saveFavorites();
    
    // Re-render gallery if currently filtered by favorites
    if (filterSelect.value === 'favorite') {
      applyFilters();
    } else {
      // Just update the current card in the DOM
      const cards = document.querySelectorAll('.image-card');
      cards.forEach(card => {
        const cardId = card.getAttribute('data-id');
        if (cardId === imageId) {
          if (index === -1) {
            card.classList.add('favorite');
          } else {
            card.classList.remove('favorite');
          }
        }
      });
    }
  }
  
  // Load favorites from localStorage
  function loadFavorites() {
    try {
      const storedFavorites = localStorage.getItem('imageGalleryFavorites');
      return storedFavorites ? JSON.parse(storedFavorites) : [];
    } catch (error) {
      console.error('Error loading favorites:', error);
      return [];
    }
  }
  
  // Save favorites to localStorage
  function saveFavorites() {
    try {
      localStorage.setItem('imageGalleryFavorites', JSON.stringify(favorites));
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  }
  
  // Format date
  function formatDate(dateStr) {
    if (!dateStr) return 'Unknown date';
    
    let date;
    try {
      // First try parsing the date string
      date = new Date(dateStr);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        // Try to extract date from a filename format
        const match = dateStr.match(/_(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/);
        if (match && match[1]) {
          const formattedStr = match[1].replace(/-(\d{2})-(\d{2})-(\d{2})$/, 'T$1:$2:$3');
          date = new Date(formattedStr);
        } else {
          return 'Unknown date';
        }
      }
      
      // Format the date nicely
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
  
  // Show toast message
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}-toast`;
    
    let icon = '';
    if (type === 'success') {
      icon = '<i class="ti ti-check"></i>';
    } else if (type === 'error') {
      icon = '<i class="ti ti-alert-circle"></i>';
    } else if (type === 'info') {
      icon = '<i class="ti ti-info-circle"></i>';
    }
    
    toast.innerHTML = `${icon}<span>${message}</span>`;
    
    toastContainer.appendChild(toast);
    
    // Animate and remove after timeout
    setTimeout(() => {
      toast.classList.add('show');
      
      setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    }, 10);
  }
});