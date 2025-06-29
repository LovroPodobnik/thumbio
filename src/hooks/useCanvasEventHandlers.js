import { useCallback, useRef } from 'react';
import { createRectFromPoints, getIntersectingThumbnails, getIntersectingTextLabels, throttle } from '../components/canvas/SelectionRectangle';

/**
 * Canvas Event Handlers Hook
 * 
 * Extracts event handler logic from the main canvas component.
 * Provides clean, reusable event handlers for canvas interactions.
 * Eliminates massive nested function definitions in the main component.
 */

const useCanvasEventHandlers = ({
  // State references
  viewportRef,
  thumbnailContainersRef,
  textLabelContainersRef,
  selectionRectGraphicsRef,
  
  // Current state values
  selectedIds,
  selectedLabelIds,
  
  // State setters
  setSelectedIds,
  setSelectedLabelIds,
  setIsRectSelecting,
  setSelectionRect,
  setPendingCommentPos,
  setEditingComment,
  setEditingLabel,
  
  // Drawing state
  setCurrentDrawing,
  setIsDrawing,
  onDrawingStart,
  onDrawingMove,
  onDrawingEnd,
  
  // History functions
  saveToHistory,
  undo,
  redo,
  
  // Label creation
  handleLabelCreate,
  
  // Tool state checkers
  isDrawingModeRef,
  isAddingCommentRef,
  isAddingLabelRef,
  
  // Other handlers
  updateAllThumbnailEventModes,
  toggleDrawingMode,
  toggleHandTool,
  handleZoomIn,
  handleZoomOut,
  handleZoomToFit
}) => {
  
  // Throttled selection update for performance
  const throttledUpdateSelection = useRef(
    throttle((rect, modifierKeys) => {
      if (!thumbnailContainersRef.current || !textLabelContainersRef.current) return;
      
      // Get intersecting thumbnails and labels
      const intersectingThumbnails = getIntersectingThumbnails(
        rect,
        thumbnailContainersRef.current
      );
      
      const intersectingLabels = getIntersectingTextLabels(
        rect,
        textLabelContainersRef.current
      );
      
      // Update visual feedback for thumbnails
      thumbnailContainersRef.current.forEach(container => {
        const isIntersecting = intersectingThumbnails.some(t => t.userData?.id === container.userData?.id);
        if (container.selectionOutline) {
          container.selectionOutline.visible = isIntersecting;
        }
      });
      
      // Update visual feedback for labels
      textLabelContainersRef.current.forEach(container => {
        const isIntersecting = intersectingLabels.some(l => l.labelData?.id === container.labelData?.id);
        if (container.selectionOutline) {
          container.selectionOutline.visible = isIntersecting;
        }
      });
    }, 16) // 60fps throttling
  ).current;

  // Clear selection handler
  const onClearSelection = useCallback(() => {
    // Clear thumbnail selection
    if (thumbnailContainersRef.current) {
      thumbnailContainersRef.current.forEach(container => {
        container.selected = false;
        if (container.selectionOutline) container.selectionOutline.visible = false;
        if (container.hoverOutline) container.hoverOutline.visible = false;
      });
    }
    
    setSelectedIds([]);
    
    // Clear label selection
    if (textLabelContainersRef.current) {
      textLabelContainersRef.current.forEach(container => {
        container.selected = false;
        if (container.selectionOutline) container.selectionOutline.visible = false;
        if (container.hoverBg) container.hoverBg.visible = false;
      });
    }
    
    setSelectedLabelIds([]);
  }, [setSelectedIds, setSelectedLabelIds, thumbnailContainersRef, textLabelContainersRef]);

  // Canvas click handler
  const onCanvasClick = useCallback(() => {
    // Close any open dialogs when clicking on canvas
    setEditingComment(null);
    setEditingLabel(null);
  }, [setEditingComment, setEditingLabel]);

  // Rectangle selection handlers
  const onRectSelectionStart = useCallback((startPoint, modifierKeys) => {
    setIsRectSelecting(true);
    setSelectionRect(null);
  }, [setIsRectSelecting, setSelectionRect]);

  const onRectSelectionMove = useCallback((startPoint, currentPoint, modifierKeys) => {
    const rect = createRectFromPoints(startPoint, currentPoint);
    setSelectionRect(rect);
    
    // Update visual feedback
    throttledUpdateSelection(rect, modifierKeys);
  }, [setSelectionRect, throttledUpdateSelection]);

  const onRectSelectionEnd = useCallback((startPoint, endPoint, modifierKeys) => {
    if (!viewportRef.current || !thumbnailContainersRef.current) return;
    
    const rect = createRectFromPoints(startPoint, endPoint);
    
    // Get final selection
    const intersectingThumbnails = getIntersectingThumbnails(
      rect,
      thumbnailContainersRef.current
    );
    
    const intersectingLabels = getIntersectingTextLabels(
      rect,
      textLabelContainersRef.current
    );

    // Handle thumbnail selection with modifier keys
    const thumbnailIds = intersectingThumbnails.map(t => t.userData?.id).filter(Boolean);
    if (thumbnailIds.length > 0) {
      const newSelection = new Set(selectedIds);
      
      if (modifierKeys.shiftKey) {
        // Add to selection
        thumbnailIds.forEach(id => newSelection.add(id));
      } else if (modifierKeys.metaKey || modifierKeys.ctrlKey) {
        // Toggle selection
        thumbnailIds.forEach(id => {
          if (newSelection.has(id)) {
            newSelection.delete(id);
          } else {
            newSelection.add(id);
          }
        });
      } else {
        // Replace selection
        setSelectedIds(thumbnailIds);
        // Update visual state immediately
        thumbnailContainersRef.current.forEach(container => {
          const isSelected = thumbnailIds.includes(container.userData?.id);
          container.selected = isSelected;
          if (container.selectionOutline) {
            container.selectionOutline.visible = isSelected;
          }
        });
        return; // Early return for replace selection
      }
      
      setSelectedIds(Array.from(newSelection));
      
      // Update visual state immediately
      thumbnailContainersRef.current.forEach(container => {
        const isSelected = thumbnailIds.includes(container.userData?.id);
        container.selected = isSelected;
        if (container.selectionOutline) {
          container.selectionOutline.visible = isSelected;
        }
      });
    }
    
    // Handle label selection
    const labelIds = intersectingLabels.map(l => l.labelData?.id).filter(Boolean);
    if (labelIds.length > 0) {
      const newLabelSelection = new Set(selectedLabelIds);
      
      if (modifierKeys.shiftKey) {
        labelIds.forEach(id => newLabelSelection.add(id));
      } else if (modifierKeys.metaKey || modifierKeys.ctrlKey) {
        labelIds.forEach(id => {
          if (newLabelSelection.has(id)) {
            newLabelSelection.delete(id);
          } else {
            newLabelSelection.add(id);
          }
        });
      } else {
        // Replace selection
        setSelectedLabelIds(labelIds);
        return; // Early return for replace selection
      }
      
      setSelectedLabelIds(Array.from(newLabelSelection));
    }
    
    // If nothing was selected and no modifier keys, clear all selections
    if (thumbnailIds.length === 0 && labelIds.length === 0 && !modifierKeys.shiftKey && !modifierKeys.metaKey && !modifierKeys.ctrlKey) {
      // Clear all thumbnail selections
      thumbnailContainersRef.current.forEach(container => {
        container.selected = false;
        if (container.selectionOutline) {
          container.selectionOutline.visible = false;
        }
      });
      setSelectedIds([]);
      
      // Clear all label selections
      if (textLabelContainersRef.current) {
        textLabelContainersRef.current.forEach(container => {
          container.selected = false;
          if (container.selectionOutline) {
            container.selectionOutline.visible = false;
          }
        });
      }
      setSelectedLabelIds([]);
    }
    
    // Clean up
    setIsRectSelecting(false);
    setSelectionRect(null);
    
    // Clear the selection rectangle visual
    if (selectionRectGraphicsRef.current) {
      selectionRectGraphicsRef.current.clear();
    }
  }, [
    viewportRef,
    thumbnailContainersRef,
    textLabelContainersRef,
    selectedIds,
    selectedLabelIds,
    setSelectedIds,
    setSelectedLabelIds,
    setIsRectSelecting,
    setSelectionRect,
    selectionRectGraphicsRef
  ]);

  // Keyboard event handler
  const onKeyDown = useCallback((e) => {
    // Skip if user is typing
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }

    const hasModifier = e.metaKey || e.ctrlKey;
    
    if (!hasModifier) {
      switch (e.key.toLowerCase()) {
        case 'v':
          e.preventDefault();
          if (toggleHandTool) toggleHandTool(false);
          break;
          
        case 'h':
          e.preventDefault();
          if (toggleHandTool) toggleHandTool(true);
          break;
          
        case 'p':
          e.preventDefault();
          if (toggleDrawingMode) toggleDrawingMode();
          break;
          
        case '=':
        case '+':
          e.preventDefault();
          if (handleZoomIn) handleZoomIn();
          break;
          
        case '-':
          e.preventDefault();
          if (handleZoomOut) handleZoomOut();
          break;
          
        case '0':
          e.preventDefault();
          if (handleZoomToFit) handleZoomToFit();
          break;
          
        case 'a':
          // Select all handled elsewhere
          break;
          
        case 'escape':
          e.preventDefault();
          onClearSelection();
          break;
      }
    } else {
      // Handle modifier key combinations
      switch (e.key.toLowerCase()) {
        case 'z':
          if (e.shiftKey) {
            e.preventDefault();
            if (redo) redo();
          } else {
            e.preventDefault();
            if (undo) undo();
          }
          break;
          
        case 'a':
          e.preventDefault();
          // Select all thumbnails
          if (thumbnailContainersRef.current) {
            const allIds = thumbnailContainersRef.current
              .map(container => container.userData?.id)
              .filter(Boolean);
            setSelectedIds(allIds);
          }
          break;
      }
    }
  }, [
    onClearSelection,
    toggleHandTool,
    toggleDrawingMode,
    handleZoomIn,
    handleZoomOut,
    handleZoomToFit,
    undo,
    redo,
    thumbnailContainersRef,
    setSelectedIds
  ]);

  return {
    // Selection handlers
    onClearSelection,
    onRectSelectionStart,
    onRectSelectionMove,
    onRectSelectionEnd,
    
    // Canvas handlers
    onCanvasClick,
    onKeyDown,
    
    // Utility functions
    throttledUpdateSelection
  };
};

export default useCanvasEventHandlers;