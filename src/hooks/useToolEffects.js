import { useEffect } from 'react';
import { TOOLS } from './useToolState';

/**
 * Tool Effects Hook
 * 
 * Handles all side effects when tools change:
 * - Cursor management
 * - Canvas interaction mode updates
 * - Cleanup when switching tools
 * 
 * Centralizes scattered cursor and interaction logic.
 */

const useToolEffects = ({
  activeTool,
  isSpacePanning,
  drawingSettings,
  appRef,
  updateAllThumbnailEventModes,
  onToolChange
}) => {
  
  // Handle cursor changes based on active tool and space panning
  useEffect(() => {
    if (!appRef.current?.canvas) return;
    
    const canvas = appRef.current.canvas;
    
    if (isSpacePanning) {
      canvas.style.cursor = 'grab';
      return;
    }
    
    switch (activeTool) {
      case TOOLS.SELECTION:
        canvas.style.cursor = 'default';
        break;
        
      case TOOLS.HAND:
        canvas.style.cursor = 'grab';
        break;
        
      case TOOLS.DRAWING:
        canvas.style.cursor = drawingSettings.isEraserMode ? 'cell' : 'crosshair';
        break;
        
      case TOOLS.COMMENT:
      case TOOLS.LABEL:
        canvas.style.cursor = 'crosshair';
        break;
        
      default:
        canvas.style.cursor = 'default';
    }
  }, [activeTool, isSpacePanning, drawingSettings.isEraserMode, appRef]);
  
  // Handle thumbnail interaction modes
  useEffect(() => {
    if (!updateAllThumbnailEventModes) return;
    
    // Disable thumbnail interactions for drawing, hand tool, and space panning
    const shouldDisableInteractions = 
      activeTool === TOOLS.DRAWING || 
      activeTool === TOOLS.HAND ||
      isSpacePanning;
      
    updateAllThumbnailEventModes(shouldDisableInteractions);
  }, [activeTool, isSpacePanning, updateAllThumbnailEventModes]);
  
  // Handle tool change callbacks
  useEffect(() => {
    if (onToolChange) {
      onToolChange(activeTool);
    }
  }, [activeTool, onToolChange]);
  
  // Cleanup effects when component unmounts
  useEffect(() => {
    return () => {
      if (appRef.current?.canvas) {
        appRef.current.canvas.style.cursor = 'default';
      }
    };
  }, [appRef]);
};

export default useToolEffects;