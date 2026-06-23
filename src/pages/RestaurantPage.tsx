import React, { useState } from 'react';
import { StockManager, CaisseManager } from '../components/StockManager';
import { Badge, Button, Modal, Input, Select, DataTable } from '../components/UI';
import { useHDA } from '../context/HDAContext';
import { Commande } from '../types';
import { formatCurrency, formatDate } from '../utils/data';
import { UtensilsCrossed, Plus, ChefHat } from 'lucide-react';

const tabs = [
  { id: 'commandes', label: 'Commandes' },
  { id: 'menu', label: 'Menu' },
  { id: 'stock', label: 'Stock' },
  { id: 'caisse', label: 'Caisse' },
];

const menuItems = [
  { id: 'm1', nom: 'Filet de Bœuf Rossini', categorie: 'Plats', prix: 68, disponible: true, description: 'Médaillon de bœuf, escalope de foie gras, sauce Périgueux' },
  { id: 'm2', nom: 'Homard Thermidor', categorie: 'Fruits de mer', prix: 95, disponible: true, description: 'Homard breton, sauce thermidor, riz pilaf' },
  { id: 'm3', nom: 'Soupe de Truffes', categorie: 'Entrées', prix: 45, disponible: false, description: 'Velouté de truffes noires, brioche feuilletée' },
  { id: 'm4', nom: 'Foie Gras Poêlé', categorie: 'Entrées', prix: 38, disponible: true, description: 'Foie gras de canard, chutney de figues, pain brioché' },
  { id: 'm5', nom: 'Menu Dégustation 7 plats', categorie: 'Menus', prix: 185, disponible: true, description: 'Voyage gastronomique signé par le Chef étoilé' },
  { id: 'm6', nom: 'Soufflé au Grand Marnier', categorie: 'Desserts', prix: 28, disponible: true, description: 'Soufflé chaud, crème anglaise à la vanille Bourbon' },
  { id: 'm7', nom: 'Assiette de Fromages', categorie: 'Fromages', prix: 24, disponible: true, description: 'Sélection affinée, confitures artisanales' },
  { id: 'm8', nom: 'Château Margaux 2018', categorie: 'Vins', prix: 380, disponible: true, description: 'Grand Cru Classé, Médoc' },
];

const categColors: Record<string, string> = {
  'Plats': 'from-orange-500 to-amber-600',
  'Fruits de mer': 'from-blue-500 to-cyan-600',
  'Entrées': 'from-green-500 to-emerald-600',
  'Menus': 'from-violet-500 to-purple-600',
  'Desserts': 'from-pink-500 to-rose-600',
  'Fromages': 'from-amber-600 to-yellow-600',
  'Vins': 'from-red-600 to-rose-700',
};

export const RestaurantPage: React.FC = () => {
  const { state, dispatch } = useHDA();
  const [activeTab, setActiveTab] = useState('commandes');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ tableNumero: '', serveur: '', montantTotal: 0, status: 'en_attente' });

  const handleAddCommande = () => {
    if (!form.tableNumero) return;
    dispatch({ type: 'ADD_COMMANDE', payload: {
      ...form,
      items: [],
      montantTotal: form.montantTotal,
      status: form.status as Commande['status'],
    }});
    setShowModal(false);
  };

  const commandeColumns = [
    { key: 'table', label: 'Table', render: (c: Commande) => (
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
        <span className="text-white font-bold text-sm">{c.tableNumero}</span>
      </div>
    )},
    { key: 'items', label: 'Articles', render: (c: Commande) => (
      <div>
        {c.items.length === 0 ? <span className="text-slate-600 text-sm">—</span> : (
          c.items.slice(0, 2).map((item, i) => (
            <p key={i} className="text-slate-300 text-sm">{item.nom} x{item.quantite}</p>
          ))
        )}
        {c.items.length > 2 && <p className="text-slate-600 text-xs">+{c.items.length - 2} autres</p>}
      </div>
    )},
    { key: 'serveur', label: 'Serveur', render: (c: Commande) => (
      <span className="text-slate-300">{c.serveur || '—'}</span>
    )},
    { key: 'montantTotal', label: 'Montant', render: (c: Commande) => (
      <span className="text-amber-400 font-bold">{formatCurrency(c.montantTotal)}</span>
    )},
    { key: 'status', label: 'Statut', render: (c: Commande) => (
      <Badge variant={c.status}>
        {c.status === 'en_attente' ? 'En attente' : c.status === 'en_cours' ? 'En cours' : c.status === 'servie' ? 'Servie' : c.status === 'payee' ? 'Payée' : 'Annulée'}
      </Badge>
    )},
    { key: 'date', label: 'Heure', render: (c: Commande) => (
      <span className="text-slate-500 text-xs">{formatDate(c.createdAt)}</span>
    )},
    { key: 'actions', label: '', render: (c: Commande) => (
      <div className="flex gap-2">
        {c.status === 'en_attente' && <Button size="sm" variant="secondary" onClick={() => dispatch({ type: 'ADD_COMMANDE', payload: {...c, status: 'en_cours' as Commande['status']} })}>Démarrer</Button>}
        {c.status === 'servie' && <Button size="sm" onClick={() => dispatch({ type: 'ADD_COMMANDE', payload: {...c, status: 'payee' as Commande['status']} })}>Encaisser</Button>}
      </div>
    )},
  ];

  const stats = [
    { label: 'Total Commandes', value: state.commandes.length, color: 'text-white' },
    { label: 'En Cours', value: state.commandes.filter(c => c.status === 'en_cours').length, color: 'text-amber-400' },
    { label: 'Payées', value: state.commandes.filter(c => c.status === 'payee').length, color: 'text-emerald-400' },
    { label: 'CA Journée', value: formatCurrency(state.commandes.filter(c => c.status === 'payee').reduce((sum, c) => sum + c.montantTotal, 0)), color: 'text-amber-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>Restaurant</h2>
          <p className="text-slate-500 text-sm mt-1">Gestion gastronomique & commandes</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
          <UtensilsCrossed size={24} className="text-white" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-slate-900 border border-slate-800/50 rounded-2xl p-5">
            <p className="text-slate-500 text-xs mb-1">{s.label}</p>
            <p className={`${s.color} font-bold text-xl`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900 border border-slate-800/50 rounded-2xl p-1 w-fit">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'commandes' && (
        <div className="bg-slate-900 border border-slate-800/50 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/50">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <ChefHat size={18} className="text-orange-400" />
              Commandes
            </h3>
            <Button icon={<Plus size={16} />} onClick={() => setShowModal(true)}>Nouvelle commande</Button>
          </div>
          <DataTable data={state.commandes} columns={commandeColumns} />
        </div>
      )}

      {activeTab === 'menu' && (
        <div>
          <h3 className="text-white font-semibold mb-4">Carte du Restaurant</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.map(item => (
              <div key={item.id} className="bg-slate-900 border border-slate-800/50 rounded-2xl p-5 hover:border-slate-700/50 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-medium bg-gradient-to-r ${categColors[item.categorie] || 'from-slate-600 to-slate-700'} text-white`}>
                    {item.categorie}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${item.disponible ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                    {item.disponible ? '● Disponible' : '○ Indispo'}
                  </span>
                </div>
                <h4 className="text-white font-semibold mb-1">{item.nom}</h4>
                <p className="text-slate-500 text-sm mb-3 line-clamp-2">{item.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-amber-400 font-bold text-xl">{formatCurrency(item.prix)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'stock' && <StockManager module="restaurant" categories={['Viande', 'Fruits de mer', 'Légumes', 'Fruits', 'Épicerie', 'Épices', 'Boissons', 'Autre']} />}
      {activeTab === 'caisse' && <CaisseManager module="restaurant" categories={['Restaurant', 'Stock', 'Personnel', 'Équipement', 'Autre']} title="Caisse Restaurant" gradient="from-orange-500 to-amber-600" />}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nouvelle Commande">
        <div className="space-y-4">
          <Input label="Numéro de table" value={form.tableNumero} onChange={e => setForm({...form, tableNumero: e.target.value})} placeholder="T1, VIP1..." />
          <Input label="Serveur" value={form.serveur} onChange={e => setForm({...form, serveur: e.target.value})} placeholder="Nom du serveur" />
          <Input label="Montant estimé (€)" type="number" value={form.montantTotal} onChange={e => setForm({...form, montantTotal: Number(e.target.value)})} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)} className="flex-1">Annuler</Button>
            <Button onClick={handleAddCommande} className="flex-1">Créer</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
