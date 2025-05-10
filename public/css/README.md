# CSS Architecture

This project uses the **Inverted Triangle CSS (ITCSS)** methodology to organize CSS code in a more maintainable and scalable way.

## Structure

The CSS is organized into layers from low to high specificity:

1. **Settings** (`1-settings/`)
   - Variables and theme configuration
   - Contains the light theme variables

2. **Tools** (`2-tools/`)
   - Mixins and functions (currently empty, for future use)

3. **Generic** (`3-generic/`)
   - Reset and normalization
   - Includes a reset.css that normalizes browser defaults

4. **Elements** (`4-elements/`)
   - Bare HTML element styling (h1, p, a, etc.)
   - Base typographic styles

5. **Objects** (`5-objects/`)
   - Layout and structural patterns
   - Non-cosmetic design patterns

6. **Components** (`6-components/`)
   - UI components with specific styling
   - Includes buttons, forms, cards, etc.

7. **Utilities** (`7-utilities/`)
   - Helper classes with single responsibilities
   - Highest specificity classes

## Usage

All CSS is compiled through the main.css file which imports each layer. To add new styles:

1. Identify which layer your styles belong in
2. Add styles to an existing file in that layer or create a new one
3. If creating a new file, remember to import it in the layer's index.css

## Theming

The project uses CSS custom properties (CSS variables) for theming. The light theme is defined in `1-settings/theme-light.css`.

## Benefits of This Approach

- No more `!important` declarations (eliminated the need for them)
- Clear organization of code by specificity
- Easier maintainability
- Reduced code conflicts
- Better performance
- Cleaner HTML (fewer inline styles)

## How to Extend

To add new components or modify existing ones:

1. Identify which layer they belong to
2. Create/modify the appropriate files
3. Use the cascading nature of CSS to your advantage
4. Keep specificity in mind - higher layers should have higher specificity
