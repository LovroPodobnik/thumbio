import React, { useState, useRef, useEffect } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import * as Separator from '@radix-ui/react-separator';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  BarChart3, 
  TrendingUp, 
  Eye, 
  MessageSquare, 
  ThumbsUp, 
  Calendar, 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Info,
  Zap
} from 'lucide-react';
import { cn } from '../../lib/utils';

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

const AnalyticsSidebar = ({
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

  // Analytics helper functions (copied from SidebarAnalytics)
  const calculateEngagementRate = (metrics) => {
    if (!metrics || !metrics.viewCount || metrics.viewCount === 0) return 0;
    return ((metrics.likeCount + metrics.commentCount) / metrics.viewCount * 100);
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const getPerformanceLevel = (metrics) => {
    if (!metrics) return { level: 'UNKNOWN', style: 'default' };
    
    const { viewCount = 0 } = metrics;
    const engagement = calculateEngagementRate(metrics);
    
    if (viewCount >= 1000000 && engagement >= 3) {
      return { level: 'VIRAL', style: 'viral' };
    } else if (viewCount >= 500000 || engagement >= 2.5) {
      return { level: 'EXCELLENT', style: 'excellent' };
    } else if (viewCount >= 100000 || engagement >= 1.5) {
      return { level: 'GOOD', style: 'good' };
    } else if (viewCount >= 10000 || engagement >= 1) {
      return { level: 'AVERAGE', style: 'average' };
    } else {
      return { level: 'LOW', style: 'low' };
    }
  };

  const calculateViewsPerDay = (metrics) => {
    if (!metrics || !metrics.viewCount) return 0;
    const days = Math.max(metrics.publishedDaysAgo || 1, 1);
    return metrics.viewCount / days;
  };

  const calculateLikeRatio = (metrics) => {
    if (!metrics || !metrics.likeCount) return 0;
    return metrics.viewCount > 0 ? metrics.viewCount / metrics.likeCount : 0;
  };

  const calculateCommentRatio = (metrics) => {
    if (!metrics || !metrics.commentCount) return 0;
    return metrics.viewCount > 0 ? metrics.viewCount / metrics.commentCount : 0;
  };

  // Don't render if not visible
  if (!isVisible) return null;

  const performance = thumbnail ? getPerformanceLevel(thumbnail.metrics) : { level: 'UNKNOWN', style: 'default' };
  const engagementRate = thumbnail ? calculateEngagementRate(thumbnail.metrics) : 0;
  const viewsPerDay = thumbnail ? calculateViewsPerDay(thumbnail.metrics) : 0;
  const likeRatio = thumbnail ? calculateLikeRatio(thumbnail.metrics) : 0;
  const commentRatio = thumbnail ? calculateCommentRatio(thumbnail.metrics) : 0;

  // Generate suggestions
  const suggestions = [];
  if (thumbnail) {
    if (engagementRate < 1) {
      suggestions.push('Try adding a stronger emotional hook or facial expression to boost engagement.');
    }
    if (viewsPerDay > 5000 && engagementRate < 1.5) {
      suggestions.push('High click-through but lower engagement – consider aligning the thumbnail more closely with video content.');
    }
    if (likeRatio > 80) {
      suggestions.push('Encourage viewers to like the video within the first 30 seconds to improve like ratio.');
    }
    if (commentRatio > 500) {
      suggestions.push('Pose a direct question in the video or description to invite comments.');
    }
  }

  return (
    <Tooltip.Provider>
      <AnimatePresence mode="wait">
        {isVisible && (
          <motion.div
            ref={sidebarRef}
            key="analytics-sidebar"
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
                  {/* Analytics Header */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <BarChart3 className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </div>
                    <span className="text-xl font-medium text-white tracking-tight">
                      Analytics
                    </span>
                  </div>
                  
                  {/* Collapse Button */}
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <button
                        onClick={onToggle}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
                        aria-label="Collapse analytics"
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
                        Collapse analytics
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
                          className="w-full h-full rounded-lg bg-blue-600 flex items-center justify-center hover:bg-blue-500 transition-colors shadow-sm"
                          aria-label="Expand analytics"
                        >
                          <BarChart3 className="w-5 h-5 text-white" strokeWidth={2.5} />
                        </button>
                      </div>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content 
                        className="bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg border border-gray-600"
                        sideOffset={5}
                        side="left"
                      >
                        Expand analytics
                        <Tooltip.Arrow className="fill-gray-800" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </>
              )}
            </div>

            {/* Analytics Content */}
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
                      
                      {/* Performance status indicator */}
                      <div className="absolute top-3 left-3">
                        <div className={cn(
                          "px-2.5 py-1 rounded text-[11px] font-medium uppercase tracking-wide",
                          performance.style === 'viral' && "bg-white text-black",
                          performance.style === 'excellent' && "bg-gray-200 text-gray-900",
                          performance.style === 'good' && "bg-gray-400 text-white",
                          performance.style === 'average' && "bg-gray-600 text-white",
                          performance.style === 'low' && "bg-gray-700 text-gray-300",
                          performance.style === 'default' && "bg-gray-800 text-gray-400"
                        )}>
                          {performance.level}
                        </div>
                      </div>
                      
                      {/* Duration */}
                      <div className="absolute bottom-3 right-3 bg-black bg-opacity-75 px-2 py-1 rounded text-xs text-white">
                        {thumbnail.duration || '0:00'}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="text-base font-medium text-white line-clamp-2 leading-tight">{thumbnail.title}</h4>
                      <p className="text-sm text-gray-400">{thumbnail.channelName}</p>
                      
                      {/* Quick stats */}
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {formatNumber(thumbnail.metrics?.viewCount || 0)}
                        </span>
                        <span className="text-gray-600">•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {thumbnail.metrics?.publishedDaysAgo || 0} days ago
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <Separator.Root className="bg-gray-700 h-px w-full mb-6" />
                  
                  {/* Performance Metrics */}
                  <div className="mb-6">
                    <h5 className="text-base font-medium text-white mb-4">Performance Metrics</h5>
                    
                    {/* Key metrics cards */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      {[
                        { label: 'Total Views', value: formatNumber(thumbnail.metrics?.viewCount || 0), icon: Eye },
                        { label: 'Engagement Rate', value: `${engagementRate.toFixed(2)}%`, icon: Activity },
                        { label: 'Views / Day', value: formatNumber(Math.round(viewsPerDay)), icon: TrendingUp },
                        { label: 'Like Ratio', value: likeRatio ? `1:${Math.round(likeRatio)}` : 'N/A', icon: ThumbsUp }
                      ].map((card, idx) => (
                        <div key={idx} className="p-4 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <card.icon className="w-4 h-4 text-gray-500" />
                          </div>
                          <div className="text-lg font-medium text-white mb-1">{card.value}</div>
                          <div className="text-xs text-gray-500">{card.label}</div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Detailed metrics */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-gray-400 flex items-center gap-2">
                          <MessageSquare className="w-3.5 h-3.5" />
                          Comments
                        </span>
                        <div className="text-right">
                          <span className="text-sm font-medium text-white">{formatNumber(thumbnail.metrics?.commentCount || 0)}</span>
                          <div className="text-xs text-gray-500">
                            {thumbnail.metrics?.viewCount > 0 ? (
                              `${((thumbnail.metrics?.commentCount || 0) / thumbnail.metrics.viewCount * 100).toFixed(2)}% of views`
                            ) : '0% of views'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator.Root className="bg-gray-700 h-px w-full mb-6" />

                  {/* Performance Analysis */}
                  <div className="mb-6">
                    <h5 className="text-base font-medium text-white mb-4">Performance Analysis</h5>
                    
                    {/* Performance level indicator */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-400">Performance Level</span>
                        <span className={cn(
                          "px-2.5 py-1 rounded text-xs font-medium uppercase tracking-wide",
                          performance.style === 'viral' && "bg-white text-black",
                          performance.style === 'excellent' && "bg-gray-200 text-gray-900",
                          performance.style === 'good' && "bg-gray-400 text-white",
                          performance.style === 'average' && "bg-gray-600 text-white",
                          performance.style === 'low' && "bg-gray-700 text-gray-300",
                          performance.style === 'default' && "bg-gray-800 text-gray-400"
                        )}>
                          {performance.level}
                        </span>
                      </div>
                      
                      {/* Performance bar */}
                      <div className="w-full bg-gray-800 rounded-full h-2 mb-2">
                        <div 
                          className={cn(
                            "h-2 rounded-full transition-all duration-300",
                            performance.style === 'viral' && "bg-white",
                            performance.style === 'excellent' && "bg-gray-200",
                            performance.style === 'good' && "bg-gray-400",
                            performance.style === 'average' && "bg-gray-600",
                            performance.style === 'low' && "bg-gray-700",
                            performance.style === 'default' && "bg-gray-800"
                          )}
                          style={{ 
                            width: `${Math.min((engagementRate / 5) * 100, 100)}%`
                          }}
                        />
                      </div>
                      <div className="text-xs text-gray-500">
                        Engagement rate: {engagementRate.toFixed(2)}% (Industry average: 1-2%)
                      </div>
                    </div>

                    {/* Benchmarks */}
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-white mb-3">Performance Benchmarks</div>
                      
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-gray-400 flex items-center gap-2">
                          <BarChart3 className="w-3.5 h-3.5" />
                          Daily Views Average
                        </span>
                        <span className="text-sm font-medium text-white">{formatNumber(Math.round(viewsPerDay))}</span>
                      </div>
                      
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-gray-400 flex items-center gap-2">
                          <MessageSquare className="w-3.5 h-3.5" />
                          Comment Ratio
                        </span>
                        <span className="text-sm font-medium text-white">
                          {thumbnail.metrics?.viewCount > 0 ? (
                            `1:${Math.round(commentRatio)}`
                          ) : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Separator.Root className="bg-gray-700 h-px w-full mb-6" />

                  {/* Performance Insights */}
                  <div className="mb-6">
                    <h5 className="text-base font-medium text-white mb-4">Performance Insights</h5>
                    
                    <div className="space-y-3">
                      {suggestions.length === 0 && (
                        <div className="p-4 rounded-lg border border-gray-700">
                          <div className="flex items-start gap-3">
                            <CheckCircle className="w-4 h-4 text-gray-500 mt-0.5" />
                            <span className="text-sm text-gray-400">
                              Solid performance! Keep iterating on what works.
                            </span>
                          </div>
                        </div>
                      )}

                      {suggestions.map((tip, idx) => (
                        <div key={idx} className="p-4 rounded-lg border border-gray-700">
                          <div className="flex items-start gap-3">
                            <Info className="w-4 h-4 text-gray-500 mt-0.5" />
                            <span className="text-sm text-gray-400">{tip}</span>
                          </div>
                        </div>
                      ))}
                      
                      {engagementRate >= 2 && (
                        <div className="p-4 rounded-lg border border-gray-700 bg-gray-800">
                          <div className="flex items-start gap-3">
                            <Activity className="w-4 h-4 text-blue-400 mt-0.5" />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-white mb-1">High Engagement Detected</div>
                              <div className="text-sm text-gray-400">
                                This thumbnail generates above-average engagement. Study the design elements, colors, and composition for future reference.
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {thumbnail.metrics?.viewCount >= 1000000 && (
                        <div className="p-4 rounded-lg border border-gray-700 bg-gray-800">
                          <div className="flex items-start gap-3">
                            <TrendingUp className="w-4 h-4 text-blue-400 mt-0.5" />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-white mb-1">Viral Performance</div>
                              <div className="text-sm text-gray-400">
                                This thumbnail achieved viral status! Analyze the visual elements that made it successful and apply these insights to future designs.
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Analysis Framework */}
                  <div className="mb-6">
                    <h5 className="text-base font-medium text-white mb-4">Analysis Framework</h5>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex items-start gap-3">
                        <Zap className="w-3.5 h-3.5 text-gray-500 mt-0.5" />
                        <span className="text-sm text-gray-400">
                          Visual hierarchy and composition patterns
                        </span>
                      </div>
                      <div className="flex items-start gap-3">
                        <Zap className="w-3.5 h-3.5 text-gray-500 mt-0.5" />
                        <span className="text-sm text-gray-400">
                          Color psychology and contrast effectiveness
                        </span>
                      </div>
                      <div className="flex items-start gap-3">
                        <Zap className="w-3.5 h-3.5 text-gray-500 mt-0.5" />
                        <span className="text-sm text-gray-400">
                          Typography readability at thumbnail scale
                        </span>
                      </div>
                      <div className="flex items-start gap-3">
                        <Zap className="w-3.5 h-3.5 text-gray-500 mt-0.5" />
                        <span className="text-sm text-gray-400">
                          Emotional triggers and viewer psychology
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-4 rounded-lg border border-gray-700 bg-gray-800">
                      <div className="text-sm text-gray-400 text-center">
                        <span className="font-medium text-white">Pro Tip:</span> Compare multiple high-performing thumbnails from the same niche to identify recurring success patterns.
                      </div>
                    </div>
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
            )}


              {/* Resize Handle (left side for right sidebar) */}
              {isOpen && (
                <div
                  ref={resizeHandleRef}
                  onMouseDown={handleMouseDown}
                  className={cn(
                    "absolute top-0 left-0 bottom-0 w-1 cursor-col-resize group",
                    "hover:bg-blue-500/30 transition-colors"
                  )}
                >
                  <div className="absolute top-1/2 left-0 w-3 h-12 -translate-y-1/2 -translate-x-1 bg-transparent group-hover:bg-blue-500/20 rounded-l transition-colors" />
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Tooltip.Provider>
  );
};

export default AnalyticsSidebar;