'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, X, User, FileText, Calendar, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/features/notifications/notification-service';
import { useAuth } from '@/features/auth/auth-context';
import { useRouter } from 'next/navigation';
import { Notification } from '@/types';

export function NotificationDropdown() {
  const { notifications, unreadCount, fetchNotifications, fetchUnreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch unread count on mount
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  const handleToggle = async () => {
    if (!isOpen) {
      await fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
      // Refresh unread count from server to ensure accuracy
      await fetchUnreadCount();
    }
    setIsOpen(false);

    // Determine user role for navigation
    const isLandlord = user?.roles?.includes('landlord');
    const isTenant = user?.roles?.includes('tenant');

    // Navigate based on notification type - check applicationId first
    if (notification.data?.applicationId) {
      const path = isLandlord ? '/landlord/applications' : isTenant ? '/tenant/applications' : '/applications';
      router.push(path);
    } else if (notification.data?.visitId) {
      const path = isLandlord ? '/landlord/visits' : isTenant ? '/tenant/visits' : '/visits';
      router.push(path);
    } else if (notification.data?.propertyId) {
      router.push(`/properties/${notification.data.propertyId}`);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    // Refresh unread count from server to ensure accuracy
    await fetchUnreadCount();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'visit_requested':
      case 'visit_accepted':
      case 'visit_declined':
      case 'visit_cancelled':
      case 'visit_completed':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'application_submitted':
      case 'application_under_review':
      case 'application_shortlisted':
      case 'application_rejected':
      case 'application_selected':
      case 'application_withdrawn':
        return <FileText className="h-4 w-4 text-green-500" />;
      case 'property_published':
      case 'property_rented':
      case 'property_paused':
        return <User className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'visit_requested':
      case 'application_submitted':
        return 'bg-blue-50 border-blue-200';
      case 'visit_accepted':
      case 'application_shortlisted':
      case 'application_selected':
        return 'bg-green-50 border-green-200';
      case 'visit_declined':
      case 'application_rejected':
        return 'bg-red-50 border-red-200';
      case 'visit_cancelled':
      case 'application_withdrawn':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggle}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            variant="error"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-background border border-border rounded-lg shadow-lg z-50 max-h-[500px] flex flex-col">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-lg">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs"
              >
                Mark all as read
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 animate-spin" />
                <p>Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 cursor-pointer hover:bg-muted transition-colors ${
                      !notification.isRead ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-sm text-foreground">
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <Badge variant="error" className="text-xs">
                              New
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(new Date(notification.createdAt))}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => {
                  setIsOpen(false);
                  router.push('/notifications');
                }}
              >
                View all notifications
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
