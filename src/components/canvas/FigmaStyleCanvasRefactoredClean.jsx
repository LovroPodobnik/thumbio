import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';

// Import refactored components and hooks
import CanvasOverlays from './CanvasOverlays';
import SidebarAnalytics from './SidebarAnalytics';
import SidebarArtDirector from './SidebarArtDirector';
import TopToolbar from './TopToolbar';
import ToolSettingsPanel from './ToolSettingsPanel';
import MainSidebar from './MainSidebar';
import ContentImportSidebar from './ContentImportSidebar';
import YouTubeImporter from './YouTubeImporter';
import CanvasViewportControlsRefactored from './CanvasViewportControlsRefactored';
import { ThumbnailCountSelector } from './ThumbnailCountSelector';
import SelectionIndicator from './SelectionIndicator';
import { drawSelectionRect } from './SelectionRectangle';
import { updateTextLabel, DEFAULT_LABEL_STYLE } from './TextLabelRenderer';
import { smoothPath, renderFreehandStroke, createDrawingData } from './DrawingRenderer';

// Import custom hooks
import { useCanvasToolsIntegrated } from '../../hooks/useCanvasToolsIntegrated';
import { usePixiRenderer } from '../../hooks/usePixiRenderer';
import { useMultiplayerConnection } from '../../hooks/useMultiplayerConnection';
import { usePixiAppInitialization } from '../../hooks/usePixiAppInitialization';
import useZoomControls from '../../hooks/useZoomControls';
import useKeyboardShortcuts from '../../hooks/useKeyboardShortcuts';
import useViewportCulling from '../../hooks/useViewportCulling';
import useCanvasEventHandlers from '../../hooks/useCanvasEventHandlers';
import useHistory from '../../hooks/useHistory';
import { useCanvasInteractions } from '../../hooks/useCanvasInteractions';

// Import state management
import { CanvasStateProvider, useCanvasState } from '../../state/canvasState';
import { useCanvasActions, useSelectionActions, useUIActions, useHistoryActions } from '../../hooks/useCanvasActions';

// Import utilities
import { calculateDragPosition } from '../../utils/canvasUtils';
import { updateThumbnailEventMode } from './ThumbnailRenderer';

const FigmaStyleCanvasInternal = () => {
  // Get state and actions from context
  const state = useCanvasState();
  const canvasActions = useCanvasActions();
  const selectionActions = useSelectionActions();
  const uiActions = useUIActions();
  const historyActions = useHistoryActions();
  
  // Refs
  const containerRef = useRef();
  const drawingSettingsRef = useRef();
  const drawingsRef = useRef([]);
  const labelSettingsRef = useRef(DEFAULT_LABEL_STYLE);
  const isDrawingModeRef = useRef(false);
  const currentDrawingRef = useRef(null);
  const isSpacePanningRef = useRef(false);
  const lastCursorPositionRef = useRef({ x: 0, y: 0 });
  const isHandToolModeRef = useRef(false);
  
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
      showAnalytics,
      selectedCritique,
      draggedComment,
      dragOffset,
      sidebarOpen,
      sidebarWidth,
      showContentImportSidebar,
      showYouTubeImporter,
      editingLabel
    },
    tools: {
      drawing: drawingSettings,
      label: labelSettings
    }
  } = state;
  
  // Multiplayer state (not migrated to global state yet)
  const [isMultiplayerEnabled, setIsMultiplayerEnabled] = useState(false);
  const [, setIsRectSelecting] = useState(false);
  const [currentDrawing, setCurrentDrawing] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [, setHasImportedBefore] = useState(() => {
    try {
      return localStorage.getItem('hasImportedVideos') === 'true';
    } catch {
      return false;
    }
  });

  // Initialize multiplayer connection
  const {
    isConnected: isMultiplayerConnected,
    remoteCursors,
    userCount: multiplayerUserCount,
    currentUser: currentMultiplayerUser,
    setupCursorTracking
  } = useMultiplayerConnection(isMultiplayerEnabled);

  // Helper to update thumbnail event modes
  const updateAllThumbnailEventModes = useCallback((shouldDisable) => {
    if (thumbnailContainersRef.current) {
      thumbnailContainersRef.current.forEach(container => {
        if (container.userData && container.userData.id) {
          updateThumbnailEventMode(container, shouldDisable);
        }
      });
    }
  }, []);

  // History actions from context
  const { undo, redo } = historyActions;

  // Only show YouTube thumbnails
  const thumbnails = useMemo(() => youtubeThumbnails, [youtubeThumbnails]);

  // Create refs for dynamic control callbacks that will be updated after tools initialization
  const controlCallbacksRef = useRef({
    isAddingComment: () => false,
    isDrawingMode: () => false,
    isHandToolMode: () => false,
    isSelectionAllowed: () => false,
    isAddingLabel: () => false,
    areThumbnailsInteractive: () => false, // Will be updated with real function
    onAddLabel: () => {},
    onSpacePanStart: () => {},
    onSpacePanEnd: () => {},
    onClearSelection: () => {},
    onCanvasClick: () => {},
    onRectSelectionStart: () => {},
    onRectSelectionMove: () => {},
    onRectSelectionEnd: () => {},
    onDrawingStart: () => {},
    onDrawingMove: () => {},
    onDrawingEnd: () => {},
    onKeyDown: () => {}
  });

  // Create controls config that uses refs for dynamic callbacks
  const controlsConfig = useMemo(() => ({
    onViewportTransform: uiActions.setViewportTransform,
    onAddComment: uiActions.setPendingComment,
    isAddingComment: () => controlCallbacksRef.current.isAddingComment(),
    isDrawingMode: () => controlCallbacksRef.current.isDrawingMode(),
    isHandToolMode: () => controlCallbacksRef.current.isHandToolMode(),
    isSelectionAllowed: () => controlCallbacksRef.current.isSelectionAllowed(),
    isAddingLabel: () => controlCallbacksRef.current.isAddingLabel(),
    onAddLabel: (pos) => controlCallbacksRef.current.onAddLabel(pos),
    onSpacePanStart: () => controlCallbacksRef.current.onSpacePanStart(),
    onSpacePanEnd: () => controlCallbacksRef.current.onSpacePanEnd(),
    onClearSelection: () => controlCallbacksRef.current.onClearSelection(),
    onCanvasClick: () => controlCallbacksRef.current.onCanvasClick(),
    onRectSelectionStart: (startPoint, modifierKeys) => controlCallbacksRef.current.onRectSelectionStart(startPoint, modifierKeys),
    onRectSelectionMove: (startPoint, currentPoint, modifierKeys) => controlCallbacksRef.current.onRectSelectionMove(startPoint, currentPoint, modifierKeys),
    onRectSelectionEnd: (startPoint, endPoint, modifierKeys) => controlCallbacksRef.current.onRectSelectionEnd(startPoint, endPoint, modifierKeys),
    onDrawingStart: (startPoint) => controlCallbacksRef.current.onDrawingStart(startPoint),
    onDrawingMove: (startPoint, currentPoint) => controlCallbacksRef.current.onDrawingMove(startPoint, currentPoint),
    onDrawingEnd: () => controlCallbacksRef.current.onDrawingEnd(),
    onKeyDown: (e) => controlCallbacksRef.current.onKeyDown(e)
  }), [uiActions]);

  // Initialize PixiJS app and get refs
  const {
    appRef,
    viewportRef,
    gridGraphicsRef,
    selectionRectGraphicsRef,
    drawingSystemRef,
    tempDrawingGraphicsRef
  } = usePixiAppInitialization(
    containerRef,
    uiActions.setViewportTransform,
    controlsConfig,
    setupCursorTracking
  );

  // Zoom controls are now initialized through useCanvasToolsIntegrated

  // Create refs for tool states
  const isAddingCommentRef = useRef(false);
  const isAddingLabelRef = useRef(false);

  // Initialize PixiJS thumbnail and label rendering
  const { thumbnailContainersRef, textLabelContainersRef } = usePixiRenderer(
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
      areThumbnailsInteractive: () => controlCallbacksRef.current.areThumbnailsInteractive(),
    }
  );

  // Initialize canvas tools (must be after PixiJS initialization to have access to refs)
  const canvasTools = useCanvasToolsIntegrated({
    appRef,
    viewportRef,
    viewportTransform,
    setViewportTransform: uiActions.setViewportTransform,
    gridGraphicsRef,
    updateAllThumbnailEventModes,
    historyActions: { undo, redo },
    setIsSelecting: setIsRectSelecting,
    setSelectionStart: () => {},
    setSelectionEnd: () => {},
  });

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
    zoomLevel,
  } = canvasTools;

  // Initialize canvas event handlers for selection and other interactions
  const canvasEventHandlers = useCanvasEventHandlers({
    // State references
    viewportRef,
    thumbnailContainersRef,
    textLabelContainersRef,
    selectionRectGraphicsRef,
    
    // Current state values
    selectedIds,
    selectedLabelIds,
    
    // State setters
    setSelectedIds: selectionActions.setSelection,
    setSelectedLabelIds: selectionActions.setLabelSelection,
    setIsRectSelecting,
    setSelectionRect: (rect) => {
      // Update selection rect state
      if (selectionRectGraphicsRef.current && viewportRef.current) {
        if (rect) {
          drawSelectionRect(selectionRectGraphicsRef.current, rect, viewportRef.current);
        } else {
          selectionRectGraphicsRef.current.clear();
        }
      }
    },
    setPendingCommentPos: uiActions.setPendingComment,
    setEditingComment: uiActions.setEditingComment,
    setEditingLabel: uiActions.setEditingLabel,
    
    // Drawing state - not used but required by the hook
    setCurrentDrawing: () => {},
    setIsDrawing: () => {},
    onDrawingStart: () => {},
    onDrawingMove: () => {},
    onDrawingEnd: () => {},
    
    // History functions
    saveToHistory: () => {},
    undo,
    redo,
    
    // Label creation
    handleLabelCreate: () => {},
    
    // Tool state checkers
    isDrawingModeRef,
    isAddingCommentRef,
    isAddingLabelRef,
    
    // Other handlers
    updateAllThumbnailEventModes,
    toggleDrawingMode: toolActions.toggleDrawingMode,
    toggleHandTool: toolActions.selectHandTool,
    handleZoomIn: zoomActions.zoomIn,
    handleZoomOut: zoomActions.zoomOut,
    handleZoomToFit: zoomActions.zoomToFit
  });

  // Handle label creation (defined after tools to access isAddingLabel and toolActions)
  const handleLabelCreate = useCallback((pos) => {
    console.log('📝 Creating new label at position:', pos);
    const newLabel = canvasActions.addLabel('New Section', pos, labelSettings);
    console.log('✅ Label created:', newLabel);
    uiActions.setEditingLabel(newLabel);
    // Select the newly created label
    selectionActions.setLabelSelection([newLabel.id]);
    // Switch back to selection tool after creating label
    toolActions.selectSelectionTool();
  }, [canvasActions, labelSettings, uiActions, toolActions, selectionActions]);

  // Create save to history function
  const saveToHistory = useCallback((action, data) => {
    // TODO: Implement history saving
    console.log('History save:', action, data);
  }, []);

  // Initialize multiplayerManager (needed for canvas interactions)
  const multiplayerManager = useMemo(() => ({
    isConnected: isMultiplayerConnected,
    sendCursor: (x, y) => {
      // TODO: Implement cursor sharing
    },
    sendCursorLeave: () => {
      // TODO: Implement cursor leave
    }
  }), [isMultiplayerConnected]);

  // Initialize canvas interactions hook (includes drawing handlers)
  // TODO: This is redundant with controlsConfig in usePixiAppInitialization - investigate removal
  /*
  useCanvasInteractions(
    appRef,
    viewportRef,
    gridGraphicsRef,
    selectionRectGraphicsRef,
    tempDrawingGraphicsRef,
    {
      // Multiplayer
      isMultiplayerEnabled,
      multiplayerManager,
      lastCursorPositionRef,
      
      // Viewport
      setViewportTransform: uiActions.setViewportTransform,
      
      // Comments
      setPendingCommentPos: uiActions.setPendingComment,
      isAddingCommentRef,
      
      // Drawing
      isDrawingModeRef,
      drawingSettingsRef,
      drawingsRef,
      setCurrentDrawing,
      currentDrawingRef,
      setDrawings: canvasActions.setDrawings,
      setIsDrawing,
      
      // Tools
      isHandToolModeRef,
      canvasTools,
      isAddingLabelRef,
      handleLabelCreate,
      isSpacePanningRef,
      
      // Selections
      thumbnailContainersRef,
      textLabelContainersRef,
      throttledUpdateSelection: () => {},
      saveToHistory,
      
      // State
      youtubeThumbnails,
      textLabels,
      labelPositions,
      toolActions,
      handleZoomIn: zoomActions.zoomIn,
      handleZoomOut: zoomActions.zoomOut,
      handleZoomToFit: zoomActions.zoomToFit,
      undo,
      redo,
      thumbnails,
      selectedIds,
      setSelectedIds: selectionActions.setSelection,
      selectedLabelIds,
      setSelectedLabelIds: selectionActions.setLabelSelection,
      setEditingComment: uiActions.setEditingComment,
      setEditingLabel: uiActions.setEditingLabel,
      setIsRectSelecting,
      setSelectionRect: () => {},
      setYoutubeThumbnails: (thumbnails) => {
        // Use importThumbnails to replace all thumbnails
        canvasActions.importThumbnails(thumbnails);
      },
      setTextLabels: (labels) => {
        // For now, we'll need to handle this differently since there's no setTextLabels
        console.log('setTextLabels not implemented:', labels);
      },
      setLabelPositions: canvasActions.updateLabelPositions,
      editingLabel,
      drawings,
      lockedThumbnails,
      isAddingComment
    }
  );
  */

  // Get drawing handlers from the interactions
  const drawingHandlers = useMemo(() => {
    if (!appRef.current || !viewportRef.current || !tempDrawingGraphicsRef.current) {
      return {
        onDrawingStart: () => {},
        onDrawingMove: () => {},
        onDrawingEnd: () => {}
      };
    }

    return {
      onDrawingStart: (startPoint) => {
        // Validate parameters
        if (!startPoint || typeof startPoint.x === 'undefined' || typeof startPoint.y === 'undefined') {
          console.warn('Invalid startPoint in onDrawingStart:', startPoint);
          return;
        }
        
        if (drawingSettingsRef.current.isEraserMode) {
          const eraserRadius = drawingSettingsRef.current.brushSize * 1.5;
          const toRemove = drawingsRef.current.filter(d => 
            d.points && d.points.some(p => p && startPoint && Math.hypot(p.x - startPoint.x, p.y - startPoint.y) <= eraserRadius)
          );
          if (toRemove.length > 0) {
            const remaining = drawingsRef.current.filter(d => !toRemove.includes(d));
            canvasActions.setDrawings(remaining);
            saveToHistory('Erase Drawing', { drawings: remaining });
          }
          return;
        }
        setIsDrawing(true);
        const style = { 
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
          style 
        };
        setCurrentDrawing(newDrawing);
        currentDrawingRef.current = newDrawing;
      },
      onDrawingMove: (startPoint, currentPoint) => {
        if (!tempDrawingGraphicsRef.current) return;
        
        // Validate parameters
        if (!currentPoint || typeof currentPoint.x === 'undefined' || typeof currentPoint.y === 'undefined') {
          console.warn('Invalid currentPoint in onDrawingMove:', currentPoint);
          return;
        }
        
        if (drawingSettingsRef.current.isEraserMode) {
          const eraserRadius = drawingSettingsRef.current.brushSize * 1.5;
          const toRemove = drawingsRef.current.filter(d => 
            d.points && d.points.some(p => p && currentPoint && Math.hypot(p.x - currentPoint.x, p.y - currentPoint.y) <= eraserRadius)
          );
          if (toRemove.length > 0) {
            canvasActions.setDrawings(drawingsRef.current.filter(d => !toRemove.includes(d)));
          }
          return;
        }
        
        if (currentDrawingRef.current) {
          // Ensure we have a valid drawing structure with points
          if (!currentDrawingRef.current.points || currentDrawingRef.current.points.length === 0) {
            // Initialize with the current point if points array is empty
            currentDrawingRef.current.points = [currentPoint];
            return;
          }
          
          const lastPoint = currentDrawingRef.current.points.slice(-1)[0];
          
          // Safety check - ensure we have a valid last point
          if (!lastPoint || !currentPoint) {
            return;
          }
          
          const viewportScale = viewportRef.current ? viewportRef.current.scale.x : 1;
          const minDistance = Math.max(1, 3 / viewportScale);
          
          if (Math.hypot(currentPoint.x - lastPoint.x, currentPoint.y - lastPoint.y) >= minDistance) {
            const style = { 
              color: parseInt(drawingSettingsRef.current.brushColor.replace('#', '0x')), 
              width: drawingSettingsRef.current.brushSize, 
              alpha: 1.0 
            };
            const updatedDrawing = { 
              ...currentDrawingRef.current, 
              currentPoint, 
              points: [...currentDrawingRef.current.points, currentPoint], 
              style 
            };
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
          saveToHistory('Erase Drawings', { drawings: drawingsRef.current });
          return;
        }
        
        if (currentDrawingRef.current && currentDrawingRef.current.points.length > 1) {
          const finalPoints = smoothPath(currentDrawingRef.current.points, 2);
          const style = { 
            color: parseInt(drawingSettingsRef.current.brushColor.replace('#', '0x')), 
            width: drawingSettingsRef.current.brushSize, 
            alpha: 1.0 
          };
          const drawingData = createDrawingData(
            currentDrawingRef.current.type, 
            finalPoints, 
            style, 
            currentDrawingRef.current.layer
          );
          const updatedDrawings = [...drawingsRef.current, drawingData];
          canvasActions.setDrawings(updatedDrawings);
          saveToHistory('Add Drawing', { drawings: updatedDrawings });
          
          if (tempDrawingGraphicsRef.current) {
            tempDrawingGraphicsRef.current.clear();
          }
        }
        setCurrentDrawing(null);
        currentDrawingRef.current = null;
        setIsDrawing(false);
      }
    };
  }, [canvasActions, saveToHistory, setIsDrawing, setCurrentDrawing]);

  // Update control callbacks ref with the actual tool states and handlers
  // Only include dependencies that affect the callback implementations
  useEffect(() => {
    controlCallbacksRef.current = {
      isAddingComment: () => isAddingComment,
      isDrawingMode: () => isDrawingMode,
      isHandToolMode: () => isHandToolMode,
      isSelectionAllowed: () => canvasTools.toolBehavior?.canSelect,
      isAddingLabel: () => isAddingLabel,
      areThumbnailsInteractive: canvasTools.areThumbnailsInteractive,
      onAddLabel: (pos) => handleLabelCreate(pos),
      onSpacePanStart: () => {},
      onSpacePanEnd: () => {},
      onClearSelection: () => {
        thumbnailContainersRef.current.forEach(c => {
          c.selected = false;
          c.selectionOutline.visible = false;
          c.hoverOutline.visible = false;
        });
        selectionActions.clearSelection();
        textLabelContainersRef.current.forEach(c => {
          c.selected = false;
          c.selectionOutline.visible = false;
          c.hoverBg.visible = false;
        });
      },
      onCanvasClick: () => {
        uiActions.setEditingComment(null);
        // Don't clear editing label if a label is selected
        if (selectedLabelIds.size === 0) {
          uiActions.setEditingLabel(null);
        }
      },
      onRectSelectionStart: (startPoint, modifierKeys) => canvasEventHandlers.onRectSelectionStart(startPoint, modifierKeys),
      onRectSelectionMove: (startPoint, currentPoint, modifierKeys) => canvasEventHandlers.onRectSelectionMove(startPoint, currentPoint, modifierKeys),
      onRectSelectionEnd: (startPoint, endPoint, modifierKeys) => canvasEventHandlers.onRectSelectionEnd(startPoint, endPoint, modifierKeys),
      onDrawingStart: drawingHandlers.onDrawingStart,
      onDrawingMove: drawingHandlers.onDrawingMove,
      onDrawingEnd: drawingHandlers.onDrawingEnd,
      onKeyDown: () => {}
    };
  }, [isAddingComment, isDrawingMode, isHandToolMode, isAddingLabel, 
      canvasTools.toolBehavior, canvasTools.areThumbnailsInteractive,
      handleLabelCreate, selectionActions, uiActions, canvasEventHandlers, 
      drawingHandlers, selectedLabelIds, thumbnailContainersRef, textLabelContainersRef]);

  // Update refs when state changes
  useEffect(() => {
    drawingSettingsRef.current = drawingSettings;
  }, [drawingSettings]);

  // Update isDrawingModeRef when tools state changes
  useEffect(() => {
    isDrawingModeRef.current = isDrawingMode;
  }, [isDrawingMode]);

  // Update isHandToolModeRef when tools state changes
  useEffect(() => {
    isHandToolModeRef.current = isHandToolMode;
  }, [isHandToolMode]);

  // Update tool state refs
  useEffect(() => {
    isAddingCommentRef.current = isAddingComment;
  }, [isAddingComment]);
  
  useEffect(() => {
    isAddingLabelRef.current = isAddingLabel;
  }, [isAddingLabel]);

  useEffect(() => {
    drawingsRef.current = drawings;
  }, [drawings]);

  useEffect(() => {
    labelSettingsRef.current = labelSettings;
  }, [labelSettings]);

  // Sidebar handlers
  const handleSidebarToggle = useCallback(() => {
    const newOpen = !sidebarOpen;
    uiActions.setSidebarState(newOpen);
    try {
      localStorage.setItem('sidebarOpen', String(newOpen));
    } catch (error) {
      console.warn('Failed to save sidebar state to localStorage:', error);
    }
  }, [sidebarOpen, uiActions]);

  const handleSidebarWidthChange = useCallback((newWidth) => {
    uiActions.setSidebarWidth(newWidth);
    try {
      localStorage.setItem('sidebarWidth', String(newWidth));
    } catch (error) {
      console.warn('Failed to save sidebar width to localStorage:', error);
    }
  }, [uiActions]);

  // Clear all drawings functionality
  const clearAllDrawings = useCallback(() => {
    if (drawings.length > 0) {
      canvasActions.clearAllDrawings();
      if (tempDrawingGraphicsRef.current) {
        tempDrawingGraphicsRef.current.clear();
      }
    }
  }, [drawings.length, canvasActions, tempDrawingGraphicsRef]);

  // Handle drawing settings changes from toolbar
  const handleDrawingSettingsChange = useCallback((settings) => {
    canvasActions.updateDrawingSettings(settings);
    
    // Update cursor based on tool
    if (isDrawingMode && appRef.current && appRef.current.canvas) {
      appRef.current.canvas.style.cursor = settings.isEraserMode ? 'cell' : 'crosshair';
    }
  }, [isDrawingMode, canvasActions, appRef]);

  // Handle comment submission
  const handleCommentSubmit = useCallback((text) => {
    if (pendingCommentPos && text.trim()) {
      canvasActions.addComment(pendingCommentPos, text);
    }
    uiActions.setPendingComment(null);
  }, [pendingCommentPos, canvasActions, uiActions]);

  // Handle channel header creation (shared between YouTube components)
  const handleCreateChannelHeader = useCallback((channelName) => {
    console.log('🏢 Creating channel header for:', channelName);
    const toRemove = textLabels.filter(label => label.metadata?.type === 'channelHeader').map(l => l.id);
    if (toRemove.length > 0) {
      console.log('🗑️ Removing existing channel headers:', toRemove);
      canvasActions.deleteLabels(toRemove);
    }
    const channelHeader = canvasActions.addLabel(channelName, { x: 100, y: -20 }, { ...labelSettings, size: 'XL' }, { type: 'channelHeader' });
    console.log('✅ Channel header created:', channelHeader);
  }, [textLabels, canvasActions, labelSettings]);

  // Handle applying settings to selected labels
  const handleApplySettingsToSelected = useCallback((newSettings) => {
    if (selectedLabelIds.size === 0) return;

    const selectedIds = Array.from(selectedLabelIds);
    selectedIds.forEach(id => {
      canvasActions.updateLabel(id, { style: newSettings });
    });

    textLabelContainersRef.current.forEach(container => {
      if (selectedLabelIds.has(container.labelData.id)) {
        updateTextLabel(container, container.labelData.text, { ...container.labelData.style, ...newSettings });
      }
    });
  }, [selectedLabelIds, canvasActions]);

  // Handle global mouse events for comment dragging
  useEffect(() => {
    if (!draggedComment) return;

    const handleMouseMove = (e) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const newPos = calculateDragPosition(e.clientX, e.clientY, rect, dragOffset, viewportTransform);
      canvasActions.updateComment(draggedComment, newPos);
    };

    const handleMouseUp = () => {
      uiActions.setDraggedComment(null, { x: 0, y: 0 });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggedComment, dragOffset, viewportTransform, canvasActions, uiActions]);

  // Handle click outside for AI Art-Director sidebar
  useEffect(() => {
    if (!selectedCritique) return;

    const handleClickOutside = (event) => {
      const sidebar = document.querySelector('.sidebar-art-director');
      if (sidebar && !sidebar.contains(event.target)) {
        const isActionButton = event.target.closest('.thumbnail-actions-button');
        if (!isActionButton) {
          uiActions.setSelectedCritique(null);
        }
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedCritique, uiActions]);

  // Toggle multiplayer
  const toggleMultiplayer = useCallback(() => {
    setIsMultiplayerEnabled(prev => !prev);
  }, []);

  const selectedThumbnails = thumbnails.filter(t => selectedIds.has(t.id));
  
  // Calculate user-created label count (exclude system-generated channel headers)
  const userLabels = textLabels.filter(label => label.metadata?.type !== 'channelHeader');
  const channelHeaders = textLabels.filter(label => label.metadata?.type === 'channelHeader');
  const userLabelCount = userLabels.length;
  
  // Debug logging for label counts
  console.log('🏷️ Label Count Debug:', {
    totalLabels: textLabels.length,
    userLabels: userLabelCount,
    channelHeaders: channelHeaders.length,
    allLabels: textLabels.map(l => ({ text: l.text, type: l.metadata?.type || 'user' }))
  });

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
        labelCount={userLabelCount}
        
        // Multiplayer props
        isMultiplayerConnected={isMultiplayerConnected}
        multiplayerUserCount={multiplayerUserCount}
        currentMultiplayerUser={currentMultiplayerUser}
        remoteCursors={remoteCursors}
        onToggleMultiplayer={toggleMultiplayer}
        isMultiplayerEnabled={isMultiplayerEnabled}
        
        // History props
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
        zoomLevel={zoomLevel}
        zoomActions={zoomActions}
        minZoom={10}
        maxZoom={500}
      />

      {/* Canvas Overlays */}
      <CanvasOverlays
        comments={comments}
        pendingCommentPos={pendingCommentPos}
        editingComment={editingComment}
        draggedComment={draggedComment}
        viewportTransform={viewportTransform}
        onCommentSubmit={handleCommentSubmit}
        onCommentMouseDown={(e, commentId) => {
          if (!e.target.closest('.comment-pin')) return;
          e.preventDefault();
          e.stopPropagation();
          uiActions.setDraggedComment(commentId, {
            x: 16 * Math.min(1, 1 / viewportTransform.scale),
            y: 16 * Math.min(1, 1 / viewportTransform.scale)
          });
        }}
        onCommentEdit={uiActions.setEditingComment}
        onCommentResolve={canvasActions.resolveComment}
        onCommentDelete={canvasActions.deleteComment}
        onCommentClose={() => uiActions.setEditingComment(null)}
        onCommentCancel={() => uiActions.setPendingComment(null)}
        selectedThumbnails={selectedThumbnails}
        thumbnailPositions={thumbnailPositions}
        lockedThumbnails={lockedThumbnails}
        onThumbnailInfoClick={() => uiActions.setShowAnalytics(true)}
        onThumbnailCritiqueClick={(thumb) => {
          uiActions.setSelectedCritique(thumb);
          uiActions.setShowAnalytics(false);
        }}
        onThumbnailToggleVisibility={canvasActions.toggleThumbnailLock}
        selectionCount={selectedThumbnails.length}
        isMultiplayerEnabled={isMultiplayerEnabled}
        remoteCursors={remoteCursors}
      />
      
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

      {/* Tool Settings Panel */}
      <ToolSettingsPanel
        activeTool={
          isAddingComment ? 'comment' :
          isDrawingMode ? 'drawing' :
          (isAddingLabel || editingLabel || selectedLabelIds.size > 0) ? 'label' :
          null
        }
        // Comment props
        commentCount={comments.length}
        
        // Drawing props
        drawingCount={drawings.length}
        onClearAllDrawings={clearAllDrawings}
        onDrawingSettingsChange={handleDrawingSettingsChange}
        
        // Label props
        labelCount={userLabelCount}
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
          onCreateChannelHeader={handleCreateChannelHeader}
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
        onCreateChannelHeader={handleCreateChannelHeader}
      />
    </div>
  );
};

// Wrapper component that provides state context
const FigmaStyleCanvasRefactoredClean = () => {
  return (
    <CanvasStateProvider>
      <FigmaStyleCanvasInternal />
    </CanvasStateProvider>
  );
};

export default FigmaStyleCanvasRefactoredClean;