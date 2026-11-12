'use client';

import { useState, useEffect } from 'react';
import { Calendar, FileText, User, Bell, CheckCircle, Clock, Trash2, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useNotifications } from '@/features/notifications/notification-service';
import { useAuth } from '@/features/auth/auth-context';
import { useRouter } from 'next/navigation';
import { Notification } from '@/types';

type NotificationFilter = 'all' | 'unread' | 'visits' | 'applications' | 'properties';

export default function NotificationsPage() {
  const { notifications, unreadCount, fetchNotifications, fetchUnreadCount, markAsRead, markAllAsRead, deleteNotification, isLoading } = useNotifications();
  const { user } = useAuth();
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [localNotifications, setLocalNotifications] = useState<Notification[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchNotifications(false);
  }, [fetchNotifications]);

  useEffect(() => {
    setLocalNotifications(notifications);
  }, [notifications]);

  const filteredNotifications = localNotifications.filter((notification) => {
    switch (filter) {
      case 'unread':
        return !notification.isRead;
      case 'visits':
        return notification.type.includes('visit');
      case 'applications':
        return notification.type.includes('application');
      case 'properties':
        return notification.type.includes('property');
      default:
        return true;
    }
  });

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
      setLocalNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
      );
      // Refresh unread count from server
      await fetchUnreadCount();
    }

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

  const handleMarkAsRead = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    await markAsRead(notificationId);
    setLocalNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
    // Refresh unread count from server
    await fetchUnreadCount();
  };

  const handleDelete = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    await deleteNotification(notificationId);
    setLocalNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    // Refresh unread count from server
    await fetchUnreadCount();
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    setLocalNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    // Refresh unread count from server
    await fetchUnreadCount();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'visit_requested':
      case 'visit_accepted':
      case 'visit_declined':
      case 'visit_cancelled':
      case 'visit_completed':
        return <Calendar className="h-5 w-5 text-blue-500" />;
      case 'application_submitted':
      case 'application_under_review':
      case 'application_shortlisted':
      case 'application_rejected':
      case 'application_selected':
      case 'application_withdrawn':
        return <FileText className="h-5 w-5 text-green-500" />;
      case 'property_published':
      case 'property_rented':
      case 'property_paused':
        return <User className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
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

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('unread')}
          >
            Unread {unreadCount > 0 && <Badge variant="error" className="ml-2">{unreadCount}</Badge>}
          </Button>
          <Button
            variant={filter === 'visits' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('visits')}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Visits
          </Button>
          <Button
            variant={filter === 'applications' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('applications')}
          >
            <FileText className="h-4 w-4 mr-2" />
            Applications
          </Button>
          <Button
            variant={filter === 'properties' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('properties')}
          >
            <User className="h-4 w-4 mr-2" />
            Properties
          </Button>

          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="ml-auto"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <Card className="p-12 text-center">
            <Bell className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No notifications</h3>
            <p className="text-muted-foreground">
              {filter === 'unread' ? 'You have no unread notifications' : 'No notifications found'}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <Card
                key={notification.id}
                className={`p-4 cursor-pointer hover:shadow-md transition-shadow ${
                  !notification.isRead ? 'bg-blue-50/50 border-blue-200' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-full ${getNotificationColor(notification.type)} flex-shrink-0`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-1">
                          {notification.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{formatTime(new Date(notification.createdAt))}</span>
                          <span>•</span>
                          <span>{formatDate(new Date(notification.createdAt))}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!notification.isRead && (
                          <Badge variant="error" className="text-xs">
                            New
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleMarkAsRead(notification.id, e)}
                          title="Mark as read"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDelete(notification.id, e)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
