import PartySocket from 'partysocket';

class MultiplayerManager {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.currentRoom = null;
    this.userId = null;
    this.userColor = null;
    this.userName = null;
    this.isConnected = false;
  }

  connect(roomId = 'default-canvas') {
    if (this.socket?.readyState === WebSocket.OPEN) {
      console.log('Already connected to multiplayer');
      return;
    }

    this.currentRoom = roomId;
    
    this.socket = new PartySocket({
      host: process.env.REACT_APP_PARTYKIT_HOST || 'localhost:1999',
      room: roomId,
    });

    this.socket.addEventListener('open', () => {
      console.log('Connected to multiplayer room:', roomId);
      this.isConnected = true;
      this.emit('connected');
    });

    this.socket.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      
      // Handle identity assignment
      if (data.type === 'identity') {
        this.userId = data.userId;
        this.userColor = data.color;
        this.userName = data.name;
        this.emit('identity', data);
      } else {
        this.emit(data.type, data);
      }
    });

    this.socket.addEventListener('close', () => {
      console.log('Disconnected from multiplayer');
      this.isConnected = false;
      this.emit('disconnected');
    });

    this.socket.addEventListener('error', (error) => {
      console.error('Multiplayer connection error:', error);
      this.emit('error', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
    }
  }

  sendCursor(x, y) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'cursor',
        x: Math.round(x),
        y: Math.round(y),
        color: this.userColor,
        name: this.userName
      }));
    }
  }

  // Send cursor leave when mouse exits canvas
  sendCursorLeave() {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'cursor-leave'
      }));
    }
  }

  // Event emitter pattern
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  off(event, callback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    this.listeners.get(event)?.forEach(cb => cb(data));
  }

  // Get connection status
  getStatus() {
    return {
      isConnected: this.isConnected,
      userId: this.userId,
      userName: this.userName,
      userColor: this.userColor,
      room: this.currentRoom
    };
  }
}

// Create singleton instance
export const multiplayerManager = new MultiplayerManager();