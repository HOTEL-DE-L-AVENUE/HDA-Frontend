import React from 'react';
import { LayoutDashboard, Dices, CreditCard, Users, Package, DollarSign } from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'Vue d\'ensemble', icon: <LayoutDashboard size={16} /> },
  { id: 'rooms', label: 'Salles & Caisses', icon: <Dices size={16} /> },
  { id: 'cards', label: 'Cartes & Crédits', icon: <CreditCard size={16} /> },
  { id: 'clients', label: 'Joueurs', icon: <Users size={16} /> },
  { id: 'stock', label: 'Stock', icon: <Package size={16} /> },
  { id: 'caisse', label: 'Caisse Globale', icon: <DollarSign size={16} /> },
];

interface CasinoTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const CasinoTabs: React.FC<CasinoTabsProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div 
      className="flex gap-1 rounded-2xl p-1 w-full overflow-x-auto hide-scrollbar"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      {TABS.map((tab) => (
        <button 
          key={tab.id} 
          onClick={() => setActiveTab(tab.id)}
          className={`px-3 md:px-5 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 flex items-center gap-2 ${
            activeTab === tab.id ? 'text-black' : 'text-muted hover:text-secondary'
          }`}
          style={{
            backgroundColor: activeTab === tab.id ? 'var(--color-accent)' : 'transparent',
            boxShadow: activeTab === tab.id ? 'var(--shadow-accent)' : 'none',
          }}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
};