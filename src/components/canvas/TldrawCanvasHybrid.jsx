import React, { useState, useMemo } from 'react';
import { Tldraw, createShapeId, ShapeUtil, HTMLContainer, T, Rectangle2d } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';

// Import ONLY the essential YouTube functionality - no complex canvas state
import MainSidebar from './MainSidebar';
import ContentImportSidebar from './ContentImportSidebar';
import YouTubeImporter from './YouTubeImporter';

// Simple YouTube data storage (replace complex state management)
let youtubeVideos = [];
let showContentImport = false;
let showYouTubeImporter = false;
let sidebarOpen = false; // Start collapsed by default like original

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
const ThumbnailShapeComponent = ({ shape }) => {
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

  return (
    <div 
      style={{ 
        width: w, 
        height: h, 
        position: 'relative',
        border: locked ? '2px solid #ef4444' : '1px solid #e5e7eb',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: '#f3f4f6',
        cursor: locked ? 'not-allowed' : 'pointer',
        userSelect: 'none'
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
          pointerEvents: 'none'
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
          gap: '4px',
          pointerEvents: 'none'
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
        fontSize: '12px',
        pointerEvents: 'none'
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
          fontWeight: 'bold',
          pointerEvents: 'none'
        }}>
          🔒 LOCKED
        </div>
      )}
    </div>
  );
};

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
      y: 0
    })
  }
  
  component(shape) {
    return (
      <HTMLContainer>
        <ThumbnailShapeComponent shape={shape} />
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
}

// Hybrid canvas - combines YouTube import with pure tldraw
const TldrawCanvasHybrid = () => {
  const [editor, setEditor] = useState(null);
  const [, forceUpdate] = useState({});

  const shapeUtils = useMemo(() => [ThumbnailShapeUtil], []);


  // Force re-render function
  const refresh = () => forceUpdate({});

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

  // Simple mock implementation of canvas actions
  const mockCanvasActions = {
    importThumbnails: (thumbnails) => {
      console.log('Importing thumbnails:', thumbnails);
      
      if (!thumbnails || !Array.isArray(thumbnails)) {
        console.error('Invalid thumbnails data:', thumbnails);
        return;
      }
      
      youtubeVideos = thumbnails;
      
      if (editor && thumbnails.length > 0) {
        try {
          // Convert YouTube data to tldraw shapes
          const shapes = thumbnails.map((video, index) => {
            console.log('Processing video structure:', {
              id: video.id,
              snippet: video.snippet,
              statistics: video.statistics,
              fullVideo: video
            });
            
            // Handle different possible data structures
            const videoId = video.id?.videoId || video.id || video.videoId || `video-${index}`;
            const snippet = video.snippet || video;
            const statistics = video.statistics || {};
            
            if (!videoId) {
              console.error('No video ID found for video:', video);
              return null;
            }
            
            return {
              id: createShapeId(`youtube-${videoId}`),
              type: 'youtube-thumbnail',
              x: 100 + (index % 4) * 360,
              y: 100 + Math.floor(index / 4) * 220,
              props: {
                videoId: videoId,
                title: snippet.title || 'Unknown Title',
                thumbnailUrl: getBestThumbnailUrl(video),
                channelName: snippet.channelTitle || snippet.channelName || 'Unknown Channel',
                views: parseViewCount(statistics?.viewCount),
                engagement: calculateEngagement(statistics),
                isViral: isVideoViral(statistics),
                zScore: calculateZScore(statistics),
                w: 320,
                h: 180,
                locked: false,
                showMetrics: true
              }
            };
          });

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

  // Handle thumbnail actions
  const handleToggleLock = () => {
    if (!editor) return;
    const selectedShapes = editor.getSelectedShapes();
    const thumbnailShapes = selectedShapes.filter(shape => shape.type === 'youtube-thumbnail');
    if (thumbnailShapes.length === 0) return;
    
    const updates = thumbnailShapes.map(shape => ({
      id: shape.id,
      type: shape.type,
      props: { ...shape.props, locked: !shape.props.locked }
    }));
    
    editor.updateShapes(updates);
  };

  const handleToggleMetrics = () => {
    if (!editor) return;
    const selectedShapes = editor.getSelectedShapes();
    const thumbnailShapes = selectedShapes.filter(shape => shape.type === 'youtube-thumbnail');
    if (thumbnailShapes.length === 0) return;
    
    const updates = thumbnailShapes.map(shape => ({
      id: shape.id,
      type: shape.type,
      props: { ...shape.props, showMetrics: !shape.props.showMetrics }
    }));
    
    editor.updateShapes(updates);
  };

  // Get selection info
  const selectedShapes = editor ? editor.getSelectedShapes() : [];
  const thumbnailShapes = selectedShapes.filter(shape => shape.type === 'youtube-thumbnail');

  // Calculate sidebar offset (matching original logic)
  const mainSidebarWidth = sidebarOpen ? 240 : 60;
  const contentImportWidth = showContentImport ? 380 : 0;
  const leftOffset = mainSidebarWidth + contentImportWidth;

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
      <div className="flex-1" style={{ marginLeft: `${leftOffset}px` }}>
        <div className="h-full relative">
          {/* tldraw canvas */}
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <Tldraw 
              onMount={setEditor}
              shapeUtils={shapeUtils}
              hideUi={false}
              components={{
                Watermark: () => null, // Remove tldraw watermark
              }}
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
    </div>
  );
};

export default TldrawCanvasHybrid;