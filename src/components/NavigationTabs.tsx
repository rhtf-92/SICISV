// Componente NavigationTabs - Tabs de Navegación Principal

import { LogIn, LogOut, History, LayoutDashboard } from 'lucide-react';

export type TabId = 'entry' | 'exit' | 'history' | 'dashboard';

interface Tab {
  id: TabId;
  label: string;
  icon: typeof LogIn;
  badge?: number;
}

interface NavigationTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  pendingExits?: number;
}

export function NavigationTabs({ activeTab, onTabChange, pendingExits = 0 }: NavigationTabsProps) {
  const tabs: Tab[] = [
    { id: 'entry', label: 'Registro de Ingreso', icon: LogIn },
    { id: 'exit', label: 'Registro de Salida', icon: LogOut, badge: pendingExits > 0 ? pendingExits : undefined },
    { id: 'history', label: 'Historial', icon: History },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ];

  return (
    <nav className="w-full border-b border-slate-700 bg-slate-800/50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  relative flex items-center gap-2 px-4 py-4 font-medium
                  transition-all duration-200 whitespace-nowrap
                  ${isActive
                    ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-400/5'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>

                {/* Badge */}
                {tab.badge !== undefined && (
                  <span
                    className={`
                      absolute -top-1 -right-1 min-w-[20px] h-5
                      flex items-center justify-center
                      text-xs font-bold rounded-full
                      ${isActive
                        ? 'bg-amber-500 text-white'
                        : 'bg-amber-500 text-white'
                      }
                    `}
                  >
                    {tab.badge}
                  </span>
                )}

                {/* Indicador de tab activo */}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
