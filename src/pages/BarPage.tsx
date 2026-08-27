import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle } from 'lucide-react';
import { StockManager, CaisseManager } from '../components/StockManager';
import barService from '../services/bar.service';
import { BarPaymentMethod, BarProduct, BarStockItem } from '../types/bar.type';

// ─── Layout ───────────────────────────────────────────────
import { BarHeader } from '../components/Bar/BarHeader';
import { BarStats } from '../components/Bar/BarStats';
import { BarTabs } from '../components/Bar/BarTabs';

// ─── Data & types ────────────────────────────────────────
import { BarTabId } from '../data/Bar.data';
import { CocktailMenu } from '../components/Bar/CocktailMenu';
import { BestSellers } from '../components/Bar/BestSellers';
import { BarCommandeView } from '../components/Bar/BarCommande';
import { BarReports } from '../components/Bar/BarReports';
import type { BarCommande } from '../types/bar.type';
import type { BarOrderStatus } from '../services/bar.service';

import AuthService from '../services/authService';
import { getDefaultTabForRole, isAdmin, isCashier } from '../utils/permissions';
import { useToast } from '../context/ToastContext';

export const BarPage: React.FC = () => {
  const currentUser = AuthService.getCurrentUser();
  const userIsAdmin = isAdmin(currentUser);
  const userIsCashier = isCashier(currentUser);
  const { showToast } = useToast();
  const previousOrderStatuses = useRef<Record<number, string> | null>(null);
  const [activeTab, setActiveTab] = useState<BarTabId>(() => getDefaultTabForRole('bar', currentUser?.role) as BarTabId);

  const [cocktails, setCocktails] = useState<BarProduct[]>([]);
  const [stockMap, setStockMap] = useState<Record<number, { quantite: number; unite: string }>>({});
  const [commandes, setCommandes] = useState<BarCommande[]>([]);
  const [error, setError] = useState<string | null>(null);

  const orderStatusLabels: Record<string, BarCommande['statut']> = {
    EN_ATTENTE: 'En attente',
    EN_PREPARATION: 'En préparation',
    PRETE: 'Prête',
    SERVIE: 'Servie',
    ENCAISSEE: 'Encaissée',
  };

  const playOrderAlert = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioContext = new AudioContextClass();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(660, audioContext.currentTime + 0.12);
      gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.18, audioContext.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.28);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.3);
      oscillator.addEventListener('ended', () => void audioContext.close());
    } catch {
      // Le navigateur peut bloquer l'audio avant une première interaction.
    }
  };

  const loadOrders = async () => {
    try {
      const data = await barService.getBarOrders();
      const nextOrders = Array.isArray(data) ? data.map((order) => ({
        id: order.id,
        client: order.client,
        table: order.table,
        nombre_personnes: order.nombre_personnes,
        moyen_paiement: order.moyen_paiement,
        statut: orderStatusLabels[order.statut] || (order.statut as BarCommande['statut']),
        total: Number(order.total || 0),
        created_at: order.created_at,
        items: order.items || [],
      })) : [];
      if (previousOrderStatuses.current) {
        nextOrders.forEach((order) => {
          const oldStatus = previousOrderStatuses.current?.[order.id];
          if (oldStatus !== order.statut && ['En préparation', 'Prête', 'Servie'].includes(order.statut)) {
            const statusMessage = order.statut === 'En préparation' ? 'Commande démarrée' : order.statut === 'Prête' ? 'Commande prête à servir' : 'Commande servie, prête à encaisser';
            showToast(`${statusMessage} : #${order.id}`, 'info');
            playOrderAlert();
          }
        });
      }
      previousOrderStatuses.current = Object.fromEntries(nextOrders.map((order) => [order.id, order.statut]));
      setCommandes(nextOrders);
    } catch (error) {
      console.error('Erreur chargement commandes bar:', error);
    }
  };

  const handleCreateCommande = async ({ client, table, nombre_personnes, moyen_paiement, items }: { client: string; table: number; nombre_personnes: number; moyen_paiement: BarPaymentMethod; items: BarCommande['items'] }) => {
    try {
      const normalizedItems = items.map((item) => ({
        product_id: item.product_id,
        nom: item.nom,
        quantite: Number(item.quantite) || 1,
        prix: Number(item.prix) || 0,
        prix_unitaire: Number(item.prix) || 0,
      }));

      const createdOrder = await barService.createBarOrder({ client, table, nombre_personnes, moyen_paiement, items: normalizedItems });
      if (createdOrder) {
        await Promise.all([loadOrders(), fetchData()]);
      }
    } catch (error) {
      console.error('Erreur création commande bar:', error);
      setError("La commande bar n'a pas pu être créée.");
      throw error;
    }
  };

  const handleDeleteCommande = async (id: number) => {
    try {
      await barService.deleteBarOrder(id);
      await loadOrders();
    } catch (error) {
      console.error('Erreur suppression commande bar:', error);
      setError("La commande bar n'a pas pu être supprimée.");
      throw error;
    }
  };

  const handleUpdateStatut = async (id: number, statut: BarCommande['statut']) => {
    const statuses: Record<BarCommande['statut'], BarOrderStatus> = {
      'En attente': 'EN_ATTENTE',
      'En préparation': 'EN_PREPARATION',
      'Prête': 'PRETE',
      'Servie': 'SERVIE',
      'Encaissée': 'ENCAISSEE',
    };

    try {
      await barService.updateBarOrderStatus(id, statuses[statut]);
      await loadOrders();
    } catch (error) {
      console.error('Erreur mise à jour statut commande bar:', error);
      setError("Le statut de la commande bar n'a pas pu être mis à jour.");
      throw error;
    }
  };

  // Fonction pour ajouter instantanément la nouvelle boisson dans le state local
  const handleProductAdded = (newProduct: BarProduct) => {
    setCocktails((prev) => [...prev, newProduct]);
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
      const cocktailsData = Array.isArray(cocktailsRes) ? cocktailsRes : (cocktailsRes as { data?: BarProduct[] }).data;
      const stock = Array.isArray(stockRes) ? stockRes : (stockRes as { data?: BarStockItem[] }).data;
      if (Array.isArray(cocktailsData)) setCocktails(cocktailsData as BarProduct[]);
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

  useEffect(() => {
    void fetchData();
    void loadOrders();
    const refreshOrders = window.setInterval(() => void loadOrders(), 15000);
    return () => window.clearInterval(refreshOrders);
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

      <BarStats commandes={commandes} stockMap={stockMap} />

      <BarTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'bar' && (
        <div className="space-y-6">
          <CocktailMenu
            cocktails={cocktails}
            stockMap={stockMap}
            onStockUpdate={fetchData}
            onProductAdded={handleProductAdded}
            userIsAdmin={userIsAdmin}
          />
          <BestSellers commandes={commandes} />
        </div>
      )}

      {activeTab === 'commandes' && (
        <BarCommandeView commandes={commandes} onCreateCommande={handleCreateCommande} onDeleteCommande={handleDeleteCommande} onUpdateStatut={handleUpdateStatut} cocktails={cocktails} stockMap={stockMap} />
      )}

      {activeTab === 'stock' && (
        <StockManager
          module="bar"
          categories={['Spiritueux', 'Vins', 'Bières', 'Soft', 'Sirop', 'Champagne', 'Autre']}
        />
      )}

      {activeTab === 'rapports' && <BarReports commandes={commandes} stock={Object.entries(stockMap).map(([product_id, value]) => ({ id: Number(product_id), product_id: Number(product_id), location_id: 0, quantite: value.quantite, unite: value.unite, product_nom: cocktails.find((cocktail) => cocktail.id === Number(product_id))?.nom || '', product_categorie: cocktails.find((cocktail) => cocktail.id === Number(product_id))?.categorie || '', location_nom: 'Bar' }))} />}

      {(userIsAdmin || userIsCashier) && activeTab === 'caisse' && (
        <CaisseManager
          module="bar"
          categories={['Ventes Bar', 'Stock', 'Personnel', 'Événement', 'Autre']}
          title="Caisse Bar & Lounge"
          gradient="from-accent to-accent-2"
          pendingOrders={commandes.filter((commande) => commande.statut === 'Servie').map((commande) => ({
            id: commande.id,
            client: commande.client,
            table: commande.table,
            total: commande.total,
            created_at: commande.created_at,
            nombre_personnes: commande.nombre_personnes,
            moyen_paiement: commande.moyen_paiement,
            items: commande.items,
          }))}
          onEncaisserCommande={async (orderId) => {
            await handleUpdateStatut(orderId, 'Encaissée');
          }}
          onRefresh={async () => {
            await Promise.all([loadOrders(), fetchData()]);
          }}
        />
      )}
    </div>
  );
};