// App Principal - Sistema de Control de Vehículos

import { useState, useEffect, useCallback } from 'react';
import { LogOut, User, Wifi, WifiOff, Clock } from 'lucide-react';
import { useVehicleStore } from './store';
import { LoginPage } from './pages/LoginPage';
import { EntryPage } from './pages/EntryPage';
import { ExitPage } from './pages/ExitPage';
import { HistoryPage } from './pages/HistoryPage';
import { DashboardPage } from './pages/DashboardPage';
import { NavigationTabs, type TabId } from './components/NavigationTabs';
import { authApi } from './services/authApi';
import { dashboardApi } from './services/dashboardApi';

function HeaderClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hidden sm:flex items-center gap-2 text-slate-300">
      <Clock className="w-4 h-4 text-blue-400" />
      <span className="font-mono text-sm font-semibold">
        {time.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })}
      </span>
    </div>
  );
}

function App() {
  const { user, token, setAuth, logout, resetRegistration } = useVehicleStore();
  const [activeTab, setActiveTab] = useState<TabId>('entry');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pendingExitsCount, setPendingExitsCount] = useState(0);
  const [verifyingSession, setVerifyingSession] = useState(true);

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
      } catch (err) {
        console.error('Error al verificar sesión:', err);
        // Si hay error de red no cerramos sesión de inmediato para permitir modo offline,
        // pero si es error de autenticación (401), se maneja por el cliente de API
        if (navigator.onLine) {
          handleLogout();
        } else {
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
        allowedTabs.push('entry', 'exit');
      } else if (user.role === 'support') {
        allowedTabs.push('dashboard', 'history');
      } else { // admin
        allowedTabs.push('entry', 'exit', 'dashboard', 'history');
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
    if (currentUser?.role === 'support') {
      setActiveTab('dashboard');
    } else {
      setActiveTab('entry');
    }
    
    fetchPendingExits();
  };

  // Manejar logout
  const handleLogout = () => {
    logout();
    setIsAuthenticated(false);
    setPendingExitsCount(0);
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
      case 'entry':
        return <EntryPage />;
      case 'exit':
        return <ExitPage />;
      case 'history':
        return <HistoryPage />;
      case 'dashboard':
        return <DashboardPage />;
      default:
        return <EntryPage />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center border border-blue-500/20 shadow-lg shadow-blue-500/10">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-none tracking-wide">SICISV</h1>
              <p className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold mt-0.5">Control Vehicular</p>
            </div>
          </div>

          {/* Info derecha */}
          <div className="flex items-center gap-4">
            {/* Reloj */}
            <HeaderClock />

            {/* Estado de conexión */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                isOnline
                  ? 'bg-green-500/15 text-green-400 border border-green-500/20'
                  : 'bg-red-500/15 text-red-400 border border-red-500/20'
              }`}
            >
              {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isOnline ? 'En línea' : 'Sin conexión'}</span>
            </div>

            {/* Usuario */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-700">
              <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-slate-300 font-bold border border-slate-600/50">
                {user?.fullName ? user.fullName.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs text-white font-bold leading-tight">{user?.fullName}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mt-0.5">{user?.role}</p>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/80 rounded-lg transition-colors border border-transparent hover:border-slate-600"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <NavigationTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        pendingExits={pendingExitsCount}
        role={user?.role as any}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-slate-900/95">
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 border-t border-slate-700 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>© 2026 SICISV v1.0</span>
          <span>Terminal: {navigator.userAgent.includes('Mobile') ? 'Móvil' : 'Escritorio'}</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
