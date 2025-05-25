/**
 * Image Gallery Viewer Script
 * Simple click sounds implementation
 */

// Sound Manager (copied from main.js)
class SoundManager {
  constructor() {
    this.sounds = {};
    this.isMuted = false;
    this.volume = 0.3;
    this.init();
  }
  
  init() {
    // Preload click sound
    this.sounds.click = new Audio();
    this.sounds.click.src = 'sounds/click.mp3';
    this.sounds.click.volume = this.volume;
    this.sounds.click.preload = 'auto';
  }
  
  playClick() {
    if (this.isMuted) return;
    
    try {
      // Reset the sound to the beginning and play
      this.sounds.click.currentTime = 0;
      this.sounds.click.volume = this.volume;
      this.sounds.click.play().catch(e => console.log('Could not play click sound:', e));
    } catch (error) {
      console.log('Error playing click sound:', error);
    }
  }
  
  mute() {
    this.isMuted = true;
  }
  
  unmute() {
    this.isMuted = false;
    this.playClick();
  }
  
  isSoundMuted() {
    return this.isMuted;
  }
}

// Initialize Sound Manager
const soundManager = new SoundManager();

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
  
  // Add universal click sound to all buttons (copied from main.js)
  function addClickSoundToButtons() {
    const clickableElements = document.querySelectorAll(`
      button,
      .button,
      .view-btn,
      .refresh-btn,
      .gallery-btn,
      .create-new-btn,
      .close-btn,
      .btn,
      .filter-select,
      .sort-select,
      a[href="index.html"],
      [role="button"]
    `);
    
    clickableElements.forEach(element => {
      element.addEventListener('click', () => {
        soundManager.playClick();
      });
    });
  }
  
  // Initialize
  init();
  
  function init() {
    // Add click sounds to all buttons
    addClickSoundToButtons();
    
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
        changeViewMode(mode);
      });
    });
    
    // Add refresh button event listener
    refreshBtn.addEventListener('click', async () => {
      refreshBtn.innerHTML = '<i class="ti ti-loader ti-spin"></i>';
      refreshBtn.disabled = true;
      
      await fetchImages();
      
      refreshBtn.innerHTML = '<i class="ti ti-refresh"></i>';
      refreshBtn.disabled = false;
      
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
        
        applyFilters();
        
        // Show helpful message if no images
        if (images.length === 0 && data.message) {
          showEmptyState(data.message);
        }
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
      if (!query) return true;
      
      if (image.prompt && image.prompt.toLowerCase().includes(query)) {
        return true;
      }
      
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
    
    renderGallery();
  }
  
  // Filter images based on search query
  function filterImages() {
    applyFilters();
  }
  
  // Render image gallery
  function renderGallery() {
    imageGallery.innerHTML = '';
    
    if (filteredImages.length === 0) {
      showEmptyState();
      return;
    }
    
    imageGallery.className = `image-gallery ${viewMode}-view`;
    imageGallery.removeAttribute('style');
    
    filteredImages.forEach((image, index) => {
      const card = createImageCard(image);
      card.style.position = 'relative';
      card.style.zIndex = '1';
      
      imageGallery.appendChild(card);
      
      setTimeout(() => {
        card.classList.add('fade-in');
      }, index * 50);
    });
    
    // Re-add click sounds to any new buttons
    addClickSoundToButtons();
  }
  
  // Create image card element
  function createImageCard(image) {
    const card = document.createElement('div');
    card.className = 'image-card';
    card.setAttribute('data-id', image.id || '');
    card.setAttribute('data-timestamp', image.createdAt || '');
    
    // Add click sound to image card
    card.addEventListener('click', () => {
      soundManager.playClick();
      showImageDetails(image);
    });
    
    const isFavorite = favorites.includes(image.id || image.filename);
    if (isFavorite) {
      card.classList.add('favorite');
    }
    
    if (viewMode === 'grid') {
      const img = document.createElement('img');
      img.className = 'card-image';
      
      const imagePath = (image.localPath || image.url);
      img.src = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
      img.alt = image.prompt || 'Generated image';
      img.loading = 'lazy';
      
      img.onerror = function() {
        const parent = this.parentElement;
        this.style.display = 'none';
        
        const placeholder = document.createElement('div');
        placeholder.className = 'card-placeholder';
        placeholder.innerHTML = '<i class="ti ti-photo-off"></i>';
        parent.appendChild(placeholder);
      };
      
      card.appendChild(img);
    } else {
      const img = document.createElement('img');
      img.className = 'card-image';
      
      const imagePath = (image.localPath || image.url);
      img.src = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
      img.alt = image.prompt || 'Generated image';
      img.loading = 'lazy';
      
      img.onerror = function() {
        const parent = this.parentElement;
        this.style.display = 'none';
        
        const placeholder = document.createElement('div');
        placeholder.className = 'card-placeholder';
        placeholder.innerHTML = '<i class="ti ti-photo-off"></i>';
        parent.insertBefore(placeholder, parent.firstChild);
      };
      
      const content = document.createElement('div');
      content.className = 'card-content';
      
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
    
    addClickSoundToButtons();
  }
  
  // Change view mode (grid or list)
  function changeViewMode(mode) {
    viewMode = mode;
    
    viewButtons.forEach(btn => {
      if (btn.getAttribute('data-view') === mode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    
    renderGallery();
  }
  
  // Show image details in modal
  function showImageDetails(image) {
    selectedImage = image;
    
    const imagePath = (image.localPath || image.url);
    const fixedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    
    modalImage.src = fixedPath;
    modalPrompt.textContent = image.prompt || 'No prompt available';
    modalDate.textContent = formatDate(image.createdAt);
    
    const isImageFavorite = favorites.includes(image.id || image.filename);
    if (isImageFavorite) {
      favoriteBtn.innerHTML = '<i class="ti ti-star-filled"></i> Remove from Favorites';
      favoriteBtn.classList.add('active');
    } else {
      favoriteBtn.innerHTML = '<i class="ti ti-star"></i> Add to Favorites';
      favoriteBtn.classList.remove('active');
    }
    
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
    
    modalImageTitle.textContent = image.prompt ? 
      (image.prompt.length > 40 ? image.prompt.substring(0, 40) + '...' : image.prompt) : 
      'Image Details';
    
    if (image.localPath) {
      downloadBtn.href = image.localPath;
      downloadBtn.download = image.filename || 'generated-image.png';
      downloadBtn.style.display = 'flex';
    } else {
      downloadBtn.style.display = 'none';
    }
    
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
        images = images.filter(img => img.id !== selectedImage.id);
        filteredImages = filteredImages.filter(img => img.id !== selectedImage.id);
        
        const index = favorites.indexOf(selectedImage.id);
        if (index !== -1) {
          favorites.splice(index, 1);
          saveFavorites();
        }
        
        hideModal();
        renderGallery();
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
      favorites.push(imageId);
      favoriteBtn.innerHTML = '<i class="ti ti-star-filled"></i> Remove from Favorites';
      favoriteBtn.classList.add('active');
      showToast('Added to favorites', 'success');
    } else {
      favorites.splice(index, 1);
      favoriteBtn.innerHTML = '<i class="ti ti-star"></i> Add to Favorites';
      favoriteBtn.classList.remove('active');
      showToast('Removed from favorites', 'success');
    }
    
    saveFavorites();
    
    if (filterSelect.value === 'favorite') {
      applyFilters();
    } else {
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
    
    setTimeout(() => {
      toast.classList.add('show');
      
      setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    }, 10);
  }
});