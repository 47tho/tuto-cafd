import React, { useState, useEffect } from 'react';
import { ArrowLeft, Mail, Calendar, BookOpen, CheckCircle, XCircle, Clock, TrendingUp, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { useAuth } from '../utils/auth-context';
import { apiRequest } from '../utils/api';
import { toast } from 'sonner@2.0.3';

interface UserDetailData {
  user: {
    id: string;
    name: string;
    email: string;
    role: 'student' | 'tutor';
    carrera?: string;
    bio?: string;
    subjects?: string[];
    whatsapp?: string;
    approved?: boolean;
    rating?: number;
    reviewCount?: number;
    createdAt: string;
  };
  requests: Array<{
    id: string;
    studentId: string;
    tutorId: string;
    studentName: string;
    tutorName: string;
    subject: string;
    date: string;
    time: string;
    status: string;
    confirmedByStudent: boolean;
    confirmedByTutor: boolean;
    createdAt: string;
  }>;
  stats?: {
    acceptedCount: number;
    completedCount: number;
    rating: number;
    reviewCount: number;
  };
}

interface AdminUserDetailProps {
  userId: string;
  userRole: 'student' | 'tutor';
  onNavigate: (view: string, data?: any) => void;
}

export function AdminUserDetail({ userId, userRole, onNavigate }: AdminUserDetailProps) {
  const { accessToken } = useAuth();
  const [data, setData] = useState<UserDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserDetail();
  }, [userId]);

  const loadUserDetail = async () => {
    try {
      setLoading(true);
      const response = await apiRequest(`/admin/users/${userId}`, {}, accessToken);
      setData(response);
    } catch (error) {
      console.error('Error loading user detail:', error);
      toast.error('Error al cargar los detalles del usuario');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: any; label: string }> = {
      pending: { variant: 'secondary', label: 'Pendiente' },
      accepted: { variant: 'default', label: 'Aceptada' },
      rejected: { variant: 'destructive', label: 'Rechazada' },
      completed: { variant: 'default', label: 'Completada' },
      cancelled: { variant: 'outline', label: 'Cancelada' },
    };
    const config = statusMap[status] || { variant: 'secondary', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusIcon = (request: any) => {
    if (request.status === 'completed' || (request.confirmedByStudent && request.confirmedByTutor)) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    } else if (request.status === 'rejected' || request.status === 'cancelled') {
      return <XCircle className="h-5 w-5 text-red-600" />;
    } else if (request.status === 'accepted') {
      return <Clock className="h-5 w-5 text-blue-600" />;
    }
    return <Clock className="h-5 w-5 text-gray-400" />;
  };

  const isTutoriaRealizada = (request: any) => {
    return request.status === 'completed' || (request.confirmedByStudent && request.confirmedByTutor);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando detalles...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="py-20 text-center">
            <p className="text-muted-foreground">No se encontraron datos del usuario</p>
            <Button className="mt-4" onClick={() => onNavigate('admin-users')}>
              Volver a Usuarios
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { user, requests, stats } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          className="gap-2 mb-4"
          onClick={() => onNavigate('admin-users')}
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Usuarios
        </Button>
        <h1 className="mb-2">Perfil de {user.name}</h1>
        <p className="text-muted-foreground">
          Vista detallada e historial de actividad
        </p>
      </div>

      {/* User Info Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Información Personal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl flex-shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h3 className="mb-1">{user.name}</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {user.email}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Registrado el {new Date(user.createdAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium mb-1">Rol</p>
                <Badge variant="default" className="text-sm">
                  {user.role === 'student' ? 'Estudiante' : 'Tutor'}
                </Badge>
              </div>

              {user.role === 'student' && user.carrera && (
                <div>
                  <p className="text-sm font-medium mb-1">Carrera</p>
                  <Badge variant="secondary">{user.carrera}</Badge>
                </div>
              )}

              {user.role === 'tutor' && (
                <div>
                  <p className="text-sm font-medium mb-1">Estado</p>
                  <Badge variant={user.approved ? 'default' : 'secondary'}>
                    {user.approved ? 'Aprobado' : 'Pendiente de Aprobación'}
                  </Badge>
                </div>
              )}

              {user.whatsapp && (
                <div>
                  <p className="text-sm font-medium mb-1">WhatsApp</p>
                  <p className="text-sm text-muted-foreground">{user.whatsapp}</p>
                </div>
              )}
            </div>
          </div>

          {user.role === 'tutor' && user.bio && (
            <div className="mt-6">
              <p className="text-sm font-medium mb-2">Biografía</p>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{user.bio}</p>
              </div>
            </div>
          )}

          {user.role === 'tutor' && user.subjects && user.subjects.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-medium mb-2">Materias que Enseña</p>
              <div className="flex flex-wrap gap-2">
                {user.subjects.map((subject, idx) => (
                  <Badge key={idx} variant="secondary">
                    {subject}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats for Tutors */}
      {user.role === 'tutor' && stats && (
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tutorías Aceptadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{stats.acceptedCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tutorías Completadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.completedCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Calificación Promedio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-3xl font-bold text-yellow-600">
                  {stats.rating > 0 ? stats.rating.toFixed(1) : '0.0'}
                </div>
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Reseñas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.reviewCount}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* History Tab */}
      <Card>
        <CardHeader>
          <CardTitle>
            {user.role === 'student' ? 'Historial de Tutorías Solicitadas' : 'Historial de Tutorías Gestionadas'}
          </CardTitle>
          <CardDescription>
            {user.role === 'student' 
              ? 'Todas las tutorías que este estudiante ha solicitado'
              : 'Todas las tutorías gestionadas por este tutor'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No hay tutorías registradas</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estado</TableHead>
                  <TableHead>Asignatura</TableHead>
                  <TableHead>{user.role === 'student' ? 'Tutor' : 'Estudiante'}</TableHead>
                  <TableHead>Fecha y Hora</TableHead>
                  <TableHead>Fecha Solicitud</TableHead>
                  <TableHead>Estado Actual</TableHead>
                  <TableHead>Realizada</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      {getStatusIcon(request)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{request.subject}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.role === 'student' ? request.tutorName : request.studentName}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{new Date(request.date).toLocaleDateString('es-ES')}</div>
                        <div className="text-muted-foreground">{request.time}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(request.createdAt).toLocaleDateString('es-ES')}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(request.status)}
                    </TableCell>
                    <TableCell>
                      {isTutoriaRealizada(request) ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Sí
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          No
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid md:grid-cols-3 gap-6 mt-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Solicitudes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{requests.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tutorías Completadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {requests.filter(r => isTutoriaRealizada(r)).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tutorías Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {requests.filter(r => r.status === 'pending' || r.status === 'accepted').length}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
