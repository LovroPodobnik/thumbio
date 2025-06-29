import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { createGridSprite, updateGridPosition } from '../components/canvas/CanvasControls';
import { createDrawingSystem } from '../components/canvas/DrawingRenderer';

export const usePixiSetup = (containerRef, { isMultiplayerEnabled, setViewportTransform }) => {
  const appRef = useRef();
  const viewportRef = useRef();
  const gridGraphicsRef = useRef();
  const drawingSystemRef = useRef();
  const tempDrawingGraphicsRef = useRef();
  const cleanupRef = useRef();

  useEffect(() => {
    if (!containerRef.current) return;

    let app;
    let destroyed = false;

    const initPixi = async () => {
      app = new PIXI.Application();

      await app.init({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0xf5f5f5,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        antialias: true,
        backgroundAlpha: 1,
        clearBeforeRender: true,
        preserveDrawingBuffer: false,
        powerPreference: 'high-performance',
        hello: true,
        roundPixels: false,
      });

      if (destroyed || !containerRef.current) {
        app.destroy(true);
        return;
      }

      containerRef.current.appendChild(app.canvas);
      appRef.current = app;

      const viewport = new PIXI.Container();
      viewport.eventMode = 'passive';
      viewportRef.current = viewport;
      app.stage.addChild(viewport);

      const gridSprite = createGridSprite(app);
      gridGraphicsRef.current = gridSprite;
      app.stage.addChildAt(gridSprite, 0);

      const selectionRectGraphics = new PIXI.Graphics();
      viewport.addChild(selectionRectGraphics);

      const drawingSystem = createDrawingSystem(app, viewport);
      drawingSystemRef.current = drawingSystem;

      const tempDrawingGraphics = new PIXI.Graphics();
      tempDrawingGraphicsRef.current = tempDrawingGraphics;
      drawingSystem.foregroundDrawingsContainer.addChild(tempDrawingGraphics);

      updateGridPosition(gridSprite, viewport, app);
      setViewportTransform({
        x: viewport.x,
        y: viewport.y,
        scale: viewport.scale.x
      });
    };

    initPixi();

    return () => {
      destroyed = true;
      if (cleanupRef.current) cleanupRef.current();
      if (appRef.current) {
        const currentApp = appRef.current;
        appRef.current = null;
        try {
          if (currentApp.canvas && currentApp.canvas.parentNode) {
            currentApp.canvas.parentNode.removeChild(currentApp.canvas);
          }
          currentApp.destroy(true);
        } catch (error) {
          // Silently handle cleanup errors
        }
      }
    };
  }, [isMultiplayerEnabled]);

  return { appRef, viewportRef, gridGraphicsRef, drawingSystemRef, tempDrawingGraphicsRef };
};
