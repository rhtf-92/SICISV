// App Principal - Sistema de Control de Vehículos

import { useState, useEffect } from 'react';
import { LogOut, User, Wifi, WifiOff, Clock } from 'lucide-react';
import { useVehicleStore } from './store';
import { LoginPage } from './pages/LoginPage';
import { EntryPage } from './pages/EntryPage';
import { ExitPage } from './pages/ExitPage';
import { HistoryPage } from './pages/HistoryPage';
import { DashboardPage } from './pages/DashboardPage';
import { NavigationTabs, type TabId } from './components/NavigationTabs';

function App() {
  const { user, token, logout, currentTime, resetRegistration } = useVehicleStore();
  const [activeTab, setActiveTab] = useState<TabId>('entry');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verificar estado de autenticación al cargar
  useEffect(() => {
    if (user && token) {
      setIsAuthenticated(true);
    }
  }, [user, token]);

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

  // Resetear formulario al cambiar de tab
  useEffect(() => {
    if (activeTab !== 'entry') {
      // No resetear si estamos en medio de un registro
    }
  }, [activeTab]);

  // Manejar login
  const handleLogin = () => {
    setIsAuthenticated(true);
    resetRegistration();
    setActiveTab('entry');
  };

  // Manejar logout
  const handleLogout = () => {
    logout();
    setIsAuthenticated(false);
  };

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
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-none">SICISV</h1>
              <p className="text-slate-400 text-xs">Control Vehicular</p>
            </div>
          </div>

          {/* Info derecha */}
          <div className="flex items-center gap-4">
            {/* Reloj */}
            <div className="hidden sm:flex items-center gap-2 text-slate-300">
              <Clock className="w-5 h-5" />
              <span className="font-mono">
                {currentTime.toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
            </div>

            {/* Estado de conexión */}
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                isOnline
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}
            >
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              <span className="hidden sm:inline">{isOnline ? 'En línea' : 'Sin conexión'}</span>
            </div>

            {/* Usuario */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-slate-400" />
              </div>
              <div className="hidden md:block">
                <p className="text-sm text-white font-medium">{user?.fullName}</p>
                <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <NavigationTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        pendingExits={3} // Esto vendría del store en producción
      />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 border-t border-slate-700 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-slate-500">
          <span>© 2024 SICISV v1.0</span>
          <span>Terminal: {navigator.userAgent.includes('Mobile') ? 'Móvil' : 'Escritorio'}</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
