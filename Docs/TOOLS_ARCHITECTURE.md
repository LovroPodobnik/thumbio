# Tools System Architecture

## Overview

This document explains the architecture and data flow of the tools system in the Thumbnail Canvas Prototype. The system implements a Figma-style tool switching mechanism with keyboard shortcuts, dedicated behaviors, and real-time UI updates.

## Core Components

### 1. Tool State Management (`useToolState`)

**Location**: `src/hooks/useToolState.js`

The foundation of the tools system. Manages which tool is currently active and provides actions to switch between tools.

```javascript
const TOOLS = {
  SELECTION: 'selection',  // Default tool (V key)
  HAND: 'hand',           // Pan tool (H key)
  DRAWING: 'drawing',     // Draw tool (P key)
  COMMENT: 'comment',     // Comment tool (C key)
  LABEL: 'label'          // Text label tool (T key)
};
```

**Key Functions**:
- `setActiveTool(toolName)` - Directly set active tool
- `selectSelectionTool()` - Switch to selection tool
- `selectHandTool()` - Switch to hand/pan tool
- `toggleDrawingMode()` - Toggle drawing tool
- `toggleCommentMode()` - Toggle comment tool
- `toggleLabelMode()` - Toggle label tool
- `setSpacePanning(boolean)` - Temporary pan mode with spacebar

### 2. Tool Behavior Definition (`useToolInteractionManager`)

**Location**: `src/hooks/useToolInteractionManager.js`

Defines how each tool behaves and interacts with the canvas. Acts as the single source of truth for tool behaviors.

**Tool Behavior Properties**:
```javascript
{
  cursor: 'default',           // Mouse cursor style
  thumbnailInteractive: true,   // Can interact with thumbnails?
  canSelect: true,             // Can select items?
  canPan: false,               // Can pan the viewport?
  canDraw: false,              // Can draw on canvas?
  preventDefaultEvents: false   // Prevent browser defaults?
}
```

**Tool Behaviors**:
- **Selection Tool**: Interactive thumbnails, can select, default cursor
- **Hand Tool**: Non-interactive thumbnails, can pan, grab cursor
- **Drawing Tool**: Non-interactive thumbnails, can draw, crosshair cursor
- **Comment Tool**: Non-interactive thumbnails, crosshair cursor
- **Label Tool**: Non-interactive thumbnails, text cursor

### 3. Canvas Event Handling (`setupCanvasControls`)

**Location**: `src/components/canvas/CanvasControls.js`

Handles all canvas mouse and keyboard events. Routes events based on the active tool.

**Event Flow**:
1. User performs action (click, drag, key press)
2. Canvas controls check active tool state
3. Routes to appropriate handler based on tool behavior
4. Updates UI accordingly

**Key Event Handlers**:
- `pointerdown` - Tool-specific actions (select, pan, draw, place comment/label)
- `pointermove` - Dragging, panning, drawing
- `pointerup` - Finalize actions
- `wheel` - Zoom regardless of tool
- `keydown/keyup` - Tool shortcuts and space panning

### 4. Tool Integration Hub (`useCanvasToolsIntegrated`)

**Location**: `src/hooks/useCanvasToolsIntegrated.js`

Orchestrates all tool-related hooks and provides a unified interface to the main component.

**Integrates**:
- Tool state management
- Tool interaction behaviors
- Zoom controls
- Keyboard shortcuts
- Drawing, comment, and label modes

**Returns**:
```javascript
{
  activeTool,              // Current tool name
  isSpacePanning,         // Space key pressed?
  isHandToolMode,         // Hand tool active?
  isDrawingMode,          // Drawing tool active?
  isAddingComment,        // Comment tool active?
  isAddingLabel,          // Label tool active?
  toolActions,            // Tool switching functions
  zoomActions,            // Zoom control functions
  zoomLevel,              // Current zoom percentage
  toolBehavior,           // Current tool's behavior config
  areThumbnailsInteractive // Function to check thumbnail interactivity
}
```

### 5. UI Response System

**Thumbnail Event Modes** (`updateThumbnailEventMode`):
- When hand/drawing/comment/label tools are active, thumbnails become non-interactive
- `eventMode = 'none'` makes thumbnails transparent to mouse events
- Allows canvas panning even when clicking on thumbnails

**Cursor Management**:
- Each tool has its designated cursor
- Cursor updates immediately on tool switch
- Special states: 'grabbing' when actively panning

**Visual Feedback**:
- Tool buttons highlight when active
- Cursor changes to indicate tool function
- Selection rectangles, drawing previews, etc.

## Data Flow

### Tool Switching Flow

```
User Input (Keyboard/Button)
    ↓
useKeyboardShortcuts / UI Button Click
    ↓
toolActions.selectXXXTool()
    ↓
useToolState updates activeTool
    ↓
useToolInteractionManager updates behavior
    ↓
Multiple Effects Trigger:
    ├→ Cursor updates
    ├→ Thumbnail interactivity updates
    ├→ Canvas event handlers switch behavior
    └→ UI components re-render with new state
```

### Selection Tool Rectangle Selection Flow

```
Mouse Down (Selection Tool Active)
    ↓
CanvasControls checks isSelectionAllowed()
    ↓
onRectSelectionStart()
    ↓
Mouse Move → onRectSelectionMove()
    ├→ Calculate selection rectangle
    ├→ Draw blue selection box
    └→ Highlight intersecting items
    ↓
Mouse Up → onRectSelectionEnd()
    ├→ Finalize selection based on modifiers
    ├→ Clear selection rectangle
    └→ Update selected items state
```

### Hand Tool Panning Flow

```
Mouse Down (Hand Tool Active OR Space Pressed)
    ↓
CanvasControls detects pan mode
    ↓
Start tracking mouse position
    ↓
Mouse Move → Update viewport position
    ├→ viewport.x/y updates
    ├→ Grid position updates
    └→ All canvas content moves
    ↓
Mouse Up → End panning
    └→ Cursor returns to 'grab' from 'grabbing'
```

## Key Integration Points

### 1. Main Canvas Component (`FigmaStyleCanvasRefactoredClean`)

The main component that brings everything together:

```javascript
// Initialize tools system
const canvasTools = useCanvasToolsIntegrated({
  appRef,
  viewportRef,
  viewportTransform,
  setViewportTransform,
  gridGraphicsRef,
  updateAllThumbnailEventModes,
  historyActions,
  setIsSelecting,
  setSelectionStart,
  setSelectionEnd
});

// Use tool states and actions throughout component
const { activeTool, toolActions, isDrawingMode, ... } = canvasTools;
```

### 2. Control Callbacks System

Uses a ref-based callback system to handle circular dependencies:

```javascript
const controlCallbacksRef = useRef({
  isAddingComment: () => false,
  isDrawingMode: () => false,
  isHandToolMode: () => false,
  isSelectionAllowed: () => false,
  // ... other callbacks
});

// Update callbacks when tool state changes
useEffect(() => {
  controlCallbacksRef.current = {
    isAddingComment: () => isAddingComment,
    isDrawingMode: () => isDrawingMode,
    // ... updated callbacks
  };
}, [isAddingComment, isDrawingMode, ...]);
```

### 3. Event Handler Integration

Canvas controls use callbacks to check tool state:

```javascript
// In CanvasControls.js
if (isHandToolMode && isHandToolMode()) {
  // Handle panning
} else if (isDrawingMode && isDrawingMode()) {
  // Handle drawing
} else if (isSelectionAllowed && isSelectionAllowed()) {
  // Handle selection
}
```

## Adding a New Tool

To add a new tool to the system:

1. **Add tool constant** in `useToolState.js`:
   ```javascript
   const TOOLS = {
     // ... existing tools
     NEW_TOOL: 'newTool'
   };
   ```

2. **Add tool action** in `useToolState.js`:
   ```javascript
   const selectNewTool = () => setActiveTool(TOOLS.NEW_TOOL);
   ```

3. **Define tool behavior** in `useToolInteractionManager.js`:
   ```javascript
   [TOOLS.NEW_TOOL]: {
     cursor: 'custom-cursor',
     thumbnailInteractive: false,
     canSelect: false,
     canPan: false,
     canDraw: false,
     preventDefaultEvents: true
   }
   ```

4. **Add keyboard shortcut** in `useKeyboardShortcuts.js`:
   ```javascript
   case 'n':
     e.preventDefault();
     toolActions.selectNewTool();
     break;
   ```

5. **Handle tool events** in `CanvasControls.js`:
   ```javascript
   if (callbacks.isNewToolMode && callbacks.isNewToolMode()) {
     // Handle new tool behavior
   }
   ```

6. **Update UI** to show tool state and provide buttons

## Best Practices

1. **Tool Independence**: Each tool should have clearly defined, non-overlapping behaviors
2. **State Consistency**: Tool state should be the single source of truth
3. **Event Priority**: More specific tools (drawing, comment) take precedence over general tools (selection)
4. **Visual Feedback**: Always provide immediate visual feedback for tool changes
5. **Keyboard Accessibility**: Every tool should have a keyboard shortcut
6. **Graceful Fallback**: When specialized tools finish tasks, return to selection tool

## Common Issues and Solutions

### Issue: Thumbnails blocking hand tool panning
**Solution**: Set `thumbnailInteractive: false` in tool behavior and update thumbnail `eventMode = 'none'`

### Issue: Cursor not updating on tool change
**Solution**: Ensure `updateCursor` effect in `useToolInteractionManager` includes all dependencies

### Issue: Rectangle selection not working
**Solution**: Check that selection tool has `canSelect: true` and callbacks are properly connected

### Issue: Multiple tools active simultaneously
**Solution**: Use exclusive tool states - activating one tool should deactivate others

## Testing Tools

To test tool functionality:

1. **Keyboard shortcuts**: Press V, H, P, C, T to switch tools
2. **Space panning**: Hold space for temporary pan mode
3. **Tool behaviors**: Verify cursor changes and interaction modes
4. **State persistence**: Tool should remain active across component updates
5. **Event handling**: Each tool should only respond to its designated events 