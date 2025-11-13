import React, { useState, useEffect } from 'react';
import { Users, UserCheck, Star, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useAuth } from '../utils/auth-context';
import { apiRequest } from '../utils/api';

interface DashboardStats {
  pendingTutors: number;
  pendingReviews: number;
  totalUsers: number;
  totalStudents: number;
  totalTutors: number;
}

interface AdminDashboardProps {
  onNavigate: (view: string, data?: any) => void;
}

export function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const { accessToken } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    pendingTutors: 0,
    pendingReviews: 0,
    totalUsers: 0,
    totalStudents: 0,
    totalTutors: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);

      // Load all data in parallel
      const [pendingTutorsData, pendingReviewsData, allUsersData] = await Promise.all([
        apiRequest('/admin/tutors/pending', {}, accessToken),
        apiRequest('/admin/reviews/pending', {}, accessToken),
        apiRequest('/admin/users', {}, accessToken),
      ]);

      const students = allUsersData.users.filter((u: any) => u.role === 'student');
      const tutors = allUsersData.users.filter((u: any) => u.role === 'tutor');

      setStats({
        pendingTutors: pendingTutorsData.tutors.length,
        pendingReviews: pendingReviewsData.reviews.length,
        totalUsers: allUsersData.users.length,
        totalStudents: students.length,
        totalTutors: tutors.length,
      });
    } catch (error) {
      console.error('Error loading admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="mb-2">Panel de Administración</h1>
        <p className="text-muted-foreground">
          Centro de control para gestionar la plataforma TUTO-CAFD
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onNavigate('admin-tutors')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tutores Pendientes de Aprobación
            </CardTitle>
            <UserCheck className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary mb-2">
              {stats.pendingTutors}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingTutors === 0 
                ? 'No hay solicitudes pendientes' 
                : 'Haz clic para revisar'}
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onNavigate('admin-reviews')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Reseñas por Moderar
            </CardTitle>
            <Star className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600 mb-2">
              {stats.pendingReviews}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingReviews === 0 
                ? 'Todas las reseñas están moderadas' 
                : 'Haz clic para moderar'}
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onNavigate('admin-users')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Usuarios Registrados
            </CardTitle>
            <Users className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {stats.totalUsers}
            </div>
            <p className="text-xs text-muted-foreground">
              Haz clic para gestionar usuarios
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Usuarios por Tipo</CardTitle>
            <CardDescription>Distribución de roles en la plataforma</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Estudiantes</p>
                  <p className="text-sm text-muted-foreground">Usuarios que buscan tutorías</p>
                </div>
              </div>
              <span className="text-2xl font-bold">{stats.totalStudents}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Tutores</p>
                  <p className="text-sm text-muted-foreground">Usuarios que ofrecen tutorías</p>
                </div>
              </div>
              <span className="text-2xl font-bold">{stats.totalTutors}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Gestiona tu plataforma eficientemente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full justify-start gap-2"
              variant="outline"
              onClick={() => onNavigate('admin-tutors')}
            >
              <UserCheck className="h-4 w-4" />
              Revisar Postulaciones de Tutores
              {stats.pendingTutors > 0 && (
                <span className="ml-auto bg-primary text-primary-foreground px-2 py-1 rounded text-xs">
                  {stats.pendingTutors}
                </span>
              )}
            </Button>

            <Button 
              className="w-full justify-start gap-2"
              variant="outline"
              onClick={() => onNavigate('admin-reviews')}
            >
              <Star className="h-4 w-4" />
              Moderar Reseñas
              {stats.pendingReviews > 0 && (
                <span className="ml-auto bg-yellow-500 text-white px-2 py-1 rounded text-xs">
                  {stats.pendingReviews}
                </span>
              )}
            </Button>

            <Button 
              className="w-full justify-start gap-2"
              variant="outline"
              onClick={() => onNavigate('admin-users')}
            >
              <Users className="h-4 w-4" />
              Gestionar Usuarios
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Actividad</CardTitle>
          <CardDescription>
            Estado actual de la plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.pendingTutors > 0 && (
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <p className="font-medium text-blue-900">
                    {stats.pendingTutors} {stats.pendingTutors === 1 ? 'solicitud pendiente' : 'solicitudes pendientes'} de tutor
                  </p>
                  <p className="text-sm text-blue-700">
                    Revisa y aprueba a nuevos tutores para expandir la plataforma
                  </p>
                </div>
                <Button size="sm" onClick={() => onNavigate('admin-tutors')}>
                  Revisar
                </Button>
              </div>
            )}

            {stats.pendingReviews > 0 && (
              <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <Star className="h-5 w-5 text-yellow-600" />
                <div className="flex-1">
                  <p className="font-medium text-yellow-900">
                    {stats.pendingReviews} {stats.pendingReviews === 1 ? 'reseña pendiente' : 'reseñas pendientes'} de moderación
                  </p>
                  <p className="text-sm text-yellow-700">
                    Mantén la calidad del contenido revisando las nuevas reseñas
                  </p>
                </div>
                <Button size="sm" onClick={() => onNavigate('admin-reviews')}>
                  Moderar
                </Button>
              </div>
            )}

            {stats.pendingTutors === 0 && stats.pendingReviews === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-2">✓ Todo está al día</p>
                <p className="text-sm">No hay acciones pendientes en este momento</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
