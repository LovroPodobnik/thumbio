import { useEffect } from 'react';
import { setupCanvasControls } from '../components/canvas/CanvasControls';
import { createRectFromPoints, drawSelectionRect, clearSelectionRect, getIntersectingThumbnails, getIntersectingTextLabels, throttle } from '../components/canvas/SelectionRectangle';
import { createDrawingData, smoothPath, renderFreehandStroke } from '../components/canvas/DrawingRenderer';

export const useCanvasInteractions = (
  appRef,
  viewportRef,
  gridGraphicsRef,
  selectionRectGraphicsRef,
  tempDrawingGraphicsRef,
  props
) => {
  const {
    isMultiplayerEnabled, multiplayerManager, lastCursorPositionRef, setViewportTransform,
    setPendingCommentPos, isAddingCommentRef, isDrawingModeRef, isHandToolModeRef,
    canvasTools, isAddingLabelRef, handleLabelCreate, isSpacePanningRef,
    thumbnailContainersRef, textLabelContainersRef,
    throttledUpdateSelection, saveToHistory, drawingSettingsRef, drawingsRef,
    setCurrentDrawing, currentDrawingRef,
    youtubeThumbnails, textLabels, labelPositions, toolActions,
    handleZoomIn, handleZoomOut, handleZoomToFit, undo, redo, thumbnails,
    selectedIds, setSelectedIds, selectedLabelIds, setSelectedLabelIds,
    setEditingComment, setEditingLabel, setIsRectSelecting, setSelectionRect,
    setDrawings, setIsDrawing, setYoutubeThumbnails, setTextLabels, setLabelPositions,
    editingLabel, drawings, lockedThumbnails, isAddingComment
  } = props;
  useEffect(() => {
    if (!appRef.current || !viewportRef.current) return;
    const app = appRef.current;
    const viewport = viewportRef.current;

    const handlePointerMove = throttle((e) => {
      if (isMultiplayerEnabled && multiplayerManager.isConnected) {
        const globalPos = e.global || e.data.global;
        const localPos = viewport.toLocal(globalPos);
        
        const dx = Math.abs(localPos.x - lastCursorPositionRef.current.x);
        const dy = Math.abs(localPos.y - lastCursorPositionRef.current.y);
        
        if (dx > 2 || dy > 2) {
          multiplayerManager.sendCursor(localPos.x, localPos.y);
          lastCursorPositionRef.current = { x: localPos.x, y: localPos.y };
        }
      }
    }, 50);

    app.stage.on('pointermove', handlePointerMove);
    app.stage.on('pointerleave', () => {
      if (isMultiplayerEnabled && multiplayerManager.isConnected) {
        multiplayerManager.sendCursorLeave();
      }
    });

    const cleanup = setupCanvasControls(app, viewport, gridGraphicsRef.current, {
      onViewportTransform: setViewportTransform,
      onAddComment: setPendingCommentPos,
      isAddingComment: () => isAddingCommentRef.current,
      isDrawingMode: () => isDrawingModeRef.current,
      isHandToolMode: () => isHandToolModeRef.current,
      isSelectionAllowed: () => canvasTools.toolBehavior.canSelect,
      isAddingLabel: () => isAddingLabelRef.current,
      onAddLabel: (pos) => handleLabelCreate(pos),
      onSpacePanStart: () => isSpacePanningRef.current = true,
      onSpacePanEnd: () => isSpacePanningRef.current = false,
      onClearSelection: () => {
        thumbnailContainersRef.current.forEach(c => {
          c.selected = false;
          c.selectionOutline.visible = false;
          c.hoverOutline.visible = false;
        });
        setSelectedIds([]);
        textLabelContainersRef.current.forEach(c => {
          c.selected = false;
          c.selectionOutline.visible = false;
          c.hoverBg.visible = false;
        });
        setSelectedLabelIds([]);
      },
      onCanvasClick: () => {
        setEditingComment(null);
        setEditingLabel(null);
      },
      onRectSelectionStart: () => {
        setIsRectSelecting(true);
        setSelectionRect(null);
      },
      onRectSelectionMove: (startPoint, currentPoint, modifierKeys) => {
        const rect = createRectFromPoints(startPoint, currentPoint);
        setSelectionRect(rect);
        if (selectionRectGraphicsRef.current && viewport) {
          drawSelectionRect(selectionRectGraphicsRef.current, rect, viewport);
        }
        throttledUpdateSelection(rect, modifierKeys);
      },
      onRectSelectionEnd: (startPoint, endPoint, modifierKeys) => {
        const rect = createRectFromPoints(startPoint, endPoint);
        if (rect.width > 1 || rect.height > 1) {
          const intersectingThumbnails = getIntersectingThumbnails(rect, thumbnailContainersRef.current);
          const intersectingIds = new Set(intersectingThumbnails.map(c => c.userData.id));
          const intersectingLabels = getIntersectingTextLabels(rect, textLabelContainersRef.current);
          const intersectingLabelIds = new Set(intersectingLabels.map(c => c.labelData.id));

          let newSelectedIds;
          if (modifierKeys.shiftKey) newSelectedIds = new Set([...selectedIds, ...intersectingIds]);
          else if (modifierKeys.metaKey || modifierKeys.ctrlKey) {
            newSelectedIds = new Set(selectedIds);
            intersectingIds.forEach(id => newSelectedIds.has(id) ? newSelectedIds.delete(id) : newSelectedIds.add(id));
          } else newSelectedIds = intersectingIds;

          let newSelectedLabelIds;
          if (modifierKeys.shiftKey) newSelectedLabelIds = new Set([...selectedLabelIds, ...intersectingLabelIds]);
          else if (modifierKeys.metaKey || modifierKeys.ctrlKey) {
            newSelectedLabelIds = new Set(selectedLabelIds);
            intersectingLabelIds.forEach(id => newSelectedLabelIds.has(id) ? newSelectedLabelIds.delete(id) : newSelectedLabelIds.add(id));
          } else newSelectedLabelIds = intersectingLabelIds;

          setSelectedIds(Array.from(newSelectedIds));
          setSelectedLabelIds(Array.from(newSelectedLabelIds));

          thumbnailContainersRef.current.forEach(c => {
            c.selected = newSelectedIds.has(c.userData.id);
            c.selectionOutline.visible = c.selected;
            c.hoverOutline.visible = false;
          });
          textLabelContainersRef.current.forEach(c => {
            c.selected = newSelectedLabelIds.has(c.labelData.id);
            c.selectionOutline.visible = c.selected;
            c.hoverBg.visible = false;
          });

          const currentSelectedCount = selectedIds instanceof Set ? selectedIds.size : selectedIds.length;
          const currentLabelCount = selectedLabelIds instanceof Set ? selectedLabelIds.size : selectedLabelIds.length;
          
          if (newSelectedIds.size !== currentSelectedCount || newSelectedLabelIds.size !== currentLabelCount) {
            saveToHistory('Rectangular Selection', { 
              selectedIds: Array.from(newSelectedIds), 
              selectedLabelIds: Array.from(newSelectedLabelIds) 
            });
          }
        }
        setSelectionRect(null);
        setIsRectSelecting(false);
        if (selectionRectGraphicsRef.current) clearSelectionRect(selectionRectGraphicsRef.current);
        thumbnailContainersRef.current.forEach(c => { if (!c.selected) c.hoverOutline.visible = false; });
        textLabelContainersRef.current.forEach(c => { if (!c.selected) c.hoverBg.visible = false; });
      },
      onDrawingStart: (startPoint) => {
        if (drawingSettingsRef.current.isEraserMode) {
          const eraserRadius = drawingSettingsRef.current.brushSize * 1.5;
          const toRemove = drawingsRef.current.filter(d => d.points.some(p => Math.hypot(p.x - startPoint.x, p.y - startPoint.y) <= eraserRadius));
          if (toRemove.length > 0) {
            const remaining = drawingsRef.current.filter(d => !toRemove.includes(d));
            setDrawings(remaining);
            saveToHistory('Erase Drawing', { drawings: remaining });
          }
          return;
        }
        setIsDrawing(true);
        const style = { color: parseInt(drawingSettingsRef.current.brushColor.replace('#', '0x')), width: drawingSettingsRef.current.brushSize, alpha: 1.0 };
        const newDrawing = { startPoint, currentPoint: startPoint, points: [startPoint], type: 'freehand', layer: 'over_thumbnails', style };
        setCurrentDrawing(newDrawing);
        currentDrawingRef.current = newDrawing;
      },
      onDrawingMove: (startPoint, currentPoint) => {
        if (drawingSettingsRef.current.isEraserMode) {
          const eraserRadius = drawingSettingsRef.current.brushSize * 1.5;
          const toRemove = drawings.filter(d => d.points.some(p => Math.hypot(p.x - currentPoint.x, p.y - currentPoint.y) <= eraserRadius));
          if (toRemove.length > 0) {
            setDrawings(drawings.filter(d => !toRemove.includes(d)));
          }
          return;
        }
        if (currentDrawingRef.current) {
          const lastPoint = currentDrawingRef.current.points.slice(-1)[0];
          const viewportScale = viewportRef.current ? viewportRef.current.scale.x : 1;
          const minDistance = Math.max(1, 3 / viewportScale);
          if (Math.hypot(currentPoint.x - lastPoint.x, currentPoint.y - lastPoint.y) >= minDistance) {
            const style = { color: parseInt(drawingSettingsRef.current.brushColor.replace('#', '0x')), width: drawingSettingsRef.current.brushSize, alpha: 1.0 };
            const updatedDrawing = { ...currentDrawingRef.current, currentPoint, points: [...currentDrawingRef.current.points, currentPoint], style };
            setCurrentDrawing(updatedDrawing);
            currentDrawingRef.current = updatedDrawing;
            if (tempDrawingGraphicsRef.current) {
              const smoothed = smoothPath(updatedDrawing.points, Math.max(1, 2 / viewportScale));
              renderFreehandStroke(tempDrawingGraphicsRef.current, smoothed, style);
            }
          }
        }
      },
      onDrawingEnd: () => {
        if (drawingSettingsRef.current.isEraserMode) {
          saveToHistory('Erase Drawings', { drawings: drawings });
          return;
        }
        if (currentDrawingRef.current && currentDrawingRef.current.points.length > 1) {
          const finalPoints = smoothPath(currentDrawingRef.current.points, 2);
          const style = { color: parseInt(drawingSettingsRef.current.brushColor.replace('#', '0x')), width: drawingSettingsRef.current.brushSize, alpha: 1.0 };
          const drawingData = createDrawingData(currentDrawingRef.current.type, finalPoints, style, currentDrawingRef.current.layer);
          const updatedDrawings = [...drawings, drawingData];
          setDrawings(updatedDrawings);
          saveToHistory('Add Drawing', { drawings: updatedDrawings });
          if (tempDrawingGraphicsRef.current) tempDrawingGraphicsRef.current.clear();
        }
        setCurrentDrawing(null);
        currentDrawingRef.current = null;
        setIsDrawing(false);
      },
      onKeyDown: (e) => {
        if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
        if (e.key === 'Delete' || e.key === 'Backspace') {
          if (editingLabel) return;
          const selectedThumbnails = thumbnailContainersRef.current.filter(c => c.selected);
          const selectedLabels = textLabelContainersRef.current.filter(c => c.selected);
          if (selectedThumbnails.length > 0 || selectedLabels.length > 0) {
            const historyData = {};
            let action = '';
            if (selectedThumbnails.length > 0) {
              const deletedIds = selectedThumbnails.map(c => c.userData.id);
              selectedThumbnails.forEach(c => viewport.removeChild(c));
              thumbnailContainersRef.current = thumbnailContainersRef.current.filter(c => !c.selected);
              const updated = youtubeThumbnails.filter(t => !deletedIds.includes(t.id));
              setYoutubeThumbnails(updated);
              setSelectedIds([]);
              historyData.youtubeThumbnails = updated;
              action = 'Delete Thumbnails';
            }
            if (selectedLabels.length > 0) {
              const deletedIds = selectedLabels.map(c => c.labelData.id);
              selectedLabels.forEach(c => viewport.removeChild(c));
              textLabelContainersRef.current = textLabelContainersRef.current.filter(c => !c.selected);
              const updated = textLabels.filter(l => !deletedIds.includes(l.id));
              setTextLabels(updated);
              setSelectedLabelIds([]);
              historyData.textLabels = updated;
              const updatedPos = { ...labelPositions };
              deletedIds.forEach(id => delete updatedPos[id]);
              setLabelPositions(updatedPos);
              historyData.labelPositions = updatedPos;
              action = action ? 'Delete Thumbnails & Labels' : 'Delete Labels';
            }
            if (action) saveToHistory(action, historyData);
          }
        }
        if (e.key === 'a' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          thumbnailContainersRef.current.forEach(c => { c.selected = true; c.selectionOutline.visible = true; });
          setSelectedIds(thumbnailContainersRef.current.map(c => c.userData.id));
          textLabelContainersRef.current.forEach(c => { c.selected = true; c.selectionOutline.visible = true; });
          setSelectedLabelIds(textLabelContainersRef.current.map(c => c.labelData.id));
        }
        if (e.key === 'Escape') {
          thumbnailContainersRef.current.forEach(c => { c.selected = false; c.selectionOutline.visible = false; });
          setSelectedIds([]);
          textLabelContainersRef.current.forEach(c => { c.selected = false; c.selectionOutline.visible = false; c.hoverBg.visible = false; });
          setSelectedLabelIds([]);
          if (isAddingComment) toolActions.selectSelectionTool();
          setPendingCommentPos(null);
          setEditingComment(null);
          setEditingLabel(null);
        }
        if (e.key === 'c' && !e.metaKey && !e.ctrlKey) toolActions.toggleCommentMode();
        if (e.key === 'p' && !e.metaKey && !e.ctrlKey) toolActions.toggleDrawingMode();
        if (e.key === 't' && !e.metaKey && !e.ctrlKey) toolActions.toggleLabelMode();
        if (e.key === 'v' && !e.metaKey && !e.ctrlKey) toolActions.toggleHandTool(false);
        if (e.key === 'h' && !e.metaKey && !e.ctrlKey) toolActions.toggleHandTool(true);
        if ((e.key === '=' || e.key === '+') && !e.metaKey && !e.ctrlKey) handleZoomIn();
        if (e.key === '-' && !e.metaKey && !e.ctrlKey) handleZoomOut();
        if (e.key === '0' && !e.metaKey && !e.ctrlKey) handleZoomToFit();
        if (e.key === 'z' && (e.metaKey || e.ctrlKey) && !e.shiftKey) { e.preventDefault(); undo(); }
        if (e.key === 'z' && (e.metaKey || e.ctrlKey) && e.shiftKey) { e.preventDefault(); redo(); }
      }
    });

    return () => {
      cleanup();
      app.stage.off('pointermove', handlePointerMove);
    };
  }, [
    isMultiplayerEnabled, canvasTools, youtubeThumbnails, selectedIds, lockedThumbnails, 
    drawings, textLabels, labelPositions, selectedLabelIds, appRef, viewportRef, 
    gridGraphicsRef, selectionRectGraphicsRef, tempDrawingGraphicsRef, multiplayerManager,
    lastCursorPositionRef, setViewportTransform, setPendingCommentPos, isAddingCommentRef,
    isDrawingModeRef, isHandToolModeRef, isAddingLabelRef, handleLabelCreate, isSpacePanningRef,
    thumbnailContainersRef, textLabelContainersRef, throttledUpdateSelection, saveToHistory,
    drawingSettingsRef, drawingsRef, setCurrentDrawing, currentDrawingRef, toolActions,
    handleZoomIn, handleZoomOut, handleZoomToFit, undo, redo, thumbnails, setSelectedIds,
    setSelectedLabelIds, setEditingComment, setEditingLabel, setIsRectSelecting, setSelectionRect,
    setDrawings, setIsDrawing, setYoutubeThumbnails, setTextLabels, setLabelPositions,
    editingLabel, isAddingComment
  ]);
};
