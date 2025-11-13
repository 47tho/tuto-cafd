import React, { useState, useEffect } from 'react';
import { Search, Star, Filter } from 'lucide-react';
import { useAuth } from '../utils/auth-context';
import { apiRequest } from '../utils/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { SUBJECTS } from '../utils/constants';

interface Tutor {
  id: string;
  name: string;
  bio: string;
  subjects: string[];
  rating: number;
  reviewCount: number;
}

interface TutorSearchProps {
  onNavigate: (view: string, data?: any) => void;
  initialQuery?: string;
}

export function TutorSearch({ onNavigate, initialQuery = '' }: TutorSearchProps) {
  const { accessToken } = useAuth();
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [filteredTutors, setFilteredTutors] = useState<Tutor[]>([]);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [minRating, setMinRating] = useState<string>('0');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTutors();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tutors, searchQuery, selectedSubject, minRating]);

  const loadTutors = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/tutors/search', {}, accessToken);
      setTutors(data.tutors);
    } catch (error) {
      console.error('Error loading tutors:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...tutors];

    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.subjects.some((s) => s.toLowerCase().includes(query))
      );
    }

    // Subject filter
    if (selectedSubject !== 'all') {
      filtered = filtered.filter((t) => t.subjects.includes(selectedSubject));
    }

    // Rating filter
    if (minRating !== '0') {
      const rating = parseFloat(minRating);
      filtered = filtered.filter((t) => t.rating >= rating);
    }

    setFilteredTutors(filtered);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSubject('all');
    setMinRating('0');
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        );
      } else {
        stars.push(<Star key={i} className="h-4 w-4 text-gray-300" />);
      }
    }

    return stars;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search Bar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Input
              placeholder="Busca tu materia..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline" className="gap-2">
              <Search className="h-4 w-4" />
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Materia</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las materias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las materias</SelectItem>
                  {SUBJECTS.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Calificación Mínima</Label>
              <Select value={minRating} onValueChange={setMinRating}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Todas</SelectItem>
                  <SelectItem value="4">4+ estrellas</SelectItem>
                  <SelectItem value="4.5">4.5+ estrellas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" className="w-full" onClick={clearFilters}>
              Limpiar Filtros
            </Button>
          </CardContent>
        </Card>

        {/* Tutors Grid */}
        <div className="lg:col-span-3">
          <div className="mb-4">
            <p className="text-muted-foreground">
              {filteredTutors.length} tutor(es) encontrado(s)
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Cargando tutores...</p>
            </div>
          ) : filteredTutors.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">
                  No se encontraron tutores con estos filtros
                </p>
                <Button onClick={clearFilters}>Limpiar Filtros</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {filteredTutors.map((tutor) => (
                <Card key={tutor.id} className="hover:shadow-lg transition">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl">
                        {tutor.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <CardTitle>{tutor.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex">{renderStars(tutor.rating)}</div>
                          <span className="text-sm text-muted-foreground">
                            {tutor.rating.toFixed(1)} ({tutor.reviewCount})
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {tutor.bio}
                      </p>
                    </div>
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2">Materias:</p>
                      <div className="flex flex-wrap gap-1">
                        {tutor.subjects.slice(0, 3).map((subject, idx) => (
                          <Badge key={idx} variant="secondary">
                            {subject}
                          </Badge>
                        ))}
                        {tutor.subjects.length > 3 && (
                          <Badge variant="outline">
                            +{tutor.subjects.length - 3} más
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => onNavigate('tutor-profile', { tutorId: tutor.id })}
                    >
                      Ver Perfil
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
