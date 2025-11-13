import React, { useState, useEffect } from "react";
import {
  Calendar,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { useAuth } from "../utils/auth-context";
import { apiRequest } from "../utils/api";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui/tabs";
import { ReviewModal } from "./ReviewModal";

// Function to translate day name from English to Spanish
const translateDay = (dayString: string): string => {
  // Check if the string contains a day name
  const dayMap: Record<string, string> = {
    'monday': 'Lunes',
    'tuesday': 'Martes',
    'wednesday': 'Miércoles',
    'thursday': 'Jueves',
    'friday': 'Viernes',
    'saturday': 'Sábado',
    'sunday': 'Domingo'
  };

  // Try to find and replace the day name
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
  tutorId: string;
  studentName: string;
  tutorName: string;
  subject: string;
  date: string;
  time: string;
  message: string;
  status: string;
  confirmedByStudent: boolean;
  confirmedByTutor: boolean;
}

interface MyRequestsProps {
  onNavigate: (view: string, data?: any) => void;
}

export function MyRequests({ onNavigate }: MyRequestsProps) {
  const { accessToken, user } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewModalData, setReviewModalData] =
    useState<any>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await apiRequest(
        "/requests",
        {},
        accessToken,
      );
      setRequests(data.requests);
    } catch (error) {
      console.error("Error loading requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    if (
      !confirm(
        "¿Estás seguro de que quieres cancelar esta solicitud?",
      )
    )
      return;

    try {
      await apiRequest(
        `/requests/${requestId}`,
        {
          method: "PUT",
          body: JSON.stringify({ status: "cancelled" }),
        },
        accessToken,
      );
      loadRequests();
    } catch (error) {
      console.error("Error canceling request:", error);
    }
  };

  const handleConfirmCompleted = async (requestId: string) => {
    try {
      const field =
        user?.role === "student"
          ? { confirmedByStudent: true }
          : { confirmedByTutor: true };

      await apiRequest(
        `/requests/${requestId}`,
        {
          method: "PUT",
          body: JSON.stringify(field),
        },
        accessToken,
      );
      loadRequests();
    } catch (error) {
      console.error("Error confirming request:", error);
    }
  };

  const handleMarkAsCompleted = async (requestId: string) => {
    if (
      !confirm(
        "¿Estás seguro de que quieres marcar esta tutoría como completada?",
      )
    )
      return;

    try {
      await apiRequest(
        `/requests/${requestId}`,
        {
          method: "PUT",
          body: JSON.stringify({ status: "completed" }),
        },
        accessToken,
      );
      loadRequests();
    } catch (error) {
      console.error("Error marking as completed:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      accepted: "Aceptada",
      pending: "Pendiente",
      rejected: "Rechazada",
      completed: "Completada",
      cancelled: "Cancelada",
    };
    return labels[status] || status;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <CheckCircle className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "rejected":
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const filterByStatus = (status?: string) => {
    if (!status) return requests;
    return requests.filter((r) => r.status === status);
  };

  const RequestCard = ({ request }: { request: Request }) => {
    const isPast = new Date() > new Date(request.date);

    // Lógica de confirmación según el rol
    const isStudent = user?.role === "student";
    const isTutor = user?.role === "tutor";
    const canConfirm =
      request.status === "accepted" &&
      isPast &&
      ((isStudent && !request.confirmedByStudent) ||
        (isTutor && !request.confirmedByTutor));

    // Puede marcar como completada si está aceptada y ambos han confirmado
    const canMarkCompleted =
      request.status === "accepted" &&
      request.confirmedByStudent &&
      request.confirmedByTutor;

    // Puede cancelar si está aceptada o pendiente
    const canCancel =
      request.status === "accepted" ||
      request.status === "pending";

    // Puede dejar reseña si está completada
    const canReview = request.status === "completed";

    // Mostrar el nombre correcto según el rol del usuario
    const otherPersonName = isStudent
      ? request.tutorName
      : request.studentName;
    const otherPersonLabel = "con";

    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="mb-1">{request.subject}</h3>
              <p className="text-muted-foreground">
                {otherPersonLabel} {otherPersonName}
              </p>
            </div>
            <Badge className={getStatusColor(request.status)}>
              <span className="flex items-center gap-1">
                {getStatusIcon(request.status)}
                {getStatusLabel(request.status)}
              </span>
            </Badge>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {translateDay(request.date)} - {request.time}
            </div>
            {request.message && (
              <div className="text-sm">
                <span className="font-medium">Mensaje:</span>{" "}
                <span className="text-muted-foreground">
                  {request.message}
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            {request.status === "pending" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCancelRequest(request.id)}
              >
                Cancelar Solicitud
              </Button>
            )}
            {canCancel && request.status === "accepted" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCancelRequest(request.id)}
                className="text-destructive hover:text-destructive"
              >
                Cancelar Tutoría
              </Button>
            )}
            {canConfirm && (
              <Button
                size="sm"
                onClick={() =>
                  handleConfirmCompleted(request.id)
                }
              >
                Confirmar Tutoría Realizada
              </Button>
            )}
            {canMarkCompleted && (
              <Button
                size="sm"
                variant="default"
                onClick={() =>
                  handleMarkAsCompleted(request.id)
                }
              >
                Marcar como Completada
              </Button>
            )}
            {canReview && (
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setReviewModalData({
                    requestId: request.id,
                    tutorId: isStudent
                      ? request.tutorId
                      : undefined,
                    studentId: isTutor
                      ? request.studentId
                      : undefined,
                    tutorName: request.tutorName,
                    studentName: request.studentName,
                    isReviewingTutor: isStudent,
                  })
                }
              >
                Dejar Reseña
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="mb-2">Mis Tutorías</h1>
        <p className="text-muted-foreground">
          Gestiona tus solicitudes y tutorías programadas
        </p>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="pending">Pendientes</TabsTrigger>
          <TabsTrigger value="accepted">Aceptadas</TabsTrigger>
          <TabsTrigger value="completed">
            Completadas
          </TabsTrigger>
          <TabsTrigger value="rejected">Rechazadas</TabsTrigger>
          <TabsTrigger value="cancelled">
            Canceladas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {loading ? (
            <p className="text-center text-muted-foreground">
              Cargando...
            </p>
          ) : requests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">
                  No tienes solicitudes aún
                </p>
                <Button onClick={() => onNavigate("search")}>
                  Buscar Tutores
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {requests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {[
          "pending",
          "accepted",
          "completed",
          "rejected",
          "cancelled",
        ].map((status) => (
          <TabsContent
            key={status}
            value={status}
            className="mt-6"
          >
            {loading ? (
              <p className="text-center text-muted-foreground">
                Cargando...
              </p>
            ) : filterByStatus(status).length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    No hay solicitudes{" "}
                    {getStatusLabel(status).toLowerCase()}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filterByStatus(status).map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {reviewModalData && (
        <ReviewModal
          tutorId={reviewModalData.tutorId}
          studentId={reviewModalData.studentId}
          tutorName={reviewModalData.tutorName}
          studentName={reviewModalData.studentName}
          requestId={reviewModalData.requestId}
          isReviewingTutor={reviewModalData.isReviewingTutor}
          onClose={() => setReviewModalData(null)}
          onSuccess={() => {
            setReviewModalData(null);
            loadRequests();
          }}
        />
      )}
    </div>
  );
}