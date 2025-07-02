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

## React Performance Best Practices

### Critical Performance Rules for Canvas Applications

#### 1. State Initialization - Prevent Object Recreation
**❌ WRONG**: Creates new objects on every render
```javascript
// This creates a new Set on EVERY render
const [selectedIds, setSelectedIds] = useState(new Set());
const [cache, setCache] = useState(new Map());
const [config, setConfig] = useState({ width: 100, height: 100 });
```

**✅ CORRECT**: Use lazy initialization
```javascript
// Object is created only once during initialization
const [selectedIds, setSelectedIds] = useState(() => new Set());
const [cache, setCache] = useState(() => new Map());
const [config, setConfig] = useState(() => ({ width: 100, height: 100 }));
```

#### 2. useEffect Dependencies - Be Specific
**❌ WRONG**: Using entire objects or spreading props
```javascript
// This will trigger on EVERY parent re-render
useEffect(() => {
  // expensive canvas setup
}, [props]); // props object changes every render

// Also wrong - spreading creates unstable dependencies
useEffect(() => {
  // setup code
}, [...Object.values(props)]);
```

**✅ CORRECT**: Extract specific values
```javascript
// Only re-runs when these specific values change
const { isEnabled, width, height, onUpdate } = props;
useEffect(() => {
  // expensive canvas setup
}, [isEnabled, width, height, onUpdate]);
```

#### 3. Callback and Object Stability
**❌ WRONG**: Creating objects/functions that cause downstream effects
```javascript
// This recreates handlers on every render
const handlers = {
  onClick: () => doSomething(),
  onHover: () => doAnother()
};

// This causes child components to re-render
return <CanvasControls handlers={handlers} />;
```

**✅ CORRECT**: Memoize objects that are used as dependencies
```javascript
// Stable reference across renders
const handlers = useMemo(() => ({
  onClick: () => doSomething(),
  onHover: () => doAnother()
}), [doSomething, doAnother]);

// Or use individual callbacks
const handleClick = useCallback(() => doSomething(), [doSomething]);
const handleHover = useCallback(() => doAnother(), [doAnother]);
```

#### 4. Ref Updates Don't Need Dependencies
**❌ WRONG**: Including all values when updating a ref
```javascript
useEffect(() => {
  myRef.current = { value1, value2, value3 };
}, [value1, value2, value3]); // Unnecessary dependencies
```

**✅ CORRECT**: Refs can be updated without dependencies
```javascript
// Since we're updating a ref, we can omit dependencies
// The ref will always have access to current values through closures
useEffect(() => {
  myRef.current = { value1, value2, value3 };
});
```

#### 5. Canvas-Specific Optimizations
**❌ WRONG**: Using state values directly in render loops
```javascript
const drawingHandlers = useMemo(() => ({
  onMove: (point) => {
    // This recreates handlers when drawings change
    const filtered = drawings.filter(d => ...);
  }
}), [drawings]); // Unstable dependency
```

**✅ CORRECT**: Use refs for frequently changing values
```javascript
// Keep frequently changing values in refs
useEffect(() => {
  drawingsRef.current = drawings;
}, [drawings]);

const drawingHandlers = useMemo(() => ({
  onMove: (point) => {
    // Access current value without recreating handler
    const filtered = drawingsRef.current.filter(d => ...);
  }
}), []); // Stable - no dependencies needed
```

### Performance Checklist for New Features

Before merging any canvas-related feature:

- [ ] **State Initialization**: All Set, Map, or Object states use lazy initialization
- [ ] **useEffect Audit**: No object/array spreads or entire objects in dependencies
- [ ] **Callback Stability**: Event handlers wrapped in useCallback where needed
- [ ] **Object References**: Objects passed as props are memoized
- [ ] **Ref Usage**: Frequently changing values stored in refs, not state
- [ ] **Render Optimization**: Canvas render functions don't recreate on every call
- [ ] **Event Handlers**: Mouse/keyboard handlers don't cause re-renders

### Testing Performance

```javascript
// Add this to development builds to catch issues
if (process.env.NODE_ENV === 'development') {
  // Log when expensive components re-render
  console.log(`${ComponentName} rendered`);
  
  // Track render count
  const renderCount = useRef(0);
  renderCount.current++;
  console.log(`Render #${renderCount.current}`);
}
```

### Common Canvas Performance Patterns

1. **Batched Updates**: Group multiple state updates
```javascript
// Instead of multiple setState calls
setX(newX);
setY(newY);
setScale(newScale);

// Use a single update
setCanvasState(prev => ({ ...prev, x: newX, y: newY, scale: newScale }));
```

2. **Throttled Handlers**: For high-frequency events
```javascript
const handleMouseMove = useCallback(
  throttle((e) => {
    // Handle movement
  }, 16), // ~60fps
  []
);
```

3. **Viewport Culling**: Only render visible elements
```javascript
const visibleItems = useMemo(() => 
  items.filter(item => isInViewport(item, viewport)),
  [items, viewport]
);
```

## ⚠️ Critical Architecture Rules - MUST FOLLOW

### 🚨 Golden Rules That Can Break Everything

#### 1. **NEVER Allow Dual Control Systems**
**❌ CATASTROPHIC**: Having multiple `setupCanvasControls` calls active simultaneously
```javascript
// DANGER - Both systems will conflict:
// System 1: usePixiAppInitialization.js
setupCanvasControls(app, viewport, gridSprite, controlsConfig);
// System 2: useCanvasInteractions.js  
setupCanvasControls(app, viewport, gridGraphicsRef.current, callbacks);

// Result: Duplicate events, broken tools, performance issues
```

**✅ RULE**: Only ONE control system active at a time. If adding new canvas features, verify no duplicate `setupCanvasControls` calls exist.

#### 2. **ALWAYS Check Refs Before Using in Handlers**
**❌ BREAKS FEATURES**: Static ref checking that creates permanent dead functions
```javascript
// WRONG - Gets fallback if refs aren't ready during init
const handlers = useMemo(() => {
  if (!appRef.current) return { onClick: () => {} }; // DEAD FOREVER!
  return { onClick: realHandler };
}, []);
```

**✅ RULE**: Dynamic ref checking in every handler
```javascript
// CORRECT - Check refs every time handler is called
const handlers = useMemo(() => ({
  onClick: () => {
    if (!appRef.current || !viewportRef.current) {
      console.warn('Refs not ready'); return;
    }
    // Real logic here
  }
}), []);
```

#### 3. **ALWAYS Use Lazy State Initialization**
**❌ PERFORMANCE KILLER**: Creates new objects on every render
```javascript
const [selectedIds, setSelectedIds] = useState(new Set()); // WRONG!
```

**✅ RULE**: Lazy initialization for all Set/Map/Object states
```javascript
const [selectedIds, setSelectedIds] = useState(() => new Set()); // CORRECT!
```

#### 4. **NEVER Mix useState Function Patterns with Context**
**❌ BREAKS STATE**: Function update patterns don't work with context actions
```javascript
// WRONG - Breaks with context state management
setSelectedIds(prev => [...prev, newId]);
```

**✅ RULE**: Always use context actions for state updates
```javascript
// CORRECT - Use context actions directly
selectionActions.setSelection([...selectedIds, newId]);
```

#### 5. **NEVER Put Objects/Props in useEffect Dependencies**
**❌ PERFORMANCE DESTROYER**: Causes infinite re-renders
```javascript
// WRONG - props object changes every render
useEffect(() => {
  expensiveCanvasSetup();
}, [props, handlers, state]);
```

**✅ RULE**: Extract specific primitive values
```javascript
// CORRECT - Only specific values that actually matter
const { width, height, isEnabled } = props;
useEffect(() => {
  expensiveCanvasSetup();
}, [width, height, isEnabled]);
```

### 🔧 Critical Integration Points That Must Stay Synchronized

#### Tool System Coordination (All Must Be In Sync)
```javascript
// These MUST all reflect the same state:
1. useToolState.activeTool
2. useToolInteractionManager.toolBehavior  
3. Canvas event routing in CanvasControls.js
4. UI button states in TopToolbar.jsx

// If ANY are out of sync = broken tools
```

#### PixiJS Lifecycle Order (NEVER Change This Sequence)
```javascript
// CRITICAL ORDER - Don't reorder or skip steps:
1. Create PIXI app (usePixiAppInitialization)
2. Initialize viewport 
3. Setup graphics refs (drawing, selection, etc.)
4. Setup canvas controls
5. Connect to React state
6. Start rendering loops
```

#### Event Handler Chain (All Links Must Work)
```javascript
// CRITICAL FLOW - If ANY link breaks, feature stops working:
User Input → CanvasControls → controlCallbacksRef → Real Handlers → State Updates → PixiJS Render
```

### 🚨 Emergency Debug Patterns

#### When Any Tool Stops Working:
```javascript
// 1. Check tool state synchronization
console.log('Tool Debug:', {
  activeTool: canvasTools.activeTool,
  isDrawingMode: canvasTools.isDrawingMode,
  toolBehavior: canvasTools.toolBehavior,
  eventTarget: e.target === app.stage
});

// 2. Verify control system health
console.log('Control Systems:', {
  useCanvasInteractionsActive: !!useCanvasInteractions,
  controlsConfigActive: !!controlsConfig,
  duplicateControls: 'CHECK FOR MULTIPLE setupCanvasControls CALLS'
});
```

#### When Performance Degrades:
```javascript
// Check for object recreation cascades
const renderCount = useRef(0);
renderCount.current++;
if (renderCount.current > 10) {
  console.warn('Excessive re-renders detected:', renderCount.current);
}
```

#### When State Gets Out of Sync:
```javascript
// Verify context vs local state alignment
console.log('State Sync Check:', {
  contextData: useCanvasState(),
  localData: useState_values,
  pixiData: refs_and_containers
});
```

### 🎯 File-Specific Critical Knowledge

#### `CanvasControls.js` - Event Brain
- **RULE**: This file routes ALL canvas events. Any new tool MUST be added here.
- **DANGER**: Modifying event handler priorities can break existing tools.

#### `FigmaStyleCanvasRefactoredClean.jsx` - Integration Hub  
- **RULE**: This orchestrates everything. Keep integration logic here, not in child components.
- **DANGER**: Moving control setup logic can break the entire tool system.

#### `useCanvasToolsIntegrated.js` - Tool Coordinator
- **RULE**: ALL tool state changes must flow through this hub.
- **DANGER**: Bypassing this for tool state can cause synchronization issues.

#### `canvasState.js` - Single Source of Truth
- **RULE**: ALL canvas data updates must use these actions.
- **DANGER**: Direct useState calls bypass the unified state system.

### 🔥 Most Common Break Points

1. **Adding new tool without updating all 4 tool system pieces**
2. **Creating useEffect with broad object dependencies**  
3. **Forgetting ref readiness checks in new handlers**
4. **Accidentally enabling both control systems**
5. **Using useState patterns instead of context actions**

### ⚡ Quick Fix Emergency Kit

```javascript
// If tools stop working - Check this first:
1. Only one setupCanvasControls active? 
2. All refs ready when handlers run?
3. Tool state synchronized across all pieces?
4. Using context actions not useState?
5. No objects in useEffect dependencies?
```

**REMEMBER**: This codebase has a complex but powerful architecture. These rules prevent 90% of bugs and performance issues. When in doubt, follow the patterns established in working features.

## Model Context Protocol (MCP) Configuration

### Overview
This project is configured to use MCP (Model Context Protocol) servers to extend Claude Code's capabilities with external tools and services. MCP enables seamless integration with GitHub, databases, and other development tools.

### GitHub MCP Server Setup

The GitHub MCP Server provides comprehensive GitHub integration including issues, pull requests, repositories, code security, and actions management.

#### Adding GitHub MCP Server
```bash
# Add GitHub MCP Server (remote hosted)
claude mcp add --transport http github https://api.githubcopilot.com/mcp/

# Verify server was added
claude mcp list
claude mcp get github
```

#### Authentication
1. Use `/mcp` command in Claude Code to manage authentication
2. Select "Authenticate" for the GitHub server
3. Complete OAuth flow in your browser
4. Server becomes active once authenticated

#### Available GitHub Tools
- **Issues**: Create, update, search, manage issues and comments
- **Pull Requests**: Create, review, merge, manage PRs and reviews
- **Repositories**: Browse code, create branches, manage files, search code
- **Code Security**: Access code scanning and secret scanning alerts
- **Actions**: Work with GitHub Actions workflows
- **Notifications**: Manage GitHub notifications
- **Organizations**: Search and manage organization data

#### Usage Examples
```bash
# Common GitHub operations via Claude Code:
# "List open issues in this repository"
# "Create a new branch called 'feature/thumbnail-optimization'"
# "Show me recent pull requests"
# "What are the latest code security alerts?"
# "Create an issue for the canvas performance optimization"
```

### MCP Server Scopes

MCP servers can be configured at different scopes:

- **Local** (default): Private to you in this project
- **Project**: Shared with team via `.mcp.json` file (committed to repo)
- **User**: Available across all your projects

```bash
# Add project-scoped server (shared with team)
claude mcp add -s project github-shared https://api.githubcopilot.com/mcp/

# Add user-scoped server (personal, cross-project)
claude mcp add -s user github-personal https://api.githubcopilot.com/mcp/
```

### MCP Resources and Prompts

#### Using @ Resources
Reference GitHub resources directly in prompts:
```
> Can you analyze @github:issue://123 and suggest a fix?
> Compare @github:pr://456 with the current canvas implementation
```

#### Using / Slash Commands
GitHub MCP prompts become available as slash commands:
```
> /mcp__github__list_prs
> /mcp__github__create_issue "Canvas performance optimization" high
```

### Security Considerations

- MCP servers run with your GitHub permissions
- Review server configurations before adding to project scope
- Use minimal required permissions for GitHub tokens
- Team members must approve project-scoped servers individually

### Troubleshooting MCP

```bash
# Check server status
claude mcp list

# Debug server connection
/mcp  # Use this command within Claude Code

# Remove problematic server
claude mcp remove github

# Reset project server approvals
claude mcp reset-project-choices
```

For more details about MCP, see the [MCP documentation](https://modelcontextprotocol.io/introduction).