import React, { useState } from 'react';
import { useHDA } from '../context/HDAContext';
import { ModuleType, StockItem } from '../types';
import { DataTable, Modal, Input, Select, Button, Badge, CaisseCard } from '../components/UI';
import { formatCurrency, formatDate } from '../utils/data';
import { Plus, Package, Edit2, Trash2, TrendingUp, TrendingDown, Search, Filter, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StockManagerProps {
  module: ModuleType;
  categories: string[];
}

export const StockManager: React.FC<StockManagerProps> = ({ module, categories }) => {
  const { state, dispatch, getModuleStock } = useHDA();
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<StockItem | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [form, setForm] = useState({
    nom: '', categorie: categories[0], quantite: 0, unite: '', 
    prixUnitaire: 0, seuilMinimum: 0, fournisseur: ''
  });

  const items = getModuleStock(module);
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

  const handleSubmit = () => {
    if (!form.nom) return;
    const status = computeStatus(form.quantite, form.seuilMinimum);
    
    if (editItem) {
      dispatch({ type: 'UPDATE_STOCK_ITEM', payload: { 
        ...editItem, ...form, status, updatedAt: new Date().toISOString() 
      }});
    } else {
      dispatch({ type: 'ADD_STOCK_ITEM', payload: { ...form, status, module } });
    }
    
    setShowModal(false);
    setEditItem(null);
    setForm({ nom: '', categorie: categories[0], quantite: 0, unite: '', prixUnitaire: 0, seuilMinimum: 0, fournisseur: '' });
  };

  const openEdit = (item: StockItem) => {
    setEditItem(item);
    setForm({ nom: item.nom, categorie: item.categorie, quantite: item.quantite, unite: item.unite, prixUnitaire: item.prixUnitaire, seuilMinimum: item.seuilMinimum, fournisseur: item.fournisseur || '' });
    setShowModal(true);
  };

  const totalValue = items.reduce((sum, i) => sum + (i.quantite * i.prixUnitaire), 0);
  const alerts = items.filter(i => i.status !== 'disponible').length;

  const columns = [
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
    { key: 'actions', label: '', render: (item: StockItem) => (
      <div className="flex gap-2">
        <button onClick={() => openEdit(item)} className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all">
          <Edit2 size={14} />
        </button>
        <button onClick={() => dispatch({ type: 'DELETE_STOCK_ITEM', payload: item.id })} className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400 transition-all">
          <Trash2 size={14} />
        </button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
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

      {/* Table */}
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
            <Button icon={<Plus size={16} />} onClick={() => { setEditItem(null); setShowModal(true); }}>
              Ajouter
            </Button>
          </div>
        </div>
        <DataTable data={filtered} columns={columns} />
      </div>

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditItem(null); }} title={editItem ? 'Modifier l\'article' : 'Ajouter un article'}>
        <div className="space-y-4">
          <Input label="Nom du produit" value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} placeholder="Ex: Filet de Boeuf" />
          <Select label="Catégorie" value={form.categorie} onChange={e => setForm({...form, categorie: e.target.value})} options={categories.map(c => ({ value: c, label: c }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Quantité" type="number" value={form.quantite} onChange={e => setForm({...form, quantite: Number(e.target.value)})} />
            <Input label="Unité" value={form.unite} onChange={e => setForm({...form, unite: e.target.value})} placeholder="kg, pièce, litre..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Prix unitaire (€)" type="number" value={form.prixUnitaire} onChange={e => setForm({...form, prixUnitaire: Number(e.target.value)})} />
            <Input label="Seuil minimum" type="number" value={form.seuilMinimum} onChange={e => setForm({...form, seuilMinimum: Number(e.target.value)})} />
          </div>
          <Input label="Fournisseur (optionnel)" value={form.fournisseur} onChange={e => setForm({...form, fournisseur: e.target.value})} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => { setShowModal(false); setEditItem(null); }} className="flex-1">Annuler</Button>
            <Button onClick={handleSubmit} className="flex-1">{editItem ? 'Mettre à jour' : 'Ajouter'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

interface CaisseManagerProps {
  module: ModuleType;
  categories: string[];
  title?: string;
  gradient?: string;
}

export const CaisseManager: React.FC<CaisseManagerProps> = ({ module, categories, title, gradient = 'from-amber-500 to-orange-500' }) => {
  const { state, dispatch, getModuleCaisseSolde, getModuleTransactions } = useHDA();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ type: 'entree', montant: 0, description: '', categorie: categories[0] });

  const { solde, entrees, sorties } = getModuleCaisseSolde(module);
  const transactions = getModuleTransactions(module);

  const handleSubmit = () => {
    if (!form.description || !form.montant) return;
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

  return (
    <div className="space-y-6">
      {/* Caisse Card */}
      <CaisseCard solde={solde} entrees={entrees} sorties={sorties} title={title || 'Caisse'} gradient={gradient} />

      {/* Transactions */}
      <div className="bg-slate-900 border border-slate-800/50 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/50">
          <h3 className="text-white font-semibold">Transactions</h3>
          <Button icon={<Plus size={16} />} onClick={() => setShowModal(true)} size="sm">
            Nouvelle transaction
          </Button>
        </div>
        <div className="divide-y divide-slate-800/30 max-h-[500px] overflow-y-auto">
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-slate-600">Aucune transaction</div>
          ) : transactions.map(tx => (
            <div key={tx.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-800/20 transition-colors">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                tx.type === 'entree' ? 'bg-emerald-500/15' : 'bg-red-500/15'
              }`}>
                {tx.type === 'entree' ? <ArrowUpRight size={18} className="text-emerald-400" /> : <ArrowDownRight size={18} className="text-red-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{tx.description}</p>
                <p className="text-slate-500 text-xs">{tx.categorie} • {tx.userName} • {formatDate(tx.date)}</p>
              </div>
              <div className={`font-bold ${tx.type === 'entree' ? 'text-emerald-400' : 'text-red-400'}`}>
                {tx.type === 'entree' ? '+' : '-'}{formatCurrency(tx.montant)}
              </div>
            </div>
          ))}
        </div>
      </div>

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
          <Input label="Montant (€)" type="number" value={form.montant} onChange={e => setForm({...form, montant: Number(e.target.value)})} placeholder="0.00" />
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
