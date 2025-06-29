import { useCallback } from 'react';
import useToolState from './useToolState';
import useKeyboardShortcuts from './useKeyboardShortcuts';
import useToolEffects from './useToolEffects';
import useZoomControls from './useZoomControls';

/**
 * Canvas Tools Composition Hook
 * 
 * Combines all tool-related hooks into a single, easy-to-use interface.
 * Provides clean API for components that need tool functionality.
 * Demonstrates how the refactored architecture works together.
 */

const useCanvasTools = ({
  appRef,
  viewportRef,
  viewportTransform,
  setViewportTransform,
  updateAllThumbnailEventModes,
  historyActions, // { undo, redo }
  enabled = true
}) => {
  
  // Tool state management
  const toolState = useToolState();
  
  // Zoom controls
  const zoomControls = useZoomControls({
    viewportRef,
    viewportTransform,
    setViewportTransform,
    minZoom: 0.1,
    maxZoom: 5
  });
  
  // Handle tool change effects
  useToolEffects({
    activeTool: toolState.activeTool,
    isSpacePanning: toolState.isSpacePanning,
    drawingSettings: toolState.drawingSettings,
    appRef,
    updateAllThumbnailEventModes,
    onToolChange: useCallback((tool) => {
      // Optional: Handle tool change events
      console.log('Tool changed to:', tool);
    }, [])
  });
  
  // Keyboard shortcuts
  useKeyboardShortcuts({
    toolActions: {
      selectSelectionTool: toolState.selectSelectionTool,
      selectHandTool: toolState.selectHandTool,
      selectDrawingTool: toolState.selectDrawingTool,
      selectCommentTool: toolState.selectCommentTool,
      selectLabelTool: toolState.selectLabelTool,
      setSpacePanning: toolState.setSpacePanning
    },
    zoomActions: zoomControls.zoomActions,
    historyActions,
    enabled
  });

  return {
    // Tool state
    ...toolState,
    
    // Zoom controls
    ...zoomControls,
    
    // Combined actions for easy component usage
    toolActions: {
      selectSelectionTool: toolState.selectSelectionTool,
      selectHandTool: toolState.selectHandTool,
      selectDrawingTool: toolState.selectDrawingTool,
      selectCommentTool: toolState.selectCommentTool,
      selectLabelTool: toolState.selectLabelTool,
      toggleHandTool: toolState.toggleHandTool,
      toggleDrawingMode: toolState.toggleDrawingMode,
      toggleCommentMode: toolState.toggleCommentMode,
      toggleLabelMode: toolState.toggleLabelMode,
      setSpacePanning: toolState.setSpacePanning
    }
  };
};

export default useCanvasTools;