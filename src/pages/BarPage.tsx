import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle } from 'lucide-react';
import { StockManager, CaisseManager } from '../components/StockManager';
import barService from '../services/bar.service';
import * as restaurantService from '../services/restaurantService';
import { BarPaymentMethod, BarProduct, BarStockItem } from '../types/bar.type';
import type { Product as RestaurantProduct } from '../types/restaurant';

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
import { PafSection } from '../components/Bar/PafSection';
import { BarHistory } from '../components/Bar/BarHistory';
import { ProductHistory } from '../components/Bar/ProductHistory';
import { BarEquipmentManager } from '../components/Bar/BarEquipmentManager';
import type { BarCommande } from '../types/bar.type';
import type { BarOrderStatus } from '../services/bar.service';

import AuthService from '../services/authService';
import { getDefaultTabForRole, isAdmin, isCashier, isBarman, isHostess, parseUserModules } from '../utils/permissions';
import { useToast } from '../context/ToastContext';
import { printOrderInvoice } from '../utils/thermalPrint';

export const BarPage: React.FC = () => {
  const currentUser = AuthService.getCurrentUser();
  const userIsAdmin = isAdmin(currentUser);
  const userIsCashier = isCashier(currentUser);
  const userIsBarman = isBarman(currentUser);
  const userIsHostess = isHostess(currentUser);
  const userIsServer = currentUser?.role === 'serveur';
  const canLoadRestaurantProducts = !userIsCashier
    && (!userIsServer || parseUserModules(currentUser?.module).includes('restaurant'));
  const { showToast } = useToast();
  const previousOrderStatuses = useRef<Record<number, string> | null>(null);

  const [activeTab, setActiveTab] = useState<BarTabId>(() => getDefaultTabForRole('commandes', currentUser?.role) as BarTabId);

  const [cocktails, setCocktails] = useState<BarProduct[]>([]);
  const [restaurantMenuProducts, setRestaurantMenuProducts] = useState<BarProduct[]>([]);
  const [restaurantBarProducts, setRestaurantBarProducts] = useState<BarProduct[]>([]);
  const [stockMap, setStockMap] = useState<Record<number, { quantite: number; unite: string }>>({});
  const [commandes, setCommandes] = useState<BarCommande[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const orderStatusLabels: Record<string, BarCommande['statut']> = {
    EN_ATTENTE: 'En attente',
    EN_PREPARATION: 'En préparation',
    PRETE: 'Prête',
    SERVIE: 'Servie',
    ENCAISSEE: 'Encaissée',
    ANNULEE: 'Annulée',
  };

  const getOrderDisplayName = (order: BarCommande) => {
    const clientName = String(order.client || '').trim();
    if (clientName && clientName.toLocaleLowerCase('fr-FR') !== 'client anonyme') return clientName;

    const creatorName = [order.creator_prenom, order.creator_nom].filter(Boolean).join(' ').trim();
    return creatorName || clientName || 'Client anonyme';
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
        observation: order.observation,
        statut: orderStatusLabels[order.statut] || (order.statut as BarCommande['statut']),
        total: Number(order.total || 0),
        created_at: order.created_at,
        created_by: order.created_by ?? null,
        creator_nom: order.creator_nom || null,
        creator_prenom: order.creator_prenom || null,
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

  const handleCreateCommande = async ({ client, table, nombre_personnes, moyen_paiement, observation, items, hotel_reservation_id, room_id, room_guest_name, room_account_paid }: { client: string; table: number; nombre_personnes: number; moyen_paiement: BarPaymentMethod; observation?: string; items: BarCommande['items']; hotel_reservation_id?: number | null; room_id?: number | null; room_guest_name?: string | null; room_account_paid?: boolean }) => {
    try {
      const normalizedItems = items
        .map((item) => ({
          product_id: Number(item.product_id ?? 0),
          nom: String(item.nom || '').trim(),
          quantite: Number(item.quantite) || 1,
          prix: Number(item.prix) || 0,
          prix_unitaire: Number(item.prix) || 0,
          source_module: item.source_module || 'BAR',
        }))
        .filter((item) => item.product_id > 0 && item.nom && item.quantite > 0);

      if (!normalizedItems.length) {
        throw new Error('La commande doit contenir au moins un article valide.');
      }

      const safeTable = Number(table) || 0;
      const safeGuestCount = Number(nombre_personnes) || 1;
      const safePayment = String(moyen_paiement || 'ESPECES').trim().toUpperCase() as BarPaymentMethod;

      const createdOrder = await barService.createBarOrder({ client, table: safeTable, nombre_personnes: safeGuestCount, moyen_paiement: safePayment, observation, items: normalizedItems, hotel_reservation_id, room_id, room_guest_name, room_account_paid });
      if (createdOrder) {
        await Promise.all([loadOrders(), fetchData()]);
        setError(null);
        showToast('Commande créée avec succès.', 'success');
      }
    } catch (error) {
      console.error('Erreur création commande bar:', error);
      const apiError = error as { response?: { data?: { error?: { message?: string } } }; message?: string };
      const message = apiError.response?.data?.error?.message || apiError.message || "La commande bar n'a pas pu être créée.";
      setError(message);
      showToast(message, 'error');
      throw error;
    }
  };

  const handleUpdateCommande = async ({ id, client, table, nombre_personnes, moyen_paiement, observation, items, hotel_reservation_id, room_id, room_guest_name, room_account_paid }: { id: number; client: string; table: number; nombre_personnes: number; moyen_paiement: BarPaymentMethod; observation?: string; items: BarCommande['items']; hotel_reservation_id?: number | null; room_id?: number | null; room_guest_name?: string | null; room_account_paid?: boolean }) => {
    try {
      const normalizedItems = items
        .map((item) => ({
          product_id: Number(item.product_id ?? 0),
          nom: String(item.nom || '').trim(),
          quantite: Number(item.quantite) || 1,
          prix: Number(item.prix) || 0,
          prix_unitaire: Number(item.prix) || 0,
          source_module: item.source_module || 'BAR',
        }))
        .filter((item) => item.product_id > 0 && item.nom && item.quantite > 0);

      if (!normalizedItems.length) {
        throw new Error('La commande doit contenir au moins un article valide.');
      }

      const safeTable = Number(table) || 0;
      const safeGuestCount = Number(nombre_personnes) || 1;
      const safePayment = String(moyen_paiement || 'ESPECES').trim().toUpperCase() as BarPaymentMethod;

      await barService.updateBarOrder(id, {
        client,
        table: safeTable,
        nombre_personnes: safeGuestCount,
        moyen_paiement: safePayment,
        observation,
        items: normalizedItems,
        hotel_reservation_id,
        room_id,
        room_guest_name,
        room_account_paid,
      });
      await Promise.all([loadOrders(), fetchData()]);
    } catch (error) {
      console.error('Erreur modification commande bar:', error);
      setError("La commande bar n'a pas pu être modifiée.");
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

  const handleUpdateStatut = async (id: number, statut: BarCommande['statut'], moyenPaiement?: NonNullable<BarCommande['moyen_paiement']>) => {
    const statuses: Record<BarCommande['statut'], BarOrderStatus> = {
      'En attente': 'EN_ATTENTE',
      'En préparation': 'EN_PREPARATION',
      'Prête': 'PRETE',
      'Servie': 'SERVIE',
      'Encaissée': 'ENCAISSEE',
      'Annulée': 'ANNULEE',
    };

    try {
      await barService.updateBarOrderStatus(id, statuses[statut], moyenPaiement);
      await loadOrders();
    } catch (error) {
      console.error('Erreur mise à jour statut commande bar:', error);
      setError("Le statut de la commande bar n'a pas pu être mis à jour.");
      throw error;
    }
  };

  const handlePrintBarInvoice = (orderId: number) => {
    const order = commandes.find((commande) => commande.id === orderId);
    if (!order) {
      showToast('La commande est introuvable ; la facture ne peut pas être imprimée.', 'error');
      return;
    }

    printOrderInvoice({
      module: 'BAR',
      orderId: order.id,
      status: order.statut,
      client: order.client,
      table: order.table ? `Table ${order.table}` : order.observation || 'Sans table',
      date: order.created_at,
      notes: order.observation,
      items: order.items.map((item) => ({
        name: item.nom,
        quantity: item.quantite,
        unitPrice: item.prix,
      })),
      total: order.total,
    });
  };

  const handleProductAdded = (newProduct: BarProduct) => {
    setCocktails((prev) => [...prev, newProduct]);
  };

  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cocktailsRes, stockRes, restaurantProductsRes] = await Promise.all([
        barService.getBarProducts(),
        barService.getBarStock(),
        !canLoadRestaurantProducts
          ? Promise.resolve(null)
          : restaurantService.getProducts({ actif: true }).catch((error) => {
          console.warn('Impossible de charger les menus Pizza et Carte Sélectionner du Restaurant dans les commandes Bar', error);
          return null;
          }),
      ]);
      const cocktailsData = Array.isArray(cocktailsRes) ? cocktailsRes : (cocktailsRes as { data?: BarProduct[] }).data;
      const stock = Array.isArray(stockRes) ? stockRes : (stockRes as { data?: BarStockItem[] }).data;
      const baseCocktails = Array.isArray(cocktailsData) ? (cocktailsData as BarProduct[]) : [];
      setCocktails(baseCocktails);
      const restaurantProducts = restaurantProductsRes?.success && Array.isArray(restaurantProductsRes.data)
        ? restaurantProductsRes.data as Array<RestaurantProduct & { category_nom?: string }>
        : [];
      setRestaurantBarProducts(restaurantProducts
        .filter((product) => Boolean(product.afficher_dans_bar))
        .map((product) => ({
          id: -Number(product.id),
          restaurant_product_id: Number(product.id),
          source_module: 'RESTAURANT',
          nom: product.nom,
          ingredients: '',
          prix: Number(product.prix_vente || 0),
          categorie: product.category_nom || 'Plats',
          alcool: false,
        })));
      const selectedCategories = new Set(['pizza', 'carte selectionner', 'carte selectionnee']);
      const normalizeCategory = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
      setRestaurantMenuProducts(restaurantProducts
        .filter((product) => selectedCategories.has(normalizeCategory(product.category_nom || '')))
        .map((product) => ({
          id: -Number(product.id),
          restaurant_product_id: Number(product.id),
          source_module: 'RESTAURANT',
          nom: product.nom,
          ingredients: '',
          prix: Number(product.prix_vente || 0),
          categorie: product.category_nom || 'Pizza',
          alcool: false,
        })));
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
    // Les commandes et les statuts de table sont partagés entre les postes.
    const refreshOrders = window.setInterval(() => void loadOrders(), 5_000);
    return () => window.clearInterval(refreshOrders);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400 text-lg">Chargement du Bar & Lounge...</div>
      </div>
    );
  }

  const filteredCommandes = commandes.filter((commande) => {
    const search = searchQuery.trim().toLowerCase();
    const matchesSearch = !search
      || String(commande.client || '').toLowerCase().includes(search)
      || String(commande.table || '').toLowerCase().includes(search)
      || String(commande.id).includes(search);
    const matchesStatus = !filterStatus
      || String(commande.statut).toUpperCase().replaceAll(' ', '_') === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <BarHeader compact={activeTab === 'bar'} />

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {!userIsBarman && !userIsHostess && !userIsServer && (
        <div>
          <BarStats commandes={commandes} stockMap={stockMap} compact={activeTab === 'bar'} />
        </div>
      )}

      {activeTab !== 'bar' && (
        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="h-10 flex-1 rounded-xl border border-base bg-surface-2 px-4 pl-9 text-sm text-primary placeholder:text-subtle outline-none"
          />
          <select
            value={filterStatus}
            onChange={(event) => setFilterStatus(event.target.value)}
            className="h-10 w-full rounded-xl border border-base bg-surface-2 px-4 text-sm text-primary outline-none sm:w-48"
          >
            <option value="">Tous les statuts</option>
            <option value="EN_ATTENTE">En attente</option>
            <option value="EN_PREPARATION">En préparation</option>
            <option value="PRETE">Prête</option>
            <option value="SERVIE">Servie</option>
            <option value="ENCAISSEE">Payée</option>
          </select>
        </div>
      )}

      <div>
        <BarTabs activeTab={userIsBarman || userIsHostess ? 'commandes' : activeTab} onTabChange={setActiveTab} compact={activeTab === 'bar'} />
      </div>

      {!userIsCashier && activeTab === 'bar' && (
        <div className="space-y-6">
          <div>
            <CocktailMenu
              cocktails={[...cocktails, ...restaurantBarProducts]}
              stockMap={stockMap}
              onStockUpdate={fetchData}
              onProductAdded={handleProductAdded}
              userIsAdmin={userIsAdmin}
              compact
            />
          </div>
          <div className="lg:hidden">
            <BestSellers commandes={commandes} />
          </div>
          <details className="hidden rounded-xl border border-base bg-surface px-4 py-2 lg:block lg:shrink-0">
            <summary className="cursor-pointer text-sm font-semibold text-primary">Meilleures ventes</summary>
            <div className="mt-3 max-h-48 overflow-y-auto">
              <BestSellers commandes={commandes} showTitle={false} />
            </div>
          </details>
        </div>
      )}

      {userIsAdmin && activeTab === 'equipement' && <BarEquipmentManager />}

      {activeTab === 'commandes' && (
        <BarCommandeView
          visible
          commandes={filteredCommandes}
          onCreateCommande={handleCreateCommande}
          onUpdateCommande={handleUpdateCommande}
          onDeleteCommande={handleDeleteCommande}
          onUpdateStatut={handleUpdateStatut}
          cocktails={[...cocktails, ...restaurantMenuProducts]}
          stockMap={stockMap}
        />
      )}

      {activeTab === 'paf' && <PafSection />}

      {activeTab === 'stock' && (
        <StockManager
          module="bar"
          categories={['Spiritueux', 'Vins', 'Bières', 'Soft', 'Sirop', 'Champagne', 'Autre']}
        />
      )}

      {activeTab === 'rapports' && <BarReports commandes={commandes} stock={Object.entries(stockMap).map(([product_id, value]) => ({ id: Number(product_id), product_id: Number(product_id), location_id: 0, quantite: value.quantite, unite: value.unite, product_nom: cocktails.find((cocktail) => cocktail.id === Number(product_id))?.nom || '', product_categorie: cocktails.find((cocktail) => cocktail.id === Number(product_id))?.categorie || '', location_nom: 'Bar' }))} />}

      {userIsAdmin && activeTab === 'historique' && <BarHistory />}

      {userIsAdmin && activeTab === 'historique-produits' && <ProductHistory />}

      {(userIsAdmin || userIsCashier) && activeTab === 'caisse' && (
        <div className="w-full">
          <CaisseManager
            module="bar"
            categories={['Ventes Bar', 'Stock', 'Personnel', 'Événement', 'Autre']}
            title="Caisse Bar & Lounge"
            gradient="from-accent to-accent-2"
            pendingOrders={commandes.filter((commande) => commande.statut === 'Servie').map((commande) => ({
              id: commande.id,
              client: getOrderDisplayName(commande),
              table: commande.table,
              total: commande.total,
              created_at: commande.created_at,
              nombre_personnes: commande.nombre_personnes,
              moyen_paiement: commande.moyen_paiement,
              items: commande.items,
            }))}
            allOrders={commandes.filter((commande) => commande.statut !== 'Annulée').map((commande) => ({
              id: commande.id,
              client: getOrderDisplayName(commande),
              table: commande.table,
              total: commande.total,
              statut: commande.statut,
              moyen_paiement: commande.moyen_paiement,
              created_at: commande.created_at,
              items: commande.items.map((item) => ({
                nom: item.nom,
                quantite: item.quantite,
                prix: item.prix,
                categorie: cocktails.find((product) => product.id === item.product_id)?.categorie || 'Autre',
              })),
            }))}
            onEncaisserCommande={async (orderId, paymentMethod) => {
              await handleUpdateStatut(orderId, 'Encaissée', paymentMethod as BarPaymentMethod);
            }}
            onInvoiceOrder={handlePrintBarInvoice}
            onCloseAllOrders={async (orderIds) => {
              await barService.closeAllBarOrders(orderIds);
            }}
            onRefresh={async () => {
              await Promise.all([loadOrders(), fetchData()]);
            }}
          />
        </div>
      )}
    </div>
  );
};
