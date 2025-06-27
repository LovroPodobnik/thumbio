import * as PIXI from 'pixi.js';

const GRID_SIZE = 50;
const GRID_COLOR = 0xe0e0e0;
const GRID_ALPHA = 0.5;
const GRID_LINE_WIDTH = 1;

export const createGridTexture = (app) => {
  const resolution = window.devicePixelRatio || 1;
  const graphics = new PIXI.Graphics();
  
  // Scale line width based on device pixel ratio for consistent appearance
  const scaledLineWidth = GRID_LINE_WIDTH * resolution;
  
  graphics.setStrokeStyle({ width: scaledLineWidth, color: GRID_COLOR, alpha: GRID_ALPHA });
  
  // Draw at scaled size for high-DPI
  const scaledGridSize = GRID_SIZE * resolution;
  
  graphics.moveTo(0, 0);
  graphics.lineTo(scaledGridSize, 0);
  
  graphics.moveTo(0, 0);
  graphics.lineTo(0, scaledGridSize);
  
  graphics.stroke();
  
  const renderTexture = PIXI.RenderTexture.create({
    width: GRID_SIZE,
    height: GRID_SIZE,
    resolution: resolution
  });
  
  // Set scale mode on the texture source in PIXI v8
  renderTexture.source.scaleMode = 'linear';
  
  // Scale the graphics down to fit the render texture size
  graphics.scale.set(1 / resolution);
  
  app.renderer.render({
    container: graphics,
    target: renderTexture
  });
  
  graphics.destroy();
  
  return renderTexture;
};

export const createGridSprite = (app) => {
  const gridTexture = createGridTexture(app);
  const tilingSprite = new PIXI.TilingSprite({
    texture: gridTexture,
    width: app.screen.width * 3,
    height: app.screen.height * 3
  });
  
  tilingSprite.anchor.set(0.5);
  tilingSprite.position.set(app.screen.width / 2, app.screen.height / 2);
  
  return tilingSprite;
};

export const updateGridPosition = (gridSprite, viewport, app) => {
  if (!gridSprite) return;
  
  const offsetX = viewport.x % GRID_SIZE;
  const offsetY = viewport.y % GRID_SIZE;
  
  gridSprite.tilePosition.x = offsetX;
  gridSprite.tilePosition.y = offsetY;
  
  gridSprite.tileScale.x = viewport.scale.x;
  gridSprite.tileScale.y = viewport.scale.y;
  
  gridSprite.width = app.screen.width * 3 / viewport.scale.x;
  gridSprite.height = app.screen.height * 3 / viewport.scale.y;
};

export const drawGrid = (gridGraphics, viewport, app) => {
  console.warn('drawGrid is deprecated. Use updateGridPosition with a TilingSprite instead.');
};

export const setupCanvasControls = (app, viewport, gridGraphics, callbacks) => {
  const { 
    onViewportTransform, 
    onAddComment, 
    onClearSelection, 
    onCanvasClick, 
    onRectSelectionStart, 
    onRectSelectionMove, 
    onRectSelectionEnd,
    onDrawingStart,
    onDrawingMove,
    onDrawingEnd,
    isDrawingMode,
    onSpacePanStart,
    onSpacePanEnd
  } = callbacks;
  
  let isPanning = false;
  let panStart = { x: 0, y: 0 };
  let viewportStart = { x: 0, y: 0 };
  let isSpacePanning = false;
  
  // Drawing state
  let isDrawing = false;
  let drawingStartPoint = { x: 0, y: 0 };
  
  // Rectangular selection state
  let isRectSelecting = false;
  let rectSelectionStart = { x: 0, y: 0 };
  
  // Background interactions
  app.stage.eventMode = 'static';
  app.stage.hitArea = app.screen;
  
  app.stage.on('pointerdown', (e) => {
    if (e.target === app.stage) {
      // Handle drawing mode - highest priority (but not when space panning)
      if (isDrawingMode && isDrawingMode() && !isSpacePanning) {
        const globalPos = e.global;
        const localPos = viewport.toLocal(globalPos);
        
        isDrawing = true;
        drawingStartPoint = { x: localPos.x, y: localPos.y };
        
        if (onDrawingStart) {
          onDrawingStart(localPos, e.originalEvent || e);
        }
        return;
      }
      
      // Handle comment mode - second priority
      if (callbacks.isAddingComment && callbacks.isAddingComment()) {
        const globalPos = e.global;
        const localPos = viewport.toLocal(globalPos);
        if (onAddComment) onAddComment({ x: localPos.x, y: localPos.y });
        return;
      }
      
      // Handle label mode
      if (callbacks.isAddingLabel && callbacks.isAddingLabel()) {
        const globalPos = e.global;
        const localPos = viewport.toLocal(globalPos);
        if (callbacks.onAddLabel) callbacks.onAddLabel({ x: localPos.x, y: localPos.y });
        return;
      }
      
      // Handle space panning - second priority
      if (isSpacePanning) {
        isPanning = true;
        const globalPos = e.global;
        panStart = { x: globalPos.x, y: globalPos.y };
        viewportStart = { x: viewport.x, y: viewport.y };
        return;
      }
      
      // Handle canvas click (for closing comments) - only if not in special modes
      if (onCanvasClick) {
        onCanvasClick();
      }
      
      // Start rectangular selection - only if not in drawing mode
      const globalPos = e.global;
      const localPos = viewport.toLocal(globalPos);
      
      // Clear selection if no modifier keys (unless shift/cmd for multi-select)
      const originalEvent = e.originalEvent || e;
      if (!originalEvent.shiftKey && !originalEvent.metaKey && !originalEvent.ctrlKey && onClearSelection) {
        onClearSelection();
      }
      
      // Start rectangular selection
      isRectSelecting = true;
      rectSelectionStart = { x: localPos.x, y: localPos.y };
      
      if (onRectSelectionStart) {
        onRectSelectionStart(rectSelectionStart, originalEvent);
      }
    }
  });
  
  app.stage.on('pointermove', (e) => {
    // Handle drawing
    if (isDrawing) {
      const globalPos = e.global;
      const localPos = viewport.toLocal(globalPos);
      
      if (onDrawingMove) {
        onDrawingMove(drawingStartPoint, localPos, e.originalEvent || e);
      }
      return;
    }
    
    // Handle panning
    if (isPanning) {
      const globalPos = e.global;
      viewport.x = viewportStart.x + (globalPos.x - panStart.x);
      viewport.y = viewportStart.y + (globalPos.y - panStart.y);
      
      if (onViewportTransform) {
        onViewportTransform({
          x: viewport.x,
          y: viewport.y,
          scale: viewport.scale.x
        });
      }
      updateGridPosition(gridGraphics, viewport, app);
      return;
    }
    
    // Handle rectangular selection (only if not drawing)
    if (isRectSelecting && !isDrawing) {
      const globalPos = e.global;
      const localPos = viewport.toLocal(globalPos);
      const originalEvent = e.originalEvent || e;
      
      if (onRectSelectionMove) {
        onRectSelectionMove(rectSelectionStart, localPos, originalEvent);
      }
    }
  });
  
  app.stage.on('pointerup', (e) => {
    // Handle drawing end
    if (isDrawing) {
      const globalPos = e.global;
      const localPos = viewport.toLocal(globalPos);
      
      if (onDrawingEnd) {
        onDrawingEnd(drawingStartPoint, localPos, e.originalEvent || e);
      }
      
      isDrawing = false;
      return;
    }
    
    // Handle panning end
    if (isPanning) {
      isPanning = false;
      return;
    }
    
    // Handle rectangular selection end (only if not drawing)
    if (isRectSelecting && !isDrawing) {
      const globalPos = e.global;
      const localPos = viewport.toLocal(globalPos);
      const originalEvent = e.originalEvent || e;
      
      if (onRectSelectionEnd) {
        onRectSelectionEnd(rectSelectionStart, localPos, originalEvent);
      }
      
      isRectSelecting = false;
    }
  });
  
  app.stage.on('pointerupoutside', (e) => {
    // Handle drawing end
    if (isDrawing) {
      const globalPos = e.global;
      const localPos = viewport.toLocal(globalPos);
      
      if (onDrawingEnd) {
        onDrawingEnd(drawingStartPoint, localPos, e.originalEvent || e);
      }
      
      isDrawing = false;
      return;
    }
    
    // Handle panning end
    if (isPanning) {
      isPanning = false;
      return;
    }
    
    // Handle rectangular selection end (only if not drawing)
    if (isRectSelecting && !isDrawing) {
      const globalPos = e.global;
      const localPos = viewport.toLocal(globalPos);
      const originalEvent = e.originalEvent || e;
      
      if (onRectSelectionEnd) {
        onRectSelectionEnd(rectSelectionStart, localPos, originalEvent);
      }
      
      isRectSelecting = false;
    }
  });
  
  // Zoom with mouse wheel - RAF batched
  let wheelRAF = null;
  let pendingWheelEvent = null;
  
  const processWheel = () => {
    if (!pendingWheelEvent) return;
    
    const e = pendingWheelEvent;
    const scaleDelta = 1 - e.deltaY * 0.001;
    const newScale = viewport.scale.x * scaleDelta;
    
    if (newScale > 0.1 && newScale < 5) {
      const rect = app.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const worldPos = {
        x: (mouseX - viewport.x) / viewport.scale.x,
        y: (mouseY - viewport.y) / viewport.scale.y
      };
      
      viewport.scale.x = newScale;
      viewport.scale.y = newScale;
      
      viewport.x = mouseX - worldPos.x * newScale;
      viewport.y = mouseY - worldPos.y * newScale;
      
      if (onViewportTransform) {
        onViewportTransform({
          x: viewport.x,
          y: viewport.y,
          scale: viewport.scale.x
        });
      }
      updateGridPosition(gridGraphics, viewport, app);
    }
    
    pendingWheelEvent = null;
    wheelRAF = null;
  };
  
  const handleWheel = (e) => {
    e.preventDefault();
    pendingWheelEvent = e;
    
    if (!wheelRAF) {
      wheelRAF = requestAnimationFrame(processWheel);
    }
  };
  
  app.canvas.addEventListener('wheel', handleWheel, { passive: false });
  
  // Keyboard shortcuts
  const handleKeyDown = (e) => {
    // Space for pan mode
    if (e.key === ' ' && !e.repeat) {
      e.preventDefault();
      isSpacePanning = true;
      app.canvas.style.cursor = 'grab';
      
      // Notify that space panning started (for drawing mode)
      if (onSpacePanStart) {
        onSpacePanStart();
      }
    }
    
    if (callbacks.onKeyDown) callbacks.onKeyDown(e);
  };
  
  const handleKeyUp = (e) => {
    if (e.key === ' ') {
      isSpacePanning = false;
      
      // Restore appropriate cursor based on mode
      if (isDrawingMode && isDrawingMode()) {
        // Need to check eraser mode here - pass it via callback or ref
        app.canvas.style.cursor = 'crosshair'; // Default to crosshair, will be updated by main component
      } else {
        app.canvas.style.cursor = 'default';
      }
      
      // Notify that space panning ended (for drawing mode)
      if (onSpacePanEnd) {
        onSpacePanEnd();
      }
    }
    
    if (callbacks.onKeyUp) callbacks.onKeyUp(e);
  };
  
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  
  // Handle resize - debounced
  let resizeTimeout = null;
  const handleResize = () => {
    // Clear any pending resize
    if (resizeTimeout) {
      clearTimeout(resizeTimeout);
    }
    
    // Debounce resize operations by 150ms
    resizeTimeout = setTimeout(() => {
      app.renderer.resize(window.innerWidth, window.innerHeight);
      updateGridPosition(gridGraphics, viewport, app);
    }, 150);
  };
  window.addEventListener('resize', handleResize);
  
  // Return cleanup function
  return () => {
    if (resizeTimeout) {
      clearTimeout(resizeTimeout);
    }
    if (wheelRAF) {
      cancelAnimationFrame(wheelRAF);
    }
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    app.canvas.removeEventListener('wheel', handleWheel);
  };
};