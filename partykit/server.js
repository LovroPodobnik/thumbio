// PartyKit server for Thumbio multiplayer canvas
export default class CanvasRoom {
  constructor(room) {
    this.room = room;
    this.users = new Map();
    this.cursors = new Map();
  }

  async onConnect(conn, ctx) {
    console.log(`User connected: ${conn.id}`);
    
    // Generate user identity
    const userId = conn.id;
    const userColor = this.generateUserColor();
    const userName = this.generateUserName();
    
    // Store user info
    this.users.set(userId, {
      id: userId,
      name: userName,
      color: userColor,
      connection: conn
    });

    // Send identity to the user
    conn.send(JSON.stringify({
      type: 'identity',
      userId,
      color: userColor,
      name: userName
    }));

    // Send current state
    conn.send(JSON.stringify({
      type: 'sync',
      users: this.getUsersData(),
      cursors: this.getCursorsData(),
      connectionCount: this.users.size
    }));

    // Notify others
    this.broadcast({
      type: 'user-joined',
      userId,
      name: userName,
      color: userColor,
      connectionCount: this.users.size
    }, [conn.id]);
  }

  generateUserColor() {
    const colors = [
      '#3B82F6', // blue
      '#EF4444', // red
      '#10B981', // green
      '#F59E0B', // yellow
      '#8B5CF6', // purple
      '#EC4899', // pink
      '#14B8A6', // teal
      '#F97316', // orange
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  generateUserName() {
    const adjectives = ['Swift', 'Bright', 'Cool', 'Epic', 'Noble', 'Bold', 'Wise', 'Keen'];
    const nouns = ['Eagle', 'Tiger', 'Panda', 'Fox', 'Wolf', 'Bear', 'Lion', 'Hawk'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${adj} ${noun}`;
  }

  async onMessage(message, conn) {
    let data;
    try {
      data = JSON.parse(message);
    } catch (e) {
      console.error('Invalid JSON:', e);
      return;
    }

    const userId = conn.id;

    switch (data.type) {
      case 'cursor':
        // Validate cursor data
        if (typeof data.x !== 'number' || typeof data.y !== 'number' ||
            !isFinite(data.x) || !isFinite(data.y)) {
          console.error(`Invalid cursor data from ${userId}:`, data);
          return;
        }

        // Store cursor position
        this.cursors.set(userId, {
          x: data.x,
          y: data.y,
          timestamp: Date.now()
        });
        
        // Broadcast cursor position to others
        this.broadcast({
          type: 'cursor',
          userId,
          x: data.x,
          y: data.y,
          name: data.name,
          color: data.color
        }, [conn.id]);
        break;
        
      case 'cursor-leave':
        // Remove cursor when user's mouse leaves canvas
        this.cursors.delete(userId);
        
        // Notify others
        this.broadcast({
          type: 'cursor-leave',
          userId
        }, [conn.id]);
        break;
        
      default:
        console.warn(`Unknown message type: ${data.type}`);
        break;
    }
  }

  async onClose(conn) {
    console.log(`User disconnected: ${conn.id}`);
    const userId = conn.id;
    
    // Remove user and their cursor
    this.users.delete(userId);
    this.cursors.delete(userId);
    
    // Notify others
    this.broadcast({
      type: 'user-left',
      userId,
      connectionCount: this.users.size
    });
  }

  // Helper to broadcast messages
  broadcast(message, exclude = []) {
    const msg = JSON.stringify(message);
    
    for (const [id, connection] of this.room.connections) {
      if (!exclude.includes(id)) {
        connection.send(msg);
      }
    }
  }

  // Get current users data (without connection objects)
  getUsersData() {
    const users = {};
    for (const [id, user] of this.users) {
      users[id] = {
        id: user.id,
        name: user.name,
        color: user.color
      };
    }
    return users;
  }

  // Get current cursors data
  getCursorsData() {
    const cursors = {};
    for (const [userId, cursor] of this.cursors) {
      const user = this.users.get(userId);
      if (user) {
        cursors[userId] = {
          x: cursor.x,
          y: cursor.y,
          name: user.name,
          color: user.color
        };
      }
    }
    return cursors;
  }
}