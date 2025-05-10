# ITCSS Architecture

This project follows the Inverted Triangle CSS (ITCSS) methodology, which organizes CSS files in a way that:

1. Prevents specificity issues
2. Organizes code in a logical, maintainable structure
3. Reduces the need for `!important` declarations

## Directory Structure

The CSS is organized into the following layers (from generic to specific):

### 1. Settings

Variables, theme configurations, and other global settings that don't output any CSS themselves.

```
/1-settings/
  - theme-neumorphism.css (theme variables)
  - variables.css (global variables)
  - index.css (imports all settings files)
```

### 2. Tools

Mixins and functions (if any).

```
/2-tools/
  - index.css (currently empty, would contain mixins and functions)
```

### 3. Generic

Reset/normalize styles, box-sizing, and other high-level defaults.

```
/3-generic/
  - reset.css (normalize and basic resets)
  - migrated-generic.css (generic styles extracted from the original codebase)
  - index.css (imports all generic files)
```

### 4. Elements

Unclassed HTML element base styles.

```
/4-elements/
  - base.css (basic HTML elements)
  - images.css (image element styles)
  - index.css (imports all element files)
```

### 5. Objects

Layout objects and non-cosmetic design patterns.

```
/5-objects/
  - layouts.css (layout structures)
  - migrated-objects.css (layout objects extracted from the original codebase)
  - index.css (imports all object files)
```

### 6. Components

Specific UI components.

```
/6-components/
  - buttons.css (all button styles)
  - cards.css (card components)
  - forms.css (form elements)
  - feedback.css (toast, loading, and other feedback elements)
  - bubble-loader.css (bubble animation styles)
  - custom-loader.css (washing machine animation)
  - custom-buttons.css (specialized button styles)
  - branding.css (app title styling)
  - migrated-components.css (components extracted from the original codebase)
  - index.css (imports all component files)
```

### 7. Utilities

Utilities and helper classes with the ability to override anything before them.

```
/7-utilities/
  - utils.css (utility classes)
  - spacing.css (margin and padding utilities)
  - migrated-utilities.css (utility classes extracted from the original codebase)
  - index.css (imports all utility files)
```

## How to Use

All CSS files are imported through a single main.css file:

```css
/* Import order matters in ITCSS - from generic to specific */
@import './1-settings/index.css';
@import './2-tools/index.css';
@import './3-generic/index.css';
@import './4-elements/index.css';
@import './5-objects/index.css';
@import './6-components/index.css';
@import './7-utilities/index.css';
```

Each layer has its own index.css file that imports all CSS files within that layer.

## Adding New Styles

When adding new styles:

1. Determine which layer the style belongs to
2. Add the style in an appropriate file within that layer
3. If creating a new file, add it to the layer's index.css

## Benefits

- No more `!important` declarations needed
- Clear separation of concerns
- Easier maintenance and updates
- Better performance by reducing specificity conflicts
- More modular and reusable code