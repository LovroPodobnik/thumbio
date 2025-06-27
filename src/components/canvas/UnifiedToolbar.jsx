import React, { useState, useEffect } from 'react';
import { LABEL_SIZES, DEFAULT_LABEL_STYLE } from './TextLabelRenderer';
import QuotaTracker from '../QuotaTracker';

const UnifiedToolbar = ({
  // Comment props
  isAddingComment,
  onToggleAddComment,
  commentCount,
  
  // Drawing props
  isDrawingMode,
  onToggleDrawingMode,
  drawingCount,
  onClearAllDrawings,
  onDrawingSettingsChange,
  
  // Label props
  isAddingLabel,
  onToggleAddLabel,
  labelCount,
  onLabelSettingsChange,
  currentSettings = DEFAULT_LABEL_STYLE,
  selectedLabelIds = new Set(),
  onApplySettingsToSelected
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [activeTool, setActiveTool] = useState(null);
  
  // Drawing settings
  const [isEraserMode, setIsEraserMode] = useState(false);
  const [brushSize, setBrushSize] = useState(4);
  const [brushColor, setBrushColor] = useState('#3b82f6');
  
  // Label settings
  const [labelSettings, setLabelSettings] = useState(currentSettings);

  // Sync label settings with parent
  useEffect(() => {
    setLabelSettings(currentSettings);
  }, [currentSettings]);

  // Update active tool based on mode states
  useEffect(() => {
    if (isAddingComment) setActiveTool('comment');
    else if (isDrawingMode) setActiveTool('drawing');
    else if (isAddingLabel) setActiveTool('label');
    else setActiveTool(null);
  }, [isAddingComment, isDrawingMode, isAddingLabel]);

  // Notify parent of drawing settings changes
  useEffect(() => {
    if (onDrawingSettingsChange) {
      onDrawingSettingsChange({
        isEraserMode,
        brushSize,
        brushColor
      });
    }
  }, [isEraserMode, brushSize, brushColor, onDrawingSettingsChange]);

  const handleLabelSettingsChange = (newSettings) => {
    setLabelSettings(newSettings);
    onLabelSettingsChange(newSettings);
    
    // Apply to selected labels
    if (selectedLabelIds.size > 0 && onApplySettingsToSelected) {
      onApplySettingsToSelected(newSettings);
    }
  };

  const handleClearAllDrawings = () => {
    if (window.confirm('Clear all drawings? This action cannot be undone.')) {
      onClearAllDrawings();
    }
  };

  const drawingColors = [
    '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#000000'
  ];

  const labelColorPresets = [
    { name: 'Black', value: '#141414' },
    { name: 'Blue', value: '#2563EB' },
    { name: 'Red', value: '#FF3B30' },
    { name: 'Green', value: '#16A34A' },
    { name: 'Orange', value: '#F97316' },
    { name: 'Purple', value: '#9333EA' },
  ];

  const getSettingsTitle = () => {
    switch (activeTool) {
      case 'comment': return 'Comment Settings';
      case 'drawing': return 'Drawing Settings';
      case 'label': return 'Label Settings';
      default: return 'Settings';
    }
  };

  const getSettingsCount = () => {
    switch (activeTool) {
      case 'comment': return commentCount;
      case 'drawing': return drawingCount;
      case 'label': return selectedLabelIds.size;
      default: return 0;
    }
  };

  const renderSettingsContent = () => {
    switch (activeTool) {
      case 'comment':
        return (
          <div className="text-center py-4">
            <svg className="w-12 h-12 text-text-secondary mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            <p className="text-body text-text-secondary">Click anywhere on the canvas to add a comment</p>
            {commentCount > 0 && (
              <p className="text-caption text-text-tertiary mt-1">{commentCount} comment{commentCount !== 1 ? 's' : ''} added</p>
            )}
          </div>
        );

      case 'drawing':
        return (
          <div className="space-y-4">
            {/* Tool Selection */}
            <div>
              <label className="text-caption-bold text-text-secondary mb-2 block">Tool</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEraserMode(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded text-caption-bold transition-colors ${
                    !isEraserMode
                      ? 'bg-background-brand text-text-on-brand'
                      : 'bg-background-secondary hover:bg-neutral-20 text-text-primary'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Pen
                </button>
                <button
                  onClick={() => setIsEraserMode(true)}
                  className={`flex items-center gap-2 px-3 py-2 rounded text-caption-bold transition-colors ${
                    isEraserMode
                      ? 'bg-red-500 text-white'
                      : 'bg-background-secondary hover:bg-neutral-20 text-text-primary'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <rect x="4" y="6" width="16" height="12" rx="3" ry="3"/>
                    <path strokeLinecap="round" d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                  </svg>
                  Eraser
                </button>
              </div>
            </div>

            {/* Brush Size */}
            <div>
              <label className="text-caption-bold text-text-secondary mb-2 block">
                Size: {brushSize}px
              </label>
              <input
                type="range"
                min="1"
                max="20"
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                className="w-full h-2 bg-background-secondary rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Color Selection */}
            {!isEraserMode && (
              <div>
                <label className="text-caption-bold text-text-secondary mb-2 block">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {drawingColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setBrushColor(color)}
                      className={`w-8 h-8 rounded border-2 transition-all ${
                        brushColor === color
                          ? 'border-background-brand scale-110'
                          : 'border-border-divider hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                      title={`Color: ${color}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Clear All */}
            {drawingCount > 0 && (
              <div className="pt-2 border-t border-border-divider">
                <button
                  onClick={handleClearAllDrawings}
                  className="w-full px-3 py-2 text-caption-bold text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  Clear All Drawings ({drawingCount})
                </button>
              </div>
            )}
          </div>
        );

      case 'label':
        return (
          <div className="space-y-4">
            {selectedLabelIds.size > 0 && (
              <div className="bg-background-secondary rounded p-2">
                <p className="text-caption text-text-secondary">
                  Changes will be applied to {selectedLabelIds.size} selected label{selectedLabelIds.size > 1 ? 's' : ''}
                </p>
              </div>
            )}

            {/* Size Selection */}
            <div>
              <label className="text-caption-bold text-text-secondary mb-2 block">Size</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(LABEL_SIZES).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => handleLabelSettingsChange({ ...labelSettings, size: key })}
                    className={`px-3 py-1.5 rounded text-caption-bold transition-colors ${
                      labelSettings.size === key
                        ? 'bg-background-brand text-text-on-brand'
                        : 'bg-background-secondary hover:bg-neutral-20 text-text-primary'
                    }`}
                  >
                    {config.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selection */}
            <div>
              <label className="text-caption-bold text-text-secondary mb-2 block">Color</label>
              <div className="flex gap-2 flex-wrap">
                {labelColorPresets.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => handleLabelSettingsChange({ ...labelSettings, color: color.value })}
                    className={`w-8 h-8 rounded border-2 transition-all ${
                      labelSettings.color === color.value
                        ? 'border-background-brand scale-110'
                        : 'border-border-divider hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Bold Toggle */}
            <div>
              <label className="text-caption-bold text-text-secondary mb-2 block">Style</label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleLabelSettingsChange({ ...labelSettings, bold: true })}
                  className={`px-3 py-1.5 rounded text-caption-bold transition-colors ${
                    labelSettings.bold
                      ? 'bg-background-brand text-text-on-brand'
                      : 'bg-background-secondary hover:bg-neutral-20 text-text-primary'
                  }`}
                >
                  <strong>Bold</strong>
                </button>
                <button
                  onClick={() => handleLabelSettingsChange({ ...labelSettings, bold: false })}
                  className={`px-3 py-1.5 rounded text-caption-bold transition-colors ${
                    !labelSettings.bold
                      ? 'bg-background-brand text-text-on-brand'
                      : 'bg-background-secondary hover:bg-neutral-20 text-text-primary'
                  }`}
                >
                  Regular
                </button>
              </div>
            </div>

            {/* Background Opacity */}
            <div>
              <label className="text-caption-bold text-text-secondary mb-2 block">
                Background Opacity
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={parseFloat(labelSettings.backgroundColor.match(/[\d.]+(?=\))/)?.[0] || 1) * 100}
                onChange={(e) => {
                  const opacity = e.target.value / 100;
                  handleLabelSettingsChange({
                    ...labelSettings,
                    backgroundColor: `rgba(255, 255, 255, ${opacity})`
                  });
                }}
                className="w-full h-2 bg-background-secondary rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-4">
            <p className="text-body text-text-secondary">Select a tool to view settings</p>
          </div>
        );
    }
  };

  return (
    <>
      {/* Quota Tracker - positioned at top-center */}
      {/* Temporarily disabled per user request
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
        <QuotaTracker compact={true} />
      </div>
      */}
      
      <div className="absolute bottom-4 left-4 z-20">
        {/* Main Toolbar */}
        <div className="bg-background-primary border border-border-divider rounded-lg shadow-lg flex items-center">
          {/* Comment Tool */}
        <button
          onClick={onToggleAddComment}
          className={`px-3 py-2.5 flex items-center gap-2 rounded-l-lg transition-colors ${
            isAddingComment
              ? 'bg-background-brand text-text-on-brand'
              : 'hover:bg-background-secondary text-text-primary'
          }`}
          title="Add comment (C)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          {commentCount > 0 && (
            <span className="bg-neutral-20 text-text-secondary text-caption-bold px-1.5 py-0.5 rounded">
              {commentCount}
            </span>
          )}
        </button>

        {/* Drawing Tool */}
        <button
          onClick={onToggleDrawingMode}
          className={`px-3 py-2.5 flex items-center gap-2 border-l border-border-divider transition-colors ${
            isDrawingMode
              ? 'bg-background-brand text-text-on-brand'
              : 'hover:bg-background-secondary text-text-primary'
          }`}
          title="Draw on canvas (P)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          {drawingCount > 0 && (
            <span className="bg-neutral-20 text-text-secondary text-caption-bold px-1.5 py-0.5 rounded">
              {drawingCount}
            </span>
          )}
        </button>

        {/* Label Tool */}
        <button
          onClick={onToggleAddLabel}
          className={`px-3 py-2.5 flex items-center gap-2 border-l border-border-divider transition-colors ${
            isAddingLabel
              ? 'bg-background-brand text-text-on-brand'
              : 'hover:bg-background-secondary text-text-primary'
          }`}
          title="Add text label (T)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M11 5H7a2 2 0 00-2 2v11a2 2 0 002 2h9a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          {labelCount > 0 && (
            <span className="bg-neutral-20 text-text-secondary text-caption-bold px-1.5 py-0.5 rounded">
              {labelCount}
            </span>
          )}
        </button>

        {/* Settings Button */}
        {activeTool && (
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-3 py-2.5 border-l border-border-divider hover:bg-background-secondary transition-colors rounded-r-lg relative"
            title={`${getSettingsTitle()}`}
          >
            <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            {getSettingsCount() > 0 && activeTool === 'label' && (
              <span className="absolute -top-1 -right-1 bg-background-brand text-text-on-brand text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {getSettingsCount()}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Dynamic Settings Panel */}
      {showSettings && activeTool && (
        <div className="absolute bottom-full left-0 mb-2 bg-background-primary border border-border-divider rounded-lg shadow-lg p-4 w-80 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-compact-bold text-text-primary">{getSettingsTitle()}</h3>
            {getSettingsCount() > 0 && activeTool === 'label' && (
              <span className="bg-background-brand text-text-on-brand text-xs px-2 py-1 rounded">
                {getSettingsCount()} selected
              </span>
            )}
          </div>
          {renderSettingsContent()}
        </div>
      )}
    </div>
    </>
  );
};

export default UnifiedToolbar; 