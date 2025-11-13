import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./utils/auth-context";
import { apiRequest } from "./utils/api";
import { LandingPage } from "./components/LandingPage";
import { Navbar } from "./components/Navbar";
import { StudentDashboard } from "./components/StudentDashboard";
import { TutorSearch } from "./components/TutorSearch";
import { TutorProfile } from "./components/TutorProfile";
import { MyRequests } from "./components/MyRequests";
import { TutorInbox } from "./components/TutorInbox";
import { AvailabilityManagement } from "./components/AvailabilityManagement";
import { Profile } from "./components/Profile";
import { Notifications } from "./components/Notifications";
import { AdminDashboard } from "./components/AdminDashboard";
import { AdminTutorApplications } from "./components/AdminTutorApplications";
import { AdminReviews } from "./components/AdminReviews";
import { AdminUsers } from "./components/AdminUsers";
import { AdminUserDetail } from "./components/AdminUserDetail";
import { Toaster } from "./components/ui/sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./components/ui/dialog";
import { ScrollArea } from "./components/ui/scroll-area";

// --- Helper Components para el Modal de Información ---

function AboutContent() {
  return (
    <div className="space-y-4 text-muted-foreground">
      <p className="font-semibold text-lg text-foreground">
        Un Proyecto de Estudiantes para Estudiantes
      </p>
      <p>
        TUTO-CAFD es una iniciativa nacida en la Facultad de
        Ingeniería de la Universidad de La Guajira, diseñada
        para conectar a estudiantes que necesitan apoyo
        académico con tutores calificados dentro de nuestra
        propia comunidad universitaria.
      </p>
      <p>
        Creemos en el poder del conocimiento compartido y en el
        apoyo mutuo para crecer académicamente.
      </p>
      <h3 className="font-semibold text-foreground pt-4">
        Equipo de Desarrollo
      </h3>
      <p>
        Este proyecto es liderado y desarrollado por estudiantes
        de Ingeniería de Sistemas:
      </p>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <span className="font-medium text-foreground">
            Líder de Proyecto:
          </span>{" "}
          Camilo Thomas
        </li>
        <li>
          <span className="font-medium text-foreground">
            Equipo de Trabajo:
          </span>{" "}
          Adrian Lopen
        </li>
        <li>
          <span className="font-medium text-foreground">
            Equipo de Trabajo:
          </span>{" "}
          Fredy Deluque
        </li>
        <li>
          <span className="font-medium text-foreground">
            Equipo de Trabajo:
          </span>{" "}
          Deivis Magnadiel
        </li>
      </ul>
    </div>
  );
}

function TermsContent() {
  return (
    <div className="space-y-4 text-muted-foreground text-sm">
      <p className="text-xs">
        Última actualización: 13 de noviembre de 2025
      </p>
      <p>
        Bienvenido a TUTO-CAFD. Al usar nuestra plataforma,
        aceptas los siguientes términos:
      </p>

      <h4 className="font-semibold text-foreground pt-2">
        1. Uso de la Plataforma
      </h4>
      <p>
        TUTO-CAFD es una plataforma para conectar estudiantes y
        tutores de la Universidad de La Guajira. No somos parte
        de ninguna transacción o acuerdo entre usuarios.
      </p>

      <h4 className="font-semibold text-foreground pt-2">
        2. Cuentas y Responsabilidades
      </h4>
      <p>
        <strong>Estudiantes:</strong> Son responsables de
        seleccionar a sus tutores y gestionar sus solicitudes.
        Las reseñas deben ser verídicas y respetuosas.
      </p>
      <p>
        <strong>Tutores:</strong> Deben ser aprobados por la
        administración. Son responsables de la veracidad de su
        información (biografía, materias) y de gestionar sus
        solicitudes y disponibilidad.
      </p>

      <h4 className="font-semibold text-foreground pt-2">
        3. Moderación y Contenido
      </h4>
      <p>
        Nos reservamos el derecho de moderar, aprobar o rechazar
        postulaciones de tutores y reseñas de estudiantes para
        mantener la calidad y seguridad de la plataforma.
      </p>

      <h4 className="font-semibold text-foreground pt-2">
        4. Limitación de Responsabilidad
      </h4>
      <p>
        TUTO-CAFD no garantiza la aprobación de materias ni el
        rendimiento académico. La plataforma es una herramienta
        de conexión. No nos hacemos responsables por disputas,
        cancelaciones o cualquier inconveniente entre estudiante
        y tutor.
      </p>

      <h4 className="font-semibold text-foreground pt-2">
        5. Modificaciones
      </h4>
      <p>
        Podemos actualizar estos Términos y Condiciones en
        cualquier momento.
      </p>
    </div>
  );
}

function PrivacyContent() {
  return (
    <div className="space-y-4 text-muted-foreground text-sm">
      <p className="text-xs">
        Última actualización: 13 de noviembre de 2025
      </p>
      <p>
        Tu privacidad es importante para nosotros. Esta política
        explica cómo recolectamos y usamos tu información.
      </p>

      <h4 className="font-semibold text-foreground pt-2">
        1. Información Recolectada
      </h4>
      <p>
        Recolectamos la información que nos proporcionas durante
        el registro:
      </p>
      <ul className="list-disc pl-6">
        <li>
          <strong>Todos los usuarios:</strong> Nombre, correo
          electrónico.
        </li>
        <li>
          <strong>Estudiantes:</strong> Carrera.
        </li>
        <li>
          <strong>Tutores:</strong> Biografía, materias que
          enseña.
        </li>
        <li>
          <strong>Opcional:</strong> Número de WhatsApp.
        </li>
      </ul>

      <h4 className="font-semibold text-foreground pt-2">
        2. Uso de la Información
      </h4>
      <p>Usamos tu información para:</p>
      <ul className="list-disc pl-6">
        <li>Operar y mantener la plataforma.</li>
        <li>Conectar estudiantes con tutores.</li>
        <li>Gestionar solicitudes, reseñas y postulaciones.</li>
        <li>
          Enviar notificaciones sobre el estado de tus tutorías.
        </li>
      </ul>

      <h4 className="font-semibold text-foreground pt-2">
        3. Cómo se Comparte tu Información
      </h4>
      <p>
        Cierta información es pública para facilitar la
        conexión:
      </p>
      <ul className="list-disc pl-6">
        <li>
          <strong>Perfiles de Tutor:</strong> Tu nombre,
          biografía, materias y reseñas son visibles para los
          estudiantes.
        </li>
        <li>
          <strong>Estudiantes:</strong> Tu nombre es visible
          para el tutor cuando envías una solicitud.
        </li>
      </ul>
      <p>
        No compartiremos tu correo electrónico personal o número
        de WhatsApp con otros usuarios sin tu consentimiento.
      </p>

      <h4 className="font-semibold text-foreground pt-2">
        4. Seguridad
      </h4>
      <p>
        Implementamos medidas de seguridad para proteger tus
        datos, aunque ninguna plataforma es 100% segura.
      </p>
    </div>
  );
}

// ----------------------------------------------------

function AppContent() {
  const { user, loading: authLoading, accessToken } = useAuth();
  const [currentView, setCurrentView] = useState("dashboard");
  const [viewData, setViewData] = useState<any>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [modalContent, setModalContent] = useState<
    string | null
  >(null);

  // Initialize view from URL on mount
  useEffect(() => {
    if (user && !authLoading) {
      const path = window.location.pathname;
      const viewFromPath = path !== '/' && path !== '' 
        ? path.substring(1).split('/')[0] 
        : 'dashboard';
      
      const params = new URLSearchParams(window.location.search);
      const data: any = {};
      
      // Parse URL parameters
      if (params.has('tutorId')) {
        data.tutorId = params.get('tutorId');
      }
      if (params.has('userId')) {
        data.userId = params.get('userId');
      }
      if (params.has('userRole')) {
        data.userRole = params.get('userRole');
      }
      if (params.has('query')) {
        data.query = params.get('query');
      }
      
      setCurrentView(viewFromPath);
      if (Object.keys(data).length > 0) {
        setViewData(data);
      }
      
      // Initialize browser history state if not already set
      if (!window.history.state || !window.history.state.view) {
        window.history.replaceState(
          { view: viewFromPath, data: Object.keys(data).length > 0 ? data : null },
          '',
          window.location.pathname + window.location.search
        );
      }
    }
  }, [user, authLoading]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      if (state && state.view) {
        setCurrentView(state.view);
        setViewData(state.data || null);
        window.scrollTo(0, 0);
      } else {
        // If no state, parse from URL
        const path = window.location.pathname;
        const viewFromPath = path !== '/' && path !== '' 
          ? path.substring(1).split('/')[0] 
          : 'dashboard';
        
        const params = new URLSearchParams(window.location.search);
        const data: any = {};
        
        if (params.has('tutorId')) data.tutorId = params.get('tutorId');
        if (params.has('userId')) data.userId = params.get('userId');
        if (params.has('userRole')) data.userRole = params.get('userRole');
        if (params.has('query')) data.query = params.get('query');
        
        setCurrentView(viewFromPath);
        setViewData(Object.keys(data).length > 0 ? data : null);
        window.scrollTo(0, 0);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (user && accessToken) {
      loadNotificationCount();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(
        loadNotificationCount,
        30000,
      );
      return () => clearInterval(interval);
    }
  }, [user, accessToken]);

  const loadNotificationCount = async () => {
    try {
      const data = await apiRequest(
        "/notifications",
        {},
        accessToken,
      );
      const unread = data.notifications.filter(
        (n: any) => !n.read,
      ).length;
      setNotificationCount(unread);
    } catch (error) {
      console.error("Error loading notification count:", error);
    }
  };

  const navigate = (view: string, data?: any) => {
    setCurrentView(view);
    setViewData(data);
    window.scrollTo(0, 0);

    // Update URL and browser history
    const params = new URLSearchParams();
    if (data) {
      if (data.tutorId) params.set('tutorId', data.tutorId);
      if (data.userId) params.set('userId', data.userId);
      if (data.userRole) params.set('userRole', data.userRole);
      if (data.query) params.set('query', data.query);
    }

    const queryString = params.toString();
    const newPath = `/${view}${queryString ? `?${queryString}` : ''}`;
    
    // Update browser history
    window.history.pushState(
      { view, data },
      '',
      newPath
    );
  };

  // Show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  // Show landing page if not authenticated
  if (!user) {
    return (
      <>
        <LandingPage onLinkClick={setModalContent} />
        <InfoModal
          modalContent={modalContent}
          setModalContent={setModalContent}
        />
      </>
    );
  }

  // Check if tutor is not approved yet
  if (
    user.role === "tutor" &&
    !user.approved
  ) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar
          onNavigate={navigate}
          currentView={currentView}
          notificationCount={notificationCount}
        />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8">
            <h2 className="mb-4">
              Solicitud Pendiente de Aprobación
            </h2>
            <p className="text-muted-foreground mb-6">
              Tu solicitud para ser tutor está siendo revisada
              por un administrador. Te notificaremos cuando sea
              aprobada.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render appropriate view based on role and current view
  const renderView = () => {
    // Student views
    if (user.role === "student") {
      switch (currentView) {
        case "dashboard":
          return <StudentDashboard onNavigate={navigate} />;
        case "search":
          return (
            <TutorSearch
              onNavigate={navigate}
              initialQuery={viewData?.query}
            />
          );
        case "tutor-profile":
          return (
            <TutorProfile
              tutorId={viewData?.tutorId}
              onNavigate={navigate}
            />
          );
        case "my-requests":
          return <MyRequests onNavigate={navigate} />;
        case "profile":
          return <Profile />;
        case "notifications":
          return <Notifications />;
        default:
          return <StudentDashboard onNavigate={navigate} />;
      }
    }

    // Tutor views
    if (user.role === "tutor") {
      switch (currentView) {
        case "dashboard":
        case "requests-inbox":
          return <TutorInbox />;
        case "my-tutorias":
          return <MyRequests onNavigate={navigate} />;
        case "availability":
          return <AvailabilityManagement />;
        case "profile":
          return <Profile />;
        case "notifications":
          return <Notifications />;
        default:
          return <TutorInbox />;
      }
    }

    // Admin views
    if (user.role === "admin") {
      switch (currentView) {
        case "dashboard":
          return <AdminDashboard onNavigate={navigate} />;
        case "admin-tutors":
          return <AdminTutorApplications />;
        case "admin-reviews":
          return <AdminReviews />;
        case "admin-users":
          return <AdminUsers onNavigate={navigate} />;
        case "admin-user-detail":
          return (
            <AdminUserDetail
              userId={viewData?.userId}
              userRole={viewData?.userRole}
              onNavigate={navigate}
            />
          );
        case "profile":
          return <Profile />;
        case "notifications":
          return <Notifications />;
        default:
          return <AdminDashboard onNavigate={navigate} />;
      }
    }

    return <StudentDashboard onNavigate={navigate} />;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        onNavigate={navigate}
        currentView={currentView}
        notificationCount={notificationCount}
      />
      <main>{renderView()}</main>
      <Footer onLinkClick={setModalContent} />
      <InfoModal
        modalContent={modalContent}
        setModalContent={setModalContent}
      />
    </div>
  );
}

// Footer component
function Footer({
  onLinkClick,
}: {
  onLinkClick: (content: string) => void;
}) {
  return (
    <footer className="bg-muted/50 py-8 px-4 mt-20">
      <div className="max-w-7xl mx-auto text-center text-muted-foreground">
        <div className="flex justify-center gap-6 mb-4 text-sm">
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
        <p className="text-sm">
          &copy; 2025 TUTO-CAFD. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}

// Modal Component
function InfoModal({
  modalContent,
  setModalContent,
}: {
  modalContent: string | null;
  setModalContent: (content: string | null) => void;
}) {
  const getTitle = () => {
    switch (modalContent) {
      case "about":
        return "Sobre Nosotros";
      case "terms":
        return "Términos y Condiciones";
      case "privacy":
        return "Política de Privacidad";
      case "contact":
        return "Contacto";
      default:
        return "";
    }
  };

  return (
    <Dialog
      open={!!modalContent}
      onOpenChange={(open) => !open && setModalContent(null)}
    >
      <DialogContent
        className="sm:max-w-3xl !flex !flex-col !p-0 !gap-0"
        style={{
          maxHeight: "90vh",
          height: "auto",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          width: "calc(100vw - 2rem)",
        }}
      >
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b">
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>
        <div
          className="flex-1 overflow-y-auto px-6 pb-6"
          style={{
            minHeight: 0,
            maxHeight: "calc(90vh - 100px)",
          }}
        >
          {modalContent === "about" && <AboutContent />}
          {modalContent === "terms" && <TermsContent />}
          {modalContent === "privacy" && <PrivacyContent />}
          {modalContent === "contact" && (
            <p>
              Puedes contactarnos en{" "}
              <a
                href="mailto:contacto@tuto-cafd.com"
                className="text-primary underline"
              >
                contacto@tuto-cafd.com
              </a>
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Main App wrapper with AuthProvider
export default function App() {
  return (
    <AuthProvider
      children={
        <>
          <AppContent />
          <Toaster />
        </>
      }
    />
  );
}