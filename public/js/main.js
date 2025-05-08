// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
  const promptForm = document.getElementById('promptForm');
  const promptInput = document.getElementById('prompt');
  const qualitySelect = document.getElementById('quality');
  const generateBtn = document.getElementById('generateBtn');
  const imageContainer = document.getElementById('imageContainer');
  const placeholder = document.getElementById('placeholder');
  const loadingIndicator = document.getElementById('loadingIndicator');
  
  // Size buttons
  const sizeButtons = document.querySelectorAll('.size-btn');
  let selectedSize = "1024x1024"; // Default size

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

  // State
  let isGenerating = false;
  let currentImage = null;

  // Event Listeners
  promptForm.addEventListener('submit', handleFormSubmit);

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
        quality: qualitySelect.value
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
        throw new Error(data.error || 'Failed to generate image');
      }
      
      // Track current image
      currentImage = {
        url: data.image,
        localPath: data.localImage || null,
        filename: data.filename
      };
      
      // Display the image
      displayImage(data.image);
      
      // Success animation
      animateSuccess();
      
    } catch (error) {
      console.error('Generation error:', error);
      showError(error.message || 'An error occurred while generating the image');
    } finally {
      setLoadingState(false);
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
    
    // Add download button
    if (currentImage && currentImage.localPath) {
      const downloadBtn = document.createElement('a');
      downloadBtn.href = currentImage.localPath;
      downloadBtn.download = currentImage.filename;
      downloadBtn.className = 'download-btn';
      downloadBtn.innerHTML = '<i class="ti ti-download"></i>';
      downloadBtn.title = 'Download image';
      imgWrapper.appendChild(downloadBtn);
    }
    
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
    } else {
      loadingIndicator.classList.add('hidden');
      generateBtn.innerHTML = '<i class="ti ti-sparkles"></i> Generate';
    }
  }

  // Show error message
  function showError(message) {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = 'error-toast';
    toast.innerHTML = `
      <i class="ti ti-alert-circle"></i>
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