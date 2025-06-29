import { useState, useCallback, useMemo } from 'react';

export const TOOLS = {
  SELECTION: 'selection',
  HAND: 'hand',
  DRAWING: 'drawing',
  COMMENT: 'comment',
  LABEL: 'label',
};

const useToolState = () => {
  const [activeTool, setActiveTool] = useState(TOOLS.SELECTION);
  const [isSpacePanning, setIsSpacePanning] = useState(false);

  const [drawingSettings, setDrawingSettings] = useState({
    isEraserMode: false,
    brushSize: 4,
    brushColor: '#3b82f6',
  });

  const setTool = useCallback((tool) => {
    if (Object.values(TOOLS).includes(tool)) {
      setActiveTool(tool);
    }
  }, []);

  const setSpacePanning = useCallback((enabled) => {
    setIsSpacePanning(enabled);
  }, []);

  const isSelectionMode = activeTool === TOOLS.SELECTION;
  const isHandToolMode = activeTool === TOOLS.HAND;
  const isDrawingMode = activeTool === TOOLS.DRAWING;
  const isAddingComment = activeTool === TOOLS.COMMENT;
  const isAddingLabel = activeTool === TOOLS.LABEL;

  const toolActions = useMemo(() => ({
    selectSelectionTool: () => setTool(TOOLS.SELECTION),
    selectHandTool: () => setTool(TOOLS.HAND),
    selectDrawingTool: () => setTool(TOOLS.DRAWING),
    selectCommentTool: () => setTool(TOOLS.COMMENT),
    selectLabelTool: () => setTool(TOOLS.LABEL),
    toggleHandTool: (enable) => setTool(enable ? TOOLS.HAND : TOOLS.SELECTION),
    toggleDrawingMode: () => setTool(isDrawingMode ? TOOLS.SELECTION : TOOLS.DRAWING),
    toggleCommentMode: () => setTool(isAddingComment ? TOOLS.SELECTION : TOOLS.COMMENT),
    toggleLabelMode: () => setTool(isAddingLabel ? TOOLS.SELECTION : TOOLS.LABEL),
    setSpacePanning,
  }), [setTool, isDrawingMode, isAddingComment, isAddingLabel, setSpacePanning]);

  return {
    activeTool,
    isSpacePanning,
    isSelectionMode,
    isHandToolMode,
    isDrawingMode,
    isAddingComment,
    isAddingLabel,
    drawingSettings,
    setDrawingSettings,
    setTool,
    setSpacePanning,
    toolActions,
  };
};

export default useToolState;
