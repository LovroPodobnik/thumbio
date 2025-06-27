import { useMemo } from 'react';

/**
 * Custom hook for viewport culling with aggressive optimizations
 * Calculates which thumbnails are visible in the viewport with a buffer
 * 
 * @param {Array} items - Array of items with x, y coordinates
 * @param {Object} viewport - Viewport configuration
 * @param {number} viewport.x - Viewport x position
 * @param {number} viewport.y - Viewport y position
 * @param {number} viewport.width - Viewport width
 * @param {number} viewport.height - Viewport height
 * @param {number} viewport.scale - Viewport scale/zoom level
 * @param {Object} options - Additional options
 * @param {number} options.bufferFactor - Buffer multiplier for off-screen rendering (default: 0.25)
 * @param {Object} options.itemSize - Size of each item
 * @param {number} options.maxVisibleItems - Maximum number of items to render
 * @param {boolean} options.enableDistanceQuality - Enable distance-based quality reduction
 * @returns {Array} Array of visible items with render quality hints
 */
const useViewportCulling = (
  items, 
  viewport, 
  options = {}
) => {
  const {
    bufferFactor = 0.25, // More aggressive culling by default
    itemSize = { width: 320, height: 240 },
    maxVisibleItems = 100,
    enableDistanceQuality = true
  } = options;
  return useMemo(() => {
    if (!items || items.length === 0) return [];

    const { x: viewportX, y: viewportY, width, height, scale } = viewport;
    
    // Calculate viewport bounds in canvas coordinates with aggressive buffer
    const bufferX = width * bufferFactor;
    const bufferY = height * bufferFactor;
    
    // Convert viewport coordinates to canvas coordinates
    const canvasLeft = (-viewportX - bufferX) / scale;
    const canvasRight = (-viewportX + width + bufferX) / scale;
    const canvasTop = (-viewportY - bufferY) / scale;
    const canvasBottom = (-viewportY + height + bufferY) / scale;
    
    // Calculate viewport center for distance calculations
    const centerX = (-viewportX + width / 2) / scale;
    const centerY = (-viewportY + height / 2) / scale;
    
    // Filter and enhance items with distance and quality data
    const visibleItems = [];
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemLeft = item.x;
      const itemRight = item.x + itemSize.width;
      const itemTop = item.y;
      const itemBottom = item.y + itemSize.height;
      
      // Check if item intersects with viewport
      const isVisible = !(
        itemRight < canvasLeft ||
        itemLeft > canvasRight ||
        itemBottom < canvasTop ||
        itemTop > canvasBottom
      );
      
      if (!isVisible) continue;
      
      // Calculate distance from center
      const itemCenterX = item.x + itemSize.width / 2;
      const itemCenterY = item.y + itemSize.height / 2;
      const distance = Math.sqrt(
        Math.pow(itemCenterX - centerX, 2) + 
        Math.pow(itemCenterY - centerY, 2)
      );
      
      // Calculate render quality based on distance and scale
      let renderQuality = 'high';
      if (enableDistanceQuality) {
        const maxDistance = Math.sqrt(Math.pow(width / scale, 2) + Math.pow(height / scale, 2));
        const distanceRatio = distance / maxDistance;
        
        if (scale < 0.5 || distanceRatio > 0.8) {
          renderQuality = 'low';
        } else if (scale < 1 || distanceRatio > 0.5) {
          renderQuality = 'medium';
        }
      }
      
      // Check if item is moving (if velocity data is available)
      const isMoving = item.velocity && 
        (Math.abs(item.velocity.x) > 50 || Math.abs(item.velocity.y) > 50);
      
      visibleItems.push({
        ...item,
        distanceFromCenter: distance,
        isInViewport: true,
        renderQuality,
        shouldSkipDetails: isMoving || renderQuality === 'low',
        priority: -distance // Negative so we can sort ascending
      });
      
      // Early exit if we've hit the max visible items limit
      if (visibleItems.length >= maxVisibleItems) {
        break;
      }
    }
    
    // Sort by priority (distance from center)
    visibleItems.sort((a, b) => a.priority - b.priority);
    
    // Limit to maxVisibleItems after sorting
    const finalItems = visibleItems.slice(0, maxVisibleItems);
    
    return finalItems;
  }, [items, viewport.x, viewport.y, viewport.width, viewport.height, viewport.scale, itemSize.width, itemSize.height, bufferFactor, maxVisibleItems, enableDistanceQuality]);
};

export default useViewportCulling;