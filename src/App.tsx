import { BrowserRouter, Routes, Route } from "react-router-dom";
import HotelPage from "./pages/HotelPage";
import ClientsPage from "./pages/ClientsPage";
import { HebergementPage } from "./pages/HebergementPage";
import { RestaurantPage } from "./pages/RestaurantPage";
import { BarPage } from "./pages/BarPage";
import { CasinoPage } from "./pages/CasinoPage";
import { FinancesPage } from "./pages/FinancesPage";
import { UtilisateursPage } from "./pages/UtilisateursPage";
import { LoginPage } from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./components/MainLayout";
import { Dashboard } from "./pages/Dashboard";
import { ToastProvider } from "./context/ToastContext";

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth */}
          <Route path="/" element={<LoginPage />} />

          {/* Routes protégées */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/hotel" element={<HotelPage />} />
              <Route path="/hebergement" element={<HebergementPage />} />
              <Route path="/restaurant" element={<RestaurantPage />} />
              <Route path="/bar" element={<BarPage />} />
              <Route path="/casino" element={<CasinoPage />} />
              <Route path="/finances" element={<FinancesPage />} />
              <Route path="/utilisateurs" element={<UtilisateursPage />} />
           <Route path="/clients" element={<ClientsPage />} />
            </Route>
          </Route>

          {/* Redirection par défaut */}
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;