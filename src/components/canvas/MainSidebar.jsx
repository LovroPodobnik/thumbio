import React, { useState, useRef, useEffect } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import * as Separator from '@radix-ui/react-separator';
import { ChevronRight, Plus, Settings, Home, Image, Users, Layers, Move, ZoomIn, MousePointer, MessageSquare } from 'lucide-react';
import { cn } from '../../lib/utils';

const MainSidebar = ({
  isOpen = false,
  onToggle,
  width = 240,
  onWidthChange,
  minWidth = 200,
  maxWidth = 400,
  // Add content callback
  onAddContent
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [currentWidth, setCurrentWidth] = useState(width);
  const sidebarRef = useRef(null);
  const resizeHandleRef = useRef(null);

  // Collapsed width matches the design image
  const collapsedWidth = 60;

  useEffect(() => {
    setCurrentWidth(isOpen ? width : collapsedWidth);
  }, [isOpen, width]);

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

  const navigationItems = [
    { id: 'home', icon: Home, label: 'Home', active: false },
    { id: 'thumbnails', icon: Image, label: 'Thumbnails', active: true },
    { id: 'team', icon: Users, label: 'Team', active: false },
  ];

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
                      className="w-full px-3.5 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Add Content</span>
                    </button>
                  ) : (
                    <div className="w-8 h-8 mx-auto">
                      <button
                        onClick={onAddContent}
                        className="w-full h-full bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-all flex items-center justify-center shadow-sm"
                      >
                        <Plus className="w-4 h-4 flex-shrink-0" />
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
                    Add new content
                    <Tooltip.Arrow className="fill-gray-800" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </div>

            {/* Navigation Items */}
            {isOpen && (
              <div className="mb-8">
                <h3 className="text-base font-medium text-white mb-3">Workspace</h3>
                <div className="space-y-1">
                  {navigationItems.map((item) => (
                    <button
                      key={item.id}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg border border-gray-700",
                        "transition-colors text-left",
                        item.active
                          ? "bg-gray-800 border-blue-500/50 text-white"
                          : "hover:bg-gray-800 text-gray-300 hover:text-white"
                      )}
                    >
                      <item.icon className={cn("w-4 h-4", item.active ? "text-blue-400" : "text-gray-400")} />
                      <span className="text-sm font-medium">{item.label}</span>
                      {item.active && (
                        <span className="ml-auto text-[11px] px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded font-medium">
                          ACTIVE
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Collapsed Navigation - FIXED: exact same container wrapper as logo */}
            {!isOpen && (
              <div className="space-y-3 mb-8">
                {navigationItems.map((item) => (
                  <Tooltip.Root key={item.id}>
                    <Tooltip.Trigger asChild>
                      <div className="w-8 h-8 mx-auto">
                        <button
                          className={cn(
                            "w-full h-full flex items-center justify-center rounded-lg transition-colors",
                            item.active
                              ? "bg-gray-800 border border-blue-500/50"
                              : "hover:bg-gray-800"
                          )}
                        >
                          <item.icon className={cn("w-4 h-4 flex-shrink-0", item.active ? "text-blue-400" : "text-gray-400")} />
                        </button>
                      </div>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content 
                        className="bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg border border-gray-600"
                        sideOffset={5}
                        side="right"
                      >
                        {item.label}
                        <Tooltip.Arrow className="fill-gray-800" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                ))}
              </div>
            )}

            {/* Quick Start Guide */}
            {isOpen && (
              <div className="mb-8">
                <h3 className="text-base font-medium text-white mb-3">Quick Start</h3>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3">
                    <Move className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-300">
                      <span className="font-medium text-white">Navigate</span> – Hold Space + drag
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <ZoomIn className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-300">
                      <span className="font-medium text-white">Zoom</span> – Scroll or pinch
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MousePointer className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-300">
                      <span className="font-medium text-white">Select</span> – Click or drag
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-300">
                      <span className="font-medium text-white">Comment</span> – Press C
                    </span>
                  </div>
                </div>
              </div>
            )}

            {isOpen && <Separator.Root className="bg-gray-700 h-px w-full mb-6" />}


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