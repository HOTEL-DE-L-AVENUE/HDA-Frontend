import React, { useState } from 'react';
import { StockManager, CaisseManager } from '../components/StockManager';
import { useHDA } from '../context/HDAContext';

// ─── Layout ───────────────────────────────────────────────────────────────────
import { BarHeader } from '../components/Bar/BarHeader';
import { BarStats } from '../components/Bar/BarStats';
import { BarTabs } from '../components/Bar/BarTabs';

// ─── Section bar ──────────────────────────────────────────────────────────────


// ─── Données & types ──────────────────────────────────────────────────────────
import { BarProduct } from '../types/bar.type';
import { BarTabId, BEST_SELLERS, COCKTAIL_MENU } from '../data/Bar.data';
import { AmbientBanner } from '../components/Bar/AmbientBanner';
import { CocktailMenu } from '../components/Bar/CocktailMenu';
import { BestSellers } from '../components/Bar/BestSellers';


export const BarPage: React.FC = () => {
  const { getModuleCaisseSolde } = useHDA();
  const [activeTab, setActiveTab] = useState<BarTabId>('bar');
  const { solde, entrees, sorties } = getModuleCaisseSolde('bar');

  /** Ajout d'un produit à la commande en cours (orders + order_items, source_module = 'BAR') */
  const handleAddToOrder = (cocktail: BarProduct) => {
    // TODO : dispatche vers HDAContext ou appel API POST /api/orders
    console.info('Ajout commande bar :', cocktail.nom);
  };

  return (
    <div className="space-y-6">
      <BarHeader />

      <BarStats stats={{ solde, entrees, sorties }} />

      <BarTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'bar' && (
        <div className="space-y-6">
          <AmbientBanner />
          <CocktailMenu cocktails={COCKTAIL_MENU} onAdd={handleAddToOrder} />
          <BestSellers sellers={BEST_SELLERS} />
        </div>
      )}

      {activeTab === 'stock' && (
        <StockManager
          module="bar"
          categories={['Spiritueux', 'Vins', 'Bières', 'Soft', 'Sirop', 'Champagne', 'Autre']}
        />
      )}

      {activeTab === 'caisse' && (
        <CaisseManager
          module="bar"
          categories={['Ventes Bar', 'Stock', 'Personnel', 'Événement', 'Autre']}
          title="Caisse Bar & Lounge"
          gradient="from-accent to-accent-2"
        />
      )}
    </div>
  );
};