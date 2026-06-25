// src/components/Sidebar.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useHDA } from '../context/HDAContext';
import AuthService from '../services/authService'; // ← Import du service
import { ModuleType } from '../types';
import {
  LayoutDashboard, BedDouble, Hotel, UtensilsCrossed,
  Wine, Dices, DollarSign, Users, TrendingUp, X, MoreHorizontal,
  UserCog,
  UserRoundPlus,
} from 'lucide-react';
import logo from '../assets/logo_s.png';
import { useLocation, useNavigate } from 'react-router-dom';

interface NavItem {
  id: ModuleType;
  label: string;
  icon: React.ReactNode;
  gradient: string;
  path: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Tableau de Bord', icon: <LayoutDashboard size={20} />, gradient: 'from-accent to-accent-2', path: "/dashboard" },
  { id: 'hebergement', label: 'Hébergement', icon: <BedDouble size={20} />, gradient: 'from-accent to-accent-2', path: "/hebergement" },
  { id: 'hotel', label: 'Hôtel', icon: <Hotel size={20} />, gradient: 'from-accent to-accent-2', path: "/hotel" },
  { id: 'restaurant', label: 'Restaurant', icon: <UtensilsCrossed size={20} />, gradient: 'from-accent to-accent-2', path: "/restaurant" },
  { id: 'bar', label: 'Bar & Lounge', icon: <Wine size={20} />, gradient: 'from-accent to-accent-2', path: "/bar" },
  { id: 'casino', label: 'Casino', icon: <Dices size={20} />, gradient: 'from-accent to-accent-2', path: "/casino" },
  { id: 'finances', label: 'Finances', icon: <DollarSign size={20} />, gradient: 'from-accent to-accent-2', path: "/finances" },
  { id: 'clients', label: 'Clients', icon: <UserRoundPlus size={20} />, gradient: 'from-accent to-accent-2', path: "/clients" },
  { id: 'utilisateurs', label: 'Utilisateurs', icon: <UserCog size={20} />, gradient: 'from-accent to-accent-2', path: "/utilisateurs" },
];

const bottomNavItems = navItems.slice(0, 4);
const moreNavItems = navItems.slice(4);

/* ─── ONDULATION COMME BORDURE ─── */
const WavyEdge: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      right: '-12px',
      top: 0,
      height: '100%',
      width: '24px',
      pointerEvents: 'none',
      zIndex: 30,
      overflow: 'visible',
    }}
  >
    <svg
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
      }}
      preserveAspectRatio="none"
      viewBox="0 0 24 800"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="
          M12,0
          C18,40 6,90 12,150
          C18,210 6,270 12,330
          C18,390 6,450 12,510
          C18,570 6,630 12,690
          C18,740 6,780 12,800
        "
        fill="none"
        stroke="var(--color-border)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="
          M12,0
          C18,40 6,90 12,150
          C18,210 6,270 12,330
          C18,390 6,450 12,510
          C18,570 6,630 12,690
          C18,740 6,780 12,800
        "
        fill="none"
        stroke="var(--color-border)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transform: 'translateX(2px)', opacity: 0.3 }}
      />
    </svg>
  </div>
);

/* ─── TOOLTIP CORRIGÉ AVEC POSITION DYNAMIQUE ─── */
interface TooltipProps {
  label: string;
  children: React.ReactNode;
  isActive?: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({ label, children, isActive = false }) => {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const showTooltip = visible && !isActive;

  const updatePosition = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top + rect.height / 2,
        left: rect.right + 12,
      });
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
      }}
      onMouseEnter={() => {
        setVisible(true);
        updatePosition();
      }}
      onMouseLeave={() => {
        setVisible(false);
      }}
    >
      {children}
      {showTooltip && (
        <div
          style={{
            position: 'fixed',
            top: position.top,
            left: position.left,
            transform: 'translateY(-50%)',
            zIndex: 9999,
            backgroundColor: 'var(--color-surface-2)',
            color: 'var(--color-primary)',
            border: '1px solid var(--color-border)',
            fontSize: '12px',
            fontWeight: 500,
            padding: '6px 12px',
            borderRadius: '8px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            boxShadow: 'var(--shadow-md)',
            letterSpacing: '0.01em',
          }}
        >
          <span
            style={{
              position: 'absolute',
              right: '100%',
              top: '50%',
              transform: 'translateY(-50%)',
              borderWidth: '5px',
              borderStyle: 'solid',
              borderColor: 'transparent var(--color-border) transparent transparent',
            }}
          />
          {label}
        </div>
      )}
    </div>
  );
};

/* ─── NAV BUTTON ─── */
interface NavButtonProps {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}

const NavButton: React.FC<NavButtonProps> = ({ item, isActive, onClick }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <Tooltip label={item.label} isActive={isActive}>
      <button
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: 'relative',
          width: '44px',
          height: '44px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          outline: 'none',
          background: isActive
            ? 'var(--color-accent)'
            : hovered
              ? 'var(--color-surface-2)'
              : 'transparent',
          boxShadow: isActive
            ? 'var(--shadow-accent)'
            : 'none',
          transform: hovered && !isActive ? 'scale(1.05)' : 'scale(1)',
        }}
      >
        {isActive && (
          <span
            style={{
              position: 'absolute',
              left: '-10px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '3px',
              height: '22px',
              borderRadius: '0 3px 3px 0',
              background: 'var(--color-accent)',
            }}
          />
        )}

        <span
          style={{
            color: isActive
              ? '#000000'
              : hovered
                ? 'var(--color-primary)'
                : 'var(--color-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.15s ease',
          }}
        >
          {item.icon}
        </span>

        {item.badge && !isActive && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-accent)',
              color: '#000000',
              fontSize: '9px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--color-surface)',
            }}
          >
            {item.badge}
          </span>
        )}
      </button>
    </Tooltip>
  );
};

/* ─── SIDEBAR DESKTOP ─── */
export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { state } = useHDA(); // On garde le contexte pour les notifications

  // Récupération de l'utilisateur connecté via AuthService
  const [currentUser, setCurrentUser] = useState(AuthService.getCurrentUser());

  // Écoute des changements d'authentification (login/logout)
  useEffect(() => {
    const updateUser = () => setCurrentUser(AuthService.getCurrentUser());
    window.addEventListener('auth-change', updateUser);
    return () => window.removeEventListener('auth-change', updateUser);
  }, []);

  const unreadCount = state.notifications.length;

  const setModule = (path: string) => {
    navigate(path);
  };

  // Préparation de l'affichage de l'avatar et du nom (gère le cas null)
  const userInitials = currentUser
    ? `${currentUser.prenom?.[0] || ''}${currentUser.nom?.[0] || 'U'}`
    : 'U';
  const userFullName = currentUser
    ? `${currentUser.prenom || ''} ${currentUser.nom || ''}`.trim()
    : 'Utilisateur';

  return (
    <>
      <aside
        className="hidden md:flex"
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          height: '100%',
          width: '72px',
          zIndex: 50,
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: 'var(--color-surface)',
          overflow: 'visible',
          boxShadow: 'var(--shadow-sm)',
          outline: 'none',
          borderRight: '1px solid var(--color-border)',
        }}
      >
        <WavyEdge />

        {/* LOGO */}
        <Tooltip label="HDA Platform">
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              marginTop: '2px',
              marginBottom: '2px',
              width: '60px',
              height: '60px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-accent)',
              transition: 'opacity 0.15s, transform 0.15s',
              flexShrink: 0,
              overflow: 'hidden',
              padding: '2px',
              background: 'transparent',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <img
              src={logo}
              alt="HDA Platform"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          </button>
        </Tooltip>

        <div
          style={{
            width: '28px',
            height: '1px',
            backgroundColor: 'var(--color-border)',
            marginBottom: '12px',
          }}
        />

        <nav
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            padding: '0 8px',
            overflowY: 'auto',
            scrollbarWidth: 'none',
            width: '100%',
          }}
        >
          {navItems.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              isActive={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            />
          ))}
        </nav>

        <div
          style={{
            margin: '8px',
            padding: '8px 6px',
            borderRadius: '12px',
            backgroundColor: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            textAlign: 'center',
            width: '50px',
          }}
        >
          <TrendingUp
            size={14}
            style={{ color: 'var(--color-accent)', margin: '0 auto 3px', display: 'block' }}
          />
          <div style={{ color: 'var(--color-primary)', fontWeight: 700, fontSize: '11px' }}>
            +18%
          </div>
        </div>

        {/* Avatar et nom utilisateur (données provenant de AuthService) */}
        <Tooltip label={userFullName}>
          <div style={{ position: 'relative', marginBottom: '14px', cursor: 'pointer' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '11px',
                background: 'var(--color-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-accent)',
                transition: 'transform 0.15s',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.transform = 'scale(1.05)')}
              onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.transform = 'scale(1)')}
            >
              <span style={{ color: '#000000', fontWeight: 700, fontSize: '12px' }}>
                {userInitials}
              </span>
            </div>
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-accent)',
                  color: '#000000',
                  fontSize: '9px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid var(--color-surface)',
                }}
              >
                {unreadCount}
              </span>
            )}
          </div>
        </Tooltip>
      </aside>

      <MobileBottomNav />
    </>
  );
};

/* ─── MOBILE BOTTOM NAV ─── */
const MobileBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [showMore, setShowMore] = useState(false);

  const setModule = (path: string) => {
    navigate(path);
    setShowMore(false);
  };

  useEffect(() => {
    if (!showMore) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#mobile-bottom-nav')) setShowMore(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMore]);

  const isMoreActive = moreNavItems.some(
    i => i.path === location.pathname
  );

  return (
    <>
      {showMore && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(4px)'
            }}
            onClick={() => setShowMore(false)}
          />
          <div className="md:hidden fixed bottom-20 left-0 right-0 z-50 px-4 pb-2">
            <div
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              <div
                className="px-4 py-3 flex items-center justify-between"
                style={{ borderBottom: '1px solid var(--color-border)' }}
              >
                <span style={{ color: 'var(--color-primary)', fontSize: '14px', fontWeight: 600 }}>
                  Plus de modules
                </span>
                <button
                  onClick={() => setShowMore(false)}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--color-surface-2)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-muted)',
                  }}
                >
                  <X size={14} />
                </button>
              </div>
              <div style={{ padding: '8px' }}>
                {moreNavItems.map(item => {
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setModule(item.path)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: 'none',
                        cursor: 'pointer',
                        backgroundColor: isActive ? 'var(--color-accent-4)' : 'transparent',
                        color: isActive ? 'var(--color-accent)' : 'var(--color-muted)',
                        transition: 'all 0.15s',
                      }}
                    >
                      <span
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: isActive ? 'var(--color-accent)' : 'var(--color-surface-2)',
                          color: isActive ? '#000000' : 'var(--color-muted)',
                        }}
                      >
                        {item.icon}
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: 500, color: isActive ? 'var(--color-primary)' : 'var(--color-secondary)' }}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      <nav
        id="mobile-bottom-nav"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderTop: '1px solid var(--color-border)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '8px' }}>
          {bottomNavItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.id}
                onClick={() => setModule(item.path)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px',
                  flex: 1,
                  padding: '4px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <span
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isActive ? 'var(--color-accent)' : 'var(--color-surface-2)',
                    color: isActive ? '#000000' : 'var(--color-muted)',
                    boxShadow: isActive ? 'var(--shadow-accent)' : 'none',
                    transform: isActive ? 'scale(1.06)' : 'scale(1)',
                    transition: 'all 0.15s',
                  }}
                >
                  {item.icon}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 500,
                    color: isActive ? 'var(--color-primary)' : 'var(--color-subtle)',
                  }}
                >
                  {item.label.split(' ')[0]}
                </span>
              </button>
            );
          })}

          <button
            onClick={() => setShowMore(!showMore)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              flex: 1,
              padding: '4px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <span
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isMoreActive || showMore ? 'var(--color-accent)' : 'var(--color-surface-2)',
                color: isMoreActive || showMore ? '#000000' : 'var(--color-muted)',
                boxShadow: isMoreActive || showMore ? 'var(--shadow-accent)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              <MoreHorizontal size={20} />
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 500,
                color: isMoreActive || showMore ? 'var(--color-primary)' : 'var(--color-subtle)',
              }}
            >
              Plus
            </span>
          </button>
        </div>
      </nav>
    </>
  );
};