import { useEffect, useCallback } from 'react';
import { TOOLS } from './useToolState';

/**
 * Centralized tool interaction manager that defines how each tool affects canvas behavior
 * This is the single source of truth for tool behaviors and interactions
 */
export const useToolInteractionManager = ({
  activeTool,
  isSpacePanning,
  viewportRef,
  appRef,
  updateAllThumbnailEventModes,
  setIsSelecting,
  setSelectionStart,
  setSelectionEnd
}) => {
  // Define tool behaviors
  const TOOL_BEHAVIORS = {
    [TOOLS.SELECTION]: {
      cursor: 'default',
      thumbnailInteractive: true,
      canSelect: true,
      canPan: false,
      canDraw: false,
      preventDefaultEvents: false
    },
    [TOOLS.HAND]: {
      cursor: 'grab',
      thumbnailInteractive: false, // Hand tool doesn't interact with thumbnails
      canSelect: false,
      canPan: true,
      canDraw: false,
      preventDefaultEvents: true
    },
    [TOOLS.DRAWING]: {
      cursor: 'crosshair',
      thumbnailInteractive: false,
      canSelect: false,
      canPan: false,
      canDraw: true,
      preventDefaultEvents: true
    },
    [TOOLS.COMMENT]: {
      cursor: 'crosshair',
      thumbnailInteractive: false,
      canSelect: false,
      canPan: false,
      canDraw: false,
      preventDefaultEvents: true
    },
    [TOOLS.LABEL]: {
      cursor: 'text',
      thumbnailInteractive: false,
      canSelect: false,
      canPan: false,
      canDraw: false,
      preventDefaultEvents: true
    },
    spacePan: {
      cursor: 'grabbing',
      thumbnailInteractive: false,
      canSelect: false,
      canPan: true,
      canDraw: false,
      preventDefaultEvents: true
    },
    selection: {
      cursor: 'default',
      thumbnailInteractive: true,
      canSelect: true,
      canPan: false,
      canDraw: false,
      preventDefaultEvents: false
    }
  };

  // Get tool behavior based on active tool and states
  const getToolBehavior = useCallback(() => {
    if (isSpacePanning) {
      return TOOL_BEHAVIORS.spacePan;
    }
    
    return TOOL_BEHAVIORS[activeTool] || TOOL_BEHAVIORS.selection;
  }, [activeTool, isSpacePanning, TOOL_BEHAVIORS]);

  // Update cursor style based on current tool and state
  const updateCursor = useCallback(() => {
    if (!appRef?.current) return;
    
    const app = appRef.current;
    let cursor = 'default';
    
    // Check for space panning first (highest priority)
    if (isSpacePanning) {
      cursor = 'grabbing';
    } else {
      // Set cursor based on active tool
      switch (activeTool) {
        case TOOLS.SELECTION:
          cursor = 'default';
          break;
        case TOOLS.HAND:
          cursor = 'grab';
          break;
        case TOOLS.COMMENT:
          cursor = 'crosshair';
          break;
        case TOOLS.DRAWING:
          cursor = 'crosshair';
          break;
        case TOOLS.LABEL:
          cursor = 'text';
          break;
        default:
          cursor = 'default';
          break;
      }
    }
    
    if (viewportRef?.current) {
      app.canvas.style.cursor = cursor;
    }
  }, [activeTool, isSpacePanning, viewportRef, appRef]);

  // Update cursor when tool or panning state changes
  useEffect(() => {
    updateCursor();
  }, [updateCursor]);

  // Update thumbnail interaction modes
  useEffect(() => {
    if (!updateAllThumbnailEventModes) return;
    
    const behavior = getToolBehavior();
    
    // Disable thumbnail interactions based on tool behavior configuration
    const shouldDisableThumbnails = !behavior.thumbnailInteractive;
    
    updateAllThumbnailEventModes(shouldDisableThumbnails);
  }, [activeTool, isSpacePanning, updateAllThumbnailEventModes, getToolBehavior]);

  // Clear selection when switching to non-selection tools
  useEffect(() => {
    const behavior = getToolBehavior();
    
    if (!behavior.canSelect && setIsSelecting) {
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionEnd(null);
    }
  }, [activeTool, getToolBehavior, setIsSelecting, setSelectionStart, setSelectionEnd]);

  // Canvas interaction handlers based on active tool
  const handleCanvasMouseDown = useCallback((event) => {
    const behavior = getToolBehavior();
    
    if (behavior.preventDefaultEvents) {
      event.preventDefault();
    }
    
    // Tool-specific mouse down behavior
    switch (activeTool) {
      case TOOLS.SELECTION:
        // Selection logic handled by selection system
        break;
        
      case TOOLS.HAND:
        // Panning logic handled by pan system
        if (appRef?.current?.canvas) {
          appRef.current.canvas.style.cursor = 'grabbing';
        }
        break;
        
      case TOOLS.DRAWING:
        // Drawing logic handled by drawing system
        break;
        
      case TOOLS.COMMENT:
        // Comment placement handled by comment system
        break;
        
      case TOOLS.LABEL:
        // Label placement handled by label system
        break;
    }
  }, [activeTool, getToolBehavior, viewportRef]);

  const handleCanvasMouseUp = useCallback(() => {
    // Reset cursor for hand tool
    if (activeTool === TOOLS.HAND && !isSpacePanning) {
      if (appRef?.current?.canvas) {
        appRef.current.canvas.style.cursor = 'grab';
      }
    }
  }, [activeTool, isSpacePanning, appRef]);

  // Determine if canvas should handle certain interactions
  const shouldHandlePanning = useCallback(() => {
    const behavior = getToolBehavior();
    return behavior.canPan || isSpacePanning;
  }, [getToolBehavior, isSpacePanning]);

  const shouldHandleSelection = useCallback(() => {
    const behavior = getToolBehavior();
    return behavior.canSelect && !isSpacePanning;
  }, [getToolBehavior, isSpacePanning]);

  const shouldHandleDrawing = useCallback(() => {
    const behavior = getToolBehavior();
    return behavior.canDraw;
  }, [getToolBehavior]);

  const areThumbnailsInteractive = useCallback(() => {
    const behavior = getToolBehavior();
    return behavior.thumbnailInteractive && !isSpacePanning;
  }, [getToolBehavior, isSpacePanning]);

  return {
    // Current tool behavior
    toolBehavior: getToolBehavior(),
    
    // Interaction checks
    shouldHandlePanning,
    shouldHandleSelection,
    shouldHandleDrawing,
    areThumbnailsInteractive,
    
    // Event handlers
    handleCanvasMouseDown,
    handleCanvasMouseUp,
    
    // Tool behaviors reference (for debugging/documentation)
    TOOL_BEHAVIORS
  };
};