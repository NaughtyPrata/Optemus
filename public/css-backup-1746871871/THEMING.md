# CSS Theming System

This project now uses a clean, organized theme system based on CSS variables and the ITCSS architecture. This document explains how the theming works and how to maintain it.

## Theme System Overview

The theme system is based on CSS variables defined in the `/1-settings/` layer of the ITCSS architecture:

1. All color values, spacing, shadows, and other visual properties are defined as CSS variables
2. These variables are used throughout the codebase instead of hardcoded values
3. Changing the theme is as simple as switching which theme file is imported

## Available Themes

Currently, there are two themes available:

- **Dark Theme (Active)**: Modern dark UI with indigo accent colors
  - File: `/1-settings/theme-dark.css`
  
- **Neumorphism Theme**: Light UI with soft shadows and purple accent colors
  - File: `/1-settings/theme-neumorphism.css`

## How to Switch Themes

To switch themes, edit the `/1-settings/index.css` file and change which theme is imported:

```css
/* For Dark Theme (Current) */
@import './theme-dark.css';
/* @import './theme-neumorphism.css'; */

/* For Neumorphism Theme */
/* @import './theme-dark.css'; */
@import './theme-neumorphism.css';
```

## Creating a New Theme

To create a new theme:

1. Duplicate one of the existing theme files (e.g., `theme-dark.css`)
2. Rename it to reflect your new theme (e.g., `theme-cyberpunk.css`)
3. Modify the CSS variable values to create your desired visual style
4. Update the imports in `index.css` to use your new theme

## Important Variables

The following variables have the most impact on the visual appearance:

```css
/* Core colors */
--bg-color: #121826;        /* Main background color */
--element-bg: #1e293b;      /* UI element background color */
--text-color: #e2e8f0;      /* Primary text color */
--text-muted: #94a3b8;      /* Secondary/muted text color */

/* Brand/accent colors */
--primary-color: #6366f1;   /* Primary accent color */
--primary-dark: #4f46e5;    /* Darker variant for hover/active states */
--primary-light: #8b92f8;   /* Lighter variant for subtle accents */

/* Shadows (very important for theme feel) */
--shadow-light: ...         /* Outer shadow light side */
--shadow-dark: ...          /* Outer shadow dark side */
--shadow-inset-light: ...   /* Inner shadow light side */
--shadow-inset-dark: ...    /* Inner shadow dark side */
```

## Maintaining the Theme System

When adding new CSS:

1. **Never use hardcoded colors** - always reference the appropriate variable
2. **Add new variables if needed** - for specialized components
3. **Document any new variables** - add them to all theme files

Following these practices will keep the codebase clean and make future theme changes much easier.