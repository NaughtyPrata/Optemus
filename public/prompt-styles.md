# Prompt Styling System

This document explains how prompts are constructed in the Image Generator based on your selected style presets and types.

## How It Works

The final prompt sent to the AI image generator is a combination of:

```
User Prompt + Style Preset + Style Type = Final Output
```

## Style Types

There are two style types available, each adding specific qualities to your image:

### Dark
- Adds: **"dark mood, dark lighting, dramatic shadows"**
- Best for: Creating moody, atmospheric images with contrast and depth
- Works well with: Product photography, creative concepts, architectural shots

### Light
- Adds: **"bright lighting, soft light, well lit"**
- Best for: Clean, clear imagery with good visibility of details
- Works well with: Product displays, informational graphics, daytime scenes

## Style Presets

There are three style presets available, each tailored for different use cases:

### General
- Adds: **"balanced composition, natural look"**
- Purpose: All-purpose imagery with a balanced, realistic appearance
- Best for: General use cases where a neutral, realistic style is needed
- Examples: Documentation, reference images, general illustrations

### Internal
- Adds: **"professional corporate style, clean detailed look"**
- Purpose: Professional-grade imagery for internal business communication
- Best for: Presentations to colleagues, internal documentation, team resources
- Examples: Meeting slides, internal documents, reporting graphics

### Proposals
- Adds: **"presentation quality, high detail, professional look"**
- Purpose: High-quality imagery for client-facing or external communication
- Best for: Client proposals, marketing materials, public-facing content
- Examples: Sales decks, proposals, marketing imagery, portfolio pieces

## Example Combinations

Here are examples of how your prompts are transformed:

| User Prompt | Style Preset | Style Type | Final Prompt Sent to AI |
|-------------|--------------|------------|--------------------------|
| "mountain landscape" | General | Light | "mountain landscape, balanced composition, natural look, bright lighting, soft light, well lit" |
| "office desk with laptop" | Internal | Dark | "office desk with laptop, professional corporate style, clean detailed look, dark mood, dark lighting, dramatic shadows" |
| "product showcase for shoes" | Proposals | Light | "product showcase for shoes, presentation quality, high detail, professional look, bright lighting, soft light, well lit" |

## Tips for Best Results

1. **Be specific in your base prompt**: The more details you provide, the better the AI can understand what you want.
2. **Consider your use case**: Choose style presets that match your intended audience and purpose.
3. **Match style type to mood**: Use Dark for dramatic, moody images and Light for clean, clear visuals.
4. **Experiment**: Try different combinations to find what works best for your specific needs.

## Technical Details

When you select options in the interface, the system automatically appends the style text to your prompt. You don't need to manually add these style terms yourself - the application handles this behind the scenes. 