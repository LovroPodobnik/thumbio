import React, { useState, useEffect } from 'react';
import { LABEL_SIZES, DEFAULT_LABEL_STYLE } from './TextLabelRenderer';

const TextLabelToolbar = ({ 
  isAddingLabel, 
  onToggleAddLabel, 
  labelCount,
  onLabelSettingsChange,
  currentSettings = DEFAULT_LABEL_STYLE,
  selectedLabelIds = new Set(),
  onApplySettingsToSelected
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(currentSettings);

  // Sync local settings with parent settings when they change
  useEffect(() => {
    setSettings(currentSettings);
  }, [currentSettings]);

  const handleSettingsChange = (newSettings) => {
    setSettings(newSettings);
    
    // Update global settings for new labels
    onLabelSettingsChange(newSettings);
    
    // Apply settings to currently selected labels
    if (selectedLabelIds.size > 0 && onApplySettingsToSelected) {
      onApplySettingsToSelected(newSettings);
    }
  };

  const colorPresets = [
    { name: 'Black', value: '#141414' },
    { name: 'Blue', value: '#2563EB' },
    { name: 'Red', value: '#FF3B30' },
    { name: 'Green', value: '#16A34A' },
    { name: 'Orange', value: '#F97316' },
    { name: 'Purple', value: '#9333EA' },
  ];

  return (
    <div className="absolute bottom-4 left-4 z-20">
      <div className="bg-background-primary border border-border-divider rounded-lg shadow-lg flex items-center">
        {/* Add Label Button */}
        <button
          onClick={onToggleAddLabel}
          className={`px-4 py-2.5 flex items-center gap-2 rounded-l-lg transition-colors ${
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
          <span className="text-compact-bold">Add Label</span>
          {labelCount > 0 && (
            <span className="bg-neutral-20 text-text-secondary text-caption-bold px-1.5 py-0.5 rounded">
              {labelCount}
            </span>
          )}
        </button>

        {/* Settings Button */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="px-3 py-2.5 border-l border-border-divider hover:bg-background-secondary transition-colors relative"
          title={selectedLabelIds.size > 0 ? `Label settings (${selectedLabelIds.size} selected)` : "Label settings"}
        >
          <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          {selectedLabelIds.size > 0 && (
            <span className="absolute -top-1 -right-1 bg-background-brand text-text-on-brand text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {selectedLabelIds.size}
            </span>
          )}
        </button>

        {/* Settings Panel */}
        {showSettings && (
          <div className="absolute bottom-full left-0 mb-2 bg-background-primary border border-border-divider rounded-lg shadow-lg p-4 w-80">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-compact-bold text-text-primary">Label Settings</h3>
              {selectedLabelIds.size > 0 && (
                <span className="bg-background-brand text-text-on-brand text-xs px-2 py-1 rounded">
                  {selectedLabelIds.size} selected
                </span>
              )}
            </div>
            {selectedLabelIds.size > 0 && (
              <div className="bg-background-secondary rounded p-2 mb-3">
                <p className="text-caption text-text-secondary">
                  Changes will be applied to {selectedLabelIds.size} selected label{selectedLabelIds.size > 1 ? 's' : ''}
                </p>
              </div>
            )}
            
            {/* Size Selection */}
            <div className="mb-4">
              <label className="text-caption-bold text-text-secondary mb-2 block">Size</label>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(LABEL_SIZES).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => handleSettingsChange({ ...settings, size: key })}
                    className={`px-3 py-1.5 rounded text-caption-bold transition-colors ${
                      settings.size === key
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
            <div className="mb-4">
              <label className="text-caption-bold text-text-secondary mb-2 block">Color</label>
              <div className="flex gap-2 flex-wrap">
                {colorPresets.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => handleSettingsChange({ ...settings, color: color.value })}
                    className={`w-8 h-8 rounded border-2 transition-all ${
                      settings.color === color.value
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
            <div className="mb-4">
              <label className="text-caption-bold text-text-secondary mb-2 block">Style</label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSettingsChange({ ...settings, bold: !settings.bold })}
                  className={`px-3 py-1.5 rounded text-caption-bold transition-colors ${
                    settings.bold
                      ? 'bg-background-brand text-text-on-brand'
                      : 'bg-background-secondary hover:bg-neutral-20 text-text-primary'
                  }`}
                >
                  <strong>Bold</strong>
                </button>
                <button
                  onClick={() => handleSettingsChange({ ...settings, bold: false })}
                  className={`px-3 py-1.5 rounded text-caption-bold transition-colors ${
                    !settings.bold
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
                value={parseFloat(settings.backgroundColor.match(/[\d.]+(?=\))/)?.[0] || 1) * 100}
                onChange={(e) => {
                  const opacity = e.target.value / 100;
                  handleSettingsChange({
                    ...settings,
                    backgroundColor: `rgba(255, 255, 255, ${opacity})`
                  });
                }}
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TextLabelToolbar;