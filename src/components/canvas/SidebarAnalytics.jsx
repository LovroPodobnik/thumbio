import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import * as Separator from '@radix-ui/react-separator';
import { cn } from '../../lib/utils';
import { 
  X,
  TrendingUp,
  BarChart3,
  Zap,
  Eye,
  MessageSquare,
  ThumbsUp,
  Calendar,
  Activity,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';

const SidebarAnalytics = ({ thumbnail, onClose, isOpen }) => {
  // Helper functions for calculations
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

  const performance = getPerformanceLevel(thumbnail.metrics);
  const engagementRate = calculateEngagementRate(thumbnail.metrics);

  // Additional helper – views per day (velocity)
  const calculateViewsPerDay = (metrics) => {
    if (!metrics || !metrics.viewCount) return 0;
    const days = Math.max(metrics.publishedDaysAgo || 1, 1);
    return metrics.viewCount / days;
  };

  // Like / comment ratio helpers
  const calculateLikeRatio = (metrics) => {
    if (!metrics || !metrics.likeCount) return 0;
    return metrics.viewCount > 0 ? metrics.viewCount / metrics.likeCount : 0;
  };

  const calculateCommentRatio = (metrics) => {
    if (!metrics || !metrics.commentCount) return 0;
    return metrics.viewCount > 0 ? metrics.viewCount / metrics.commentCount : 0;
  };

  const viewsPerDay = calculateViewsPerDay(thumbnail.metrics);
  const likeRatio = calculateLikeRatio(thumbnail.metrics);
  const commentRatio = calculateCommentRatio(thumbnail.metrics);

  // Simple suggestion engine
  const suggestions = [];
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

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        {/* Sidebar Content */}
        <Dialog.Content 
          className={cn(
            "fixed right-0 top-0 h-full w-[420px] z-50",
            "bg-background-primary shadow-xl",
            "flex flex-col",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
            "duration-300"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-divider">
            <Dialog.Title className="text-xl font-medium text-text-primary">
              Performance Analytics
            </Dialog.Title>
            <Dialog.Close
              className="p-1.5 text-text-secondary hover:text-text-primary rounded-md transition-colors"
              aria-label="Close analytics"
            >
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>
          
          {/* Scrollable Content */}
          <ScrollArea.Root className="flex-1 overflow-hidden">
            <ScrollArea.Viewport className="h-full w-full">
              {/* Thumbnail Preview */}
              <div className="p-6 border-b border-border-divider">
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
          <div className="w-full h-full bg-background-secondary flex items-center justify-center" style={{ display: thumbnail.thumbnail ? 'none' : 'flex' }}>
            <div className="w-12 h-12 rounded-full bg-neutral-20 flex items-center justify-center">
              <svg className="w-6 h-6 text-text-secondary" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
          
          {/* Performance status indicator - minimal monochrome */}
          <div className="absolute top-3 left-3">
            <div className={cn(
              "px-2.5 py-1 rounded text-[11px] font-medium uppercase tracking-wide",
              performance.style === 'viral' && "bg-text-primary text-background-primary",
              performance.style === 'excellent' && "bg-neutral-80 text-neutral-0",
              performance.style === 'good' && "bg-neutral-60 text-neutral-0",
              performance.style === 'average' && "bg-neutral-40 text-neutral-0",
              performance.style === 'low' && "bg-neutral-20 text-neutral-60",
              performance.style === 'default' && "bg-neutral-10 text-neutral-60"
            )}>
              {performance.level}
            </div>
          </div>
          
          {/* Duration */}
          <div className="absolute bottom-3 right-3 bg-neutral-100 bg-opacity-90 px-2 py-1 rounded text-caption text-neutral-0">
            {thumbnail.duration || '0:00'}
          </div>
        </div>
        
        <div className="space-y-2">
          <h4 className="text-base font-medium text-text-primary line-clamp-2 leading-tight">{thumbnail.title}</h4>
          <p className="text-sm text-text-secondary">{thumbnail.channelName}</p>
          
          {/* Quick stats */}
          <div className="flex items-center gap-3 text-xs text-text-tertiary">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {formatNumber(thumbnail.metrics?.viewCount || 0)}
            </span>
            <span className="text-text-tertiary">•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {thumbnail.metrics?.publishedDaysAgo || 0} days ago
            </span>
          </div>
        </div>
      </div>
      
      {/* Performance Metrics */}
      <div className="p-6 border-b border-border-divider">
        <h5 className="text-base font-medium text-text-primary mb-4">Performance Metrics</h5>
        
        {/* Key metrics cards - minimal design */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { label: 'Total Views', value: formatNumber(thumbnail.metrics?.viewCount || 0), icon: Eye },
            { label: 'Engagement Rate', value: `${engagementRate.toFixed(2)}%`, icon: Activity },
            { label: 'Views / Day', value: formatNumber(Math.round(viewsPerDay)), icon: TrendingUp },
            { label: 'Like Ratio', value: likeRatio ? `1:${Math.round(likeRatio)}` : 'N/A', icon: ThumbsUp }
          ].map((card, idx) => (
            <div key={idx} className="p-4 rounded-lg border border-border-divider hover:bg-background-secondary transition-colors">
              <div className="flex items-start justify-between mb-2">
                <card.icon className="w-4 h-4 text-text-tertiary" />
              </div>
              <div className="text-lg font-medium text-text-primary mb-1">{card.value}</div>
              <div className="text-xs text-text-tertiary">{card.label}</div>
            </div>
          ))}
        </div>
        
        {/* Detailed metrics */}
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-text-secondary flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5" />
              Comments
            </span>
            <div className="text-right">
              <span className="text-sm font-medium text-text-primary">{formatNumber(thumbnail.metrics?.commentCount || 0)}</span>
              <div className="text-xs text-text-tertiary">
                {thumbnail.metrics?.viewCount > 0 ? (
                  `${((thumbnail.metrics?.commentCount || 0) / thumbnail.metrics.viewCount * 100).toFixed(2)}% of views`
                ) : '0% of views'}
              </div>
            </div>
          </div>
          
          <Separator.Root className="bg-border-divider h-px w-full" />
          
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-text-secondary flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              Published
            </span>
            <div className="text-right">
              <span className="text-sm font-medium text-text-primary">{thumbnail.metrics?.publishedDaysAgo || 0} days ago</span>
              <div className="text-xs text-text-tertiary">
                {new Date(thumbnail.publishedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Analysis */}
      <div className="p-6 border-b border-border-divider">
        <h5 className="text-base font-medium text-text-primary mb-4">Performance Analysis</h5>
        
        {/* Performance level indicator - minimal design */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-text-secondary">Performance Level</span>
            <span className={cn(
              "px-2.5 py-1 rounded text-xs font-medium uppercase tracking-wide",
              performance.style === 'viral' && "bg-text-primary text-background-primary",
              performance.style === 'excellent' && "bg-neutral-80 text-neutral-0",
              performance.style === 'good' && "bg-neutral-60 text-neutral-0",
              performance.style === 'average' && "bg-neutral-40 text-neutral-0",
              performance.style === 'low' && "bg-neutral-20 text-neutral-60",
              performance.style === 'default' && "bg-neutral-10 text-neutral-60"
            )}>
              {performance.level}
            </span>
          </div>
          
          {/* Performance bar - monochrome */}
          <div className="w-full bg-neutral-10 rounded-full h-2 mb-2">
            <div 
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                performance.style === 'viral' && "bg-text-primary",
                performance.style === 'excellent' && "bg-neutral-80",
                performance.style === 'good' && "bg-neutral-60",
                performance.style === 'average' && "bg-neutral-40",
                performance.style === 'low' && "bg-neutral-20",
                performance.style === 'default' && "bg-neutral-20"
              )}
              style={{ 
                width: `${Math.min((engagementRate / 5) * 100, 100)}%`
              }}
            />
          </div>
          <div className="text-xs text-text-tertiary">
            Engagement rate: {engagementRate.toFixed(2)}% (Industry average: 1-2%)
          </div>
        </div>

        {/* Benchmarks */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-text-primary mb-3">Performance Benchmarks</div>
          
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-text-secondary flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5" />
              Daily Views Average
            </span>
            <span className="text-sm font-medium text-text-primary">{formatNumber(Math.round(viewsPerDay))}</span>
          </div>
          
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-text-secondary flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5" />
              Comment Ratio
            </span>
            <span className="text-sm font-medium text-text-primary">
              {thumbnail.metrics?.viewCount > 0 ? (
                `1:${Math.round(commentRatio)}`
              ) : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="p-6 border-b border-border-divider">
        <h5 className="text-base font-medium text-text-primary mb-4">Performance Insights</h5>
        
        <div className="space-y-3">
          {/* Performance insights - minimal design */}
          {suggestions.length === 0 && (
            <div className="p-4 rounded-lg border border-border-divider">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-text-tertiary mt-0.5" />
                <span className="text-sm text-text-secondary">
                  Solid performance! Keep iterating on what works.
                </span>
              </div>
            </div>
          )}

          {suggestions.map((tip, idx) => (
            <div key={idx} className="p-4 rounded-lg border border-border-divider">
              <div className="flex items-start gap-3">
                <Info className="w-4 h-4 text-text-tertiary mt-0.5" />
                <span className="text-sm text-text-secondary">{tip}</span>
              </div>
            </div>
          ))}
          
          {engagementRate >= 2 && (
            <div className="p-4 rounded-lg border border-border-divider bg-background-secondary">
              <div className="flex items-start gap-3">
                <Activity className="w-4 h-4 text-text-primary mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-text-primary mb-1">High Engagement Detected</div>
                  <div className="text-sm text-text-secondary">
                    This thumbnail generates above-average engagement. Study the design elements, colors, and composition for future reference.
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {thumbnail.metrics?.viewCount >= 1000000 && (
            <div className="p-4 rounded-lg border border-border-divider bg-background-secondary">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-4 h-4 text-text-primary mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-text-primary mb-1">Viral Performance</div>
                  <div className="text-sm text-text-secondary">
                    This thumbnail achieved viral status! Analyze the visual elements that made it successful and apply these insights to future designs.
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {thumbnail.metrics?.publishedDaysAgo <= 7 && (
            <div className="p-4 rounded-lg border border-border-divider">
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-text-tertiary mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-text-primary mb-1">Recent Upload</div>
                  <div className="text-sm text-text-secondary">
                    Fresh content with evolving performance metrics. Check back in a few days for more stable data patterns.
                  </div>
                </div>
              </div>
            </div>
          )}

          {engagementRate < 1 && thumbnail.metrics?.viewCount > 10000 && (
            <div className="p-4 rounded-lg border border-border-divider">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-text-tertiary mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-text-primary mb-1">Low Engagement Signal</div>
                  <div className="text-sm text-text-secondary">
                    High view count but low engagement suggests the thumbnail attracts clicks but may not align with content expectations.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

              {/* Analysis Framework */}
              <div className="p-6">
                <h5 className="text-base font-medium text-text-primary mb-4">Analysis Framework</h5>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3">
                    <Zap className="w-3.5 h-3.5 text-text-tertiary mt-0.5" />
                    <span className="text-sm text-text-secondary">
                      Visual hierarchy and composition patterns
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Zap className="w-3.5 h-3.5 text-text-tertiary mt-0.5" />
                    <span className="text-sm text-text-secondary">
                      Color psychology and contrast effectiveness
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Zap className="w-3.5 h-3.5 text-text-tertiary mt-0.5" />
                    <span className="text-sm text-text-secondary">
                      Typography readability at thumbnail scale
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Zap className="w-3.5 h-3.5 text-text-tertiary mt-0.5" />
                    <span className="text-sm text-text-secondary">
                      Emotional triggers and viewer psychology
                    </span>
                  </div>
                </div>
                
                <Separator.Root className="bg-border-divider h-px w-full mb-6" />
                
                <div className="p-4 rounded-lg border border-border-divider bg-background-secondary">
                  <div className="text-sm text-text-secondary text-center">
                    <span className="font-medium text-text-primary">Pro Tip:</span> Compare multiple high-performing thumbnails from the same niche to identify recurring success patterns.
                  </div>
                </div>
              </div>
            </ScrollArea.Viewport>
            
            <ScrollArea.Scrollbar 
              className="flex select-none touch-none p-0.5 bg-transparent transition-colors duration-[160ms] ease-out hover:bg-background-secondary data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-2.5"
              orientation="vertical"
            >
              <ScrollArea.Thumb className="flex-1 bg-border-secondary rounded-full relative before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:transform before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px] hover:bg-border-primary transition-colors" />
            </ScrollArea.Scrollbar>
          </ScrollArea.Root>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default SidebarAnalytics;