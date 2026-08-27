import React, { useState, useEffect } from 'react';
import { useHDA } from '../context/HDAContext';
import { ModuleType, StockItem } from '../types';
import { DataTable, Modal, Input, Select, Button, Badge, CaisseCard } from '../components/UI';
import BarTransactionsCard from './Bar/BarTransactionsCard';
import { formatCurrency } from '../utils/data';
import { financeService, FinancialTransaction, isFinancialInflow, isFinancialOutflow } from '../services/finance.service';
import api from '../lib/api';
import { Plus, Package, Edit2, Trash2, Search, Loader2, AlertCircle, DollarSign, RefreshCw, Printer, LockKeyhole } from 'lucide-react';
import AuthService from '../services/authService';
import { isAdmin } from '../utils/permissions';
import barService from '../services/bar.service';
import type { BarSession } from '../types/bar.type';

interface StockManagerProps {
  module: ModuleType;
  categories: string[];
}

interface BackendStockItem {
  id: number;
  product_nom?: string | null;
  product_unite?: string | null;
  quantite: number | null;
  seuil_minimum: number | null;
  unite: string | null;
  nom: string | null;
  categorie: string | null;
  prix: number | null;
}

export const StockManager: React.FC<StockManagerProps> = ({ module, categories }) => {
  const { state, dispatch, getModuleStock, addNotification } = useHDA();
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<StockItem | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [form, setForm] = useState({
    nom: '', categorie: categories[0], quantite: 0, unite: '',
    prixUnitaire: 0, seuilMinimum: 0, fournisseur: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendStock, setBackendStock] = useState<BackendStockItem[]>([]);
  const apiBase = module === 'bar'
    ? '/api/bar/stock'
    : module === 'hotel'
      ? '/api/stock/stocks/with-products?location_id=5'
      : '/api/hebergement/stock';

  const isBar = module === 'bar';
  const isHebergement = module === 'hebergement';
  const isHotel = module === 'hotel';
  const useBackend = isBar || isHebergement || isHotel;

  const getErrorMessage = (err: unknown) => {
    if (typeof err === 'object' && err !== null && 'response' in err) {
      const response = (err as { response?: { data?: { message?: string; error?: { message?: string } } } }).response;
      return response?.data?.message || response?.data?.error?.message || 'Erreur réseau';
    }
    return err instanceof Error ? err.message : 'Erreur de connexion';
  };

  const refetchStock = async () => {
    if (!useBackend) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(apiBase);
      const payload = response.data?.data ?? response.data;
      setBackendStock(Array.isArray(payload) ? payload : []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (useBackend) {
      void refetchStock();
    } else {
      setBackendStock([]);
      setError(null);
    }
  }, [useBackend, module]);

  const contextItems = getModuleStock(module);

  const items = useBackend
    ? backendStock.map((bs) => ({
        id: String(bs.id),
        nom: bs.nom || bs.product_nom || '',
        categorie: bs.categorie || (isBar ? 'Bar' : 'Hôtel'),
        quantite: bs.quantite ?? 0,
        unite: bs.unite || bs.product_unite || 'unités',
        prixUnitaire: bs.prix ?? 0,
        seuilMinimum: bs.seuil_minimum ?? 5,
        fournisseur: '',
        status: (bs.quantite ?? 0) === 0 ? 'epuise' : (bs.quantite ?? 0) <= (bs.seuil_minimum ?? 5) ? 'faible' : 'disponible',
        module: isBar ? 'bar' : isHotel ? 'hotel' : 'hebergement' as ModuleType,
        createdAt: '',
        updatedAt: '',
      })) as unknown as StockItem[]
    : contextItems;

  const filtered = items.filter(item => {
    const matchSearch = item.nom.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const computeStatus = (qty: number, seuil: number) => {
    if (qty === 0) return 'epuise';
    if (qty <= seuil) return 'faible';
    return 'disponible';
  };

  const notifyStockLevel = (nom: string, quantite: number, unite: string) => {
    const source = module === 'bar' ? 'Bar' : module === 'restaurant' ? 'Restaurant' : module;
    const actionUrl = `/${module}?tab=stock`;

    if (quantite <= 3) {
      addNotification('error', `Stock critique: ${nom} (${quantite} ${unite})`, source, actionUrl);
    } else if (quantite <= 5) {
      addNotification('warning', `Stock faible: ${nom} (${quantite} ${unite})`, source, actionUrl);
    }
  };

  const handleSubmit = async () => {
    const nom = form.nom.trim();
    const quantite = Number(form.quantite);
    const prixUnitaire = Number(form.prixUnitaire);
    const seuilMinimum = Number(form.seuilMinimum);

    if (!nom) {
      setError('Le nom du produit est requis.');
      return;
    }
    if (!Number.isFinite(quantite) || quantite < 0 || !Number.isFinite(prixUnitaire) || prixUnitaire < 0 || !Number.isFinite(seuilMinimum) || seuilMinimum < 0) {
      setError('La quantité, le prix et le seuil doivent être des nombres positifs.');
      return;
    }
    const status = computeStatus(quantite, seuilMinimum);

    if (useBackend) {
      setLoading(true);
      setError(null);
      try {
        const payload = {
          nom,
          categorie: form.categorie || (isBar ? 'Bar' : 'Hébergement'),
          quantite,
          prix: prixUnitaire,
          prixUnitaire,
          price: prixUnitaire,
          unite: form.unite.trim() || 'unités',
          seuil_minimum: seuilMinimum,
          seuilMinimum,
          ...(isBar && { ingredients: '', alcool: true }),
        };

        if (editItem && editItem.id) {
          await api.put(`${apiBase}/${editItem.id}`, payload);
        } else {
          await api.post(apiBase, payload);
        }

        await refetchStock();
        
        notifyStockLevel(nom, quantite, form.unite);
        
        setShowModal(false);
        setEditItem(null);
        setForm({ nom: '', categorie: categories[0] || (isBar ? 'Bar' : 'Hébergement'), quantite: 0, unite: '', prixUnitaire: 0, seuilMinimum: 0, fournisseur: '' });
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (editItem) {
      dispatch({ type: 'UPDATE_STOCK_ITEM', payload: {
        ...editItem, ...form, status, updatedAt: new Date().toISOString()
      }});
      
      notifyStockLevel(nom, quantite, form.unite);
    } else {
      dispatch({ type: 'ADD_STOCK_ITEM', payload: { ...form, status, module } });
      
      notifyStockLevel(nom, quantite, form.unite);
    }

    setShowModal(false);
    setEditItem(null);
    setForm({ nom: '', categorie: categories[0], quantite: 0, unite: '', prixUnitaire: 0, seuilMinimum: 0, fournisseur: '' });
  };

  const openEdit = async (item: StockItem) => {
    const adminPassword = window.prompt('Mot de passe administrateur requis pour modifier le stock :');
    if (!adminPassword) return;
    try {
      await api.post('/api/auth/verify-admin-password', { password: adminPassword });
    } catch (err) {
      setError(getErrorMessage(err));
      return;
    }
    setEditItem(item);
    setForm({ nom: item.nom || '', categorie: item.categorie || categories[0], quantite: item.quantite ?? 0, unite: item.unite || '', prixUnitaire: item.prixUnitaire ?? 0, seuilMinimum: item.seuilMinimum ?? 5, fournisseur: item.fournisseur || '' });
    setShowModal(true);
  };

  const currentUser = AuthService.getCurrentUser();
  const userIsAdmin = isAdmin(currentUser);

  const totalValue = items.reduce((sum, i) => sum + (i.quantite * i.prixUnitaire), 0);
  const alerts = items.filter(i => i.status !== 'disponible').length;

  const baseColumns = [
    { key: 'nom', label: 'Produit', render: (item: StockItem) => (
      <div>
        <p className="text-white font-medium">{item.nom}</p>
        <p className="text-slate-500 text-xs">{item.categorie}</p>
      </div>
    )},
    { key: 'quantite', label: 'Stock', render: (item: StockItem) => (
      <div>
        <p className="text-white font-semibold">{item.quantite} {item.unite}</p>
        <p className="text-slate-600 text-xs">Min: {item.seuilMinimum}</p>
      </div>
    )},
    { key: 'prixUnitaire', label: 'Prix Unit.', render: (item: StockItem) => (
      <span className="text-white">{formatCurrency(item.prixUnitaire)}</span>
    )},
    { key: 'valeur', label: 'Valeur', render: (item: StockItem) => (
      <span className="text-amber-400 font-semibold">{formatCurrency(item.quantite * item.prixUnitaire)}</span>
    )},
    { key: 'status', label: 'Statut', render: (item: StockItem) => (
      <Badge variant={item.status}>
        {item.status === 'disponible' ? 'Disponible' : item.status === 'faible' ? 'Faible' : 'Épuisé'}
      </Badge>
    )},
  ];

  const columns = userIsAdmin ? [
    ...baseColumns,
    { key: 'actions', label: '', render: (item: StockItem) => (
      <div className="flex gap-2">
        <button onClick={() => openEdit(item)} className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all" title="Modifier l'article">
          <Edit2 size={14} />
        </button>
        <button onClick={async () => {
          if (!window.confirm(`Supprimer ${item.nom} ?`)) return;
          if (useBackend) {
            setLoading(true);
            setError(null);
            try {
              await api.delete(`${apiBase}/${item.id}`);
              await refetchStock();
              if (editItem?.id === item.id) {
                setShowModal(false);
                setEditItem(null);
              }
            } catch (err) {
              setError(getErrorMessage(err));
            } finally {
              setLoading(false);
            }
          } else {
            dispatch({ type: 'DELETE_STOCK_ITEM', payload: item.id });
          }
        }} className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400 transition-all" title="Supprimer l'article">
          <Trash2 size={14} />
        </button>
      </div>
    )},
  ] : baseColumns;

  return (
    <div className="space-y-6">
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-amber-400 mr-2" size={20} />
          <span className="text-slate-400 text-sm">Chargement du stock...</span>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          {error} — Affichage des données en cache.
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Produits', value: items.length, color: 'text-white', sub: 'articles total' },
              { label: 'Valeur Totale', value: formatCurrency(totalValue), color: 'text-amber-400', sub: 'en stock' },
              { label: 'Alertes', value: alerts, color: alerts > 0 ? 'text-amber-400' : 'text-emerald-400', sub: 'à surveiller' },
              { label: 'Épuisés', value: items.filter(i => i.status === 'epuise').length, color: 'text-red-400', sub: 'rupture de stock' },
            ].map(stat => (
              <div key={stat.label} className="bg-slate-900 border border-slate-800/50 rounded-2xl p-4">
                <p className="text-slate-500 text-xs font-medium mb-1">{stat.label}</p>
                <p className={`${stat.color} font-bold text-xl`}>{stat.value}</p>
                <p className="text-slate-600 text-xs">{stat.sub}</p>
              </div>
            ))}
          </div>

          <div className="bg-slate-900 border border-slate-800/50 rounded-2xl overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-4 border-b border-slate-800/50">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Package size={18} className="text-amber-400" />
                Inventaire
              </h3>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="w-full sm:w-48 h-9 pl-9 pr-3 bg-slate-800 border border-slate-700/50 rounded-xl text-slate-300 placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500/50" />
                </div>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="h-9 px-3 bg-slate-800 border border-slate-700/50 rounded-xl text-slate-300 text-sm focus:outline-none">
                  <option value="all">Tous</option>
                  <option value="disponible">Disponible</option>
                  <option value="faible">Faible</option>
                  <option value="epuise">Épuisé</option>
                </select>
                {userIsAdmin && (
                  <Button icon={<Plus size={16} />} onClick={() => { setEditItem(null); setShowModal(true); }}>
                    Ajouter
                  </Button>
                )}
              </div>
            </div>
            <DataTable data={filtered} columns={columns} />
          </div>

          <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditItem(null); }} title={editItem ? 'Modifier l\'article' : 'Ajouter un article'}>
            <div className="space-y-4">
              <Input label="Nom du produit" value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} placeholder="Ex: Filet de Boeuf" />
              <Select label="Catégorie" value={form.categorie} onChange={e => setForm({...form, categorie: e.target.value})} options={categories.map(c => ({ value: c, label: c }))} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Quantité" type="number" value={form.quantite} onChange={e => setForm({...form, quantite: Number(e.target.value)})} />
                <Input label="Unité" value={form.unite} onChange={e => setForm({...form, unite: e.target.value})} placeholder="kg, pièce, litre..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Prix unitaire (MGA)" type="number" value={form.prixUnitaire} onChange={e => setForm({...form, prixUnitaire: Number(e.target.value)})} />
                <Input label="Seuil minimum" type="number" value={form.seuilMinimum} onChange={e => setForm({...form, seuilMinimum: Number(e.target.value)})} />
              </div>
              <Input label="Fournisseur (optionnel)" value={form.fournisseur} onChange={e => setForm({...form, fournisseur: e.target.value})} />
              <div className="flex gap-3 pt-2">
                <Button variant="secondary" onClick={() => { setShowModal(false); setEditItem(null); }} className="flex-1">Annuler</Button>
                <Button onClick={handleSubmit} className="flex-1">{editItem ? 'Mettre à jour' : 'Ajouter'}</Button>
              </div>
            </div>
          </Modal>
         </>
       )}
    </div>
  );
};

interface CaisseManagerProps {
  module: ModuleType;
  categories: string[];
  title?: string;
  gradient?: string;
  pendingOrders?: Array<{
    id: number;
    client?: string;
    table?: string | number;
    total: number;
    created_at?: string;
    nombre_personnes?: number;
    moyen_paiement?: string;
    items?: Array<{ nom?: string; product_nom?: string; quantite: number; prix?: number; prix_unitaire?: number }>;
  }>;
  allOrders?: Array<{
    id: number;
    client?: string;
    table?: string | number;
    total: number;
    statut?: string;
    moyen_paiement?: string;
    created_at?: string;
    items?: Array<{ nom?: string; quantite: number; prix?: number; categorie?: string }>;
  }>;
  onEncaisserCommande?: (orderId: number) => Promise<void> | void;
  onRefresh?: () => Promise<void> | void;
}

export const CaisseManager: React.FC<CaisseManagerProps> = ({ module, categories, title, gradient = 'from-amber-500 to-orange-500', pendingOrders = [], allOrders = [], onEncaisserCommande, onRefresh }) => {
  const { state, dispatch, getModuleStock, getModuleCaisseSolde } = useHDA();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ type: 'entree', montant: 0, description: '', categorie: categories[0] });
  const [backendTransactions, setBackendTransactions] = useState<FinancialTransaction[]>([]);
  const [moduleStockSummary, setModuleStockSummary] = useState<{ entrees: number; sorties: number; solde: number } | null>(null);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [currentBarSession, setCurrentBarSession] = useState<BarSession | null>(null);
  const [isClosingBarSession, setIsClosingBarSession] = useState(false);

  const isBar = module === 'bar';
  const isHebergement = module === 'hebergement';
  const isHotel = module === 'hotel';
  const isBackendCaisse = module === 'restaurant' || module === 'hebergement' || module === 'hotel' || module === 'bar';
  const canViewBarBalance = !isBar || isAdmin(AuthService.getCurrentUser());
  const transactionTitle = isBar
    ? 'Transactions Bar'
    : isHebergement
      ? 'Transactions Hébergement'
      : isHotel
        ? 'Transactions Hôtel'
        : 'Transactions Restaurant';

  useEffect(() => {
    if (!isBackendCaisse) return;

    Promise.all([
      financeService.getTransactions({ module: module.toUpperCase() }),
      financeService.getFinancialStats(),
    ])
      .then(([transactions, stats]) => {
        setBackendTransactions(transactions);
        const summary = stats.modules.find((item) => item.module.toLowerCase() === module.toLowerCase());
        setModuleStockSummary(summary || null);
        setBackendError(null);
      })
      .catch(() => setBackendError('Impossible de charger les données de la caisse.'));
  }, [isBackendCaisse, module]);

  useEffect(() => {
    if (!isBar) return;

    const currentUser = AuthService.getCurrentUser();
    if (!currentUser?.id) return;

    barService.getBarOpenSessions()
      .then((sessions) => {
        const session = sessions.find((item) => Number(item.user_id) === Number(currentUser.id));
        setCurrentBarSession(session || null);
      })
      .catch(() => setCurrentBarSession(null));
  }, [isBar]);

  const backendEntrees = backendTransactions
    .filter((transaction) => isFinancialInflow(transaction.type_flux))
    .reduce((total, transaction) => total + Number(transaction.montant), 0);
  const backendSorties = backendTransactions
    .filter((transaction) => isFinancialOutflow(transaction.type_flux))
    .reduce((total, transaction) => total + Number(transaction.montant), 0);
  const localCaisse = getModuleCaisseSolde(module);
  const sortiesStock = moduleStockSummary ? Number(moduleStockSummary.sorties) : backendSorties;
  const solde = isBackendCaisse ? backendEntrees - sortiesStock : localCaisse.solde;
  const entrees = isBackendCaisse
    ? Math.max(Number(moduleStockSummary?.entrees || 0), backendEntrees)
    : localCaisse.entrees;
  const sorties = isBackendCaisse ? sortiesStock : localCaisse.sorties;

  // Récupération des commandes payées avec extraction sécurisée du montant
  const restaurantOrders = (state.orders || state.commandes || []).filter(
    (o: any) => (o.module === 'restaurant' || !o.module) && (o.statut === 'Payée' || o.status === 'payee' || o.status === 'payée')
  );

  const orderTransactions = restaurantOrders.map((o: any) => ({
    type: 'entree',
    montant: o.montant || o.total || o.price || o.prix || 0,
    description: `Encaissement ${o.table ? 'Table ' + o.table : 'Commande'}`,
    categorie: 'Ventes Restaurant',
    userName: o.userName || 'Caisse',
    heure: o.heure || o.createdAt || new Date().toISOString()
  }));

  // Exclure les données factices/par défaut du state initial
  const dummyDescriptions = ['Service dîner gala', 'Déjeuner groupe - 15 couverts', 'Approvisionnement fruits de mer'];
  const manualTransactions = (state.transactions || []).filter((t: any) => 
    t.module === 'restaurant' && !dummyDescriptions.includes(t.description)
  );

  // Combinaison et tri pour afficher les plus récents en premier (pile/file descendants)
  const allRestaurantTransactions = [...orderTransactions, ...manualTransactions].sort((a: any, b: any) => {
    const dateA = new Date(a.heure || a.createdAt || 0).getTime();
    const dateB = new Date(b.heure || b.createdAt || 0).getTime();
    return dateB - dateA;
  });

  const handleSubmit = async () => {
    if (!form.description || !form.montant) return;

    if (isBackendCaisse) {
      try {
        const transaction = await financeService.createTransaction({
          module: module.toUpperCase(),
          type_flux: form.type === 'entree' ? 'ENTREE' : 'SORTIE',
          montant: form.montant,
          description: `${form.categorie} - ${form.description}`,
        });
        const [transactions, stats] = await Promise.all([
          financeService.getTransactions({ module: module.toUpperCase() }),
          financeService.getFinancialStats(),
        ]);
        setBackendTransactions(transactions.length ? transactions : [transaction]);
        const summary = stats.modules.find((item) => item.module.toLowerCase() === module.toLowerCase());
        setModuleStockSummary(summary || null);
        setBackendError(null);
      } catch {
        setBackendError('Impossible d’enregistrer la transaction.');
        return;
      }
      setShowModal(false);
      setForm({ type: 'entree', montant: 0, description: '', categorie: categories[0] });
      return;
    }

    dispatch({
      type: 'ADD_TRANSACTION',
      payload: {
        ...form,
        type: form.type as 'entree' | 'sortie',
        userId: state.currentUser.id,
        userName: `${state.currentUser.prenom} ${state.currentUser.nom}`,
        module,
      }
    });
    setShowModal(false);
    setForm({ type: 'entree', montant: 0, description: '', categorie: categories[0] });
  };

  const transactions = isBackendCaisse
    ? backendTransactions.map((transaction) => ({
        type: isFinancialInflow(transaction.type_flux) ? 'entree' : 'sortie',
        montant: transaction.montant,
        description: transaction.description,
        categorie: transaction.module,
        userName: 'Système',
        heure: transaction.created_at,
      }))
    : allRestaurantTransactions;

  const handleEncaisserCommande = async (orderId: number) => {
    if (onEncaisserCommande) {
      await onEncaisserCommande(orderId);
      if (isBackendCaisse) {
        try {
          const [txs, stats] = await Promise.all([
            financeService.getTransactions({ module: module.toUpperCase() }),
            financeService.getFinancialStats(),
          ]);
          setBackendTransactions(txs);
          const summary = stats.modules.find((item) => item.module.toLowerCase() === module.toLowerCase());
          setModuleStockSummary(summary || null);
        } catch (err) {
          console.warn('Failed to refresh backend caisse after encaissement:', err);
        }
      }
    }
  };

  const handlePrintAllOrders = () => {
    const printWindow = window.open('', '_blank', 'width=760,height=720');
    if (!printWindow) return;

    const connectedCashier = [AuthService.getCurrentUser()?.prenom, AuthService.getCurrentUser()?.nom].filter(Boolean).join(' ') || AuthService.getCurrentUser()?.email || 'Utilisateur connecté';
    const generatedAt = new Date().toLocaleString('fr-FR');
    const total = allOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const allItems = allOrders.flatMap((order) => order.items || []);
    const sales = new Map<string, { sold: number; net: number; category: string }>();
    allItems.forEach((item) => {
      const name = item.nom || 'Article';
      const sold = Number(item.quantite || 0);
      const net = sold * Number(item.prix || 0);
      const existing = sales.get(name) || { sold: 0, net: 0, category: item.categorie || 'Bar' };
      sales.set(name, { sold: existing.sold + sold, net: existing.net + net, category: existing.category });
    });
    const categories = new Map<string, { sold: number; total: number }>();
    sales.forEach((sale) => {
      const category = categories.get(sale.category) || { sold: 0, total: 0 };
      categories.set(sale.category, { sold: category.sold + sale.sold, total: category.total + sale.net });
    });
    const paymentLabels: Record<string, string> = { ESPECES: 'Espèces', CREDIT: 'Crédit', TPE: 'Carte', ORANGE_MONEY: 'Orange Money', MVOLA: 'MVola', GRATUIT: 'Gratuit' };
    const paymentTotals = new Map<string, number>();
    allOrders.forEach((order) => {
      const payment = order.moyen_paiement || 'ESPECES';
      paymentTotals.set(payment, (paymentTotals.get(payment) || 0) + Number(order.total || 0));
    });
    const salesRows = Array.from(sales.entries()).map(([name, sale]) => `<div class="row"><span>${name}</span><span>${sale.sold}</span><span>${formatCurrency(sale.net)}</span><span>${formatCurrency(sale.net)}</span></div>`).join('');
    const categoryRows = Array.from(categories.entries()).map(([name, category]) => `<div class="category"><span>${name}</span><span>${category.sold}</span><strong>${formatCurrency(category.total)}</strong></div>`).join('');
    const paymentRows = Array.from(paymentTotals.entries()).map(([payment, amount]) => `<div class="row"><span>${paymentLabels[payment] || payment}</span><strong>${formatCurrency(amount)}</strong></div>`).join('');
    const orderDates = allOrders.map((order) => order.created_at).filter(Boolean).sort();
    const startDate = orderDates[0] ? new Date(orderDates[0]).toLocaleString('fr-FR') : (currentBarSession?.ouverture_at ? new Date(currentBarSession.ouverture_at).toLocaleString('fr-FR') : '-');
    const ticketLines = allItems.length;
    printWindow.document.write(`<!doctype html><html><head><title>Partial Cash Report</title><style>@page{size:80mm auto;margin:4mm}body{font-family:monospace;width:72mm;margin:0;color:#111;font-size:11px}h1{text-align:center;font-size:16px;margin:4px 0 12px}h2{text-align:center;font-size:14px;margin:14px 0 5px}.meta{margin:2px 0}.line{border-bottom:1px dashed #111;margin:7px 0}.row{display:grid;grid-template-columns:minmax(0,1fr) 34px 68px 68px;gap:3px;border-bottom:1px dotted #aaa;padding:2px 0}.row span:last-child,.row strong{text-align:right}.category{display:grid;grid-template-columns:minmax(0,1fr) 34px 68px;gap:3px;border-bottom:1px dotted #aaa;padding:2px 0}.category span:last-child,.category strong{text-align:right}.total{display:flex;justify-content:space-between;font-weight:bold;font-size:13px;margin-top:4px}.summary{display:flex;justify-content:space-between;padding:2px 0}</style></head><body><h1>Partial Cash Report</h1><p class="meta">Caissier : <strong>${connectedCashier}</strong></p><p class="meta">Terminal : BAR-${currentBarSession?.id || 'CAISSE'}<br>Sequence : ${allOrders.length}<br>Start Date : ${startDate}<br>End Date : ${generatedAt}</p><div class="line"></div><h2>Sales</h2><div class="row"><strong>Name</strong><strong>Sold</strong><strong>Net</strong><strong>Total</strong></div>${salesRows || '<p>Aucune vente.</p>'}<div class="line"></div><div class="total"><span>Total</span><span>${formatCurrency(total)}</span></div><h2>Product Categories</h2><div class="category"><strong>Name</strong><strong>Sold</strong><strong>Total</strong></div>${categoryRows || '<p>Aucune catégorie.</p>'}<div class="line"></div><div class="total"><span>Total</span><span>${formatCurrency(total)}</span></div><h2>Lines Removed</h2><div class="category"><span>${connectedCashier}</span><span>0</span><strong>${formatCurrency(0)}</strong></div><h2>Taxes</h2><div class="category"><span>Tax Exempt</span><span></span><strong>${formatCurrency(total)}</strong></div><div class="line"></div><h2>Payments</h2><div class="category"><strong>Type</strong><span></span><strong>Total</strong></div>${paymentRows || '<div class="row"><span>Aucun paiement</span><span></span><strong>AR0</strong></div>'}<div class="line"></div><div class="total"><span>Total</span><span>${formatCurrency(total)}</span></div><h2>SUMMARY</h2><div class="summary"><span>Tickets</span><strong>${allOrders.length}</strong></div><div class="summary"><span>Ticket Lines</span><strong>${ticketLines}</strong></div><div class="summary"><span>Payments</span><strong>${allOrders.length}</strong></div><div class="summary"><span>Net Sales</span><strong>${formatCurrency(total)}</strong></div><div class="summary"><span>Tax</span><strong>${formatCurrency(0)}</strong></div></body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handlePrintCloseReport = (closedFund?: number) => {
    const printWindow = window.open('', '_blank', 'width=760,height=720');
    if (!printWindow) return;

    const paidOrders = allOrders.filter((order) => order.statut === 'Encaissée');
    const reportOrders = paidOrders.length > 0 ? paidOrders : allOrders;
    const paymentTotals = new Map<string, number>();
    reportOrders.forEach((order) => {
      const payment = order.moyen_paiement || 'ESPECES';
      paymentTotals.set(payment, (paymentTotals.get(payment) || 0) + Number(order.total || 0));
    });
    const total = reportOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const generatedAt = new Date().toLocaleString('fr-FR');
    const connectedCashier = [AuthService.getCurrentUser()?.prenom, AuthService.getCurrentUser()?.nom].filter(Boolean).join(' ') || AuthService.getCurrentUser()?.email || 'Utilisateur connecté';
    const paymentLabels: Record<string, string> = { ESPECES: 'Espèces', CREDIT: 'Crédit', TPE: 'Carte / TPE', ORANGE_MONEY: 'Orange Money', MVOLA: 'MVola', GRATUIT: 'Gratuit' };
    const paymentRows = Array.from(paymentTotals.entries()).map(([payment, amount]) => `<div class="row"><span>${paymentLabels[payment] || payment}</span><strong>${formatCurrency(amount)}</strong></div>`).join('');
    const openingDate = currentBarSession?.ouverture_at ? new Date(currentBarSession.ouverture_at).toLocaleString('fr-FR') : '-';
    const closingDate = new Date().toLocaleString('fr-FR');
    const finalFund = closedFund ?? currentBarSession?.fond_final;
    const expectedFund = Number(currentBarSession?.fond_initial || 0) + total;
    const variance = finalFund === undefined ? undefined : finalFund - expectedFund;
    printWindow.document.write(`<!doctype html><html><head><title>Close Cash Report</title><style>@page{size:80mm auto;margin:4mm}body{font-family:monospace;width:72mm;margin:0;color:#111;font-size:12px}h1{text-align:center;font-size:18px;margin:4px 0 12px}h2{font-size:13px;margin:14px 0 5px;border-bottom:1px dashed #111;padding-bottom:4px}.center{text-align:center}.row{display:flex;justify-content:space-between;padding:2px 0}.line{border-bottom:1px dashed #111;margin:8px 0}.label{display:flex;justify-content:space-between}.strong{font-weight:bold;font-size:15px}.small{font-size:11px;margin:3px 0}</style></head><body><h1>Close Cash Report</h1><p class="center">Caisse Bar & Lounge</p><p class="small">Caissier : <strong>${connectedCashier}</strong></p><p class="small">Session : ${currentBarSession?.id || '-'}<br>Ouverture : ${openingDate}<br>Clôture : ${closingDate}</p><h2>Payments Report <span style="float:right">Amount</span></h2>${paymentRows || '<div class="row"><span>Aucun paiement</span><strong>${formatCurrency(0)}</strong></div>'}<div class="line"></div><div class="label strong"><span>Total Sales</span><span>${formatCurrency(total)}</span></div><div class="row"><span>Number of Payments:</span><strong>${reportOrders.length}</strong></div><h2>Tax Analysis <span style="float:right">Amount</span></h2><div class="row"><span>Tax Exempt</span><strong>${formatCurrency(0)}</strong></div><div class="line"></div><div class="label strong"><span>Subtotal</span><span>${formatCurrency(total)}</span></div><div class="label"><span>Taxes</span><span>${formatCurrency(0)}</span></div><div class="label strong"><span>Totals</span><span>${formatCurrency(total)}</span></div>${finalFund !== undefined ? `<h2>Cash Control</h2><div class="row"><span>Fond initial</span><strong>${formatCurrency(Number(currentBarSession?.fond_initial || 0))}</strong></div><div class="row"><span>Fond final</span><strong>${formatCurrency(finalFund)}</strong></div><div class="row"><span>Ecart</span><strong>${formatCurrency(variance || 0)}</strong></div>` : ''}<div class="line"></div><p class="small">Terminal : BAR-${currentBarSession?.id || 'CAISSE'}<br>Sequence : ${reportOrders.length}<br>Imprimé le : ${generatedAt}</p></body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleCloseBarSession = async () => {
    if (!currentBarSession) return;
    if (pendingOrders.length > 0) {
      setBackendError('Encaissez toutes les commandes avant de clôturer la caisse.');
      return;
    }

    const finalAmount = window.prompt('Indiquez le fond final de la caisse (MGA) :', String(Math.max(0, Math.round(solde))));
    if (finalAmount === null) return;

    const fondFinal = Number(finalAmount);
    if (!Number.isFinite(fondFinal) || fondFinal < 0) {
      setBackendError('Le fond final doit être un montant positif.');
      return;
    }

    try {
      setIsClosingBarSession(true);
      await barService.closeBarSession({ session_id: currentBarSession.id, fond_final: fondFinal });
      handlePrintCloseReport(fondFinal);
      setCurrentBarSession(null);
      setBackendError(null);
      window.alert('La caisse Bar & Lounge a été clôturée.');
    } catch (error: any) {
      setBackendError(error?.response?.data?.message || error?.message || 'Impossible de clôturer la caisse.');
    } finally {
      setIsClosingBarSession(false);
    }
  };

  const handleCloseAllOrders = async () => {
    if (!onEncaisserCommande || pendingOrders.length === 0) return;
    if (!window.confirm(`Clôturer les ${pendingOrders.length} commande(s) encore servie(s) ?`)) return;

    for (const order of pendingOrders) {
      await handleEncaisserCommande(order.id);
    }
    await onRefresh?.();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <div className="flex flex-wrap justify-end gap-2">
          {isBar && currentBarSession && (
            <>
              <Button variant="secondary" icon={<Printer size={16} />} onClick={() => handlePrintAllOrders()}>
                Imprimer
              </Button>
              <Button variant="secondary" icon={<LockKeyhole size={16} />} onClick={() => void handleCloseBarSession()} disabled={isClosingBarSession || pendingOrders.length > 0} title={pendingOrders.length > 0 ? 'Encaissez les commandes restantes avant la clôture' : 'Clôturer la caisse'}>
                {isClosingBarSession ? 'Clôture...' : 'Clôturer'}
              </Button>
            </>
          )}
          <Button icon={<Plus size={16} />} onClick={() => setShowModal(true)}>
            Nouvelle transaction
          </Button>
        </div>
      </div>

      {isBar && (
        <div className="overflow-hidden rounded-2xl border border-base bg-surface">
          <div className="flex flex-col gap-3 border-b border-base px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold text-primary">Clôturer et imprimer toutes les commandes</h3>
              <p className="text-xs text-muted">{allOrders.length} commande{allOrders.length > 1 ? 's' : ''} dans la caisse · {pendingOrders.length} à clôturer</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" icon={<Printer size={14} />} onClick={() => handlePrintAllOrders()} disabled={allOrders.length === 0}>
                Imprimer toutes
              </Button>
              <Button size="sm" icon={<LockKeyhole size={14} />} onClick={() => void handleCloseAllOrders()} disabled={!onEncaisserCommande || pendingOrders.length === 0}>
                Clôturer toutes
              </Button>
            </div>
          </div>
          {allOrders.length === 0 ? (
            <p className="px-6 py-6 text-center text-sm text-muted">Aucune commande à imprimer ou à clôturer.</p>
          ) : (
            <div className="divide-y divide-base">
              {allOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between gap-3 px-6 py-3">
                  <div>
                    <p className="text-sm font-medium text-primary">Commande #{order.id} · {order.client || 'Client anonyme'}</p>
                    <p className="text-xs text-muted">{order.statut || 'Sans statut'}{order.table ? ` · Table ${order.table}` : ''}</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-accent">{formatCurrency(order.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Caisse Card */}
      {canViewBarBalance && (
        <CaisseCard solde={solde} entrees={entrees} sorties={sorties} title={title || 'Caisse'} gradient={gradient} />
      )}

      <div className="overflow-hidden rounded-2xl border border-accent/30 bg-surface">
        <div className="flex items-center justify-between border-b border-base px-6 py-4">
          <div>
            <h3 className="font-semibold text-primary">Commandes à encaisser</h3>
            <p className="text-xs text-muted">Commandes servies en attente de paiement</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-accent/15 px-3 py-1 text-sm font-semibold text-accent">{pendingOrders.length}</span>
            {onRefresh && <button type="button" onClick={() => void onRefresh()} title="Actualiser les commandes" className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-2 text-muted transition hover:bg-surface-3 hover:text-primary"><RefreshCw size={14} /></button>}
          </div>
        </div>
        {pendingOrders.length === 0 ? (
          <p className="px-6 py-6 text-center text-sm text-muted">Aucune commande à encaisser.</p>
        ) : (
          <div className="divide-y divide-base">
            {pendingOrders.map((order) => (
              <div key={order.id} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-primary">Commande #{order.id} · {order.client || 'Client anonyme'}</p>
                  <p className="text-xs text-muted">{order.table ? `Table ${order.table}` : 'Sans table'}{order.nombre_personnes ? ` · ${order.nombre_personnes} personne${order.nombre_personnes > 1 ? 's' : ''}` : ''}{order.created_at ? ` · ${new Date(order.created_at).toLocaleString('fr-FR')}` : ''}</p>
                  {order.moyen_paiement && <p className="text-xs text-muted">Paiement : {order.moyen_paiement === 'CARTE' ? 'Carte bancaire' : order.moyen_paiement === 'TPE' ? 'TPE' : order.moyen_paiement === 'CREDIT' ? 'Crédit' : order.moyen_paiement === 'EURO' ? 'Euro' : order.moyen_paiement === 'ORANGE_MONEY' ? 'Orange Money' : order.moyen_paiement === 'MVOLA' ? 'MVola' : order.moyen_paiement === 'DOLLAR' ? 'Dollar' : order.moyen_paiement === 'VIREMENT' ? 'Virement' : order.moyen_paiement === 'CHEQUE' ? 'Chèque' : 'Espèces'}</p>}
                  {order.items && order.items.length > 0 && (
                    <div className="mt-2 space-y-1 border-l-2 border-accent/40 pl-3">
                      {order.items.map((item, index) => {
                        const unitPrice = Number(item.prix_unitaire ?? item.prix ?? 0);
                        return <p key={`${order.id}-item-${index}`} className="text-xs text-secondary">{item.quantite} × {item.nom || item.product_nom || 'Article'} <span className="text-muted">({formatCurrency(unitPrice)} / unité = {formatCurrency(unitPrice * item.quantite)})</span></p>;
                      })}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <span className="font-bold text-accent">{formatCurrency(order.total)}</span>
                  {onEncaisserCommande && <Button size="sm" icon={<DollarSign size={14} />} onClick={() => void handleEncaisserCommande(order.id)}>Encaisser</Button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transactions adaptées au module */}
      {isBar ? (
        <BarTransactionsCard title={transactionTitle} />
      ) : (
        <div className="bg-slate-900 border border-slate-800/50 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800/50 flex items-center justify-between">
            <h3 className="text-white font-semibold">{transactionTitle}</h3>
          </div>
          <div className="divide-y divide-slate-800/50">
            {backendError && <p className="px-6 py-3 text-sm text-red-400">{backendError}</p>}
            {transactions.length > 0 ? (
              transactions.map((t: any, index: number) => (
                <div key={index} className="px-6 py-4 flex items-center justify-between hover:bg-slate-800/20 transition-all">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${t.type === 'entree' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {t.type === 'entree' ? '↗' : '↙'}
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{t.description}</p>
                      <p className="text-slate-500 text-xs">{t.categorie} • {t.userName || 'Système'} {t.heure ? `• ${t.heure}` : ''}</p>
                    </div>
                  </div>
                  <span className={`font-semibold text-sm ${t.type === 'entree' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {t.type === 'entree' ? '+' : '-'} {formatCurrency(t.montant)}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-slate-500">
                <p className="text-sm">Aucune transaction pour le moment.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nouvelle Transaction">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {['entree', 'sortie'].map(type => (
              <button
                key={type}
                onClick={() => setForm({...form, type})}
                className={`h-12 rounded-xl font-semibold text-sm transition-all ${
                  form.type === type
                    ? type === 'entree' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {type === 'entree' ? '+ Entrée' : '- Sortie'}
              </button>
            ))}
          </div>
          <Input label="Montant (MGA)" type="number" value={form.montant} onChange={e => setForm({...form, montant: Number(e.target.value)})} placeholder="0.00" />
          <Input label="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Description de la transaction..." />
          <Select label="Catégorie" value={form.categorie} onChange={e => setForm({...form, categorie: e.target.value})} options={categories.map(c => ({ value: c, label: c }))} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)} className="flex-1">Annuler</Button>
            <Button onClick={handleSubmit} className="flex-1">Enregistrer</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
