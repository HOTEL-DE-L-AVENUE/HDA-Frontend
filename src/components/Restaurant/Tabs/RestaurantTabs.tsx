import React from 'react';
import { ShoppingCart, UtensilsCrossed, Table as TableIcon, Package, DollarSign } from 'lucide-react';

const TABS = [
  { id: 'commandes', label: 'Commandes', icon: <ShoppingCart size={16} /> },
  { id: 'menu', label: 'Menu', icon: <UtensilsCrossed size={16} /> },
  { id: 'tables', label: 'Tables', icon: <TableIcon size={16} /> },
  { id: 'stock', label: 'Stock', icon: <Package size={16} /> },
  { id: 'caisse', label: 'Caisse', icon: <DollarSign size={16} /> },
];

interface RestaurantTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const RestaurantTabs: React.FC<RestaurantTabsProps> = ({ activeTab, setActiveTab }) => {
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