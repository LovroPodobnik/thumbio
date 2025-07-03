import { ShapeUtil, T, HTMLContainer, Rectangle2d } from '@tldraw/tldraw';
import React from 'react';

// Note: CSS injection removed - using inline styles instead for better control

/**
 * TikTok Video Shape Properties
 * Optimized for vertical 9:16 format and TikTok-specific metadata
 */
export const tiktokShapeProps = {
  videoId: T.string,
  title: T.string,
  coverUrl: T.string,
  username: T.string,
  displayName: T.string,
  playCount: T.number,
  likeCount: T.number,
  commentCount: T.number,
  shareCount: T.number,
  engagement: T.number,
  isViral: T.boolean,
  w: T.number,
  h: T.number,
  locked: T.boolean,
  showMetrics: T.boolean,
  
  // TikTok-specific metadata
  musicTitle: T.string,
  musicArtist: T.string,
  hashtags: T.arrayOf(T.string),
  verified: T.boolean,
  trendingScore: T.number,
  importedAt: T.string
};

// Note: Helper components removed for simplicity - using inline elements instead

/**
 * TikTok Shape Component - Main rendering component
 */
const TikTokShapeComponent = ({ shape }) => {
  const { props } = shape;
  const { 
    coverUrl, 
    title, 
    username, 
    playCount, 
    likeCount, 
    isViral, 
    w, 
    h, 
    locked, 
    showMetrics 
  } = props;
  
  const formatViews = (num) => {
    if (!num || num === 0) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
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
        backgroundColor: '#161823',
        cursor: locked ? 'not-allowed' : 'default',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none'
      }}
    >
      {/* Cover Image */}
      <img
        src={coverUrl}
        alt={title}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: locked ? 0.6 : 1,
          pointerEvents: 'none',
          userSelect: 'none'
        }}
        onError={(e) => {
          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjcwIiBoZWlnaHQ9IjQ4MCIgdmlld0JveD0iMCAwIDI3MCA0ODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyNzAiIGhlaWdodD0iNDgwIiBmaWxsPSIjMTYxODIzIi8+Cjwvc3ZnPg==';
        }}
      />
      
      {/* Video Info */}
      {showMetrics && (
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
            @{username}
          </div>
          <div style={{ opacity: 0.8 }}>
            {formatViews(playCount)} views • {formatViews(likeCount)} likes
          </div>
        </div>
      )}
      
      {/* Viral Badge */}
      {isViral && (
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: '#ff0050',
          color: 'white',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '10px',
          fontWeight: 'bold',
          pointerEvents: 'none'
        }}>
          VIRAL
        </div>
      )}
      
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

/**
 * TikTok Shape Utility Class
 */
export class TikTokShapeUtil extends ShapeUtil {
  static type = 'tiktok-video';
  static props = tiktokShapeProps;
  
  // Add aspect ratio locking
  isAspectRatioLocked = () => true;

  getDefaultProps() {
    return {
      videoId: '',
      title: 'TikTok Video',
      coverUrl: '',
      username: '',
      displayName: '',
      playCount: 0,
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
      engagement: 0,
      isViral: false,
      w: 270,  // 9:16 aspect ratio
      h: 480,
      locked: false,
      showMetrics: true,
      musicTitle: '',
      musicArtist: '',
      hashtags: [],
      verified: false,
      trendingScore: 0,
      importedAt: new Date().toISOString()
    };
  }

  getGeometry(shape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      x: 0,
      y: 0,
      isFilled: true  // Critical: Makes the entire shape clickable, not just edges
    });
  }


  component(shape) {
    return (
      <HTMLContainer>
        <TikTokShapeComponent shape={shape} />
      </HTMLContainer>
    );
  }

  indicator(shape) {
    return (
      <rect
        width={shape.props.w}
        height={shape.props.h}
        stroke={shape.props.locked ? '#ef4444' : '#ff0050'}
        strokeWidth="2"
        fill="none"
      />
    );
  }

  // Interaction controls
  canEdit(shape) {
    return !shape.props.locked;
  }

  canSelect(shape) {
    return !shape.props.locked;
  }

  canResize(shape) {
    return !shape.props.locked;
  }

  canMove(shape) {
    return !shape.props.locked;
  }

  canBind() {
    return false;
  }

  // Override hit testing to ensure clicks are detected
  hitTestPoint(shape, point) {
    const bounds = this.getGeometry(shape);
    return bounds.hitTestPoint(point);
  }

  // Override hit testing for line segments (selection rectangles)
  hitTestLineSegment(shape, A, B) {
    const bounds = this.getGeometry(shape);
    return bounds.hitTestLineSegment(A, B);
  }

  // Maintain aspect ratio during resize
  onResize(shape, info) {
    const aspectRatio = 9 / 16; // TikTok aspect ratio
    let { w, h } = info.props;
    
    // Maintain aspect ratio
    if (w / h > aspectRatio) {
      w = h * aspectRatio;
    } else {
      h = w / aspectRatio;
    }
    
    return {
      props: {
        ...info.props,
        w: Math.max(135, w), // Minimum width
        h: Math.max(240, h)  // Minimum height
      }
    };
  }
}

export default TikTokShapeUtil;