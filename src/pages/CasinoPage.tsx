import React, { useState } from 'react';
import { Building2, Coins, Dices, Plus, WalletCards } from 'lucide-react';
import { CasinoTabs } from '../components/Casino/CasinoTabs';
import { RoomFormModal } from '../components/Casino/modals/RoomCashierModal';
import { ErrorBanner } from '../components/Casino/common';
import { Button } from '../components/UI';

import { CasinoSetupTab } from '../components/Casino/tabs/CasinoSetupTab';
import { TokensTab } from '../components/Casino/tabs/TokensTab';
import { CaisseTab } from '../components/Casino/tabs/CaisseTab';
// Onglet Stock existant (module casino) — conservé tel quel, non réécrit ici.
// import { StockTab } from '../components/Casino/tabs/';

import AuthService from '../services/authService';
import { getDefaultTabForRole } from '../utils/permissions';

export const CasinoPage: React.FC = () => {
  const currentUser = AuthService.getCurrentUser();
  const [activeTab, setActiveTab] = useState(() => {
    const defaultTab = getDefaultTabForRole('setup', currentUser?.role);
    return defaultTab === 'stock' || defaultTab === 'rooms' || defaultTab === 'tables-jeu' ? 'setup' : defaultTab;
  });
  const [error, setError] = useState<string | null>(null);
  const [showRoomForm, setShowRoomForm] = useState(false);

  return (
    <div className="flex flex-col gap-5 md:gap-6 w-full">
      <header className="relative overflow-hidden rounded-3xl p-5 md:p-7" style={{ background: 'linear-gradient(120deg, var(--color-surface) 0%, #201a10 100%)', border: '1px solid var(--color-border)' }}>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-accent text-xs font-semibold uppercase tracking-[0.18em]"><Dices size={15} /> Pilotage casino</div>
            <h1 className="text-primary text-2xl md:text-4xl font-bold mt-3" style={{ fontFamily: 'Playfair Display, serif' }}>Le casino, en trois étapes.</h1>
            <p className="text-muted text-sm mt-2 max-w-xl">Configurez les salles, affectez une caisse à chaque table, puis échangez ou reprenez les jetons.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button icon={<Plus size={15} />} onClick={() => setShowRoomForm(true)}>Nouvelle salle</Button>
            <Button variant="secondary" icon={<WalletCards size={15} />} onClick={() => setActiveTab('caisse')}>Ouvrir la caisse</Button>
          </div>
        </div>
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-3 gap-2 mt-6">
          {[["01", "Configuration", Building2], ["02", "Jetons", Coins], ["03", "Caisse", WalletCards]].map(([number, label, Icon]) => (
            <div key={String(label)} className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ backgroundColor: 'rgba(255,255,255,.05)' }}><span className="text-accent text-xs font-bold">{number}</span><Icon size={14} className="text-muted" /><span className="text-primary text-xs">{label}</span></div>
          ))}
        </div>
      </header>

      {error && <ErrorBanner message={error} />}

      <CasinoTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === 'setup' && <CasinoSetupTab />}
      {activeTab === 'tokens' && <TokensTab />}
      {activeTab === 'caisse' && <CaisseTab />}

      {showRoomForm && (
        <RoomFormModal
          onClose={() => setShowRoomForm(false)}
          onSuccess={() => {
            setShowRoomForm(false);
            setActiveTab('setup');
          }}
        />
      )}
    </div>
  );
};

export default CasinoPage;