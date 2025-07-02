import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Tldraw, createShapeId, ShapeUtil, HTMLContainer, T, Rectangle2d } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';

// Import existing state management
import { CanvasStateProvider, useCanvasState } from '../../state/canvasState';
import { useCanvasActions, useSelectionActions } from '../../hooks/useCanvasActions';

// Import the state bridge
import { TldrawStateBridge } from './TldrawStateBridge';

// Import existing UI components
import TldrawTopToolbar from './TldrawTopToolbar';
import MainSidebar from './MainSidebar';
import ContentImportSidebar from './ContentImportSidebar';
import YouTubeImporter from './YouTubeImporter';

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
        backgroundColor: '#f3f4f6',
        cursor: locked ? 'not-allowed' : 'pointer'
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

// Internal component that uses the canvas state
const TldrawCanvasIntegratedInternal = () => {
  const [editor, setEditor] = useState(null);
  const stateBridgeRef = useRef(null);

  // Get state and actions from existing context
  const state = useCanvasState();
  const canvasActions = useCanvasActions();
  const selectionActions = useSelectionActions();

  // Extract data from existing state
  const { 
    canvas: { 
      youtubeThumbnails, 
      thumbnailPositions, 
      lockedThumbnails 
    },
    selection: { 
      selectedIds 
    },
    ui: { 
      sidebarOpen,
      sidebarWidth,
      showContentImportSidebar,
      showYouTubeImporter
    }
  } = state;

  // Custom shape utilities
  const shapeUtils = useMemo(() => [ThumbnailShapeUtil], []);

  // Initialize state bridge when editor is ready
  useEffect(() => {
    if (!editor) return;

    // Create state bridge
    stateBridgeRef.current = new TldrawStateBridge(
      editor,
      canvasActions,
      selectionActions
    );

    // Import existing YouTube thumbnails
    if (youtubeThumbnails.length > 0) {
      stateBridgeRef.current.importYouTubeThumbnails(
        youtubeThumbnails,
        thumbnailPositions
      );
    }

    // Cleanup on unmount
    return () => {
      if (stateBridgeRef.current) {
        stateBridgeRef.current.destroy();
      }
    };
  }, [editor, canvasActions, selectionActions]);

  // Sync new YouTube data when it changes
  useEffect(() => {
    if (stateBridgeRef.current && youtubeThumbnails.length > 0) {
      stateBridgeRef.current.importYouTubeThumbnails(
        youtubeThumbnails,
        thumbnailPositions
      );
    }
  }, [youtubeThumbnails, thumbnailPositions]);

  // Sync selection from React state to tldraw
  useEffect(() => {
    if (stateBridgeRef.current && selectedIds.size > 0) {
      stateBridgeRef.current.syncSelectionFromReactState(Array.from(selectedIds));
    }
  }, [selectedIds]);

  // Handle toolbar actions
  const handleToggleLock = () => {
    if (stateBridgeRef.current && selectedIds.size > 0) {
      stateBridgeRef.current.toggleLockSelected(Array.from(selectedIds));
    }
  };

  const handleToggleMetrics = () => {
    if (stateBridgeRef.current && selectedIds.size > 0) {
      stateBridgeRef.current.toggleMetricsDisplay(Array.from(selectedIds));
    }
  };

  return (
    <div className="flex h-screen bg-background-primary">
      {/* Main Sidebar */}
      <MainSidebar />
      
      {/* Content Import Sidebar */}
      {showContentImportSidebar && <ContentImportSidebar />}
      
      {/* YouTube Importer */}
      {showYouTubeImporter && <YouTubeImporter />}
      
      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <TldrawTopToolbar 
          editor={editor}
          selectedCount={selectedIds.size}
          onToggleLock={handleToggleLock}
          onToggleMetrics={handleToggleMetrics}
          sidebarOpen={sidebarOpen}
          sidebarWidth={sidebarWidth}
          showContentImportSidebar={showContentImportSidebar}
        />
        
        {/* Canvas Area */}
        <div className="flex-1 relative">
          {/* Integration Status */}
          <div className="absolute top-4 right-4 z-10 bg-background-secondary border border-border-divider rounded-lg p-3">
            <div className="text-sm space-y-1">
              <div className="font-medium">tldraw Integration</div>
              <div className="text-text-secondary">
                Thumbnails: {youtubeThumbnails.length}
              </div>
              <div className="text-text-secondary">
                Selected: {selectedIds.size}
              </div>
              <div className="text-text-secondary">
                Bridge: {stateBridgeRef.current ? '✅ Active' : '⏳ Loading'}
              </div>
            </div>
          </div>
          
          {/* tldraw Canvas */}
          <Tldraw 
            onMount={setEditor}
            shapeUtils={shapeUtils}
            hideUi={true}
          />
          
          {/* Loading state */}
          {!editor && (
            <div className="absolute inset-0 bg-background-primary flex items-center justify-center">
              <div className="text-text-secondary">Loading tldraw canvas...</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Wrapper component that provides state context
const TldrawCanvasIntegrated = () => {
  return (
    <CanvasStateProvider>
      <TldrawCanvasIntegratedInternal />
    </CanvasStateProvider>
  );
};

export default TldrawCanvasIntegrated;