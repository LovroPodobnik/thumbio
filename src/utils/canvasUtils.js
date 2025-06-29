/**
 * Canvas utility functions for position calculations and transformations
 */

export const calculateZoomedPosition = (position, viewportTransform) => {
  return {
    x: position.x * viewportTransform.scale + viewportTransform.x,
    y: position.y * viewportTransform.scale + viewportTransform.y
  };
};

export const calculateCanvasPosition = (screenPosition, viewportTransform, containerRect) => {
  return {
    x: (screenPosition.x - containerRect.left - viewportTransform.x) / viewportTransform.scale,
    y: (screenPosition.y - containerRect.top - viewportTransform.y) / viewportTransform.scale
  };
};

export const calculateDragPosition = (clientX, clientY, containerRect, dragOffset, viewportTransform) => {
  return {
    x: (clientX - containerRect.left - dragOffset.x - viewportTransform.x) / viewportTransform.scale,
    y: (clientY - containerRect.top - dragOffset.y - viewportTransform.y) / viewportTransform.scale
  };
};

export const getMinimumDistance = (viewportScale) => {
  return Math.max(1, 3 / viewportScale);
};

export const calculateDistance = (point1, point2) => {
  return Math.sqrt(
    Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
  );
};

export const clampZoom = (scale, minZoom = 0.1, maxZoom = 5) => {
  return Math.max(minZoom, Math.min(maxZoom, scale));
};

export const calculateZoomStep = (currentScale, direction, factor = 1.2) => {
  return direction > 0 
    ? currentScale * factor 
    : currentScale / factor;
};