import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
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
import { BarCommandeView } from '../components/Bar/BarCommande';
import type { BarCommande } from '../types/bar.type';

export const BarPage: React.FC = () => {
  const { getModuleCaisseSolde } = useHDA();
  const [activeTab, setActiveTab] = useState<BarTabId>('bar');
  const { solde, entrees, sorties } = getModuleCaisseSolde('bar');

  const [cocktails, setCocktails] = useState<BarProduct[]>([]);
  const [stockMap, setStockMap] = useState<Record<number, { quantite: number; unite: string }>>({});
  const [commandes, setCommandes] = useState<BarCommande[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = async () => {
    try {
      const data = await barService.getBarOrders();
      setCommandes(Array.isArray(data) ? data.map((order) => ({
        id: order.id,
        client: order.client,
        table: order.table,
        statut: order.statut === 'EN_ATTENTE' ? 'En attente' : (order.statut as BarCommande['statut']),
        total: Number(order.total || 0),
        items: order.items || [],
      })) : []);
    } catch (error) {
      console.error('Erreur chargement commandes bar:', error);
      setError('L’API bar n’est pas accessible. Vérifiez que le backend tourne sur le port 4000.');
    }
  };

  const handleCreateCommande = async ({ client, table, items }: { client: string; table: number; items: BarCommande['items'] }) => {
    try {
      const normalizedItems = items.map((item) => ({
        product_id: item.product_id,
        nom: item.nom,
        quantite: Number(item.quantite) || 1,
        prix: Number(item.prix) || 0,
        prix_unitaire: Number(item.prix) || 0,
      }));

      const createdOrder = await barService.createBarOrder({ client, table, items: normalizedItems });
      if (createdOrder) {
        await loadOrders();
      }
    } catch (error) {
      console.error('Erreur création commande bar:', error);
      setError("La commande bar n'a pas pu �tre cr��e.");
      throw error;
    }
  };

  const handleDeleteCommande = async (id: number) => {
    try {
      await barService.deleteBarOrder(id);
      await loadOrders();
    } catch (error) {
      console.error('Erreur suppression commande bar:', error);
      setError("La commande bar n'a pas pu �tre supprim�e.");
      throw error;
    }
  };
  const handleAddItemToCommande = (cocktail: BarProduct): boolean => {
    if (commandes.length === 0) {
      return false;
    }

    setCommandes((prev) => {
      const currentCommande = prev[0];
      const normalizedPrice = Number(cocktail.prix) || 0;
      const existingItem = currentCommande.items.find((item) => item.nom === cocktail.nom);
      const updatedItems = existingItem
        ? currentCommande.items.map((item) =>
            item.nom === cocktail.nom
              ? { ...item, quantite: item.quantite + 1, prix: normalizedPrice }
              : item
          )
        : [...currentCommande.items, { nom: cocktail.nom, quantite: 1, prix: normalizedPrice }];

      const total = updatedItems.reduce((sum, item) => sum + Number(item.prix || 0) * item.quantite, 0);
      const updatedCommande = { ...currentCommande, items: updatedItems, total };
      return [updatedCommande];
    });

    return true;
  };
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cocktailsRes, stockRes] = await Promise.all([
        barService.getBarProducts(),
        barService.getBarStock(),
      ]);
      const cocktails = Array.isArray(cocktailsRes) ? cocktailsRes : (cocktailsRes as { data?: BarProduct[] }).data;
      const stock = Array.isArray(stockRes) ? stockRes : (stockRes as { data?: BarStockItem[] }).data;
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
      setError('L’API bar n’est pas accessible. Vérifiez que le backend tourne sur le port 4000.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
    void loadOrders();
  }, []);

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

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <BarStats stats={{ solde, entrees, sorties }} />

      <BarTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'bar' && (
        <div className="space-y-6">
          <CocktailMenu cocktails={cocktails} stockMap={stockMap} onStockUpdate={fetchData} onAddToOrder={handleAddItemToCommande} />
          <BestSellers sellers={BEST_SELLERS} />
        </div>
      )}

      {activeTab === 'commandes' && (
        <BarCommandeView commandes={commandes} onCreateCommande={handleCreateCommande} onDeleteCommande={handleDeleteCommande} cocktails={cocktails} />
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