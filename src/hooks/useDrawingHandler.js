// src/hooks/useDrawingHandler.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { smoothPath, renderFreehandStroke, createDrawingData } from '../components/canvas/DrawingRenderer';
import { useCanvasActions } from './useCanvasActions';

export const useDrawingHandler = ({
  appRef,
  viewportRef,
  tempDrawingGraphicsRef,
  toolBehavior,
  drawingSettings,
  drawings,
}) => {
  const canvasActions = useCanvasActions();
  const [isDrawing, setIsDrawing] = useState(false);
  const currentDrawingRef = useRef(null);

  const handlePointerDown = useCallback((e) => {
    if (!toolBehavior.canDraw || e.target !== appRef.current.stage) return;
    
    const localPos = viewportRef.current.toLocal(e.global);

    if (drawingSettings.isEraserMode) {
      const eraserRadius = drawingSettings.brushSize * 1.5;
      const toRemoveIds = drawings
        .filter(d => d.points.some(p => Math.hypot(p.x - localPos.x, p.y - localPos.y) <= eraserRadius))
        .map(d => d.id);

      if (toRemoveIds.length > 0) {
        canvasActions.deleteDrawings(toRemoveIds);
      }
      return;
    }
    
    setIsDrawing(true);
    const style = {
      color: parseInt(drawingSettings.brushColor.replace('#', '0x')),
      width: drawingSettings.brushSize,
      alpha: 1.0,
    };
    currentDrawingRef.current = { points: [localPos], style };
  }, [toolBehavior.canDraw, drawingSettings, drawings, appRef, viewportRef, canvasActions]);

  const handlePointerMove = useCallback((e) => {
    if (!isDrawing) return;

    const localPos = viewportRef.current.toLocal(e.global);
    const lastPoint = currentDrawingRef.current.points.slice(-1)[0];

    const minDistance = Math.max(1, 3 / viewportRef.current.scale.x);
    if (Math.hypot(localPos.x - lastPoint.x, localPos.y - lastPoint.y) < minDistance) return;

    currentDrawingRef.current.points.push(localPos);

    if (tempDrawingGraphicsRef.current) {
      const smoothed = smoothPath(currentDrawingRef.current.points, 2 / viewportRef.current.scale.x);
      renderFreehandStroke(tempDrawingGraphicsRef.current, smoothed, currentDrawingRef.current.style);
    }
  }, [isDrawing, viewportRef, tempDrawingGraphicsRef]);

  const handlePointerUp = useCallback(() => {
    if (!isDrawing) return;

    if (currentDrawingRef.current && currentDrawingRef.current.points.length > 1) {
      const finalPoints = smoothPath(currentDrawingRef.current.points, 2);
      const newDrawing = createDrawingData(
        'freehand',
        finalPoints,
        currentDrawingRef.current.style,
        'over_thumbnails'
      );
      canvasActions.addDrawing(newDrawing);
    }

    if (tempDrawingGraphicsRef.current) {
      tempDrawingGraphicsRef.current.clear();
    }
    setIsDrawing(false);
    currentDrawingRef.current = null;
  }, [isDrawing, canvasActions, tempDrawingGraphicsRef]);

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