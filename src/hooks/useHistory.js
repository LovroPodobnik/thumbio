import { useState, useCallback } from 'react';

/**
 * History Management Hook
 * 
 * Extracts history management from the main canvas component.
 * Provides clean undo/redo functionality with better performance and maintainability.
 */

const useHistory = (maxHistorySize = 50) => {
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const saveToHistory = useCallback((action, state) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({
        action,
        state: JSON.parse(JSON.stringify(state)), // Deep clone
        timestamp: Date.now()
      });
      
      // Limit history size
      if (newHistory.length > maxHistorySize) {
        newHistory.shift();
        return newHistory;
      }
      
      return newHistory;
    });
    
    setHistoryIndex(prev => Math.min(prev + 1, maxHistorySize - 1));
  }, [historyIndex, maxHistorySize]);
  
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      return history[historyIndex - 1];
    }
    return null;
  }, [history, historyIndex]);
  
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      return history[historyIndex + 1];
    }
    return null;
  }, [history, historyIndex]);
  
  const clearHistory = useCallback(() => {
    setHistory([]);
    setHistoryIndex(-1);
  }, []);
  
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const lastAction = history[historyIndex]?.action;
  const nextAction = history[historyIndex + 1]?.action;
  
  return {
    history,
    historyIndex,
    saveToHistory,
    undo,
    redo,
    clearHistory,
    canUndo,
    canRedo,
    lastAction,
    nextAction
  };
};

export default useHistory;