import React from 'react';
import { Users } from 'lucide-react';
import { cn } from '../../lib/utils';

const MultiplayerStatus = ({ 
  isConnected, 
  userCount, 
  currentUser,
  onToggle,
  isEnabled 
}) => {
  return (
    <div className="flex items-center gap-2">
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className={cn(
          "p-2 rounded-lg transition-all duration-200",
          "border border-border-divider",
          isEnabled && isConnected
            ? "bg-green-50 border-green-300 text-green-700"
            : isEnabled && !isConnected
            ? "bg-yellow-50 border-yellow-300 text-yellow-700"
            : "bg-background-secondary text-text-secondary hover:bg-background-tertiary"
        )}
        title={isEnabled ? "Disable multiplayer cursors" : "Enable multiplayer cursors"}
      >
        <Users className="w-4 h-4" />
      </button>

      {/* Status Indicator */}
      {isEnabled && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-background-secondary rounded-lg border border-border-divider">
          {/* Connection Status */}
          <div className="flex items-center gap-1.5">
            <div 
              className={cn(
                "w-2 h-2 rounded-full",
                isConnected ? "bg-green-500" : "bg-yellow-500",
                isConnected && "animate-pulse"
              )} 
            />
            <span className="text-xs text-text-secondary">
              {isConnected ? 'Connected' : 'Connecting...'}
            </span>
          </div>

          {/* User Count */}
          {isConnected && userCount > 0 && (
            <>
              <div className="w-px h-4 bg-border-divider" />
              <span className="text-xs text-text-secondary">
                {userCount} {userCount === 1 ? 'user' : 'users'}
              </span>
            </>
          )}

          {/* Current User */}
          {isConnected && currentUser && (
            <>
              <div className="w-px h-4 bg-border-divider" />
              <div className="flex items-center gap-1.5">
                <div 
                  className="w-3 h-3 rounded-full border border-white"
                  style={{ backgroundColor: currentUser.color }}
                />
                <span className="text-xs text-text-secondary">
                  {currentUser.name}
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiplayerStatus;