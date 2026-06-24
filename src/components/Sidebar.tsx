import React, { useState, useEffect } from 'react';
import { useHDA } from '../context/HDAContext';
import { ModuleType } from '../types';
import {
  LayoutDashboard,
  BedDouble,
  Hotel,
  UtensilsCrossed,
  Wine,
  Dices,
  DollarSign,
  Users,
  ChevronLeft,
  ChevronRight,
  Bell,
  LogOut,
  Settings,
  TrendingUp,
  X,
  Menu
} from 'lucide-react';

interface NavItem {
  id: ModuleType;
  label: string;
  icon: React.ReactNode;
  gradient: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Tableau de Bord', icon: <LayoutDashboard size={20} />, gradient: 'from-violet-500 to-purple-600' },
  { id: 'hebergement', label: 'Hébergement', icon: <BedDouble size={20} />, gradient: 'from-blue-500 to-cyan-600' },
  { id: 'hotel', label: 'Hôtel', icon: <Hotel size={20} />, gradient: 'from-indigo-500 to-blue-600' },
  { id: 'restaurant', label: 'Restaurant', icon: <UtensilsCrossed size={20} />, gradient: 'from-orange-500 to-amber-600' },
  { id: 'bar', label: 'Bar & Lounge', icon: <Wine size={20} />, gradient: 'from-rose-500 to-pink-600' },
  { id: 'casino', label: 'Casino', icon: <Dices size={20} />, gradient: 'from-emerald-500 to-green-600' },
  { id: 'finances', label: 'Finances', icon: <DollarSign size={20} />, gradient: 'from-yellow-500 to-orange-500' },
  { id: 'clients', label: 'Gestion Clients', icon: <Users size={20} />, gradient: 'from-blue-500 to-purple-600' },
  { id: 'utilisateurs', label: 'Utilisateurs', icon: <Users size={20} />, gradient: 'from-slate-500 to-gray-600' },
];

export const Sidebar: React.FC = () => {
  const { state, dispatch } = useHDA();
  const { activeModule, sidebarCollapsed, notifications } = state;
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Détection mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMobileOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const setModule = (module: ModuleType) => {
    dispatch({ type: 'SET_MODULE', payload: module });
    if (isMobile) {
      setIsMobileOpen(false);
    }
  };

  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileOpen(!isMobileOpen);
    } else {
      dispatch({ type: 'TOGGLE_SIDEBAR' });
    }
  };

  const unreadCount = notifications.length;

  // Mobile overlay
  if (isMobile && isMobileOpen) {
    return (
      <>
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
        
        {/* Mobile Sidebar */}
        <aside className="fixed left-0 top-0 h-full w-[280px] z-50 transition-transform duration-300 ease-in-out bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-r border-slate-800/50 flex flex-col">
          <MobileSidebarContent 
            state={state}
            activeModule={activeModule}
            sidebarCollapsed={sidebarCollapsed}
            setModule={setModule}
            toggleSidebar={toggleSidebar}
            unreadCount={unreadCount}
            isMobile={isMobile}
          />
        </aside>
      </>
    );
  }

  // Desktop Sidebar
  return (
    <>
      {/* Mobile Menu Button */}
      {isMobile && !isMobileOpen && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 p-2 rounded-xl bg-slate-800/90 backdrop-blur-sm border border-slate-700/50 text-white hover:bg-slate-700 transition-all"
        >
          <Menu size={24} />
        </button>
      )}

      {/* Desktop Sidebar */}
      <aside
        className={`
          hidden md:flex fixed left-0 top-0 h-full z-50 transition-all duration-300 ease-in-out
          flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950
          border-r border-slate-800/50
          ${sidebarCollapsed ? 'w-20' : 'w-72'}
        `}
      >
        <DesktopSidebarContent 
          state={state}
          activeModule={activeModule}
          sidebarCollapsed={sidebarCollapsed}
          setModule={setModule}
          toggleSidebar={toggleSidebar}
          unreadCount={unreadCount}
          isMobile={isMobile}
        />
      </aside>
    </>
  );
};

// Composant pour le contenu desktop
const DesktopSidebarContent: React.FC<any> = ({
  state,
  activeModule,
  sidebarCollapsed,
  setModule,
  toggleSidebar,
  unreadCount,
  isMobile
}) => {
  return (
    <>
      {/* Logo */}
      <div className={`flex items-center h-20 px-4 border-b border-slate-800/50 ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!sidebarCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <span className="text-slate-950 font-black text-lg">H</span>
            </div>
            <div>
              <h1 className="text-white font-black text-xl tracking-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
                HDA
              </h1>
              <p className="text-slate-500 text-xs font-medium tracking-widest uppercase">Platform</p>
            </div>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <span className="text-slate-950 font-black text-lg">H</span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className={`w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all ${sidebarCollapsed ? 'hidden' : 'flex'}`}
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      {/* Toggle when collapsed */}
      {sidebarCollapsed && (
        <button
          onClick={toggleSidebar}
          className="mx-auto mt-2 w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all"
        >
          <ChevronRight size={16} />
        </button>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {!sidebarCollapsed && (
          <p className="text-slate-600 text-xs font-semibold uppercase tracking-widest px-3 mb-3">Navigation</p>
        )}

        {navItems.map((item) => {
          const isActive = activeModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setModule(item.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative
                ${isActive
                  ? 'bg-white/10 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }
                ${sidebarCollapsed ? 'justify-center' : ''}
                touch-manipulation
              `}
              title={sidebarCollapsed ? item.label : ''}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-gradient-to-b from-amber-400 to-orange-500" />
              )}

              <div className={`
                w-9 h-9 rounded-lg flex items-center justify-center transition-all flex-shrink-0
                ${isActive
                  ? `bg-gradient-to-br ${item.gradient} shadow-lg`
                  : 'bg-slate-800 group-hover:bg-slate-700'
                }
              `}>
                {item.icon}
              </div>

              {!sidebarCollapsed && (
                <span className={`font-medium text-sm flex-1 text-left ${isActive ? 'text-white' : ''}`}>
                  {item.label}
                </span>
              )}

              {!sidebarCollapsed && item.badge && (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Performance Quick View */}
      {!sidebarCollapsed && (
        <div className="mx-3 mb-3 p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} className="text-amber-400" />
            <span className="text-amber-400 text-xs font-semibold uppercase tracking-wide">Performance</span>
          </div>
          <div className="text-white font-bold text-lg">+18.4%</div>
          <div className="text-slate-400 text-xs">vs mois dernier</div>
          <div className="mt-2 h-1.5 rounded-full bg-slate-800">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500" style={{ width: '72%' }} />
          </div>
        </div>
      )}

      {/* User Profile */}
      <div className={`p-3 border-t border-slate-800/50 ${sidebarCollapsed ? 'flex justify-center' : ''}`}>
        {!sidebarCollapsed ? (
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-all group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">
                {state.currentUser.prenom[0]}{state.currentUser.nom[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">
                {state.currentUser.prenom} {state.currentUser.nom}
              </p>
              <p className="text-slate-500 text-xs capitalize">{state.currentUser.role}</p>
            </div>
            <div className="relative">
              <Bell size={16} className="text-slate-400 group-hover:text-white transition-colors" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center cursor-pointer">
              <span className="text-white font-bold text-sm">
                {state.currentUser.prenom[0]}{state.currentUser.nom[0]}
              </span>
            </div>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
        )}
      </div>
    </>
  );
};

// Composant pour le contenu mobile
const MobileSidebarContent: React.FC<any> = ({
  state,
  activeModule,
  setModule,
  toggleSidebar,
  unreadCount
}) => {
  return (
    <>
      {/* Header avec bouton de fermeture */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <span className="text-slate-950 font-black text-lg">H</span>
          </div>
          <div>
            <h1 className="text-white font-black text-xl tracking-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
              HDA
            </h1>
            <p className="text-slate-500 text-xs font-medium tracking-widest uppercase">Platform</p>
          </div>
        </div>
        <button
          onClick={toggleSidebar}
          className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation Mobile */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        <p className="text-slate-600 text-xs font-semibold uppercase tracking-widest px-3 mb-3">Navigation</p>

        {navItems.map((item) => {
          const isActive = activeModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setModule(item.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative
                ${isActive
                  ? 'bg-white/10 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }
                touch-manipulation
              `}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-gradient-to-b from-amber-400 to-orange-500" />
              )}

              <div className={`
                w-9 h-9 rounded-lg flex items-center justify-center transition-all flex-shrink-0
                ${isActive
                  ? `bg-gradient-to-br ${item.gradient} shadow-lg`
                  : 'bg-slate-800 group-hover:bg-slate-700'
                }
              `}>
                {item.icon}
              </div>

              <span className={`font-medium text-sm flex-1 text-left ${isActive ? 'text-white' : ''}`}>
                {item.label}
              </span>

              {item.badge && (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Performance Quick View Mobile */}
      <div className="mx-3 mb-3 p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp size={14} className="text-amber-400" />
          <span className="text-amber-400 text-xs font-semibold uppercase tracking-wide">Performance</span>
        </div>
        <div className="text-white font-bold text-lg">+18.4%</div>
        <div className="text-slate-400 text-xs">vs mois dernier</div>
        <div className="mt-2 h-1.5 rounded-full bg-slate-800">
          <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500" style={{ width: '72%' }} />
        </div>
      </div>

      {/* User Profile Mobile */}
      <div className="p-3 border-t border-slate-800/50">
        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-all group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">
              {state.currentUser.prenom[0]}{state.currentUser.nom[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">
              {state.currentUser.prenom} {state.currentUser.nom}
            </p>
            <p className="text-slate-500 text-xs capitalize">{state.currentUser.role}</p>
          </div>
          <div className="relative">
            <Bell size={16} className="text-slate-400 group-hover:text-white transition-colors" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
};