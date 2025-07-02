# Hybrid Architecture Design: tldraw + YouTube Functionality

## Overview

This document outlines a hybrid architecture that integrates tldraw as the core canvas engine while preserving all YouTube thumbnail analysis functionality. The design prioritizes simplification of complex canvas code while maintaining feature parity.

## Current State Analysis

### What We Keep (Core Business Value)
- ✅ YouTube API integration and quota tracking
- ✅ Thumbnail performance analytics and scoring
- ✅ Channel import and video fetching logic
- ✅ React UI components (sidebars, toolbars, importers)
- ✅ State management patterns for YouTube data

### What We Replace (Complex Canvas Code)
- 🔄 PixiJS canvas rendering → tldraw Editor
- 🔄 Custom event handling → tldraw tools
- 🔄 Manual viewport management → tldraw camera
- 🔄 Selection rectangles → tldraw selection
- 🔄 Drawing stroke rendering → tldraw draw tool
- 🔄 Text label positioning → tldraw text shapes

## Hybrid Architecture Components

### 1. Core tldraw Integration

```
src/components/canvas/
├── TldrawCanvas.jsx                    # Main tldraw wrapper
├── shapes/                             # Custom tldraw shapes
│   ├── ThumbnailShape.jsx             # YouTube thumbnails
│   ├── CommentPinShape.jsx            # Comment pins
│   └── ChannelHeaderShape.jsx         # Channel headers
├── tools/                              # Custom tldraw tools
│   ├── ThumbnailSelectTool.jsx        # Thumbnail-specific selection
│   ├── LayeredDrawTool.jsx            # Foreground/background drawing
│   └── CommentPinTool.jsx             # Comment placement
└── state/
    └── TldrawStateBridge.jsx          # Bridge between tldraw and app state
```

### 2. Preserved YouTube Components

```
src/components/ (UNCHANGED)
├── YouTubeImporter.jsx                # Keep existing importer
├── MainSidebar.jsx                    # Keep existing sidebar
├── TopToolbar.jsx                     # Adapt to new tools
├── SidebarAnalytics.jsx              # Keep analytics
└── ContentImportSidebar.jsx          # Keep import flow

src/services/ (UNCHANGED)
├── youtubeApi.js                      # Keep API integration
└── quotaTracker.js                    # Keep quota tracking
```

### 3. State Management Bridge

```typescript
// Hybrid state architecture
AppState (React Context)
├── youtubeData: { channels, videos, thumbnails }
├── apiQuota: { used, remaining, resetTime }
├── userPreferences: { settings, history }

TldrawState (tldraw Store)
├── shapes: { thumbnails, comments, drawings, text }
├── viewport: { camera, zoom, selection }
├── tools: { activeTool, toolSettings }

StateBridge
├── syncThumbnailSelection()
├── syncDrawingLayers() 
├── syncToolStates()
└── persistCanvasState()
```

## Custom Shape Implementations

### 1. ThumbnailShape

```typescript
// Custom shape for YouTube thumbnails with performance overlays
type ThumbnailShape = TLBaseShape<'youtube-thumbnail', {
  // YouTube data
  videoId: string
  title: string
  thumbnailUrl: string
  channelName: string
  
  // Performance metrics
  views: number
  engagement: number
  publishedAt: string
  isViral: boolean
  zScore: number
  
  // Canvas properties
  w: number
  h: number
  locked: boolean
  
  // Display settings
  showMetrics: boolean
  badgeType: 'hot' | 'viral' | 'trending' | null
}>

class ThumbnailShapeUtil extends ShapeUtil<ThumbnailShape> {
  static override type = 'youtube-thumbnail' as const
  
  getDefaultProps(): ThumbnailShape['props'] {
    return {
      w: 320,
      h: 180,
      locked: false,
      showMetrics: true,
      // ... other defaults
    }
  }
  
  component(shape: ThumbnailShape) {
    return <ThumbnailShapeComponent shape={shape} />
  }
  
  indicator(shape: ThumbnailShape) {
    return <rect width={shape.props.w} height={shape.props.h} />
  }
  
  // Custom interaction handling for locked thumbnails
  canEdit = (shape: ThumbnailShape) => !shape.props.locked
  canBind = (shape: ThumbnailShape) => false
}
```

### 2. CommentPinShape

```typescript
type CommentPinShape = TLBaseShape<'comment-pin', {
  content: string
  author: string
  timestamp: number
  resolved: boolean
  x: number
  y: number
}>

// Renders as a pin icon with hover tooltip
class CommentPinShapeUtil extends ShapeUtil<CommentPinShape> {
  // Implementation for pin visualization and interaction
}
```

### 3. LayeredDrawingShape

```typescript
// Custom shape to handle foreground/background drawing layers
type LayeredDrawingShape = TLBaseShape<'layered-drawing', {
  points: Point[]
  layer: 'background' | 'foreground'
  brushSize: number
  color: string
  smoothed: boolean
}>

// Renders with proper z-index based on layer and thumbnail positions
```

## Custom Tools Implementation

### 1. ThumbnailSelectTool

```typescript
// Custom selection tool that respects locked thumbnails
class ThumbnailSelectTool extends StateNode {
  static override id = 'thumbnail-select'
  
  onPointerDown = (info: TLPointerEventInfo) => {
    const shape = this.editor.getShapeAtPoint(info.point)
    
    if (shape?.type === 'youtube-thumbnail') {
      const thumbnail = shape as ThumbnailShape
      
      // Respect locked state
      if (thumbnail.props.locked) {
        return // Don't select locked thumbnails
      }
      
      // Handle multi-select with modifiers
      if (info.shiftKey) {
        this.editor.select(...this.editor.getSelectedShapeIds(), shape.id)
      } else {
        this.editor.select(shape.id)
      }
    }
  }
}
```

### 2. LayeredDrawTool

```typescript
// Drawing tool that creates shapes on different layers
class LayeredDrawTool extends StateNode {
  static override id = 'layered-draw'
  
  onPointerDown = (info: TLPointerEventInfo) => {
    const layer = this.getDrawingLayer(info.point) // 'background' or 'foreground'
    
    this.editor.createShape<LayeredDrawingShape>({
      type: 'layered-drawing',
      props: {
        layer,
        points: [info.point],
        brushSize: this.getActiveBrushSize(),
        color: this.getActiveColor()
      }
    })
  }
  
  private getDrawingLayer(point: Point): 'background' | 'foreground' {
    // Determine if drawing behind or in front of thumbnails
    const thumbnailAtPoint = this.editor.getShapeAtPoint(point)
    return thumbnailAtPoint?.type === 'youtube-thumbnail' ? 'background' : 'foreground'
  }
}
```

## State Bridge Implementation

### Core Bridge Pattern

```typescript
// Connects tldraw store with existing React state
export class TldrawStateBridge {
  constructor(
    private tldrawEditor: Editor,
    private canvasActions: CanvasActions,
    private selectionActions: SelectionActions
  ) {
    this.setupBidirectionalSync()
  }
  
  private setupBidirectionalSync() {
    // Sync tldraw selection → React state
    this.tldrawEditor.on('selection-change', (selection) => {
      const thumbnailIds = selection
        .filter(id => this.tldrawEditor.getShape(id)?.type === 'youtube-thumbnail')
        .map(id => this.getVideoIdFromShape(id))
      
      this.selectionActions.setSelection(thumbnailIds)
    })
    
    // Sync React state → tldraw selection
    // (when thumbnails selected via sidebar, etc.)
  }
  
  // Import YouTube thumbnails as tldraw shapes
  importThumbnailsAsShapes(thumbnails: YouTubeThumbnail[]) {
    const shapes = thumbnails.map(thumbnail => ({
      type: 'youtube-thumbnail' as const,
      id: createShapeId(thumbnail.videoId),
      props: {
        videoId: thumbnail.videoId,
        thumbnailUrl: thumbnail.thumbnailUrl,
        title: thumbnail.title,
        // ... map all properties
      }
    }))
    
    this.tldrawEditor.createShapes(shapes)
  }
  
  // Sync drawing settings
  syncDrawingSettings(settings: DrawingSettings) {
    // Update active drawing tool properties
  }
}
```

## Migration Strategy

### Phase 1: Core Setup (Week 1)

1. **Install tldraw**
   ```bash
   npm install @tldraw/tldraw
   ```

2. **Create TldrawCanvas wrapper**
   ```jsx
   // Replace FigmaStyleCanvasRefactoredClean.jsx
   const TldrawCanvas = () => {
     const [editor, setEditor] = useState<Editor | null>(null)
     
     return (
       <Tldraw
         onMount={setEditor}
         shapeUtils={[ThumbnailShapeUtil, CommentPinShapeUtil]}
         tools={[ThumbnailSelectTool, LayeredDrawTool]}
       />
     )
   }
   ```

3. **Implement basic ThumbnailShape**
   - Static thumbnail rendering
   - Basic selection behavior
   - Performance badge overlay

### Phase 2: Shape System (Week 2)

1. **Complete ThumbnailShape**
   - Locked state handling
   - Performance metrics display
   - Interaction constraints

2. **Implement CommentPinShape**
   - Pin visualization
   - Tooltip on hover
   - Resolution states

3. **Create StateBridge**
   - Thumbnail import functionality
   - Selection synchronization
   - Basic state persistence

### Phase 3: Tools Integration (Week 3)

1. **Custom selection tool**
   - Multi-select with modifiers
   - Locked thumbnail respect
   - Tool state coordination

2. **Drawing tool integration**
   - Layer-aware drawing
   - Brush settings
   - Eraser mode

3. **Keyboard shortcuts**
   - Map existing shortcuts to tldraw tools
   - Custom shortcut handlers

### Phase 4: Advanced Features (Week 4)

1. **Text labels as tldraw text**
   - Style synchronization
   - Bulk updates
   - System vs user labels

2. **Complete state bridge**
   - History integration
   - Persistence
   - Performance optimization

3. **Tool coordination**
   - Hand tool integration
   - Comment placement
   - Tool state synchronization

## File Changes Required

### New Files
```
src/components/canvas/
├── TldrawCanvas.jsx                    # Main wrapper
├── shapes/ThumbnailShapeUtil.js       # YouTube thumbnails
├── shapes/CommentPinShapeUtil.js      # Comment pins  
├── shapes/LayeredDrawingShapeUtil.js  # Drawing layers
├── tools/ThumbnailSelectTool.js       # Custom selection
├── tools/LayeredDrawTool.js           # Layer-aware drawing
└── state/TldrawStateBridge.js         # State synchronization
```

### Modified Files
```
src/components/canvas/
├── FigmaStyleCanvasRefactoredClean.jsx  # → TldrawCanvas.jsx
├── TopToolbar.jsx                       # Update tool buttons
└── CanvasViewportControlsRefactored.jsx # Adapt to tldraw camera

src/hooks/
├── useCanvasToolsIntegrated.js         # Bridge to tldraw tools
└── usePixiAppInitialization.js        # Remove (replaced by tldraw)
```

### Removed Files
```
src/components/canvas/
├── CanvasControls.js                   # Replaced by tldraw tools
├── ThumbnailRenderer.js               # → ThumbnailShapeUtil
├── DrawingRenderer.js                 # → LayeredDrawingShapeUtil
├── TextLabelRenderer.js               # → tldraw text shapes
└── SelectionRectangle.js              # → tldraw selection

src/hooks/
├── usePixiRenderer.js                 # Removed
├── useCanvasInteractions.js           # Removed
└── useCanvasEventHandlers.js          # Removed
```

## Benefits of This Architecture

### Code Simplification
- **-1,000+ lines**: Remove custom canvas event handling
- **-500+ lines**: Remove PixiJS rendering code  
- **-300+ lines**: Remove selection rectangle logic
- **Cleaner hooks**: Simpler state management patterns

### Enhanced Functionality
- **Built-in collaboration**: Future multiplayer support
- **Better performance**: Optimized rendering and interactions
- **Robust undo/redo**: Transaction-based history
- **Improved accessibility**: Better keyboard navigation

### Easier Maintenance
- **Standard patterns**: tldraw conventions vs custom code
- **Better testing**: Predictable state management
- **Community support**: Active tldraw ecosystem
- **Future-proof**: Continued development and features

## Risk Mitigation

### Performance Monitoring
```javascript
// Add performance tracking during migration
const performanceMonitor = {
  measureRenderTime: () => { /* track render performance */ },
  measureInteractionLatency: () => { /* track responsiveness */ },
  compareWithBaseline: () => { /* compare to PixiJS performance */ }
}
```

### Feature Parity Testing
```javascript
// Automated tests to ensure no functionality is lost
describe('Feature Parity Tests', () => {
  test('thumbnail selection behavior matches original')
  test('drawing layers work correctly') 
  test('comment pins function identically')
  test('keyboard shortcuts preserved')
  test('state persistence works')
})
```

### Gradual Rollout
- **Feature flags**: Enable tldraw components incrementally
- **A/B testing**: Compare user experience metrics
- **Rollback plan**: Keep PixiJS components as backup
- **User feedback**: Monitor for usability issues

## Conclusion

This hybrid architecture provides a clear path to integrate tldraw while preserving all YouTube-specific functionality. The migration reduces code complexity by ~50% while adding collaboration capabilities and improving maintainability.

**Key Success Factors:**
1. Custom shapes preserve YouTube thumbnail functionality
2. State bridge maintains data consistency
3. Custom tools respect business logic (locked thumbnails, layers)
4. Gradual migration reduces risk
5. Performance monitoring ensures quality

The end result is a more maintainable, feature-rich canvas system that leverages tldraw's strengths while preserving the unique YouTube thumbnail analysis capabilities that provide core business value.