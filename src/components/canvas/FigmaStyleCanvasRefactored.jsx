import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as PIXI from 'pixi.js';

// Import refactored components
import CommentPin from './CommentPin';
import CommentDialog from './CommentDialog';
import SidebarAnalytics from './SidebarAnalytics';
import SidebarArtDirector from './SidebarArtDirector';
import SelectionIndicator from './SelectionIndicator';
import ThumbnailActions from './ThumbnailActions';
import YouTubeImporter from './YouTubeImporter';
import TopToolbar from './TopToolbar';
import ToolSettingsPanel from './ToolSettingsPanel';
import MainSidebar from './MainSidebar';
import ContentImportSidebar from './ContentImportSidebar';
import RemoteCursors from './RemoteCursors';
import CanvasViewportControlsRefactored from './CanvasViewportControlsRefactored';
import { useCanvasToolsIntegrated } from '../../hooks/useCanvasToolsIntegrated';
import { usePixiRenderer } from '../../hooks/usePixiRenderer';

// Import state management
import { CanvasStateProvider, useCanvasState } from '../../state/canvasState';
import { useCanvasActions, useSelectionActions, useUIActions, useHistoryActions } from '../../hooks/useCanvasActions';
import { multiplayerManager } from '../../services/multiplayerManager';
import { updateThumbnailEventMode } from './ThumbnailRenderer';
import { updateTextLabel, DEFAULT_LABEL_STYLE } from './TextLabelRenderer';
import { setupCanvasControls, createGridSprite, updateGridPosition } from './CanvasControls';
import { drawSelectionRect, clearSelectionRect, createRectFromPoints, getIntersectingThumbnails, getIntersectingTextLabels, throttle } from './SelectionRectangle';
import { 
  createDrawingSystem, 
  renderFreehandStroke, 
  createDrawingData,
  smoothPath
} from './DrawingRenderer';

// Configure PIXI global settings for high-DPI support
// PIXI v8 uses different API than older versions
if (typeof window !== 'undefined' && window.devicePixelRatio) {
  // In PIXI v8, settings are configured differently
  // Set default texture options
  PIXI.TextureSource.defaultOptions.scaleMode = 'linear'; // Use linear for smooth thumbnails
  
  // Configure default resolution for textures
  PIXI.TextureSource.defaultOptions.resolution = window.devicePixelRatio || 1;
}

const FigmaStyleCanvasInternal = () => {
  // Get state and actions from context
  const state = useCanvasState();
  const canvasActions = useCanvasActions();
  const selectionActions = useSelectionActions();
  const uiActions = useUIActions();
  const historyActions = useHistoryActions();
  const containerRef = useRef();
  const appRef = useRef();
  const viewportRef = useRef();
  const thumbnailContainersRef = useRef([]);
  const gridGraphicsRef = useRef();
  const cleanupRef = useRef();
  const drawingSystemRef = useRef();
  const tempDrawingGraphicsRef = useRef();
  const currentDrawingRef = useRef(null);
  const isDrawingModeRef = useRef(false);
  const isHandToolModeRef = useRef(false);
  const isAddingCommentRef = useRef(false);
  const isSpacePanningRef = useRef(false);
  const drawingSettingsRef = useRef({
    isEraserMode: false,
    brushSize: 4,
    brushColor: '#3b82f6'
  });
  const drawingsRef = useRef([]);
  const textLabelContainersRef = useRef([]);
  const isAddingLabelRef = useRef(false);
  const labelSettingsRef = useRef(DEFAULT_LABEL_STYLE);
  
  // Extract state from context
  const { 
    canvas: { 
      youtubeThumbnails, 
      thumbnailPositions, 
      comments, 
      textLabels, 
      labelPositions, 
      lockedThumbnails,
      drawings
    },
    selection: { 
      selectedIds, 
      selectedLabelIds, 
      selectedLabelText 
    },
    ui: { 
      viewportTransform,
      pendingCommentPos,
      editingComment,
      editingLabel,
      showAnalytics,
      selectedCritique,
      draggedComment,
      dragOffset,
      sidebarOpen,
      sidebarWidth,
      showContentImportSidebar,
      showYouTubeImporter
    },
    tools: {
      drawing: drawingSettings,
      label: labelSettings
    }
  } = state;
  
  // Multiplayer state (not migrated to global state yet)
  const [isMultiplayerEnabled, setIsMultiplayerEnabled] = useState(false);
  const [isMultiplayerConnected, setIsMultiplayerConnected] = useState(false);
  const [remoteCursors, setRemoteCursors] = useState({});
  const [multiplayerUserCount, setMultiplayerUserCount] = useState(0);
  const [currentMultiplayerUser, setCurrentMultiplayerUser] = useState(null);
  const lastCursorPositionRef = useRef({ x: 0, y: 0 });
  
  // Local drawing state
  const [, setCurrentDrawing] = useState(null);
  const [, setIsDrawing] = useState(false);
  
  // Helper to update thumbnail event modes - moved here to avoid temporal dead zone
  const updateAllThumbnailEventModes = (isDrawingMode) => {
    if (thumbnailContainersRef.current) {
      thumbnailContainersRef.current.forEach(container => {
        if (container.userData && container.userData.id) {
          // Only disable thumbnail interactions for drawing mode
          // Hand tool should NOT affect thumbnail selection
          updateThumbnailEventMode(container, isDrawingMode);
        }
      });
    }
  };
  
  // Rectangular selection state - moved before canvasTools to avoid reference error
  const [, setSelectionRect] = useState(null);
  const [, setIsRectSelecting] = useState(false);

  // History actions from context - no more manual history management!
  const { undo, redo } = historyActions;
  
  const canvasTools = useCanvasToolsIntegrated({
    appRef,
    viewportRef,
    viewportTransform,
    setViewportTransform: uiActions.setViewportTransform,
    updateAllThumbnailEventModes,
    historyActions: {
      undo,
      redo,
    },
    setIsSelecting: setIsRectSelecting,
    setSelectionStart: () => {},
    setSelectionEnd: () => {},
    isSpacePanning: isSpacePanningRef.current,
  });
  
  // Only show YouTube thumbnails - no mock data
  const thumbnails = useMemo(() => {
    return youtubeThumbnails;
  }, [youtubeThumbnails]);

  // Initialize PixiJS thumbnail and label rendering
  usePixiRenderer(
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
      setSelectedIds: selectionActions.setSelection,
      setThumbnailPositions: canvasActions.updateThumbnailPositions,
      setSelectedLabelIds: selectionActions.setLabelSelection,
      setLabelPositions: canvasActions.updateLabelPositions,
      setEditingLabel: uiActions.setEditingLabel,
    }
  );

  // Destructure the tools we need from canvasTools
  const {
    activeTool,
    isSpacePanning,
    isHandToolMode,
    isDrawingMode,
    isAddingComment,
    isAddingLabel,
    toolActions,
    zoomActions,
  } = canvasTools;
  const selectionRectGraphicsRef = useRef();
  
  // Check if user has ever imported videos (for first-time experience)
  const [, setHasImportedBefore] = useState(() => {
    try {
      return localStorage.getItem('hasImportedVideos') === 'true';
    } catch {
      return false;
    }
  });
  
  // Throttled intersection update for performance - reduced throttling for better responsiveness
  const throttledUpdateSelection = useMemo(
    () => throttle((rect) => {
      if (!rect) return;
      
      // Handle thumbnail intersections
      if (thumbnailContainersRef.current) {
        const intersectingContainers = getIntersectingThumbnails(rect, thumbnailContainersRef.current);
        const intersectingIds = new Set(intersectingContainers.map(c => c.userData.id));
        
        // Update visual feedback during selection
        thumbnailContainersRef.current.forEach(container => {
          const isIntersecting = intersectingIds.has(container.userData.id);
          
          if (isIntersecting) {
            // Show as being selected during drag (including locked thumbnails)
            container.hoverOutline.visible = true;
          } else {
            // Hide hover outline if not intersecting
            if (!container.selected) {
              container.hoverOutline.visible = false;
            }
          }
        });
      }
      
      // Handle text label intersections
      if (textLabelContainersRef.current) {
        const intersectingLabelContainers = getIntersectingTextLabels(rect, textLabelContainersRef.current);
        const intersectingLabelIds = new Set(intersectingLabelContainers.map(c => c.labelData.id));
        
        // Update visual feedback during selection
        textLabelContainersRef.current.forEach(container => {
          const isIntersecting = intersectingLabelIds.has(container.labelData.id);
          
          if (isIntersecting) {
            // Show as being selected during drag
            container.hoverBg.visible = true;
          } else {
            // Hide hover effect if not intersecting and not selected
            if (!container.selected) {
              container.hoverBg.visible = false;
            }
          }
        });
      }
    }, 8), // ~120fps for better responsiveness
    []
  );
  
  // Functions moved to before useCanvasToolsIntegrated to avoid temporal dead zone
  
  // Sidebar handlers
  const handleSidebarToggle = () => {
    const newOpen = !sidebarOpen;
    uiActions.setSidebarState(newOpen);
    try {
      localStorage.setItem('sidebarOpen', String(newOpen));
    } catch (error) {
      console.warn('Failed to save sidebar state to localStorage:', error);
    }
  };

  const handleSidebarWidthChange = (newWidth) => {
    uiActions.setSidebarWidth(newWidth);
    try {
      localStorage.setItem('sidebarWidth', String(newWidth));
    } catch (error) {
      console.warn('Failed to save sidebar width to localStorage:', error);
    }
  };
  
  // Update refs when state changes
  React.useEffect(() => {
    isAddingCommentRef.current = isAddingComment;
  }, [isAddingComment]);

  React.useEffect(() => {
    drawingSettingsRef.current = drawingSettings;
  }, [drawingSettings]);

  React.useEffect(() => {
    drawingsRef.current = drawings;
  }, [drawings]);

  React.useEffect(() => {
    isAddingLabelRef.current = isAddingLabel;
  }, [isAddingLabel]);

  React.useEffect(() => {
    labelSettingsRef.current = labelSettings;
  }, [labelSettings]);

  // Sync isDrawingMode with ref so CanvasControls can detect drawing mode
  React.useEffect(() => {
    isDrawingModeRef.current = isDrawingMode;
  }, [isDrawingMode]);

  React.useEffect(() => {
    isHandToolModeRef.current = isHandToolMode;
  }, [isHandToolMode]);

  // Function moved to before useCanvasToolsIntegrated to avoid temporal dead zone


  // Zoom control handlers
  const handleZoomIn = () => {
    if (viewportRef.current && viewportTransform.scale < 5) {
      const newScale = Math.min(viewportTransform.scale * 1.2, 5);
      const viewport = viewportRef.current;
      
      viewport.scale.x = newScale;
      viewport.scale.y = newScale;
      
      uiActions.setViewportTransform({ ...viewportTransform, scale: newScale });
    }
  };

  const handleZoomOut = () => {
    if (viewportRef.current && viewportTransform.scale > 0.1) {
      const newScale = Math.max(viewportTransform.scale / 1.2, 0.1);
      const viewport = viewportRef.current;
      
      viewport.scale.x = newScale;
      viewport.scale.y = newScale;
      
      uiActions.setViewportTransform({ ...viewportTransform, scale: newScale });
    }
  };

  const handleZoomToFit = () => {
    if (viewportRef.current && thumbnailContainersRef.current.length > 0) {
      // Reset to 100% zoom and center the view
      const viewport = viewportRef.current;
      viewport.scale.x = 1;
      viewport.scale.y = 1;
      viewport.x = 0;
      viewport.y = 0;
      
      uiActions.setViewportTransform({ x: 0, y: 0, scale: 1 });
    }
  };

  // Clear all drawings functionality
  const clearAllDrawings = () => {
    if (drawings.length > 0) {
      canvasActions.clearAllDrawings();
      
      // Clear temporary drawing
      if (tempDrawingGraphicsRef.current) {
        tempDrawingGraphicsRef.current.clear();
      }
    }
  };

  // Handle drawing settings changes from toolbar
  const handleDrawingSettingsChange = React.useCallback((settings) => {
    canvasActions.updateDrawingSettings(settings);
    
    // Update cursor based on tool
    if (isDrawingMode && appRef.current && appRef.current.canvas) {
      appRef.current.canvas.style.cursor = settings.isEraserMode ? 'cell' : 'crosshair';
    }
  }, [isDrawingMode, canvasActions]);
  
  // Initialize PixiJS app only once
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
        preserveDrawingBuffer: false, // Set to false for better performance
        powerPreference: 'high-performance',
        // Ensure render options are set for high-DPI
        hello: true, // Enable high-DPI mode
        roundPixels: false, // Don't round pixels for smoother rendering
      });
      
      if (destroyed || !containerRef.current) {
        app.destroy(true);
        return;
      }
      
      containerRef.current.appendChild(app.canvas);
      appRef.current = app;
      
      // Create main viewport container
      const viewport = new PIXI.Container();
      viewport.eventMode = 'passive'; // Allow events to pass through to children
      viewportRef.current = viewport;
      app.stage.addChild(viewport);
      
      // Grid background - using TilingSprite for better performance
      const gridSprite = createGridSprite(app);
      gridGraphicsRef.current = gridSprite;
      app.stage.addChildAt(gridSprite, 0);
      
      // Selection rectangle graphics - add to viewport so it transforms with content
      const selectionRectGraphics = new PIXI.Graphics();
      selectionRectGraphicsRef.current = selectionRectGraphics;
      viewport.addChild(selectionRectGraphics);
      
      // Drawing system - create two-layer drawing containers
      const drawingSystem = createDrawingSystem(app, viewport);
      drawingSystemRef.current = drawingSystem;
      
      // Temporary drawing graphics for live drawing feedback
      const tempDrawingGraphics = new PIXI.Graphics();
      tempDrawingGraphicsRef.current = tempDrawingGraphics;
      drawingSystem.foregroundDrawingsContainer.addChild(tempDrawingGraphics);
      
      // Initial grid position update
      updateGridPosition(gridSprite, viewport, app);
      uiActions.setViewportTransform({
        x: viewport.x,
        y: viewport.y,
        scale: viewport.scale.x
      });
      
      // Setup multiplayer cursor tracking
      const handlePointerMove = throttle((e) => {
        if (isMultiplayerEnabled && multiplayerManager.isConnected) {
          const globalPos = e.global || e.data.global;
          const localPos = viewport.toLocal(globalPos);
          
          // Only send if position changed significantly
          const dx = Math.abs(localPos.x - lastCursorPositionRef.current.x);
          const dy = Math.abs(localPos.y - lastCursorPositionRef.current.y);
          
          if (dx > 2 || dy > 2) {
            multiplayerManager.sendCursor(localPos.x, localPos.y);
            lastCursorPositionRef.current = { x: localPos.x, y: localPos.y };
          }
        }
      }, 50); // Throttle to 20 updates per second
      
      // Listen for pointer events on stage
      app.stage.on('pointermove', handlePointerMove);
      app.stage.on('pointerleave', () => {
        if (isMultiplayerEnabled && multiplayerManager.isConnected) {
          multiplayerManager.sendCursorLeave();
        }
      });
      
      // Setup canvas controls
      const cleanup = setupCanvasControls(app, viewport, gridSprite, {
        onViewportTransform: uiActions.setViewportTransform,
        onAddComment: uiActions.setPendingComment,
        isAddingComment: () => isAddingCommentRef.current,
        isDrawingMode: () => isDrawingModeRef.current,
        isHandToolMode: () => isHandToolModeRef.current,
        isSelectionAllowed: () => canvasTools.toolBehavior.canSelect,
        isAddingLabel: () => isAddingLabelRef.current,
        onAddLabel: (pos) => {
          handleLabelCreate(pos);
        },
        onSpacePanStart: () => {
          isSpacePanningRef.current = true;
          // Keep drawing mode active but cursor changes to grab in CanvasControls
        },
        onSpacePanEnd: () => {
          isSpacePanningRef.current = false;
          // Cursor is restored to crosshair in CanvasControls
        },
        onClearSelection: () => {
          thumbnailContainersRef.current.forEach(c => {
            c.selected = false;
            c.selectionOutline.visible = false;
            c.hoverOutline.visible = false;
          });
          selectionActions.clearSelection();
          // Clear label selection
          textLabelContainersRef.current.forEach(c => {
            c.selected = false;
            c.selectionOutline.visible = false;
            c.hoverBg.visible = false;
          });
        },
        onCanvasClick: () => {
          // Close any open comment when clicking on canvas
          uiActions.setEditingComment(null);
          // Close label edit dialog
          uiActions.setEditingLabel(null);
        },
        onRectSelectionStart: () => {
          setIsRectSelecting(true);
          setSelectionRect(null);
        },
        onRectSelectionMove: (startPoint, currentPoint) => {
          const rect = createRectFromPoints(startPoint, currentPoint);
          setSelectionRect(rect);
          
          // Draw selection rectangle
          if (selectionRectGraphics && viewport) {
            drawSelectionRect(selectionRectGraphics, rect, viewport);
          }
          
          // Update intersecting thumbnails with visual feedback
          throttledUpdateSelection(rect);
        },
        onRectSelectionEnd: (startPoint, endPoint, modifierKeys) => {
          const rect = createRectFromPoints(startPoint, endPoint);
          
          // Only proceed if there's a meaningful rectangle (minimum size)
          if (rect.width > 1 || rect.height > 1) {
            // Get intersecting thumbnails
            const intersectingContainers = getIntersectingThumbnails(rect, thumbnailContainersRef.current);
            const intersectingIds = new Set(intersectingContainers.map(c => c.userData.id));
            
            // Get intersecting text labels
            const intersectingLabelContainers = getIntersectingTextLabels(rect, textLabelContainersRef.current);
            const intersectingLabelIds = new Set(intersectingLabelContainers.map(c => c.labelData.id));
            
            console.log('[RectSelection] Selected', intersectingContainers.length, 'thumbnails and', intersectingLabelContainers.length, 'labels');
            
            // All intersecting thumbnails are selectable (including locked ones)
            const selectableIds = intersectingIds;
            
            // Handle different modifier key behaviors for thumbnails
            let newSelectedIds;
            if (modifierKeys.shiftKey || modifierKeys.metaKey || modifierKeys.ctrlKey) {
              // Add to existing selection (Shift) or toggle (Cmd/Ctrl)
              if (modifierKeys.shiftKey) {
                // Add to selection
                newSelectedIds = new Set([...selectedIds, ...selectableIds]);
              } else {
                // Toggle selection (Cmd/Ctrl)
                newSelectedIds = new Set(selectedIds);
                selectableIds.forEach(id => {
                  if (newSelectedIds.has(id)) {
                    newSelectedIds.delete(id);
                  } else {
                    newSelectedIds.add(id);
                  }
                });
              }
            } else {
              // Replace selection
              newSelectedIds = selectableIds;
            }
            
            // Handle different modifier key behaviors for text labels
            let newSelectedLabelIds;
            if (modifierKeys.shiftKey || modifierKeys.metaKey || modifierKeys.ctrlKey) {
              // Add to existing selection (Shift) or toggle (Cmd/Ctrl)
              if (modifierKeys.shiftKey) {
                // Add to selection
                newSelectedLabelIds = new Set([...selectedLabelIds, ...intersectingLabelIds]);
              } else {
                // Toggle selection (Cmd/Ctrl)
                newSelectedLabelIds = new Set(selectedLabelIds);
                intersectingLabelIds.forEach(id => {
                  if (newSelectedLabelIds.has(id)) {
                    newSelectedLabelIds.delete(id);
                  } else {
                    newSelectedLabelIds.add(id);
                  }
                });
              }
            } else {
              // Replace selection
              newSelectedLabelIds = intersectingLabelIds;
            }
            
            // Update selection state and visuals
            selectionActions.setBothSelections(Array.from(newSelectedIds), Array.from(newSelectedLabelIds));
            
            // Update visual state of thumbnails
            thumbnailContainersRef.current.forEach(container => {
              const isSelected = newSelectedIds.has(container.userData.id);
              container.selected = isSelected;
              container.selectionOutline.visible = isSelected;
              container.hoverOutline.visible = false; // Clear hover state
            });
            
            // Update visual state of text labels
            textLabelContainersRef.current.forEach(container => {
              const isSelected = newSelectedLabelIds.has(container.labelData.id);
              container.selected = isSelected;
              container.selectionOutline.visible = isSelected;
              container.hoverBg.visible = false; // Clear hover state
            });
            
            // Note: History is automatically saved by the reducer for selection changes
          }
          
          // Clear selection rectangle
          setSelectionRect(null);
          setIsRectSelecting(false);
          if (selectionRectGraphics) {
            clearSelectionRect(selectionRectGraphics);
          }
          
          // Clear any remaining hover states
          thumbnailContainersRef.current.forEach(container => {
            if (!container.selected) {
              container.hoverOutline.visible = false;
            }
          });
          textLabelContainersRef.current.forEach(container => {
            if (!container.selected) {
              container.hoverBg.visible = false;
            }
          });
        },
        onDrawingStart: (startPoint) => {
          // Handle eraser mode - find and remove intersecting drawings
          if (drawingSettingsRef.current.isEraserMode) {
            const eraserRadius = drawingSettingsRef.current.brushSize * 1.5; // Eraser scales with brush size
            const toRemove = drawingsRef.current.filter(drawing => {
              // Check if any point in the drawing is within eraser radius
              return drawing.points.some(point => {
                const distance = Math.sqrt(
                  Math.pow(point.x - startPoint.x, 2) + Math.pow(point.y - startPoint.y, 2)
                );
                return distance <= eraserRadius;
              });
            });
            
            if (toRemove.length > 0) {
              const toRemoveIds = toRemove.map(d => d.id);
              canvasActions.deleteDrawings(toRemoveIds);
            }
            return;
          }
          
          // Normal drawing mode
          setIsDrawing(true);
          const drawingStyle = {
            color: parseInt(drawingSettingsRef.current.brushColor.replace('#', '0x')),
            width: drawingSettingsRef.current.brushSize,
            alpha: 1.0
          };
          
          const newDrawing = {
            startPoint,
            currentPoint: startPoint,
            points: [startPoint],
            type: 'freehand',
            layer: 'over_thumbnails',
            style: drawingStyle
          };
          setCurrentDrawing(newDrawing);
          currentDrawingRef.current = newDrawing;
        },
        onDrawingMove: (_, currentPoint) => {
          // Handle eraser mode - continuous erasing
          if (drawingSettingsRef.current.isEraserMode) {
            const eraserRadius = drawingSettingsRef.current.brushSize * 1.5;
            const toRemove = drawingsRef.current.filter(drawing => {
              return drawing.points.some(point => {
                const distance = Math.sqrt(
                  Math.pow(point.x - currentPoint.x, 2) + Math.pow(point.y - currentPoint.y, 2)
                );
                return distance <= eraserRadius;
              });
            });
            
            if (toRemove.length > 0) {
              const toRemoveIds = toRemove.map(d => d.id);
              canvasActions.deleteDrawings(toRemoveIds);
              // Don't save to history on every move - only on start/end
            }
            return;
          }
          
          // Update current drawing (normal pen mode)
          if (currentDrawingRef.current) {
            const lastPoint = currentDrawingRef.current.points[currentDrawingRef.current.points.length - 1];
            
            // Calculate minimum distance based on zoom level for smoother lines
            const viewportScale = viewportRef.current ? viewportRef.current.scale.x : 1;
            const minDistance = Math.max(1, 3 / viewportScale); // Adjust minimum distance based on zoom
            
            // Only add point if it's far enough from the last point
            const distance = Math.sqrt(
              Math.pow(currentPoint.x - lastPoint.x, 2) + Math.pow(currentPoint.y - lastPoint.y, 2)
            );
            
            if (distance >= minDistance) {
              // Use current drawing settings for live update
              const currentStyle = {
                color: parseInt(drawingSettingsRef.current.brushColor.replace('#', '0x')),
                width: drawingSettingsRef.current.brushSize,
                alpha: 1.0
              };
              
              const updatedDrawing = {
                ...currentDrawingRef.current,
                currentPoint,
                points: [...currentDrawingRef.current.points, currentPoint],
                style: currentStyle // Update style with current settings
              };
              setCurrentDrawing(updatedDrawing);
              currentDrawingRef.current = updatedDrawing;
              
              // Render temporary preview with current style
              if (tempDrawingGraphicsRef.current) {
                const smoothedPoints = smoothPath(updatedDrawing.points, Math.max(1, 2 / viewportScale));
                renderFreehandStroke(tempDrawingGraphicsRef.current, smoothedPoints, currentStyle);
              }
            }
          }
        },
        onDrawingEnd: () => {
          // Handle eraser mode end
          if (drawingSettingsRef.current.isEraserMode) {
            // Eraser operations are already handled in move and saved to history automatically
            return;
          }
          
          // Finalize normal drawing
          if (currentDrawingRef.current && currentDrawingRef.current.points.length > 1) {
            const finalPoints = smoothPath(currentDrawingRef.current.points, 2);
            
            // Ensure final drawing uses current settings
            const finalStyle = {
              color: parseInt(drawingSettingsRef.current.brushColor.replace('#', '0x')),
              width: drawingSettingsRef.current.brushSize,
              alpha: 1.0
            };
            
            const drawingData = createDrawingData(
              currentDrawingRef.current.type,
              finalPoints,
              finalStyle,
              currentDrawingRef.current.layer
            );
            
            // Add to drawings array
            canvasActions.addDrawing(drawingData);
            
            // Clear temporary drawing
            if (tempDrawingGraphicsRef.current) {
              tempDrawingGraphicsRef.current.clear();
            }
          }
          
          // Clear current drawing state
          setCurrentDrawing(null);
          currentDrawingRef.current = null;
          setIsDrawing(false);
        },
        onKeyDown: (e) => {
          // Do not trigger canvas shortcuts if an input is focused
          if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
            return;
          }
          
          // Delete selected thumbnails and text labels
          if (e.key === 'Delete' || e.key === 'Backspace') {
            const hasSelectedThumbnails = thumbnailContainersRef.current.some(c => c.selected);
            const hasSelectedLabels = textLabelContainersRef.current.some(c => c.selected);
            
            if (hasSelectedThumbnails || hasSelectedLabels) {
              // Don't delete if editing a label
              if (editingLabel) return;
              
              // Variables no longer needed with centralized state management
              
              // Handle thumbnail deletion
              if (hasSelectedThumbnails) {
                const toRemove = thumbnailContainersRef.current.filter(c => c.selected);
                const deletedIds = toRemove.map(c => c.userData.id);
                
                toRemove.forEach(c => {
                  viewport.removeChild(c);
                  const index = thumbnailContainersRef.current.indexOf(c);
                  if (index > -1) {
                    thumbnailContainersRef.current.splice(index, 1);
                  }
                });
                
                // Update state
                canvasActions.deleteThumbnails(deletedIds);
                selectionActions.clearSelection();
                // deletionAction tracking no longer needed with centralized state
              }
              
              // Handle text label deletion
              if (hasSelectedLabels) {
                const toRemoveLabels = textLabelContainersRef.current.filter(c => c.selected);
                const deletedLabelIds = toRemoveLabels.map(c => c.labelData.id);
                
                toRemoveLabels.forEach(c => {
                  viewport.removeChild(c);
                  const index = textLabelContainersRef.current.indexOf(c);
                  if (index > -1) {
                    textLabelContainersRef.current.splice(index, 1);
                  }
                });
                
                // Update state
                canvasActions.deleteLabels(deletedLabelIds);
                selectionActions.clearSelection();
                
                // deletionAction tracking no longer needed with centralized state
              }
              
              // History is automatically saved by the reducer for deletion actions
            }
          }
          
          // Select all (thumbnails and text labels)
          if (e.key === 'a' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            
            // Select all thumbnails
            thumbnailContainersRef.current.forEach(c => {
              c.selected = true;
              c.selectionOutline.visible = true;
            });
            const allIds = thumbnailContainersRef.current.map(c => c.userData.id);
            
            // Select all text labels
            textLabelContainersRef.current.forEach(c => {
              c.selected = true;
              c.selectionOutline.visible = true;
            });
            const allLabelIds = textLabelContainersRef.current.map(c => c.labelData.id);
            selectionActions.setBothSelections(allIds, allLabelIds);
          }
          
          // Deselect all
          if (e.key === 'Escape') {
            // Deselect thumbnails
            thumbnailContainersRef.current.forEach(c => {
              c.selected = false;
              c.selectionOutline.visible = false;
            });
            // Deselect text labels
            textLabelContainersRef.current.forEach(c => {
              c.selected = false;
              c.selectionOutline.visible = false;
              c.hoverBg.visible = false;
            });
            selectionActions.clearSelection();
            
            // Exit special modes
            if (isAddingComment) toolActions.selectSelectionTool();
            uiActions.setPendingComment(null);
            uiActions.setEditingComment(null);
            uiActions.setEditingLabel(null);
          }
          
          // Comment mode shortcut
          if (e.key === 'c' && !e.metaKey && !e.ctrlKey) {
            toolActions.toggleCommentMode();
          }
          
          // Drawing mode shortcut
          if (e.key === 'p' && !e.metaKey && !e.ctrlKey) {
            toolActions.toggleDrawingMode();
          }
          
          // Label mode shortcut
          if (e.key === 't' && !e.metaKey && !e.ctrlKey) {
            toolActions.toggleLabelMode();
          }
          
          // Selection tool (V) - always ensure selection mode
          if (e.key === 'v' && !e.metaKey && !e.ctrlKey) {
            toolActions.toggleHandTool(false);
          }
          
          // Hand tool mode (H) - always ensure hand tool mode
          if (e.key === 'h' && !e.metaKey && !e.ctrlKey) {
            toolActions.toggleHandTool(true);
          }
          
          // Zoom in (+)
          if ((e.key === '=' || e.key === '+') && !e.metaKey && !e.ctrlKey) {
            handleZoomIn();
          }
          
          // Zoom out (-)
          if (e.key === '-' && !e.metaKey && !e.ctrlKey) {
            handleZoomOut();
          }
          
          // Zoom to fit (0)
          if (e.key === '0' && !e.metaKey && !e.ctrlKey) {
            handleZoomToFit();
          }
          
          // Undo (Cmd+Z / Ctrl+Z)
          if (e.key === 'z' && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
            e.preventDefault();
            undo();
          }
          
          // Redo (Cmd+Shift+Z / Ctrl+Shift+Z)
          if (e.key === 'z' && (e.metaKey || e.ctrlKey) && e.shiftKey) {
            e.preventDefault();
            redo();
          }
        }
      });
      
      cleanupRef.current = () => {
        cleanup();
        app.stage.off('pointermove', handlePointerMove);
      };
    };
    
    initPixi();
    
    // Cleanup
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
  }, [isMultiplayerEnabled]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Multiplayer connection management
  useEffect(() => {
    if (isMultiplayerEnabled) {
      // Connect to multiplayer
      multiplayerManager.connect('canvas-main');
      
      // Set up event listeners
      const unsubscribers = [];
      
      unsubscribers.push(
        multiplayerManager.on('connected', () => {
          setIsMultiplayerConnected(true);
          console.log('Connected to multiplayer');
        })
      );
      
      unsubscribers.push(
        multiplayerManager.on('disconnected', () => {
          setIsMultiplayerConnected(false);
          setRemoteCursors({});
          setMultiplayerUserCount(0);
        })
      );
      
      unsubscribers.push(
        multiplayerManager.on('identity', (data) => {
          setCurrentMultiplayerUser({
            id: data.userId,
            name: data.name,
            color: data.color
          });
        })
      );
      
      unsubscribers.push(
        multiplayerManager.on('sync', (data) => {
          // Initial sync of all users
          const cursors = {};
          Object.entries(data.cursors || {}).forEach(([userId, cursor]) => {
            if (userId !== multiplayerManager.userId) {
              cursors[userId] = cursor;
            }
          });
          setRemoteCursors(cursors);
          setMultiplayerUserCount(data.connectionCount || 0);
        })
      );
      
      unsubscribers.push(
        multiplayerManager.on('cursor', (data) => {
          if (data.userId !== multiplayerManager.userId) {
            setRemoteCursors(prev => ({
              ...prev,
              [data.userId]: {
                x: data.x,
                y: data.y,
                name: data.name,
                color: data.color,
                timestamp: Date.now()
              }
            }));
          }
        })
      );
      
      unsubscribers.push(
        multiplayerManager.on('cursor-leave', (data) => {
          setRemoteCursors(prev => {
            const updated = { ...prev };
            delete updated[data.userId];
            return updated;
          });
        })
      );
      
      unsubscribers.push(
        multiplayerManager.on('user-joined', (data) => {
          setMultiplayerUserCount(data.connectionCount || 0);
        })
      );
      
      unsubscribers.push(
        multiplayerManager.on('user-left', (data) => {
          setRemoteCursors(prev => {
            const updated = { ...prev };
            delete updated[data.userId];
            return updated;
          });
          setMultiplayerUserCount(data.connectionCount || 0);
        })
      );
      
      // Clean up stale cursors
      const interval = setInterval(() => {
        setRemoteCursors(prev => {
          const now = Date.now();
          const updated = {};
          Object.entries(prev).forEach(([id, cursor]) => {
            if (now - cursor.timestamp < 5000) { // 5 second timeout
              updated[id] = cursor;
            }
          });
          return updated;
        });
      }, 1000);
      
      return () => {
        unsubscribers.forEach(unsub => unsub());
        clearInterval(interval);
        multiplayerManager.disconnect();
      };
    } else {
      // Clean up when disabled
      multiplayerManager.disconnect();
      setIsMultiplayerConnected(false);
      setRemoteCursors({});
      setMultiplayerUserCount(0);
      setCurrentMultiplayerUser(null);
    }
  }, [isMultiplayerEnabled]);
  
  // Toggle multiplayer
  const toggleMultiplayer = () => {
    setIsMultiplayerEnabled(prev => !prev);
  };
  
  // Update selected label text when selection changes - now handled by reducer automatically
  // This useEffect is no longer needed as selectedLabelText is managed by the reducer
  
  const selectedThumbnails = thumbnails.filter(t => selectedIds.has(t.id));
  
  // Handle comment submission
  const handleCommentSubmit = (text) => {
    if (pendingCommentPos && text.trim()) {
      canvasActions.addComment(pendingCommentPos, text);
    }
    uiActions.setPendingComment(null);
  };
  
  // Handle label creation
  const handleLabelCreate = (pos) => {
    const newLabel = canvasActions.addLabel('New Section', pos, labelSettings);
    
    // Immediately edit the new label
    uiActions.setEditingLabel(newLabel);
    if (isAddingLabel) toolActions.selectSelectionTool();
  };

  // Handle applying settings to selected labels
  const handleApplySettingsToSelected = (newSettings) => {
    if (selectedLabelIds.size === 0) return;

    // Update the label data using actions
    const selectedIds = Array.from(selectedLabelIds);
    selectedIds.forEach(id => {
      canvasActions.updateLabel(id, { style: newSettings });
    });

    // Also update the visual containers immediately
    textLabelContainersRef.current.forEach(container => {
      if (selectedLabelIds.has(container.labelData.id)) {
        updateTextLabel(container, container.labelData.text, { ...container.labelData.style, ...newSettings });
      }
    });

    // History is automatically saved by the reducer for label updates
  };
  
  // Handle global mouse events for comment dragging
  useEffect(() => {
    if (!draggedComment) return;

    const handleMouseMove = (e) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      // Calculate new position accounting for viewport transform
      const newX = (e.clientX - rect.left - dragOffset.x - viewportTransform.x) / viewportTransform.scale;
      const newY = (e.clientY - rect.top - dragOffset.y - viewportTransform.y) / viewportTransform.scale;
      
      canvasActions.updateComment(draggedComment, { x: newX, y: newY });
    };

    const handleMouseUp = () => {
      if (draggedComment) {
        // History is automatically saved by the reducer for comment updates
      }
      uiActions.setDraggedComment(null, { x: 0, y: 0 });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggedComment, dragOffset, viewportTransform, comments, canvasActions, uiActions]);

  // Handle click outside for AI Art-Director sidebar
  useEffect(() => {
    if (!selectedCritique) return;

    const handleClickOutside = (event) => {
      // Check if click is outside the sidebar
      const sidebar = document.querySelector('.sidebar-art-director');
      if (sidebar && !sidebar.contains(event.target)) {
        // Also check if the click is not on a ThumbnailActions button
        const isActionButton = event.target.closest('.thumbnail-actions-button');
        if (!isActionButton) {
          uiActions.setSelectedCritique(null);
        }
      }
    };

    // Add a small delay to prevent immediate closing when opening
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedCritique, uiActions]);

  return (
    <div className={`relative w-full h-screen overflow-hidden bg-neutral-5 ${draggedComment ? 'no-select' : ''}`}>
      {/* Top Toolbar */}
      <TopToolbar
        // Comment props
        isAddingComment={isAddingComment}
        onToggleAddComment={() => toolActions.toggleCommentMode()}
        commentCount={comments.length}
        
        // Drawing props
        isDrawingMode={isDrawingMode}
        onToggleDrawingMode={() => toolActions.toggleDrawingMode()}
        drawingCount={drawings.length}
        
        // Label props
        isAddingLabel={isAddingLabel}
        onToggleAddLabel={() => toolActions.toggleLabelMode()}
        labelCount={textLabels.length}
        
        // Multiplayer props
        isMultiplayerConnected={isMultiplayerConnected}
        multiplayerUserCount={multiplayerUserCount}
        currentMultiplayerUser={currentMultiplayerUser}
        remoteCursors={remoteCursors}
        onToggleMultiplayer={toggleMultiplayer}
        isMultiplayerEnabled={isMultiplayerEnabled}
        
        // History props - now using centralized state
        canUndo={state.history.past.length > 0}
        canRedo={state.history.future.length > 0}
        onUndo={undo}
        onRedo={redo}
        lastAction={state.history.present?.action}
        nextAction={state.history.future[0]?.action}
        
        // Sidebar props
        sidebarOpen={sidebarOpen}
        sidebarWidth={sidebarWidth}
        showContentImportSidebar={showContentImportSidebar}
      />
      
      {/* Main Sidebar */}
      <MainSidebar
        isOpen={sidebarOpen}
        onToggle={handleSidebarToggle}
        width={sidebarWidth}
        onWidthChange={handleSidebarWidthChange}
        minWidth={200}
        maxWidth={400}
        onAddContent={() => uiActions.setShowContentImport(true)}
      />
      
      <div 
        ref={containerRef} 
        className="absolute inset-0 pt-16" 
        style={{ 
          backgroundColor: '#f5f5f5',
          left: `${(sidebarOpen ? sidebarWidth : 60) + (showContentImportSidebar ? 380 : 0)}px`,
          transition: 'left 300ms ease-out'
        }}
      />
      
      {/* Canvas Viewport Controls */}
      <CanvasViewportControlsRefactored
        activeTool={activeTool}
        isSpacePanning={isSpacePanning}
        toolActions={toolActions}
        zoomLevel={zoomActions.zoomLevel}
        zoomActions={zoomActions}
        minZoom={10}
        maxZoom={500}
      />
      
      {/* Remote Cursors Layer */}
      {isMultiplayerEnabled && (
        <RemoteCursors 
          cursors={remoteCursors} 
          viewportTransform={viewportTransform}
        />
      )}
      
      

      {/* Advanced Import disabled for minimal UI */}
      {/* 
      {hasImportedBefore && hasSeenWelcome && (
        <button
          onClick={() => setShowYouTubeImporter(true)}
          className="absolute top-4 left-40 z-10 bg-background-primary border border-border-divider rounded-lg px-4 py-2 flex items-center gap-2 hover:bg-background-secondary shadow-sm transition-colors"
        >
          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
          <span className="text-compact-bold text-text-primary">Advanced Import</span>
        </button>
      )}
      */}
      

      
      
      
      
      
      
      {/* Thumbnail action buttons for selected thumbnails */}
      {selectedThumbnails.map(thumb => {
        const savedPos = thumbnailPositions[thumb.id];
        const position = {
          x: savedPos ? savedPos.x : thumb.x,
          y: savedPos ? savedPos.y : thumb.y
        };
        
        return (
          <ThumbnailActions
            key={`actions-${thumb.id}`}
            thumbnail={thumb}
            position={position}
            viewportTransform={viewportTransform}
            isLocked={lockedThumbnails.has(thumb.id)}
            onInfoClick={() => uiActions.setShowAnalytics(true)}
            onCritiqueClick={() => {
              uiActions.setSelectedCritique(thumb);
              uiActions.setShowAnalytics(false); // Close analytics if open
            }}
            onToggleVisibility={() => {
              canvasActions.toggleThumbnailLock(thumb.id);
            }}
          />
        );
      })}
      
      {/* Comment pins on canvas */}
      {comments.map((comment, index) => (
        <CommentPin
          key={comment.id}
          comment={comment}
          index={index}
          viewportTransform={viewportTransform}
          draggedComment={draggedComment}
          editingComment={editingComment}
          onMouseDown={(e) => {
            if (!e.target.closest('.comment-pin')) return;
            e.preventDefault();
            e.stopPropagation();
            uiActions.setDraggedComment(comment.id, {
              x: 16 * Math.min(1, 1 / viewportTransform.scale),
              y: 16 * Math.min(1, 1 / viewportTransform.scale)
            });
          }}
          onEditClick={() => uiActions.setEditingComment(comment.id)}
          onResolveToggle={() => {
            canvasActions.resolveComment(comment.id);
          }}
          onDelete={() => {
            canvasActions.deleteComment(comment.id);
          }}
          onClose={() => uiActions.setEditingComment(null)}
        />
      ))}
      
      {/* Comment input dialog */}
      {pendingCommentPos && (
        <CommentDialog
          position={pendingCommentPos}
          viewportTransform={viewportTransform}
          onSubmit={handleCommentSubmit}
          onCancel={() => uiActions.setPendingComment(null)}
        />
      )}
      
      
      {selectedThumbnails.length === 1 && (
        <SidebarAnalytics 
          thumbnail={selectedThumbnails[0]} 
          onClose={() => uiActions.setShowAnalytics(false)}
          isOpen={showAnalytics}
        />
      )}

      <SidebarArtDirector
        thumbnail={selectedCritique}
        onClose={() => uiActions.setSelectedCritique(null)}
        isOpen={!!selectedCritique}
      />
      
      {selectedThumbnails.length > 1 && (
        <SelectionIndicator count={selectedThumbnails.length} />
      )}
      

      {/* Tool Settings Panel */}
      <ToolSettingsPanel
        activeTool={
          isAddingComment ? 'comment' :
          isDrawingMode ? 'drawing' :
          isAddingLabel ? 'label' :
          null
        }
        // Comment props
        commentCount={comments.length}
        
        // Drawing props
        drawingCount={drawings.length}
        onClearAllDrawings={clearAllDrawings}
        onDrawingSettingsChange={handleDrawingSettingsChange}
        
        // Label props
        labelCount={textLabels.length}
        onLabelSettingsChange={canvasActions.updateLabelSettings}
        currentSettings={labelSettings}
        selectedLabelIds={selectedLabelIds}
        onApplySettingsToSelected={handleApplySettingsToSelected}
        selectedLabelText={selectedLabelText}
        onLabelTextChange={(newText) => {
          if (selectedLabelIds.size === 1) {
            const selectedId = [...selectedLabelIds][0];
            canvasActions.updateLabel(selectedId, { text: newText });
          }
        }}
        onClose={() => {
          if (isAddingComment) toolActions.selectSelectionTool();
          toolActions.selectSelectionTool();
          if (isAddingLabel) toolActions.selectSelectionTool();
        }}
      />
      {showYouTubeImporter && (
        <YouTubeImporter
          onClose={() => uiActions.setShowYouTubeImporter(false)}
          onVideosImported={(videos) => {
            canvasActions.importThumbnails(videos);
            try { localStorage.setItem('hasImportedVideos', 'true'); setHasImportedBefore(true); } catch {}
            uiActions.setShowYouTubeImporter(false);
          }}
          onCreateChannelHeader={(channelName) => {
            // Remove existing channel headers first, then add new one
            const toRemove = textLabels.filter(label => label.metadata?.type === 'channelHeader').map(l => l.id);
            if (toRemove.length > 0) {
              canvasActions.deleteLabels(toRemove);
            }
            canvasActions.addLabel(channelName, { x: 100, y: -20 }, { ...labelSettings, size: 'XL' }, { type: 'channelHeader' });
          }}
        />
      )}
      <ContentImportSidebar
        isOpen={showContentImportSidebar}
        onClose={() => uiActions.setShowContentImport(false)}
        sidebarWidth={sidebarOpen ? sidebarWidth : 60}
        onVideosImported={(videos) => {
          canvasActions.importThumbnails(videos);
          try { localStorage.setItem('hasImportedVideos', 'true'); setHasImportedBefore(true); } catch {}
        }}
        onCreateChannelHeader={(channelName) => {
          // Remove existing channel headers first, then add new one
          const toRemove = textLabels.filter(label => label.metadata?.type === 'channelHeader').map(l => l.id);
          if (toRemove.length > 0) {
            canvasActions.deleteLabels(toRemove);
          }
          canvasActions.addLabel(channelName, { x: 100, y: -20 }, { ...labelSettings, size: 'XL' }, { type: 'channelHeader' });
        }}
      />
    </div>
  );
};

// Wrapper component that provides state context
const FigmaStyleCanvasRefactored = () => {
  return (
    <CanvasStateProvider>
      <FigmaStyleCanvasInternal />
    </CanvasStateProvider>
  );
};

export default FigmaStyleCanvasRefactored;