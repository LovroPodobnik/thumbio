import React from 'react';
import { BarChart3, Eye, EyeOff, Sparkles } from 'lucide-react';

const ThumbnailActions = ({ 
  thumbnail,
  position,
  viewportTransform,
  onInfoClick,
  onToggleVisibility,
  onCritiqueClick,
  isLocked
}) => {
  // Calculate position for action buttons (centered vertically, just outside the bounds)
  const buttonX = position.x + 320 + 8; // thumbnail width + 8px gap
  const buttonY = position.y + (244 / 2) - 54; // Center vertically: thumbnail height/2 - half of buttons height
  
  return (
    <div 
      className="absolute z-30 flex flex-col gap-1.5"
      style={{
        left: `${buttonX * viewportTransform.scale + viewportTransform.x}px`,
        top: `${buttonY * viewportTransform.scale + viewportTransform.y}px`,
        transformOrigin: 'top left'
      }}
    >
      {/* Info button */}
      <button
        onClick={onInfoClick}
        className="w-8 h-8 bg-background-primary border border-border-divider rounded flex items-center 
                   justify-center hover:bg-background-secondary transition-colors"
        title="View Analytics"
      >
        <BarChart3 className="w-4 h-4 text-text-secondary hover:text-text-primary" />
      </button>
      
      {/* Visibility toggle */}
      <button
        onClick={onToggleVisibility}
        className="w-8 h-8 bg-background-primary border border-border-divider rounded flex items-center 
                   justify-center hover:bg-background-secondary transition-colors"
        title={isLocked ? "Restore Full Visibility" : "Reduce Visibility"}
      >
        {isLocked ? (
          <EyeOff className="w-4 h-4 text-text-tertiary" />
        ) : (
          <Eye className="w-4 h-4 text-text-secondary" />
        )}
      </button>

      {/* AI Art-Director button */}
      <button
        onClick={onCritiqueClick}
        className="w-8 h-8 bg-background-primary border border-border-divider rounded flex items-center
                   justify-center hover:bg-background-secondary transition-colors"
        title="AI Art-Director"
      >
        <Sparkles className="w-4 h-4 text-text-secondary" />
      </button>
    </div>
  );
};

export default ThumbnailActions;
