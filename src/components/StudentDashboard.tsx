import React, { useState, useEffect } from 'react';
import { Search, Calendar, Bell } from 'lucide-react';
import { useAuth } from '../utils/auth-context';
import { apiRequest } from '../utils/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface Request {
  id: string;
  tutorName: string;
  subject: string;
  date: string;
  time: string;
  status: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

interface StudentDashboardProps {
  onNavigate: (view: string, data?: any) => void;
}

export function StudentDashboard({ onNavigate }: StudentDashboardProps) {
  const { user, accessToken } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [upcomingRequests, setUpcomingRequests] = useState<Request[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load requests
      const requestsData = await apiRequest('/requests', {}, accessToken);
      const accepted = requestsData.requests
        .filter((r: Request) => r.status === 'accepted')
        .slice(0, 3);
      setUpcomingRequests(accepted);

      // Load notifications
      const notifData = await apiRequest('/notifications', {}, accessToken);
      setNotifications(notifData.notifications.slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate('search', { query: searchQuery });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      accepted: 'Aceptada',
      pending: 'Pendiente',
      rejected: 'Rechazada',
      completed: 'Completada',
      cancelled: 'Cancelada'
    };
    return labels[status] || status;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="mb-2">¡Hola, {user?.name}!</h1>
        <p className="text-muted-foreground">
          Bienvenido a tu panel de estudiante. Encuentra tutores y gestiona tus tutorías.
        </p>
      </div>

      {/* Search Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Buscar Tutor por Materia</CardTitle>
          <CardDescription>
            Encuentra el tutor perfecto para la materia que necesitas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Busca tu materia... (ej: Cálculo I, Física, Programación)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Button type="submit" className="gap-2">
              <Search className="h-4 w-4" />
              Buscar
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Upcoming Tutoring Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Próximas Tutorías
            </CardTitle>
            <CardDescription>
              Tus sesiones confirmadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Cargando...</p>
            ) : upcomingRequests.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  No tienes tutorías programadas
                </p>
                <Button onClick={() => onNavigate('search')}>
                  Buscar Tutores
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="p-4 border rounded-lg hover:bg-accent/50 transition"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{request.subject}</p>
                        <p className="text-sm text-muted-foreground">
                          con {request.tutorName}
                        </p>
                      </div>
                      <Badge className={getStatusColor(request.status)}>
                        {getStatusLabel(request.status)}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {request.date} - {request.time}
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => onNavigate('my-requests')}
                >
                  Ver todas mis tutorías
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificaciones Recientes
            </CardTitle>
            <CardDescription>
              Actualizaciones sobre tus solicitudes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Cargando...</p>
            ) : notifications.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No tienes notificaciones
              </p>
            ) : (
              <div className="space-y-3">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 border rounded-lg ${
                      notif.read ? 'bg-background' : 'bg-accent/50'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{notif.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {notif.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(notif.createdAt).toLocaleString('es-ES', {
                            dateStyle: 'short',
                            timeStyle: 'short'
                          })}
                        </p>
                      </div>
                      {!notif.read && (
                        <div className="h-2 w-2 bg-primary rounded-full mt-1" />
                      )}
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => onNavigate('notifications')}
                >
                  Ver todas las notificaciones
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
