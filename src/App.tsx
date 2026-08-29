import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import HotelPage from "./pages/HotelPage";
import ClientsPage from "./pages/ClientsPage";
import { HebergementPage } from "./pages/HebergementPage";
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

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
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
              <Route
                element={
                  <ProtectedRoute
                    moduleId="hebergement"
                    allowedRoles={['admin', 'manager', 'receptioniste', 'housekeeping', 'caissier', 'caisse', 'stock_manager']}
                  />
                }
              >
                <Route path="/hebergement" element={<HebergementPage />} />
              </Route>

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
                    allowedRoles={['admin', 'manager', 'receptioniste', 'caisse', 'caissier', 'stock_manager']}
                  />
                }
              >
                <Route path="/restaurant" element={<RestaurantPage />} />
              </Route>

              <Route
                element={
                  <ProtectedRoute
                    moduleId="bar"
                    allowedRoles={['admin', 'manager', 'water', 'caissier', 'caisse', 'stock_manager']}
                  />
                }
              >
                <Route path="/bar" element={<BarPage />} />
              </Route>

              <Route
                element={
                  <ProtectedRoute
                    moduleId="alcool"
                    allowedRoles={['admin', 'manager', 'water', 'caissier', 'caisse', 'stock_manager']}
                  />
                }
              >
                <Route path="/alcool" element={<AlcoholPage />} />
              </Route>

              <Route
                element={
                  <ProtectedRoute
                    moduleId="casino"
                    allowedRoles={['admin', 'croupier']}
                  />
                }
              >
                <Route path="/casino" element={<CasinoPage />} />
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
