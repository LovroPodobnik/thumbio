import { useEffect, useRef } from 'react';
import { createThumbnailContainer, setupThumbnailInteractions, updateThumbnailEventMode } from '../components/canvas/ThumbnailRenderer';
import { createTextLabelContainer, setupTextLabelInteractions, updateTextLabel } from '../components/canvas/TextLabelRenderer';
import { createDrawingGraphics, renderFreehandStroke, renderLine, renderRectangle, addDrawingToLayer } from '../components/canvas/DrawingRenderer';
import { updateGridPosition } from '../components/canvas/CanvasControls';

export const usePixiRenderer = (
  appRef,
  viewportRef,
  drawingSystemRef,
  tempDrawingGraphicsRef,
  gridGraphicsRef,
  {
    thumbnails,
    selectedIds,
    thumbnailPositions,
    lockedThumbnails,
    drawings,
    textLabels,
    labelPositions,
    selectedLabelIds,
    isDrawingModeRef,
    setSelectedIds,
    setThumbnailPositions,
    setSelectedLabelIds,
    setLabelPositions,
    setEditingLabel,
  }
) => {
  const thumbnailContainersRef = useRef([]);
  const textLabelContainersRef = useRef([]);
  const drawingGraphicsMapRef = useRef(new Map());

  // Update thumbnails when they change
  useEffect(() => {
    if (!appRef.current || !viewportRef.current) return;

    const viewport = viewportRef.current;
    const app = appRef.current;

    // Clear existing thumbnails and cleanup intervals
    thumbnailContainersRef.current.forEach(container => {
      if (container._cleanupInterval) {
        container._cleanupInterval();
      }
      viewport.removeChild(container);
    });
    thumbnailContainersRef.current = [];

    // Create new thumbnails
    for (const thumb of thumbnails) {
      const container = createThumbnailContainer(thumb, selectedIds, lockedThumbnails.has(thumb.id));

      // Use saved position if available, otherwise use default
      const savedPos = thumbnailPositions[thumb.id];
      container.x = savedPos ? savedPos.x : thumb.x;
      container.y = savedPos ? savedPos.y : thumb.y;

      // Setup interactions
      setupThumbnailInteractions(container, {
        isDrawingMode: () => isDrawingModeRef.current,
        onSelect: (selectedContainer, e) => {
          const event = e.originalEvent || e;
          if (event.shiftKey || event.metaKey) {
            selectedContainer.selected = !selectedContainer.selected;
            if (selectedContainer.selected) {
              setSelectedIds(prev => new Set([...prev, selectedContainer.userData.id]));
            } else {
              setSelectedIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(selectedContainer.userData.id);
                return newSet;
              });
            }
          } else if (!selectedContainer.selected) {
            thumbnailContainersRef.current.forEach(c => {
              c.selected = false;
              c.selectionOutline.visible = false;
              c.hoverOutline.visible = false;
            });
            selectedContainer.selected = true;
            setSelectedIds(new Set([selectedContainer.userData.id]));
          }
          selectedContainer.selectionOutline.visible = selectedContainer.selected;
          selectedContainer.hoverOutline.visible = false;
        },
        onDragStart: (dragContainer, e) => {
          const selectedContainers = thumbnailContainersRef.current.filter(c => c.selected);
          if (dragContainer.selected) {
            const dragData = {
              containers: selectedContainers,
              startPositions: selectedContainers.map(c => ({ x: c.x, y: c.y })),
              mouseStart: viewport.toLocal(e.global),
            };
            selectedContainers.forEach(c => viewport.addChild(c));
            app.canvas.style.cursor = 'move';
            return dragData;
          }
          return null;
        },
        onDragMove: (container, e, dragData) => {
          const currentMouse = viewport.toLocal(e.global);
          let dx = currentMouse.x - dragData.mouseStart.x;
          let dy = currentMouse.y - dragData.mouseStart.y;

          if (e.originalEvent.shiftKey) {
            if (Math.abs(dx) > Math.abs(dy)) dy = 0;
            else dx = 0;
          }

          dragData.containers.forEach((c, i) => {
            c.x = dragData.startPositions[i].x + dx;
            c.y = dragData.startPositions[i].y + dy;
          });
          updateGridPosition(gridGraphicsRef.current, viewport, app);
        },
        onDragEnd: (container, dragData) => {
          const newPositions = {};
          dragData.containers.forEach(c => {
            newPositions[c.userData.id] = { x: c.x, y: c.y };
          });
          setThumbnailPositions(newPositions);
          app.canvas.style.cursor = 'default';
        }
      });

      const drawingSystem = drawingSystemRef.current;
      if (drawingSystem && drawingSystem.foregroundDrawingsContainer.parent === viewport) {
        const foregroundIndex = viewport.children.indexOf(drawingSystem.foregroundDrawingsContainer);
        viewport.addChildAt(container, foregroundIndex);
      } else {
        viewport.addChild(container);
      }
      thumbnailContainersRef.current.push(container);
    }
  }, [thumbnails, selectedIds, thumbnailPositions, lockedThumbnails]);

  // Update drawings when they change
  useEffect(() => {
    if (!drawingSystemRef.current) return;

    const drawingSystem = drawingSystemRef.current;
    const existingGraphics = drawingGraphicsMapRef.current;
    const currentDrawingIds = new Set(drawings.map(d => d.id));

    for (const [drawingId, graphics] of existingGraphics.entries()) {
      if (!currentDrawingIds.has(drawingId)) {
        if (graphics.parent) {
          graphics.parent.removeChild(graphics);
        }
        graphics.destroy();
        existingGraphics.delete(drawingId);
      }
    }

    for (const drawing of drawings) {
      if (!existingGraphics.has(drawing.id)) {
        const graphics = createDrawingGraphics(drawing);
        switch (drawing.type) {
          case 'freehand':
            renderFreehandStroke(graphics, drawing.points, drawing.style);
            break;
          case 'line':
            if (drawing.points.length >= 2) renderLine(graphics, drawing.points[0], drawing.points[drawing.points.length - 1], drawing.style);
            break;
          case 'rectangle':
            if (drawing.points.length >= 2) renderRectangle(graphics, drawing.points[0], drawing.points[drawing.points.length - 1], drawing.style);
            break;
          default:
            renderFreehandStroke(graphics, drawing.points, drawing.style);
        }
        addDrawingToLayer(drawingSystem, graphics, drawing.layer);
        existingGraphics.set(drawing.id, graphics);
      }
    }

    if (tempDrawingGraphicsRef.current && !drawingSystem.foregroundDrawingsContainer.children.includes(tempDrawingGraphicsRef.current)) {
      drawingSystem.foregroundDrawingsContainer.addChild(tempDrawingGraphicsRef.current);
    }
  }, [drawings]);

  // Update text labels when they change
  useEffect(() => {
    if (!appRef.current || !viewportRef.current) return;

    const viewport = viewportRef.current;
    const app = appRef.current;

    textLabelContainersRef.current.forEach(container => viewport.removeChild(container));
    textLabelContainersRef.current = [];

    for (const label of textLabels) {
      const container = createTextLabelContainer(label);
      const savedPos = labelPositions[label.id];
      container.x = savedPos ? savedPos.x : label.x;
      container.y = savedPos ? savedPos.y : label.y;

      setupTextLabelInteractions(container, {
        isHandToolMode: () => isDrawingModeRef.current, // Note: This should probably be isHandToolModeRef
        onSelect: (selectedContainer, e) => {
          const event = e.originalEvent || e;
          if (event.shiftKey || event.metaKey) {
            selectedContainer.selected = !selectedContainer.selected;
            if (selectedContainer.selected) {
              setSelectedLabelIds(prev => new Set([...prev, selectedContainer.labelData.id]));
            } else {
              setSelectedLabelIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(selectedContainer.labelData.id);
                return newSet;
              });
            }
          } else if (!selectedContainer.selected) {
            textLabelContainersRef.current.forEach(c => {
              c.selected = false;
              c.selectionOutline.visible = false;
              c.hoverBg.visible = false;
            });
            selectedContainer.selected = true;
            setSelectedLabelIds(new Set([selectedContainer.labelData.id]));
          }
          selectedContainer.selectionOutline.visible = selectedContainer.selected;
          selectedContainer.hoverBg.visible = false;
        },
        onDragStart: (dragContainer, e) => {
          if (!dragContainer.selected) {
            textLabelContainersRef.current.forEach(c => {
              c.selected = false;
              c.selectionOutline.visible = false;
              c.hoverBg.visible = false;
            });
            dragContainer.selected = true;
            dragContainer.selectionOutline.visible = true;
            setSelectedLabelIds(new Set([dragContainer.labelData.id]));
          }
          const selectedContainers = textLabelContainersRef.current.filter(c => c.selected);
          const dragData = {
            containers: selectedContainers,
            startPositions: selectedContainers.map(c => ({ x: c.x, y: c.y })),
            mouseStart: viewport.toLocal(e.global),
          };
          selectedContainers.forEach(c => viewport.addChild(c));
          app.canvas.style.cursor = 'move';
          return dragData;
        },
        onDragMove: (container, e, dragData) => {
          const currentMouse = viewport.toLocal(e.global);
          const dx = currentMouse.x - dragData.mouseStart.x;
          const dy = currentMouse.y - dragData.mouseStart.y;
          dragData.containers.forEach((c, i) => {
            c.x = dragData.startPositions[i].x + dx;
            c.y = dragData.startPositions[i].y + dy;
          });
        },
        onDragEnd: (container, dragData) => {
          const newPositions = {};
          dragData.containers.forEach(c => {
            newPositions[c.labelData.id] = { x: c.x, y: c.y };
          });
          setLabelPositions(newPositions);
          app.canvas.style.cursor = 'default';
        },
        onDoubleClick: (container) => {
          setEditingLabel(container.labelData);
        }
      });

      viewport.addChild(container);
      textLabelContainersRef.current.push(container);
    }
  }, [textLabels, labelPositions, selectedLabelIds]);

  return { thumbnailContainersRef, textLabelContainersRef };
};
