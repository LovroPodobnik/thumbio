import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as PIXI from 'pixi.js';

// Import refactored components
import CommentPin from './CommentPin';
import CommentDialog from './CommentDialog';
import CommentModeIndicator from './CommentModeIndicator';
import DrawingModeIndicator from './DrawingModeIndicator';
import SidebarAnalytics from './SidebarAnalytics';
import SidebarArtDirector from './SidebarArtDirector';
import SelectionIndicator from './SelectionIndicator';
import ThumbnailActions from './ThumbnailActions';
import YouTubeImporter from './YouTubeImporter';
import UnifiedToolbar from './UnifiedToolbar';
import WelcomeSidebar from './WelcomeSidebar';
import RemoteCursors from './RemoteCursors';
import MultiplayerStatus from './MultiplayerStatus';
import { multiplayerManager } from '../../services/multiplayerManager';
import { createThumbnailContainer, setupThumbnailInteractions, updateThumbnailEventMode } from './ThumbnailRenderer';
import { createTextLabelContainer, setupTextLabelInteractions, updateTextLabel, createLabelData, DEFAULT_LABEL_STYLE } from './TextLabelRenderer';
import { drawGrid, setupCanvasControls, createGridSprite, updateGridPosition } from './CanvasControls';
import { drawSelectionRect, clearSelectionRect, createRectFromPoints, getIntersectingThumbnails, getIntersectingTextLabels, throttle } from './SelectionRectangle';
import { 
  createDrawingSystem, 
  createDrawingGraphics, 
  renderFreehandStroke, 
  renderLine, 
  renderRectangle, 
  addDrawingToLayer, 
  removeDrawingFromLayer,
  createDrawingData,
  smoothPath,
  DEFAULT_DRAWING_STYLE 
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

const FigmaStyleCanvasRefactored = () => {
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
  
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [thumbnailPositions, setThumbnailPositions] = useState({});
  const [comments, setComments] = useState([]);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [textLabels, setTextLabels] = useState([]);
  const [labelPositions, setLabelPositions] = useState({});
  const [isAddingLabel, setIsAddingLabel] = useState(false);
  // Removed pendingLabelPos - labels are created immediately on click
  const [editingLabel, setEditingLabel] = useState(null);
  const [labelSettings, setLabelSettings] = useState(DEFAULT_LABEL_STYLE);
  const [selectedLabelIds, setSelectedLabelIds] = useState(new Set());
  const [pendingCommentPos, setPendingCommentPos] = useState(null);
  const [viewportTransform, setViewportTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [draggedComment, setDraggedComment] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [editingComment, setEditingComment] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedCritique, setSelectedCritique] = useState(null);
  const [lockedThumbnails, setLockedThumbnails] = useState(new Set());
  const [youtubeThumbnails, setYoutubeThumbnails] = useState([]);
  
  // Multiplayer state
  const [isMultiplayerEnabled, setIsMultiplayerEnabled] = useState(false);
  const [isMultiplayerConnected, setIsMultiplayerConnected] = useState(false);
  const [remoteCursors, setRemoteCursors] = useState({});
  const [multiplayerUserCount, setMultiplayerUserCount] = useState(0);
  const [currentMultiplayerUser, setCurrentMultiplayerUser] = useState(null);
  const lastCursorPositionRef = useRef({ x: 0, y: 0 });
  const cursorThrottleRef = useRef(null);
  
  // Drawing state management
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawings, setDrawings] = useState([]);
  const [currentDrawing, setCurrentDrawing] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingSettings, setDrawingSettings] = useState({
    isEraserMode: false,
    brushSize: 4,
    brushColor: '#3b82f6'
  });
  
  // Rectangular selection state
  const [selectionRect, setSelectionRect] = useState(null);
  const [isRectSelecting, setIsRectSelecting] = useState(false);
  const selectionRectGraphicsRef = useRef();
  
  // Check if user has ever imported videos (for first-time experience)
  const [hasImportedBefore, setHasImportedBefore] = useState(() => {
    try {
      return localStorage.getItem('hasImportedVideos') === 'true';
    } catch {
      return false;
    }
  });
  
  // Check if user has seen welcome sidebar (for first-time experience)
  const [hasSeenWelcome, setHasSeenWelcome] = useState(() => {
    try {
      return localStorage.getItem('hasSeenWelcome') === 'true';
    } catch {
      return false;
    }
  });
  
  // Welcome sidebar state
  const [showWelcomeSidebar, setShowWelcomeSidebar] = useState(!hasSeenWelcome);
  
  // Show YouTube importer automatically for first-time users (but not if welcome sidebar is shown)
  const [showYouTubeImporter, setShowYouTubeImporter] = useState(!hasImportedBefore && hasSeenWelcome);
  
  // Undo/Redo system
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const maxHistorySize = 50;
  
  // Only show YouTube thumbnails - no mock data
  const thumbnails = useMemo(() => {
    return youtubeThumbnails;
  }, [youtubeThumbnails]);
  
  // Throttled intersection update for performance - reduced throttling for better responsiveness
  const throttledUpdateSelection = useMemo(
    () => throttle((rect, modifierKeys) => {
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
  
  // Save state to history for undo/redo
  const saveToHistory = (action, data) => {
    const state = {
      action,
      timestamp: Date.now(),
      data: {
        thumbnailPositions: { ...thumbnailPositions },
        comments: [...comments],
        selectedIds: new Set(selectedIds),
        selectedLabelIds: new Set(selectedLabelIds),
        lockedThumbnails: new Set(lockedThumbnails),
        youtubeThumbnails: [...youtubeThumbnails],
        drawings: [...drawings],
        textLabels: [...textLabels],
        labelPositions: { ...labelPositions },
        ...data
      }
    };
    
    setHistory(prev => {
      // Remove any history after current index (when undoing then making new changes)
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(state);
      
      // Keep history size manageable
      if (newHistory.length > maxHistorySize) {
        return newHistory.slice(-maxHistorySize);
      }
      
      return newHistory;
    });
    
    setHistoryIndex(prev => Math.min(prev + 1, maxHistorySize - 1));
  };
  
  // Undo function
  const undo = () => {
    if (historyIndex > 0 && history.length > historyIndex - 1) {
      const previousState = history[historyIndex - 1];
      
      // Check if previousState and its data exist
      if (!previousState || !previousState.data) {
        console.warn('[Undo] Invalid previous state, skipping undo');
        return;
      }
      
      const { data } = previousState;
      
      // Restore state with fallbacks
      if (data.thumbnailPositions) setThumbnailPositions(data.thumbnailPositions);
      if (data.comments) setComments(data.comments);
      if (data.selectedIds) setSelectedIds(data.selectedIds);
      if (data.selectedLabelIds) setSelectedLabelIds(data.selectedLabelIds);
      if (data.lockedThumbnails) setLockedThumbnails(data.lockedThumbnails);
      if (data.youtubeThumbnails) setYoutubeThumbnails(data.youtubeThumbnails);
      if (data.drawings) setDrawings(data.drawings);
      if (data.textLabels) setTextLabels(data.textLabels);
      if (data.labelPositions) setLabelPositions(data.labelPositions);
      
      setHistoryIndex(prev => prev - 1);
      
      console.log(`[Undo] Restored to: ${previousState.action}`);
    }
  };
  
  // Redo function
  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      
      // Check if nextState and its data exist
      if (!nextState || !nextState.data) {
        console.warn('[Redo] Invalid next state, skipping redo');
        return;
      }
      
      const { data } = nextState;
      
      // Restore state with fallbacks
      if (data.thumbnailPositions) setThumbnailPositions(data.thumbnailPositions);
      if (data.comments) setComments(data.comments);
      if (data.selectedIds) setSelectedIds(data.selectedIds);
      if (data.selectedLabelIds) setSelectedLabelIds(data.selectedLabelIds);
      if (data.lockedThumbnails) setLockedThumbnails(data.lockedThumbnails);
      if (data.youtubeThumbnails) setYoutubeThumbnails(data.youtubeThumbnails);
      if (data.drawings) setDrawings(data.drawings);
      if (data.textLabels) setTextLabels(data.textLabels);
      if (data.labelPositions) setLabelPositions(data.labelPositions);
      
      setHistoryIndex(prev => prev + 1);
      
      console.log(`[Redo] Restored to: ${nextState.action}`);
    }
  };
  
  // Update refs when state changes
  React.useEffect(() => {
    isDrawingModeRef.current = isDrawingMode;
  }, [isDrawingMode]);

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

  // Helper to update thumbnail event modes
  const updateAllThumbnailEventModes = (isDrawingMode) => {
    if (thumbnailContainersRef.current) {
      thumbnailContainersRef.current.forEach(container => {
        if (container.userData && container.userData.id) {
          updateThumbnailEventMode(container, isDrawingMode);
        }
      });
    }
  };

  // Helper to set drawing mode and update thumbnail event modes
  const setDrawingModeWithUpdate = (value) => {
    const newValue = typeof value === 'function' ? value(isDrawingModeRef.current) : value;
    setIsDrawingMode(newValue);
    updateAllThumbnailEventModes(newValue);
  };

  // Drawing mode toggle functionality
  const toggleDrawingMode = () => {
    setIsDrawingMode(prev => {
      const newDrawingMode = !prev;
      
      // Ensure mutual exclusivity with comment mode
      if (newDrawingMode && isAddingComment) {
        setIsAddingComment(false);
        setPendingCommentPos(null);
      }
      
      // Clear current drawing state when toggling off
      if (!newDrawingMode) {
        setCurrentDrawing(null);
        setIsDrawing(false);
        // Reset cursor
        if (appRef.current && appRef.current.canvas) {
          appRef.current.canvas.style.cursor = 'default';
        }
      } else {
        // Set drawing cursor based on eraser mode
        if (appRef.current && appRef.current.canvas) {
          appRef.current.canvas.style.cursor = drawingSettingsRef.current.isEraserMode ? 'cell' : 'crosshair';
        }
      }
      
      // Update all thumbnail event modes based on new drawing mode
      updateAllThumbnailEventModes(newDrawingMode);
      
      return newDrawingMode;
    });
  };

  // Clear all drawings functionality
  const clearAllDrawings = () => {
    if (drawings.length > 0) {
      // Save to history for undo
      saveToHistory('Clear All Drawings', { drawings: [] });
      setDrawings([]);
      
      // Clear temporary drawing
      if (tempDrawingGraphicsRef.current) {
        tempDrawingGraphicsRef.current.clear();
      }
    }
  };

  // Handle drawing settings changes from toolbar
  const handleDrawingSettingsChange = React.useCallback((settings) => {
    setDrawingSettings(settings);
    
    // Update cursor based on tool
    if (isDrawingMode && appRef.current && appRef.current.canvas) {
      appRef.current.canvas.style.cursor = settings.isEraserMode ? 'cell' : 'crosshair';
    }
  }, [isDrawingMode]);
  
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
      setViewportTransform({
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
        onViewportTransform: setViewportTransform,
        onAddComment: setPendingCommentPos,
        isAddingComment: () => isAddingCommentRef.current,
        isDrawingMode: () => isDrawingModeRef.current,
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
          setSelectedIds(new Set());
          // Clear label selection
          textLabelContainersRef.current.forEach(c => {
            c.selected = false;
            c.selectionOutline.visible = false;
            c.hoverBg.visible = false;
          });
          setSelectedLabelIds(new Set());
        },
        onCanvasClick: () => {
          // Close any open comment when clicking on canvas
          setEditingComment(null);
          // Close label edit dialog
          setEditingLabel(null);
        },
        onRectSelectionStart: (startPoint, modifierKeys) => {
          setIsRectSelecting(true);
          setSelectionRect(null);
        },
        onRectSelectionMove: (startPoint, currentPoint, modifierKeys) => {
          const rect = createRectFromPoints(startPoint, currentPoint);
          setSelectionRect(rect);
          
          // Draw selection rectangle
          if (selectionRectGraphics && viewport) {
            drawSelectionRect(selectionRectGraphics, rect, viewport);
          }
          
          // Update intersecting thumbnails with visual feedback
          throttledUpdateSelection(rect, modifierKeys);
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
            setSelectedIds(newSelectedIds);
            setSelectedLabelIds(newSelectedLabelIds);
            
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
            
            // Save to history if selection changed
            if (newSelectedIds.size !== selectedIds.size || 
                [...newSelectedIds].some(id => !selectedIds.has(id)) ||
                newSelectedLabelIds.size !== selectedLabelIds.size ||
                [...newSelectedLabelIds].some(id => !selectedLabelIds.has(id))) {
              saveToHistory('Rectangular Selection', { 
                selectedIds: newSelectedIds,
                selectedLabelIds: newSelectedLabelIds 
              });
            }
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
        onDrawingStart: (startPoint, originalEvent) => {
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
              const remainingDrawings = drawingsRef.current.filter(d => !toRemove.includes(d));
              setDrawings(remainingDrawings);
              saveToHistory('Erase Drawing', { drawings: remainingDrawings });
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
        onDrawingMove: (startPoint, currentPoint, originalEvent) => {
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
              const remainingDrawings = drawingsRef.current.filter(d => !toRemove.includes(d));
              setDrawings(remainingDrawings);
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
        onDrawingEnd: (startPoint, endPoint, originalEvent) => {
          // Handle eraser mode end
          if (drawingSettingsRef.current.isEraserMode) {
            // Eraser operations are already handled in move, just save final state to history
            saveToHistory('Erase Drawings', { drawings: drawingsRef.current });
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
            const updatedDrawings = [...drawings, drawingData];
            setDrawings(updatedDrawings);
            
            // Save to history for undo/redo
            saveToHistory('Add Drawing', { drawings: updatedDrawings });
            
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
          // Delete selected thumbnails and text labels
          if (e.key === 'Delete' || e.key === 'Backspace') {
            const hasSelectedThumbnails = thumbnailContainersRef.current.some(c => c.selected);
            const hasSelectedLabels = textLabelContainersRef.current.some(c => c.selected);
            
            if (hasSelectedThumbnails || hasSelectedLabels) {
              // Don't delete if editing a label
              if (editingLabel) return;
              
              let deletionAction = '';
              const historyData = {};
              
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
                const updatedThumbnails = youtubeThumbnails.filter(t => !deletedIds.includes(t.id));
                setYoutubeThumbnails(updatedThumbnails);
                setSelectedIds(new Set());
                historyData.youtubeThumbnails = updatedThumbnails;
                deletionAction = hasSelectedLabels ? 'Delete Thumbnails & Labels' : 'Delete Thumbnails';
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
                const updatedLabels = textLabels.filter(l => !deletedLabelIds.includes(l.id));
                setTextLabels(updatedLabels);
                setSelectedLabelIds(new Set());
                historyData.textLabels = updatedLabels;
                
                // Remove deleted labels from positions
                const updatedLabelPositions = { ...labelPositions };
                deletedLabelIds.forEach(id => delete updatedLabelPositions[id]);
                setLabelPositions(updatedLabelPositions);
                historyData.labelPositions = updatedLabelPositions;
                
                if (!hasSelectedThumbnails) {
                  deletionAction = 'Delete Labels';
                }
              }
              
              // Save to history
              if (deletionAction) {
                saveToHistory(deletionAction, historyData);
              }
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
            setSelectedIds(new Set(allIds));
            
            // Select all text labels
            textLabelContainersRef.current.forEach(c => {
              c.selected = true;
              c.selectionOutline.visible = true;
            });
            const allLabelIds = textLabelContainersRef.current.map(c => c.labelData.id);
            setSelectedLabelIds(new Set(allLabelIds));
          }
          
          // Deselect all
          if (e.key === 'Escape') {
            // Deselect thumbnails
            thumbnailContainersRef.current.forEach(c => {
              c.selected = false;
              c.selectionOutline.visible = false;
            });
            setSelectedIds(new Set());
            
            // Deselect text labels
            textLabelContainersRef.current.forEach(c => {
              c.selected = false;
              c.selectionOutline.visible = false;
              c.hoverBg.visible = false;
            });
            setSelectedLabelIds(new Set());
            
            // Exit special modes
            setIsAddingComment(false);
            setPendingCommentPos(null);
            setEditingComment(null);
            setEditingLabel(null);
          }
          
          // Comment mode shortcut
          if (e.key === 'c' && !e.metaKey && !e.ctrlKey) {
            setIsAddingComment(prev => {
              const newCommentMode = !prev;
              
              // Ensure mutual exclusivity with drawing mode
              if (newCommentMode && isDrawingModeRef.current) {
                setDrawingModeWithUpdate(false);
                setCurrentDrawing(null);
                setIsDrawing(false);
              }
              
              return newCommentMode;
            });
          }
          
          // Drawing mode shortcut
          if (e.key === 'p' && !e.metaKey && !e.ctrlKey) {
            toggleDrawingMode();
          }
          
          // Label mode shortcut
          if (e.key === 't' && !e.metaKey && !e.ctrlKey) {
            setIsAddingLabel(prev => {
              const newLabelMode = !prev;
              
              // Ensure mutual exclusivity with other modes
              if (newLabelMode) {
                if (isDrawingModeRef.current) {
                  setDrawingModeWithUpdate(false);
                  setCurrentDrawing(null);
                  setIsDrawing(false);
                }
                if (isAddingCommentRef.current) {
                  setIsAddingComment(false);
                  setPendingCommentPos(null);
                }
              }
              
              return newLabelMode;
            });
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
  }, [isMultiplayerEnabled]); // Re-run when multiplayer is toggled
  
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
          // Allow selection of all thumbnails (including locked ones)
          
          const event = e.originalEvent || e;
          if (event.shiftKey || event.metaKey) {
            // Multi-select
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
            // Single select
            thumbnailContainersRef.current.forEach(c => {
              c.selected = false;
              c.selectionOutline.visible = false;
              c.hoverOutline.visible = false;
            });
            selectedContainer.selected = true;
            setSelectedIds(new Set([selectedContainer.userData.id]));
          }
          
          // Update visuals
          selectedContainer.selectionOutline.visible = selectedContainer.selected;
          selectedContainer.hoverOutline.visible = false;
        },
        onDragStart: (dragContainer, e) => {
          // Allow dragging of all thumbnails (including locked ones)
          
          const selectedContainers = thumbnailContainersRef.current.filter(c => c.selected);
          if (dragContainer.selected) {
            const dragData = {
              containers: selectedContainers,
              startPositions: selectedContainers.map(c => ({ x: c.x, y: c.y })),
              mouseStart: viewport.toLocal(e.global),
            };
            
            // Bring to front
            selectedContainers.forEach(c => {
              viewport.removeChild(c);
              viewport.addChild(c);
            });
            
            app.canvas.style.cursor = 'move';
            
            return dragData;
          }
          return null;
        },
        onDragMove: (container, e, dragData) => {
          const currentMouse = viewport.toLocal(e.global);
          const dx = currentMouse.x - dragData.mouseStart.x;
          const dy = currentMouse.y - dragData.mouseStart.y;
          
          dragData.containers.forEach((c, i) => {
            c.x = dragData.startPositions[i].x + dx;
            c.y = dragData.startPositions[i].y + dy;
          });
          
          // Update grid position
          updateGridPosition(gridGraphicsRef.current, viewport, app);
        },
        onDragEnd: (container, dragData) => {
          // Save final positions
          const newPositions = {};
          dragData.containers.forEach(c => {
            newPositions[c.userData.id] = { x: c.x, y: c.y };
          });
          setThumbnailPositions(prev => {
            const updated = { ...prev, ...newPositions };
            
            // Save to history for undo/redo
            saveToHistory('Move Thumbnails', { thumbnailPositions: updated });
            
            return updated;
          });
          app.canvas.style.cursor = 'default';
        }
      });
      
      // Insert thumbnail before drawing containers to ensure drawings stay on top
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
  
  // Track existing drawing graphics to avoid re-rendering everything
  const drawingGraphicsMapRef = useRef(new Map()); // Map drawing ID to graphics object
  
  // Update drawings when they change - only add/remove changed drawings
  useEffect(() => {
    if (!drawingSystemRef.current) return;
    
    const drawingSystem = drawingSystemRef.current;
    const existingGraphics = drawingGraphicsMapRef.current;
    
    // Get current drawing IDs
    const currentDrawingIds = new Set(drawings.map(d => d.id));
    
    // Remove drawings that no longer exist
    for (const [drawingId, graphics] of existingGraphics.entries()) {
      if (!currentDrawingIds.has(drawingId)) {
        // Remove from container and destroy
        if (graphics.parent) {
          graphics.parent.removeChild(graphics);
        }
        graphics.destroy();
        existingGraphics.delete(drawingId);
      }
    }
    
    // Add new drawings that don't exist yet
    for (const drawing of drawings) {
      if (!existingGraphics.has(drawing.id)) {
        const graphics = createDrawingGraphics(drawing);
        
        // Render based on drawing type
        switch (drawing.type) {
          case 'freehand':
            renderFreehandStroke(graphics, drawing.points, drawing.style);
            break;
          case 'line':
            if (drawing.points.length >= 2) {
              renderLine(graphics, drawing.points[0], drawing.points[drawing.points.length - 1], drawing.style);
            }
            break;
          case 'rectangle':
            if (drawing.points.length >= 2) {
              renderRectangle(graphics, drawing.points[0], drawing.points[drawing.points.length - 1], drawing.style);
            }
            break;
          default:
            renderFreehandStroke(graphics, drawing.points, drawing.style);
        }
        
        // Add to appropriate layer
        addDrawingToLayer(drawingSystem, graphics, drawing.layer);
        
        // Track this graphics object
        existingGraphics.set(drawing.id, graphics);
      }
    }
    
    // Ensure temporary drawing graphics is still in the container
    if (tempDrawingGraphicsRef.current && 
        !drawingSystem.foregroundDrawingsContainer.children.includes(tempDrawingGraphicsRef.current)) {
      drawingSystem.foregroundDrawingsContainer.addChild(tempDrawingGraphicsRef.current);
    }
  }, [drawings]);
  
  // Update text labels when they change
  useEffect(() => {
    if (!appRef.current || !viewportRef.current) return;
    
    const viewport = viewportRef.current;
    const app = appRef.current;
    
    // Clear existing labels
    textLabelContainersRef.current.forEach(container => {
      viewport.removeChild(container);
    });
    textLabelContainersRef.current = [];
    
    // Create new labels
    for (const label of textLabels) {
      const container = createTextLabelContainer(label);
      
      // Use saved position if available
      const savedPos = labelPositions[label.id];
      container.x = savedPos ? savedPos.x : label.x;
      container.y = savedPos ? savedPos.y : label.y;
      
      // Setup interactions
      setupTextLabelInteractions(container, {
        onSelect: (selectedContainer, e) => {
          const event = e.originalEvent || e;
          if (event.shiftKey || event.metaKey) {
            // Multi-select
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
            // Single select
            textLabelContainersRef.current.forEach(c => {
              c.selected = false;
              c.selectionOutline.visible = false;
              c.hoverBg.visible = false;
            });
            selectedContainer.selected = true;
            setSelectedLabelIds(new Set([selectedContainer.labelData.id]));
          }
          
          // Update visuals
          selectedContainer.selectionOutline.visible = selectedContainer.selected;
          selectedContainer.hoverBg.visible = false;
        },
        onDragStart: (dragContainer, e) => {
          // If the container isn't selected yet, select it first
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
          
          // Bring to front
          selectedContainers.forEach(c => {
            viewport.removeChild(c);
            viewport.addChild(c);
          });
          
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
          // Save final positions
          const newPositions = {};
          dragData.containers.forEach(c => {
            newPositions[c.labelData.id] = { x: c.x, y: c.y };
          });
          setLabelPositions(prev => {
            const updated = { ...prev, ...newPositions };
            
            // Save to history for undo/redo
            saveToHistory('Move Labels', { labelPositions: updated });
            
            return updated;
          });
          app.canvas.style.cursor = 'default';
        },
        onDoubleClick: (container) => {
          setEditingLabel(container.labelData);
        }
      });
      
      // Add label to viewport
      viewport.addChild(container);
      textLabelContainersRef.current.push(container);
    }
  }, [textLabels]);
  
  const selectedThumbnails = thumbnails.filter(t => selectedIds.has(t.id));
  
  // Handle comment submission
  const handleCommentSubmit = (text) => {
    if (pendingCommentPos && text.trim()) {
      const newComment = {
        id: Date.now(),
        x: pendingCommentPos.x,
        y: pendingCommentPos.y,
        text: text,
        author: 'Current User',
        timestamp: new Date().toISOString(),
        resolved: false
      };
      const updatedComments = [...comments, newComment];
      setComments(updatedComments);
      
      // Save to history for undo/redo
      saveToHistory('Add Comment', { comments: updatedComments });
    }
    setPendingCommentPos(null);
  };
  
  // Handle label creation
  const handleLabelCreate = (pos) => {
    const newLabel = createLabelData('New Section', pos.x, pos.y, labelSettings);
    const updatedLabels = [...textLabels, newLabel];
    setTextLabels(updatedLabels);
    
    // Save to history
    saveToHistory('Add Label', { textLabels: updatedLabels });
    
    // Immediately edit the new label
    setEditingLabel(newLabel);
    setIsAddingLabel(false);
  };

  // Handle applying settings to selected labels
  const handleApplySettingsToSelected = (newSettings) => {
    if (selectedLabelIds.size === 0) return;

    // Update the label data
    const updatedLabels = textLabels.map(label => 
      selectedLabelIds.has(label.id) 
        ? { ...label, style: { ...label.style, ...newSettings } }
        : label
    );
    setTextLabels(updatedLabels);

    // Also update the visual containers immediately
    textLabelContainersRef.current.forEach(container => {
      if (selectedLabelIds.has(container.labelData.id)) {
        updateTextLabel(container, container.labelData.text, { ...container.labelData.style, ...newSettings });
      }
    });

    // Save to history
    saveToHistory('Update Label Style', { textLabels: updatedLabels });
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
      
      setComments(prevComments => 
        prevComments.map(c => 
          c.id === draggedComment ? { ...c, x: newX, y: newY } : c
        )
      );
    };

    const handleMouseUp = () => {
      if (draggedComment) {
        // Save to history for undo/redo after comment drag
        saveToHistory('Move Comment', { comments });
      }
      setDraggedComment(null);
      setDragOffset({ x: 0, y: 0 });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggedComment, dragOffset, viewportTransform]);

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
          setSelectedCritique(null);
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
  }, [selectedCritique]);

  return (
    <div className={`relative w-full h-screen overflow-hidden bg-neutral-5 ${draggedComment ? 'no-select' : ''}`}>
      <div 
        ref={containerRef} 
        className="absolute inset-0" 
        style={{ backgroundColor: '#f5f5f5' }}
      />
      
      {/* Remote Cursors Layer */}
      {isMultiplayerEnabled && (
        <RemoteCursors 
          cursors={remoteCursors} 
          viewportTransform={viewportTransform}
        />
      )}
      
      {/* Multiplayer Status Indicator */}
      <div className="absolute top-4 right-4 z-20">
        <MultiplayerStatus
          isConnected={isMultiplayerConnected}
          userCount={multiplayerUserCount}
          currentUser={currentMultiplayerUser}
          onToggle={toggleMultiplayer}
          isEnabled={isMultiplayerEnabled}
        />
      </div>
      
      {/* Welcome Sidebar Toggle Button - show only when sidebar is closed */}
      {!showWelcomeSidebar && (
        <button
          onClick={() => setShowWelcomeSidebar(true)}
          className="absolute top-4 left-4 z-10 bg-background-primary border border-border-divider rounded-lg p-2 hover:bg-background-secondary shadow-sm transition-colors"
          title="Open import sidebar"
        >
          <svg className="w-5 h-5 text-background-brand" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
          </svg>
        </button>
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
      

      
      {isAddingComment && (
        <CommentModeIndicator onClose={() => setIsAddingComment(false)} />
      )}
      
      {isDrawingMode && (
        <DrawingModeIndicator onClose={() => setDrawingModeWithUpdate(false)} />
      )}
      
      
      <UnifiedToolbar 
        // Comment props
        isAddingComment={isAddingComment}
        onToggleAddComment={() => setIsAddingComment(prev => {
          const newCommentMode = !prev;
          
          // Ensure mutual exclusivity with drawing mode
          if (newCommentMode && isDrawingModeRef.current) {
            setDrawingModeWithUpdate(false);
            setCurrentDrawing(null);
            setIsDrawing(false);
          }
          
          return newCommentMode;
        })}
        commentCount={comments.length}
        
        // Drawing props
        isDrawingMode={isDrawingMode}
        onToggleDrawingMode={toggleDrawingMode}
        drawingCount={drawings.length}
        onClearAllDrawings={clearAllDrawings}
        onDrawingSettingsChange={handleDrawingSettingsChange}
        
        // Label props
        isAddingLabel={isAddingLabel}
        onToggleAddLabel={() => setIsAddingLabel(prev => {
          const newLabelMode = !prev;
          
          // Ensure mutual exclusivity with other modes
          if (newLabelMode) {
            if (isDrawingModeRef.current) {
              setDrawingModeWithUpdate(false);
              setCurrentDrawing(null);
              setIsDrawing(false);
            }
            if (isAddingCommentRef.current) {
              setIsAddingComment(false);
              setPendingCommentPos(null);
            }
          }
          
          return newLabelMode;
        })}
        labelCount={textLabels.length}
        onLabelSettingsChange={setLabelSettings}
        currentSettings={labelSettings}
        selectedLabelIds={selectedLabelIds}
        onApplySettingsToSelected={handleApplySettingsToSelected}
      />
      
      {/* Undo/Redo Controls */}
      {hasImportedBefore && (
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            className="bg-background-primary border border-border-divider rounded-md p-2 hover:bg-background-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title={`Undo${history[historyIndex] ? ` (${history[historyIndex].action})` : ''}`}
          >
            <svg className="w-4 h-4 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="bg-background-primary border border-border-divider rounded-md p-2 hover:bg-background-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title={`Redo${history[historyIndex + 1] ? ` (${history[historyIndex + 1].action})` : ''}`}
          >
            <svg className="w-4 h-4 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
            </svg>
          </button>
        </div>
      )}
      
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
            onInfoClick={() => setShowAnalytics(true)}
            onCritiqueClick={() => {
              setSelectedCritique(thumb);
              setShowAnalytics(false); // Close analytics if open
            }}
            onToggleVisibility={() => {
              setLockedThumbnails(prev => {
                const newSet = new Set(prev);
                const wasLocked = newSet.has(thumb.id);
                if (wasLocked) {
                  newSet.delete(thumb.id);
                } else {
                  newSet.add(thumb.id);
                }
                
                // Save to history for undo/redo
                saveToHistory(wasLocked ? 'Restore Thumbnail Visibility' : 'Reduce Thumbnail Visibility', { 
                  lockedThumbnails: newSet 
                });
                
                return newSet;
              });
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
            setDraggedComment(comment.id);
            setDragOffset({
              x: 16 * Math.min(1, 1 / viewportTransform.scale),
              y: 16 * Math.min(1, 1 / viewportTransform.scale)
            });
          }}
          onEditClick={() => setEditingComment(comment.id)}
          onResolveToggle={() => {
            const updatedComments = comments.map(c => 
              c.id === comment.id ? { ...c, resolved: !c.resolved } : c
            );
            setComments(updatedComments);
            
            // Save to history for undo/redo
            saveToHistory(comment.resolved ? 'Unresolve Comment' : 'Resolve Comment', { 
              comments: updatedComments 
            });
          }}
          onDelete={() => {
            const updatedComments = comments.filter(c => c.id !== comment.id);
            setComments(updatedComments);
            
            // Save to history for undo/redo
            saveToHistory('Delete Comment', { comments: updatedComments });
          }}
          onClose={() => setEditingComment(null)}
        />
      ))}
      
      {/* Comment input dialog */}
      {pendingCommentPos && (
        <CommentDialog
          position={pendingCommentPos}
          viewportTransform={viewportTransform}
          onSubmit={handleCommentSubmit}
          onCancel={() => setPendingCommentPos(null)}
        />
      )}
      
      
      {selectedThumbnails.length === 1 && (
        <SidebarAnalytics 
          thumbnail={selectedThumbnails[0]} 
          onClose={() => setShowAnalytics(false)}
          isOpen={showAnalytics}
        />
      )}

      <SidebarArtDirector
        thumbnail={selectedCritique}
        onClose={() => setSelectedCritique(null)}
        isOpen={!!selectedCritique}
      />
      
      {selectedThumbnails.length > 1 && (
        <SelectionIndicator count={selectedThumbnails.length} />
      )}
      
      {/* Welcome Sidebar */}
      <WelcomeSidebar 
        isOpen={showWelcomeSidebar}
        onClose={() => {
          setShowWelcomeSidebar(false);
          // Mark that user has seen welcome
          try {
            localStorage.setItem('hasSeenWelcome', 'true');
            setHasSeenWelcome(true);
          } catch (error) {
            console.warn('Could not save welcome status to localStorage:', error);
          }
        }}
        onVideosImported={(videos, channelInfo) => {
          console.log('[WelcomeSidebar] Videos imported:', videos);
          console.log('[WelcomeSidebar] Number of videos imported:', videos.length);
          
          if (videos.length > 0) {
            console.log('[WelcomeSidebar] First video details:', {
              id: videos[0].id,
              title: videos[0].title,
              thumbnail: videos[0].thumbnail,
              thumbnails: videos[0].thumbnails
            });
          }
          
          // Arrange videos in a grid with proper spacing
          const arrangedVideos = videos.map((video, index) => {
            const col = index % 5;
            const row = Math.floor(index / 5);
            const arrangedVideo = {
              ...video,
              x: 100 + col * 380,
              y: 100 + row * 300
            };
            console.log(`[WelcomeSidebar] Arranged video ${index}:`, {
              id: arrangedVideo.id,
              title: arrangedVideo.title,
              thumbnail: arrangedVideo.thumbnail,
              position: { x: arrangedVideo.x, y: arrangedVideo.y }
            });
            return arrangedVideo;
          });
          
          console.log('[WelcomeSidebar] Setting YouTube thumbnails:', arrangedVideos);
          setYoutubeThumbnails(arrangedVideos);
          
          // Save initial import to history
          saveToHistory('Import Videos from Welcome', { youtubeThumbnails: arrangedVideos });
          
          // Mark that user has imported videos for future visits
          try {
            localStorage.setItem('hasImportedVideos', 'true');
            setHasImportedBefore(true);
          } catch (error) {
            console.warn('Could not save import status to localStorage:', error);
          }
        }}
        onCreateChannelHeader={(channelName) => {
          // Create a section header above the imported videos
          const headerLabel = createLabelData(
            channelName,
            100, // Same X as first video
            -20, // Much higher above the first row of videos (videos start at y:100, giving 120px space)
            {
              ...labelSettings,
              size: 'XL' // Use extra large for channel headers
            }
          );
          
          const updatedLabels = [...textLabels, headerLabel];
          setTextLabels(updatedLabels);
          
          // Save to history
          saveToHistory('Add Channel Header from Welcome', { textLabels: updatedLabels });
        }}
      />

      {/* YouTube Importer Modal */}
      {showYouTubeImporter && (
        <YouTubeImporter
          onClose={() => setShowYouTubeImporter(false)}
          onVideosImported={(videos, channelInfo) => {
            console.log('[FigmaStyleCanvas] Videos imported from YouTube:', videos);
            console.log('[FigmaStyleCanvas] Number of videos imported:', videos.length);
            
            if (videos.length > 0) {
              console.log('[FigmaStyleCanvas] First video details:', {
                id: videos[0].id,
                title: videos[0].title,
                thumbnail: videos[0].thumbnail,
                thumbnails: videos[0].thumbnails
              });
            }
            
            // Arrange videos in a grid with proper spacing
            const arrangedVideos = videos.map((video, index) => {
              const col = index % 5;
              const row = Math.floor(index / 5);
              const arrangedVideo = {
                ...video,
                x: 100 + col * 380,
                y: 100 + row * 300
              };
              console.log(`[FigmaStyleCanvas] Arranged video ${index}:`, {
                id: arrangedVideo.id,
                title: arrangedVideo.title,
                thumbnail: arrangedVideo.thumbnail,
                position: { x: arrangedVideo.x, y: arrangedVideo.y }
              });
              return arrangedVideo;
            });
            
            console.log('[FigmaStyleCanvas] Setting YouTube thumbnails:', arrangedVideos);
            setYoutubeThumbnails(arrangedVideos);
            
            // Save initial import to history
            saveToHistory('Import Videos', { youtubeThumbnails: arrangedVideos });
            
            // Mark that user has imported videos for future visits
            try {
              localStorage.setItem('hasImportedVideos', 'true');
              setHasImportedBefore(true);
            } catch (error) {
              console.warn('Could not save import status to localStorage:', error);
            }
            
            setShowYouTubeImporter(false);
          }}
          onCreateChannelHeader={(channelName) => {
            // Create a section header above the imported videos
            const headerLabel = createLabelData(
              channelName,
              100, // Same X as first video
              -20, // Much higher above the first row of videos (videos start at y:100, giving 120px space)
              {
                ...labelSettings,
                size: 'XL' // Use extra large for channel headers
              }
            );
            
            const updatedLabels = [...textLabels, headerLabel];
            setTextLabels(updatedLabels);
            
            // Save to history
            saveToHistory('Add Channel Header', { textLabels: updatedLabels });
          }}
        />
      )}
    </div>
  );
};

export default FigmaStyleCanvasRefactored;