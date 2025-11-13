import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle } from 'lucide-react';
import { useAuth } from '../utils/auth-context';
import { apiRequest } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

interface Notification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export function Notifications() {
  const { accessToken } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/notifications', {}, accessToken);
      setNotifications(data.notifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notifId: string) => {
    try {
      await apiRequest(`/notifications/${notifId}/read`, { method: 'PUT' }, accessToken);
      setNotifications(notifications.map(n =>
        n.id === notifId ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="mb-2">Notificaciones</h1>
        <p className="text-muted-foreground">
          Mantente al día con tus tutorías y solicitudes
        </p>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground">Cargando...</p>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No tienes notificaciones</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <Card key={notif.id} className={notif.read ? 'opacity-60' : ''}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      {!notif.read && (
                        <div className="h-2 w-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <h3 className="mb-1">{notif.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notif.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(notif.createdAt).toLocaleString('es-ES', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                  {!notif.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead(notif.id)}
                      className="gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Marcar leído
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
