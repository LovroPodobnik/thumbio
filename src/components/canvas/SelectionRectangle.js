// Selection rectangle utility functions for Figma-style rectangular selection

export const drawSelectionRect = (graphics, rect, viewport) => {
  if (!rect || !graphics) return;
  
  graphics.clear();
  
  const strokeWidth = 1 / viewport.scale.x; // Scale-independent stroke
  
  graphics.rect(rect.x, rect.y, rect.width, rect.height);
  graphics.fill({ color: 0x007AFF, alpha: 0.1 }); // Blue fill like Figma
  graphics.stroke({ 
    color: 0x007AFF, 
    width: strokeWidth,
    alpha: 0.8 
  });
};

export const clearSelectionRect = (graphics) => {
  if (!graphics) return;
  graphics.clear();
};

export const isRectangleIntersecting = (rect, container) => {
  if (!rect || !container) return false;
  
  // Thumbnail containers have fixed dimensions: 320x240
  const THUMBNAIL_WIDTH = 320;
  const THUMBNAIL_HEIGHT = 240;
  
  // Use container's local bounds 
  // Both rect and container are in the same viewport coordinate space
  const containerBounds = {
    left: container.x,
    right: container.x + THUMBNAIL_WIDTH,
    top: container.y,
    bottom: container.y + THUMBNAIL_HEIGHT
  };
  
  // Normalize rectangle (handle negative width/height from dragging)
  const normalizedRect = {
    left: Math.min(rect.x, rect.x + rect.width),
    right: Math.max(rect.x, rect.x + rect.width),
    top: Math.min(rect.y, rect.y + rect.height),
    bottom: Math.max(rect.y, rect.y + rect.height)
  };
  
  // Check for intersection using proper boundary logic
  const intersects = !(normalizedRect.right <= containerBounds.left || 
                      normalizedRect.left >= containerBounds.right ||
                      normalizedRect.bottom <= containerBounds.top ||
                      normalizedRect.top >= containerBounds.bottom);
  
  return intersects;
};

export const createRectFromPoints = (startPoint, endPoint) => {
  return {
    x: Math.min(startPoint.x, endPoint.x),
    y: Math.min(startPoint.y, endPoint.y),
    width: Math.abs(endPoint.x - startPoint.x),
    height: Math.abs(endPoint.y - startPoint.y)
  };
};

export const getIntersectingThumbnails = (rect, thumbnailContainers) => {
  if (!rect || !thumbnailContainers) return [];
  
  return thumbnailContainers.filter(container => 
    isRectangleIntersecting(rect, container)
  );
};

export const isRectangleIntersectingLabel = (rect, container) => {
  if (!rect || !container || !container.hitArea) return false;
  
  // Text label containers have variable dimensions based on their hitArea
  const containerBounds = {
    left: container.x,
    right: container.x + container.hitArea.width,
    top: container.y,
    bottom: container.y + container.hitArea.height
  };
  
  // Normalize rectangle (handle negative width/height from dragging)
  const normalizedRect = {
    left: Math.min(rect.x, rect.x + rect.width),
    right: Math.max(rect.x, rect.x + rect.width),
    top: Math.min(rect.y, rect.y + rect.height),
    bottom: Math.max(rect.y, rect.y + rect.height)
  };
  
  // Check for intersection using proper boundary logic
  const intersects = !(normalizedRect.right <= containerBounds.left || 
                      normalizedRect.left >= containerBounds.right ||
                      normalizedRect.bottom <= containerBounds.top ||
                      normalizedRect.top >= containerBounds.bottom);
  
  return intersects;
};

export const getIntersectingTextLabels = (rect, textLabelContainers) => {
  if (!rect || !textLabelContainers) return [];
  
  return textLabelContainers.filter(container => 
    isRectangleIntersectingLabel(rect, container)
  );
};

// Throttle function for performance
export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};