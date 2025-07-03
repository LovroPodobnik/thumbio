import React, { useState, useRef, useEffect } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import { ChevronRight, Plus, Settings, Layers, Activity } from 'lucide-react';
import { cn } from '../../lib/utils';

// Import platform system for status monitoring
import { ensureInitialized, getPlatformSystemStatus } from '../../services/platforms/index.js';

const MainSidebar = ({
  isOpen = false,
  onToggle,
  width = 240,
  onWidthChange,
  minWidth = 200,
  maxWidth = 400,
  // Add content callback - triggers multiplatform import
  onAddContent
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [currentWidth, setCurrentWidth] = useState(width);
  const [platformStatus, setPlatformStatus] = useState(null);
  const sidebarRef = useRef(null);
  const resizeHandleRef = useRef(null);

  // Collapsed width matches the design image
  const collapsedWidth = 60;

  useEffect(() => {
    setCurrentWidth(isOpen ? width : collapsedWidth);
  }, [isOpen, width]);

  // Initialize platform system and monitor status
  useEffect(() => {
    try {
      ensureInitialized();
      const status = getPlatformSystemStatus();
      setPlatformStatus(status);
    } catch (error) {
      console.error('[MainSidebar] Failed to initialize platform system:', error);
      setPlatformStatus({ 
        total: 0, 
        enabled: 0, 
        disabled: 0, 
        errors: ['Platform system initialization failed'], 
        warnings: [] 
      });
    }
  }, []);

  // Resize functionality
  const handleMouseDown = (e) => {
    if (!isOpen) return;
    
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = currentWidth;

    const handleMouseMove = (e) => {
      const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + (e.clientX - startX)));
      setCurrentWidth(newWidth);
      onWidthChange?.(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Prevent text selection during resize
  useEffect(() => {
    if (isResizing) {
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
    } else {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }

    return () => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isResizing]);


  // Create the Thumbio logo component - Dark theme design
  const ThumbioLogo = ({ collapsed = false }) => (
    <div className="flex items-center gap-2.5">
      {/* Logo Icon - Dark theme with bright accent */}
      <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
        <Layers className="w-5 h-5 text-white" strokeWidth={2.5} />
      </div>
      {/* Logo Text - high contrast white */}
      {!collapsed && (
        <span className="text-2xl font-bold text-white tracking-tight">
          Thumbio
        </span>
      )}
    </div>
  );

  return (
    <Tooltip.Provider>
      <div
        ref={sidebarRef}
        className={cn(
          "fixed left-0 top-0 bottom-0 z-40 bg-gray-900 border-r border-gray-700 transition-all duration-300 ease-out",
          "flex flex-col",
          isResizing && "transition-none"
        )}
        style={{ width: `${currentWidth}px` }}
      >
        {/* Header Section - Dark theme design */}
        <div className={cn(
          "flex items-center justify-between border-b border-gray-700",
          isOpen ? "px-6 py-5" : "px-3 py-5"
        )}>
          {isOpen ? (
            <>
              {/* Thumbio Logo */}
              <ThumbioLogo collapsed={false} />
              
              {/* Collapse Button */}
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button
                    onClick={onToggle}
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
                    aria-label="Collapse sidebar"
                  >
                    <ChevronRight className="w-5 h-5 rotate-180" />
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content 
                    className="bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg border border-gray-600"
                    sideOffset={5}
                    side="right"
                  >
                    Collapse sidebar
                    <Tooltip.Arrow className="fill-gray-800" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </>
          ) : (
            <>
              {/* Collapsed Header - FIXED: exact same container as other icons */}
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <div className="w-8 h-8 mx-auto">
                    <button
                      onClick={onToggle}
                      className="w-full h-full rounded-lg bg-blue-600 flex items-center justify-center hover:bg-blue-500 transition-colors shadow-sm"
                      aria-label="Expand sidebar"
                    >
                      <Layers className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </button>
                  </div>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content 
                    className="bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg border border-gray-600"
                    sideOffset={5}
                    side="right"
                  >
                    Expand sidebar
                    <Tooltip.Arrow className="fill-gray-800" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </>
          )}
        </div>

        {/* Scrollable Content - FIXED: consistent padding for perfect alignment */}
        <ScrollArea.Root className="flex-1 overflow-hidden">
          <ScrollArea.Viewport className={cn("h-full w-full", isOpen ? "px-6 py-6" : "px-3 py-5")}>
            {/* Add Button Section - FIXED: exact same container structure */}
            <div className={cn(isOpen ? "mb-6" : "mb-3")}>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  {isOpen ? (
                    <button
                      onClick={onAddContent}
                      className="w-full px-3.5 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-all flex items-center gap-1.5 shadow-sm relative"
                    >
                      <Plus className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Add Content</span>
                      {/* Platform status indicator */}
                      {platformStatus && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full border border-white">
                          {platformStatus.enabled > 0 ? (
                            <div className="w-full h-full bg-green-500 rounded-full" />
                          ) : (
                            <div className="w-full h-full bg-yellow-500 rounded-full" />
                          )}
                        </div>
                      )}
                    </button>
                  ) : (
                    <div className="w-8 h-8 mx-auto relative">
                      <button
                        onClick={onAddContent}
                        className="w-full h-full bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-all flex items-center justify-center shadow-sm"
                      >
                        <Plus className="w-4 h-4 flex-shrink-0" />
                      </button>
                      {/* Platform status indicator for collapsed mode */}
                      {platformStatus && (
                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-gray-900">
                          {platformStatus.enabled > 0 ? (
                            <div className="w-full h-full bg-green-500 rounded-full" />
                          ) : (
                            <div className="w-full h-full bg-yellow-500 rounded-full" />
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content 
                    className="bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg border border-gray-600"
                    sideOffset={5}
                    side="right"
                  >
                    <div className="space-y-1">
                      <div>Add new content</div>
                      {platformStatus && (
                        <div className="text-gray-400">
                          {platformStatus.enabled} platform{platformStatus.enabled !== 1 ? 's' : ''} available
                        </div>
                      )}
                    </div>
                    <Tooltip.Arrow className="fill-gray-800" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </div>






          </ScrollArea.Viewport>
          
          {/* Scrollbar */}
          <ScrollArea.Scrollbar 
            className="flex select-none touch-none p-0.5 bg-transparent transition-colors duration-[160ms] ease-out hover:bg-background-secondary data-[orientation=vertical]:w-2.5"
            orientation="vertical"
          >
            <ScrollArea.Thumb className="flex-1 bg-border-secondary rounded-full hover:bg-border-primary transition-colors" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>

        {/* Fixed Bottom Section - Settings */}
        <div className={cn(
          "border-t border-gray-700 bg-gray-900",
          isOpen ? "px-6 py-4" : "px-3 py-4"
        )}>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              {isOpen ? (
                <button
                  className="w-full px-3.5 py-2.5 text-sm font-medium bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-all flex items-center gap-1.5 text-gray-300 hover:text-white"
                >
                  <Settings className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span>Settings</span>
                </button>
              ) : (
                <div className="w-8 h-8 mx-auto">
                  <button
                    className="w-full h-full bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-all flex items-center justify-center"
                  >
                    <Settings className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </button>
                </div>
              )}
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content 
                className="bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg border border-gray-600"
                sideOffset={5}
                side="right"
              >
                Open settings
                <Tooltip.Arrow className="fill-gray-800" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </div>

        {/* Resize Handle */}
        {isOpen && (
          <div
            ref={resizeHandleRef}
            onMouseDown={handleMouseDown}
            className={cn(
              "absolute top-0 right-0 bottom-0 w-1 cursor-col-resize group",
              "hover:bg-blue-500/30 transition-colors"
            )}
          >
            <div className="absolute top-1/2 right-0 w-3 h-12 -translate-y-1/2 translate-x-1 bg-transparent group-hover:bg-blue-500/20 rounded-r transition-colors" />
          </div>
        )}
      </div>
    </Tooltip.Provider>
  );
};

export default MainSidebar;