import React from 'react';
import { Notification } from '@/types';
import { apiClient } from '@/lib/api-client';

export const notificationService = {
  getNotifications: async (unreadOnly = false): Promise<Notification[]> => {
    return await apiClient.notifications.getNotifications(unreadOnly);
  },

  getUnreadCount: async (): Promise<number> => {
    return await apiClient.notifications.getUnreadCount();
  },

  markAsRead: async (notificationId: string): Promise<void> => {
    await apiClient.notifications.markAsRead(notificationId);
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.notifications.markAllAsRead();
  },

  deleteNotification: async (notificationId: string): Promise<void> => {
    await apiClient.notifications.deleteNotification(notificationId);
  },
};

export const useNotifications = () => {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchNotifications = React.useCallback(async (unreadOnly = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await notificationService.getNotifications(unreadOnly);
      setNotifications(data);
      // Update unread count from server to keep in sync
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchUnreadCount = React.useCallback(async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  }, []);

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      // Refresh unread count from server to ensure accuracy
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      // Refresh unread count from server to ensure accuracy
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      const deleted = notifications.find((n) => n.id === notificationId);
      if (deleted && !deleted.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
};
