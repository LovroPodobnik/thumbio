import React from 'react';

const RemoteCursors = ({ cursors, viewportTransform }) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-50" style={{ overflow: 'hidden' }}>
      {Object.entries(cursors).map(([userId, cursor]) => {
        // Convert world coordinates to screen coordinates
        const screenX = cursor.x * viewportTransform.scale + viewportTransform.x;
        const screenY = cursor.y * viewportTransform.scale + viewportTransform.y;
        
        // Don't render if cursor is off-screen
        if (screenX < -50 || screenX > window.innerWidth + 50 || 
            screenY < -50 || screenY > window.innerHeight + 50) {
          return null;
        }
        
        return (
          <div
            key={userId}
            className="absolute transition-all duration-75 ease-out"
            style={{
              left: screenX,
              top: screenY,
              transform: 'translate(-50%, -50%)'
            }}
          >
            {/* Cursor SVG */}
            <svg 
              width="24" 
              height="36" 
              viewBox="0 0 24 36" 
              fill="none"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
            >
              <path
                d="M5.65 12.3a1 1 0 0 0-.8 1.2L8.73 23l1.67-6.68L17.07 18l-1.2-4.27L5.65 12.3Z"
                fill={cursor.color}
                stroke="white"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
            
            {/* User name label */}
            <div 
              className="absolute top-8 left-3 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap shadow-sm"
              style={{ 
                backgroundColor: cursor.color,
                color: 'white'
              }}
            >
              {cursor.name}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RemoteCursors;