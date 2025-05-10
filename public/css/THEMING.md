# Theming System

The application uses a CSS variables-based theming system defined in the Settings layer of the ITCSS architecture.

## Light Theme (Current)

The light theme is defined in `1-settings/theme-light.css` and uses a neumorphic design style. Key characteristics:

- Light background with subtle shadows
- Clean text with good contrast
- Soft shadows for depth and dimension
- Purple accent colors

## Variables Structure

The theme defines the following variable categories:

### Base Colors
```css
--bg-color: #e6e7ee;
--element-bg: #e6e7ee;
--text-color: #44476a;
--text-muted: #7e84a3;
```

### Primary Colors
```css
--primary-color: #7e57c2;
--primary-dark: #673ab7;
--primary-light: #b39ddb;
```

### Accent Colors
```css
--success-color: #10b981;
--danger-color: #ef4444;
```

### Shadow Effects
```css
--shadow-light: 6px 6px 12px rgba(195, 195, 195, 0.5);
--shadow-dark: -6px -6px 12px rgba(255, 255, 255, 0.8);
--shadow-inset-light: inset 4px 4px 8px rgba(195, 195, 195, 0.5);
--shadow-inset-dark: inset -4px -4px 8px rgba(255, 255, 255, 0.8);
```

### UI Elements
```css
--border-color: #d1d9e6;
--border-radius: 12px;
--btn-radius: 25px;
```

### Animations
```css
--transition: all 0.3s ease;
--transition-fast: 0.2s ease;
--transition-normal: 0.3s ease;
--transition-slow: 0.5s ease;
```

### Spacing
```css
--spacing-xs: 0.25rem;
--spacing-sm: 0.5rem;
--spacing-md: 1rem;
--spacing-lg: 1.5rem;
--spacing-xl: 2rem;
```

## Adding New Themes

To add a new theme:

1. Create a new file in the `1-settings` directory (e.g., `theme-dark.css`)
2. Define all the same variables as in the light theme, but with your preferred values
3. In `1-settings/index.css`, comment out the current theme import and add your new theme

For example:
```css
/* Import theme variables - Only one theme should be active */
/* @import './theme-light.css'; */  /* Light theme (commented out) */
@import './theme-dark.css';  /* Dark theme (now active) */
```

## Best Practices

- Always use CSS variables for colors, spacing, animations, etc.
- Never hardcode values that should be themeable
- Test any theme changes across all components
- Consider adding a theme toggle if supporting multiple themes
