import { useMemo } from 'react';
import { useCanvasDispatch, actions } from '../state/canvasState';
import { createLabelData } from '../components/canvas/TextLabelRenderer';

// Custom hook for canvas content actions
export function useCanvasActions() {
  const dispatch = useCanvasDispatch();
  
  return useMemo(() => ({
    // Thumbnail actions
    importThumbnails: (videos) => {
      const arrangedVideos = videos.map((video, index) => {
        const col = index % 5;
        const row = Math.floor(index / 5);
        return { ...video, x: 100 + col * 380, y: 100 + row * 300 };
      });
      
      dispatch({
        type: actions.IMPORT_THUMBNAILS,
        payload: { 
          thumbnails: arrangedVideos,
          positions: {}
        }
      });
    },
    
    updateThumbnailPositions: (positions) => {
      dispatch({
        type: actions.UPDATE_THUMBNAIL_POSITIONS,
        payload: positions
      });
    },
    
    deleteThumbnails: (ids) => {
      dispatch({
        type: actions.DELETE_THUMBNAILS,
        payload: { ids }
      });
    },
    
    toggleThumbnailLock: (id) => {
      dispatch({
        type: actions.TOGGLE_THUMBNAIL_LOCK,
        payload: { id }
      });
    },
    
    // Comment actions
    addComment: (position, text) => {
      const comment = {
        id: Date.now(),
        x: position.x,
        y: position.y,
        text: text,
        author: 'Current User',
        timestamp: new Date().toISOString(),
        resolved: false
      };
      
      dispatch({
        type: actions.ADD_COMMENT,
        payload: comment
      });
    },
    
    updateComment: (id, updates) => {
      dispatch({
        type: actions.UPDATE_COMMENT,
        payload: { id, updates }
      });
    },
    
    deleteComment: (id) => {
      dispatch({
        type: actions.DELETE_COMMENT,
        payload: { id }
      });
    },
    
    resolveComment: (id) => {
      dispatch({
        type: actions.RESOLVE_COMMENT,
        payload: { id }
      });
    },
    
    // Drawing actions
    addDrawing: (drawing) => {
      dispatch({
        type: actions.ADD_DRAWING,
        payload: drawing
      });
    },
    
    setDrawings: (drawings) => {
      dispatch({
        type: actions.SET_DRAWINGS,
        payload: { drawings }
      });
    },
    
    deleteDrawings: (ids) => {
      dispatch({
        type: actions.DELETE_DRAWINGS,
        payload: { ids }
      });
    },
    
    clearAllDrawings: () => {
      dispatch({
        type: actions.CLEAR_ALL_DRAWINGS
      });
    },
    
    updateDrawingSettings: (settings) => {
      dispatch({
        type: actions.UPDATE_DRAWING_SETTINGS,
        payload: settings
      });
    },
    
    // Label actions
    addLabel: (text, position, settings, metadata = null) => {
      const label = createLabelData(text, position.x, position.y, settings, metadata);
      dispatch({
        type: actions.ADD_LABEL,
        payload: label
      });
      return label;
    },
    
    updateLabel: (id, updates) => {
      dispatch({
        type: actions.UPDATE_LABEL,
        payload: { id, updates }
      });
    },
    
    deleteLabels: (ids) => {
      dispatch({
        type: actions.DELETE_LABELS,
        payload: { ids }
      });
    },
    
    updateLabelPositions: (positions) => {
      dispatch({
        type: actions.UPDATE_LABEL_POSITIONS,
        payload: positions
      });
    },
    
    updateLabelSettings: (settings) => {
      dispatch({
        type: actions.UPDATE_LABEL_SETTINGS,
        payload: settings
      });
    },
    
  }), [dispatch]);
}

// Custom hook for selection actions
export function useSelectionActions() {
  const dispatch = useCanvasDispatch();
  
  return useMemo(() => ({
    setSelection: (ids) => {
      // Handle both Set and Array inputs
      const idsArray = ids instanceof Set ? Array.from(ids) : ids;
      dispatch({
        type: actions.SET_SELECTION,
        payload: { ids: idsArray }
      });
    },
    
    setLabelSelection: (ids) => {
      // Handle both Set and Array inputs
      const idsArray = ids instanceof Set ? Array.from(ids) : ids;
      dispatch({
        type: actions.SET_LABEL_SELECTION,
        payload: { ids: idsArray }
      });
    },
    
    clearSelection: () => {
      dispatch({
        type: actions.CLEAR_SELECTION
      });
    },
    
    // Combined selection for rectangular selection
    setBothSelections: (thumbnailIds, labelIds) => {
      const thumbnailIdsArray = thumbnailIds instanceof Set ? Array.from(thumbnailIds) : thumbnailIds;
      const labelIdsArray = labelIds instanceof Set ? Array.from(labelIds) : labelIds;
      dispatch({
        type: actions.SET_SELECTION,
        payload: { ids: thumbnailIdsArray }
      });
      dispatch({
        type: actions.SET_LABEL_SELECTION,
        payload: { ids: labelIdsArray }
      });
    },
    
  }), [dispatch]);
}

// Custom hook for UI actions
export function useUIActions() {
  const dispatch = useCanvasDispatch();
  
  return useMemo(() => ({
    setViewportTransform: (transform) => {
      dispatch({
        type: actions.SET_VIEWPORT_TRANSFORM,
        payload: transform
      });
    },
    
    setSidebarState: (isOpen) => {
      dispatch({
        type: actions.SET_SIDEBAR_STATE,
        payload: isOpen
      });
    },
    
    setSidebarWidth: (width) => {
      dispatch({
        type: actions.SET_SIDEBAR_WIDTH,
        payload: width
      });
    },
    
    setShowAnalytics: (show) => {
      dispatch({
        type: actions.SET_SHOW_ANALYTICS,
        payload: show
      });
    },
    
    setSelectedCritique: (thumbnail) => {
      dispatch({
        type: actions.SET_SELECTED_CRITIQUE,
        payload: thumbnail
      });
    },
    
    setShowContentImport: (show) => {
      dispatch({
        type: actions.SET_SHOW_CONTENT_IMPORT,
        payload: show
      });
    },
    
    setShowYouTubeImporter: (show) => {
      dispatch({
        type: actions.SET_SHOW_YOUTUBE_IMPORTER,
        payload: show
      });
    },
    
    setPendingComment: (position) => {
      dispatch({
        type: actions.SET_PENDING_COMMENT,
        payload: position
      });
    },
    
    setEditingComment: (id) => {
      dispatch({
        type: actions.SET_EDITING_COMMENT,
        payload: id
      });
    },
    
    setEditingLabel: (label) => {
      dispatch({
        type: actions.SET_EDITING_LABEL,
        payload: label
      });
    },
    
    setDraggedComment: (id, offset) => {
      dispatch({
        type: actions.SET_DRAGGED_COMMENT,
        payload: { id, offset }
      });
    },
    
  }), [dispatch]);
}

// Custom hook for history actions
export function useHistoryActions() {
  const dispatch = useCanvasDispatch();
  
  return useMemo(() => ({
    undo: () => {
      dispatch({
        type: actions.UNDO
      });
    },
    
    redo: () => {
      dispatch({
        type: actions.REDO
      });
    },
    
  }), [dispatch]);
}