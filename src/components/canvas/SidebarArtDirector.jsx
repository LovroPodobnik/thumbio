import React, { useState, useRef, useEffect } from "react";
import * as Tooltip from '@radix-ui/react-tooltip';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import * as Separator from '@radix-ui/react-separator';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { useVisionCritique } from "../../hooks/useVisionCritique";
import { 
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Sparkles,
  ChevronRight
} from 'lucide-react';

// Subtle sidebar animations following web animation best practices
const sidebarVariants = {
  hidden: {
    x: '100%',
    opacity: 0,
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: [0.4, 0.0, 0.2, 1], // Material Design ease-out curve
    }
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: {
      duration: 0.25,
      ease: [0.4, 0.0, 1, 1], // Sharp ease-in for exits
    }
  }
};

// Subtle width expansion - following UI animation principles
const widthVariants = {
  collapsed: {
    width: 60,
    transition: {
      duration: 0.35,
      ease: [0.25, 0.1, 0.25, 1], // Ease-in-out for smooth expansion
    }
  },
  expanded: (customWidth) => ({
    width: customWidth || 420,
    transition: {
      duration: 0.35,
      ease: [0.25, 0.1, 0.25, 1], // Same curve for consistency
    }
  })
};

const Section = ({ title, bullets, icon: Icon }) => (
  <div className="mb-6">
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-gray-500" />
      <h6 className="text-base font-medium text-white">{title}</h6>
    </div>
    <ul className="space-y-2.5">
      {bullets.map((bullet, i) => (
        <li key={i} className="flex items-start gap-3">
          <ChevronRight className="w-3.5 h-3.5 text-gray-500 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-gray-400 leading-relaxed">{bullet}</span>
        </li>
      ))}
    </ul>
  </div>
);

const LoadingSkeleton = () => (
  <div className="space-y-6">
    {[1, 2, 3].map(i => (
      <div key={i}>
        <div className="h-5 bg-gray-800 rounded w-32 mb-3 animate-pulse" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-800 rounded w-full animate-pulse" />
          <div className="h-4 bg-gray-800 rounded w-4/5 animate-pulse" />
          <div className="h-4 bg-gray-800 rounded w-3/4 animate-pulse" />
        </div>
      </div>
    ))}
  </div>
);

const SidebarArtDirector = ({
  isOpen = false,
  onToggle,
  width = 420,
  onWidthChange,
  minWidth = 300,
  maxWidth = 600,
  thumbnail = null,
  isVisible = false
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [currentWidth, setCurrentWidth] = useState(width);
  const sidebarRef = useRef(null);
  const resizeHandleRef = useRef(null);

  // Collapsed width matches MainSidebar
  const collapsedWidth = 60;

  useEffect(() => {
    setCurrentWidth(isOpen ? width : collapsedWidth);
  }, [isOpen, width]);

  // Resize functionality (handle on left side for right sidebar)
  const handleMouseDown = (e) => {
    if (!isOpen) return;
    
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = currentWidth;

    const handleMouseMove = (e) => {
      // For right sidebar, width decreases as mouse moves right
      const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth - (e.clientX - startX)));
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

  const { data, isLoading, error } = useVisionCritique(thumbnail);

  // Don't render if not visible
  if (!isVisible) return null;

  return (
    <Tooltip.Provider>
      <AnimatePresence mode="wait">
        {isVisible && (
          <motion.div
            ref={sidebarRef}
            key="ai-sidebar"
            variants={sidebarVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              "fixed right-0 top-0 bottom-0 z-40 bg-gray-900 border-l border-gray-700",
              "flex flex-col shadow-2xl",
              isResizing && "transition-none"
            )}
          >
            <motion.div
              variants={widthVariants}
              animate={isOpen ? "expanded" : "collapsed"}
              custom={width}
              className="h-full flex flex-col relative"
              style={{ 
                transition: isResizing ? 'none' : undefined
              }}
            >
            {/* Header Section */}
            <div className={cn(
              "flex items-center justify-between border-b border-gray-700",
              isOpen ? "px-6 py-5" : "px-3 py-5"
            )}>
              {isOpen ? (
                <>
                  {/* AI Art Director Header */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Sparkles className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </div>
                    <span className="text-xl font-medium text-white tracking-tight">
                      AI Art Director
                    </span>
                  </div>
                  
                  {/* Collapse Button */}
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <button
                        onClick={onToggle}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
                        aria-label="Collapse AI art director"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content 
                        className="bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg border border-gray-600"
                        sideOffset={5}
                        side="left"
                      >
                        Collapse AI art director
                        <Tooltip.Arrow className="fill-gray-800" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </>
              ) : (
                <>
                  {/* Collapsed Header */}
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <div className="w-8 h-8 mx-auto">
                        <button
                          onClick={onToggle}
                          className="w-full h-full rounded-lg bg-purple-600 flex items-center justify-center hover:bg-purple-500 transition-colors shadow-sm"
                          aria-label="Expand AI art director"
                        >
                          <Sparkles className="w-5 h-5 text-white" strokeWidth={2.5} />
                        </button>
                      </div>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content 
                        className="bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg border border-gray-600"
                        sideOffset={5}
                        side="left"
                      >
                        Expand AI art director
                        <Tooltip.Arrow className="fill-gray-800" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </>
              )}
            </div>

            {/* AI Content */}
            {isOpen && thumbnail && (
              <ScrollArea.Root className="flex-1 overflow-hidden">
                <ScrollArea.Viewport className="h-full w-full px-6 py-6">
                  
                  {/* Thumbnail Preview */}
                  <div className="mb-6">
                    <div className="aspect-video bg-background-secondary rounded-lg overflow-hidden mb-4 relative">
                      {thumbnail.thumbnail ? (
                        <img 
                          src={thumbnail.thumbnail} 
                          alt={thumbnail.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center" style={{ display: thumbnail.thumbnail ? 'none' : 'flex' }}>
                        <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="text-base font-medium text-white line-clamp-2 leading-tight">{thumbnail.title}</h4>
                      <p className="text-sm text-gray-400">{thumbnail.channelName}</p>
                    </div>
                  </div>
                  
                  <Separator.Root className="bg-gray-700 h-px w-full mb-6" />

                  {/* Loading State */}
                  {isLoading && <LoadingSkeleton />}

                  {/* Error State */}
                  {error && (
                    <div className="rounded-lg border border-gray-700 p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-4 h-4 text-gray-500 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-white mb-1">Error</h4>
                          <p className="text-sm text-gray-400">{error.message}</p>
                          {error.message.includes('API key') && (
                            <div className="mt-3 space-y-1">
                              <p className="text-xs font-medium text-gray-400">To fix this:</p>
                              <ol className="list-decimal list-inside space-y-0.5 ml-2">
                                <li className="text-xs text-gray-500">Create a <code className="bg-gray-800 px-1 py-0.5 rounded text-xs">.env</code> file in the project root</li>
                                <li className="text-xs text-gray-500">Add: <code className="bg-gray-800 px-1 py-0.5 rounded text-xs">REACT_APP_OPENAI_API_KEY=sk-...</code></li>
                                <li className="text-xs text-gray-500">Restart the development server</li>
                              </ol>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Analysis Content */}
                  {data && (
                    <>
                      {/* Analysis Sections */}
                      <Section 
                        title="Strengths" 
                        bullets={data.strengths} 
                        icon={CheckCircle2}
                      />
                      
                      <Separator.Root className="bg-gray-700 h-px w-full my-6" />
                      
                      <Section 
                        title="Areas for Improvement" 
                        bullets={data.weaknesses} 
                        icon={AlertCircle}
                      />
                      
                      <Separator.Root className="bg-gray-700 h-px w-full my-6" />
                      
                      <Section 
                        title="Recommendations" 
                        bullets={data.recommendations} 
                        icon={Lightbulb}
                      />

                      {/* Overall Verdict */}
                      <div className="mt-6 rounded-lg border border-gray-700 p-5 bg-gray-800">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-white" />
                          <h6 className="text-sm font-medium text-white">Overall Assessment</h6>
                        </div>
                        <p className="text-sm text-gray-400 leading-relaxed">
                          {data.overallVerdict}
                        </p>
                      </div>

                      {/* Tips */}
                      <div className="mt-6 p-4 rounded-lg border border-gray-700">
                        <p className="text-xs text-gray-500 text-center">
                          Apply these suggestions and run the analysis again to see improvements
                        </p>
                      </div>
                    </>
                  )}
                  
                </ScrollArea.Viewport>
                
                {/* Scrollbar */}
                <ScrollArea.Scrollbar 
                  className="flex select-none touch-none p-0.5 bg-transparent transition-colors duration-[160ms] ease-out hover:bg-background-secondary data-[orientation=vertical]:w-2.5"
                  orientation="vertical"
                >
                  <ScrollArea.Thumb className="flex-1 bg-border-secondary rounded-full hover:bg-border-primary transition-colors" />
                </ScrollArea.Scrollbar>
              </ScrollArea.Root>
            )}

              {/* Resize Handle (left side for right sidebar) */}
              {isOpen && (
                <div
                  ref={resizeHandleRef}
                  onMouseDown={handleMouseDown}
                  className={cn(
                    "absolute top-0 left-0 bottom-0 w-1 cursor-col-resize group",
                    "hover:bg-purple-500/30 transition-colors"
                  )}
                >
                  <div className="absolute top-1/2 left-0 w-3 h-12 -translate-y-1/2 -translate-x-1 bg-transparent group-hover:bg-purple-500/20 rounded-l transition-colors" />
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Tooltip.Provider>
  );
};

export default SidebarArtDirector; 