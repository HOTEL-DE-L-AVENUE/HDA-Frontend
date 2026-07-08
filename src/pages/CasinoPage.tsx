import React, { useEffect, useState } from 'react';
import { Building2, DoorOpen, Wallet, TrendingUp, CreditCard, AlertTriangle } from 'lucide-react';
import { CasinoHeader } from '../components/Casino/CasinoHeader';
import { CasinoTabs } from '../components/Casino/CasinoTabs';
import { dashboardApi } from '../services/casino.service';
import type { CasinoDashboard } from '../types/casino.types';
import { RoomFormModal } from '../components/Casino/modals/RoomCashierModal';
import { ErrorBanner } from '../components/Casino/common';

import { OverviewTab } from '../components/Casino/tabs/OverviewTab';
import { RoomsTab } from '../components/Casino/tabs/RoomsTab';
import { CardsCreditsTab } from '../components/Casino/tabs/CardsCreditsTab';
import { ClientsTab } from '../components/Casino/tabs/ClientsTab';
import { CaisseTab } from '../components/Casino/tabs/CaisseTab';
// Onglet Stock existant (module casino) — conservé tel quel, non réécrit ici.
// import { StockTab } from '../components/Casino/tabs/';

export const CasinoPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboard, setDashboard] = useState<CasinoDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRoomForm, setShowRoomForm] = useState(false);

  async function loadDashboard() {
    try {
      const d = await dashboardApi.get();
      setDashboard(d);
    } catch (e: any) {
      setError(e?.message || 'Erreur de chargement du tableau de bord.');
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const stats = dashboard
    ? [
        { label: 'Salles ouvertes', value: `${dashboard.salles_ouvertes}/${dashboard.salles_total}`, icon: <Building2 size={16} className="text-black" /> },
        { label: 'Sessions ouvertes', value: dashboard.sessions_ouvertes, icon: <Wallet size={16} className="text-black" /> },
        { label: 'Produit net (jour)', value: `${dashboard.produit_net_jour.toLocaleString('fr-FR')} Ar`, icon: <TrendingUp size={16} className="text-black" /> },
        { label: 'Incidents ouverts', value: dashboard.incidents_ouverts, icon: <AlertTriangle size={16} className="text-black" /> },
      ]
    : [
        { label: 'Salles ouvertes', value: '—', icon: <Building2 size={16} className="text-black" /> },
        { label: 'Sessions ouvertes', value: '—', icon: <Wallet size={16} className="text-black" /> },
        { label: 'Produit net (jour)', value: '—', icon: <TrendingUp size={16} className="text-black" /> },
        { label: 'Incidents ouverts', value: '—', icon: <AlertTriangle size={16} className="text-black" /> },
      ];

  return (
    <div className="flex flex-col gap-4 md:gap-6 w-full">
      <CasinoHeader
        stats={stats}
        onNewRoom={() => setShowRoomForm(true)}
        onNewSession={() => setActiveTab('rooms')}
        onNewTransaction={() => setActiveTab('rooms')}
      />

      {error && <ErrorBanner message={error} />}

      <CasinoTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'rooms' && <RoomsTab />}
      {activeTab === 'cards' && <CardsCreditsTab />}
      {activeTab === 'clients' && <ClientsTab />}
      {/* {activeTab === 'stock' && <StockTab />} */}
      {activeTab === 'caisse' && <CaisseTab />}

      {showRoomForm && (
        <RoomFormModal
          onClose={() => setShowRoomForm(false)}
          onSuccess={() => {
            setShowRoomForm(false);
            loadDashboard();
            setActiveTab('rooms');
          }}
        />
      )}
    </div>
  );
};

export default CasinoPage;
