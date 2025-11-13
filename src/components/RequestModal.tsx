import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface RequestModalProps {
  tutorId: string;
  tutorName: string;
  tutorSubjects: string[];
  onClose: () => void;
  onSuccess: () => void;
}

interface TimeSlot {
  start: string;
  end: string;
}

export function RequestModal({
  tutorId,
  tutorName,
  tutorSubjects,
  onClose,
  onSuccess,
}: RequestModalProps) {
  const { accessToken } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [availability, setAvailability] = useState<Record<string, TimeSlot[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAvailability();
  }, []);

  const loadAvailability = async () => {
    try {
      const data = await apiRequest(`/tutors/${tutorId}/availability`, {}, accessToken);
      setAvailability(data.availability);
    } catch (error) {
      console.error('Error loading availability:', error);
    }
  };

  const getDaysWithAvailability = () => {
    const dayLabels: Record<string, string> = {
      monday: 'Lunes',
      tuesday: 'Martes',
      wednesday: 'Miércoles',
      thursday: 'Jueves',
      friday: 'Viernes',
      saturday: 'Sábado',
      sunday: 'Domingo'
    };

    return Object.entries(availability)
      .filter(([_, slots]) => slots.length > 0)
      .map(([day, _]) => ({
        value: day,
        label: dayLabels[day] || day
      }));
  };

  const getSlotsForDay = () => {
    if (!selectedDay) return [];
    return availability[selectedDay] || [];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!subject || !message || !selectedDay || !selectedSlot) {
      setError('Por favor completa todos los campos');
      return;
    }

    try {
      setLoading(true);
      
      const slot = availability[selectedDay].find(s => 
        `${s.start} - ${s.end}` === selectedSlot
      );

      await apiRequest(
        '/requests',
        {
          method: 'POST',
          body: JSON.stringify({
            tutorId,
            subject,
            message,
            date: selectedDay,
            time: selectedSlot,
          }),
        },
        accessToken
      );

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error al enviar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const daysWithAvailability = getDaysWithAvailability();

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Enviar solicitud a {tutorName}</DialogTitle>
          <DialogDescription>
            Completa la información para solicitar una tutoría
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="subject">Materia</Label>
            <Select value={subject} onValueChange={setSubject} required>
              <SelectTrigger id="subject">
                <SelectValue placeholder="Selecciona una materia" />
              </SelectTrigger>
              <SelectContent>
                {tutorSubjects.map((subj) => (
                  <SelectItem key={subj} value={subj}>
                    {subj}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="message">Tu mensaje para el tutor</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe brevemente tus necesidades..."
              rows={4}
              required
            />
          </div>

          {daysWithAvailability.length === 0 ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Este tutor aún no ha configurado su disponibilidad. Envía tu solicitud y el tutor te contactará.
              </p>
            </div>
          ) : (
            <>
              <div>
                <Label htmlFor="day">Día preferido</Label>
                <Select value={selectedDay} onValueChange={(val) => {
                  setSelectedDay(val);
                  setSelectedSlot('');
                }} required>
                  <SelectTrigger id="day">
                    <SelectValue placeholder="Selecciona un día" />
                  </SelectTrigger>
                  <SelectContent>
                    {daysWithAvailability.map((day) => (
                      <SelectItem key={day.value} value={day.value}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedDay && (
                <div>
                  <Label htmlFor="slot">Horario</Label>
                  <Select value={selectedSlot} onValueChange={setSelectedSlot} required>
                    <SelectTrigger id="slot">
                      <SelectValue placeholder="Selecciona un horario" />
                    </SelectTrigger>
                    <SelectContent>
                      {getSlotsForDay().map((slot, idx) => (
                        <SelectItem key={idx} value={`${slot.start} - ${slot.end}`}>
                          {slot.start} - {slot.end}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}

          {error && (
            <div className="text-destructive text-sm">{error}</div>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Enviando...' : 'Enviar Solicitud'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
