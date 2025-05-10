// Only adds bubble elements to the background
// Does not modify the existing washing machine animation

document.addEventListener('DOMContentLoaded', () => {
  const loadingIndicator = document.getElementById('loadingIndicator');
  
  // Function to create and add bubbles
  function createBubbles() {
    // Remove any existing bubble container
    const existingContainer = loadingIndicator.querySelector('.bubble-container');
    if (existingContainer) {
      loadingIndicator.removeChild(existingContainer);
    }
    
    // Create a container for bubbles
    const bubbleContainer = document.createElement('div');
    bubbleContainer.className = 'bubble-container';
    
    // Create 5 bubbles with spans inside (as per the CSS)
    for (let i = 1; i <= 5; i++) {
      const bubble = document.createElement('div');
      bubble.className = 'bubble';
      
      // Add 5 spans inside each bubble
      for (let j = 1; j <= 5; j++) {
        const span = document.createElement('span');
        bubble.appendChild(span);
      }
      
      bubbleContainer.appendChild(bubble);
    }
    
    // Insert bubble container as the first element in the loading indicator
    // This ensures it's behind the washing machine animation
    loadingIndicator.insertBefore(bubbleContainer, loadingIndicator.firstChild);
  }
  
  // Create bubbles on page load
  createBubbles();
  
  // Create bubbles when the loading indicator becomes visible
  // Use a MutationObserver to watch for class changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class') {
        if (!loadingIndicator.classList.contains('hidden')) {
          createBubbles();
        }
      }
    });
  });
  
  observer.observe(loadingIndicator, { attributes: true });
});
</function_parameters>
</invoke>