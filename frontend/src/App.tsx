// App Principal - Sistema de Control de Vehículos

import { useState, useEffect, useCallback } from 'react';
import { User, Menu } from 'lucide-react';
import { useVehicleStore } from './store';
import { LoginPage } from './pages/LoginPage';
import { EntryPage } from './pages/EntryPage';
import { ExitPage } from './pages/ExitPage';
import { HistoryPage } from './pages/HistoryPage';
import { DashboardPage } from './pages/DashboardPage';
import { GuardHomePage } from './pages/GuardHomePage';
import { Sidebar, type TabId } from './components/Sidebar';
import { authApi } from './services/authApi';
import { dashboardApi } from './services/dashboardApi';

function App() {
  const { user, token, setAuth, logout, resetRegistration } = useVehicleStore();
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const saved = localStorage.getItem('sicisv_active_tab');
    return (saved as TabId) || 'home';
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!useVehicleStore.getState().token && !!useVehicleStore.getState().user;
  });
  const [pendingExitsCount, setPendingExitsCount] = useState(0);
  const [verifyingSession, setVerifyingSession] = useState(() => {
    return !(useVehicleStore.getState().token && useVehicleStore.getState().user);
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Sincronizar la pestaña activa en localStorage para evitar reinicios por rotación
  useEffect(() => {
    localStorage.setItem('sicisv_active_tab', activeTab);
  }, [activeTab]);

  // Verificar la sesión real con el backend si hay un token guardado
  const verifySession = useCallback(async () => {
    if (token) {
      try {
        const res = await authApi.getMe();
        if (res.success && res.data) {
          // Sesión válida, actualiza el usuario en la store
          setAuth(res.data as any, token);
          setIsAuthenticated(true);
          // Cargar estadísticas iniciales como número de salidas pendientes
          fetchPendingExits();
        } else {
          // Token inválido o expirado
          handleLogout();
        }
      } catch (err: any) {
        console.error('Error al verificar sesión:', err);
        // Solo cerramos sesión si es un error de autenticación explícito (401)
        if (err?.status === 401) {
          handleLogout();
        } else {
          // Si es un error de red local o temporal, mantenemos al vigilante conectado (soporte offline)
          setIsAuthenticated(true);
        }
      } finally {
        setVerifyingSession(false);
      }
    } else {
      setIsAuthenticated(false);
      setVerifyingSession(false);
    }
  }, [token, setAuth]);

  // Obtener conteo de salidas pendientes desde la API
  const fetchPendingExits = async () => {
    try {
      const statsRes = await dashboardApi.getStats();
      if (statsRes.success && statsRes.data) {
        setPendingExitsCount(statsRes.data.pendingExits);
      }
    } catch (err) {
      console.error('Error al obtener pendientes de salida:', err);
    }
  };

  // Verificar estado de autenticación al cargar
  useEffect(() => {
    verifySession();
  }, [token]);

  // Monitorear estado de conexión
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Poll de salidas pendientes cada 30 segundos si está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      fetchPendingExits();
      const interval = setInterval(fetchPendingExits, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, activeTab]); // También se dispara al cambiar de tab

  // Resetear formulario al cambiar de tab
  useEffect(() => {
    if (activeTab !== 'entry') {
      // No resetear si estamos en medio de un registro
    }
  }, [activeTab]);

  // Efecto para redirigir y asegurar protección de rutas (guardias) en el frontend
  useEffect(() => {
    if (isAuthenticated && user) {
      const allowedTabs: TabId[] = [];
      if (user.role === 'guard') {
        allowedTabs.push('home', 'entry', 'exit');
      } else if (user.role === 'support') {
        allowedTabs.push('dashboard', 'history');
      } else { // admin
        allowedTabs.push('home', 'entry', 'exit', 'dashboard', 'history');
      }

      if (!allowedTabs.includes(activeTab)) {
        // Redirige al primer tab permitido para el rol
        setActiveTab(allowedTabs[0]);
      }
    }
  }, [isAuthenticated, user, activeTab]);

  // Manejar login exitoso
  const handleLogin = () => {
    setIsAuthenticated(true);
    resetRegistration();
    
    // Determinar tab inicial según el rol al iniciar sesión
    const currentUser = useVehicleStore.getState().user;
    const initialTab = currentUser?.role === 'support' ? 'dashboard' : 'home';
    setActiveTab(initialTab);
    localStorage.setItem('sicisv_active_tab', initialTab);
    
    fetchPendingExits();
  };

  // Manejar logout
  const handleLogout = () => {
    logout();
    setIsAuthenticated(false);
    setPendingExitsCount(0);
    localStorage.removeItem('sicisv_active_tab');
    setActiveTab('home');
  };

  // Pantalla de carga mientras se verifica la sesión inicial
  if (verifyingSession && token) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 text-sm">Verificando sesión segura...</p>
      </div>
    );
  }

  // Página de login
  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Renderizar contenido según tab activa
  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <GuardHomePage onNavigate={setActiveTab} user={user} />;
      case 'entry':
        return <EntryPage onComplete={() => setActiveTab('home')} />;
      case 'exit':
        return <ExitPage onComplete={() => setActiveTab('home')} />;
      case 'history':
        return <HistoryPage />;
      case 'dashboard':
        return <DashboardPage />;
      default:
        return <GuardHomePage onNavigate={setActiveTab} user={user} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row text-slate-100">
      {/* Sidebar de Navegación Lateral Unificado */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        pendingExits={pendingExitsCount}
        role={user?.role as any}
        user={user}
        isCollapsed={isSidebarCollapsed}
        setCollapsed={setIsSidebarCollapsed}
        onLogout={handleLogout}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Cabecera Móvil (Solo visible en dispositivos móviles/tabletas < 1024px) */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between z-30 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-2 -ml-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-850 transition-colors border border-transparent active:scale-95"
            title="Abrir Menú"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center border border-blue-500/20 shadow-md">
              <span className="text-white font-bold text-base">S</span>
            </div>
            <h1 className="text-white font-bold text-base leading-none tracking-wide">SICISV</h1>
          </div>
        </div>

        {/* Indicador rápido de perfil en móvil */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-200 text-xs font-bold border border-slate-700 shadow-sm">
            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
          </div>
        </div>
      </header>

      {/* Área del Contenido Principal (con márgenes adaptativos al Sidebar de escritorio y cabecera móvil) */}
      <div 
        className={`
          flex-1 flex flex-col min-h-screen transition-all duration-300 bg-slate-900/95
          ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}
          pt-16 lg:pt-0
        `}
      >
        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-slate-900/95">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;
