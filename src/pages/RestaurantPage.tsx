import React, { useState, useEffect } from 'react';
import { useHDA } from '../context/HDAContext';
import { formatCurrency } from '../utils/data';
import { ShoppingCart, Clock, CheckCircle, TrendingUp } from 'lucide-react';

// Import des composants du dossier Restaurant
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

// Types
import type { 
  TableRestaurant, 
  Order, 
  Product, 
  Category, 
  Client 
} from '../components/Restaurant/types';

export const RestaurantPage: React.FC = () => {
  const { state, dispatch } = useHDA();
  
  // États
  const [activeTab, setActiveTab] = useState('commandes');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Données
  const [tables, setTables] = useState<TableRestaurant[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  
  // Modales
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  
  // Édition
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Chargement des données
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const mockCategories: Category[] = [
        { id: 1, nom: 'Plats' },
        { id: 2, nom: 'Entrées' },
        { id: 3, nom: 'Desserts' },
        { id: 4, nom: 'Boissons' },
        { id: 5, nom: 'Vins' },
        { id: 6, nom: 'Menus' }
      ];
      setCategories(mockCategories);

      const mockProducts: Product[] = [
        { id: 1, category_id: 1, code: 'PROD-001', nom: 'Filet de Bœuf Rossini', unite: 'PIECE', prix_achat: 30, prix_vente: 68, actif: true, type_produit: 'PRODUIT_FINI' },
        { id: 2, category_id: 1, code: 'PROD-002', nom: 'Homard Thermidor', unite: 'PIECE', prix_achat: 45, prix_vente: 95, actif: true, type_produit: 'PRODUIT_FINI' },
        { id: 3, category_id: 2, code: 'PROD-003', nom: 'Soupe de Truffes', unite: 'PORTION', prix_achat: 20, prix_vente: 45, actif: false, type_produit: 'PRODUIT_FINI' },
        { id: 4, category_id: 2, code: 'PROD-004', nom: 'Foie Gras Poêlé', unite: 'PIECE', prix_achat: 18, prix_vente: 38, actif: true, type_produit: 'PRODUIT_FINI' },
        { id: 5, category_id: 6, code: 'PROD-005', nom: 'Menu Dégustation 7 plats', unite: 'PORTION', prix_achat: 85, prix_vente: 185, actif: true, type_produit: 'PRODUIT_FINI' },
        { id: 101, category_id: 1, code: 'ING-001', nom: 'Bœuf', unite: 'KG', prix_achat: 12, prix_vente: 0, actif: true, type_produit: 'MATIERE_PREMIERE' },
        { id: 102, category_id: 1, code: 'ING-002', nom: 'Homard', unite: 'KG', prix_achat: 25, prix_vente: 0, actif: true, type_produit: 'MATIERE_PREMIERE' }
      ];
      setProducts(mockProducts);

      const mockTables: TableRestaurant[] = [
        { id: 1, numero: 'T1', capacite: 4, statut: 'LIBRE' },
        { id: 2, numero: 'T2', capacite: 2, statut: 'OCCUPEE' },
        { id: 3, numero: 'VIP1', capacite: 6, statut: 'LIBRE' },
        { id: 4, numero: 'T3', capacite: 4, statut: 'RESERVEE' },
        { id: 5, numero: 'Terrasse1', capacite: 8, statut: 'LIBRE' }
      ];
      setTables(mockTables);

      const mockClients: Client[] = [
        { id: 1, code_client: 'CL001', nom: 'Rakoto', prenom: 'Jean', telephone: '+261 34 123 4567', email: 'jean@email.com' },
        { id: 2, code_client: 'CL002', nom: 'Rabe', prenom: 'Marie', telephone: '+261 33 987 6543', email: 'marie@email.com' }
      ];
      setClients(mockClients);

      const mockOrders: Order[] = [
        {
          id: 1, client_id: null, source_module: 'RESTAURANT', montant_total: 136,
          statut: 'EN_COURS', created_at: new Date().toISOString(),
          table: mockTables[0],
          items: [{ id: 1, order_id: 1, product_id: 1, quantite: 2, prix_unitaire: 68 }]
        },
        {
          id: 2, client_id: 2, source_module: 'RESTAURANT', montant_total: 185,
          statut: 'PAYEE', created_at: new Date(Date.now() - 3600000).toISOString(),
          table: mockTables[2],
          items: [{ id: 2, order_id: 2, product_id: 5, quantite: 1, prix_unitaire: 185 }]
        }
      ];
      setOrders(mockOrders);
      setLoading(false);
    }, 500);
  }, []);

  // ========== HANDLERS ==========

  // Commandes
  const handleAddOrder = (formData: any) => {
    const table = tables.find(t => t.id === formData.table_id);
    const newOrder: Order = {
      id: orders.length + 1,
      client_id: formData.client_id || null,
      source_module: 'RESTAURANT',
      montant_total: formData.montant_total,
      statut: 'EN_ATTENTE',
      created_at: new Date().toISOString(),
      table: table,
      items: formData.items.map((item: any) => ({
        id: Date.now(),
        order_id: orders.length + 1,
        ...item
      }))
    };
    setOrders([...orders, newOrder]);
    if (table) {
      setTables(tables.map(t => t.id === table.id ? { ...t, statut: 'OCCUPEE' } : t));
    }
  };

  const handleUpdateOrderStatus = (orderId: number, status: Order['statut']) => {
    setOrders(orders.map(o => o.id === orderId ? { ...o, statut: status } : o));
  };

  const handlePayment = (orderId: number) => {
    setOrders(orders.map(o => o.id === orderId ? { ...o, statut: 'PAYEE' } : o));
    const order = orders.find(o => o.id === orderId);
    if (order?.table) {
      setTables(tables.map(t => t.id === order.table!.id ? { ...t, statut: 'LIBRE' } : t));
    }
  };

  const handleCancelOrder = (orderId: number) => {
    if (window.confirm('Annuler cette commande ?')) {
      setOrders(orders.map(o => o.id === orderId ? { ...o, statut: 'ANNULEE' } : o));
    }
  };

  // Tables
  const handleAddTable = (formData: any) => {
    const newTable: TableRestaurant = { id: tables.length + 1, ...formData };
    setTables([...tables, newTable]);
  };

  const handleDeleteTable = (id: number) => {
    if (window.confirm('Supprimer cette table ?')) {
      setTables(tables.filter(t => t.id !== id));
    }
  };

  // Produits
  const handleAddProduct = (formData: any) => {
    const newProduct: Product = {
      ...formData,
      id: products.length + 1,
      code: `PROD-${Date.now()}`,
      prix_achat: 0,
    };
    setProducts([...products, newProduct]);
    setShowProductModal(false);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowProductModal(true);
  };

  const handleUpdateProduct = (formData: any) => {
    if (editingProduct) {
      setProducts(products.map(p => 
        p.id === editingProduct.id ? { ...p, ...formData } : p
      ));
      setEditingProduct(null);
    }
    setShowProductModal(false);
  };

  const handleDeleteProduct = (id: number) => {
    if (window.confirm('Supprimer ce produit ?')) {
      setProducts(products.map(p => p.id === id ? { ...p, actif: false } : p));
    }
  };

  // Clients
  const handleAddClient = (formData: any) => {
    const newClient: Client = {
      id: clients.length + 1,
      code_client: `CL${String(clients.length + 1).padStart(3, '0')}`,
      ...formData
    };
    setClients([...clients, newClient]);
    setShowClientModal(false);
    alert('Client créé avec succès !');
  };

  // Statistiques
  const stats = [
    { label: 'Total Commandes', value: orders.length, icon: <ShoppingCart size={20} className="text-black" /> },
    { label: 'En Cours', value: orders.filter(o => o.statut === 'EN_COURS' || o.statut === 'EN_ATTENTE').length, icon: <Clock size={20} className="text-black" /> },
    { label: 'Payées', value: orders.filter(o => o.statut === 'PAYEE').length, icon: <CheckCircle size={20} className="text-black" /> },
    { label: 'CA Journée', value: formatCurrency(orders.filter(o => o.statut === 'PAYEE').reduce((sum, o) => sum + o.montant_total, 0)), icon: <TrendingUp size={20} className="text-black" /> }
  ];

  return (
    <div className="w-full max-w-full space-y-6 overflow-x-hidden">
      {/* Header avec statistiques */}
      <RestaurantHeader 
        stats={stats} 
        onNewOrder={() => setShowOrderModal(true)} 
      />

      {/* Barre de recherche et filtres */}
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
            onNewOrder={() => setShowOrderModal(true)}
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
            onSelectTable={() => setShowOrderModal(true)}
          />
        )}
        {activeTab === 'stock' && (
          <StockTab products={products} />
        )}
        {activeTab === 'caisse' && (
          <CaisseTab 
            orders={orders}
            onPayment={handlePayment}
          />
        )}
      </div>

      {/* ========== MODALS ========== */}
      
      <OrderModal
        isOpen={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        tables={tables}
        products={products}
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