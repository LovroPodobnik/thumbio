import React, { useState, useEffect, useMemo } from 'react';
import { Tldraw, createShapeId, ShapeUtil, HTMLContainer, T, Rectangle2d, TldrawUi, useEditor } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';

// Pure YouTube data - no complex state management
const mockYouTubeData = [
  {
    videoId: 'video1',
    title: 'Amazing Thumbnail Design Tips',
    thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    channelName: 'Design Pro',
    views: 125000,
    engagement: 8.5,
    isViral: true,
    zScore: 2.3
  },
  {
    videoId: 'video2', 
    title: 'Canvas Performance Optimization',
    thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    channelName: 'Tech Insights',
    views: 45000,
    engagement: 6.2,
    isViral: false,
    zScore: 1.1
  },
  {
    videoId: 'video3',
    title: 'React Best Practices 2024',
    thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    channelName: 'Code Master',
    views: 89000,
    engagement: 7.8,
    isViral: false,
    zScore: 1.8
  }
];

// Simple thumbnail shape props using only tldraw validators
const thumbnailShapeProps = {
  videoId: T.string,
  title: T.string,
  thumbnailUrl: T.string,
  channelName: T.string,
  views: T.number,
  engagement: T.number,
  isViral: T.boolean,
  zScore: T.number,  // Added missing zScore property
  w: T.number,
  h: T.number,
  locked: T.boolean,
  showMetrics: T.boolean
};

// Clean YouTube thumbnail component - no external dependencies
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
      {/* Thumbnail Image */}
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
      
      {/* Performance Badges */}
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
      
      {/* Video Info */}
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
      
      {/* Lock Overlay */}
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

// Pure tldraw shape util - no external dependencies
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
      zScore: 0,  // Added missing zScore default
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

// Pure tldraw canvas - no external state management
const TldrawCanvasPure = () => {
  const [editor, setEditor] = useState(null);

  // Only tldraw shape utils
  const shapeUtils = useMemo(() => [ThumbnailShapeUtil], []);

  // Initialize with sample data using only tldraw APIs
  useEffect(() => {
    if (!editor) return;

    const thumbnailShapes = mockYouTubeData.map((video, index) => ({
      id: createShapeId(`thumbnail-${video.videoId}`),
      type: 'youtube-thumbnail',
      x: 100 + (index * 360),
      y: 100,
      props: {
        ...video,
        w: 320,
        h: 180
      }
    }));

    editor.createShapes(thumbnailShapes);
    
    // Fit view to content
    setTimeout(() => {
      editor.zoomToFit();
    }, 100);

  }, [editor]);

  // Simple actions that work with the editor
  const handleToggleLock = () => {
    if (!editor) return;
    
    const selectedShapes = editor.getSelectedShapes();
    const thumbnailShapes = selectedShapes.filter(shape => shape.type === 'youtube-thumbnail');
    
    if (thumbnailShapes.length === 0) return;
    
    const updates = thumbnailShapes.map(shape => ({
      id: shape.id,
      type: shape.type,
      props: {
        ...shape.props,
        locked: !shape.props.locked
      }
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
      props: {
        ...shape.props,
        showMetrics: !shape.props.showMetrics
      }
    }));
    
    editor.updateShapes(updates);
  };

  // Get selection info for display
  const selectedShapes = editor ? editor.getSelectedShapes() : [];
  const thumbnailShapes = selectedShapes.filter(shape => shape.type === 'youtube-thumbnail');

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      {/* Pure tldraw with native UI */}
      <Tldraw 
        onMount={setEditor}
        shapeUtils={shapeUtils}
        hideUi={false} // Show tldraw's native UI
      />
      
      {/* Simple action buttons outside of tldraw */}
      {editor && thumbnailShapes.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          zIndex: 1000,
          background: 'white',
          padding: '12px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          display: 'flex',
          gap: '8px',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
            {thumbnailShapes.length} thumbnail{thumbnailShapes.length !== 1 ? 's' : ''} selected:
          </span>
          
          <button 
            onClick={handleToggleLock}
            style={{
              padding: '6px 12px',
              border: 'none',
              borderRadius: '4px',
              background: '#ef4444',
              color: 'white',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            🔒 Toggle Lock
          </button>
          
          <button 
            onClick={handleToggleMetrics}
            style={{
              padding: '6px 12px',
              border: 'none',
              borderRadius: '4px',
              background: '#10b981',
              color: 'white',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            📊 Toggle Metrics
          </button>
        </div>
      )}
      
      {/* Info panel */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        right: '16px',
        background: 'white',
        padding: '12px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        fontSize: '12px',
        color: '#64748b',
        maxWidth: '250px'
      }}>
        <div><strong>Pure tldraw Implementation</strong></div>
        <div>• Uses only tldraw native functionality</div>
        <div>• No old canvas code dependencies</div>
        <div>• Custom YouTube thumbnail shapes</div>
        <div>• Try selecting thumbnails!</div>
        <div>• Use V, H, P, T, R, E shortcuts</div>
      </div>
    </div>
  );
};

export default TldrawCanvasPure;