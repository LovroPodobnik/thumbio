import { useCallback, useEffect } from 'react';
import { updateGridPosition } from '../components/canvas/CanvasControls';

/**
 * Zoom Controls Hook
 * 
 * Manages zoom functionality with smooth transitions.
 * Provides consistent zoom API and handles viewport updates.
 * Separates zoom logic from UI components.
 */

const ZOOM_LEVELS = [0.1, 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4];

const useZoomControls = ({
  viewportRef,
  viewportTransform,
  setViewportTransform,
  gridGraphicsRef,
  appRef,
  minZoom = 0.1,
  maxZoom = 5,
  zoomStep = 1.2
}) => {
  
  const zoomIn = useCallback(() => {
    if (!viewportRef.current || !appRef?.current) return;
    const currentScale = viewportTransform.scale;
    const nextZoom = ZOOM_LEVELS.find(level => level > currentScale + 0.01);
    const newScale = Math.min(nextZoom || maxZoom, maxZoom);
    
    const viewport = viewportRef.current;
    const app = appRef.current;
    
    // Calculate center of screen
    const centerX = app.screen.width / 2;
    const centerY = app.screen.height / 2;
    
    // Calculate world position at center before zoom
    const worldPos = {
      x: (centerX - viewport.x) / viewport.scale.x,
      y: (centerY - viewport.y) / viewport.scale.y
    };
    
    // Apply new scale
    viewport.scale.x = newScale;
    viewport.scale.y = newScale;
    
    // Adjust position to keep center point stable
    viewport.x = centerX - worldPos.x * newScale;
    viewport.y = centerY - worldPos.y * newScale;
    
    setViewportTransform({
      x: viewport.x,
      y: viewport.y,
      scale: newScale
    });
    
    // Update grid position
    if (gridGraphicsRef?.current && appRef?.current) {
      updateGridPosition(gridGraphicsRef.current, viewport, appRef.current);
    }
  }, [viewportRef, viewportTransform, maxZoom, setViewportTransform, gridGraphicsRef, appRef]);

  const zoomOut = useCallback(() => {
    if (!viewportRef.current || !appRef?.current) return;
    const currentScale = viewportTransform.scale;
    const prevZoom = ZOOM_LEVELS.slice().reverse().find(level => level < currentScale - 0.01);
    const newScale = Math.max(prevZoom || minZoom, minZoom);
    
    const viewport = viewportRef.current;
    const app = appRef.current;
    
    // Calculate center of screen
    const centerX = app.screen.width / 2;
    const centerY = app.screen.height / 2;
    
    // Calculate world position at center before zoom
    const worldPos = {
      x: (centerX - viewport.x) / viewport.scale.x,
      y: (centerY - viewport.y) / viewport.scale.y
    };
    
    // Apply new scale
    viewport.scale.x = newScale;
    viewport.scale.y = newScale;
    
    // Adjust position to keep center point stable
    viewport.x = centerX - worldPos.x * newScale;
    viewport.y = centerY - worldPos.y * newScale;
    
    setViewportTransform({
      x: viewport.x,
      y: viewport.y,
      scale: newScale
    });
    
    // Update grid position
    if (gridGraphicsRef?.current && appRef?.current) {
      updateGridPosition(gridGraphicsRef.current, viewport, appRef.current);
    }
  }, [viewportRef, viewportTransform, minZoom, setViewportTransform, gridGraphicsRef, appRef]);

  const zoomToFit = useCallback(() => {
    if (!viewportRef.current) return;
    
    // Reset to 100% zoom and center the view
    const viewport = viewportRef.current;
    viewport.scale.x = 1;
    viewport.scale.y = 1;
    viewport.x = 0;
    viewport.y = 0;
    
    setViewportTransform({ x: 0, y: 0, scale: 1 });
    
    // Update grid position
    if (gridGraphicsRef?.current && appRef?.current) {
      updateGridPosition(gridGraphicsRef.current, viewport, appRef.current);
    }
  }, [viewportRef, setViewportTransform, gridGraphicsRef, appRef]);

  const setZoom = useCallback((scale) => {
    if (!viewportRef.current) return;
    
    const clampedScale = Math.max(minZoom, Math.min(maxZoom, scale));
    const viewport = viewportRef.current;
    
    viewport.scale.x = clampedScale;
    viewport.scale.y = clampedScale;
    
    setViewportTransform(prev => ({ ...prev, scale: clampedScale }));
    
    // Update grid position
    if (gridGraphicsRef?.current && appRef?.current) {
      updateGridPosition(gridGraphicsRef.current, viewport, appRef.current);
    }
  }, [viewportRef, minZoom, maxZoom, setViewportTransform, gridGraphicsRef, appRef]);

  const zoomToPoint = useCallback((scale, point) => {
    if (!viewportRef.current) return;
    
    const clampedScale = Math.max(minZoom, Math.min(maxZoom, scale));
    const viewport = viewportRef.current;
    
    // Calculate world position before zoom
    const worldPos = {
      x: (point.x - viewport.x) / viewport.scale.x,
      y: (point.y - viewport.y) / viewport.scale.y
    };
    
    // Apply new scale
    viewport.scale.x = clampedScale;
    viewport.scale.y = clampedScale;
    
    // Adjust position to keep world point under cursor
    viewport.x = point.x - worldPos.x * clampedScale;
    viewport.y = point.y - worldPos.y * clampedScale;
    
    setViewportTransform({
      x: viewport.x,
      y: viewport.y,
      scale: clampedScale
    });
    
    // Update grid position
    if (gridGraphicsRef?.current && appRef?.current) {
      updateGridPosition(gridGraphicsRef.current, viewport, appRef.current);
    }
  }, [viewportRef, minZoom, maxZoom, setViewportTransform, gridGraphicsRef, appRef]);

  // Current zoom as percentage for display
  const zoomLevel = viewportTransform.scale * 100;
  
  const zoomActions = {
    zoomIn,
    zoomOut,
    zoomToFit,
    setZoom,
    zoomToPoint
  };

  // Effect to listen for viewport zoom events and update state
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const handleZoom = () => {
      setViewportTransform(prev => ({
        ...prev,
        scale: viewport.scale.x
      }));
    };

    viewport.on('zoomed', handleZoom);

    return () => {
      viewport.off('zoomed', handleZoom);
    };
  }, [viewportRef, setViewportTransform]);

  return {
    zoomLevel,
    zoomActions,
    canZoomIn: viewportTransform.scale < maxZoom,
    canZoomOut: viewportTransform.scale > minZoom,
  };
};

export default useZoomControls;
