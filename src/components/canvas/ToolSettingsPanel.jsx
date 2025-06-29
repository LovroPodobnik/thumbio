import React, { useState, useEffect } from 'react';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import * as Separator from '@radix-ui/react-separator';
import { MessageCircle, Edit3, Type, Eraser, X } from 'lucide-react';
import { LABEL_SIZES, DEFAULT_LABEL_STYLE } from './TextLabelRenderer';
import { cn } from '../../lib/utils';

const ToolSettingsPanel = ({
  // Active tool
  activeTool, // 'comment', 'drawing', 'label', or null
  
  // Comment props
  commentCount,
  
  // Drawing props
  drawingCount,
  onClearAllDrawings,
  onDrawingSettingsChange,
  
  // Label props
  labelCount,
  onLabelSettingsChange,
  currentSettings = DEFAULT_LABEL_STYLE,
  selectedLabelIds = new Set(),
  onApplySettingsToSelected,
  selectedLabelText,
  onLabelTextChange,
  
  // Panel control
  onClose
}) => {
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

  const handleDrawingSettingsChange = (newSettings) => {
    if (newSettings.isEraserMode !== undefined) setIsEraserMode(newSettings.isEraserMode);
    if (newSettings.brushSize !== undefined) setBrushSize(newSettings.brushSize);
    if (newSettings.brushColor !== undefined) setBrushColor(newSettings.brushColor);
    
    onDrawingSettingsChange({
      isEraserMode: newSettings.isEraserMode ?? isEraserMode,
      brushSize: newSettings.brushSize ?? brushSize,
      brushColor: newSettings.brushColor ?? brushColor
    });
  };

  const handleLabelSettingsChange = (newSettings) => {
    setLabelSettings(newSettings);
    onLabelSettingsChange(newSettings);
  };

  const colorPresets = [
    { name: 'Black', value: '#1f2937' },
    { name: 'Gray', value: '#6b7280' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Green', value: '#10b981' },
    { name: 'Emerald', value: '#059669' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Yellow', value: '#f59e0b' },
    { name: 'Teal', value: '#14b8a6' },
    { name: 'Indigo', value: '#6366f1' }
  ];


  const getToolTitle = () => {
    switch (activeTool) {
      case 'comment': return 'Comments';
      case 'drawing': return 'Draw';
      case 'label': return 'Text';
      default: return 'Tool Settings';
    }
  };

  const getToolIcon = () => {
    switch (activeTool) {
      case 'comment': return <MessageCircle className="w-4 h-4" />;
      case 'drawing': return isEraserMode ? <Eraser className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />;
      case 'label': return <Type className="w-4 h-4" />;
      default: return null;
    }
  };

  const renderContent = () => {
    switch (activeTool) {
      case 'comment':
        return (
          <div className="space-y-4">
            <div className="text-center py-6">
              <MessageCircle className="w-12 h-12 text-text-secondary mx-auto mb-3" />
              <p className="text-body text-text-secondary mb-1">Click anywhere on the canvas to add a comment</p>
              {commentCount > 0 && (
                <p className="text-caption text-text-tertiary">{commentCount} comment{commentCount !== 1 ? 's' : ''} added</p>
              )}
            </div>
          </div>
        );

      case 'drawing':
        return (
          <div className="space-y-6">
            {/* Tool Selection */}
            <div>
              <label className="text-caption-bold text-text-secondary mb-3 block">Tool</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleDrawingSettingsChange({ isEraserMode: false })}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 rounded-md text-caption-bold transition-colors",
                    !isEraserMode
                      ? 'bg-background-brand text-text-on-brand'
                      : 'bg-background-secondary hover:bg-background-tertiary text-text-primary'
                  )}
                >
                  <Edit3 className="w-4 h-4" />
                  Pen
                </button>
                <button
                  onClick={() => handleDrawingSettingsChange({ isEraserMode: true })}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 rounded-md text-caption-bold transition-colors",
                    isEraserMode
                      ? 'bg-background-brand text-text-on-brand'
                      : 'bg-background-secondary hover:bg-background-tertiary text-text-primary'
                  )}
                >
                  <Eraser className="w-4 h-4" />
                  Eraser
                </button>
              </div>
            </div>

            {/* Color Palette */}
            <div>
              <label className="text-caption-bold text-text-secondary mb-3 block">Color</label>
              <div className="grid grid-cols-4 gap-2">
                {colorPresets.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => handleDrawingSettingsChange({ brushColor: color.value })}
                    className={cn(
                      "w-10 h-10 rounded-full border-2 transition-all hover:scale-105",
                      brushColor === color.value 
                        ? 'border-background-brand ring-2 ring-background-brand/20' 
                        : 'border-border-divider hover:border-border-primary',
                      isEraserMode && 'opacity-50'
                    )}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                    disabled={isEraserMode}
                  />
                ))}
              </div>
              {isEraserMode && (
                <p className="text-xs text-text-tertiary mt-2">Color not available in eraser mode</p>
              )}
            </div>

            {/* Brush Size */}
            <div>
              <label className="text-caption-bold text-text-secondary mb-3 block">
                Size
              </label>
              <div className="space-y-3">
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={brushSize}
                  onChange={(e) => handleDrawingSettingsChange({ brushSize: parseInt(e.target.value) })}
                  className="w-full h-2 bg-background-secondary rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-background-brand [&::-webkit-slider-thumb]:cursor-pointer"
                />
                <div className="flex justify-center">
                  <div 
                    className="rounded-full bg-text-primary"
                    style={{ 
                      width: `${Math.max(brushSize, 4)}px`, 
                      height: `${Math.max(brushSize, 4)}px` 
                    }}
                  />
                </div>
              </div>
            </div>


            {/* Clear Action */}
            {drawingCount > 0 && (
              <>
                <Separator.Root className="bg-border-divider" />
                <button
                  onClick={onClearAllDrawings}
                  className="w-full px-3 py-2.5 text-caption-bold text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  Clear All Drawings ({drawingCount})
                </button>
              </>
            )}
          </div>
        );

      case 'label':
        return (
          <div className="space-y-6">
            {selectedLabelIds.size === 1 && (
              <div>
                <label className="text-caption-bold text-text-secondary mb-2 block">Text</label>
                <input
                  type="text"
                  value={selectedLabelText}
                  onChange={(e) => onLabelTextChange(e.target.value)}
                  className="w-full px-3 py-2 bg-background-secondary border border-border-divider rounded-md text-text-primary focus:outline-none focus:border-background-brand"
                />
              </div>
            )}
            {selectedLabelIds.size > 0 && (
              <div className="bg-background-secondary rounded-md p-3">
                <p className="text-caption text-text-secondary">
                  Changes will be applied to {selectedLabelIds.size} selected label{selectedLabelIds.size > 1 ? 's' : ''}
                </p>
              </div>
            )}

            {/* Text Size */}
            <div>
              <label className="text-caption-bold text-text-secondary mb-3 block">Size</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(LABEL_SIZES).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => handleLabelSettingsChange({ ...labelSettings, size: key })}
                    className={cn(
                      "px-3 py-2.5 rounded-md text-caption-bold transition-colors text-center",
                      labelSettings.size === key
                        ? 'bg-background-brand text-text-on-brand'
                        : 'bg-background-secondary hover:bg-background-tertiary text-text-primary'
                    )}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selection */}
            <div>
              <label className="text-caption-bold text-text-secondary mb-3 block">Color</label>
              <div className="grid grid-cols-4 gap-2">
                {colorPresets.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => handleLabelSettingsChange({ ...labelSettings, color: color.value })}
                    className={cn(
                      "w-10 h-10 rounded-full border-2 transition-all hover:scale-105",
                      labelSettings.color === color.value 
                        ? 'border-background-brand ring-2 ring-background-brand/20' 
                        : 'border-border-divider hover:border-border-primary'
                    )}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Apply to Selected */}
            {selectedLabelIds.size > 0 && (
              <>
                <Separator.Root className="bg-border-divider" />
                <button
                  onClick={onApplySettingsToSelected}
                  className="w-full px-3 py-2.5 text-caption-bold bg-background-brand text-text-on-brand rounded-md hover:bg-background-brand/90 transition-colors"
                >
                  Apply to Selected ({selectedLabelIds.size})
                </button>
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (!activeTool) return null;

  return (
    <div className={cn(
      "fixed bottom-4 right-4 w-80 max-h-[calc(100vh-8rem)] z-40",
      "bg-background-primary border border-border-divider rounded-lg shadow-lg",
      "animate-in slide-in-from-right-2 fade-in-0 duration-200"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border-divider">
        <div className="flex items-center gap-2">
          {getToolIcon()}
          <h3 className="text-compact-bold text-text-primary">{getToolTitle()}</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-background-secondary rounded transition-colors"
        >
          <X className="w-4 h-4 text-text-secondary" />
        </button>
      </div>

      {/* Content */}
      <ScrollArea.Root className="h-full">
        <ScrollArea.Viewport className="p-4">
          {renderContent()}
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar 
          className="flex select-none touch-none p-0.5 bg-transparent transition-colors duration-[160ms] ease-out hover:bg-background-secondary data-[orientation=vertical]:w-2.5"
          orientation="vertical"
        >
          <ScrollArea.Thumb className="flex-1 bg-border-secondary rounded-full hover:bg-border-primary transition-colors" />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>
    </div>
  );
};

export default ToolSettingsPanel;
