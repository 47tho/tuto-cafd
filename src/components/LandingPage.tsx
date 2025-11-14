
import React, { useState, useEffect, useRef } from "react";
import {
  BookOpen,
  Search,
  Users,
  Star,
  CheckCircle,
  Calendar,
  UserCheck,
  TrendingUp,
  BarChart,
  Wallet,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui/tabs";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useAuth } from "../utils/auth-context";
import { SUBJECTS, CAREERS } from "../utils/constants";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";

// Props actualizadas
interface LandingPageProps {
  onLinkClick: (content: string) => void;
}

// (Para que TypeScript reconozca el objeto `turnstile` global)
declare global {
  interface Window {
    turnstile?: {
      reset: (widgetId?: string) => void;
      render: (element: HTMLElement | string, options: any) => string;
      remove: (widgetId: string) => void;
    };
  }
}

export function LandingPage({ onLinkClick }: LandingPageProps) {
  const { signIn, signUp } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<
    string[]
  >([]);
  const [selectedCareer, setSelectedCareer] =
    useState<string>("");

  // --- Estados para controlar los tabs del modal ---
  const [authView, setAuthView] = useState("signin");
  const [roleView, setRoleView] = useState("student");

  // Refs para los widgets de Turnstile
  const signinTurnstileRef = useRef<HTMLDivElement>(null);
  const signupStudentTurnstileRef = useRef<HTMLDivElement>(null);
  const signupTutorTurnstileRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetIds = useRef<{ signin?: string; student?: string; tutor?: string }>({});
  
  // Estados para los tokens de Turnstile
  const [turnstileTokens, setTurnstileTokens] = useState<{ signin?: string; student?: string; tutor?: string }>({});

  // Función para renderizar el widget de Turnstile
  const renderTurnstile = (element: HTMLElement | null, key: 'signin' | 'student' | 'tutor') => {
    if (!element || !window.turnstile) return;
    
    // Remover widget anterior si existe
    const existingWidgetId = turnstileWidgetIds.current[key];
    if (existingWidgetId) {
      try {
        window.turnstile.remove(existingWidgetId);
      } catch (e) {
        // Ignorar errores al remover
      }
    }

    // Limpiar token anterior
    setTurnstileTokens(prev => ({ ...prev, [key]: undefined }));

    // Renderizar nuevo widget
    try {
      const widgetId = window.turnstile.render(element, {
        sitekey: '0x4AAAAAACA1n_LS4lQdqDbV',
        theme: 'light',
        callback: (token: string) => {
          // Token generado, guardarlo en el estado
          setTurnstileTokens(prev => ({ ...prev, [key]: token }));
        },
        'error-callback': () => {
          setError('Error en la verificación de seguridad. Por favor, intenta de nuevo.');
          setTurnstileTokens(prev => ({ ...prev, [key]: undefined }));
        },
        'expired-callback': () => {
          setError('La verificación de seguridad ha expirado. Por favor, intenta de nuevo.');
          setTurnstileTokens(prev => ({ ...prev, [key]: undefined }));
          if (window.turnstile && turnstileWidgetIds.current[key]) {
            window.turnstile.reset(turnstileWidgetIds.current[key]!);
          }
        },
      });
      turnstileWidgetIds.current[key] = widgetId;
    } catch (e) {
      console.error('Error rendering Turnstile:', e);
    }
  };

  // Inicializar Turnstile cuando el modal se abre o cambian los tabs
  useEffect(() => {
    if (!showAuthDialog) return;

    let attemptCount = 0;
    const maxAttempts = 50; // Máximo 5 segundos (50 * 100ms)
    const timeouts: NodeJS.Timeout[] = [];

    // Función para verificar y renderizar Turnstile
    const checkAndRenderTurnstile = () => {
      attemptCount++;
      
      if (!window.turnstile) {
        if (attemptCount < maxAttempts) {
          // Si Turnstile no está cargado, esperar un poco más
          const timeout = setTimeout(checkAndRenderTurnstile, 100);
          timeouts.push(timeout);
        } else {
          console.error('Turnstile script no se cargó después de varios intentos');
          setError('Error al cargar la verificación de seguridad. Por favor, recarga la página.');
        }
        return;
      }

      // Esperar a que el DOM esté listo
      const renderTimeout = setTimeout(() => {
        if (authView === 'signin' && signinTurnstileRef.current) {
          renderTurnstile(signinTurnstileRef.current, 'signin');
        } else if (authView === 'signup' && roleView === 'student' && signupStudentTurnstileRef.current) {
          renderTurnstile(signupStudentTurnstileRef.current, 'student');
        } else if (authView === 'signup' && roleView === 'tutor' && signupTutorTurnstileRef.current) {
          renderTurnstile(signupTutorTurnstileRef.current, 'tutor');
        }
      }, 100);
      timeouts.push(renderTimeout);
    };

    // Iniciar verificación
    const initialTimeout = setTimeout(checkAndRenderTurnstile, 100);
    timeouts.push(initialTimeout);

    return () => {
      // Limpiar todos los timeouts
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [showAuthDialog, authView, roleView]);

  const handleSignIn = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // Verificar token de Turnstile
    const turnstileToken = turnstileTokens.signin;
    if (!turnstileToken) {
      setError("Por favor, completa la verificación de seguridad.");
      setLoading(false);
      // Reiniciar el widget
      if (window.turnstile && turnstileWidgetIds.current.signin) {
        window.turnstile.reset(turnstileWidgetIds.current.signin);
      }
      return;
    }

    try {
      await signIn(email, password, turnstileToken);
      setShowAuthDialog(false);
      // Limpiar token después de éxito
      setTurnstileTokens(prev => ({ ...prev, signin: undefined }));
    } catch (err: any) {
      setError(err.message);
      // Limpiar token y reiniciar el widget en caso de error
      setTurnstileTokens(prev => ({ ...prev, signin: undefined }));
      if (window.turnstile && turnstileWidgetIds.current.signin) {
        window.turnstile.reset(turnstileWidgetIds.current.signin);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (
    e: React.FormEvent<HTMLFormElement>,
    role: string,
  ) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data: any = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      name: formData.get("name") as string,
      role,
    };

    // Verificar token de Turnstile
    const widgetKey = role === 'student' ? 'student' : 'tutor';
    const turnstileToken = turnstileTokens[widgetKey];
    if (!turnstileToken) {
      setError("Por favor, completa la verificación de seguridad.");
      setLoading(false);
      // Reiniciar el widget correspondiente
      if (window.turnstile && turnstileWidgetIds.current[widgetKey]) {
        window.turnstile.reset(turnstileWidgetIds.current[widgetKey]!);
      }
      return;
    }

    if (role === "student") {
      data.carrera =
        selectedCareer || (formData.get("carrera") as string);
    } else if (role === "tutor") {
      data.bio = formData.get("bio") as string;
      data.subjects = selectedSubjects;
    }

    try {
      const result = await signUp(data, turnstileToken);

      if (result.needsApproval) {
        setSuccess(
          "Tu solicitud ha sido enviada. Un administrador la revisará pronto.",
        );
        // Limpiar token después de éxito
        setTurnstileTokens(prev => ({ ...prev, [widgetKey]: undefined }));
        setTimeout(() => setShowAuthDialog(false), 3000);
      } else {
        setSuccess(
          "¡Cuenta creada! Por favor, inicia sesión para continuar.",
        );
        // Limpiar token
        setTurnstileTokens(prev => ({ ...prev, [widgetKey]: undefined }));
        setAuthView("signin"); // Cambia al tab de inicio de sesión
        // Reiniciar el widget de signin
        setTimeout(() => {
          if (signinTurnstileRef.current) {
            renderTurnstile(signinTurnstileRef.current, 'signin');
          }
        }, 100);
      }
    } catch (err: any) {
      setError(err.message);
      // Limpiar token y reiniciar el widget correspondiente en caso de error
      setTurnstileTokens(prev => ({ ...prev, [widgetKey]: undefined }));
      if (window.turnstile && turnstileWidgetIds.current[widgetKey]) {
        window.turnstile.reset(turnstileWidgetIds.current[widgetKey]!);
      }
    } finally {
      setLoading(false);
    }
  };

  // --- Funciones para abrir el modal en el estado correcto ---
  const openModal = (
    auth: "signin" | "signup",
    role: "student" | "tutor" = "student",
  ) => {
    setAuthView(auth);
    setRoleView(role);
    setShowAuthDialog(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-primary" />
              <span className="text-xl font-semibold text-primary">
                TUTO-CAFD
              </span>
            </div>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => openModal("signin")}
              >
                Iniciar Sesión
              </Button>
              <Button onClick={() => openModal("signup")}>
                Registrarse
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Conecta con el conocimiento.
            <br />
            Encuentra tu tutor ideal.
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            TUTO-CAFD te ayuda a encontrar tutores
            universitarios expertos para tus materias más
            desafiantes. Aprende de los mejores, a tu ritmo.
          </p>
          <Button
            size="lg"
            onClick={() => openModal("signup")}
            className="gap-2"
          >
            <Search className="h-5 w-5" />
            Registrarse Ahora
          </Button>
        </div>

        {/* Stats Section */}
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6 mt-16">
          <Card>
            <CardContent className="pt-6 text-center">
              <h3 className="text-3xl font-bold text-primary mb-2">
                50+
              </h3>
              <p className="text-muted-foreground">
                Tutores Expertos
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <h3 className="text-3xl font-bold text-primary mb-2">
                200+
              </h3>
              <p className="text-muted-foreground">
                Estudiantes Activos
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <h3 className="text-3xl font-bold text-primary mb-2">
                1K+
              </h3>
              <p className="text-muted-foreground">
                Tutorías Realizadas
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section (For Students) */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <span className="text-primary font-semibold">
              Soluciones para Estudiantes
            </span>
            <h2 className="text-3xl font-semibold mt-2 mb-4">
              Aprende, Reserva y Crece
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-12">
              Encuentra, reserva y aprende con los mejores
              tutores de tu universidad. Tu compañero ideal
              comienza aquí.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                  <Search className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">
                  Búsqueda Fácil
                </CardTitle>
              </CardHeader>
              <CardContent className="!pt-0">
                <p className="text-muted-foreground">
                  Filtra por materia, carrera o calificación
                  para encontrar tu tutor ideal.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                  <UserCheck className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">
                  Tutores Verificados
                </CardTitle>
              </CardHeader>
              <CardContent className="!pt-0">
                <p className="text-muted-foreground">
                  Todos nuestros tutores son estudiantes
                  destacados aprobados por la facultad.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">
                  Horarios Flexibles
                </CardTitle>
              </CardHeader>
              <CardContent className="!pt-0">
                <p className="text-muted-foreground">
                  Reserva en el horario que mejor se adapte a tu
                  agenda.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">
                  Múltiples Materias
                </CardTitle>
              </CardHeader>
              <CardContent className="!pt-0">
                <p className="text-muted-foreground">
                  Desde Cálculo hasta Programación, todo en un
                  solo lugar.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                  <Star className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">
                  Reseñas Verificadas
                </CardTitle>
              </CardHeader>
              <CardContent className="!pt-0">
                <p className="text-muted-foreground">
                  Lee opiniones de otros estudiantes para elegir
                  la mejor opción.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">
                  Comunidad CAFD
                </CardTitle>
              </CardHeader>
              <CardContent className="!pt-0">
                <p className="text-muted-foreground">
                  Conecta con compañeros y tutores de tu misma
                  facultad.
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="text-center mt-12">
            <Button
              size="lg"
              onClick={() => openModal("signin")}
              className="gap-2"
            >
              Explora Tutores
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section (For Tutors) */}
      <section className="py-16 px-4 bg-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <span className="text-primary font-semibold">
              Soluciones para Tutores
            </span>
            <h2 className="text-3xl font-semibold mt-2 mb-4">
              Comparte tu Conocimiento
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-12">
              Ayuda a otros estudiantes, gestiona tus horarios y
              genera ingresos. Únete a nuestra comunidad de
              tutores.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-2">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-lg">
                  Aumenta tu Visibilidad
                </CardTitle>
              </CardHeader>
              <CardContent className="!pt-0">
                <p className="text-muted-foreground">
                  Llega a cientos de estudiantes que buscan
                  ayuda en tus materias.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-2">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-lg">
                  Gestiona tus Horarios
                </CardTitle>
              </CardHeader>
              <CardContent className="!pt-0">
                <p className="text-muted-foreground">
                  Define tu disponibilidad y recibe solicitudes
                  acordes a tu tiempo.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-2">
                  <BarChart className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-lg">
                  Panel de Control
                </CardTitle>
              </CardHeader>
              <CardContent className="!pt-0">
                <p className="text-muted-foreground">
                  Administra tus solicitudes, tutorías
                  completadas y reseñas.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-2">
                  <Wallet className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-lg">
                  Genera Ingresos
                </CardTitle>
              </CardHeader>
              <CardContent className="!pt-0">
                <p className="text-muted-foreground">
                  (Próximamente) Recibe pagos por tus tutorías
                  directamente en la plataforma.
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="text-center mt-12">
            <Button
              size="lg"
              variant="outline"
              onClick={() => openModal("signup", "tutor")}
              className="gap-2"
            >
              Postúlate como Tutor
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-semibold text-center mb-12">
            Opiniones Reales, Resultados Reales
          </h2>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-center mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-muted-foreground italic mb-4">
                  "¡Increíble! Encontré un tutor para Cálculo
                  dos días antes de mi parcial y logré aprobar.
                  Muy recomendado."
                </p>
                <p className="font-semibold">Ana Gómez</p>
                <p className="text-sm text-muted-foreground">
                  Estudiante de Ing. de Sistemas
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-center mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-muted-foreground italic mb-4">
                  "Como tutor, la plataforma me facilita mucho
                  organizar mis horarios y conectar con
                  estudiantes que realmente necesitan ayuda."
                </p>
                <p className="font-semibold">Luis Fernández</p>
                <p className="text-sm text-muted-foreground">
                  Tutor de Programación
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-center mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-muted-foreground italic mb-4">
                  "La función de reseñas es clave. Pude elegir a
                  mi tutora de Física sabiendo que otros habían
                  tenido buenas experiencias."
                </p>
                <p className="font-semibold">Sofía Castro</p>
                <p className="text-sm text-muted-foreground">
                  Estudiante de Ing. Civil
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="text-center mt-8">
            <p className="text-muted-foreground">
              Calificación promedio:{" "}
              <span className="font-semibold text-gray-800">
                4.8/5
              </span>{" "}
              de 200+ reseñas
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 py-8 px-4">
        <div className="max-w-7xl mx-auto text-center text-gray-600">
          <div className="flex justify-center gap-6 mb-4">
            <button
              onClick={() => onLinkClick("about")}
              className="hover:text-primary transition-colors"
            >
              Sobre Nosotros
            </button>
            <button
              onClick={() => onLinkClick("contact")}
              className="hover:text-primary transition-colors"
            >
              Contacto
            </button>
            <button
              onClick={() => onLinkClick("terms")}
              className="hover:text-primary transition-colors"
            >
              Términos y Condiciones
            </button>
            <button
              onClick={() => onLinkClick("privacy")}
              className="hover:text-primary transition-colors"
            >
              Política de Privacidad
            </button>
          </div>
          <p>
            &copy; 2025 TUTO-CAFD. Todos los derechos
            reservados.
          </p>
        </div>
      </footer>

      {/* Auth Dialog */}
      <Dialog
        open={showAuthDialog}
        onOpenChange={(open) => {
          setShowAuthDialog(open);
          if (!open) {
            setSelectedSubjects([]);
            setSelectedCareer("");
            setError("");
            setSuccess("");
            // Reset tabs al cerrar
            setAuthView("signin");
            setRoleView("student");
            // Limpiar widgets de Turnstile
            Object.entries(turnstileWidgetIds.current).forEach(([key, widgetId]) => {
              if (typeof widgetId === 'string' && window.turnstile) {
                try {
                  window.turnstile.remove(widgetId);
                } catch (e) {
                  // Ignorar errores
                }
              }
            });
            turnstileWidgetIds.current = {};
            setTurnstileTokens({});
          }
        }}
      >
        <DialogContent
          className="sm:max-w-[500px] !flex !flex-col !p-0 !gap-0"
          style={{
            maxHeight: "90vh",
            height: "auto",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b">
            <DialogTitle>Accede a TUTO-CAFD</DialogTitle>
            <DialogDescription>
              Inicia sesión o regístrate para comenzar
            </DialogDescription>
          </DialogHeader>

          <div
            className="flex-1 overflow-y-auto px-6 pb-6"
            style={{
              minHeight: 0,
              maxHeight: "calc(90vh - 140px)",
              overflowY: "auto",
            }}
          >
            <Tabs
              value={authView}
              onValueChange={setAuthView}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">
                  Iniciar Sesión
                </TabsTrigger>
                <TabsTrigger value="signup">
                  Registrarse
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form
                  onSubmit={handleSignIn}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="signin-email">
                      Correo Electrónico
                    </Label>
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      required
                      placeholder="tu@email.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signin-password">
                      Contraseña
                    </Label>
                    <Input
                      id="signin-password"
                      name="password"
                      type="password"
                      required
                      placeholder="••••••••"
                    />
                  </div>
                  
                  {/* --- WIDGET DE TURNSTILE --- */}
                  <div ref={signinTurnstileRef}></div>
                  {/* ------------------------------------ */}

                  {error && (
                    <div className="text-destructive text-sm">
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="text-green-600 text-sm flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      {success}
                    </div>
                  )}
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading
                      ? "Iniciando sesión..."
                      : "Iniciar Sesión"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <Tabs
                  value={roleView}
                  onValueChange={setRoleView}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="student">
                      Estudiante
                    </TabsTrigger>
                    <TabsTrigger value="tutor">
                      Tutor
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="student">
                    <form
                      onSubmit={(e) =>
                        handleSignUp(e, "student")
                      }
                      className="space-y-4"
                    >
                      <div>
                        <Label htmlFor="student-name">
                          Nombre Completo
                        </Label>
                        <Input
                          id="student-name"
                          name="name"
                          required
                          placeholder="Juan Pérez"
                        />
                      </div>
                      <div>
                        <Label htmlFor="student-email">
                          Correo Electrónico
                        </Label>
                        <Input
                          id="student-email"
                          name="email"
                          type="email"
                          required
                          placeholder="tu@email.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="student-password">
                          Contraseña
                        </Label>
                        <Input
                          id="student-password"
                          name="password"
                          type="password"
                          required
                          placeholder="••••••••"
                          minLength={6}
                        />
                      </div>
                      <div>
                        <Label htmlFor="student-carrera">
                          Carrera
                        </Label>
                        <Select
                          value={selectedCareer}
                          onValueChange={setSelectedCareer}
                          required
                        >
                          <SelectTrigger id="student-carrera">
                            <SelectValue placeholder="Selecciona tu carrera" />
                          </SelectTrigger>
                          <SelectContent>
                            {CAREERS.map((career) => (
                              <SelectItem
                                key={career}
                                value={career}
                              >
                                {career}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* --- WIDGET DE TURNSTILE --- */}
                      <div ref={signupStudentTurnstileRef}></div>
                      {/* ------------------------------------ */}

                      {error && (
                        <div className="text-destructive text-sm">
                          {error}
                        </div>
                      )}
                      {success && (
                        <div className="text-green-600 text-sm flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          {success}
                        </div>
                      )}
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={loading || !selectedCareer}
                      >
                        {loading
                          ? "Registrando..."
                          : "Crear Cuenta de Estudiante"}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="tutor">
                    <form
                      onSubmit={(e) => handleSignUp(e, "tutor")}
                      className="space-y-4"
                    >
                      <div>
                        <Label htmlFor="tutor-name">
                          Nombre Completo
                        </Label>
                        <Input
                          id="tutor-name"
                          name="name"
                          required
                          placeholder="María García"
                        />
                      </div>
                      <div>
                        <Label htmlFor="tutor-email">
                          Correo Electrónico
                        </Label>
                        <Input
                          id="tutor-email"
                          name="email"
                          type="email"
                          required
                          placeholder="tu@email.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="tutor-password">
                          Contraseña
                        </Label>
                        <Input
                          id="tutor-password"
                          name="password"
                          type="password"
                          required
                          placeholder="••••••••"
                          minLength={6}
                        />
                      </div>
                      <div>
                        <Label htmlFor="tutor-bio">
                          Biografía
                        </Label>
                        <Textarea
                          id="tutor-bio"
                          name="bio"
                          required
                          placeholder="Cuéntanos sobre tu experiencia..."
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label>
                          Materias que puedes enseñar
                        </Label>
                        <div
                          className="mt-2 border rounded-md p-3"
                          style={{
                            maxHeight: "200px",
                            overflowY: "auto",
                            overflowX: "hidden",
                          }}
                        >
                          <div className="flex flex-wrap gap-2">
                            {SUBJECTS.map((subject) => (
                              <button
                                key={subject}
                                type="button"
                                onClick={() => {
                                  setSelectedSubjects((prev) =>
                                    prev.includes(subject)
                                      ? prev.filter(
                                          (s) => s !== subject,
                                        )
                                      : [...prev, subject],
                                  );
                                }}
                                className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                                  selectedSubjects.includes(
                                    subject,
                                  )
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-background hover:bg-accent border-border"
                                }`}
                              >
                                {subject}
                              </button>
                            ))}
                          </div>
                        </div>
                        {selectedSubjects.length === 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Selecciona al menos una materia
                          </p>
                        )}
                        {selectedSubjects.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {selectedSubjects.length} materia(s)
                            seleccionada(s)
                          </p>
                        )}
                      </div>
                      
                      {/* --- WIDGET DE TURNSTILE --- */}
                      <div ref={signupTutorTurnstileRef}></div>
                      {/* ------------------------------------ */}
                      
                      {error && (
                        <div className="text-destructive text-sm">
                          {error}
                        </div>
                      )}
                      {success && (
                        <div className="text-green-600 text-sm flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          {success}
                        </div>
                      )}
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={
                          loading ||
                          selectedSubjects.length === 0
                        }
                      >
                        {loading
                          ? "Enviando solicitud..."
                          : "Enviar Solicitud"}
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">
                        Tu solicitud será revisada por un
                        administrador
                      </p>
                    </form>
                  </TabsContent>
                </Tabs>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}