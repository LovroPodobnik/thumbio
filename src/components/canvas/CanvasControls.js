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
    isHandToolMode,
    isSelectionAllowed,
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
  
  // Store event handler references for cleanup
  const handlePointerDown = (e) => {
    console.log('🎯 CanvasControls: Pointer down detected, checking tool states:', {
      isDrawingMode: isDrawingMode ? isDrawingMode() : 'no function',
      isHandToolMode: isHandToolMode ? isHandToolMode() : 'no function',
      target: e.target.constructor.name,
      isStage: e.target === app.stage
    });
    
    // Handle hand tool mode FIRST - should work regardless of what was clicked
    if (isHandToolMode && isHandToolMode()) {
      isPanning = true;
      const globalPos = e.global;
      panStart = { x: globalPos.x, y: globalPos.y };
      viewportStart = { x: viewport.x, y: viewport.y };
      app.canvas.style.cursor = 'grabbing';
      return;
    }
    
    // Handle space panning FIRST - should work regardless of what was clicked
    if (isSpacePanning) {
      isPanning = true;
      const globalPos = e.global;
      panStart = { x: globalPos.x, y: globalPos.y };
      viewportStart = { x: viewport.x, y: viewport.y };
      app.canvas.style.cursor = 'grabbing';
      return;
    }
    
    // For all other interactions, only proceed if clicking on the stage
    if (e.target === app.stage) {
      // Handle drawing mode
      if (isDrawingMode && isDrawingMode() && !isSpacePanning) {
        console.log('🎨 CanvasControls: Drawing mode detected, starting draw');
        const globalPos = e.global;
        const localPos = viewport.toLocal(globalPos);
        
        isDrawing = true;
        drawingStartPoint = { x: localPos.x, y: localPos.y };
        
        if (onDrawingStart) {
          console.log('🎨 CanvasControls: Calling onDrawingStart with:', localPos);
          onDrawingStart(localPos, e.originalEvent || e);
        } else {
          console.warn('🎨 CanvasControls: onDrawingStart callback is missing!');
        }
        return;
      }
      
      // Handle comment mode
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
        if (callbacks.onAddLabel) {
          callbacks.onAddLabel({ x: localPos.x, y: localPos.y });
        }
        return;
      }
      
      // Handle canvas click (for closing comments) - only if not in special modes
      if (onCanvasClick) {
        onCanvasClick();
      }
      
      // Check if we're in selection mode (not in any other tool mode)
      const isInDrawingMode = isDrawingMode && isDrawingMode();
      const isInHandToolMode = isHandToolMode && isHandToolMode();
      const isInCommentMode = callbacks.isAddingComment && callbacks.isAddingComment();
      const isInLabelMode = callbacks.isAddingLabel && callbacks.isAddingLabel();
      
      const inSelectionMode = !isInDrawingMode && !isInHandToolMode && 
                             !isInCommentMode && !isInLabelMode && !isSpacePanning;
      
      if (inSelectionMode && isSelectionAllowed && isSelectionAllowed()) {
        // Start rectangular selection - only in selection mode
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
    }
  };
  
  const handlePointerMove = (e) => {
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
  };
  
  const handlePointerUp = (e) => {
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
      
      // Restore cursor based on current tool
      if (isHandToolMode && isHandToolMode()) {
        app.canvas.style.cursor = 'grab';
      } else if (isSpacePanning) {
        app.canvas.style.cursor = 'grab';
      } else {
        app.canvas.style.cursor = 'default';
      }
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
  };
  
  const handlePointerUpOutside = (e) => {
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
      
      // Restore cursor based on current tool
      if (isHandToolMode && isHandToolMode()) {
        app.canvas.style.cursor = 'grab';
      } else if (isSpacePanning) {
        app.canvas.style.cursor = 'grab';
      } else {
        app.canvas.style.cursor = 'default';
      }
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
  };
  
  // Add event listeners
  app.stage.on('pointerdown', handlePointerDown);
  app.stage.on('pointermove', handlePointerMove);
  app.stage.on('pointerup', handlePointerUp);
  app.stage.on('pointerupoutside', handlePointerUpOutside);
  
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
  
  const handleContextMenu = (e) => {
    e.preventDefault();
  };
  
  app.canvas.addEventListener('contextmenu', handleContextMenu);
  
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
    
    // Remove stage event listeners
    app.stage.off('pointerdown', handlePointerDown);
    app.stage.off('pointermove', handlePointerMove);
    app.stage.off('pointerup', handlePointerUp);
    app.stage.off('pointerupoutside', handlePointerUpOutside);
    
    // Remove window and canvas event listeners
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    app.canvas.removeEventListener('wheel', handleWheel);
    app.canvas.removeEventListener('contextmenu', handleContextMenu);
  };
};
