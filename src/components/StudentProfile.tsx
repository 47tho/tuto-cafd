import React, { useState, useEffect } from 'react';
import { Star, User, Calendar, Mail, BookOpen, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar } from './ui/avatar';
import { apiRequest } from '../utils/api';
import { toast } from 'sonner@2.0.3';

interface Review {
  id: string;
  tutorId: string;
  studentId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
  carrera: string;
  rating: number;
  reviewCount: number;
  createdAt: string;
}

interface StudentProfileProps {
  studentId: string;
  onBack?: () => void;
}

export function StudentProfile({ studentId, onBack }: StudentProfileProps) {
  const [student, setStudent] = useState<Student | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudentProfile();
  }, [studentId]);

  const loadStudentProfile = async () => {
    try {
      setLoading(true);
      const data = await apiRequest(`/students/${studentId}`, {});
      setStudent(data.student);
      setReviews(data.reviews);
    } catch (error) {
      console.error('Error loading student profile:', error);
      toast.error('Error al cargar el perfil del estudiante');
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-20 text-center">
            <p className="text-muted-foreground">No se encontró el perfil del estudiante</p>
            {onBack && (
              <Button className="mt-4" onClick={onBack}>
                Volver
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {onBack && (
        <Button
          variant="ghost"
          className="gap-2 mb-4"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
      )}

      {/* Header Card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <div className="h-24 w-24 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-3xl flex-shrink-0">
              {student.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="mb-2">{student.name}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {student.email}
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  {student.carrera}
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {renderStars(student.rating)}
                  <span className="font-medium">
                    {student.rating > 0 ? student.rating.toFixed(1) : '0.0'}
                  </span>
                </div>
                <Badge variant="secondary">
                  {student.reviewCount} {student.reviewCount === 1 ? 'reseña' : 'reseñas'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews Section */}
      <Card>
        <CardHeader>
          <CardTitle>Reseñas de Tutores</CardTitle>
          <CardDescription>
            Lo que otros tutores opinan sobre este estudiante
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Star className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Este estudiante aún no tiene reseñas</p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b last:border-0 pb-6 last:pb-0">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <User className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          {renderStars(review.rating)}
                          <span className="font-medium">
                            {review.rating.toFixed(1)}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(review.createdAt).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {review.comment}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      {student.reviewCount === 0 && (
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-blue-900 mb-1">Estudiante Nuevo</p>
                <p className="text-sm text-blue-700">
                  Este estudiante es nuevo en la plataforma y aún no ha recibido reseñas de otros tutores.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
