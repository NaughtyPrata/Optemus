// Sound Manager
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
    
    // Preload loading sound (washing machine) - will be set in DOM ready
    this.sounds.loading = null;
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
  
  playLoading() {
    if (this.isMuted || !this.sounds.loading) return;
    
    try {
      this.sounds.loading.currentTime = 0;
      this.sounds.loading.volume = 0.4;
      this.sounds.loading.play().catch(e => console.log('Could not play loading sound:', e));
    } catch (error) {
      console.log('Error playing loading sound:', error);
    }
  }
  
  stopLoading() {
    if (!this.sounds.loading) return;
    
    // Fade out and stop the sound
    const fadeOutInterval = setInterval(() => {
      if (!this.isMuted && this.sounds.loading.volume > 0.05) {
        this.sounds.loading.volume -= 0.05;
      } else {
        this.sounds.loading.pause();
        clearInterval(fadeOutInterval);
      }
    }, 50);
  }
  
  mute() {
    this.isMuted = true;
    if (this.sounds.loading) {
      this.sounds.loading.volume = 0;
    }
  }
  
  unmute() {
    this.isMuted = false;
    if (this.sounds.loading) {
      this.sounds.loading.volume = 0.4;
    }
    
    // Play a confirmation sound
    this.playClick();
  }
  
  isSoundMuted() {
    return this.isMuted;
  }
}

// Initialize Sound Manager
const soundManager = new SoundManager();

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
  // Fix position of top controls - debugging only, CSS should handle the positioning
  const topControls = document.querySelector('.image-top-controls');
  if (topControls) {
    // Log current styles for debugging
    console.log('Top controls computed styles:', {
      display: window.getComputedStyle(topControls).display,
      position: window.getComputedStyle(topControls).position,
      top: window.getComputedStyle(topControls).top,
      right: window.getComputedStyle(topControls).right,
      width: window.getComputedStyle(topControls).width,
      justifyContent: window.getComputedStyle(topControls).justifyContent
    });
  }
  
  const promptForm = document.getElementById('promptForm');
  const promptInput = document.getElementById('prompt');
  const generateBtn = document.getElementById('generateBtn');
  const imageContainer = document.getElementById('imageContainer');
  const placeholder = document.getElementById('placeholder');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const loadingSound = document.getElementById('loadingSound');
  const newSoundToggle = document.getElementById('newSoundToggle');
  const saveImageBtn = document.getElementById('saveImageBtn');
  
  // Set up loading sound reference in sound manager
  soundManager.sounds.loading = loadingSound;
  if (loadingSound) {
    loadingSound.volume = 0.4;
  }
  
  // Size buttons
  const sizeButtons = document.querySelectorAll('.size-btn');
  let selectedSize = "1024x1024"; // Default size

  // Quality buttons
  const qualityButtons = document.querySelectorAll('.quality-btn');
  let selectedQuality = "low"; // Default to low

  // Style Type buttons
  const styleTypeButtons = document.querySelectorAll('.style-type-btn');
  let selectedStyleType = "dark"; // Default to dark

  // Style Preset buttons
  const stylePresetButtons = document.querySelectorAll('.style-preset-btn');
  let selectedStylePreset = "internal"; // Default to internal

  // Image Count buttons
  const countButtons = document.querySelectorAll('.count-btn');
  let selectedCount = "1"; // Default to 1 image

  // Add universal click sound to all buttons
  function addClickSoundToButtons() {
    // Get all buttons and links that should have click sounds
    const clickableElements = document.querySelectorAll(`
      button,
      .button,
      .size-btn,
      .quality-btn,
      .style-type-btn,
      .style-preset-btn,
      .count-btn,
      .new-sound-toggle,
      .gallery-btn,
      .help-link,
      a[class*="btn"],
      [role="button"]
    `);
    
    console.log(`Found ${clickableElements.length} clickable elements for sound:`, clickableElements);
    
    clickableElements.forEach(element => {
      element.addEventListener('click', () => {
        console.log('Playing click sound for:', element.className || element.tagName);
        soundManager.playClick();
      });
    });
  }

  // Add click event to size buttons
  sizeButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons
      sizeButtons.forEach(btn => btn.classList.remove('active'));
      // Add active class to clicked button
      button.classList.add('active');
      // Update selected size
      selectedSize = button.getAttribute('data-size');
    });
  });

  // Add click event to quality buttons
  qualityButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons
      qualityButtons.forEach(btn => btn.classList.remove('active'));
      // Add active class to clicked button
      button.classList.add('active');
      // Update selected quality
      selectedQuality = button.getAttribute('data-quality');
    });
  });

  // Add click event to style type buttons
  styleTypeButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons
      styleTypeButtons.forEach(btn => btn.classList.remove('active'));
      // Add active class to clicked button
      button.classList.add('active');
      // Update selected style type
      selectedStyleType = button.getAttribute('data-style-type');
    });
  });

  // Add click event to style preset buttons
  stylePresetButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons
      stylePresetButtons.forEach(btn => btn.classList.remove('active'));
      // Add active class to clicked button
      button.classList.add('active');
      // Update selected style preset
      selectedStylePreset = button.getAttribute('data-style-preset');
    });
  });
  
  // Add click event to count buttons
  countButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons
      countButtons.forEach(btn => btn.classList.remove('active'));
      // Add active class to clicked button
      button.classList.add('active');
      // Update selected count
      selectedCount = button.getAttribute('data-count');
      
      // Update the image container layout based on count
      updateImageContainerLayout(selectedCount);
    });
  });

  // State
  let isGenerating = false;
  let currentImages = []; // Array to hold multiple images

  // Event Listeners
  generateBtn.addEventListener('click', handleFormSubmit);
  
  // New Sound toggle handler
  newSoundToggle.addEventListener('click', () => {
    // Play click sound first (before muting/unmuting)
    if (!soundManager.isSoundMuted()) {
      soundManager.playClick();
    }
    
    if (soundManager.isSoundMuted()) {
      // Unmute
      soundManager.unmute();
      newSoundToggle.classList.remove('muted');
      newSoundToggle.querySelector('.sound-icon').textContent = '🔊';
      newSoundToggle.title = "Mute Sound";
    } else {
      // Mute
      soundManager.mute();
      newSoundToggle.classList.add('muted');
      newSoundToggle.querySelector('.sound-icon').textContent = '🔇';
      newSoundToggle.title = "Unmute Sound";
    }
  });

  // Form submission handler
  async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (isGenerating) return;
    
    const prompt = promptInput.value.trim();
    if (!prompt) {
      showError('Please enter a prompt description');
      promptInput.focus();
      return;
    }
    
    // Show loading state
    setLoadingState(true);
    
    try {
      // Get form data
      const formData = {
        prompt: prompt,
        size: selectedSize,
        quality: selectedQuality,
        styleType: selectedStyleType,
        stylePreset: selectedStylePreset,
        count: selectedCount // Add the count parameter
      };
      
      // Log generation attempt
      console.log('Generating image with parameters:', formData);
      
      // Call API
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      // Parse response
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        const errorMsg = data.error || `API error: ${response.status} ${response.statusText}`;
        console.error('API error:', errorMsg);
        throw new Error(errorMsg);
      }
      
      // Track current images
      if (data.images && data.images.length > 0) {
        currentImages = data.images;
        console.log(`Received ${currentImages.length} images:`, currentImages);
        
        // Display the images
        displayImages(currentImages);
        
        // Auto-download the images
        currentImages.forEach((img, index) => {
          if (img.image && img.filename) {
            // Add slight delay between downloads to prevent browser throttling
            setTimeout(async () => {
              console.log(`Auto-downloading image ${index + 1}: ${img.filename}`);
              try {
                // For blob URLs or direct image URLs, we need to fetch and create a blob
                if (img.image.startsWith('http') || img.image.startsWith('blob:')) {
                  const response = await fetch(img.image);
                  const blob = await response.blob();
                  const blobUrl = URL.createObjectURL(blob);
                  
                  const downloadLink = document.createElement('a');
                  downloadLink.href = blobUrl;
                  downloadLink.download = img.filename;
                  downloadLink.style.display = 'none';
                  document.body.appendChild(downloadLink);
                  downloadLink.click();
                  document.body.removeChild(downloadLink);
                  
                  // Clean up the blob URL after a short delay
                  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
                } else if (img.image.startsWith('data:')) {
                  // For base64 images, we can download directly
                  const downloadLink = document.createElement('a');
                  downloadLink.href = img.image;
                  downloadLink.download = img.filename;
                  downloadLink.style.display = 'none';
                  document.body.appendChild(downloadLink);
                  downloadLink.click();
                  document.body.removeChild(downloadLink);
                }
              } catch (error) {
                console.error(`Failed to download image ${index + 1}:`, error);
                // Fallback to the old method if available
                if (img.filename) {
                  const downloadLink = document.createElement('a');
                  downloadLink.href = `/api/download/${img.filename}`;
                  downloadLink.download = img.filename;
                  downloadLink.style.display = 'none';
                  document.body.appendChild(downloadLink);
                  downloadLink.click();
                  document.body.removeChild(downloadLink);
                }
              }
            }, index * 500); // Stagger downloads by 500ms
          }
        });
      } else {
        throw new Error('No images received in response');
      }
      
      // Success animation
      animateSuccess();
      
    } catch (error) {
      console.error('Generation error:', error);
      showError(error.message || 'An error occurred while generating the image');
    } finally {
      setLoadingState(false);
    }
  }

  // Handle save image click
  async function handleSaveImage() {
    if (currentImages.length === 0) return;
    
    // Get image data from the first image (for single image view)
    const imageData = currentImages[0];
    const imageUrl = imageData.image;
    const prompt = promptInput.value.trim();
    
    if (!imageUrl) {
      showError('No valid image found to save');
      return;
    }
    
    console.log('Saving image to project folder...');
    
    try {
      console.log('Current image data:', imageData);
      
      // Prepare the data for server-side saving
      const saveData = {
        prompt: prompt,
        settings: {
          size: selectedSize,
          quality: selectedQuality,
          styleType: selectedStyleType,
          stylePreset: selectedStylePreset
        }
      };
      
      // Determine if we're dealing with a base64 image or URL
      if (imageUrl && imageUrl.startsWith && imageUrl.startsWith('data:image')) {
        // This is a base64 image
        console.log('Detected base64 image, sending to server...');
        saveData.base64Data = imageUrl;
      } else if (imageUrl) {
        // This is a URL
        console.log('Detected URL image, sending to server...');
        saveData.imageUrl = imageUrl;
      } else {
        throw new Error('No valid image data found');
      }
      
      // Call debug endpoint first to figure out what's wrong
      console.log('Sending debug information first...');
      const debugResponse = await fetch('/api/debug-image-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(saveData)
      });
      
      const debugResult = await debugResponse.json();
      console.log('Debug result:', debugResult);
      
      // Now call the save endpoint
      console.log('Now attempting to save the image...');
      const response = await fetch('/api/save-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(saveData)
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to save image');
      }
      
      // Update the first image in currentImages with saved data
      if (currentImages.length > 0) {
        currentImages[0] = {
          ...currentImages[0],
          ...result.image
        };
      }
      
      console.log('Image saved successfully:', result.image);
      showSuccess(`Image saved to project folder: ${result.image.filename}`);
    } catch (error) {
      console.error('Error saving image:', error);
      showError(`Failed to save image: ${error.message}`);
    }
  }
  
  // Update the image container layout based on count
  function updateImageContainerLayout(count) {
    // Remove any existing layout classes
    imageContainer.classList.remove('single-image-layout', 'two-image-layout', 'four-image-layout');
    
    // Add the appropriate layout class
    if (count === '1') {
      imageContainer.classList.add('single-image-layout');
    } else if (count === '2') {
      imageContainer.classList.add('two-image-layout');
    } else if (count === '4') {
      imageContainer.classList.add('four-image-layout');
    }
  }
  
  // Display multiple images
  function displayImages(images) {
    // Clear the image container first
    imageContainer.innerHTML = '';
    
    // If there are no images, show placeholder
    if (!images || images.length === 0) {
      const newPlaceholder = document.createElement('div');
      newPlaceholder.id = 'placeholder';
      newPlaceholder.className = 'placeholder';
      newPlaceholder.innerHTML = `
        <img src="assets/laundry.svg" alt="Laundry" class="placeholder-icon">
        <p>Your generated image will appear here</p>
      `;
      imageContainer.appendChild(newPlaceholder);
      return;
    }
    
    // Set the appropriate layout
    updateImageContainerLayout(images.length.toString());
    
    // Create a wrapper for all images with the correct count class
    const galleryWrapper = document.createElement('div');
    galleryWrapper.className = `gallery-wrapper count-${images.length}`;
    imageContainer.appendChild(galleryWrapper);
    
    // Add each image
    images.forEach((imageData, index) => {
      const imgWrapper = document.createElement('div');
      imgWrapper.className = 'image-wrapper';
      
      const img = document.createElement('img');
      img.className = 'result-image';
      img.alt = `Generated image ${index + 1}`;
      img.src = imageData.image;
      
      imgWrapper.appendChild(img);
      galleryWrapper.appendChild(imgWrapper);
    });
    
    // Animation
    anime({
      targets: '.image-wrapper',
      opacity: [0, 1],
      scale: [0.9, 1],
      easing: 'easeOutElastic(1, .6)',
      duration: 800,
      delay: anime.stagger(100)
    });
  }

  // Set loading state
  function setLoadingState(isLoading) {
    isGenerating = isLoading;
    generateBtn.disabled = isLoading;
    
    if (isLoading) {
      loadingIndicator.classList.remove('hidden');
      // Don't change the fancy button's innerHTML, just disable it
      generateBtn.classList.add('loading-state');
      
      // Start the random bubble appearance animation
      animateBubblesRandomly();
      
      // Play the loading sound
      setTimeout(() => {
        soundManager.playLoading();
      }, 100);
    } else {
      loadingIndicator.classList.add('hidden');
      generateBtn.classList.remove('loading-state');
      
      // Hide all bubbles when loading is complete
      document.querySelectorAll('.bubble').forEach(bubble => {
        bubble.classList.remove('show');
      });
      
      // Stop the loading sound
      soundManager.stopLoading();
    }
  }
  
  // Function to animate bubbles with random delays
  function animateBubblesRandomly() {
    // Get all bubbles
    const bubbles = document.querySelectorAll('.bubble');
    
    // Reset all bubbles (hide them first)
    bubbles.forEach(bubble => {
      bubble.classList.remove('show');
    });
    
    // Generate a random schedule for each bubble
    bubbles.forEach((bubble, index) => {
      // Initial random delay between 0 and 3 seconds
      const initialDelay = Math.random() * 3000;
      
      // Function to handle the bubble's cycle of appearing and disappearing
      const cycleBubble = () => {
        // Only proceed if the loading indicator is still visible
        if (loadingIndicator.classList.contains('hidden')) return;
        
        // Show the bubble
        bubble.classList.add('show');
        
        // Random duration for the bubble to stay visible (between 4 and 10 seconds)
        const visibleDuration = 4000 + Math.random() * 6000;
        
        // Schedule bubble to hide after the visible duration
        setTimeout(() => {
          // Only hide if loading is still happening
          if (!loadingIndicator.classList.contains('hidden')) {
            bubble.classList.remove('show');
            
            // Random timeout before showing again (between 0.5 and 3 seconds)
            const hideDelay = 500 + Math.random() * 2500;
            
            // Schedule the next cycle
            setTimeout(cycleBubble, hideDelay);
          }
        }, visibleDuration);
      };
      
      // Start the first cycle after the initial delay
      setTimeout(cycleBubble, initialDelay);
    });
  }

  // Show error message
  function showError(message) {
    showToast(message, true);
  }
  
  // Show success message
  function showSuccess(message) {
    showToast(message, false);
  }
  
  // Show toast notification
  function showToast(message, isError = false) {
    // Create toast notification
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

  // Success animation using Anime.js
  function animateSuccess() {
    // Add a success indicator
    const successIndicator = document.createElement('div');
    successIndicator.className = 'success-indicator';
    successIndicator.innerHTML = '<i class="ti ti-check"></i>';
    document.body.appendChild(successIndicator);
    
    // Animate it
    anime.timeline({
      duration: 800,
      easing: 'easeOutElastic(1, .6)'
    }).add({
      targets: successIndicator,
      scale: [0, 1],
      opacity: [0, 1]
    }).add({
      targets: successIndicator,
      scale: [1, 0],
      opacity: [1, 0],
      complete: () => successIndicator.remove()
    }, '+=1000');
  }

  // Intro animation
  anime.timeline({
    easing: 'easeOutExpo',
  }).add({
    targets: '.app-title',
    opacity: [0, 1],
    translateY: [20, 0],
    duration: 800
  }).add({
    targets: '.form-group',
    opacity: [0, 1],
    translateY: [20, 0],
    delay: anime.stagger(100),
    duration: 600
  }, '-=400').add({
    targets: '.button',
    scale: [0.9, 1],
    opacity: [0, 1],
    duration: 600
  }, '-=200').add({
    targets: '.placeholder',
    opacity: [0, 1],
    duration: 800
  }, '-=400');
  
  // Initialize audio context for browsers that require user interaction before playing audio
  function initAudio() {
    // Create a context for managing audio (needed for some browsers)
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      const audioContext = new AudioContext();
      // Resume the audio context on user interaction
      document.addEventListener('click', function resumeAudio() {
        if (audioContext.state === 'suspended') {
          audioContext.resume();
        }
        document.removeEventListener('click', resumeAudio);
      }, { once: true });
    }
    
    // Also try to unlock mobile audio
    document.addEventListener('touchstart', function unlockAudio() {
      // Create and play a short silent sound
      const silentSound = document.createElement('audio');
      silentSound.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjM1LjEwNAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAABAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/wAARCAACAAQDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigD//2Q==';
      silentSound.play().catch(() => {});
      document.removeEventListener('touchstart', unlockAudio);
    }, { once: true });
  }
  
  // Call the initAudio function to prepare audio playback
  initAudio();
  
  // Add click sounds to all buttons after a short delay to ensure DOM is ready
  setTimeout(() => {
    addClickSoundToButtons();
  }, 100);
});
