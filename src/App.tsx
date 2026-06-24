// import React from 'react';
// import { useHDA } from './context/HDAContext';
// import { Sidebar } from './components/Sidebar';
// import { Header } from './components/Header';
// import { Dashboard } from './pages/Dashboard';
// import { HebergementPage } from './pages/HebergementPage';
// import { HotelPage } from './pages/HotelPage';
// import { RestaurantPage } from './pages/RestaurantPage';
// import { BarPage } from './pages/BarPage';
// import { CasinoPage } from './pages/CasinoPage';
// import { FinancesPage } from './pages/FinancesPage';
// import { UtilisateursPage } from './pages/UtilisateursPage';
// import ClientsPage from './pages/ClientsPage';

// const PageRenderer: React.FC = () => {
//   const { state } = useHDA();

//   switch (state.activeModule) {
//     case 'dashboard': return <Dashboard />;
//     case 'hebergement': return <HebergementPage />;
//     case 'hotel': return <HotelPage />;
//     case 'restaurant': return <RestaurantPage />;
//     case 'bar': return <BarPage />;
//     case 'casino': return <CasinoPage />;
//     case 'finances': return <FinancesPage />;
//     case 'utilisateurs': return <UtilisateursPage />;
//     case 'clients': return <ClientsPage />;

//     default: return <Dashboard />;
//   }
// };

// function App() {
//   const { state } = useHDA();
//   const { sidebarCollapsed } = state;

//   return (
//     <div className="min-h-screen bg-slate-950 text-white" style={{ fontFamily: 'Inter, sans-serif' }}>
//       {/* Sidebar */}
//       <Sidebar />

//       {/* Main Content */}
//       <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-72'}`}>
//         <Header />
//         <main className="p-6 lg:p-8 max-w-screen-2xl">
//           <PageRenderer />
//         </main>
//       </div>

//       {/* Ambient Background Effects */}
//       <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
//         <div className="absolute top-0 left-1/3 w-96 h-96 rounded-full bg-amber-500/3 blur-3xl" />
//         <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-violet-500/3 blur-3xl" />
//         <div className="absolute top-1/2 right-0 w-64 h-64 rounded-full bg-emerald-500/3 blur-3xl" />
//       </div>
//     </div>
//   );
// }

// export default App;

import React, { useState } from 'react';
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
import LoginPage from './pages/LoginPage';

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