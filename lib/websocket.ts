import { io, Socket } from 'socket.io-client';

type MessageHandler = (data: any) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private userId: string | null = null;
  private handlers = new Map<string, Set<MessageHandler>>();
  private pendingRooms: { userId: string; propertyId?: string }[] = [];

  connect(userId: string, token: string) {
    if (this.socket && this.userId === userId) {
      return;
    }
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.userId = userId;
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';

    this.socket = io(wsUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    this.socket.on('connect', () => {
      this.pendingRooms.forEach((room) => {
        this.socket?.emit('join-room', room);
      });
      this.pendingRooms = [];
    });

    this.handlers.forEach((callbacks, event) => {
      callbacks.forEach((cb) => this.socket?.on(event, cb));
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.userId = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocket() {
    return this.socket;
  }

  joinRoom(userId: string, propertyId?: string) {
    if (!this.socket) {
      return;
    }
    if (!this.socket.connected) {
      if (!this.pendingRooms.some((r) => r.userId === userId && r.propertyId === propertyId)) {
        this.pendingRooms.push({ userId, propertyId });
      }
      return;
    }
    this.socket.emit('join-room', { userId, propertyId });
  }

  leaveRoom(userId: string, propertyId?: string) {
    if (!this.socket?.connected) {
      return;
    }
    this.socket.emit('leave-room', { userId, propertyId });
  }

  sendMessage(data: {
    senderId: string;
    receiverId: string;
    propertyId?: string;
    content: string;
    messageType: string;
  }) {
    if (!this.socket) {
      console.warn('Cannot send message: WebSocket not initialized');
      return;
    }
    this.socket.emit('send-message', data);
  }

  markAsRead(data: { senderId: string; propertyId?: string }) {
    if (!this.socket?.connected) {
      return;
    }
    this.socket.emit('mark-as-read', data);
  }

  private on(event: string, callback: MessageHandler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(callback);
    this.socket?.on(event, callback);
  }

  private off(event: string, callback: MessageHandler) {
    this.handlers.get(event)?.delete(callback);
    this.socket?.off(event, callback);
  }

  onNewMessage(callback: MessageHandler) {
    this.on('new-message', callback);
  }

  offNewMessage(callback: MessageHandler) {
    this.off('new-message', callback);
  }

  onMessagesRead(callback: MessageHandler) {
    this.on('messages-read', callback);
  }

  offMessagesRead(callback: MessageHandler) {
    this.off('messages-read', callback);
  }

  onMessageError(callback: MessageHandler) {
    this.on('message-error', callback);
  }

  offMessageError(callback: MessageHandler) {
    this.off('message-error', callback);
  }
}

export const webSocketService = new WebSocketService();
