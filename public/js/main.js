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

  // State
  let isGenerating = false;
  let currentImage = null;

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
        stylePreset: selectedStylePreset
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
      
      // Track current image
      currentImage = {
        url: data.image,
        localPath: data.localImage || null,
        filename: data.filename
      };
      
      console.log('Current image data:', currentImage);
      
      // Display the image
      displayImage(data.image);
      
      // Trigger automatic download if we have a filename
      if (data.filename && data.filename !== 'direct_url_image') {
        console.log('Initiating automatic download...');
        // Use the direct download endpoint
        window.location.href = `/api/download/${data.filename}`;
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
    if (!currentImage) return;
    
    // Get image data
    const imageUrl = currentImage.url;
    const prompt = promptInput.value.trim();
    
    if (!imageUrl) {
      showError('No valid image found to save');
      return;
    }
    
    console.log('Saving image to project folder...');
    
    try {
      console.log('Current image object:', { ...currentImage, url: currentImage.url ? (currentImage.url.length > 50 ? currentImage.url.substring(0, 50) + '...' : currentImage.url) : 'undefined' });
      
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
      
      // Update current image with saved data
      currentImage = {
        ...currentImage,
        ...result.image
      };
      
      console.log('Image saved successfully:', result.image);
      showSuccess(`Image saved to project folder: ${result.image.filename}`);
    } catch (error) {
      console.error('Error saving image:', error);
      showError(`Failed to save image: ${error.message}`);
    }
  }
  
  // Display the generated image
  function displayImage(imageUrl) {
    // Hide placeholder
    placeholder.classList.add('hidden');
    
    // Remove any existing image
    const existingImage = document.getElementById('resultWrapper');
    if (existingImage) {
      existingImage.remove();
    }
    
    // Create and add new image
    const imgWrapper = document.createElement('div');
    imgWrapper.id = 'resultWrapper';
    imgWrapper.className = 'image-wrapper';
    
    const img = document.createElement('img');
    img.id = 'resultImage';
    img.className = 'result-image';
    img.alt = 'Generated image';
    img.src = imageUrl;
    
    imgWrapper.appendChild(img);
    imageContainer.appendChild(imgWrapper);
    
    // Enable the save button
    saveImageBtn.disabled = false;
    saveImageBtn.style.opacity = '1';
    saveImageBtn.style.cursor = 'pointer';
    
    // Animation
    anime({
      targets: imgWrapper,
      opacity: [0, 1],
      scale: [0.9, 1],
      easing: 'easeOutElastic(1, .6)',
      duration: 800
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