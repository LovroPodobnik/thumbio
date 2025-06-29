 The Core Issue

  The pen/drawing tool wasn't working due to a dual control system conflict where two separate canvas control systems were both trying to handle
  drawing events, causing interference and using fallback empty functions instead of the real drawing logic.

  Root Cause Analysis

  1. Duplicate Control Systems
  // SYSTEM 1: usePixiAppInitialization.js
  setupCanvasControls(app, viewport, gridSprite, controlsConfig);

  // SYSTEM 2: useCanvasInteractions.js  
  setupCanvasControls(app, viewport, gridGraphicsRef.current, callbacks);
  Both were attaching event listeners to app.stage, causing conflicts.

  2. Fallback Function Problem
  const drawingHandlers = useMemo(() => {
    if (!appRef.current || !viewportRef.current || !tempDrawingGraphicsRef.current) {
      return {
        onDrawingStart: () => {}, // FALLBACK - EMPTY FUNCTION!
        onDrawingMove: () => {},
        onDrawingEnd: () => {}
      };
    }
    // Real drawing logic here...
  }, [deps]);
  The control callbacks were grabbing the fallback functions before refs were ready.

  Key Architecture Points for Pen Tool Development

  1. Tool State Management Flow

  User clicks pen tool → toolActions.toggleDrawingMode() →
  isDrawingMode = true → Canvas detects drawing mode →
  Routes to drawing handlers → Creates/updates drawing state

  2. Critical Ref Dependencies

  The pen tool requires these refs to be ready:
  - appRef.current - PIXI Application
  - viewportRef.current - Canvas viewport
  - tempDrawingGraphicsRef.current - Temporary drawing graphics

  3. Drawing Data Flow

  onDrawingStart → Create newDrawing object → setCurrentDrawing
  onDrawingMove → Update points array → Render temp graphics
  onDrawingEnd → Finalize → Add to drawings state → Clear temp

  4. Key Files for Pen Tool

  - CanvasControls.js - Event detection & routing
  - FigmaStyleCanvasRefactoredClean.jsx - Drawing handlers & state
  - useCanvasToolsIntegrated.js - Tool state management
  - TextLabelRenderer.js / Drawing equivalents - PIXI rendering

  5. State Management Pattern

  // Drawing state lives in context
  const { drawings } = useCanvasState();
  const { canvasActions } = useCanvasActions();

  // Actions update state
  canvasActions.setDrawings(updatedDrawings);

  // PixiJS renderer syncs with state changes
  useEffect(() => {
    // Re-render drawings when state changes
  }, [drawings]);

  Quick Debug Strategy for Pen Tool Issues

  1. Check Tool Activation
  console.log('isDrawingMode:', isDrawingMode);
  // Should be true when pen tool is active

  2. Check Event Routing
  // In CanvasControls.js
  if (isDrawingMode && isDrawingMode()) {
    console.log('Drawing mode detected');
    // Should fire when clicking with pen tool
  }

  3. Check Refs Readiness
  console.log('Refs ready:', {
    app: !!appRef.current,
    viewport: !!viewportRef.current,
    tempGraphics: !!tempDrawingGraphicsRef.current
  });

  4. Check State Updates
  // Should see drawings array growing
  console.log('Current drawings:', drawings.length);

  Important Anti-Patterns to Avoid

  ❌ Don't create multiple setupCanvasControls calls❌ Don't use static fallback functions in useMemo❌ Don't forget to check ref readiness in 
  handlers❌ Don't mix useState patterns with context actions

  Performance Considerations

  - Throttle drawing move events for smooth performance
  - Use refs for frequently changing values (current drawing)
  - Batch state updates when possible
  - Clear temp graphics after finalizing drawings

  This architecture ensures the pen tool integrates cleanly with the existing tool system while maintaining proper separation of concerns and
  avoiding the dual control system conflicts that caused the original issue.