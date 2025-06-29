import React from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import * as Avatar from '@radix-ui/react-avatar';
import { Users, Wifi, WifiOff } from 'lucide-react';
import { cn } from '../../lib/utils';

const ConnectedUsers = ({ 
  isConnected, 
  userCount, 
  currentUser,
  remoteCursors = {},
  onToggle,
  isEnabled 
}) => {
  
  // Get all unique users from remote cursors
  const allUsers = React.useMemo(() => {
    const users = Object.values(remoteCursors).reduce((acc, cursor) => {
      if (cursor.name && cursor.color) {
        acc[cursor.userId] = {
          id: cursor.userId,
          name: cursor.name,
          color: cursor.color
        };
      }
      return acc;
    }, {});
    
    // Add current user if available
    if (currentUser) {
      users[currentUser.id || 'current'] = currentUser;
    }
    
    return Object.values(users);
  }, [remoteCursors, currentUser]);

  const totalUsers = Math.max(userCount, allUsers.length);

  return (
    <div className="flex items-center gap-3">
      {/* Connection Status & User Count */}
      <div className="flex items-center gap-2">
        {isEnabled && (
          <>
            {/* Connection Indicator */}
            <div className="flex items-center gap-1.5">
              {isConnected ? (
                <Wifi className="w-4 h-4 text-green-600" />
              ) : (
                <WifiOff className="w-4 h-4 text-yellow-600" />
              )}
              <span className="text-sm font-medium text-text-secondary">
                {isConnected ? 'Connected' : 'Connecting...'}
              </span>
            </div>
            
            {/* User Count */}
            {isConnected && totalUsers > 0 && (
              <span className="text-sm text-text-tertiary">
                {totalUsers} {totalUsers === 1 ? 'user' : 'users'}
              </span>
            )}
          </>
        )}
        
        {!isEnabled && (
          <span className="text-sm text-text-tertiary">Multiplayer off</span>
        )}
      </div>

      {/* User Avatars */}
      {isEnabled && isConnected && allUsers.length > 0 && (
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <div className="flex items-center -space-x-2 relative">
              {allUsers.slice(0, 5).map((user, index) => (
                <Avatar.Root 
                  key={user.id}
                  className="w-8 h-8 rounded-full border-2 border-white shadow-sm relative"
                  style={{ zIndex: 10 - index }}
                >
                  <Avatar.Fallback 
                    className="w-full h-full flex items-center justify-center text-xs font-medium text-white rounded-full"
                    style={{ backgroundColor: user.color }}
                  >
                    {user.name?.charAt(0)?.toUpperCase() || '?'}
                  </Avatar.Fallback>
                </Avatar.Root>
              ))}
              
              {allUsers.length > 5 && (
                <div className="w-8 h-8 rounded-full border-2 border-white bg-background-secondary shadow-sm flex items-center justify-center text-xs font-medium text-text-secondary">
                  +{allUsers.length - 5}
                </div>
              )}
            </div>
          </Tooltip.Trigger>
          {allUsers.length > 1 && (
            <Tooltip.Portal>
              <Tooltip.Content 
                className="bg-background-primary border border-border-divider rounded-lg shadow-lg p-3 min-w-48 z-50"
                side="bottom"
                align="end"
                sideOffset={8}
              >
                <div className="text-xs font-medium text-text-secondary mb-2">
                  Connected Users
                </div>
                <div className="space-y-2">
                  {allUsers.map(user => (
                    <div key={user.id} className="flex items-center gap-2">
                      <Avatar.Root className="w-4 h-4">
                        <Avatar.Fallback 
                          className="w-full h-full flex items-center justify-center text-xs font-medium text-white rounded-full border border-white"
                          style={{ backgroundColor: user.color }}
                        >
                          {user.name?.charAt(0)?.toUpperCase() || '?'}
                        </Avatar.Fallback>
                      </Avatar.Root>
                      <span className="text-sm text-text-primary">{user.name}</span>
                      {user.id === (currentUser?.id || 'current') && (
                        <span className="text-xs text-text-tertiary">(You)</span>
                      )}
                    </div>
                  ))}
                </div>
                <Tooltip.Arrow className="fill-background-primary" />
              </Tooltip.Content>
            </Tooltip.Portal>
          )}
        </Tooltip.Root>
      )}

      {/* Toggle Button */}
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            onClick={onToggle}
            className={cn(
              "p-2 rounded-md transition-all duration-200 border",
              isEnabled && isConnected
                ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                : isEnabled && !isConnected
                ? "bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
                : "bg-background-secondary border-border-divider text-text-secondary hover:bg-background-tertiary"
            )}
          >
            <Users className="w-4 h-4" />
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content 
            className="bg-text-primary text-background-primary text-xs px-2 py-1 rounded shadow-lg"
            sideOffset={5}
          >
            {isEnabled ? "Disable multiplayer" : "Enable multiplayer"}
            <Tooltip.Arrow className="fill-text-primary" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </div>
  );
};

export default ConnectedUsers;