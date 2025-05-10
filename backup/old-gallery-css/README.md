# Legacy Gallery CSS Files

These files were moved here on May 10, 2025 as part of a CSS cleanup effort.

## Reason for Removal

The gallery styling was spread across multiple CSS files, causing conflicts and overlapping issues with the image gallery in the viewer page. These files have been consolidated into a single `gallery.css` file in the components directory that follows proper ITCSS architecture.

## Files in this Directory

- `gallery-fix.css.bak` - Original attempt to fix gallery layout issues
- `gallery-grid-fix.css.bak` - Subsequent attempt to fix grid layout
- `gallery-overlap-fix.css.bak` - Final attempt to fix image overlapping before consolidation

## Current Implementation

The current gallery styling is implemented in:
`/public/css/6-components/gallery.css`

This file contains all gallery-related styles properly organized with sectioned comments.
