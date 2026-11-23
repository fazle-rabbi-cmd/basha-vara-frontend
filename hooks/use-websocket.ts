import { useEffect, useState, useCallback } from 'react';
import { webSocketService } from '@/lib/websocket';
import { useAuth } from '@/features/auth/auth-context';

export function useWebSocket() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const token = localStorage.getItem('basha_vara_token');
    if (!token) {
      return;
    }

    webSocketService.connect(user.id, token);

    const socket = webSocketService.getSocket();
    if (!socket) {
      return;
    }

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    if (socket.connected) {
      setIsConnected(true);
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [user?.id]);

  const sendMessage = useCallback((data: {
    senderId: string;
    receiverId: string;
    propertyId?: string;
    content: string;
    messageType: string;
  }) => {
    webSocketService.sendMessage(data);
  }, []);

  const markAsRead = useCallback((data: { senderId: string; propertyId?: string }) => {
    webSocketService.markAsRead(data);
  }, []);

  return { isConnected, sendMessage, markAsRead };
}
