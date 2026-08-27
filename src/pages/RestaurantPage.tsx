// src/pages/RestaurantPage.tsx
import React, { useState, useEffect } from 'react';
import { useHDA } from '../context/HDAContext';
import { formatCurrency } from '../utils/data';
import { ShoppingCart, Clock, CheckCircle, TrendingUp } from 'lucide-react';

// Composants du module Restaurant
import { RestaurantHeader } from '../components/Restaurant/Entete/RestaurantHeader';
import { RestaurantTabs } from '../components/Restaurant/Tabs/RestaurantTabs';
import { CommandesTab } from '../components/Restaurant/Tabs/CommandesTab';
import { MenuTab } from '../components/Restaurant/Tabs/MenuTab';
import { TablesTab } from '../components/Restaurant/Tabs/TablesTab';
import { StockTab } from '../components/Restaurant/Tabs/StockTab';
import { CaisseTab } from '../components/Restaurant/Tabs/CaisseTab';
import { OrderModal } from '../components/Restaurant/Modals/OrderModal';
import { TableModal } from '../components/Restaurant/Modals/TableModal';
import { ProductModal } from '../components/Restaurant/Modals/ProductModal';
import { ClientModal } from '../components/Restaurant/Modals/ClientModal';

// Services et types
import * as restaurantService from '../services/restaurantService';
import type {
  TableRestaurant,
  Order,
  Product,
  Category,
  Client,
} from '../components/Restaurant/types';

import AuthService from '../services/authService';
import { clientService } from '../services/client.service';
import { getDefaultTabForRole, isAdmin, isCashier } from '../utils/permissions';

export const RestaurantPage: React.FC = () => {
  const { state, dispatch } = useHDA();
  const currentUser = AuthService.getCurrentUser();
  const userIsAdmin = isAdmin(currentUser);
  const userIsCashier = isCashier(currentUser);

  // ---------- États ----------
  const [activeTab, setActiveTab] = useState(() => getDefaultTabForRole('commandes', currentUser?.role));
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(false);

  // Données réelles (tables)
  const [tables, setTables] = useState<TableRestaurant[]>([]);
  const [tablesLoading, setTablesLoading] = useState(false);

  // Données mockées (produits, commandes, clients) – à migrer plus tard
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  // Modales
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // ---------- Chargement initial ----------
  const fetchOrders = async () => {
    try {
      const res = await restaurantService.getOrders();
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setOrders(res.data as Order[]);
      }
    } catch (error) {
      console.warn('Erreur lors du chargement des commandes live:', error);
    }
  };

  useEffect(() => {
    // Charger les tables depuis l'API
    const fetchTables = async () => {
      setTablesLoading(true);
      try {
        const res = await restaurantService.getTables();
        if (res.success) {
          setTables(res.data);
        } else {
          console.warn('Échec du chargement des tables :', res.message);
        }
      } catch (error) {
        console.error('Erreur réseau lors du chargement des tables', error);
      } finally {
        setTablesLoading(false);
      }
    };
    fetchTables();
    fetchOrders();

    // Données mockées de départ
    setCategories([
      { id: 1, nom: 'Plats' },
      { id: 2, nom: 'Entrées' },
      { id: 3, nom: 'Desserts' },
      { id: 4, nom: 'Boissons' },
      { id: 5, nom: 'Vins' },
      { id: 6, nom: 'Menus' },
    ]);
    setProducts([
      { id: 1, category_id: 1, code: 'PROD-001', nom: 'Filet de Bœuf Rossini', unite: 'PIECE', prix_achat: 30, prix_vente: 68, actif: true, type_produit: 'PRODUIT_FINI' },
      { id: 2, category_id: 1, code: 'PROD-002', nom: 'Homard Thermidor', unite: 'PIECE', prix_achat: 45, prix_vente: 95, actif: true, type_produit: 'PRODUIT_FINI' },
      { id: 3, category_id: 2, code: 'PROD-003', nom: 'Soupe de Truffes', unite: 'PORTION', prix_achat: 20, prix_vente: 45, actif: false, type_produit: 'PRODUIT_FINI' },
      { id: 4, category_id: 2, code: 'PROD-004', nom: 'Foie Gras Poêlé', unite: 'PIECE', prix_achat: 18, prix_vente: 38, actif: true, type_produit: 'PRODUIT_FINI' },
      { id: 5, category_id: 6, code: 'PROD-005', nom: 'Menu Dégustation 7 plats', unite: 'PORTION', prix_achat: 85, prix_vente: 185, actif: true, type_produit: 'PRODUIT_FINI' },
      { id: 101, category_id: 1, code: 'ING-001', nom: 'Bœuf', unite: 'KG', prix_achat: 12, prix_vente: 0, actif: true, type_produit: 'MATIERE_PREMIERE' },
      { id: 102, category_id: 1, code: 'Homard', nom: 'Homard', unite: 'KG', prix_achat: 25, prix_vente: 0, actif: true, type_produit: 'MATIERE_PREMIERE' },
    ]);
    setClients([
      { id: 1, code_client: 'CL001', nom: 'Rakoto', prenom: 'Jean', telephone: '+261 34 123 4567', email: 'jean@email.com' },
      { id: 2, code_client: 'CL002', nom: 'Rabe', prenom: 'Marie', telephone: '+261 33 987 6543', email: 'marie@email.com' },
    ]);

    Promise.all([restaurantService.getProducts(), restaurantService.getCategories()])
      .then(([productsRes, categoriesRes]) => {
        if (productsRes.success && Array.isArray(productsRes.data) && productsRes.data.length > 0) setProducts(productsRes.data as Product[]);
        if (categoriesRes.success && Array.isArray(categoriesRes.data) && categoriesRes.data.length > 0) setCategories(categoriesRes.data as Category[]);
      })
      .catch(error => console.error('Erreur lors du chargement du catalogue restaurant', error));
  }, []);

  // ---------- Handlers Tables (API) ----------
  const handleAddTable = async (formData: { numero: string; capacite: number; statut: string }) => {
    try {
      const res = await restaurantService.createTable({
        numero: formData.numero,
        capacite: formData.capacite,
        statut: formData.statut || 'LIBRE',
      });
      if (res.success) {
        setTables(prev => [...prev, res.data]);
      } else {
        console.warn('Erreur création table :', res.message);
      }
    } catch (error) {
      console.error('Erreur création table', error);
    }
  };

  const handleDeleteTable = async (id: number) => {
    if (!window.confirm('Supprimer cette table ?')) return;
    try {
      await restaurantService.deleteTable(id);
      setTables(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('Erreur suppression table', error);
    }
  };

  const handleSelectTable = (_tableId: number) => {
    setShowOrderModal(true);
  };

  // ---------- Handlers Commandes ----------
  const handleAddOrder = async (formData: any) => {
    const table = tables.find(t => t.id === formData.table_id);
    try {
      const res = await restaurantService.createOrder({
        client_id: formData.client_id || undefined,
        table_id: formData.table_id || undefined,
        items: (formData.items || []).map((item: any) => ({
          product_id: item.product_id,
          quantite: item.quantite,
          prix_unitaire: item.prix_unitaire,
        })),
      });
      if (res.success) {
        await fetchOrders();
        setShowOrderModal(false);
        return;
      }
    } catch (err) {
      console.warn('Création commande via API échouée, bascule vers mode local:', err);
    }

    const newOrder: Order = {
      id: orders.length + 1,
      client_id: formData.client_id || null,
      source_module: 'RESTAURANT',
      montant_total: formData.montant_total,
      statut: 'EN_ATTENTE',
      created_at: new Date().toISOString(),
      table: table,
      items: (formData.items || []).map((item: any) => ({
        id: Date.now(),
        order_id: orders.length + 1,
        ...item,
      })),
    };
    setOrders(prev => [...prev, newOrder]);
    if (table) {
      setTables(prev => prev.map(t => t.id === table.id ? { ...t, statut: 'OCCUPEE' } : t));
    }
    setShowOrderModal(false);
  };

  const handleUpdateOrderStatus = async (orderId: number | string, status: Order['statut']) => {
    const numericId = Number(orderId);
    try {
      const res = await restaurantService.updateOrderStatus(numericId, status);
      if (res && res.success) {
        await fetchOrders();
        return;
      }
    } catch (err) {
      console.warn('API update status échoué, bascule vers mode local:', err);
    }
    setOrders(prev => prev.map(o => o.id === numericId ? { ...o, statut: status } : o));
  };

  const handlePayment = async (orderId: number | string) => {
    const numericId = Number(orderId);
    const order = orders.find(o => o.id === numericId);

    // 1. Appel API
    try {
      const res = await restaurantService.processPayment({
        order_id: numericId,
        montant: order?.montant_total || 0,
        moyen_paiement: 'ESPECES',
        client_id: order?.client_id || undefined,
      });
      if (res && res.success) {
        await fetchOrders();
      }
    } catch (err) {
      console.warn('API payment échoué, bascule vers mode local:', err);
    }

    // 2. Mise à jour de l'état local
    setOrders(prev => prev.map(o => o.id === numericId ? { ...o, statut: 'PAYEE' } : o));
    if (order?.table) {
      setTables(prev => prev.map(t => t.id === order.table!.id ? { ...t, statut: 'LIBRE' } : t));
    }

    // 3. Enregistrement dans le HDAContext (Caisse)
    if (order) {
      dispatch({
        type: 'ADD_TRANSACTION',
        payload: {
          type: 'entree',
          montant: order.montant_total || 0,
          description: `Encaissement Commande #${order.id} ${order.table?.numero ? '(Table ' + order.table.numero + ')' : ''}`,
          categorie: 'Ventes Restaurant',
          module: 'restaurant',
          userName: state.currentUser ? `${state.currentUser.prenom} ${state.currentUser.nom}` : 'Caisse',
          heure: new Date().toISOString()
        }
      });
    }
  };

  const handleCancelOrder = async (orderId: number | string) => {
    if (!window.confirm('Annuler cette commande ?')) return;
    const numericId = Number(orderId);
    try {
      const res = await restaurantService.updateOrderStatus(numericId, 'ANNULEE');
      if (res && res.success) {
        await fetchOrders();
        return;
      }
    } catch (err) {
      console.warn('API cancel échoué, bascule vers mode local:', err);
    }
    setOrders(prev => prev.map(o => o.id === numericId ? { ...o, statut: 'ANNULEE' } : o));
    const order = orders.find(o => o.id === numericId);
    if (order?.table) {
      setTables(prev => prev.map(t => t.id === order.table!.id ? { ...t, statut: 'LIBRE' } : t));
    }
  };

  const handleDeleteOrder = async (orderId: number | string) => {
    if (!window.confirm('Supprimer définitivement cette commande ?')) return;

    try {
      await restaurantService.deleteOrder(Number(orderId));
      setOrders(prev => prev.filter(order => order.id !== Number(orderId)));
    } catch (error) {
      console.error('Erreur suppression commande', error);
    }
  };

  const handlePrintInvoice = (orderId: number | string) => {
    const numericId = Number(orderId);
    (async () => {
      try {
        const arrayBuffer = await restaurantService.getInvoicePdf(numericId as number);
        const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);

        const printWindow = window.open('', '_blank', 'width=900,height=700');
        if (!printWindow) {
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = `facture_commande_${numericId}.pdf`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
          return;
        }

        printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Facture #${numericId}</title><style>html,body{height:100%;margin:0}iframe{border:none;width:100%;height:100%}</style></head><body><iframe src="${blobUrl}"></iframe><script>const f=document.querySelector('iframe');f.onload=function(){setTimeout(()=>{try{f.contentWindow.focus();f.contentWindow.print();}catch(e){window.print();}},300);};</script></body></html>`);
        printWindow.document.close();
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
        return;
      } catch (err) {
        console.warn('PDF fetch failed, falling back to HTML view', err);
      }

      try {
        const html = await restaurantService.getInvoiceHtml(numericId as number);
        const printWindow = window.open('', '_blank', 'width=720,height=640');
        if (!printWindow) return alert('Impossible d\'ouvrir une nouvelle fenêtre');
        const autoPrintHtml = html + `<script>window.onload=function(){setTimeout(()=>{window.focus();window.print();},300)}<\/script>`;
        printWindow.document.open();
        printWindow.document.write(autoPrintHtml);
        printWindow.document.close();
      } catch (err) {
        console.error('Erreur récupération facture', err);
        alert('Impossible de récupérer la facture. Vous êtes peut-être déconnecté.');
      }
    })();
  };

  // Produits (mock)
  const handleAddProduct = async (formData: any) => {
    try {
      const res = await restaurantService.createProduct({ ...formData, prix_achat: 0 });
      if (!res.success) throw new Error(res.message || 'Création du produit impossible.');
      setProducts(prev => [...prev, res.data as Product]);
      setShowProductModal(false);
    } catch (error) {
      console.error('Erreur création produit', error);
      alert('Impossible d’ajouter ce plat. Veuillez réessayer.');
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowProductModal(true);
  };

  const handleUpdateProduct = async (formData: any) => {
    if (!editingProduct) return;
    try {
      const res = await restaurantService.updateProduct(editingProduct.id, formData);
      if (!res.success) throw new Error(res.message || 'Modification du produit impossible.');
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? res.data as Product : p));
      setEditingProduct(null);
      setShowProductModal(false);
    } catch (error) {
      console.error('Erreur modification produit', error);
      alert('Impossible de modifier ce plat. Veuillez réessayer.');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (window.confirm('Supprimer ce produit ?')) {
      try {
        await restaurantService.deleteProduct(id);
        setProducts(prev => prev.filter(p => p.id !== id));
      } catch (error) {
        console.error('Erreur suppression produit', error);
        alert('Impossible de supprimer ce plat car il est peut-être déjà utilisé.');
      }
    }
  };

  // Clients
  const handleAddClient = async (formData: any) => {
    try {
      const created = await clientService.createClient(formData);
      setClients(prev => [...prev, created]);
      setShowClientModal(false);
      alert('Client créé avec succès !');
    } catch (err) {
      console.error('Erreur création client', err);
      alert('Impossible de créer le client sur le serveur. Le client a été conservé localement.');
      const newClient: Client = {
        id: clients.length + 1,
        code_client: `CL${String(clients.length + 1).padStart(3, '0')}`,
        ...formData,
      };
      setClients([...clients, newClient]);
      setShowClientModal(false);
    }
  };

  // ---------- Statistiques ----------
  const stats: any[] = [
    { label: 'Total Commandes', value: orders.length, icon: <ShoppingCart size={20} className="text-black" /> },
    { label: 'En Cours', value: orders.filter(o => o.statut === 'EN_COURS' || o.statut === 'EN_ATTENTE').length, icon: <Clock size={20} className="text-black" /> },
    { label: 'Payées', value: orders.filter(o => o.statut === 'PAYE' || o.statut === 'PAYEE').length, icon: <CheckCircle size={20} className="text-black" /> },
    { label: 'CA Journée', value: formatCurrency(orders.filter(o => o.statut === 'PAYE' || o.statut === 'PAYEE').reduce((sum, o) => sum + o.montant_total, 0)), icon: <TrendingUp size={20} className="text-black" /> },
  ];

  return (
    <div className="w-full max-w-full space-y-6 overflow-x-hidden">
      {/* Header avec statistiques */}
      <RestaurantHeader stats={stats} onNewOrder={() => setShowOrderModal(true)} />

      {/* Barre de recherche et filtres - Masquée uniquement sur l'onglet menu */}
      {activeTab !== 'menu' && (
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-xl text-primary placeholder-subtle text-sm"
              style={{
                backgroundColor: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                outline: 'none',
              }}
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full sm:w-48 h-10 rounded-xl text-primary text-sm px-4"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              outline: 'none',
            }}
          >
            <option value="">Tous les statuts</option>
            <option value="EN_ATTENTE">En attente</option>
            <option value="EN_COURS">En cours</option>
            <option value="SERVIE">Servie</option>
            <option value="PAYEE">Payée</option>
          </select>
        </div>
      )}

      {/* Onglets */}
      <RestaurantTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Contenu des onglets */}
      <div className="w-full">
        {activeTab === 'commandes' && (
          <CommandesTab
            orders={orders}
            products={products}
            onUpdateStatus={handleUpdateOrderStatus}
            onPayment={handlePayment}
            onCancel={handleCancelOrder}
            onDelete={handleDeleteOrder}
            onNewOrder={() => setShowOrderModal(true)}
            onInvoice={handlePrintInvoice}
          />
        )}
        {activeTab === 'menu' && (
          <MenuTab
            products={products}
            categories={categories}
            onAddProduct={() => {
              setEditingProduct(null);
              setShowProductModal(true);
            }}
            onEditProduct={handleEditProduct}
            onDeleteProduct={handleDeleteProduct}
          />
        )}
        {activeTab === 'tables' && (
          <TablesTab
            tables={tables}
            onAddTable={() => setShowTableModal(true)}
            onDeleteTable={handleDeleteTable}
            onSelectTable={handleSelectTable}
          />
        )}
        {activeTab === 'stock' && <StockTab />}
        {(userIsAdmin || userIsCashier) && activeTab === 'caisse' && (
          <CaisseTab orders={orders} onPayment={handlePayment} />
        )}
      </div>

      {/* Modales */}
      <OrderModal
        isOpen={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        tables={tables}
        products={products}
        categories={categories}
        clients={clients}
        onSubmit={handleAddOrder}
        onNewClient={() => setShowClientModal(true)}
      />
      <TableModal
        isOpen={showTableModal}
        onClose={() => setShowTableModal(false)}
        onSubmit={handleAddTable}
      />
      <ProductModal
        isOpen={showProductModal}
        onClose={() => {
          setShowProductModal(false);
          setEditingProduct(null);
        }}
        onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct}
        categories={categories}
        editingProduct={editingProduct}
      />
      <ClientModal
        isOpen={showClientModal}
        onClose={() => setShowClientModal(false)}
        onSubmit={handleAddClient}
      />
    </div>
  );
};