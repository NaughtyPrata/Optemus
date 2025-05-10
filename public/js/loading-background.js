// Background bubbles animation for loading screen
// Only modifies the background, preserves the existing washing machine animation

document.addEventListener('DOMContentLoaded', () => {
  const loadingIndicator = document.getElementById('loadingIndicator');
  
  // Create a container for background bubbles if it doesn't exist
  if (!document.querySelector('.background-bubbles')) {
    const backgroundBubbles = document.createElement('div');
    backgroundBubbles.className = 'background-bubbles';
    // Insert as first child so it's behind everything else
    loadingIndicator.insertBefore(backgroundBubbles, loadingIndicator.firstChild);
  }
  
  const backgroundBubbles = document.querySelector('.background-bubbles');
  
  // Function to create background bubbles
  function createBackgroundBubbles(count) {
    // Clear existing bubbles
    backgroundBubbles.innerHTML = '';
    
    for (let i = 0; i < count; i++) {
      const bubble = document.createElement('div');
      bubble.className = 'bg-bubble';
      
      // Random size between 20-70px
      const size = Math.random() * 50 + 20;
      bubble.style.width = size + 'px';
      bubble.style.height = size + 'px';
      
      // Random position
      bubble.style.left = Math.random() * 100 + '%';
      bubble.style.top = Math.random() * 100 + 20 + '%';
      
      // Random opacity
      bubble.style.opacity = Math.random() * 0.5 + 0.1;
      
      backgroundBubbles.appendChild(bubble);
    }
  }
  
  // Function to animate background bubbles
  function animateBackgroundBubbles() {
    anime({
      targets: '.bg-bubble',
      translateY: (el) => {
        return [anime.random(100, 200), -parseFloat(el.style.top) - 100];
      },
      translateX: (el) => {
        return [anime.random(-40, 40), anime.random(-60, 60)];
      },
      opacity: (el) => {
        return [parseFloat(el.style.opacity), 0];
      },
      scale: [0.8, 1.5],
      easing: 'easeOutCubic',
      duration: () => anime.random(5000, 12000),
      delay: () => anime.random(0, 3000),
      complete: function(anim) {
        // Only recreate if the loading indicator is visible
        if (!loadingIndicator.classList.contains('hidden')) {
          createBackgroundBubbles(15);
          animateBackgroundBubbles();
        }
      }
    });
  }
  
  // Initialize animations when loading indicator is shown
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class') {
        if (!loadingIndicator.classList.contains('hidden')) {
          createBackgroundBubbles(15);
          animateBackgroundBubbles();
        }
      }
    });
  });
  
  observer.observe(loadingIndicator, { attributes: true });
  
  // If loadingIndicator is already visible at page load, initialize animations
  if (!loadingIndicator.classList.contains('hidden')) {
    createBackgroundBubbles(15);
    animateBackgroundBubbles();
  }
});
</function_parameters>
</invoke>