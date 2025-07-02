import React, { useState, useEffect, useMemo } from 'react';
import { Tldraw, createShapeId, ShapeUtil, HTMLContainer, T, Rectangle2d } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';

// Mock YouTube data for demonstration
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
  }
];

// Define the thumbnail shape type with proper validators
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

// YouTube Thumbnail Shape Component
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

  // Format view count
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
        backgroundColor: '#f3f4f6'
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
          opacity: locked ? 0.6 : 1
        }}
        onError={(e) => {
          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjRkFGQUZBIi8+CjxwYXRoIGQ9Ik0xNDQuNSA5MEwxNjggNzguNVYxMDEuNUwxNDQuNSA5MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHN2Zz4K';
        }}
      />
      
      {/* Performance Overlay */}
      {showMetrics && (
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          display: 'flex',
          gap: '4px'
        }}>
          {/* Viral Badge */}
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
          
          {/* Engagement Badge */}
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
      
      {/* Bottom Info Bar */}
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
      
      {/* Locked Indicator */}
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

// Custom Shape Util for YouTube Thumbnails
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

// Proof of Concept Component
const TldrawCanvasPOC = () => {
  const [editor, setEditor] = useState(null);
  const [selectedThumbnails, setSelectedThumbnails] = useState(new Set());

  // Custom shape utilities
  const shapeUtils = useMemo(() => [ThumbnailShapeUtil], []);

  // Initialize with sample YouTube thumbnails
  useEffect(() => {
    if (!editor) return;

    // Create sample thumbnail shapes
    const thumbnailShapes = mockYouTubeData.map((video, index) => ({
      id: createShapeId(`thumbnail-${video.videoId}`),
      type: 'youtube-thumbnail',
      x: 100 + (index * 350),
      y: 100,
      props: {
        ...video,
        w: 320,
        h: 180
      }
    }));

    // Add shapes to canvas
    editor.createShapes(thumbnailShapes);
    
    // Fit view to content
    setTimeout(() => {
      editor.zoomToFit();
    }, 100);

  }, [editor]);

  // Handle selection changes
  useEffect(() => {
    if (!editor) return;

    const handleSelectionChange = () => {
      const selection = editor.getSelectedShapeIds();
      const thumbnailSelection = new Set(
        selection.filter(id => {
          const shape = editor.getShape(id);
          return shape?.type === 'youtube-thumbnail';
        })
      );
      setSelectedThumbnails(thumbnailSelection);
    };

    editor.on('selection-change', handleSelectionChange);
    return () => editor.off('selection-change', handleSelectionChange);
  }, [editor]);

  // Demo functions
  const toggleLockSelected = () => {
    if (!editor || selectedThumbnails.size === 0) return;
    
    const updates = Array.from(selectedThumbnails).map(id => {
      const shape = editor.getShape(id);
      return {
        id,
        type: shape.type,
        props: {
          ...shape.props,
          locked: !shape.props.locked
        }
      };
    });
    
    editor.updateShapes(updates);
  };

  const toggleMetricsDisplay = () => {
    if (!editor || selectedThumbnails.size === 0) return;
    
    const updates = Array.from(selectedThumbnails).map(id => {
      const shape = editor.getShape(id);
      return {
        id,
        type: shape.type,
        props: {
          ...shape.props,
          showMetrics: !shape.props.showMetrics
        }
      };
    });
    
    editor.updateShapes(updates);
  };

  const addCommentPin = () => {
    if (!editor) return;
    
    // Add a simple text shape as a comment pin demo
    const pinShape = {
      id: createShapeId('comment-pin'),
      type: 'text',
      x: 200,
      y: 50,
      props: {
        text: '💬 Sample Comment Pin\nThis could be a custom CommentPinShape',
        size: 's',
        color: 'red'
      }
    };
    
    editor.createShape(pinShape);
  };

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Demo Controls */}
      <div style={{ 
        padding: '12px', 
        background: '#f8fafc', 
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        gap: '12px',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0, color: '#1e293b' }}>
          tldraw POC - YouTube Thumbnail Canvas
        </h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={toggleLockSelected}
            disabled={selectedThumbnails.size === 0}
            style={{
              padding: '6px 12px',
              background: selectedThumbnails.size > 0 ? '#3b82f6' : '#94a3b8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: selectedThumbnails.size > 0 ? 'pointer' : 'not-allowed'
            }}
          >
            🔒 Toggle Lock ({selectedThumbnails.size})
          </button>
          <button 
            onClick={toggleMetricsDisplay}
            disabled={selectedThumbnails.size === 0}
            style={{
              padding: '6px 12px',
              background: selectedThumbnails.size > 0 ? '#10b981' : '#94a3b8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: selectedThumbnails.size > 0 ? 'pointer' : 'not-allowed'
            }}
          >
            📊 Toggle Metrics ({selectedThumbnails.size})
          </button>
          <button 
            onClick={addCommentPin}
            style={{
              padding: '6px 12px',
              background: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            💬 Add Comment Pin
          </button>
        </div>
      </div>

      {/* tldraw Canvas */}
      <div style={{ flex: 1 }}>
        <Tldraw 
          onMount={setEditor}
          shapeUtils={shapeUtils}
          hideUi={false}
        />
      </div>
      
      {/* Demo Info */}
      <div style={{ 
        padding: '8px 12px', 
        background: '#f1f5f9', 
        borderTop: '1px solid #e2e8f0',
        fontSize: '12px',
        color: '#64748b'
      }}>
        <strong>POC Features:</strong> Custom YouTube thumbnail shapes with performance badges, 
        locked state handling, selection sync, and demo controls. 
        Try selecting thumbnails and using the buttons above!
      </div>
    </div>
  );
};

export default TldrawCanvasPOC;