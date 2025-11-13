import React, { useState, useEffect } from 'react';
import { Check, Trash2, Star, User, AlertTriangle, History } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { useAuth } from '../utils/auth-context';
import { apiRequest } from '../utils/api';
import { toast } from 'sonner@2.0.3';

interface Review {
  id: string;
  tutorId: string;
  studentId: string;
  tutorName: string;
  studentName: string;
  rating: number;
  comment: string;
  createdAt: string;
  approved: boolean;
  approvedAt?: string;
  reviewerId: string; // Add reviewerId to determine who wrote the review
}

export function AdminReviews() {
  const { accessToken } = useAuth();
  const [pendingReviews, setPendingReviews] = useState<Review[]>([]);
  const [approvedReviews, setApprovedReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      
      // Load both pending and approved reviews
      const [pendingData, approvedData] = await Promise.all([
        apiRequest('/admin/reviews/pending', {}, accessToken),
        apiRequest('/admin/reviews/approved', {}, accessToken),
      ]);

      setPendingReviews(pendingData.reviews);
      setApprovedReviews(approvedData.reviews);
    } catch (error) {
      console.error('Error loading reviews:', error);
      toast.error('Error al cargar las reseñas');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reviewId: string, studentName: string) => {
    try {
      setActionLoading(true);
      await apiRequest(`/admin/reviews/${reviewId}`, {
        method: 'PUT',
        body: { action: 'approve' }
      }, accessToken);

      toast.success(`Reseña de ${studentName} aprobada exitosamente`);
      loadReviews(); // Reload both lists
    } catch (error) {
      console.error('Error approving review:', error);
      toast.error('Error al aprobar la reseña');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedReview) return;

    try {
      setActionLoading(true);
      await apiRequest(`/admin/reviews/${selectedReview.id}`, {
        method: 'PUT',
        body: { action: 'delete' }
      }, accessToken);

      toast.success('Reseña eliminada exitosamente');
      setDeleteDialogOpen(false);
      setSelectedReview(null);
      loadReviews(); // Reload both lists
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Error al eliminar la reseña');
    } finally {
      setActionLoading(false);
    }
  };

  const openDeleteDialog = (review: Review, isApproved: boolean = false) => {
    setSelectedReview(review);
    setDeleteDialogOpen(true);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const renderReviewCard = (review: Review, isPending: boolean = true) => {
    // Determine if it's a tutor reviewing a student or a student reviewing a tutor
    const isTutorReviewingStudent = review.reviewerId === review.tutorId;
    const reviewerName = isTutorReviewingStudent ? review.tutorName : review.studentName;
    const revieweeName = isTutorReviewingStudent ? review.studentName : review.tutorName;
    const reviewerType = isTutorReviewingStudent ? 'Tutor' : 'Estudiante';
    const revieweeType = isTutorReviewingStudent ? 'Estudiante' : 'Tutor';
    const reviewerColor = isTutorReviewingStudent ? 'green' : 'blue';
    const revieweeColor = isTutorReviewingStudent ? 'blue' : 'green';

    return (
      <Card key={review.id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {/* Header */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full bg-${reviewerColor}-100 flex items-center justify-center`}>
                    <User className={`h-5 w-5 text-${reviewerColor === 'green' ? 'green-600' : 'primary'}`} />
                  </div>
                  <div>
                    <p className="font-medium">{reviewerName}</p>
                    <p className="text-sm text-muted-foreground">{reviewerType}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-sm">→</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full bg-${revieweeColor}-100 flex items-center justify-center`}>
                    <User className={`h-5 w-5 text-${revieweeColor === 'green' ? 'green-600' : 'primary'}`} />
                  </div>
                  <div>
                    <p className="font-medium">{revieweeName}</p>
                    <p className="text-sm text-muted-foreground">{revieweeType}</p>
                  </div>
                </div>

                {!isPending && (
                  <Badge variant="default" className="ml-auto">
                    Aprobada
                  </Badge>
                )}
              </div>

              {/* Rating */}
              <div className="mb-3">
                <div className="flex items-center gap-3">
                  {renderStars(review.rating)}
                  <Badge variant="secondary">
                    {review.rating.toFixed(1)} estrellas
                  </Badge>
                </div>
              </div>

              {/* Comment */}
              <div className="bg-muted p-4 rounded-lg mb-3">
                <p className="text-sm whitespace-pre-wrap">{review.comment}</p>
              </div>

              {/* Dates */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  Enviado el {new Date(review.createdAt).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                {!isPending && review.approvedAt && (
                  <p className="text-xs text-green-600">
                    ✓ Aprobado el {new Date(review.approvedAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                )}
              </div>

              {/* Warning if low rating */}
              {isPending && review.rating < 3 && (
                <Alert className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Esta es una calificación baja. Revisa cuidadosamente el contenido antes de aprobar.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              {isPending ? (
                <>
                  <Button
                    size="sm"
                    variant="default"
                    className="gap-2"
                    onClick={() => handleApprove(review.id, review.studentName)}
                    disabled={actionLoading}
                  >
                    <Check className="h-4 w-4" />
                    Aprobar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="gap-2"
                    onClick={() => openDeleteDialog(review, false)}
                    disabled={actionLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="destructive"
                  className="gap-2"
                  onClick={() => openDeleteDialog(review, true)}
                  disabled={actionLoading}
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando reseñas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="mb-2">Moderación de Reseñas</h1>
        <p className="text-muted-foreground">
          Revisa, modera y gestiona las reseñas enviadas por los estudiantes
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pendientes de Moderación</p>
                  <p className="text-2xl font-bold">{pendingReviews.length}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reseñas Aprobadas</p>
                  <p className="text-2xl font-bold">{approvedReviews.length}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="pending" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Pendientes ({pendingReviews.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            <History className="h-4 w-4" />
            Historial ({approvedReviews.length})
          </TabsTrigger>
        </TabsList>

        {/* Pending Reviews Tab */}
        <TabsContent value="pending">
          {pendingReviews.length === 0 ? (
            <Card>
              <CardContent className="py-20 text-center">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="mb-2">No hay reseñas pendientes</h3>
                <p className="text-muted-foreground">
                  Todas las reseñas han sido moderadas
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Alert className="mb-6">
                <AlertDescription>
                  Tienes <strong>{pendingReviews.length}</strong> {pendingReviews.length === 1 ? 'reseña pendiente' : 'reseñas pendientes'} de moderación
                </AlertDescription>
              </Alert>

              <div className="grid gap-6">
                {pendingReviews.map((review) => renderReviewCard(review, true))}
              </div>
            </>
          )}
        </TabsContent>

        {/* Approved Reviews Tab */}
        <TabsContent value="approved">
          {approvedReviews.length === 0 ? (
            <Card>
              <CardContent className="py-20 text-center">
                <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <History className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="mb-2">No hay reseñas aprobadas</h3>
                <p className="text-muted-foreground">
                  Aún no se han aprobado reseñas en la plataforma
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Alert className="mb-6">
                <AlertDescription>
                  Mostrando <strong>{approvedReviews.length}</strong> {approvedReviews.length === 1 ? 'reseña aprobada' : 'reseñas aprobadas'}. 
                  Puedes eliminar reseñas si contienen contenido inapropiado.
                </AlertDescription>
              </Alert>

              <div className="grid gap-6">
                {approvedReviews.map((review) => renderReviewCard(review, false))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente la reseña de <strong>{selectedReview?.studentName}</strong> sobre <strong>{selectedReview?.tutorName}</strong>.
              Esta acción no se puede deshacer y afectará la calificación promedio del tutor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={actionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading ? 'Eliminando...' : 'Eliminar Reseña'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}