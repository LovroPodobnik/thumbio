import * as PIXI from 'pixi.js';

/**
 * Drawing renderer for PixiJS - handles drawing graphics and layer management
 */

// Default drawing styles
export const DEFAULT_DRAWING_STYLE = {
  color: 0x3b82f6, // blue-500
  width: 4,
  alpha: 1.0,
  lineCap: 'round',
  lineJoin: 'round'
};

/**
 * Creates drawing graphics containers for two-layer system
 * @param {PIXI.Application} app - PixiJS application
 * @param {PIXI.Container} viewport - Main viewport container
 * @returns {Object} Drawing containers and management functions
 */
export const createDrawingSystem = (app, viewport) => {
  // Create background drawings container (behind thumbnails)
  const backgroundDrawingsContainer = new PIXI.Container();
  backgroundDrawingsContainer.label = 'backgroundDrawings';
  
  // Create foreground drawings container (over thumbnails)  
  const foregroundDrawingsContainer = new PIXI.Container();
  foregroundDrawingsContainer.label = 'foregroundDrawings';
  
  // Insert background container at the beginning of viewport
  viewport.addChildAt(backgroundDrawingsContainer, 0);
  
  // Add foreground container at the end of viewport (on top)
  viewport.addChild(foregroundDrawingsContainer);
  
  return {
    backgroundDrawingsContainer,
    foregroundDrawingsContainer,
    viewport,
    app
  };
};

/**
 * Creates a new drawing stroke graphics object
 * @param {Object} drawing - Drawing data object
 * @param {Object} style - Drawing style override
 * @returns {PIXI.Graphics} Graphics object for the drawing
 */
export const createDrawingGraphics = (drawing, style = {}) => {
  const graphics = new PIXI.Graphics();
  const drawingStyle = { ...DEFAULT_DRAWING_STYLE, ...drawing.style, ...style };
  
  graphics.userData = {
    drawingId: drawing.id,
    type: drawing.type,
    layer: drawing.layer
  };
  
  // Set stroke style
  graphics.setStrokeStyle({
    width: drawingStyle.width,
    color: drawingStyle.color,
    alpha: drawingStyle.alpha,
    cap: drawingStyle.lineCap || 'round',
    join: drawingStyle.lineJoin || 'round'
  });
  
  return graphics;
};

/**
 * Renders a freehand drawing stroke
 * @param {PIXI.Graphics} graphics - Graphics object to draw on
 * @param {Array} points - Array of points with x, y coordinates
 * @param {Object} style - Drawing style
 */
export const renderFreehandStroke = (graphics, points, style = {}) => {
  if (!points || points.length < 2) return;
  
  graphics.clear();
  
  // Set stroke style
  const drawingStyle = { ...DEFAULT_DRAWING_STYLE, ...style };
  graphics.setStrokeStyle({
    width: drawingStyle.width,
    color: drawingStyle.color,
    alpha: drawingStyle.alpha,
    cap: 'round',
    join: 'round'
  });
  
  // Start path
  graphics.moveTo(points[0].x, points[0].y);
  
  if (points.length === 2) {
    // Simple line for two points
    graphics.lineTo(points[1].x, points[1].y);
  } else {
    // Smooth curve for multiple points using quadratic curves
    for (let i = 1; i < points.length - 1; i++) {
      const currentPoint = points[i];
      const nextPoint = points[i + 1];
      
      // Calculate control point (midpoint)
      const controlX = (currentPoint.x + nextPoint.x) / 2;
      const controlY = (currentPoint.y + nextPoint.y) / 2;
      
      graphics.quadraticCurveTo(currentPoint.x, currentPoint.y, controlX, controlY);
    }
    
    // Draw to final point
    const lastPoint = points[points.length - 1];
    graphics.lineTo(lastPoint.x, lastPoint.y);
  }
  
  graphics.stroke();
};

/**
 * Renders a line drawing
 * @param {PIXI.Graphics} graphics - Graphics object to draw on
 * @param {Object} startPoint - Start point {x, y}
 * @param {Object} endPoint - End point {x, y}
 * @param {Object} style - Drawing style
 */
export const renderLine = (graphics, startPoint, endPoint, style = {}) => {
  graphics.clear();
  
  const drawingStyle = { ...DEFAULT_DRAWING_STYLE, ...style };
  graphics.setStrokeStyle({
    width: drawingStyle.width,
    color: drawingStyle.color,
    alpha: drawingStyle.alpha,
    cap: 'round'
  });
  
  graphics.moveTo(startPoint.x, startPoint.y);
  graphics.lineTo(endPoint.x, endPoint.y);
  graphics.stroke();
};

/**
 * Renders a rectangle drawing
 * @param {PIXI.Graphics} graphics - Graphics object to draw on
 * @param {Object} startPoint - Start point {x, y}
 * @param {Object} endPoint - End point {x, y}
 * @param {Object} style - Drawing style
 */
export const renderRectangle = (graphics, startPoint, endPoint, style = {}) => {
  graphics.clear();
  
  const drawingStyle = { ...DEFAULT_DRAWING_STYLE, ...style };
  graphics.setStrokeStyle({
    width: drawingStyle.width,
    color: drawingStyle.color,
    alpha: drawingStyle.alpha,
    cap: 'round',
    join: 'round'
  });
  
  const x = Math.min(startPoint.x, endPoint.x);
  const y = Math.min(startPoint.y, endPoint.y);
  const width = Math.abs(endPoint.x - startPoint.x);
  const height = Math.abs(endPoint.y - startPoint.y);
  
  graphics.rect(x, y, width, height);
  graphics.stroke();
};

/**
 * Renders a circle drawing
 * @param {PIXI.Graphics} graphics - Graphics object to draw on
 * @param {Object} centerPoint - Center point {x, y}
 * @param {number} radius - Circle radius
 * @param {Object} style - Drawing style
 */
export const renderCircle = (graphics, centerPoint, radius, style = {}) => {
  graphics.clear();
  
  const drawingStyle = { ...DEFAULT_DRAWING_STYLE, ...style };
  graphics.setStrokeStyle({
    width: drawingStyle.width,
    color: drawingStyle.color,
    alpha: drawingStyle.alpha
  });
  
  graphics.circle(centerPoint.x, centerPoint.y, radius);
  graphics.stroke();
};

/**
 * Adds a drawing to the appropriate layer container
 * @param {Object} drawingSystem - Drawing system containers
 * @param {PIXI.Graphics} graphics - Drawing graphics object
 * @param {string} layer - Layer name ('behind_thumbnails' or 'over_thumbnails')
 */
export const addDrawingToLayer = (drawingSystem, graphics, layer = 'over_thumbnails') => {
  const container = layer === 'behind_thumbnails' 
    ? drawingSystem.backgroundDrawingsContainer 
    : drawingSystem.foregroundDrawingsContainer;
    
  container.addChild(graphics);
};

/**
 * Removes a drawing from its layer container
 * @param {Object} drawingSystem - Drawing system containers
 * @param {string} drawingId - ID of drawing to remove
 */
export const removeDrawingFromLayer = (drawingSystem, drawingId) => {
  const containers = [
    drawingSystem.backgroundDrawingsContainer,
    drawingSystem.foregroundDrawingsContainer
  ];
  
  containers.forEach(container => {
    const graphics = container.children.find(child => 
      child.userData && child.userData.drawingId === drawingId
    );
    
    if (graphics) {
      container.removeChild(graphics);
      graphics.destroy();
    }
  });
};

/**
 * Clears all drawings from both layers
 * @param {Object} drawingSystem - Drawing system containers
 */
export const clearAllDrawings = (drawingSystem) => {
  drawingSystem.backgroundDrawingsContainer.removeChildren().forEach(child => child.destroy());
  drawingSystem.foregroundDrawingsContainer.removeChildren().forEach(child => child.destroy());
};

/**
 * Updates viewport culling for drawing performance
 * @param {Object} drawingSystem - Drawing system containers
 * @param {Object} viewport - Viewport transform
 * @param {Object} screenBounds - Screen bounds for culling
 */
export const updateDrawingCulling = (drawingSystem, viewport, screenBounds) => {
  const containers = [
    drawingSystem.backgroundDrawingsContainer,
    drawingSystem.foregroundDrawingsContainer
  ];
  
  containers.forEach(container => {
    container.children.forEach(graphics => {
      const bounds = graphics.getBounds();
      
      // Simple viewport culling - hide drawings outside view
      const isVisible = bounds.x < screenBounds.right &&
                       bounds.x + bounds.width > screenBounds.left &&
                       bounds.y < screenBounds.bottom &&
                       bounds.y + bounds.height > screenBounds.top;
      
      graphics.visible = isVisible;
    });
  });
};

/**
 * Creates drawing data structure
 * @param {string} type - Drawing type ('freehand', 'line', 'rectangle', 'circle')
 * @param {Array|Object} points - Drawing points or parameters
 * @param {Object} style - Drawing style
 * @param {string} layer - Layer name
 * @returns {Object} Drawing data object
 */
export const createDrawingData = (type, points, style = {}, layer = 'over_thumbnails') => {
  const drawing = {
    id: `draw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    layer,
    style: { ...DEFAULT_DRAWING_STYLE, ...style },
    points: Array.isArray(points) ? points : [points],
    bounds: null,
    timestamp: new Date().toISOString()
  };
  
  // Calculate bounds based on type and points
  if (points && points.length > 0) {
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    drawing.bounds = {
      x: Math.min(...xs),
      y: Math.min(...ys),
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys)
    };
  }
  
  return drawing;
};

/**
 * Smooths a path by removing redundant points and interpolating
 * @param {Array} points - Raw points array
 * @param {number} tolerance - Distance tolerance for point reduction
 * @returns {Array} Smoothed points array
 */
export const smoothPath = (points, tolerance = 2) => {
  if (!points || points.length <= 2) return points;
  
  const smoothed = [points[0]]; // Always keep first point
  
  for (let i = 1; i < points.length - 1; i++) {
    const prev = smoothed[smoothed.length - 1];
    const current = points[i];
    const next = points[i + 1];
    
    // Calculate distance from previous point
    const distance = Math.sqrt(
      Math.pow(current.x - prev.x, 2) + Math.pow(current.y - prev.y, 2)
    );
    
    // Only add point if it's far enough from previous point
    if (distance >= tolerance) {
      smoothed.push(current);
    }
  }
  
  smoothed.push(points[points.length - 1]); // Always keep last point
  
  return smoothed;
};