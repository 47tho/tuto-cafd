import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Clock } from 'lucide-react';
import { useAuth } from '../utils/auth-context';
import { apiRequest } from '../utils/api';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { DAYS, TIME_SLOTS } from '../utils/constants';

interface TimeSlot {
  start: string;
  end: string;
}

export function AvailabilityManagement() {
  const { accessToken, user } = useAuth();
  const [availability, setAvailability] = useState<Record<string, TimeSlot[]>>({});
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadAvailability();
  }, []);

  const loadAvailability = async () => {
    try {
      setLoading(true);
      const data = await apiRequest(`/tutors/${user?.id}/availability`, {}, accessToken);
      setAvailability(data.availability);
    } catch (error) {
      console.error('Error loading availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlot = async () => {
    setError('');

    if (!selectedDay || !startTime || !endTime) {
      setError('Por favor completa todos los campos');
      return;
    }

    if (startTime >= endTime) {
      setError('La hora de fin debe ser posterior a la hora de inicio');
      return;
    }

    try {
      const currentSlots = availability[selectedDay] || [];
      const newSlots = [...currentSlots, { start: startTime, end: endTime }];

      await apiRequest(
        '/tutors/availability',
        {
          method: 'PUT',
          body: JSON.stringify({
            day: selectedDay,
            slots: newSlots,
          }),
        },
        accessToken
      );

      setAvailability({
        ...availability,
        [selectedDay]: newSlots,
      });

      setShowAddModal(false);
      setSelectedDay('');
      setStartTime('');
      setEndTime('');
    } catch (error: any) {
      setError(error.message || 'Error al añadir bloque');
    }
  };

  const handleDeleteSlot = async (day: string, slotIndex: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este bloque?')) return;

    try {
      const currentSlots = availability[day] || [];
      const newSlots = currentSlots.filter((_, idx) => idx !== slotIndex);

      await apiRequest(
        '/tutors/availability',
        {
          method: 'PUT',
          body: JSON.stringify({
            day,
            slots: newSlots,
          }),
        },
        accessToken
      );

      setAvailability({
        ...availability,
        [day]: newSlots,
      });
    } catch (error) {
      console.error('Error deleting slot:', error);
    }
  };

  const getDayLabel = (dayValue: string) => {
    return DAYS.find(d => d.value === dayValue)?.label || dayValue;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="mb-2">Gestión de Disponibilidad</h1>
        <p className="text-muted-foreground">
          Configura tus horarios disponibles para tutorías
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Mi Disponibilidad Semanal
            </CardTitle>
            <Button onClick={() => setShowAddModal(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Añadir Bloque
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground">Cargando...</p>
          ) : (
            <div className="space-y-6">
              {DAYS.map((day) => {
                const slots = availability[day.value] || [];
                return (
                  <div key={day.value}>
                    <h3 className="mb-3">{day.label}</h3>
                    {slots.length === 0 ? (
                      <p className="text-sm text-muted-foreground pl-4">
                        No hay bloques configurados
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {slots.map((slot, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 bg-accent/50 rounded-lg"
                          >
                            <span className="text-sm">
                              {slot.start} - {slot.end}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSlot(day.value, idx)}
                              className="gap-2 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                              Eliminar
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Slot Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir Bloque de Hora</DialogTitle>
            <DialogDescription>
              Configura un nuevo horario disponible
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Día de la semana</Label>
              <Select value={selectedDay} onValueChange={setSelectedDay}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un día" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((day) => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Hora de Inicio</Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona hora" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Hora de Fin</Label>
              <Select value={endTime} onValueChange={setEndTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona hora" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="text-destructive text-sm">{error}</div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddModal(false);
                  setError('');
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button onClick={handleAddSlot} className="flex-1">
                Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
