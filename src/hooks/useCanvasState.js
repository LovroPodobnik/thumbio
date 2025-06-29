import { useState } from 'react';

const DEFAULT_LABEL_STYLE = {
  font: 'Arial',
  size: 'M',
  fill: '#000000',
  bold: false,
  italic: false,
};

export const useCanvasState = () => {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [thumbnailPositions, setThumbnailPositions] = useState({});
  const [comments, setComments] = useState([]);
  const [textLabels, setTextLabels] = useState([]);
  const [labelPositions, setLabelPositions] = useState({});
  const [editingLabel, setEditingLabel] = useState(null);
  const [labelSettings, setLabelSettings] = useState(DEFAULT_LABEL_STYLE);
  const [selectedLabelIds, setSelectedLabelIds] = useState(new Set());
  const [selectedLabelText, setSelectedLabelText] = useState('');
  const [pendingCommentPos, setPendingCommentPos] = useState(null);
  const [draggedComment, setDraggedComment] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [editingComment, setEditingComment] = useState(null);
  const [lockedThumbnails, setLockedThumbnails] = useState(new Set());
  const [youtubeThumbnails, setYoutubeThumbnails] = useState([]);

  // Drawing state
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

  return {
    // State
    selectedIds,
    thumbnailPositions,
    comments,
    textLabels,
    labelPositions,
    editingLabel,
    labelSettings,
    selectedLabelIds,
    selectedLabelText,
    pendingCommentPos,
    draggedComment,
    dragOffset,
    editingComment,
    lockedThumbnails,
    youtubeThumbnails,
    drawings,
    currentDrawing,
    isDrawing,
    drawingSettings,
    selectionRect,
    isRectSelecting,

    // Setters
    setSelectedIds,
    setThumbnailPositions,
    setComments,
    setTextLabels,
    setLabelPositions,
    setEditingLabel,
    setLabelSettings,
    setSelectedLabelIds,
    setSelectedLabelText,
    setPendingCommentPos,
    setDraggedComment,
    setDragOffset,
    setEditingComment,
    setLockedThumbnails,
    setYoutubeThumbnails,
    setDrawings,
    setCurrentDrawing,
    setIsDrawing,
    setDrawingSettings,
    setSelectionRect,
    setIsRectSelecting,
  };
};
