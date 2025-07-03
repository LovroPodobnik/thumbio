import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Tldraw, createShapeId, ShapeUtil, HTMLContainer, T, Rectangle2d, DefaultStylePanel } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';

// Import ONLY the essential YouTube functionality - no complex canvas state
import MainSidebar from './MainSidebar';
import ContentImportSidebar from './ContentImportSidebar';
import YouTubeImporter from './YouTubeImporter';
import DualSidebar from './DualSidebar';

// Import TikTok shape utility
import { TikTokShapeUtil } from './shapes/TikTokShapeUtil';

// Simple data storage for both platforms
let youtubeVideos = [];
let tiktokVideos = [];
let showContentImport = false;
let showYouTubeImporter = false;
let sidebarOpen = false; // Start collapsed by default like original

// Debounce utility function
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Simple thumbnail shape props
const thumbnailShapeProps = {
  videoId: T.string,
  title: T.string,
  thumbnailUrl: T.string,
  channelName: T.string,
  views: T.number,
  engagement: T.number,
  isViral: T.boolean,
  zScore: T.number,
  w: T.number,
  h: T.number,
  locked: T.boolean,
  showMetrics: T.boolean
};

// YouTube thumbnail component
const ThumbnailShapeComponent = ({ shape, editor }) => {
  const [currentTool, setCurrentTool] = useState(globalEditor?.getCurrentToolId());
  
  const { props } = shape;
  const { 
    thumbnailUrl, 
    title, 
    channelName, 
    views, 
    engagement, 
    isViral, 
    w, 
    h, 
    locked, 
    showMetrics 
  } = props;

  const formatViews = (views) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  // Listen for tool changes to update component reactively
  useEffect(() => {
    if (!globalEditor) return;
    
    const handleToolChange = () => {
      setCurrentTool(globalEditor.getCurrentToolId());
    };
    
    // Listen to editor changes for tool switches
    globalEditor.on('change', handleToolChange);
    
    return () => {
      globalEditor.off('change', handleToolChange);
    };
  }, []);

  // Check current tool to determine pointer event behavior
  const isHandTool = currentTool === 'hand';
  
  // Proper click handler following tldraw patterns
  const handleThumbnailClick = (e) => {
    if (!locked && globalEditor && !isHandTool) {
      // Following tldraw documentation: stopPropagation for custom handling
      e.stopPropagation();
      globalEditor.select(shape.id);
    }
  };

  return (
    <div 
      onClick={handleThumbnailClick}
      onPointerDown={handleThumbnailClick}
      style={{ 
        width: w, 
        height: h, 
        position: 'relative',
        border: locked ? '2px solid #ef4444' : '1px solid #e5e7eb',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: '#f3f4f6',
        cursor: locked ? 'not-allowed' : (isHandTool ? 'grab' : 'pointer'),
        userSelect: 'none',
        // When hand tool is active, let events pass through to enable canvas panning
        pointerEvents: isHandTool ? 'none' : 'all'
      }}
    >
      <img
        src={thumbnailUrl}
        alt={title}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: locked ? 0.6 : 1,
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none'
        }}
        onError={(e) => {
          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjRkFGQUZBIi8+CjxwYXRoIGQ9Ik0xNDQuNSA5MEwxNjggNzguNVYxMDEuNUwxNDQuNSA5MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHN2Zz4K';
        }}
      />
      
      {showMetrics && (
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          display: 'flex',
          gap: '4px'
        }}>
          {isViral && (
            <span style={{
              background: '#ef4444',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 'bold'
            }}>
              VIRAL
            </span>
          )}
          
          {engagement > 7 && (
            <span style={{
              background: '#f59e0b',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 'bold'
            }}>
              HOT
            </span>
          )}
        </div>
      )}
      
      <div style={{
        position: 'absolute',
        bottom: '0',
        left: '0',
        right: '0',
        background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
        color: 'white',
        padding: '8px',
        fontSize: '12px'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
          {title.length > 40 ? title.substring(0, 40) + '...' : title}
        </div>
        <div style={{ opacity: 0.8 }}>
          {channelName} • {formatViews(views)} views • {engagement}% engagement
        </div>
      </div>
      
      {locked && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(239, 68, 68, 0.9)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: 'bold'
        }}>
          🔒 LOCKED
        </div>
      )}
    </div>
  );
};

// Global editor reference for shape components
let globalEditor = null;

// Shape util for tldraw
class ThumbnailShapeUtil extends ShapeUtil {
  static type = 'youtube-thumbnail'
  static props = thumbnailShapeProps
  
  getDefaultProps() {
    return {
      videoId: '',
      title: 'Sample Video Title',
      thumbnailUrl: '',
      channelName: 'Sample Channel',
      views: 1000,
      engagement: 5.0,
      isViral: false,
      zScore: 0,
      w: 320,
      h: 180,
      locked: false,
      showMetrics: true
    }
  }
  
  getGeometry(shape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      x: 0,
      y: 0,
      isFilled: true  // Ensure the entire shape is clickable
    })
  }
  
  component(shape) {
    return (
      <HTMLContainer>
        <ThumbnailShapeComponent shape={shape} editor={globalEditor} />
      </HTMLContainer>
    )
  }
  
  indicator(shape) {
    return (
      <rect 
        width={shape.props.w} 
        height={shape.props.h} 
        stroke={shape.props.locked ? '#ef4444' : '#3b82f6'}
        strokeWidth="2"
        fill="none"
      />
    )
  }
  
  canEdit(shape) {
    return !shape.props.locked
  }
  
  canBind() {
    return false
  }
  
  canSelect(shape) {
    return !shape.props.locked;
  }
  
  canResize(shape) {
    return !shape.props.locked
  }
  
  canMove(shape) {
    return !shape.props.locked
  }

  // Override hitTestPoint to ensure proper click detection
  hitTestPoint(shape, point) {
    return this.getGeometry(shape).hitTestPoint(point);
  }
  
  // Ensure proper hit testing for selection
  getOutlineSegments(shape) {
    const { w, h } = shape.props;
    return [
      { type: 'straight', x: 0, y: 0 },
      { type: 'straight', x: w, y: 0 },
      { type: 'straight', x: w, y: h },
      { type: 'straight', x: 0, y: h },
      { type: 'close' }
    ];
  }
}

// Create a factory function for the conditional StylePanel
// Hides StylePanel (including opacity slider) when thumbnails are selected
const createConditionalStylePanel = (shouldHide) => {
  return shouldHide ? () => null : DefaultStylePanel;
};

// Hybrid canvas - combines YouTube import with pure tldraw
const TldrawCanvasHybrid = () => {
  const [editor, setEditor] = useState(null);
  const [, forceUpdate] = useState({});
  
  // Dual sidebar state (Analytics + AI Art Director)
  const [selectedThumbnailForSidebar, setSelectedThumbnailForSidebar] = useState(null);
  const [showDualSidebar, setShowDualSidebar] = useState(false);
  const [dualSidebarWidth, setDualSidebarWidth] = useState(420);

  const shapeUtils = useMemo(() => [ThumbnailShapeUtil, TikTokShapeUtil], []);

  // Create components object that hides StylePanel when thumbnails are selected
  const tldrawComponents = useMemo(() => ({
    Watermark: () => null, // Remove tldraw watermark
    StylePanel: createConditionalStylePanel(selectedThumbnailForSidebar !== null), // Hide StylePanel when thumbnail is selected
  }), [selectedThumbnailForSidebar]);


  // Force re-render function
  const refresh = () => forceUpdate({});

  // Helper functions needed for examples (wrapped in useCallback to avoid re-creation)
  const calculateEngagementForExamples = useCallback((statistics) => {
    if (!statistics) return 0;
    const views = parseInt(statistics.viewCount || '0', 10);
    const likes = parseInt(statistics.likeCount || '0', 10);
    const comments = parseInt(statistics.commentCount || '0', 10);
    if (views === 0) return 0;
    const engagementActions = likes + comments;
    return Math.round((engagementActions / views) * 100 * 100) / 100;
  }, []);

  const calculateZScoreForExamples = useCallback((statistics) => {
    if (!statistics) return 0;
    const views = parseInt(statistics.viewCount || '0', 10);
    const engagement = calculateEngagementForExamples(statistics);
    return Math.round((Math.log10(views + 1) + engagement / 10) * 100) / 100;
  }, [calculateEngagementForExamples]);

  // Create example thumbnails for testing (saves API calls)
  const createExampleThumbnails = useCallback((editor) => {
    if (!editor) return;

    const exampleThumbnails = [
      // Viral Performance Examples
      {
        id: 'example-viral-1',
        title: 'How I Made $1 Million in 24 Hours (INSANE Story)',
        channelName: 'MrBeast',
        thumbnailUrl: 'https://picsum.photos/seed/viral1/320/180', // High energy thumbnail
        views: 45000000,
        likes: 2100000,
        comments: 89000,
        publishedDaysAgo: 7,
        duration: '15:32',
        isViral: true
      },
      {
        id: 'example-viral-2', 
        title: 'I Survived 100 Days in a Nuclear Bunker',
        channelName: 'Ryan Trahan',
        thumbnailUrl: 'https://picsum.photos/seed/viral2/320/180',
        views: 23000000,
        likes: 1200000,
        comments: 45000,
        publishedDaysAgo: 14,
        duration: '20:14',
        isViral: true
      },
      // Excellent Performance
      {
        id: 'example-excellent-1',
        title: 'Why Everyone is Quitting YouTube',
        channelName: 'Veritasium',
        thumbnailUrl: 'https://picsum.photos/seed/excellent1/320/180',
        views: 3200000,
        likes: 185000,
        comments: 12000,
        publishedDaysAgo: 21,
        duration: '18:45',
        isViral: false
      },
      {
        id: 'example-excellent-2',
        title: 'The Future of Programming in 2024',
        channelName: 'Fireship',
        thumbnailUrl: 'https://picsum.photos/seed/excellent2/320/180',
        views: 1800000,
        likes: 95000,
        comments: 8500,
        publishedDaysAgo: 30,
        duration: '8:23',
        isViral: false
      },
      // Good Performance
      {
        id: 'example-good-1',
        title: 'Building a SaaS in Public - Month 6 Update',
        channelName: 'Indie Hackers',
        thumbnailUrl: 'https://picsum.photos/seed/good1/320/180',
        views: 450000,
        likes: 23000,
        comments: 1200,
        publishedDaysAgo: 45,
        duration: '12:18',
        isViral: false
      },
      {
        id: 'example-good-2',
        title: 'React 19 Features You Need to Know',
        channelName: 'Web Dev Simplified',
        thumbnailUrl: 'https://picsum.photos/seed/good2/320/180',
        views: 280000,
        likes: 18000,
        comments: 850,
        publishedDaysAgo: 60,
        duration: '16:42',
        isViral: false
      },
      // Average Performance
      {
        id: 'example-average-1',
        title: 'Daily Vlog: Coffee Shop Coding Session',
        channelName: 'Code with Sarah',
        thumbnailUrl: 'https://picsum.photos/seed/average1/320/180',
        views: 85000,
        likes: 3200,
        comments: 180,
        publishedDaysAgo: 90,
        duration: '9:15',
        isViral: false
      },
      {
        id: 'example-average-2',
        title: 'CSS Grid Tutorial for Beginners',
        channelName: 'Frontend Focus',
        thumbnailUrl: 'https://picsum.photos/seed/average2/320/180',
        views: 42000,
        likes: 1800,
        comments: 95,
        publishedDaysAgo: 120,
        duration: '22:30',
        isViral: false
      },
      // Low Performance 
      {
        id: 'example-low-1',
        title: 'My Setup Tour 2024',
        channelName: 'Tech Corner',
        thumbnailUrl: 'https://picsum.photos/seed/low1/320/180',
        views: 8500,
        likes: 320,
        comments: 25,
        publishedDaysAgo: 180,
        duration: '6:45',
        isViral: false
      },
      {
        id: 'example-low-2',
        title: 'Random Thoughts on Programming',
        channelName: 'DevDiary',
        thumbnailUrl: 'https://picsum.photos/seed/low2/320/180',
        views: 3200,
        likes: 85,
        comments: 12,
        publishedDaysAgo: 240,
        duration: '4:12',
        isViral: false
      }
    ];

    // Convert to tldraw shapes
    const shapes = exampleThumbnails.map((video, index) => {
      const engagement = calculateEngagementForExamples({
        viewCount: video.views,
        likeCount: video.likes,
        commentCount: video.comments
      });

      return {
        id: createShapeId(`example-${video.id}`),
        type: 'youtube-thumbnail',
        x: 150 + (index % 4) * 360,
        y: 150 + Math.floor(index / 4) * 240,
        props: {
          videoId: video.id,
          title: video.title,
          thumbnailUrl: video.thumbnailUrl,
          channelName: video.channelName,
          views: video.views,
          engagement: engagement,
          isViral: video.isViral,
          zScore: calculateZScoreForExamples({
            viewCount: video.views,
            likeCount: video.likes,
            commentCount: video.comments
          }),
          w: 320,
          h: 180,
          locked: false,
          showMetrics: true
        }
      };
    });

    // Create all thumbnail shapes on canvas
    editor.createShapes(shapes);
    
    // Zoom to fit all examples
    setTimeout(() => {
      editor.zoomToFit();
    }, 100);
  }, [calculateEngagementForExamples, calculateZScoreForExamples]);

  // Enhanced editor mount handler
  const handleEditorMount = useCallback((editorInstance) => {
    setEditor(editorInstance);
    
    // Set global editor reference for shape components
    globalEditor = editorInstance;
    
    // Ensure we're using the selection tool by default for thumbnail interaction
    if (editorInstance && editorInstance.setCurrentTool) {
      editorInstance.setCurrentTool('select');
    }

    // Add example thumbnails after a short delay to ensure editor is ready
    setTimeout(() => {
      createExampleThumbnails(editorInstance);
    }, 500);
  }, [createExampleThumbnails]);
  
  // Data transformation: Convert tldraw shape to analytics format
  const convertTldrawShapeToAnalyticsData = useCallback((shape) => {
    if (!shape || shape.type !== 'youtube-thumbnail') return null;
    
    const { props } = shape;
    
    // Calculate additional metrics that analytics drawer expects
    const calculateLikeCount = (engagement, views) => {
      if (!engagement || !views) return 0;
      // Rough estimation: engagement includes likes + comments, assume 80% are likes
      return Math.round((engagement / 100) * views * 0.8);
    };
    
    const calculateCommentCount = (engagement, views) => {
      if (!engagement || !views) return 0;
      // Rough estimation: remaining 20% of engagement are comments
      return Math.round((engagement / 100) * views * 0.2);
    };
    
    const calculatePublishedDaysAgo = () => {
      // For now, we'll use a default of 30 days
      // In real implementation, this should come from video data
      return 30;
    };
    
    return {
      id: props.videoId,
      title: props.title || 'Unknown Title',
      channelName: props.channelName || 'Unknown Channel',
      channelId: props.channelId || 'unknown',
      thumbnail: props.thumbnailUrl,
      thumbnails: {
        default: { url: props.thumbnailUrl },
        medium: { url: props.thumbnailUrl },
        high: { url: props.thumbnailUrl },
        maxres: { url: props.thumbnailUrl }
      },
      publishedAt: new Date(Date.now() - (calculatePublishedDaysAgo() * 24 * 60 * 60 * 1000)).toISOString(),
      duration: '10:30', // Default duration - should come from video data
      metrics: {
        viewCount: props.views || 0,
        likeCount: calculateLikeCount(props.engagement, props.views),
        commentCount: calculateCommentCount(props.engagement, props.views),
        publishedDaysAgo: calculatePublishedDaysAgo()
      },
      x: shape.x,
      y: shape.y
    };
  }, []);

  // Data transformation: Convert TikTok tldraw shape to analytics format
  const convertTikTokShapeToAnalyticsData = useCallback((shape) => {
    if (!shape || shape.type !== 'tiktok-video') return null;
    
    const { props } = shape;
    
    return {
      id: props.videoId,
      title: props.title || 'TikTok Video',
      platform: 'tiktok',
      creator: {
        username: props.username,
        displayName: props.displayName,
        verified: props.verified
      },
      coverUrl: props.coverUrl,
      metrics: {
        viewCount: props.playCount || 0,
        likeCount: props.likeCount || 0,
        commentCount: props.commentCount || 0,
        shareCount: props.shareCount || 0,
        engagement: props.engagement || 0
      },
      music: {
        title: props.musicTitle,
        artist: props.musicArtist
      },
      hashtags: props.hashtags || [],
      isViral: props.isViral,
      trendingScore: props.trendingScore,
      importedAt: props.importedAt,
      x: shape.x,
      y: shape.y
    };
  }, []);
  
  
  // Debounced handler only for expensive operations like re-renders
  const debouncedForceUpdate = useMemo(
    () => debounce(() => {
      forceUpdate({});
    }, 50), // Reduced from 100ms to 50ms for better responsiveness
    []
  );
  
  // Optimized selection detection for instant sidebar response
  useEffect(() => {
    if (!editor) return;
    
    const handleSelectionChange = () => {
      const selectedShapes = editor.getSelectedShapes();
      const contentShapes = selectedShapes.filter(s => 
        s.type === 'youtube-thumbnail' || s.type === 'tiktok-video'
      );
      
      // Immediate sidebar update for single content selection
      if (contentShapes.length === 1) {
        const shape = contentShapes[0];
        let sidebarData;
        
        if (shape.type === 'youtube-thumbnail') {
          sidebarData = convertTldrawShapeToAnalyticsData(shape);
        } else if (shape.type === 'tiktok-video') {
          sidebarData = convertTikTokShapeToAnalyticsData(shape);
        }
        
        setSelectedThumbnailForSidebar(sidebarData);
        setShowDualSidebar(true);
      } else {
        setSelectedThumbnailForSidebar(null);
        setShowDualSidebar(false);
      }
      
      // Debounced re-render for performance
      debouncedForceUpdate();
    };
    
    // Use the correct tldraw change event for selection detection
    editor.on('change', handleSelectionChange);
    
    // Initial check
    handleSelectionChange();
    
    // Cleanup event listeners
    return () => {
      editor.off('change', handleSelectionChange);
    };
  }, [editor, convertTldrawShapeToAnalyticsData, convertTikTokShapeToAnalyticsData, debouncedForceUpdate]);
  
  

  // Simple mock implementations of the UI actions (replace complex state management)
  const mockUIActions = {
    setShowContentImportSidebar: (show) => {
      showContentImport = show;
      refresh();
    },
    setShowYouTubeImporter: (show) => {
      showYouTubeImporter = show;
      refresh();
    },
    setSidebarOpen: (open) => {
      sidebarOpen = open;
      refresh();
    }
  };

  // Layout calculation for mixed content
  const calculateMixedLayout = (youtubeCount, tiktokCount) => {
    const layouts = {
      youtube: {
        columns: 4,
        itemWidth: 320,
        itemHeight: 180,
        spacing: 40,
        startX: 100,
        startY: 100
      },
      tiktok: {
        columns: 6,
        itemWidth: 270,
        itemHeight: 480,
        spacing: 30,
        startX: 100,
        startY: youtubeCount > 0 ? 400 : 100
      }
    };
    
    return layouts;
  };

  // Simple mock implementation of canvas actions
  const mockCanvasActions = {
    importThumbnails: (thumbnails) => {
      console.log('Importing thumbnails:', thumbnails);
      
      if (!thumbnails || !Array.isArray(thumbnails)) {
        console.error('Invalid thumbnails data:', thumbnails);
        return;
      }
      
      // Detect platform and separate content
      const platform = thumbnails[0]?.platform || 'youtube';
      console.log('Detected platform:', platform);
      
      if (platform === 'tiktok') {
        tiktokVideos = [...tiktokVideos, ...thumbnails];
      } else {
        youtubeVideos = [...youtubeVideos, ...thumbnails];
      }
      
      if (editor && thumbnails.length > 0) {
        try {
          // Get current layout info
          const layouts = calculateMixedLayout(youtubeVideos.length, tiktokVideos.length);
          const platformLayout = layouts[platform];
          
          let shapes;
          
          if (platform === 'tiktok') {
            // Create TikTok shapes
            shapes = thumbnails.map((video, index) => {
              console.log('Processing TikTok video:', video);
              
              const row = Math.floor(index / platformLayout.columns);
              const col = index % platformLayout.columns;
              
              return {
                id: createShapeId(`tiktok-${video.id}`),
                type: 'tiktok-video',
                x: platformLayout.startX + col * (platformLayout.itemWidth + platformLayout.spacing),
                y: platformLayout.startY + row * (platformLayout.itemHeight + platformLayout.spacing),
                props: {
                  videoId: video.id,
                  title: video.title || 'TikTok Video',
                  coverUrl: video.url || '',
                  username: video.creator?.username || 'unknown',
                  displayName: video.creator?.displayName || 'Unknown User',
                  playCount: video.metrics?.viewCount || 0,
                  likeCount: video.metrics?.likeCount || 0,
                  commentCount: video.metrics?.commentCount || 0,
                  shareCount: video.metrics?.shareCount || 0,
                  engagement: video.engagement || 0,
                  isViral: video.engagement > 10,
                  w: platformLayout.itemWidth,
                  h: platformLayout.itemHeight,
                  locked: false,
                  showMetrics: true,
                  musicTitle: video.music?.title || '',
                  musicArtist: video.music?.author || '',
                  hashtags: video.hashtags || [],
                  verified: video.creator?.verified || false,
                  trendingScore: video.engagement || 0,
                  importedAt: video.importedAt || new Date().toISOString()
                }
              };
            });
          } else {
            // Create YouTube shapes (existing logic with new layout)
            shapes = thumbnails.map((video, index) => {
              console.log('Processing video structure:', {
                id: video.id,
                snippet: video.snippet,
                statistics: video.statistics,
                metrics: video.metrics,
                fullVideo: video
              });
              
              // Handle different possible data structures
              const videoId = video.id?.videoId || video.id || video.videoId || `video-${index}`;
              const snippet = video.snippet || video;
              
              // Try to get statistics from multiple possible locations
              const statistics = video.statistics || video.metrics || {};
              
              // For formatted videos from youtubeApi.js, metrics might be nested
              const metricsData = video.metrics || {};
              const finalStats = {
                viewCount: statistics.viewCount || metricsData.viewCount || '0',
                likeCount: statistics.likeCount || metricsData.likeCount || '0',
                commentCount: statistics.commentCount || metricsData.commentCount || '0'
              };
              
              console.log('Final statistics for processing:', {
                videoId,
                finalStats,
                originalStats: statistics,
                originalMetrics: metricsData
              });
              
              if (!videoId) {
                console.error('No video ID found for video:', video);
                return null;
              }
              
              const views = parseViewCount(finalStats.viewCount);
              const engagement = calculateEngagement(finalStats);
              
              console.log('Calculated metrics:', {
                videoId,
                title: snippet.title,
                views,
                engagement,
                rawViewCount: finalStats.viewCount
              });
              
              const row = Math.floor(index / platformLayout.columns);
              const col = index % platformLayout.columns;
              
              return {
                id: createShapeId(`youtube-${videoId}`),
                type: 'youtube-thumbnail',
                x: platformLayout.startX + col * (platformLayout.itemWidth + platformLayout.spacing),
                y: platformLayout.startY + row * (platformLayout.itemHeight + platformLayout.spacing),
                props: {
                  videoId: videoId,
                  title: snippet.title || 'Unknown Title',
                  thumbnailUrl: getBestThumbnailUrl(video),
                  channelName: snippet.channelTitle || snippet.channelName || 'Unknown Channel',
                  views: views,
                  engagement: engagement,
                  isViral: isVideoViral(finalStats),
                  zScore: calculateZScore(finalStats),
                  w: platformLayout.itemWidth,
                  h: platformLayout.itemHeight,
                  locked: false,
                  showMetrics: true
                }
              };
            });
          }

          // Filter out any null shapes
          const validShapes = shapes.filter(shape => shape !== null);
          
          console.log('Creating shapes:', validShapes);
          
          if (validShapes.length > 0) {
            editor.createShapes(validShapes);
          } else {
            console.error('No valid shapes to create');
          }
          
          setTimeout(() => {
            editor.zoomToFit();
          }, 100);
          
          console.log('Successfully imported', shapes.length, 'thumbnails');
        } catch (error) {
          console.error('Error creating tldraw shapes:', error);
        }
      } else {
        console.warn('No editor or no thumbnails to import');
      }
      
      refresh();
    }
  };

  // YouTube data processing functions (simplified from existing code)
  const getBestThumbnailUrl = (video) => {
    // Handle different possible data structures
    const thumbnails = video.snippet?.thumbnails || video.thumbnails;
    
    if (!thumbnails) {
      console.warn('No thumbnails found for video:', video);
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjRkFGQUZBIi8+CjxwYXRoIGQ9Ik0xNDQuNSA5MEwxNjggNzguNVYxMDEuNUwxNDQuNSA5MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHN2Zz4K';
    }
    
    if (thumbnails.maxres) return thumbnails.maxres.url;
    if (thumbnails.high) return thumbnails.high.url;
    if (thumbnails.medium) return thumbnails.medium.url;
    return thumbnails.default?.url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjRkFGQUZBIi8+CjxwYXRoIGQ9Ik0xNDQuNSA5MEwxNjggNzguNVYxMDEuNUwxNDQuNSA5MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHN2Zz4K';
  };

  const parseViewCount = (viewCountStr) => {
    if (!viewCountStr) return 0;
    return parseInt(viewCountStr, 10) || 0;
  };

  const calculateEngagement = (statistics) => {
    if (!statistics) return 0;
    const views = parseInt(statistics.viewCount || '0', 10);
    const likes = parseInt(statistics.likeCount || '0', 10);
    const comments = parseInt(statistics.commentCount || '0', 10);
    if (views === 0) return 0;
    const engagementActions = likes + comments;
    return Math.round((engagementActions / views) * 100 * 100) / 100;
  };

  const isVideoViral = (statistics) => {
    if (!statistics) return false;
    const views = parseInt(statistics.viewCount || '0', 10);
    const engagement = calculateEngagement(statistics);
    return views > 1000000 && engagement > 5;
  };

  const calculateZScore = (statistics) => {
    if (!statistics) return 0;
    const views = parseInt(statistics.viewCount || '0', 10);
    const engagement = calculateEngagement(statistics);
    return Math.round((Math.log10(views + 1) + engagement / 10) * 100) / 100;
  };



  // Calculate sidebar offsets (matching original logic)
  const mainSidebarWidth = sidebarOpen ? 240 : 60;
  const contentImportWidth = showContentImport ? 380 : 0;
  const leftOffset = mainSidebarWidth + contentImportWidth;
  
  // Dual sidebar is positioned from right
  const dualSidebarOffsetWidth = showDualSidebar ? 60 : 0; // Always 60px when visible (collapsed or expanded)

  return (
    <div className="flex h-screen bg-background-primary">
      {/* Keep the essential YouTube import UI */}
      <MainSidebar 
        isOpen={sidebarOpen}
        onToggle={() => mockUIActions.setSidebarOpen(!sidebarOpen)}
        onAddContent={() => mockUIActions.setShowContentImportSidebar(true)}
        width={240}
      />
      
      <ContentImportSidebar 
        isOpen={showContentImport}
        onClose={() => mockUIActions.setShowContentImportSidebar(false)}
        onVideosImported={(videos, channelInfo) => {
          console.log('ContentImportSidebar imported:', videos.length, 'videos from', channelInfo?.title);
          mockCanvasActions.importThumbnails(videos);
        }}
        onCreateChannelHeader={(channelName) => {
          console.log('Create channel header for:', channelName);
          // Could add channel header logic here later
        }}
        sidebarWidth={sidebarOpen ? 240 : 60}
      />
      
      {showYouTubeImporter && (
        <YouTubeImporter 
          onClose={() => mockUIActions.setShowYouTubeImporter(false)}
          onVideosImported={(videos, channelInfo) => {
            console.log('YouTubeImporter imported:', videos.length, 'videos from', channelInfo?.title);
            mockCanvasActions.importThumbnails(videos);
          }}
          onCreateChannelHeader={(channelName) => {
            console.log('Create channel header for:', channelName);
            // Could add channel header logic here later
          }}
        />
      )}
      
      {/* Main canvas area */}
      <div className="flex-1" style={{ 
        marginLeft: `${leftOffset}px`,
        marginRight: `${dualSidebarOffsetWidth}px`
      }}>
        <div className="h-full relative">
          {/* tldraw canvas */}
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <Tldraw 
              onMount={handleEditorMount}
              shapeUtils={shapeUtils}
              hideUi={false}
              components={tldrawComponents}
            />
            
            
            {/* Hide tldraw watermark */}
            <style dangerouslySetInnerHTML={{
              __html: `
                .tl-watermark_SEE-LICENSE {
                  display: none !important;
                }
              `
            }} />
          </div>
          
          
        </div>
      </div>
      
      {/* Dual Sidebar (Analytics + AI Art Director) */}
      <DualSidebar
        isVisible={showDualSidebar}
        thumbnail={selectedThumbnailForSidebar}
        width={dualSidebarWidth}
        onWidthChange={setDualSidebarWidth}
      />
    </div>
  );
};

export default TldrawCanvasHybrid;