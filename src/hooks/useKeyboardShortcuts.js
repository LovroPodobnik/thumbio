import { useEffect } from 'react';

/**
 * Keyboard Shortcuts Hook
 * 
 * Centralizes all keyboard shortcut handling.
 * Configurable and testable approach to keyboard shortcuts.
 * Eliminates scattered keyboard logic in main component.
 */

const useKeyboardShortcuts = ({ 
  toolActions,
  zoomActions,
  historyActions,
  enabled = true 
}) => {
  
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e) => {
      // Skip if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      // Skip if modifier keys are held (except for undo/redo)
      const hasModifier = e.metaKey || e.ctrlKey;
      
      // Tool shortcuts (no modifiers)
      if (!hasModifier) {
        switch (e.key.toLowerCase()) {
          case 'v':
            e.preventDefault();
            toolActions.selectSelectionTool();
            break;
            
          case 'h':
            e.preventDefault();
            toolActions.selectHandTool();
            break;
            
          case 'p':
            e.preventDefault();
            toolActions.selectDrawingTool();
            break;
            
          case 'c':
            e.preventDefault();
            toolActions.selectCommentTool();
            break;
            
          case 't':
            e.preventDefault();
            toolActions.selectLabelTool();
            break;
            
          case '=':
          case '+':
            e.preventDefault();
            zoomActions.zoomIn();
            break;
            
          case '-':
            e.preventDefault();
            zoomActions.zoomOut();
            break;
            
          case '0':
            e.preventDefault();
            zoomActions.zoomToFit();
            break;
            
          case ' ':
            e.preventDefault();
            toolActions.setSpacePanning(true);
            break;
        }
      }
      
      // History shortcuts (with modifiers)
      if (hasModifier) {
        switch (e.key.toLowerCase()) {
          case 'z':
            if (e.shiftKey) {
              e.preventDefault();
              historyActions.redo();
            } else {
              e.preventDefault();
              historyActions.undo();
            }
            break;
        }
      }
    };

    const handleKeyUp = (e) => {
      if (!enabled) return;
      
      // Handle space panning release
      if (e.key === ' ') {
        toolActions.setSpacePanning(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [toolActions, zoomActions, historyActions, enabled]);
};

export default useKeyboardShortcuts;