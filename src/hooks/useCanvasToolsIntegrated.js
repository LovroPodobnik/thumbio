import { useEffect } from 'react';
import useToolState, { TOOLS } from './useToolState';
import useKeyboardShortcuts from './useKeyboardShortcuts';
import useZoomControls from './useZoomControls';
import { useToolInteractionManager } from './useToolInteractionManager';

/**
 * Integrated canvas tools hook that combines all tool functionality
 * with proper interaction management and single source of truth
 */
export const useCanvasToolsIntegrated = ({
  appRef,
  viewportRef,
  viewportTransform,
  setViewportTransform,
  gridGraphicsRef,
  updateAllThumbnailEventModes,
  historyActions,
  setIsSelecting,
  setSelectionStart,
  setSelectionEnd,
}) => {
  // Core tool state management
  const toolState = useToolState();
  const { activeTool, isSpacePanning, toolActions } = toolState;

  // Tool interaction manager - single source of truth for behaviors
  const toolManager = useToolInteractionManager({
    activeTool,
    isSpacePanning,
    viewportRef,
    appRef,
    updateAllThumbnailEventModes,
    setIsSelecting,
    setSelectionStart,
    setSelectionEnd,
  });

  // Zoom controls
  const zoomControls = useZoomControls({
    viewportRef,
    viewportTransform,
    setViewportTransform,
    gridGraphicsRef,
    appRef,
  });

  // Keyboard shortcuts with integrated tool actions
  useKeyboardShortcuts({
    toolActions,
    zoomActions: zoomControls.zoomActions,
    historyActions,
    isEnabled: true,
  });

  // Update cursor based on tool manager's behavior
  useEffect(() => {
    if (!appRef.current?.canvas) return;
    
    const canvas = appRef.current.canvas;
    const behavior = toolManager.toolBehavior;
    
    // Apply cursor from tool behavior
    canvas.style.cursor = behavior.cursor;
    
    // Special handling for active states
    if (activeTool === TOOLS.HAND) {
      // Add mouse event listeners for grab/grabbing cursor change
      const handleMouseDown = () => {
        canvas.style.cursor = 'grabbing';
      };
      
      const handleMouseUp = () => {
        canvas.style.cursor = 'grab';
      };
      
      canvas.addEventListener('mousedown', handleMouseDown);
      canvas.addEventListener('mouseup', handleMouseUp);
      canvas.addEventListener('mouseleave', handleMouseUp);
      
      return () => {
        canvas.removeEventListener('mousedown', handleMouseDown);
        canvas.removeEventListener('mouseup', handleMouseUp);
        canvas.removeEventListener('mouseleave', handleMouseUp);
      };
    }
  }, [appRef, activeTool, toolManager.toolBehavior]);


  // Update thumbnail interaction modes based on tool
  useEffect(() => {
    if (!updateAllThumbnailEventModes) return;
    
    // Use the tool interaction manager to determine if thumbnails should be disabled
    const shouldDisable = !toolManager.areThumbnailsInteractive();
    updateAllThumbnailEventModes(shouldDisable);
  }, [activeTool, updateAllThumbnailEventModes, toolManager]);

  return {
    // Tool state
    activeTool,
    ...toolState,
    
    // Tool actions
    toolActions,
    
    // Zoom controls
    zoomLevel: zoomControls.zoomLevel,
    zoomActions: zoomControls.zoomActions,
    
    // Tool interaction manager
    toolBehavior: toolManager.toolBehavior,
    shouldHandlePanning: toolManager.shouldHandlePanning,
    shouldHandleSelection: toolManager.shouldHandleSelection,
    shouldHandleDrawing: toolManager.shouldHandleDrawing,
    areThumbnailsInteractive: toolManager.areThumbnailsInteractive,
    
    // Canvas event handlers
    handleCanvasMouseDown: toolManager.handleCanvasMouseDown,
    handleCanvasMouseUp: toolManager.handleCanvasMouseUp
  };
};
