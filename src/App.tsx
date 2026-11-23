import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from 'react';
import HotelPage from "./pages/HotelPage";
import ClientsPage from "./pages/ClientsPage";
// Hébergement module temporarily disabled - import and route commented out
// import { HebergementPage } from "./pages/HebergementPage";
import { RestaurantPage } from "./pages/RestaurantPage";
import { BarPage } from "./pages/BarPage";
import { AlcoholPage } from "./pages/AlcoholPage";
import { CasinoPage } from "./pages/CasinoPage";
import { FinancesPage } from "./pages/FinancesPage";
import { UtilisateursPage } from "./pages/UtilisateursPage";
import { LoginPage } from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./components/MainLayout";
import { Dashboard } from "./pages/Dashboard";
import { ToastProvider } from "./context/ToastContext";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import { RHPage } from "./pages/RHPage";
import PlanningPage from "./pages/PlanningPage";
import StockPage from "./pages/StockPage";
import AuthService from './services/authService';

const routeTitles: Record<string, string> = {
  '/dashboard': 'Tableau de bord', '/hotel': 'Hôtel', '/hebergement': 'Hébergement',
  '/restaurant': 'Restaurant', '/bar': 'Bar & Lounge', '/alcool': 'Alcool',
  '/casino': 'Casino', '/stock': 'Stock', '/finances': 'Finances',
  '/planning': 'Planning', '/rh': 'Ressources humaines', '/clients': 'Clients',
  '/utilisateurs': 'Utilisateurs', '/profile': 'Profil', '/settings': 'Paramètres',
};
const roleTitles: Record<string, string> = {
  admin: 'Administrateur', manager: 'Manager', caisse: 'Caissier', caissier: 'Caissier',
  hotesse: 'Hôtesse', water: 'Serveur', barman: 'Barman', serveur: 'Serveur',
  receptioniste: 'Réception', stock_manager: 'Gestionnaire de stock',
  croupier: 'Croupier', housekeeping: 'Entretien',
};

function DocumentTitle() {
  const { pathname } = useLocation();
  const [user, setUser] = useState(() => AuthService.getCurrentUser());

  useEffect(() => {
    const syncUser = () => setUser(AuthService.getCurrentUser());
    window.addEventListener('auth-change', syncUser);
    return () => window.removeEventListener('auth-change', syncUser);
  }, []);

  useEffect(() => {
    const page = routeTitles[pathname] || 'Gestion';
    const role = user?.role ? roleTitles[user.role.toLowerCase()] || user.role : '';
    document.title = role ? `HDA - ${page} | ${role}` : `HDA - ${page}`;
  }, [pathname, user]);

  return null;
}

function App() {
  return (
    <ToastProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <DocumentTitle />
        <Routes>
          {/* Auth */}
          <Route path="/" element={<LoginPage />} />

          {/* Routes protégées — authentification obligatoire */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              {/* Dashboard : protégé avec restriction selon le rôle et les modules */}
              <Route
                element={
                  <ProtectedRoute
                    moduleId="dashboard"
                    allowedRoles={['admin', 'manager']}
                  />
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
              </Route>

              {/* Modules avec vérification d'accès par module */}
              {/* Hébergement module temporarily disabled - route commented out */}
              {/* <Route
                element={
                  <ProtectedRoute
                    moduleId="hebergement"
                    allowedRoles={['admin', 'manager', 'receptioniste', 'housekeeping', 'caissier', 'caisse', 'stock_manager']}
                  />
                }
              >
                <Route path="/hebergement" element={<HebergementPage />} />
              </Route> */}

              <Route
                element={
                  <ProtectedRoute
                    moduleId="hotel"
                    allowedRoles={['admin', 'manager', 'receptioniste', 'housekeeping', 'caisse', 'caissier', 'stock_manager']}
                  />
                }
              >
                <Route path="/hotel" element={<HotelPage />} />
              </Route>

              <Route
                element={
                  <ProtectedRoute
                    moduleId="restaurant"
                    allowedRoles={['admin', 'manager', 'receptioniste', 'caisse', 'caissier', 'stock_manager', 'serveur']}
                  />
                }
              >
                <Route path="/restaurant" element={<RestaurantPage />} />
              </Route>

              <Route
                element={
                  <ProtectedRoute
                    moduleId="bar"
                    allowedRoles={['admin', 'manager', 'water', 'barman', 'hotesse', 'receptioniste', 'caissier', 'caisse', 'stock_manager', 'serveur']}
                  />
                }
              >
                <Route path="/bar" element={<BarPage />} />
              </Route>

              <Route
                element={
                  <ProtectedRoute
                    moduleId="alcool"
                    allowedRoles={['admin', 'manager', 'caissier', 'caisse', 'stock_manager']}
                  />
                }
              >
                <Route path="/alcool" element={<AlcoholPage />} />
              </Route>

              <Route
                element={
                  <ProtectedRoute
                    moduleId="casino"
                    allowedRoles={['admin', 'manager', 'caisse', 'caissier', 'croupier']}
                  />
                }
              >
                <Route path="/casino" element={<CasinoPage />} />
              </Route>

              <Route element={<ProtectedRoute moduleId="stock" allowedRoles={['admin', 'manager', 'stock_manager']} />}>
                <Route path="/stock" element={<StockPage />} />
              </Route>

              <Route
                element={
                  <ProtectedRoute
                    moduleId="finances"
                    allowedRoles={['admin', 'manager', 'caisse', 'caissier']}
                  />
                }
              >
                <Route path="/finances" element={<FinancesPage />} />
              </Route>

              <Route element={<ProtectedRoute moduleId="planning" allowedRoles={['admin', 'manager']} />}>
                <Route path="/planning" element={<PlanningPage />} />
              </Route>

              {/* RH : ouvert à tout utilisateur connecté. admin/manager voient la gestion
                  complète ; les autres rôles voient uniquement leur propre fiche RH
                  (voir RHPage.tsx et canAccessModule). */}
              <Route element={<ProtectedRoute moduleId="rh" />}>
                <Route path="/rh" element={<RHPage />} />
              </Route>

              <Route
                element={
                  <ProtectedRoute
                    moduleId="clients"
                    allowedRoles={['admin', 'manager', 'receptioniste', 'caisse', 'caissier']}
                  />
                }
              >
                <Route path="/clients" element={<ClientsPage />} />
              </Route>

              {/* Utilisateurs : admin uniquement */}
              <Route
                element={
                  <ProtectedRoute
                    moduleId="utilisateurs"
                    allowedRoles={['admin']}
                  />
                }
              >
                <Route path="/utilisateurs" element={<UtilisateursPage />} />
              </Route>

              {/* Profil accessible, paramètres réservés aux responsables */}
              <Route path="/profile" element={<ProfilePage />} />
              <Route element={<ProtectedRoute allowedRoles={['admin', 'manager']} />}>
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Route>
          </Route>

          {/* Redirection par défaut */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
