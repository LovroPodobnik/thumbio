import React from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import * as Separator from '@radix-ui/react-separator';
import { 
  MousePointer2, 
  Hand, 
  Pen, 
  Square, 
  Circle, 
  Type, 
  ArrowRight,
  Undo2, 
  Redo2,
  Lock,
  Unlock,
  BarChart3,
  MessageCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';
import ConnectedUsers from './ConnectedUsers';

const TldrawTopToolbar = ({
  // tldraw editor reference
  editor,
  
  // Selection props
  selectedCount = 0,
  onToggleLock,
  onToggleMetrics,
  
  // Multiplayer props
  isMultiplayerConnected,
  multiplayerUserCount,
  currentMultiplayerUser,
  remoteCursors,
  onToggleMultiplayer,
  isMultiplayerEnabled,
  
  // Sidebar props
  sidebarOpen = false,
  sidebarWidth = 240,
  showContentImportSidebar = false
}) => {

  // Get current tool from tldraw
  const currentTool = editor?.getCurrentToolId() || 'select';

  // Tool handlers
  const setTool = (toolId) => {
    if (editor) {
      editor.setCurrentTool(toolId);
    }
  };

  const handleUndo = () => {
    if (editor?.canUndo) {
      editor.undo();
    }
  };

  const handleRedo = () => {
    if (editor?.canRedo) {
      editor.redo();
    }
  };

  // Calculate left offset based on sidebar states
  const mainSidebarWidth = sidebarOpen ? sidebarWidth : 60;
  const contentImportWidth = showContentImportSidebar ? 380 : 0;
  const leftOffset = mainSidebarWidth + contentImportWidth;

  // Tool button component
  const ToolButton = ({ toolId, icon: Icon, label, shortcut, isActive }) => (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button
          onClick={() => setTool(toolId)}
          className={cn(
            "p-2 transition-colors",
            isActive
              ? 'bg-background-brand text-text-on-brand'
              : 'hover:bg-background-tertiary text-text-primary'
          )}
        >
          <Icon className="w-4 h-4" />
        </button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content 
          className="bg-text-primary text-background-primary text-xs px-2 py-1 rounded shadow-lg"
          sideOffset={5}
        >
          {label} {shortcut && `(${shortcut})`}
          <Tooltip.Arrow className="fill-text-primary" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );

  // Selection action button component
  const ActionButton = ({ onClick, icon: Icon, label, disabled = false, variant = 'default' }) => (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button
          onClick={onClick}
          disabled={disabled}
          className={cn(
            "p-2 transition-colors",
            disabled 
              ? 'opacity-50 cursor-not-allowed text-text-tertiary'
              : variant === 'primary'
                ? 'bg-background-brand text-text-on-brand hover:bg-background-brand/90'
                : 'hover:bg-background-tertiary text-text-primary'
          )}
        >
          <Icon className="w-4 h-4" />
        </button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content 
          className="bg-text-primary text-background-primary text-xs px-2 py-1 rounded shadow-lg"
          sideOffset={5}
        >
          {label}
          <Tooltip.Arrow className="fill-text-primary" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );

  return (
    <Tooltip.Provider>
      <div 
        className="absolute top-0 right-0 z-30 bg-background-primary border-b border-border-divider transition-all duration-300 ease-out"
        style={{ left: `${leftOffset}px` }}
      >
        <div className="flex items-center justify-between px-4 py-2">
          
          {/* Left Section - Undo/Redo Controls */}
          <div className="flex items-center gap-2">
            <div className="flex bg-background-secondary rounded-lg border border-border-divider">
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button
                    onClick={handleUndo}
                    disabled={!editor?.canUndo}
                    className="p-2 hover:bg-background-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-l-lg"
                  >
                    <Undo2 className="w-4 h-4 text-text-primary" />
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content 
                    className="bg-text-primary text-background-primary text-xs px-2 py-1 rounded shadow-lg"
                    sideOffset={5}
                  >
                    Undo (Cmd+Z)
                    <Tooltip.Arrow className="fill-text-primary" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
              
              <Separator.Root 
                className="w-px h-6 bg-border-divider" 
                orientation="vertical" 
              />
              
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button
                    onClick={handleRedo}
                    disabled={!editor?.canRedo}
                    className="p-2 hover:bg-background-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-r-lg"
                  >
                    <Redo2 className="w-4 h-4 text-text-primary" />
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content 
                    className="bg-text-primary text-background-primary text-xs px-2 py-1 rounded shadow-lg"
                    sideOffset={5}
                  >
                    Redo (Cmd+Shift+Z)
                    <Tooltip.Arrow className="fill-text-primary" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </div>
          </div>

          {/* Center Section - tldraw Tools */}
          <div className="flex items-center gap-2">
            
            {/* Main Tools */}
            <div className="flex bg-background-secondary rounded-lg border border-border-divider">
              <ToolButton 
                toolId="select" 
                icon={MousePointer2} 
                label="Select" 
                shortcut="V" 
                isActive={currentTool === 'select'}
              />
              
              <Separator.Root className="w-px h-6 bg-border-divider" orientation="vertical" />
              
              <ToolButton 
                toolId="hand" 
                icon={Hand} 
                label="Hand" 
                shortcut="H" 
                isActive={currentTool === 'hand'}
              />
              
              <Separator.Root className="w-px h-6 bg-border-divider" orientation="vertical" />
              
              <ToolButton 
                toolId="draw" 
                icon={Pen} 
                label="Draw" 
                shortcut="P" 
                isActive={currentTool === 'draw'}
              />
              
              <Separator.Root className="w-px h-6 bg-border-divider" orientation="vertical" />
              
              <ToolButton 
                toolId="text" 
                icon={Type} 
                label="Text" 
                shortcut="T" 
                isActive={currentTool === 'text'}
              />
            </div>

            {/* Shape Tools */}
            <div className="flex bg-background-secondary rounded-lg border border-border-divider">
              <ToolButton 
                toolId="rectangle" 
                icon={Square} 
                label="Rectangle" 
                shortcut="R" 
                isActive={currentTool === 'rectangle'}
              />
              
              <Separator.Root className="w-px h-6 bg-border-divider" orientation="vertical" />
              
              <ToolButton 
                toolId="ellipse" 
                icon={Circle} 
                label="Ellipse" 
                shortcut="E" 
                isActive={currentTool === 'ellipse'}
              />
              
              <Separator.Root className="w-px h-6 bg-border-divider" orientation="vertical" />
              
              <ToolButton 
                toolId="arrow" 
                icon={ArrowRight} 
                label="Arrow" 
                shortcut="A" 
                isActive={currentTool === 'arrow'}
              />
            </div>

            {/* Selection Actions (only show when items are selected) */}
            {selectedCount > 0 && (
              <div className="flex bg-background-secondary rounded-lg border border-border-divider">
                <ActionButton 
                  onClick={onToggleLock}
                  icon={Lock}
                  label={`Toggle Lock (${selectedCount} selected)`}
                  variant="primary"
                />
                
                <Separator.Root className="w-px h-6 bg-border-divider" orientation="vertical" />
                
                <ActionButton 
                  onClick={onToggleMetrics}
                  icon={BarChart3}
                  label={`Toggle Metrics (${selectedCount} selected)`}
                />
              </div>
            )}
          </div>

          {/* Right Section - Connected Users */}
          <div className="flex items-center">
            <ConnectedUsers
              isConnected={isMultiplayerConnected}
              userCount={multiplayerUserCount}
              currentUser={currentMultiplayerUser}
              remoteCursors={remoteCursors}
              onToggle={onToggleMultiplayer}
              isEnabled={isMultiplayerEnabled}
            />
          </div>
        </div>

        {/* Selection Info Bar */}
        {selectedCount > 0 && (
          <div className="px-4 py-2 bg-background-secondary border-t border-border-divider">
            <div className="flex items-center gap-4 text-sm text-text-secondary">
              <span>{selectedCount} thumbnail{selectedCount !== 1 ? 's' : ''} selected</span>
              <span>•</span>
              <span>Use tools above or keyboard shortcuts</span>
              <span>•</span>
              <span>Delete key to remove</span>
            </div>
          </div>
        )}
      </div>
    </Tooltip.Provider>
  );
};

export default TldrawTopToolbar;