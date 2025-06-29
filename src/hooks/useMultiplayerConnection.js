import { useState, useEffect, useRef } from 'react';
import { multiplayerManager } from '../services/multiplayerManager';
import { throttle } from '../components/canvas/SelectionRectangle';

export const useMultiplayerConnection = (isEnabled = false) => {
  const [isConnected, setIsConnected] = useState(false);
  const [remoteCursors, setRemoteCursors] = useState({});
  const [userCount, setUserCount] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const lastCursorPositionRef = useRef({ x: 0, y: 0 });

  // Setup multiplayer cursor tracking
  const setupCursorTracking = (app, viewport) => {
    const handlePointerMove = throttle((e) => {
      if (isEnabled && multiplayerManager.isConnected) {
        const globalPos = e.global || e.data.global;
        const localPos = viewport.toLocal(globalPos);
        
        // Only send if position changed significantly
        const dx = Math.abs(localPos.x - lastCursorPositionRef.current.x);
        const dy = Math.abs(localPos.y - lastCursorPositionRef.current.y);
        
        if (dx > 2 || dy > 2) {
          multiplayerManager.sendCursor(localPos.x, localPos.y);
          lastCursorPositionRef.current = { x: localPos.x, y: localPos.y };
        }
      }
    }, 50); // Throttle to 20 updates per second
    
    const handlePointerLeave = () => {
      if (isEnabled && multiplayerManager.isConnected) {
        multiplayerManager.sendCursorLeave();
      }
    };

    // Listen for pointer events on stage
    app.stage.on('pointermove', handlePointerMove);
    app.stage.on('pointerleave', handlePointerLeave);

    return () => {
      app.stage.off('pointermove', handlePointerMove);
      app.stage.off('pointerleave', handlePointerLeave);
    };
  };

  // Multiplayer connection management
  useEffect(() => {
    if (isEnabled) {
      // Connect to multiplayer
      multiplayerManager.connect('canvas-main');
      
      // Set up event listeners
      const unsubscribers = [];
      
      unsubscribers.push(
        multiplayerManager.on('connected', () => {
          setIsConnected(true);
          console.log('Connected to multiplayer');
        })
      );
      
      unsubscribers.push(
        multiplayerManager.on('disconnected', () => {
          setIsConnected(false);
          setRemoteCursors({});
          setUserCount(0);
        })
      );
      
      unsubscribers.push(
        multiplayerManager.on('identity', (data) => {
          setCurrentUser({
            id: data.userId,
            name: data.name,
            color: data.color
          });
        })
      );
      
      unsubscribers.push(
        multiplayerManager.on('sync', (data) => {
          // Initial sync of all users
          const cursors = {};
          Object.entries(data.cursors || {}).forEach(([userId, cursor]) => {
            if (userId !== multiplayerManager.userId) {
              cursors[userId] = cursor;
            }
          });
          setRemoteCursors(cursors);
          setUserCount(data.connectionCount || 0);
        })
      );
      
      unsubscribers.push(
        multiplayerManager.on('cursor', (data) => {
          if (data.userId !== multiplayerManager.userId) {
            setRemoteCursors(prev => ({
              ...prev,
              [data.userId]: {
                x: data.x,
                y: data.y,
                name: data.name,
                color: data.color,
                timestamp: Date.now()
              }
            }));
          }
        })
      );
      
      unsubscribers.push(
        multiplayerManager.on('cursor-leave', (data) => {
          setRemoteCursors(prev => {
            const updated = { ...prev };
            delete updated[data.userId];
            return updated;
          });
        })
      );
      
      unsubscribers.push(
        multiplayerManager.on('user-joined', (data) => {
          setUserCount(data.connectionCount || 0);
        })
      );
      
      unsubscribers.push(
        multiplayerManager.on('user-left', (data) => {
          setRemoteCursors(prev => {
            const updated = { ...prev };
            delete updated[data.userId];
            return updated;
          });
          setUserCount(data.connectionCount || 0);
        })
      );
      
      // Clean up stale cursors
      const interval = setInterval(() => {
        setRemoteCursors(prev => {
          const now = Date.now();
          const updated = {};
          Object.entries(prev).forEach(([id, cursor]) => {
            if (now - cursor.timestamp < 5000) { // 5 second timeout
              updated[id] = cursor;
            }
          });
          return updated;
        });
      }, 1000);
      
      return () => {
        unsubscribers.forEach(unsub => unsub());
        clearInterval(interval);
        multiplayerManager.disconnect();
      };
    } else {
      // Clean up when disabled
      multiplayerManager.disconnect();
      setIsConnected(false);
      setRemoteCursors({});
      setUserCount(0);
      setCurrentUser(null);
    }
  }, [isEnabled]);

  return {
    isConnected,
    remoteCursors,
    userCount,
    currentUser,
    setupCursorTracking
  };
};