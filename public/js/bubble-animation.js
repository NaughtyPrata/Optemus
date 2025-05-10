// Bubble Animation using Anime.js
document.addEventListener('DOMContentLoaded', () => {
  // References to elements
  const loadingIndicator = document.getElementById('loadingIndicator');
  const bubbleContainer = document.querySelector('.bubble-container');
  const backgroundBubbles = document.querySelector('.background-bubbles');
  const waterWave = document.querySelector('.water-wave');

  // Function to create bubbles inside the washing machine
  function createBubbles(count) {
    bubbleContainer.innerHTML = ''; // Clear existing bubbles
    
    for (let i = 0; i < count; i++) {
      const bubble = document.createElement('div');
      bubble.className = 'bubble';
      bubble.style.width = Math.random() * 20 + 10 + 'px';
      bubble.style.height = bubble.style.width;
      bubble.style.left = Math.random() * 100 + '%';
      bubble.style.top = Math.random() * 100 + '%';
      bubbleContainer.appendChild(bubble);
    }
  }

  // Function to create background bubbles
  function createBackgroundBubbles(count) {
    backgroundBubbles.innerHTML = ''; // Clear existing bubbles
    
    for (let i = 0; i < count; i++) {
      const bubble = document.createElement('div');
      bubble.className = 'bg-bubble';
      bubble.style.width = Math.random() * 50 + 20 + 'px';
      bubble.style.height = bubble.style.width;
      bubble.style.left = Math.random() * 100 + '%';
      bubble.style.top = Math.random() * 100 + 20 + '%';
      bubble.style.opacity = Math.random() * 0.5 + 0.1;
      backgroundBubbles.appendChild(bubble);
    }
  }

  // Function to animate washing machine water
  function animateWater() {
    anime({
      targets: waterWave,
      translateY: [
        { value: 5, duration: 800 },
        { value: -5, duration: 800 }
      ],
      translateX: [
        { value: -7, duration: 1200 },
        { value: 7, duration: 1200 }
      ],
      easing: 'easeInOutSine',
      direction: 'alternate',
      loop: true
    });
  }

  // Function to animate machine rotation
  function animateMachine() {
    anime({
      targets: '.machine-window',
      rotate: [
        { value: '5deg', duration: 1500, easing: 'easeInOutQuad' },
        { value: '-5deg', duration: 1500, easing: 'easeInOutQuad' },
        { value: '3deg', duration: 1200, easing: 'easeInOutQuad' },
        { value: '-3deg', duration: 1200, easing: 'easeInOutQuad' },
        { value: '0deg', duration: 800, easing: 'easeInOutQuad' }
      ],
      loop: true
    });
  }

  // Function to animate bubbles inside washing machine
  function animateBubbles() {
    anime({
      targets: '.bubble',
      translateY: (el) => {
        return [-100 - parseFloat(el.style.top), -20 - parseFloat(el.style.top)];
      },
      translateX: (el) => {
        return [anime.random(-20, 20), anime.random(-30, 30)];
      },
      opacity: [0, 0.7, 0],
      scale: [0.5, 1],
      easing: 'easeOutCubic',
      duration: () => anime.random(1200, 3000),
      delay: () => anime.random(0, 1000),
      complete: function(anim) {
        // Recreate and reanimate the bubbles when complete
        createBubbles(15);
        animateBubbles();
      }
    });
  }

  // Function to animate background bubbles
  function animateBackgroundBubbles() {
    anime({
      targets: '.bg-bubble',
      translateY: (el) => {
        return [100, -parseFloat(el.style.top) - 100];
      },
      translateX: (el) => {
        return [anime.random(-40, 40), anime.random(-60, 60)];
      },
      opacity: (el) => {
        return [parseFloat(el.style.opacity), 0];
      },
      scale: [0.8, 1.5],
      easing: 'easeOutCubic',
      duration: () => anime.random(5000, 10000),
      delay: () => anime.random(0, 3000),
      complete: function(anim) {
        // Only recreate if the loading indicator is visible
        if (!loadingIndicator.classList.contains('hidden')) {
          createBackgroundBubbles(12);
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
          initializeAnimations();
        }
      }
    });
  });

  observer.observe(loadingIndicator, { attributes: true });

  // Function to initialize all animations
  function initializeAnimations() {
    createBubbles(15);
    createBackgroundBubbles(12);
    animateWater();
    animateMachine();
    animateBubbles();
    animateBackgroundBubbles();
  }

  // If loadingIndicator is already visible at page load, initialize animations
  if (!loadingIndicator.classList.contains('hidden')) {
    initializeAnimations();
  }
});
</function_parameters>
</invoke>