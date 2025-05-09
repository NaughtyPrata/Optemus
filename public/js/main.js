// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
  const promptForm = document.getElementById('promptForm');
  const promptInput = document.getElementById('prompt');
  const generateBtn = document.getElementById('generateBtn');
  const imageContainer = document.getElementById('imageContainer');
  const placeholder = document.getElementById('placeholder');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const saveImageBtn = document.getElementById('saveImageBtn');
  
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
  saveImageBtn.addEventListener('click', handleSaveImage);
  
  // Initially disable the save button
  saveImageBtn.disabled = true;
  saveImageBtn.style.opacity = '0.5';
  saveImageBtn.style.cursor = 'not-allowed';

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
        
        // Disable save button for multi-image display to avoid confusion
        // User can download individual images from the gallery instead
        if (currentImages.length > 1) {
          saveImageBtn.disabled = true;
          saveImageBtn.style.opacity = '0.5';
          saveImageBtn.style.cursor = 'not-allowed';
          saveImageBtn.innerHTML = '<i class="ti ti-photo"></i> View in Gallery';
          saveImageBtn.onclick = () => window.location.href = 'viewer.html';
        } else {
          saveImageBtn.disabled = false;
          saveImageBtn.style.opacity = '1';
          saveImageBtn.style.cursor = 'pointer';
          saveImageBtn.innerHTML = '<i class="ti ti-device-floppy"></i> Save Image';
          saveImageBtn.onclick = handleSaveImage;
        }
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
    // Hide placeholder
    placeholder.classList.add('hidden');
    
    // Remove any existing image wrappers
    const existingWrappers = document.querySelectorAll('.image-wrapper');
    existingWrappers.forEach(wrapper => wrapper.remove());
    
    // If there are no images, show placeholder
    if (!images || images.length === 0) {
      placeholder.classList.remove('hidden');
      return;
    }
    
    // Set the appropriate layout
    updateImageContainerLayout(images.length.toString());
    
    // Create a wrapper for all images
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
      
      // Add click event to show image details or download
      img.addEventListener('click', () => {
        console.log(`Image ${index + 1} clicked: ${imageData.filename}`);
        // Open image download link
        window.open(`/api/download/${imageData.filename}`, '_blank');
      });
      
      // Add hover effect to show the image is clickable
      imgWrapper.addEventListener('mouseenter', () => {
        const downloadIcon = document.createElement('div');
        downloadIcon.className = 'download-icon';
        downloadIcon.innerHTML = '<i class="ti ti-download"></i>';
        imgWrapper.appendChild(downloadIcon);
      });
      
      imgWrapper.addEventListener('mouseleave', () => {
        const downloadIcon = imgWrapper.querySelector('.download-icon');
        if (downloadIcon) {
          downloadIcon.remove();
        }
      });
      
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
      generateBtn.innerHTML = '<i class="ti ti-loader ti-spin"></i> Generating...';
      // Disable save button during generation
      saveImageBtn.disabled = true;
      saveImageBtn.style.opacity = '0.5';
      saveImageBtn.style.cursor = 'not-allowed';
    } else {
      loadingIndicator.classList.add('hidden');
      generateBtn.innerHTML = '<i class="ti ti-sparkles"></i> Generate';
    }
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
    targets: '.btn-primary',
    scale: [0.9, 1],
    opacity: [0, 1],
    duration: 600
  }, '-=200').add({
    targets: '.placeholder',
    opacity: [0, 1],
    duration: 800
  }, '-=400');
}); 