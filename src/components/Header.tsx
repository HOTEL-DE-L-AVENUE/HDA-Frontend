import React from 'react';
import { useHDA } from '../context/HDAContext';
import { Bell, Search, Menu, X, ChevronRight } from 'lucide-react';

const moduleLabels: Record<string, string> = {
  dashboard: 'Tableau de Bord',
  hebergement: 'Hébergement',
  hotel: 'Hôtel',
  restaurant: 'Restaurant',
  bar: 'Bar & Lounge',
  casino: 'Casino',
  finances: 'Finances',
  utilisateurs: 'Utilisateurs',
};

export const Header: React.FC = () => {
  const { state, dispatch } = useHDA();
  const { activeModule, notifications, sidebarCollapsed } = state;
  const [showNotifs, setShowNotifs] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  const notifTypeColors: Record<string, string> = {
    warning: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
    error: 'bg-red-500/20 border-red-500/40 text-red-300',
    success: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
    info: 'bg-blue-500/20 border-blue-500/40 text-blue-300',
  };

  const notifDotColors: Record<string, string> = {
    warning: 'bg-amber-400',
    error: 'bg-red-400',
    success: 'bg-emerald-400',
    info: 'bg-blue-400',
  };

  return (
    <header className="h-20 flex items-center px-6 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 flex-1">
        <button
          onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all mr-2 md:hidden"
        >
          <Menu size={18} />
        </button>
        <span className="text-slate-600 text-sm">HDA</span>
        <ChevronRight size={14} className="text-slate-700" />
        <span className="text-white font-semibold text-sm">{moduleLabels[activeModule]}</span>
      </div>

      {/* Search */}
      <div className="hidden md:flex items-center gap-3 flex-1 max-w-md mx-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-slate-800/60 border border-slate-700/50 rounded-xl text-slate-300 placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500/50 focus:bg-slate-800 transition-all"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Date */}
        <div className="hidden lg:block text-right">
          <p className="text-white text-sm font-medium">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <p className="text-slate-500 text-xs">
            {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all relative"
          >
            <Bell size={18} />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-slate-950" />
            )}
          </button>

          {/* Dropdown */}
          {showNotifs && (
            <div className="absolute right-0 top-12 w-80 bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                <h3 className="text-white font-semibold text-sm">Alertes</h3>
                <span className="text-xs text-slate-500">{notifications.length} non lues</span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-sm">Aucune alerte</div>
                ) : (
                  notifications.map(notif => (
                    <div key={notif.id} className={`flex items-start gap-3 px-4 py-3 border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors`}>
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${notifDotColors[notif.type]}`} />
                      <div className="flex-1">
                        <p className={`text-xs font-medium ${notifTypeColors[notif.type].split(' ')[2]}`}>{notif.message}</p>
                        <p className="text-slate-600 text-xs mt-0.5">
                          {new Date(notif.timestamp).toLocaleTimeString('fr-FR')}
                        </p>
                      </div>
                      <button
                        onClick={() => dispatch({ type: 'CLEAR_NOTIFICATION', payload: notif.id })}
                        className="text-slate-600 hover:text-slate-400 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity">
          <span className="text-white font-bold text-sm">
            {state.currentUser.prenom[0]}{state.currentUser.nom[0]}
          </span>
        </div>
      </div>
    </header>
  );
};
