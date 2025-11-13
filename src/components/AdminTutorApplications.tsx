import React, { useState, useEffect } from 'react';
import { Check, X, Eye, Mail, BookOpen, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { useAuth } from '../utils/auth-context';
import { apiRequest } from '../utils/api';
import { toast } from 'sonner@2.0.3';

interface TutorApplication {
  id: string;
  name: string;
  email: string;
  bio: string;
  subjects: string[];
  createdAt: string;
  approved: boolean;
}

export function AdminTutorApplications() {
  const { accessToken } = useAuth();
  const [applications, setApplications] = useState<TutorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<TutorApplication | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/admin/tutors/pending', {}, accessToken);
      setApplications(data.tutors);
    } catch (error) {
      console.error('Error loading applications:', error);
      toast.error('Error al cargar las postulaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (tutorId: string, tutorName: string) => {
    if (!confirm(`¿Estás seguro de aprobar la solicitud de ${tutorName}?`)) return;

    try {
      setActionLoading(true);
      await apiRequest(`/admin/tutors/${tutorId}/approve`, {
        method: 'PUT',
        body: { approved: true }
      }, accessToken);

      toast.success(`Solicitud de ${tutorName} aprobada exitosamente`);
      setShowDetailDialog(false);
      loadApplications(); // Reload list
    } catch (error) {
      console.error('Error approving tutor:', error);
      toast.error('Error al aprobar la solicitud');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (tutorId: string, tutorName: string) => {
    if (!confirm(`¿Estás seguro de rechazar la solicitud de ${tutorName}? Esta acción no se puede deshacer.`)) return;

    try {
      setActionLoading(true);
      await apiRequest(`/admin/tutors/${tutorId}/approve`, {
        method: 'PUT',
        body: { approved: false }
      }, accessToken);

      toast.success(`Solicitud de ${tutorName} rechazada`);
      setShowDetailDialog(false);
      loadApplications(); // Reload list
    } catch (error) {
      console.error('Error rejecting tutor:', error);
      toast.error('Error al rechazar la solicitud');
    } finally {
      setActionLoading(false);
    }
  };

  const openDetailDialog = (application: TutorApplication) => {
    setSelectedApplication(application);
    setShowDetailDialog(true);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando postulaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="mb-2">Gestión de Postulaciones</h1>
        <p className="text-muted-foreground">
          Revisa y aprueba solicitudes de nuevos tutores para la plataforma
        </p>
      </div>

      {applications.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="mb-2">No hay postulaciones pendientes</h3>
            <p className="text-muted-foreground">
              Todas las solicitudes de tutores han sido revisadas
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Alert className="mb-6">
            <AlertDescription>
              Tienes <strong>{applications.length}</strong> {applications.length === 1 ? 'postulación pendiente' : 'postulaciones pendientes'} de revisión
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            {applications.map((application) => (
              <Card key={application.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                          {application.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="mb-1">{application.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            {application.email}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-start gap-2">
                          <BookOpen className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium mb-1">Materias que enseña:</p>
                            <div className="flex flex-wrap gap-2">
                              {application.subjects.map((subject, idx) => (
                                <Badge key={idx} variant="secondary">
                                  {subject}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          Postulado el {new Date(application.createdAt).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </div>

                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-sm font-medium mb-1">Biografía:</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {application.bio}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        onClick={() => openDetailDialog(application)}
                      >
                        <Eye className="h-4 w-4" />
                        Ver Completo
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        className="gap-2"
                        onClick={() => handleApprove(application.id, application.name)}
                        disabled={actionLoading}
                      >
                        <Check className="h-4 w-4" />
                        Aprobar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="gap-2"
                        onClick={() => handleReject(application.id, application.name)}
                        disabled={actionLoading}
                      >
                        <X className="h-4 w-4" />
                        Rechazar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          {selectedApplication && (
            <>
              <DialogHeader>
                <DialogTitle>Postulación de {selectedApplication.name}</DialogTitle>
                <DialogDescription>
                  Revisa toda la información antes de tomar una decisión
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                <div>
                  <h4 className="mb-2">Información Personal</h4>
                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Nombre:</span>
                      <span className="text-sm">{selectedApplication.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Correo:</span>
                      <span className="text-sm">{selectedApplication.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Fecha de Postulación:</span>
                      <span className="text-sm">
                        {new Date(selectedApplication.createdAt).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="mb-2">Materias que Enseña</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedApplication.subjects.map((subject, idx) => (
                      <Badge key={idx} variant="secondary" className="text-sm">
                        {subject}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="mb-2">Biografía y Experiencia</h4>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{selectedApplication.bio}</p>
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDetailDialog(false)}
                  disabled={actionLoading}
                >
                  Cerrar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleReject(selectedApplication.id, selectedApplication.name)}
                  disabled={actionLoading}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Rechazar
                </Button>
                <Button
                  variant="default"
                  onClick={() => handleApprove(selectedApplication.id, selectedApplication.name)}
                  disabled={actionLoading}
                  className="gap-2"
                >
                  <Check className="h-4 w-4" />
                  Aprobar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
