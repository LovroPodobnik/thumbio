import React, { createContext, useContext, useReducer } from 'react';

// Action types
export const actions = {
  // Canvas content actions
  IMPORT_THUMBNAILS: 'IMPORT_THUMBNAILS',
  UPDATE_THUMBNAIL_POSITIONS: 'UPDATE_THUMBNAIL_POSITIONS',
  DELETE_THUMBNAILS: 'DELETE_THUMBNAILS',
  TOGGLE_THUMBNAIL_LOCK: 'TOGGLE_THUMBNAIL_LOCK',
  
  // Comment actions
  ADD_COMMENT: 'ADD_COMMENT',
  UPDATE_COMMENT: 'UPDATE_COMMENT',
  DELETE_COMMENT: 'DELETE_COMMENT',
  MOVE_COMMENT: 'MOVE_COMMENT',
  RESOLVE_COMMENT: 'RESOLVE_COMMENT',
  SET_PENDING_COMMENT: 'SET_PENDING_COMMENT',
  SET_EDITING_COMMENT: 'SET_EDITING_COMMENT',
  
  // Drawing actions
  ADD_DRAWING: 'ADD_DRAWING',
  DELETE_DRAWINGS: 'DELETE_DRAWINGS',
  CLEAR_ALL_DRAWINGS: 'CLEAR_ALL_DRAWINGS',
  UPDATE_DRAWING_SETTINGS: 'UPDATE_DRAWING_SETTINGS',
  SET_DRAWINGS: 'SET_DRAWINGS',
  
  // Text label actions
  ADD_LABEL: 'ADD_LABEL',
  UPDATE_LABEL: 'UPDATE_LABEL',
  DELETE_LABELS: 'DELETE_LABELS',
  UPDATE_LABEL_POSITIONS: 'UPDATE_LABEL_POSITIONS',
  UPDATE_LABEL_SETTINGS: 'UPDATE_LABEL_SETTINGS',
  SET_EDITING_LABEL: 'SET_EDITING_LABEL',
  
  // Selection actions
  SET_SELECTION: 'SET_SELECTION',
  SET_LABEL_SELECTION: 'SET_LABEL_SELECTION',
  CLEAR_SELECTION: 'CLEAR_SELECTION',
  TOGGLE_SELECTION: 'TOGGLE_SELECTION',
  
  // UI actions
  SET_VIEWPORT_TRANSFORM: 'SET_VIEWPORT_TRANSFORM',
  SET_SIDEBAR_STATE: 'SET_SIDEBAR_STATE',
  SET_SIDEBAR_WIDTH: 'SET_SIDEBAR_WIDTH',
  SET_SHOW_ANALYTICS: 'SET_SHOW_ANALYTICS',
  SET_SELECTED_CRITIQUE: 'SET_SELECTED_CRITIQUE',
  SET_SHOW_CONTENT_IMPORT: 'SET_SHOW_CONTENT_IMPORT',
  SET_SHOW_YOUTUBE_IMPORTER: 'SET_SHOW_YOUTUBE_IMPORTER',
  SET_DRAGGED_COMMENT: 'SET_DRAGGED_COMMENT',
  
  // History actions
  UNDO: 'UNDO',
  REDO: 'REDO',
  SAVE_SNAPSHOT: 'SAVE_SNAPSHOT',
};

// Default label style (imported from TextLabelRenderer)
const DEFAULT_LABEL_STYLE = {
  fontSize: 16,
  fontFamily: 'Arial',
  fill: '#000000',
  fontWeight: 'normal',
  fontStyle: 'normal',
  align: 'left',
  size: 'M'
};

// Initial state
export const initialState = {
  // Canvas content
  canvas: {
    youtubeThumbnails: [],
    thumbnailPositions: {},
    comments: [],
    drawings: [],
    textLabels: [],
    labelPositions: {},
    lockedThumbnails: new Set(),
  },
  
  // Selection state
  selection: {
    selectedIds: new Set(),
    selectedLabelIds: new Set(),
    selectedLabelText: '',
  },
  
  // UI state
  ui: {
    viewportTransform: { x: 0, y: 0, scale: 1 },
    sidebarOpen: false,
    sidebarWidth: 240,
    showAnalytics: false,
    selectedCritique: null,
    showContentImportSidebar: false,
    showYouTubeImporter: false,
    hasImportedBefore: false,
    pendingCommentPos: null,
    editingComment: null,
    editingLabel: null,
    draggedComment: null,
    dragOffset: { x: 0, y: 0 },
  },
  
  // Tool settings
  tools: {
    drawing: {
      isEraserMode: false,
      brushSize: 4,
      brushColor: '#3b82f6'
    },
    label: DEFAULT_LABEL_STYLE,
  },
  
  // History system
  history: {
    past: [],
    present: null,
    future: [],
    maxSize: 50,
  }
};

// Helper function to save state to history
function saveToHistory(state, actionType) {
  // Don't save UI-only actions to history
  const uiOnlyActions = [
    'SET_VIEWPORT_TRANSFORM',
    'SET_SIDEBAR_STATE', 
    'SET_SIDEBAR_WIDTH',
    'SET_SHOW_ANALYTICS',
    'SET_SELECTED_CRITIQUE',
    'SET_PENDING_COMMENT',
    'SET_EDITING_COMMENT',
    'SET_EDITING_LABEL',
    'SET_DRAGGED_COMMENT'
  ];
  
  if (uiOnlyActions.includes(actionType)) {
    return state;
  }
  
  const snapshot = {
    action: actionType,
    timestamp: Date.now(),
    data: {
      canvas: {
        ...state.canvas,
        lockedThumbnails: new Set(state.canvas.lockedThumbnails),
      },
      selection: {
        ...state.selection,
        selectedIds: new Set(state.selection.selectedIds),
        selectedLabelIds: new Set(state.selection.selectedLabelIds),
      },
    }
  };
  
  const newPast = [...state.history.past, state.history.present].filter(Boolean);
  
  // Keep history size manageable
  const trimmedPast = newPast.length >= state.history.maxSize 
    ? newPast.slice(-state.history.maxSize + 1)
    : newPast;
  
  return {
    ...state,
    history: {
      ...state.history,
      past: trimmedPast,
      present: snapshot,
      future: [], // Clear future when new action is performed
    }
  };
}

// Reducer function
export function canvasReducer(state, action) {
  // Save to history for state-changing actions
  const stateChangingActions = [
    'IMPORT_THUMBNAILS',
    'UPDATE_THUMBNAIL_POSITIONS',
    'DELETE_THUMBNAILS',
    'TOGGLE_THUMBNAIL_LOCK',
    'ADD_COMMENT',
    'UPDATE_COMMENT', 
    'DELETE_COMMENT',
    'MOVE_COMMENT',
    'RESOLVE_COMMENT',
    'ADD_DRAWING',
    'DELETE_DRAWINGS',
    'CLEAR_ALL_DRAWINGS',
    'SET_DRAWINGS',
    'ADD_LABEL',
    'UPDATE_LABEL',
    'DELETE_LABELS',
    'UPDATE_LABEL_POSITIONS',
    'SET_SELECTION',
    'SET_LABEL_SELECTION',
    'CLEAR_SELECTION',
    'TOGGLE_SELECTION'
  ];
  
  let newState = state;
  if (stateChangingActions.includes(action.type)) {
    newState = saveToHistory(state, action.type);
  }
  
  switch (action.type) {
    // Canvas content actions
    case 'IMPORT_THUMBNAILS':
      return {
        ...newState,
        canvas: {
          ...newState.canvas,
          youtubeThumbnails: action.payload.thumbnails,
          thumbnailPositions: {
            ...newState.canvas.thumbnailPositions,
            ...action.payload.positions
          }
        }
      };
    
    case 'UPDATE_THUMBNAIL_POSITIONS':
      return {
        ...newState,
        canvas: {
          ...newState.canvas,
          thumbnailPositions: {
            ...newState.canvas.thumbnailPositions,
            ...action.payload
          }
        }
      };
    
    case 'DELETE_THUMBNAILS':
      const remainingThumbnails = newState.canvas.youtubeThumbnails.filter(
        t => !action.payload.ids.includes(t.id)
      );
      const updatedPositions = { ...newState.canvas.thumbnailPositions };
      action.payload.ids.forEach(id => delete updatedPositions[id]);
      
      return {
        ...newState,
        canvas: {
          ...newState.canvas,
          youtubeThumbnails: remainingThumbnails,
          thumbnailPositions: updatedPositions
        },
        selection: {
          ...newState.selection,
          selectedIds: new Set()
        }
      };
    
    case 'TOGGLE_THUMBNAIL_LOCK':
      const newLockedThumbnails = new Set(newState.canvas.lockedThumbnails);
      if (newLockedThumbnails.has(action.payload.id)) {
        newLockedThumbnails.delete(action.payload.id);
      } else {
        newLockedThumbnails.add(action.payload.id);
      }
      return {
        ...newState,
        canvas: {
          ...newState.canvas,
          lockedThumbnails: newLockedThumbnails
        }
      };
    
    // Comment actions
    case 'ADD_COMMENT':
      return {
        ...newState,
        canvas: {
          ...newState.canvas,
          comments: [...newState.canvas.comments, action.payload]
        },
        ui: {
          ...newState.ui,
          pendingCommentPos: null
        }
      };
    
    case 'UPDATE_COMMENT':
      return {
        ...newState,
        canvas: {
          ...newState.canvas,
          comments: newState.canvas.comments.map(c =>
            c.id === action.payload.id ? { ...c, ...action.payload.updates } : c
          )
        }
      };
    
    case 'DELETE_COMMENT':
      return {
        ...newState,
        canvas: {
          ...newState.canvas,
          comments: newState.canvas.comments.filter(c => c.id !== action.payload.id)
        }
      };
    
    case 'RESOLVE_COMMENT':
      return {
        ...newState,
        canvas: {
          ...newState.canvas,
          comments: newState.canvas.comments.map(c =>
            c.id === action.payload.id ? { ...c, resolved: !c.resolved } : c
          )
        }
      };
    
    // Drawing actions
    case 'ADD_DRAWING':
      return {
        ...newState,
        canvas: {
          ...newState.canvas,
          drawings: [...newState.canvas.drawings, action.payload]
        }
      };
    
    case 'DELETE_DRAWINGS':
      return {
        ...newState,
        canvas: {
          ...newState.canvas,
          drawings: newState.canvas.drawings.filter(d => !action.payload.ids.includes(d.id))
        }
      };
    
    case 'CLEAR_ALL_DRAWINGS':
      return {
        ...newState,
        canvas: {
          ...newState.canvas,
          drawings: []
        }
      };
    
    case 'UPDATE_DRAWING_SETTINGS':
      return {
        ...newState,
        tools: {
          ...newState.tools,
          drawing: {
            ...newState.tools.drawing,
            ...action.payload
          }
        }
      };
    
    case 'SET_DRAWINGS':
      return {
        ...newState,
        canvas: {
          ...newState.canvas,
          drawings: action.payload.drawings
        }
      };
    
    // Text label actions
    case 'ADD_LABEL':
      return {
        ...newState,
        canvas: {
          ...newState.canvas,
          textLabels: [...newState.canvas.textLabels, action.payload]
        }
      };
    
    case 'UPDATE_LABEL':
      return {
        ...newState,
        canvas: {
          ...newState.canvas,
          textLabels: newState.canvas.textLabels.map(l =>
            l.id === action.payload.id ? { ...l, ...action.payload.updates } : l
          )
        }
      };
    
    case 'DELETE_LABELS':
      const remainingLabels = newState.canvas.textLabels.filter(
        l => !action.payload.ids.includes(l.id)
      );
      const updatedLabelPositions = { ...newState.canvas.labelPositions };
      action.payload.ids.forEach(id => delete updatedLabelPositions[id]);
      
      return {
        ...newState,
        canvas: {
          ...newState.canvas,
          textLabels: remainingLabels,
          labelPositions: updatedLabelPositions
        },
        selection: {
          ...newState.selection,
          selectedLabelIds: new Set()
        }
      };
    
    case 'UPDATE_LABEL_POSITIONS':
      return {
        ...newState,
        canvas: {
          ...newState.canvas,
          labelPositions: {
            ...newState.canvas.labelPositions,
            ...action.payload
          }
        }
      };
    
    case 'UPDATE_LABEL_SETTINGS':
      return {
        ...newState,
        tools: {
          ...newState.tools,
          label: {
            ...newState.tools.label,
            ...action.payload
          }
        }
      };
    
    // Selection actions
    case 'SET_SELECTION':
      return {
        ...newState,
        selection: {
          ...newState.selection,
          selectedIds: new Set(action.payload.ids || [])
        }
      };
    
    case 'SET_LABEL_SELECTION':
      const selectedLabelIds = new Set(action.payload.ids || []);
      let selectedLabelText = '';
      
      if (selectedLabelIds.size === 1) {
        const selectedId = [...selectedLabelIds][0];
        const selectedLabel = newState.canvas.textLabels.find(label => label.id === selectedId);
        if (selectedLabel) {
          selectedLabelText = selectedLabel.text;
        }
      }
      
      return {
        ...newState,
        selection: {
          ...newState.selection,
          selectedLabelIds,
          selectedLabelText
        }
      };
    
    case 'CLEAR_SELECTION':
      return {
        ...newState,
        selection: {
          ...newState.selection,
          selectedIds: new Set(),
          selectedLabelIds: new Set(),
          selectedLabelText: ''
        }
      };
    
    // UI actions
    case 'SET_VIEWPORT_TRANSFORM':
      return {
        ...newState,
        ui: {
          ...newState.ui,
          viewportTransform: action.payload
        }
      };
    
    case 'SET_SIDEBAR_STATE':
      return {
        ...newState,
        ui: {
          ...newState.ui,
          sidebarOpen: action.payload
        }
      };
    
    case 'SET_SIDEBAR_WIDTH':
      return {
        ...newState,
        ui: {
          ...newState.ui,
          sidebarWidth: action.payload
        }
      };
    
    case 'SET_SHOW_ANALYTICS':
      return {
        ...newState,
        ui: {
          ...newState.ui,
          showAnalytics: action.payload
        }
      };
    
    case 'SET_SELECTED_CRITIQUE':
      return {
        ...newState,
        ui: {
          ...newState.ui,
          selectedCritique: action.payload
        }
      };
    
    case 'SET_SHOW_CONTENT_IMPORT':
      return {
        ...newState,
        ui: {
          ...newState.ui,
          showContentImportSidebar: action.payload
        }
      };
    
    case 'SET_SHOW_YOUTUBE_IMPORTER':
      return {
        ...newState,
        ui: {
          ...newState.ui,
          showYouTubeImporter: action.payload
        }
      };
    
    case 'SET_PENDING_COMMENT':
      return {
        ...newState,
        ui: {
          ...newState.ui,
          pendingCommentPos: action.payload
        }
      };
    
    case 'SET_EDITING_COMMENT':
      return {
        ...newState,
        ui: {
          ...newState.ui,
          editingComment: action.payload
        }
      };
    
    case 'SET_EDITING_LABEL':
      return {
        ...newState,
        ui: {
          ...newState.ui,
          editingLabel: action.payload
        }
      };
    
    case 'SET_DRAGGED_COMMENT':
      return {
        ...newState,
        ui: {
          ...newState.ui,
          draggedComment: action.payload.id,
          dragOffset: action.payload.offset || { x: 0, y: 0 }
        }
      };
    
    // History actions
    case 'UNDO':
      if (newState.history.past.length === 0) {
        return newState;
      }
      
      const previous = newState.history.past[newState.history.past.length - 1];
      const newPast = newState.history.past.slice(0, -1);
      
      return {
        ...newState,
        canvas: previous.data.canvas,
        selection: previous.data.selection,
        history: {
          ...newState.history,
          past: newPast,
          future: [newState.history.present, ...newState.history.future].filter(Boolean)
        }
      };
    
    case 'REDO':
      if (newState.history.future.length === 0) {
        return newState;
      }
      
      const next = newState.history.future[0];
      const newFuture = newState.history.future.slice(1);
      
      return {
        ...newState,
        canvas: next.data.canvas,
        selection: next.data.selection,
        history: {
          ...newState.history,
          past: [...newState.history.past, newState.history.present].filter(Boolean),
          present: next,
          future: newFuture
        }
      };
    
    default:
      return newState;
  }
}

// Context
const CanvasStateContext = createContext();
const CanvasDispatchContext = createContext();

// Provider component
export const CanvasStateProvider = ({ children }) => {
  const [state, dispatch] = useReducer(canvasReducer, initialState);
  
  return (
    <CanvasStateContext.Provider value={state}>
      <CanvasDispatchContext.Provider value={dispatch}>
        {children}
      </CanvasDispatchContext.Provider>
    </CanvasStateContext.Provider>
  );
};

// Custom hooks for accessing state and dispatch
export const useCanvasState = () => {
  const context = useContext(CanvasStateContext);
  if (!context) {
    throw new Error('useCanvasState must be used within a CanvasStateProvider');
  }
  return context;
};

export const useCanvasDispatch = () => {
  const context = useContext(CanvasDispatchContext);
  if (!context) {
    throw new Error('useCanvasDispatch must be used within a CanvasStateProvider');
  }
  return context;
};