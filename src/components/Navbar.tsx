import React, { useState } from "react";
import {
  Bell,
  User,
  LogOut,
  Search,
  BookOpen,
  Settings,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../utils/auth-context";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Badge } from "./ui/badge";

interface NavbarProps {
  onNavigate: (view: string) => void;
  currentView: string;
  notificationCount?: number;
}

export function Navbar({
  onNavigate,
  currentView,
  notificationCount = 0,
}: NavbarProps) {
  const { user, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (!user) return null;

  return (
    <nav className="border-b bg-white sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => onNavigate("dashboard")}
              className="flex items-center gap-2 hover:opacity-80 transition"
            >
              <BookOpen className="h-8 w-8 text-primary" />
              <span className="text-xl font-semibold text-primary">
                TUTO-CAFD
              </span>
            </button>

            {/* Navigation Links */}
            {user.role === "student" && (
              <div className="hidden md:flex items-center gap-4">
                <Button
                  variant={
                    currentView === "search"
                      ? "default"
                      : "ghost"
                  }
                  onClick={() => onNavigate("search")}
                  className="gap-2"
                >
                  <Search className="h-4 w-4" />
                  Buscar Tutor
                </Button>
                <Button
                  variant={
                    currentView === "my-requests"
                      ? "default"
                      : "ghost"
                  }
                  onClick={() => onNavigate("my-requests")}
                >
                  Mis Tutorías
                </Button>
              </div>
            )}

            {user.role === "tutor" && (
              <div className="hidden md:flex items-center gap-4">
                <Button
                  variant={
                    currentView === "requests-inbox"
                      ? "default"
                      : "ghost"
                  }
                  onClick={() => onNavigate("requests-inbox")}
                >
                  Buzón de Solicitudes
                </Button>
                <Button
                  variant={
                    currentView === "my-tutorias"
                      ? "default"
                      : "ghost"
                  }
                  onClick={() => onNavigate("my-tutorias")}
                >
                  Mis Tutorías
                </Button>
              </div>
            )}

            {user.role === "admin" && (
              <div className="hidden md:flex items-center gap-4">
                <Button
                  variant={
                    currentView === "admin-tutors"
                      ? "default"
                      : "ghost"
                  }
                  onClick={() => onNavigate("admin-tutors")}
                >
                  Postulaciones
                </Button>
                <Button
                  variant={
                    currentView === "admin-reviews"
                      ? "default"
                      : "ghost"
                  }
                  onClick={() => onNavigate("admin-reviews")}
                >
                  Reseñas
                </Button>
                <Button
                  variant={
                    currentView === "admin-users"
                      ? "default"
                      : "ghost"
                  }
                  onClick={() => onNavigate("admin-users")}
                >
                  Usuarios
                </Button>
              </div>
            )}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => onNavigate("notifications")}
            >
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {notificationCount > 9
                    ? "9+"
                    : notificationCount}
                </Badge>
              )}
            </Button>

            {/* User Menu */}
            <DropdownMenu
              open={dropdownOpen}
              onOpenChange={setDropdownOpen}
              modal={true}
            >
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline font-medium">
                    {user.name}
                  </span>
                  <ChevronDown className="h-4 w-4 hidden sm:inline opacity-50" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 z-[100]"
                sideOffset={8}
              >
                <DropdownMenuLabel>
                  <div>
                    <p>{user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.email}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize mt-1">
                      Rol:{" "}
                      {user.role === "student"
                        ? "Estudiante"
                        : user.role === "tutor"
                          ? "Tutor"
                          : "Administrador"}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setDropdownOpen(false);
                    onNavigate("profile");
                  }}
                >
                  <User className="mr-2 h-4 w-4" />
                  Mi Perfil
                </DropdownMenuItem>
                {user.role === "tutor" && (
                  <DropdownMenuItem
                    onClick={() => {
                      setDropdownOpen(false);
                      onNavigate("availability");
                    }}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Gestión de Disponibilidad
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setDropdownOpen(false);
                    signOut();
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}