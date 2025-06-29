import React from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import * as Separator from '@radix-ui/react-separator';
import { MessageCircle, Edit3, Type, Undo2, Redo2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import ConnectedUsers from './ConnectedUsers';

const TopToolbar = ({
  // Comment props
  isAddingComment,
  onToggleAddComment,
  commentCount,
  
  // Drawing props
  isDrawingMode,
  onToggleDrawingMode,
  drawingCount,
  
  // Label props
  isAddingLabel,
  onToggleAddLabel,
  labelCount,
  
  // Multiplayer props
  isMultiplayerConnected,
  multiplayerUserCount,
  currentMultiplayerUser,
  remoteCursors,
  onToggleMultiplayer,
  isMultiplayerEnabled,
  
  // History props
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  lastAction,
  nextAction,
  
  // Sidebar props
  sidebarOpen = false,
  sidebarWidth = 240,
  showContentImportSidebar = false
}) => {

  // Calculate left offset based on both sidebar states
  const mainSidebarWidth = sidebarOpen ? sidebarWidth : 60; // 60px is collapsed width
  const contentImportWidth = showContentImportSidebar ? 380 : 0; // 380px is content import sidebar width
  const leftOffset = mainSidebarWidth + contentImportWidth;

  return (
    <Tooltip.Provider>
      <div 
        className="absolute top-0 right-0 z-30 bg-background-primary border-b border-border-divider transition-all duration-300 ease-out"
        style={{ left: `${leftOffset}px` }}
      >
        <div className="flex items-center justify-between px-4 py-2">
          
          {/* Left Section - Undo/Redo Controls */}
          <div className="flex items-center gap-2">
            {/* Undo/Redo Controls */}
            <div className="flex bg-background-secondary rounded-lg border border-border-divider">
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button
                    onClick={onUndo}
                    disabled={!canUndo}
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
                    {`Undo${lastAction ? ` (${lastAction})` : ''}`}
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
                    onClick={onRedo}
                    disabled={!canRedo}
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
                    {`Redo${nextAction ? ` (${nextAction})` : ''}`}
                    <Tooltip.Arrow className="fill-text-primary" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </div>
          </div>

          {/* Center Section - Tools */}
          <div className="flex items-center bg-background-secondary rounded-lg border border-border-divider">
            {/* Comment Tool */}
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button
                  onClick={onToggleAddComment}
                  className={cn(
                    "px-3 py-2 flex items-center gap-2 rounded-l-lg transition-colors",
                    isAddingComment
                      ? 'bg-background-brand text-text-on-brand'
                      : 'hover:bg-background-tertiary text-text-primary'
                  )}
                >
                  <MessageCircle className="w-4 h-4" />
                  {commentCount > 0 && (
                    <span className={cn(
                      "text-xs px-1.5 py-0.5 rounded",
                      isAddingComment 
                        ? "bg-background-primary/20 text-text-on-brand" 
                        : "bg-neutral-20 text-text-secondary"
                    )}>
                      {commentCount}
                    </span>
                  )}
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content 
                  className="bg-text-primary text-background-primary text-xs px-2 py-1 rounded shadow-lg"
                  sideOffset={5}
                >
                  Add comment (C)
                  <Tooltip.Arrow className="fill-text-primary" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>

            <Separator.Root 
              className="w-px h-6 bg-border-divider" 
              orientation="vertical" 
            />

            {/* Drawing Tool */}
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button
                  onClick={onToggleDrawingMode}
                  className={cn(
                    "px-3 py-2 flex items-center gap-2 transition-colors",
                    isDrawingMode
                      ? 'bg-background-brand text-text-on-brand'
                      : 'hover:bg-background-tertiary text-text-primary'
                  )}
                >
                  <Edit3 className="w-4 h-4" />
                  {drawingCount > 0 && (
                    <span className={cn(
                      "text-xs px-1.5 py-0.5 rounded",
                      isDrawingMode 
                        ? "bg-background-primary/20 text-text-on-brand" 
                        : "bg-neutral-20 text-text-secondary"
                    )}>
                      {drawingCount}
                    </span>
                  )}
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content 
                  className="bg-text-primary text-background-primary text-xs px-2 py-1 rounded shadow-lg"
                  sideOffset={5}
                >
                  Draw on canvas (P)
                  <Tooltip.Arrow className="fill-text-primary" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>

            <Separator.Root 
              className="w-px h-6 bg-border-divider" 
              orientation="vertical" 
            />

            {/* Label Tool */}
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button
                  onClick={onToggleAddLabel}
                  className={cn(
                    "px-3 py-2 flex items-center gap-2 rounded-r-lg transition-colors",
                    isAddingLabel
                      ? 'bg-background-brand text-text-on-brand'
                      : 'hover:bg-background-tertiary text-text-primary'
                  )}
                >
                  <Type className="w-4 h-4" />
                  {labelCount > 0 && (
                    <span className={cn(
                      "text-xs px-1.5 py-0.5 rounded",
                      isAddingLabel 
                        ? "bg-background-primary/20 text-text-on-brand" 
                        : "bg-neutral-20 text-text-secondary"
                    )}>
                      {labelCount}
                    </span>
                  )}
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content 
                  className="bg-text-primary text-background-primary text-xs px-2 py-1 rounded shadow-lg"
                  sideOffset={5}
                >
                  Add text label (T)
                  <Tooltip.Arrow className="fill-text-primary" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>

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
      </div>
    </Tooltip.Provider>
  );
};

export default TopToolbar;