import React, { useState } from 'react';

const CommentToolbar = ({ 
  isAddingComment, 
  onToggleAddComment, 
  commentCount,
  isDrawingMode,
  onToggleDrawingMode,
  drawingCount,
  onClearAllDrawings,
  onDrawingSettingsChange
}) => {
  const [isEraserMode, setIsEraserMode] = useState(false);
  const [brushSize, setBrushSize] = useState(4);
  const [brushColor, setBrushColor] = useState('#3b82f6');

  // Notify parent of drawing settings changes
  React.useEffect(() => {
    if (onDrawingSettingsChange) {
      const settings = {
        isEraserMode,
        brushSize,
        brushColor
      };
      onDrawingSettingsChange(settings);
    }
  }, [isEraserMode, brushSize, brushColor]); // Remove onDrawingSettingsChange from deps

  const colors = [
    '#3b82f6', // blue
    '#ef4444', // red  
    '#22c55e', // green
    '#f59e0b', // yellow
    '#8b5cf6', // purple
    '#000000', // black
  ];

  const handleEraserToggle = () => {
    setIsEraserMode(!isEraserMode);
  };

  const handleClearAll = () => {
    if (window.confirm('Clear all drawings? This action cannot be undone.')) {
      onClearAllDrawings();
    }
  };

  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
      {/* Main Toolbar */}
      <div className="bg-white border border-border-secondary rounded-lg shadow-lg p-2 flex items-center gap-2">
        {/* Comment Tool */}
        <button
          onClick={onToggleAddComment}
          className={`p-2 rounded transition-colors ${
            isAddingComment ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
          }`}
          title="Add comment (C)">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
        </button>
        
        <div className="w-px h-6 bg-gray-300" />
        
        {/* Drawing Tool */}
        <button
          onClick={onToggleDrawingMode}
          className={`p-2 rounded transition-colors ${
            isDrawingMode ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
          }`}
          title="Draw on canvas (P)">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
      </div>

      {/* Expanded Drawing Toolbar */}
      {isDrawingMode && (
        <div className="mt-2 bg-white border border-border-secondary rounded-lg shadow-lg p-2 flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-200">
          {/* Pen Tool */}
          <button
            onClick={() => setIsEraserMode(false)}
            className={`p-2 rounded transition-colors ${
              !isEraserMode ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
            }`}
            title="Pen tool">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>

          {/* Eraser Tool */}
          <button
            onClick={handleEraserToggle}
            className={`p-2 rounded transition-colors ${
              isEraserMode ? 'bg-red-100 text-red-600' : 'hover:bg-gray-100'
            }`}
            title="Eraser tool">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <rect x="4" y="6" width="16" height="12" rx="3" ry="3"/>
              <path strokeLinecap="round" d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            </svg>
          </button>

          <div className="w-px h-6 bg-gray-300" />

          {/* Clear All */}
          <button
            onClick={handleClearAll}
            className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Clear all drawings">
            Clear All
          </button>

          <div className="w-px h-6 bg-gray-300" />

          {/* Brush Size */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Size:</span>
            <input
              type="range"
              min="1"
              max="20"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-16 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              title={`Brush size: ${brushSize}px`}
            />
            <span className="text-xs text-gray-500 w-6">{brushSize}</span>
          </div>

          <div className="w-px h-6 bg-gray-300" />

          {/* Color Picker */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">Color:</span>
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => setBrushColor(color)}
                className={`w-6 h-6 rounded border-2 transition-all ${
                  brushColor === color ? 'border-gray-400 scale-110' : 'border-gray-200'
                }`}
                style={{ backgroundColor: color }}
                title={`Color: ${color}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentToolbar;