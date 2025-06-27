import React, { useEffect, useRef, useState } from 'react';
import PartySocket from 'partysocket';

const MultiplayerTest = () => {
  const canvasRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [cursors, setCursors] = useState({});
  const [isDrawing, setIsDrawing] = useState(false);
  const [myId, setMyId] = useState(null);
  const [connectionCount, setConnectionCount] = useState(0);
  
  // Random color for each user
  const myColor = useRef(`#${Math.floor(Math.random()*16777215).toString(16)}`).current;
  const myName = useRef(`User-${Math.random().toString(36).substr(2, 5)}`).current;

  useEffect(() => {
    // Connect to PartyKit
    const ws = new PartySocket({
      host: 'localhost:1999', // Local dev server
      room: 'thumbio-test-room',
      // For production: host: 'your-project.partykit.dev'
    });

    ws.addEventListener('open', () => {
      console.log('Connected to PartyKit!');
      setIsConnected(true);
      
      // Send initial presence
      ws.send(JSON.stringify({
        type: 'join',
        data: {
          name: myName,
          color: myColor
        }
      }));
    });

    ws.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'sync':
          // Initial state sync
          setCursors(message.cursors || {});
          setConnectionCount(message.connectionCount || 0);
          setMyId(message.yourId);
          break;
          
        case 'cursor':
          // Update cursor position
          setCursors(prev => ({
            ...prev,
            [message.id]: {
              x: message.x,
              y: message.y,
              name: message.name,
              color: message.color
            }
          }));
          break;
          
        case 'draw':
          // Draw on canvas
          drawLine(
            message.from,
            message.to,
            message.color
          );
          break;
          
        case 'user-joined':
          setConnectionCount(prev => prev + 1);
          break;
          
        case 'user-left':
          setCursors(prev => {
            const updated = { ...prev };
            delete updated[message.id];
            return updated;
          });
          setConnectionCount(prev => Math.max(0, prev - 1));
          break;
      }
    });

    ws.addEventListener('close', () => {
      setIsConnected(false);
    });

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, []);

  // Handle mouse move
  const handleMouseMove = (e) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Send cursor position
    socket.send(JSON.stringify({
      type: 'cursor',
      x,
      y,
      name: myName,
      color: myColor
    }));
    
    // Draw if mouse is down
    if (isDrawing) {
      const lastX = e.clientX - rect.left - e.movementX;
      const lastY = e.clientY - rect.top - e.movementY;
      
      drawLine(
        { x: lastX, y: lastY },
        { x, y },
        myColor
      );
      
      // Send draw event
      socket.send(JSON.stringify({
        type: 'draw',
        from: { x: lastX, y: lastY },
        to: { x, y },
        color: myColor
      }));
    }
  };

  // Draw line on canvas
  const drawLine = (from, to, color) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  // Clear canvas
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'clear' }));
    }
  };

  return (
    <div className="min-h-screen bg-background-primary p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            PartyKit Multiplayer Test
          </h1>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div 
                className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
              />
              <span className="text-text-secondary">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="text-text-secondary">
              {connectionCount} user{connectionCount !== 1 ? 's' : ''} online
            </div>
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: myColor }}
              />
              <span className="text-text-secondary">{myName}</span>
            </div>
          </div>
        </div>

        {/* Canvas Container */}
        <div className="relative bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Canvas */}
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="border border-border-divider cursor-crosshair"
            onMouseMove={handleMouseMove}
            onMouseDown={() => setIsDrawing(true)}
            onMouseUp={() => setIsDrawing(false)}
            onMouseLeave={() => setIsDrawing(false)}
          />
          
          {/* Render other users' cursors */}
          {Object.entries(cursors).map(([id, cursor]) => {
            if (id === myId) return null; // Don't show own cursor
            
            return (
              <div
                key={id}
                className="absolute pointer-events-none"
                style={{
                  left: cursor.x,
                  top: cursor.y,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                {/* Cursor dot */}
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: cursor.color }}
                />
                {/* User name */}
                <div 
                  className="absolute top-5 left-1/2 transform -translate-x-1/2 
                           bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap"
                >
                  {cursor.name}
                </div>
              </div>
            );
          })}
        </div>

        {/* Controls */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={clearCanvas}
            className="px-4 py-2 bg-text-primary text-background-primary rounded-md 
                     hover:bg-text-primary/90 transition-colors"
          >
            Clear Canvas
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-background-secondary rounded-lg">
          <h3 className="font-medium text-text-primary mb-2">Instructions:</h3>
          <ul className="text-sm text-text-secondary space-y-1">
            <li>• Move your mouse to see your cursor on other screens</li>
            <li>• Click and drag to draw</li>
            <li>• Open this page in multiple browser tabs to test multiplayer</li>
            <li>• Each user gets a random color</li>
          </ul>
        </div>

        {/* Debug Info */}
        {!isConnected && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">
              Not connected to PartyKit. Make sure to run: <code className="bg-red-100 px-1">npx partykit dev</code>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiplayerTest;