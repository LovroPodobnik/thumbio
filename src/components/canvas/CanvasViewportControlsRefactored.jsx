import React from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import * as Separator from '@radix-ui/react-separator';
import { MousePointer2, Hand, Minus, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { TOOLS } from '../../hooks/useToolState';

/**
 * Canvas Viewport Controls - Refactored
 * 
 * Clean, minimal component following React best practices:
 * - No business logic, pure UI component
 * - Uses tool state from hooks
 * - Proper accessibility and responsive design
 * - Easy to test and maintain
 * - Single responsibility: render viewport controls
 */

const ToolButton = ({ 
  icon: Icon, 
  isActive, 
  onClick, 
  tooltip, 
  className = "",
  ariaLabel 
}) => (
  <Tooltip.Root>
    <Tooltip.Trigger asChild>
      <button
        onClick={onClick}
        className={cn(
          "p-2 transition-colors",
          isActive
            ? 'bg-background-brand text-text-on-brand'
            : 'hover:bg-background-tertiary text-text-primary',
          className
        )}
        aria-label={ariaLabel}
      >
        <Icon className="w-4 h-4" />
      </button>
    </Tooltip.Trigger>
    <Tooltip.Portal>
      <Tooltip.Content 
        className="bg-text-primary text-background-primary text-xs px-2 py-1 rounded shadow-lg"
        sideOffset={5}
      >
        {tooltip}
        <Tooltip.Arrow className="fill-text-primary" />
      </Tooltip.Content>
    </Tooltip.Portal>
  </Tooltip.Root>
);

const ZoomButton = ({ 
  icon: Icon, 
  onClick, 
  tooltip, 
  disabled = false,
  className = "",
  ariaLabel
}) => (
  <Tooltip.Root>
    <Tooltip.Trigger asChild>
      <button
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "p-2 hover:bg-background-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
          className
        )}
        aria-label={ariaLabel}
      >
        <Icon className="w-4 h-4 text-text-primary" />
      </button>
    </Tooltip.Trigger>
    <Tooltip.Portal>
      <Tooltip.Content 
        className="bg-text-primary text-background-primary text-xs px-2 py-1 rounded shadow-lg"
        sideOffset={5}
      >
        {tooltip}
        <Tooltip.Arrow className="fill-text-primary" />
      </Tooltip.Content>
    </Tooltip.Portal>
  </Tooltip.Root>
);

const ZoomDisplay = ({ 
  zoomLevel, 
  onZoomToFit, 
  formatZoomLevel 
}) => (
  <Tooltip.Root>
    <Tooltip.Trigger asChild>
      <button
        onClick={onZoomToFit}
        className="px-3 py-2 text-sm font-medium text-text-primary hover:bg-background-tertiary transition-colors min-w-[60px]"
        aria-label={`Current zoom: ${formatZoomLevel(zoomLevel)}. Click to fit to screen`}
      >
        {formatZoomLevel(zoomLevel)}
      </button>
    </Tooltip.Trigger>
    <Tooltip.Portal>
      <Tooltip.Content 
        className="bg-text-primary text-background-primary text-xs px-2 py-1 rounded shadow-lg"
        sideOffset={5}
      >
        Click to fit to screen (0)
        <Tooltip.Arrow className="fill-text-primary" />
      </Tooltip.Content>
    </Tooltip.Portal>
  </Tooltip.Root>
);

const CanvasViewportControlsRefactored = ({
  // Tool state
  activeTool,
  isSpacePanning,
  toolActions,
  
  // Zoom state
  zoomLevel = 100,
  zoomActions,
  minZoom = 10,
  maxZoom = 500,
  
  // Layout
  className = ""
}) => {
  
  const formatZoomLevel = (zoom) => Math.round(zoom) + '%';
  
  const isAtMinZoom = zoomLevel <= minZoom;
  const isAtMaxZoom = zoomLevel >= maxZoom;

  return (
    <Tooltip.Provider>
      <div 
        className={cn(
          "absolute bottom-4 right-4 z-30 bg-background-secondary border border-border-divider rounded-lg shadow-lg",
          className
        )}
        role="toolbar"
        aria-label="Canvas viewport controls"
      >
        <div className="flex items-center">
          
          {/* Tool Selection Section */}
          <div className="flex bg-background-secondary rounded-l-lg" role="group" aria-label="Tool selection">
            <ToolButton
              icon={MousePointer2}
              isActive={activeTool === TOOLS.SELECTION}
              onClick={toolActions.selectSelectionTool}
              tooltip="Selection tool (V)"
              ariaLabel="Select selection tool"
              className="rounded-l-lg"
            />

            <Separator.Root 
              className="w-px h-6 bg-border-divider" 
              orientation="vertical" 
              aria-hidden="true"
            />

            <ToolButton
              icon={Hand}
              isActive={activeTool === TOOLS.HAND || isSpacePanning}
              onClick={toolActions.selectHandTool}
              tooltip="Hand tool (H) • Space to pan temporarily"
              ariaLabel="Select hand tool"
            />
          </div>

          <Separator.Root 
            className="w-px h-8 bg-border-divider" 
            orientation="vertical" 
            aria-hidden="true"
          />

          {/* Zoom Controls Section */}
          <div className="flex items-center bg-background-secondary rounded-r-lg" role="group" aria-label="Zoom controls">
            <ZoomButton
              icon={Minus}
              onClick={zoomActions.zoomOut}
              tooltip="Zoom out (-)"
              ariaLabel="Zoom out"
              disabled={isAtMinZoom}
            />

            <ZoomDisplay
              zoomLevel={zoomLevel}
              onZoomToFit={zoomActions.zoomToFit}
              formatZoomLevel={formatZoomLevel}
            />

            <ZoomButton
              icon={Plus}
              onClick={zoomActions.zoomIn}
              tooltip="Zoom in (+)"
              ariaLabel="Zoom in"
              disabled={isAtMaxZoom}
              className="rounded-r-lg"
            />
          </div>
        </div>
      </div>
    </Tooltip.Provider>
  );
};

export default CanvasViewportControlsRefactored;
