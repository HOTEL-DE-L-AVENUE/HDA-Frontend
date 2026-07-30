import React, { useState, useEffect } from 'react';
import { StockManager, CaisseManager } from '../components/StockManager';
import { useHDA } from '../context/HDAContext';
import barService from '../services/bar.service';
import { BarProduct, BarStockItem } from '../types/bar.type';

// ─── Layout ───────────────────────────────────────────────
import { BarHeader } from '../components/Bar/BarHeader';
import { BarStats } from '../components/Bar/BarStats';
import { BarTabs } from '../components/Bar/BarTabs';

// ─── Data & types ────────────────────────────────────────
import { BarTabId, BEST_SELLERS, BEST_SELLERS_MAX_VENTES } from '../data/Bar.data';
import { CocktailMenu } from '../components/Bar/CocktailMenu';
import { BestSellers } from '../components/Bar/BestSellers';

export const BarPage: React.FC = () => {
  const { getModuleCaisseSolde } = useHDA();
  const [activeTab, setActiveTab] = useState<BarTabId>('bar');
  const { solde, entrees, sorties } = getModuleCaisseSolde('bar');

  const [cocktails, setCocktails] = useState<BarProduct[]>([]);
  const [stockMap, setStockMap] = useState<Record<number, { quantite: number; unite: string }>>({});
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cocktailsRes, stockRes] = await Promise.all([
        barService.getBarProducts(),
        barService.getBarStock(),
      ]);
      const cocktails = cocktailsRes.data || cocktailsRes;
      const stock = stockRes.data || stockRes;
      if (Array.isArray(cocktails)) setCocktails(cocktails as BarProduct[]);
      if (Array.isArray(stock)) {
        const map: Record<number, { quantite: number; unite: string }> = {};
        (stock as BarStockItem[]).forEach((s) => {
          map[s.product_id] = { quantite: s.quantite, unite: s.unite || 'unités' };
        });
        setStockMap(map);
      }
    } catch (err) {
      console.error('Erreur chargement bar:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400 text-lg">Chargement du Bar & Lounge...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BarHeader />

      <BarStats stats={{ solde, entrees, sorties }} />

      <BarTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'bar' && (
        <div className="space-y-6">
          <CocktailMenu cocktails={cocktails} stockMap={stockMap} onStockUpdate={fetchData} />
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