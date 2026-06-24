import React from 'react';
import { useHDA } from './context/HDAContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { HebergementPage } from './pages/HebergementPage';
import { HotelPage } from './pages/HotelPage';
import { RestaurantPage } from './pages/RestaurantPage';
import { BarPage } from './pages/BarPage';
import { CasinoPage } from './pages/CasinoPage';
import { FinancesPage } from './pages/FinancesPage';
import { UtilisateursPage } from './pages/UtilisateursPage';
import ClientsPage from './pages/ClientsPage';

const PageRenderer: React.FC = () => {
  const { state } = useHDA();
  switch (state.activeModule) {
    case 'dashboard':    return <Dashboard />;
    case 'hebergement':  return <HebergementPage />;
    case 'hotel':        return <HotelPage />;
    case 'restaurant':   return <RestaurantPage />;
    case 'bar':          return <BarPage />;
    case 'casino':       return <CasinoPage />;
    case 'finances':     return <FinancesPage />;
    case 'utilisateurs': return <UtilisateursPage />;
    case 'clients':      return <ClientsPage />;
    default:             return <Dashboard />;
  }
};

function App() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>
      <Sidebar />

      {/* Main Content - Occupe tout l'espace restant */}
      <div className="md:ml-[72px] w-full md:w-[calc(100%-72px)] min-h-screen">
        <Header />
        <main className="p-4 md:p-6 lg:p-8 w-full max-w-full overflow-x-hidden">
          <div className="w-full max-w-full">
            <PageRenderer />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;