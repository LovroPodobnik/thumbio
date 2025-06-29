// src/hooks/useRectangularSelection.js
import { useState, useEffect, useCallback } from 'react';
import { createRectFromPoints, getIntersectingThumbnails, getIntersectingTextLabels, drawSelectionRect, clearSelectionRect } from '../components/canvas/SelectionRectangle';
import { useSelectionActions } from './useCanvasActions';

export const useRectangularSelection = ({
  appRef,
  viewportRef,
  selectionRectGraphicsRef,
  toolBehavior,
  thumbnailContainersRef,
  textLabelContainersRef,
  selectedIds,
  selectedLabelIds,
}) => {
  const selectionActions = useSelectionActions();
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState(null);

  const handlePointerDown = useCallback((e) => {
    if (!toolBehavior.canSelect || e.target !== appRef.current.stage) return;

    const localPos = viewportRef.current.toLocal(e.global);
    setIsSelecting(true);
    setSelectionStart(localPos);

    // Clear previous selections if not holding modifier keys
    const originalEvent = e.originalEvent || e;
    if (!originalEvent.shiftKey && !originalEvent.metaKey && !originalEvent.ctrlKey) {
      selectionActions.clearSelection();
    }
  }, [toolBehavior.canSelect, appRef, viewportRef, selectionActions]);

  const handlePointerMove = useCallback((e) => {
    if (!isSelecting || !selectionStart) return;

    const currentPos = viewportRef.current.toLocal(e.global);
    const rect = createRectFromPoints(selectionStart, currentPos);
    
    if (selectionRectGraphicsRef.current) {
      drawSelectionRect(selectionRectGraphicsRef.current, rect, viewportRef.current);
    }
  }, [isSelecting, selectionStart, viewportRef, selectionRectGraphicsRef]);

  const handlePointerUp = useCallback((e) => {
    if (!isSelecting || !selectionStart) return;

    const endPoint = viewportRef.current.toLocal(e.global);
    const rect = createRectFromPoints(selectionStart, endPoint);

    if (rect.width > 5 || rect.height > 5) {
      const intersectingThumbnails = getIntersectingThumbnails(rect, thumbnailContainersRef.current);
      const newThumbnailIds = new Set(intersectingThumbnails.map(c => c.userData.id));

      const intersectingLabels = getIntersectingTextLabels(rect, textLabelContainersRef.current);
      const newLabelIds = new Set(intersectingLabels.map(c => c.labelData.id));
      
      const originalEvent = e.originalEvent || e;
      const modifierKeys = { 
        shiftKey: originalEvent.shiftKey, 
        metaKey: originalEvent.metaKey, 
        ctrlKey: originalEvent.ctrlKey 
      };

      // You would typically use a utility for this logic
      const combineSelection = (current, newItems) => {
        const combined = new Set(current);
        if (modifierKeys.shiftKey) {
          newItems.forEach(id => combined.add(id));
        } else if (modifierKeys.metaKey || modifierKeys.ctrlKey) {
          newItems.forEach(id => {
            if (combined.has(id)) combined.delete(id);
            else combined.add(id);
          });
        } else {
          return newItems;
        }
        return combined;
      };

      selectionActions.setSelection(combineSelection(selectedIds, newThumbnailIds));
      selectionActions.setLabelSelection(combineSelection(selectedLabelIds, newLabelIds));
    }

    if (selectionRectGraphicsRef.current) {
      clearSelectionRect(selectionRectGraphicsRef.current);
    }
    setIsSelecting(false);
    setSelectionStart(null);
  }, [isSelecting, selectionStart, viewportRef, selectionRectGraphicsRef, thumbnailContainersRef, textLabelContainersRef, selectionActions, selectedIds, selectedLabelIds]);

  useEffect(() => {
    const app = appRef.current;
    if (!app) return;

    app.stage.on('pointerdown', handlePointerDown);
    app.stage.on('pointermove', handlePointerMove);
    app.stage.on('pointerup', handlePointerUp);
    app.stage.on('pointerupoutside', handlePointerUp);

    return () => {
      app.stage.off('pointerdown', handlePointerDown);
      app.stage.off('pointermove', handlePointerMove);
      app.stage.off('pointerup', handlePointerUp);
      app.stage.off('pointerupoutside', handlePointerUp);
    };
  }, [appRef, handlePointerDown, handlePointerMove, handlePointerUp]);
};