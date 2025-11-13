import React, { useState, useEffect } from 'react';
import { Star, Calendar, MessageSquare, ArrowLeft } from 'lucide-react';
import { useAuth } from '../utils/auth-context';
import { apiRequest } from '../utils/api';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { RequestModal } from './RequestModal';

interface TutorProfileProps {
  tutorId: string;
  onNavigate: (view: string, data?: any) => void;
}

interface Tutor {
  id: string;
  name: string;
  bio: string;
  subjects: string[];
  rating: number;
  reviewCount: number;
  whatsapp?: string;
}

interface Review {
  id: string;
  studentId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export function TutorProfile({ tutorId, onNavigate }: TutorProfileProps) {
  const { accessToken, user } = useAuth();
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);

  useEffect(() => {
    loadTutorData();
  }, [tutorId]);

  const loadTutorData = async () => {
    try {
      setLoading(true);
      const data = await apiRequest(`/tutors/${tutorId}`, {}, accessToken);
      setTutor(data.tutor);
      setReviews(data.reviews || []);
    } catch (error) {
      console.error('Error loading tutor:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
        );
      } else {
        stars.push(<Star key={i} className="h-5 w-5 text-gray-300" />);
      }
    }

    return stars;
  };

  const renderReviewStars = (rating: number) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      if (i < rating) {
        stars.push(
          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        );
      } else {
        stars.push(<Star key={i} className="h-4 w-4 text-gray-300" />);
      }
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-center text-muted-foreground">Cargando perfil...</p>
      </div>
    );
  }

  if (!tutor) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-center text-muted-foreground">Tutor no encontrado</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        className="mb-6 gap-2"
        onClick={() => onNavigate('search')}
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a Búsqueda
      </Button>

      {/* Tutor Header */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="h-32 w-32 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-5xl flex-shrink-0">
              {tutor.name.charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="mb-2">{tutor.name}</h1>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">{renderStars(tutor.rating)}</div>
                <span className="text-muted-foreground">
                  {tutor.rating.toFixed(1)} de 5 ({tutor.reviewCount} reseñas)
                </span>
              </div>

              {/* Subjects */}
              <div className="mb-4">
                <p className="font-medium mb-2">Materias que Enseña:</p>
                <div className="flex flex-wrap gap-2">
                  {tutor.subjects.map((subject, idx) => (
                    <Badge key={idx} variant="secondary">
                      {subject}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* CTA Button */}
              {user?.role === 'student' && (
                <Button
                  size="lg"
                  className="gap-2"
                  onClick={() => setShowRequestModal(true)}
                >
                  <MessageSquare className="h-5 w-5" />
                  Enviar Solicitud
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Biography */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Biografía</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground whitespace-pre-wrap">{tutor.bio}</p>
        </CardContent>
      </Card>

      {/* Reviews Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Lo que dicen los estudiantes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Este tutor aún no tiene reseñas
            </p>
          ) : (
            <div className="space-y-6">
              {reviews.map((review, idx) => (
                <div key={review.id}>
                  {idx > 0 && <Separator className="mb-6" />}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">{renderReviewStars(review.rating)}</div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <p className="text-muted-foreground">{review.comment}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request Modal */}
      {showRequestModal && (
        <RequestModal
          tutorId={tutorId}
          tutorName={tutor.name}
          tutorSubjects={tutor.subjects}
          onClose={() => setShowRequestModal(false)}
          onSuccess={() => {
            setShowRequestModal(false);
            onNavigate('my-requests');
          }}
        />
      )}
    </div>
  );
}
