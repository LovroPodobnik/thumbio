import React, { useState, useRef, useEffect } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import * as Separator from '@radix-ui/react-separator';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  BarChart3, 
  Sparkles,
  TrendingUp, 
  Eye, 
  MessageSquare, 
  ThumbsUp, 
  Calendar, 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Info,
  Zap,
  CheckCircle2,
  Lightbulb,
  ChevronRight
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useVisionCritique } from "../../hooks/useVisionCritique";

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

const DualSidebar = ({
  isVisible = false,
  thumbnail = null,
  width = 420,
  onWidthChange,
  minWidth = 300,
  maxWidth = 600
}) => {
  // State for which sidebar is active
  const [activeSidebar, setActiveSidebar] = useState(null); // 'analytics' | 'ai' | null
  const [prevThumbnailId, setPrevThumbnailId] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  const [currentWidth, setCurrentWidth] = useState(width);
  const sidebarRef = useRef(null);
  const resizeHandleRef = useRef(null);

  // Collapsed width matches MainSidebar
  const collapsedWidth = 60;

  useEffect(() => {
    setCurrentWidth(activeSidebar ? width : collapsedWidth);
  }, [activeSidebar, width]);

  // Reset sidebar state when thumbnail changes
  useEffect(() => {
    const currentThumbnailId = thumbnail?.id || null;
    
    if (currentThumbnailId !== prevThumbnailId) {
      // Reset to collapsed state for new thumbnail
      setActiveSidebar(null);
      setPrevThumbnailId(currentThumbnailId);
    }
  }, [thumbnail?.id, prevThumbnailId]);

  // Resize functionality (handle on left side for right sidebar)
  const handleMouseDown = (e) => {
    if (!activeSidebar) return;
    
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

  // Handle sidebar toggling with mutual exclusion
  const handleAnalyticsToggle = () => {
    setActiveSidebar(prev => prev === 'analytics' ? null : 'analytics');
  };

  const handleAIToggle = () => {
    setActiveSidebar(prev => prev === 'ai' ? null : 'ai');
  };

  // Don't render if not visible
  if (!isVisible) return null;

  return (
    <Tooltip.Provider>
      <AnimatePresence mode="wait">
        {isVisible && (
          <motion.div
            ref={sidebarRef}
            key="dual-sidebar"
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
              animate={activeSidebar ? "expanded" : "collapsed"}
              custom={width}
              className="h-full flex flex-col relative"
              style={{ 
                transition: isResizing ? 'none' : undefined
              }}
            >
              {/* Header Section */}
              <div className={cn(
                "flex items-center justify-between border-b border-gray-700",
                activeSidebar ? "px-6 py-5" : "px-3 py-5"
              )}>
                {activeSidebar ? (
                  <>
                    {/* Active Sidebar Header */}
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm",
                        activeSidebar === 'analytics' ? "bg-blue-600" : "bg-purple-600"
                      )}>
                        {activeSidebar === 'analytics' ? (
                          <BarChart3 className="w-5 h-5 text-white" strokeWidth={2.5} />
                        ) : (
                          <Sparkles className="w-5 h-5 text-white" strokeWidth={2.5} />
                        )}
                      </div>
                      <span className="text-xl font-medium text-white tracking-tight">
                        {activeSidebar === 'analytics' ? 'Analytics' : 'AI Art Director'}
                      </span>
                    </div>
                    
                    {/* Collapse Button */}
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <button
                          onClick={activeSidebar === 'analytics' ? handleAnalyticsToggle : handleAIToggle}
                          className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
                          aria-label={`Collapse ${activeSidebar === 'analytics' ? 'analytics' : 'AI art director'}`}
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
                          Collapse {activeSidebar === 'analytics' ? 'analytics' : 'AI art director'}
                          <Tooltip.Arrow className="fill-gray-800" />
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  </>
                ) : (
                  <>
                    {/* Collapsed State - Stacked Icons */}
                    <div className="w-8 h-auto mx-auto space-y-3">
                      {/* Analytics Icon */}
                      <Tooltip.Root>
                        <Tooltip.Trigger asChild>
                          <div className="w-8 h-8">
                            <button
                              onClick={handleAnalyticsToggle}
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

                      {/* AI Art Director Icon */}
                      <Tooltip.Root>
                        <Tooltip.Trigger asChild>
                          <div className="w-8 h-8">
                            <button
                              onClick={handleAIToggle}
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
                    </div>
                  </>
                )}
              </div>

              {/* Dynamic Content Area */}
              {activeSidebar && thumbnail && (
                <ScrollArea.Root className="flex-1 overflow-hidden">
                  <ScrollArea.Viewport className="h-full w-full">
                    {activeSidebar === 'analytics' ? (
                      <AnalyticsContent thumbnail={thumbnail} />
                    ) : (
                      <AIContent thumbnail={thumbnail} />
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
              {activeSidebar && (
                <div
                  ref={resizeHandleRef}
                  onMouseDown={handleMouseDown}
                  className={cn(
                    "absolute top-0 left-0 bottom-0 w-1 cursor-col-resize group",
                    activeSidebar === 'analytics' 
                      ? "hover:bg-blue-500/30" 
                      : "hover:bg-purple-500/30",
                    "transition-colors"
                  )}
                >
                  <div className={cn(
                    "absolute top-1/2 left-0 w-3 h-12 -translate-y-1/2 -translate-x-1 bg-transparent rounded-l transition-colors",
                    activeSidebar === 'analytics' 
                      ? "group-hover:bg-blue-500/20" 
                      : "group-hover:bg-purple-500/20"
                  )} />
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Tooltip.Provider>
  );
};

// Analytics Content Component (full content from AnalyticsSidebar)
const AnalyticsContent = ({ thumbnail }) => {

  // Analytics helper functions (copied from AnalyticsSidebar)
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
    <div className="h-full w-full px-6 py-6">
        
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
          </div>
        </div>
        
    </div>
  );
};

// AI Content Component (full content from SidebarArtDirector)
const AIContent = ({ thumbnail }) => {
  const [shouldAnalyze, setShouldAnalyze] = useState(false);
  const [prevThumbnailId, setPrevThumbnailId] = useState(null);
  const { data, isLoading, error } = useVisionCritique(shouldAnalyze ? thumbnail : null);

  const handleAnalyze = () => {
    setShouldAnalyze(true);
  };

  // Reset analysis state when thumbnail changes
  useEffect(() => {
    const currentThumbnailId = thumbnail?.id || null;
    
    if (currentThumbnailId !== prevThumbnailId) {
      // Reset analysis state for new thumbnail
      setShouldAnalyze(false);
      setPrevThumbnailId(currentThumbnailId);
    }
  }, [thumbnail?.id, prevThumbnailId]);

  // Section component for AI analysis
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

  // Loading skeleton
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

  return (
    <div className="h-full w-full px-6 py-6">
        
        {/* AI Art Director Introduction */}
        {!data && !isLoading && !shouldAnalyze && (
          <div className="mb-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-purple-600/20 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-purple-400" />
              </div>
              
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-white">AI Art Director</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Get AI-powered insights and recommendations to improve your thumbnail design. 
                  Our AI analyzes visual elements, composition, and best practices to help you create more engaging thumbnails.
                </p>
              </div>

              <button
                onClick={handleAnalyze}
                disabled={!thumbnail || isLoading}
                className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {isLoading ? 'Analyzing...' : 'Analyze Thumbnail'}
              </button>
              
              <div className="text-xs text-gray-500 text-center">
                Analysis typically takes 5-10 seconds
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && <LoadingSkeleton />}

        {/* Error State */}
        {error && (
          <div className="rounded-lg border border-red-800 bg-red-900/20 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-white mb-1">Analysis Failed</h4>
                <p className="text-sm text-gray-400 mb-3">{error.message}</p>
                
                {error.message.includes('API key') && (
                  <div className="mb-4 space-y-1">
                    <p className="text-xs font-medium text-gray-400">To fix this:</p>
                    <ol className="list-decimal list-inside space-y-0.5 ml-2">
                      <li className="text-xs text-gray-500">Create a <code className="bg-gray-800 px-1 py-0.5 rounded text-xs">.env</code> file in the project root</li>
                      <li className="text-xs text-gray-500">Add: <code className="bg-gray-800 px-1 py-0.5 rounded text-xs">REACT_APP_OPENAI_API_KEY=sk-...</code></li>
                      <li className="text-xs text-gray-500">Restart the development server</li>
                    </ol>
                  </div>
                )}
                
                <button
                  onClick={() => {
                    setShouldAnalyze(false);
                    setTimeout(() => setShouldAnalyze(true), 100);
                  }}
                  className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Try Again
                </button>
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

            {/* Re-analyze Button */}
            <div className="mt-6 space-y-3">
              <button
                onClick={() => {
                  setShouldAnalyze(false);
                  setTimeout(() => setShouldAnalyze(true), 100);
                }}
                disabled={isLoading}
                className="w-full px-4 py-2.5 bg-purple-600/20 hover:bg-purple-600/30 disabled:bg-gray-700/50 disabled:cursor-not-allowed text-purple-400 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 border border-purple-600/30"
              >
                <Sparkles className="w-4 h-4" />
                {isLoading ? 'Re-analyzing...' : 'Re-analyze Thumbnail'}
              </button>
              
              <div className="p-4 rounded-lg border border-gray-700">
                <p className="text-xs text-gray-500 text-center">
                  Apply these suggestions and run the analysis again to see improvements
                </p>
              </div>
            </div>
          </>
        )}
        
    </div>
  );
};

export default DualSidebar;