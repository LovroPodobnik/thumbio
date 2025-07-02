⏺ Based on my deep analysis of this codebase, here are the most critical knowledge points that can make or break the entire application:

  🔥 Critical Architecture Dependencies

  1. Dual Control System Conflict (MOST DANGEROUS)

  // SYSTEM 1: usePixiAppInitialization.js
  setupCanvasControls(app, viewport, gridSprite, controlsConfig);

  // SYSTEM 2: useCanvasInteractions.js  
  setupCanvasControls(app, viewport, gridGraphicsRef.current, callbacks);
  ⚠️ DANGER: Both attach event listeners to the same app.stage. If both are active simultaneously, you get:
  - Duplicate events (every click triggers twice)
  - Tool conflicts (drawing doesn't work, labels create multiples)
  - Performance degradation
  - Unpredictable behavior

  🔧 RULE: Only ONE control system should be active at a time.

  2. Ref Initialization Timing (BREAKS EVERYTHING)

  // ❌ WRONG - Gets fallback functions if refs aren't ready
  const drawingHandlers = useMemo(() => {
    if (!appRef.current || !viewportRef.current || !tempDrawingGraphicsRef.current) {
      return { onDrawingStart: () => {} }; // DEAD FUNCTIONS!
    }
    // Real logic here...
  }, []);

  // ✅ CORRECT - Check refs dynamically
  const drawingHandlers = useMemo(() => ({
    onDrawingStart: (startPoint) => {
      if (!appRef.current || !viewportRef.current || !tempDrawingGraphicsRef.current) {
        console.warn('Refs not ready'); return;
      }
      // Real logic here...
    }
  }), []);
  ⚠️ DANGER: If refs aren't ready during initialization, you get permanent dead functions.

  3. State vs Ref Pattern (PERFORMANCE KILLER)

  // ❌ WRONG - Creates new Set on every render
  const [selectedIds, setSelectedIds] = useState(new Set());

  // ✅ CORRECT - Lazy initialization
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  // ❌ WRONG - Function patterns with context
  setSelectedIds(prev => [...prev, newId]); // BREAKS!

  // ✅ CORRECT - Direct array/Set updates
  selectionActions.setSelection([...selectedIds, newId]);

  4. Tool State Management (COORDINATION NIGHTMARE)

  // The tool system has multiple interdependent pieces:
  useToolState → useToolInteractionManager → Canvas Controls → UI Updates

  // ❌ DANGER: If any piece is out of sync:
  isDrawingMode = true  // Tool state
  toolBehavior.canDraw = false  // Behavior config  
  // Result: Tool appears active but doesn't work

  🎯 Critical Integration Points

  1. PixiJS Lifecycle Management

  // CRITICAL ORDER:
  1. Create PIXI app
  2. Initialize viewport
  3. Setup graphics refs
  4. Setup canvas controls
  5. Connect to React state

  // ❌ If you skip or reorder steps = CHAOS

  2. Event Handler Chain

  // CRITICAL FLOW:
  User Click → CanvasControls → controlCallbacksRef → Real Handlers → State Updates → PixiJS Render

  // ❌ If ANY link breaks = Feature doesn't work

  3. Context State Synchronization

  // State flows: Context → Hooks → Components → PixiJS
  // ❌ DANGER: Mixing useState with context actions
  // ✅ RULE: Always use context actions for state updates

  ⚡ Performance Landmines

  1. useEffect Dependency Hell

  // ❌ PERFORMANCE KILLER
  useEffect(() => {
    // Complex logic
  }, [props, state, functions, objects]); // All recreate every render

  // ✅ PERFORMANCE OPTIMIZED  
  useEffect(() => {
    // Complex logic
  }, [specificValue1, specificValue2]); // Only essential dependencies

  2. Object Recreation Cascade

  // ❌ Creates new objects every render
  const handlers = {
    onClick: () => doSomething(),
    onHover: () => doAnother()
  };

  // ✅ Stable references
  const handlers = useMemo(() => ({
    onClick: () => doSomething(),
    onHover: () => doAnother()
  }), [doSomething, doAnother]);

  🔧 Mission-Critical Debugging Points

  1. Tool State Verification

  console.log('Tool Debug:', {
    activeTool,
    isDrawingMode,
    toolBehavior: canvasTools.toolBehavior,
    refsReady: {
      app: !!appRef.current,
      viewport: !!viewportRef.current,
      tempGraphics: !!tempDrawingGraphicsRef.current
    }
  });

  2. Event System Health Check

  // In CanvasControls.js - Add this to ANY new feature
  console.log('Event Debug:', {
    target: e.target.constructor.name,
    isStage: e.target === app.stage,
    toolStates: /* all tool states */
  });

  3. State Synchronization Validation

  // Check if context and local state are in sync
  console.log('State Sync Check:', {
    contextLabels: textLabels.length,
    localCount: userLabelCount,
    selectedIds: selectedIds.size || selectedIds.length,
    pixi: textLabelContainersRef.current?.length
  });

  🚨 Golden Rules to Never Break

  1. NEVER have multiple setupCanvasControls calls active
  2. ALWAYS use lazy initialization for Sets/Maps: useState(() => new Set())
  3. ALWAYS check refs before using them in handlers
  4. NEVER mix useState function patterns with context actions
  5. ALWAYS use context actions for state updates, not direct useState
  6. NEVER put entire objects/props in useEffect dependencies
  7. ALWAYS verify tool state synchronization when adding features

  💡 Pro Developer Insights

  Most Common Breaks:
  1. Adding a new tool without updating all pieces of the tool system
  2. Creating useEffect with broad dependencies (kills performance)
  3. Forgetting to check if refs are ready in new handlers
  4. Mixing control systems accidentally

  Most Critical Files to Understand:
  1. CanvasControls.js - Event routing brain
  2. FigmaStyleCanvasRefactoredClean.jsx - Integration orchestrator
  3. useCanvasToolsIntegrated.js - Tool coordination hub
  4. canvasState.js - Single source of truth

  Emergency Debug Strategy:
  1. Check tool states are synchronized
  2. Verify only one control system is active
  3. Confirm refs are ready when handlers run
  4. Validate state updates are going through context actions

  Understanding these patterns will prevent 90% of the bugs and performance issues in this codebase.