// Simple fixes for viewer page issues
document.addEventListener('DOMContentLoaded', () => {
  console.log('Simple fixes loaded');

  // 1. Fix for handling image timestamps in client-side sorting
  const originalSortMethod = Array.prototype.sort;
  
  // Wait a bit to ensure the original code has run
  setTimeout(() => {
    // Log the current timestamps for debugging
    const gallery = document.getElementById('imageGallery');
    if (gallery) {
      const cards = gallery.querySelectorAll('.image-card');
      if (cards.length > 0) {
        console.log('Current image cards and timestamps:');
        cards.forEach(card => {
          console.log(`- ${card.getAttribute('data-timestamp')}`);
        });
      }
    }
  }, 1000);
  
  // 2. Fix for list view toggle
  const viewButtons = document.querySelectorAll('.view-btn');
  if (viewButtons.length > 0) {
    viewButtons.forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent event bubbling
        
        const mode = this.getAttribute('data-view');
        console.log('Additional handler: Changing view mode to:', mode);
        
        // Update active button state
        viewButtons.forEach(otherBtn => {
          otherBtn.classList.toggle('active', otherBtn === this);
        });
        
        // Update gallery class directly
        const gallery = document.getElementById('imageGallery');
        if (gallery) {
          if (mode === 'list') {
            gallery.classList.remove('grid-view');
            gallery.classList.add('list-view');
          } else {
            gallery.classList.remove('list-view');
            gallery.classList.add('grid-view');
          }
          console.log('Gallery classes updated:', gallery.className);
        }
      });
    });
  }
});
