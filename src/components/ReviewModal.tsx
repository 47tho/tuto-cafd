import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { useAuth } from '../utils/auth-context';
import { apiRequest } from '../utils/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

interface ReviewModalProps {
  tutorId?: string;
  studentId?: string;
  tutorName?: string;
  studentName?: string;
  requestId: string;
  isReviewingTutor: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReviewModal({
  tutorId,
  studentId,
  tutorName,
  studentName,
  requestId,
  isReviewingTutor,
  onClose,
  onSuccess,
}: ReviewModalProps) {
  const { accessToken, user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (rating === 0) {
      setError('Por favor selecciona una calificación');
      return;
    }

    if (!comment.trim()) {
      setError('Por favor escribe un comentario');
      return;
    }

    try {
      setLoading(true);
      await apiRequest(
        '/reviews',
        {
          method: 'POST',
          body: {
            tutorId: isReviewingTutor ? tutorId : user?.id,
            studentId: isReviewingTutor ? user?.id : studentId,
            rating,
            comment: comment.trim(),
            requestId,
          },
        },
        accessToken
      );

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error al enviar la reseña');
    } finally {
      setLoading(false);
    }
  };

  const revieweeName = isReviewingTutor ? tutorName : studentName;
  const revieweeType = isReviewingTutor ? 'tutor' : 'estudiante';

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Califica tu tutoría con {revieweeName}</DialogTitle>
          <DialogDescription>
            Tu opinión ayuda a otros {isReviewingTutor ? 'estudiantes' : 'tutores'} a elegir {isReviewingTutor ? 'el mejor tutor' : 'los mejores estudiantes'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Tu calificación</Label>
            <div className="flex gap-2 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="transition-transform hover:scale-110"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    className={`h-10 w-10 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                Calificación: {rating} {rating === 1 ? 'estrella' : 'estrellas'}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="comment">Tu comentario</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                isReviewingTutor
                  ? 'Comparte tu experiencia con este tutor...'
                  : 'Comparte tu experiencia con este estudiante...'
              }
              rows={5}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Tu reseña será revisada por un administrador antes de publicarse
            </p>
          </div>

          {error && (
            <div className="text-destructive text-sm">{error}</div>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Enviando...' : 'Enviar Reseña'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
