# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

YouTube Thumbnail Performance Analyzer - An interactive canvas application for analyzing and visualizing YouTube thumbnail performance metrics using React, PixiJS, and the YouTube Data API v3.

## Essential Commands

```bash
# Development
npm start         # Start development server on http://localhost:3000

# Building
npm build         # Create production build in ./build directory

# Testing
npm test          # Run tests in watch mode
```

## Required Environment Variables

Create a `.env` file from `.env.example`:

```
REACT_APP_YOUTUBE_API_KEY=your_youtube_api_key_here
REACT_APP_MAX_REQUESTS_PER_HOUR=100  # Optional
REACT_APP_MAX_REQUESTS_PER_DAY=1000  # Optional
```

## Architecture Overview

### Tech Stack
- **React 19.1.0** with CRACO for build customization
- **PixiJS 8.10.2** for high-performance canvas rendering
- **TanStack React Query** for data fetching and caching
- **Tailwind CSS** with custom HSL-based design system
- **YouTube Data API v3** for video metrics

### Core Components Structure

```
src/components/canvas/
├── FigmaStyleCanvasRefactored.jsx    # Main canvas orchestrator
├── renderers/                        # Rendering layers
│   ├── ThumbnailRenderer.jsx         # PixiJS thumbnail rendering
│   ├── TextLabelRenderer.jsx         # Text annotations
│   ├── DrawingRenderer.jsx           # Drawing tools
│   └── CommentRenderer.jsx           # Comment pins
├── toolbars/                         # UI controls
│   ├── CanvasToolbar.jsx
│   ├── FilterToolbar.jsx
│   └── MobileToolbar.jsx
└── controls/                         # Interactive controls
    ├── CanvasLayerControls.jsx
    └── SelectionControl.jsx
```

### Key Services

- **services/youtubeApi.js** - YouTube API integration with quota tracking
- **services/quotaTracker.js** - API usage monitoring and limits
- **services/ai/** - AI-powered thumbnail analysis features

### Data Flow

1. YouTube videos imported via API → 
2. Cached with React Query → 
3. Rendered on PixiJS canvas → 
4. User interactions update state → 
5. Canvas re-renders affected areas

### Canvas Architecture

The canvas uses a layered rendering approach:
- **Base Layer**: PixiJS for thumbnails (GPU-accelerated)
- **Overlay Layers**: React components for UI elements
- **Interaction Layer**: Mouse/touch event handling

Selection and manipulation are handled through a centralized state management system with optimistic updates for smooth UX.

## Development Notes

- Canvas performance is critical - minimize re-renders and use PixiJS batching
- Quota tracking is essential due to YouTube API limits
- The application supports both desktop and mobile with responsive design
- Dark mode support is built into the Tailwind configuration

## Testing Approach

When testing canvas interactions:
```bash
npm test -- --watchAll=false  # Run all tests once
npm test ComponentName        # Test specific component
```

## Deployment

Configured for Vercel with SPA routing. The `vercel.json` handles client-side routing by redirecting all routes to index.html.

## Design System & UI Guidelines

### Design Philosophy
- **Minimal and Professional**: Avoid overdesign, excessive colors, and decorative elements
- **Functional First**: Every UI element should have a clear purpose
- **Consistent Spacing**: Use 4px grid system (4, 8, 12, 16, 24, 32px)
- **Subtle Interactions**: Hover states should be understated

### Color Usage
- **Primary Palette**: Use system colors from the design tokens (text-primary, text-secondary, text-tertiary)
- **Minimal Color**: Avoid colorful badges or category indicators unless functionally necessary
- **Neutral Backgrounds**: Prefer `neutral-10`, `neutral-20` for subtle backgrounds
- **Brand Colors**: Use sparingly, only for primary actions

### Typography (Radix UI Guidelines)
- **Headers**: `text-xl font-medium` (20px) for main titles
- **Section Titles**: `text-base font-medium` (16px) or `text-lg` (18px)
- **Body Text**: `text-sm` (14px) with `leading-relaxed`
- **Small Text**: `text-xs` (12px) for metadata
- **Font Weights**: Prefer `font-medium` (500) over `font-semibold` (600)

### Component Patterns

#### Buttons
- **Primary Actions**: Solid style with `bg-text-primary text-background-primary`
- **Secondary Actions**: Text-only with hover state
- **Icon Usage**: Use lucide-react icons, sized appropriately (w-3.5 h-3.5 for small buttons)
- **Loading States**: Show spinner with descriptive text

#### Cards & Containers
- **Borders**: Use `border-border-divider` with `rounded-lg`
- **Hover States**: Subtle background change `hover:bg-background-secondary`
- **Spacing**: Consistent padding (p-3 or p-4)

#### Lists
- **Vertical Spacing**: Use `space-y-2` or `space-y-3`
- **Item Style**: Bordered containers with hover states
- **Information Hierarchy**: Channel name prominent, metadata subdued

### Radix UI Components
- **Dialog**: Use for modals and sidebars with proper Portal and Overlay
- **ScrollArea**: Custom scrollbars for long content
- **Avatar**: Consistent sizing (w-10 h-10) with neutral backgrounds
- **Separator**: For visual division between sections
- **Tooltip**: Reserved for additional context, not primary information

### Specific UI Rules
1. **Sidebars**: Width of 420px, clean header without decorations
2. **Icons**: Use consistent sizes and muted colors (`text-text-tertiary`)
3. **Badges**: Minimal styling, uppercase for status (e.g., "HOT")
4. **Forms**: Clear labels, subtle borders, proper focus states
5. **Error States**: Simple bordered containers with red accents

### Anti-patterns to Avoid
- Gradient backgrounds or buttons (except for special emphasis)
- Multiple bright colors in the same view
- Decorative icons or illustrations
- Card components for simple text sections
- Excessive shadows or 3D effects
- Category-specific color coding