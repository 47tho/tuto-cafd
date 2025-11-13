import React, { useState, useEffect } from 'react';
import { Search, Eye, Trash2, Users, UserCheck, Mail, BookOpen } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
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

interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'tutor';
  carrera?: string;
  subjects?: string[];
  approved?: boolean;
  rating?: number;
  reviewCount?: number;
  createdAt: string;
}

interface AdminUsersProps {
  onNavigate: (view: string, data?: any) => void;
}

export function AdminUsers({ onNavigate }: AdminUsersProps) {
  const { accessToken } = useAuth();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('students');
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [allUsers, searchQuery, activeTab]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/admin/users', {}, accessToken);
      // Filter out admins from the list
      const nonAdminUsers = data.users.filter((u: User) => u.role !== 'admin');
      setAllUsers(nonAdminUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Error al cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = allUsers.filter(user => user.role === (activeTab === 'students' ? 'student' : 'tutor'));

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        (user.carrera && user.carrera.toLowerCase().includes(query)) ||
        (user.subjects && user.subjects.some(s => s.toLowerCase().includes(query)))
      );
    }

    setFilteredUsers(filtered);
  };

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    // Note: In a real implementation, you'd need a DELETE endpoint
    // For now, we'll just show a message
    toast.error('La función de eliminar usuarios aún no está implementada en el backend');
    setDeleteDialogOpen(false);
    setSelectedUser(null);
    
    // TODO: Implement user deletion
    // try {
    //   setActionLoading(true);
    //   await apiRequest(`/admin/users/${selectedUser.id}`, { method: 'DELETE' }, accessToken);
    //   toast.success('Usuario eliminado exitosamente');
    //   loadUsers();
    // } catch (error) {
    //   toast.error('Error al eliminar el usuario');
    // } finally {
    //   setActionLoading(false);
    //   setDeleteDialogOpen(false);
    //   setSelectedUser(null);
    // }
  };

  const renderStars = (rating: number) => {
    return `⭐ ${rating.toFixed(1)}`;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  const students = allUsers.filter(u => u.role === 'student');
  const tutors = allUsers.filter(u => u.role === 'tutor');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="mb-2">Gestión de Usuarios</h1>
        <p className="text-muted-foreground">
          Administra todas las cuentas de estudiantes y tutores en la plataforma
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Estudiantes</p>
                  <p className="text-2xl font-bold">{students.length}</p>
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
                  <UserCheck className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Tutores</p>
                  <p className="text-2xl font-bold">{tutors.length}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, correo, carrera o materia..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="students">
            Estudiantes ({students.length})
          </TabsTrigger>
          <TabsTrigger value="tutors">
            Tutores ({tutors.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="students">
          {filteredUsers.length === 0 ? (
            <Card>
              <CardContent className="py-20 text-center">
                <p className="text-muted-foreground">
                  {searchQuery ? 'No se encontraron estudiantes con ese criterio de búsqueda' : 'No hay estudiantes registrados'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Correo</TableHead>
                    <TableHead>Carrera</TableHead>
                    <TableHead>Fecha de Registro</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">{user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{user.carrera || 'No especificada'}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString('es-ES')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onNavigate('admin-user-detail', { userId: user.id, userRole: 'student' })}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openDeleteDialog(user)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tutors">
          {filteredUsers.length === 0 ? (
            <Card>
              <CardContent className="py-20 text-center">
                <p className="text-muted-foreground">
                  {searchQuery ? 'No se encontraron tutores con ese criterio de búsqueda' : 'No hay tutores registrados'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Correo</TableHead>
                    <TableHead>Materias</TableHead>
                    <TableHead>Calificación</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">{user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {user.subjects && user.subjects.length > 0 ? (
                            <>
                              {user.subjects.slice(0, 2).map((subject, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {subject}
                                </Badge>
                              ))}
                              {user.subjects.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{user.subjects.length - 2}
                                </Badge>
                              )}
                            </>
                          ) : (
                            <span className="text-sm text-muted-foreground">Sin materias</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.reviewCount && user.reviewCount > 0 ? (
                          <div className="text-sm">
                            {renderStars(user.rating || 0)}
                            <span className="text-muted-foreground ml-1">
                              ({user.reviewCount})
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Sin reseñas</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.approved ? 'default' : 'secondary'}>
                          {user.approved ? 'Activo' : 'Pendiente'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onNavigate('admin-user-detail', { userId: user.id, userRole: 'tutor' })}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openDeleteDialog(user)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente la cuenta de <strong>{selectedUser?.name}</strong> ({selectedUser?.email}).
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={actionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading ? 'Eliminando...' : 'Eliminar Usuario'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
