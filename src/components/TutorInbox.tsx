import React, { useState, useEffect } from 'react';
import { Inbox, CheckCircle, XCircle, Clock, Star, Eye } from 'lucide-react';
import { useAuth } from '../utils/auth-context';
import { apiRequest } from '../utils/api';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { StudentProfile } from './StudentProfile';
import { toast } from 'sonner@2.0.3';

// Function to translate day name from English to Spanish
const translateDay = (dayString: string): string => {
  const dayMap: Record<string, string> = {
    'monday': 'Lunes',
    'tuesday': 'Martes',
    'wednesday': 'Miércoles',
    'thursday': 'Jueves',
    'friday': 'Viernes',
    'saturday': 'Sábado',
    'sunday': 'Domingo'
  };

  const lowerDayString = dayString.toLowerCase();
  for (const [enDay, esDay] of Object.entries(dayMap)) {
    if (lowerDayString.includes(enDay)) {
      return dayString.replace(new RegExp(enDay, 'gi'), esDay);
    }
  }
  
  return dayString;
};

interface Request {
  id: string;
  studentId: string;
  studentName: string;
  subject: string;
  date: string;
  time: string;
  message: string;
  status: string;
  createdAt: string;
}

interface StudentInfo {
  rating: number;
  reviewCount: number;
  carrera: string;
}

export function TutorInbox() {
  const { accessToken } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [studentsInfo, setStudentsInfo] = useState<Record<string, StudentInfo>>({});
  const [loading, setLoading] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/requests', {}, accessToken);
      // Only show pending requests in inbox
      const pendingRequests = data.requests.filter((r: Request) => r.status === 'pending');
      setRequests(pendingRequests);
      
      // Load student info for each request
      const studentsData: Record<string, StudentInfo> = {};
      for (const request of pendingRequests) {
        try {
          const studentData = await apiRequest(`/students/${request.studentId}`, {});
          studentsData[request.studentId] = {
            rating: studentData.student.rating || 0,
            reviewCount: studentData.student.reviewCount || 0,
            carrera: studentData.student.carrera || 'No especificada'
          };
        } catch (error) {
          console.error(`Error loading student ${request.studentId}:`, error);
        }
      }
      setStudentsInfo(studentsData);
    } catch (error) {
      console.error('Error loading requests:', error);
      toast.error('Error al cargar las solicitudes');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId: string) => {
    try {
      await apiRequest(
        `/requests/${requestId}`,
        {
          method: 'PUT',
          body: { status: 'accepted' },
        },
        accessToken
      );
      toast.success('Solicitud aceptada exitosamente');
      loadRequests();
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error('Error al aceptar la solicitud');
    }
  };

  const handleReject = async (requestId: string) => {
    if (!confirm('¿Estás seguro de que quieres rechazar esta solicitud?')) return;

    try {
      await apiRequest(
        `/requests/${requestId}`,
        {
          method: 'PUT',
          body: { status: 'rejected' },
        },
        accessToken
      );
      toast.success('Solicitud rechazada');
      loadRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Error al rechazar la solicitud');
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  // Show student profile if selected
  if (selectedStudentId) {
    return (
      <StudentProfile
        studentId={selectedStudentId}
        onBack={() => setSelectedStudentId(null)}
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="mb-2">Buzón de Solicitudes</h1>
        <p className="text-muted-foreground">
          Revisa y gestiona las solicitudes de tutoría
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando solicitudes...</p>
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No tienes solicitudes pendientes
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request, idx) => {
            const studentInfo = studentsInfo[request.studentId];
            
            return (
              <Card key={request.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    {/* Student Avatar */}
                    <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                      {request.studentName.charAt(0).toUpperCase()}
                    </div>

                    {/* Request Details */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="mb-1">{request.studentName}</h3>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>
                              {studentInfo?.carrera || 'Carrera no especificada'}
                            </span>
                            {studentInfo && (
                              <>
                                <span>•</span>
                                <div className="flex items-center gap-1.5">
                                  {renderStars(studentInfo.rating)}
                                  <span>
                                    {studentInfo.rating > 0 
                                      ? studentInfo.rating.toFixed(1) 
                                      : 'Sin calificar'}
                                  </span>
                                  <span className="text-xs">
                                    ({studentInfo.reviewCount})
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Pendiente
                        </Badge>
                      </div>

                      <div className="bg-muted/50 p-3 rounded-lg mb-3">
                        <p className="text-sm font-medium mb-1">
                          Materia: {request.subject}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          📅 {translateDay(request.date)} - {request.time}
                        </p>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm font-medium mb-1">Mensaje del estudiante:</p>
                        <p className="text-sm text-muted-foreground bg-accent/50 p-3 rounded-lg">
                          {request.message}
                        </p>
                      </div>

                      <p className="text-xs text-muted-foreground mb-4">
                        Recibida: {new Date(request.createdAt).toLocaleString('es-ES', {
                          dateStyle: 'short',
                          timeStyle: 'short'
                        })}
                      </p>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setSelectedStudentId(request.studentId)}
                          className="gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Ver Perfil
                        </Button>
                        <Button
                          onClick={() => handleAccept(request.id)}
                          className="gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Aceptar
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleReject(request.id)}
                          className="gap-2 text-destructive hover:text-destructive"
                        >
                          <XCircle className="h-4 w-4" />
                          Rechazar
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
