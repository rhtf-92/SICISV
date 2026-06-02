// Componente Sidebar - Menú de Navegación Lateral Premium, Colapsable y Responsivo
// Diseñado con estándares de alta fidelidad, micro-animaciones y usabilidad óptima.

import { useState, useEffect } from 'react';
import { 
  LogIn, LogOut, History, LayoutDashboard, Menu, X, 
  ChevronLeft, ChevronRight, Wifi, WifiOff, Clock, User, Home 
} from 'lucide-react';

export type TabId = 'home' | 'entry' | 'exit' | 'history' | 'dashboard';

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  pendingExits?: number;
  role?: 'admin' | 'support' | 'guard';
  user: any;
  isCollapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  onLogout: () => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

interface SidebarTab {
  id: TabId;
  label: string;
  icon: typeof LogIn;
  badge?: number;
}

export function Sidebar({
  activeTab,
  onTabChange,
  pendingExits = 0,
  role = 'guard',
  user,
  isCollapsed,
  setCollapsed,
  onLogout,
  isMobileOpen,
  onMobileClose,
}: SidebarProps) {
  const [time, setTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Reloj de alta precisión
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Detector de conectividad
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

  const allTabs: SidebarTab[] = [
    { id: 'home', label: 'Inicio', icon: Home },
    { id: 'entry', label: 'Registro de Ingreso', icon: LogIn },
    { id: 'exit', label: 'Registro de Salida', icon: LogOut, badge: pendingExits > 0 ? pendingExits : undefined },
    { id: 'history', label: 'Historial de Registros', icon: History },
    { id: 'dashboard', label: 'Dashboard de Control', icon: LayoutDashboard },
  ];

  // Filtrar pestañas según el rol operativo
  const tabs = allTabs.filter(tab => {
    if (role === 'guard') {
      return tab.id === 'home' || tab.id === 'entry' || tab.id === 'exit';
    }
    if (role === 'support') {
      return tab.id === 'history' || tab.id === 'dashboard';
    }
    return true; // admin ve todo
  });

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-slate-900 border-r border-slate-800 text-slate-300">
      
      {/* SECCIÓN SUPERIOR: Logo y Marca */}
      <div>
        <div className={`p-4 border-b border-slate-800/80 flex items-center justify-between h-16`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center border border-blue-500/20 shadow-lg shadow-blue-500/10 flex-shrink-0 animate-pulse-subtle">
              <span className="text-white font-black text-lg">S</span>
            </div>
            {!isCollapsed && (
              <div className="animate-fade-in whitespace-nowrap">
                <h1 className="text-white font-extrabold text-base leading-none tracking-wide">SICISV</h1>
                <p className="text-slate-500 text-[9px] uppercase tracking-wider font-semibold mt-0.5">Control Vehicular</p>
              </div>
            )}
          </div>

          {/* Botón de cierre en Móviles */}
          <button 
            onClick={onMobileClose}
            className="lg:hidden p-1.5 hover:bg-slate-850 hover:text-white rounded-lg transition-colors border border-transparent hover:border-slate-800"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* SECCIÓN MEDIA: Navegación de Pestañas */}
        <nav className="p-3 space-y-1.5 mt-4">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  onTabChange(tab.id);
                  onMobileClose(); // auto-cerrar en móviles tras cambiar pestaña
                }}
                className={`
                  relative w-full flex items-center rounded-xl transition-all duration-200 group
                  ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'}
                  ${isActive
                    ? 'text-blue-400 bg-blue-500/10 font-semibold border-l-4 border-blue-500'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850 hover:border-l-4 hover:border-slate-700'
                  }
                `}
                title={isCollapsed ? tab.label : undefined}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-105 ${isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-300'}`} />
                
                {!isCollapsed && (
                  <span className="text-sm font-medium animate-fade-in truncate">{tab.label}</span>
                )}

                {/* Globo de Alerta / Salidas pendientes */}
                {tab.badge !== undefined && (
                  <span
                    className={`
                      absolute flex items-center justify-center text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1 border border-slate-900 shadow-md
                      ${isCollapsed ? '-top-1 -right-1 bg-amber-500 text-white' : 'right-4 bg-amber-500 text-white animate-pulse'}
                    `}
                  >
                    {tab.badge}
                  </span>
                )}

                {/* Tooltip moderno flotante al colapsar */}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-950 text-white text-xs font-semibold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-xl border border-slate-800">
                    {tab.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* SECCIÓN INFERIOR: Reloj, WiFi, Perfil de Usuario y Logout */}
      <div className="border-t border-slate-800/80 bg-slate-950/40">
        
        {/* Reloj y Estado Conectividad (Solo si no está colapsado) */}
        {!isCollapsed && (
          <div className="p-4 space-y-3 border-b border-slate-800/40 text-xs text-slate-500 animate-fade-in">
            {/* Reloj */}
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500/80" />
              <span className="font-mono font-medium tracking-wider text-slate-400">
                {time.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            {/* Estado WiFi */}
            <div className="flex items-center gap-2">
              {isOnline ? (
                <>
                  <Wifi className="w-4 h-4 text-green-500/80 animate-pulse" />
                  <span className="font-semibold text-green-400">Sistema en línea</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-red-500/80" />
                  <span className="font-semibold text-red-400">Trabajando sin conexión</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* WiFi e Icono Reloj en estado colapsado (Tooltip) */}
        {isCollapsed && (
          <div className="p-3 border-b border-slate-800/40 flex flex-col items-center gap-4 text-slate-400">
            <div className="relative group cursor-pointer">
              <Clock className="w-4 h-4 text-blue-500" />
              <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-950 text-white text-xs font-semibold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-xl border border-slate-800">
                {time.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <div className="relative group cursor-pointer">
              {isOnline ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500 animate-bounce" />
              )}
              <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-950 text-white text-xs font-semibold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-xl border border-slate-800">
                {isOnline ? 'Conexión Estable' : 'Modo Offline Activo'}
              </div>
            </div>
          </div>
        )}

        {/* Perfil del Usuario */}
        <div className="p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 overflow-hidden">
            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-200 font-bold border border-slate-700/80 flex-shrink-0 shadow-md">
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
            </div>
            
            {/* Datos detallados (ocultos si colapsado) */}
            {!isCollapsed && (
              <div className="text-left overflow-hidden animate-fade-in">
                <p className="text-xs text-white font-bold leading-tight truncate" title={user?.fullName}>
                  {user?.fullName}
                </p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mt-0.5 truncate">
                  {role === 'admin' ? 'Administrador' : role === 'support' ? 'Soporte' : 'Vigilante'}
                </p>
              </div>
            )}
          </div>

          {/* Botón Salida */}
          {!isCollapsed && (
            <button
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-750"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}

          {/* Tooltip de logout e info en estado colapsado */}
          {isCollapsed && (
            <div className="relative group">
              <button
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent"
              >
                <LogOut className="w-4 h-4" />
              </button>
              <div className="absolute left-full ml-3 px-3 py-2 bg-slate-950 text-white text-xs font-semibold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-xl border border-slate-800">
                <p className="font-bold text-white">{user?.fullName}</p>
                <p className="text-[9px] text-slate-400 mt-0.5">Cerrar Sesión</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. SIDEBAR DE ESCRITORIO (Para viewports grandes >= 1024px) */}
      <aside 
        className={`
          hidden lg:flex flex-col fixed top-0 bottom-0 left-0 z-40 transition-all duration-300 shadow-2xl h-screen
          ${isCollapsed ? 'w-20' : 'w-64'}
        `}
      >
        {sidebarContent}

        {/* Botón flotante para contraer/expandir el sidebar */}
        <button
          onClick={() => setCollapsed(!isCollapsed)}
          className="absolute -right-3.5 top-8 w-7 h-7 bg-blue-600 hover:bg-blue-500 rounded-full border border-blue-500/30 flex items-center justify-center text-white cursor-pointer shadow-lg hover:scale-105 active:scale-95 transition-all z-50"
          title={isCollapsed ? "Expandir Menú" : "Colapsar Menú"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>

      {/* 2. SIDEBAR DE MÓVIL (Con animación de cajón - Drawer overlay) */}
      <div 
        className={`
          lg:hidden fixed inset-0 z-50 transition-all duration-300
          ${isMobileOpen ? 'visible pointer-events-auto' : 'invisible pointer-events-none'}
        `}
      >
        {/* Fondo oscuro semi-transparente difuminado */}
        <div 
          onClick={onMobileClose}
          className={`
            absolute inset-0 bg-slate-955/80 backdrop-blur-sm transition-opacity duration-300
            ${isMobileOpen ? 'opacity-100' : 'opacity-0'}
          `}
        />

        {/* Contenido del Sidebar deslizante desde la izquierda */}
        <div 
          className={`
            absolute top-0 bottom-0 left-0 w-72 max-w-[85vw] h-full shadow-2xl transition-transform duration-300 ease-out transform
            ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          {sidebarContent}
        </div>
      </div>
    </>
  );
}
