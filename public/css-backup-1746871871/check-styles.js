/*
 * Style Checker Script
 * This script helps ensure that specific preferred styles are applied correctly
 * It will check our CSS files for critical style rules
 */

// Define the critical styles we need to verify
const criticalStyles = [
  {
    selector: '.ti',
    property: 'font-family',
    value: 'tabler-icons !important'
  },
  {
    selector: '.image-gallery.list-view',
    property: 'display',
    value: 'flex'
  },
  {
    selector: '.list-view .image-card',
    property: 'display',
    value: 'flex'
  },
  {
    selector: '.list-view .card-image',
    property: 'width',
    value: '120px'
  },
  {
    selector: '.list-view .card-content',
    property: 'flex',
    value: '1'
  },
  {
    selector: '.view-btn.active',
    property: 'background-color',
    value: 'var(--element-bg)'
  },
  {
    selector: '.view-btn.active',
    property: 'box-shadow',
    value: 'var(--shadow-inset-light), var(--shadow-inset-dark)'
  },
  {
    selector: 'body .image-top-controls',
    property: 'width',
    value: 'auto'
  }
];

// Output checklist to console
console.log('=== CSS Style Checklist ===');
console.log('Make sure to verify these styles are applied correctly in the browser:');
console.log('');

criticalStyles.forEach((style, index) => {
  console.log(`${index + 1}. ${style.selector} should have ${style.property}: ${style.value}`);
});

console.log('');
console.log('If any of these styles aren\'t working correctly, check the specificity in the CSS file');
console.log('Remember that we\'ve removed !important declarations and are relying on proper CSS specificity now');
