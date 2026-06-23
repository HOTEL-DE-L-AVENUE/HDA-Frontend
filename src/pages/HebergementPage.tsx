import React, { useState } from 'react';
import { StockManager, CaisseManager } from '../components/StockManager';
import { useHDA } from '../context/HDAContext';
import { Badge, Modal, Input, Select, Button, DataTable } from '../components/UI';
import { formatCurrency, formatDate } from '../utils/data';
import { Reservation } from '../types';
import { BedDouble, Plus, Calendar, Users } from 'lucide-react';

const tabs = [
  { id: 'reservations', label: 'Réservations' },
  { id: 'stock', label: 'Stock' },
  { id: 'caisse', label: 'Caisse' },
];

export const HebergementPage: React.FC = () => {
  const { state, dispatch } = useHDA();
  const [activeTab, setActiveTab] = useState('reservations');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ 
    clientNom: '', clientPrenom: '', clientTel: '', 
    chambres: '', dateArrivee: '', dateDepart: '', 
    montantTotal: 0, status: 'confirmee' 
  });

  const handleAddReservation = () => {
    if (!form.clientNom || !form.dateArrivee) return;
    const nuits = Math.ceil((new Date(form.dateDepart).getTime() - new Date(form.dateArrivee).getTime()) / (1000 * 3600 * 24));
    dispatch({ type: 'ADD_RESERVATION', payload: { 
      ...form, 
      chambres: form.chambres.split(',').map(c => c.trim()),
      nuits: nuits > 0 ? nuits : 1,
      montantTotal: form.montantTotal,
      status: form.status as Reservation['status']
    }});
    setShowModal(false);
  };

  const columns = [
    { key: 'client', label: 'Client', render: (r: Reservation) => (
      <div>
        <p className="text-white font-medium">{r.clientPrenom} {r.clientNom}</p>
        <p className="text-slate-500 text-xs">{r.clientTel}</p>
      </div>
    )},
    { key: 'chambres', label: 'Chambres', render: (r: Reservation) => (
      <span className="text-slate-300">{r.chambres.join(', ')}</span>
    )},
    { key: 'dates', label: 'Dates', render: (r: Reservation) => (
      <div>
        <p className="text-white text-sm">{r.dateArrivee} → {r.dateDepart}</p>
        <p className="text-slate-500 text-xs">{r.nuits} nuit{r.nuits > 1 ? 's' : ''}</p>
      </div>
    )},
    { key: 'montantTotal', label: 'Montant', render: (r: Reservation) => (
      <span className="text-amber-400 font-bold">{formatCurrency(r.montantTotal)}</span>
    )},
    { key: 'status', label: 'Statut', render: (r: Reservation) => (
      <Badge variant={r.status}>
        {r.status === 'confirmee' ? 'Confirmée' : r.status === 'en_cours' ? 'En cours' : r.status === 'terminee' ? 'Terminée' : 'Annulée'}
      </Badge>
    )},
    { key: 'actions', label: '', render: (r: Reservation) => (
      <div className="flex gap-2">
        {r.status === 'confirmee' && (
          <Button size="sm" variant="secondary" onClick={() => dispatch({ type: 'UPDATE_RESERVATION', payload: {...r, status: 'en_cours'}})}>
            Check-in
          </Button>
        )}
        {r.status === 'en_cours' && (
          <Button size="sm" variant="secondary" onClick={() => dispatch({ type: 'UPDATE_RESERVATION', payload: {...r, status: 'terminee'}})}>
            Check-out
          </Button>
        )}
      </div>
    )},
  ];

  const stats = [
    { label: 'Total Réservations', value: state.reservations.length, icon: <Calendar size={20} className="text-white" />, gradient: 'from-blue-500 to-cyan-600' },
    { label: 'En Cours', value: state.reservations.filter(r => r.status === 'en_cours').length, icon: <BedDouble size={20} className="text-white" />, gradient: 'from-amber-500 to-orange-500' },
    { label: 'Confirmées', value: state.reservations.filter(r => r.status === 'confirmee').length, icon: <Users size={20} className="text-white" />, gradient: 'from-emerald-500 to-green-600' },
    { label: 'Revenu Total', value: formatCurrency(state.reservations.reduce((sum, r) => sum + r.montantTotal, 0)), icon: <Plus size={20} className="text-white" />, gradient: 'from-violet-500 to-purple-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>Hébergement</h2>
          <p className="text-slate-500 text-sm mt-1">Gestion des chambres et réservations</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
          <BedDouble size={24} className="text-white" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-slate-900 border border-slate-800/50 rounded-2xl p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center flex-shrink-0`}>{s.icon}</div>
            <div>
              <p className="text-slate-500 text-xs">{s.label}</p>
              <p className="text-white font-bold text-lg">{s.value}</p>
            </div>
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
      {activeTab === 'reservations' && (
        <div className="bg-slate-900 border border-slate-800/50 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/50">
            <h3 className="text-white font-semibold">Réservations</h3>
            <Button icon={<Plus size={16} />} onClick={() => setShowModal(true)}>Nouvelle réservation</Button>
          </div>
          <DataTable data={state.reservations} columns={columns} />
        </div>
      )}
      {activeTab === 'stock' && <StockManager module="hebergement" categories={['Linge', 'Hygiène', 'Mobilier', 'Électronique', 'Nettoyage', 'Autre']} />}
      {activeTab === 'caisse' && <CaisseManager module="hebergement" categories={['Hébergement', 'Stock', 'Maintenance', 'Personnel', 'Autre']} title="Caisse Hébergement" gradient="from-blue-500 to-cyan-600" />}

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nouvelle Réservation" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nom" value={form.clientNom} onChange={e => setForm({...form, clientNom: e.target.value})} placeholder="Nom du client" />
            <Input label="Prénom" value={form.clientPrenom} onChange={e => setForm({...form, clientPrenom: e.target.value})} placeholder="Prénom" />
          </div>
          <Input label="Téléphone" value={form.clientTel} onChange={e => setForm({...form, clientTel: e.target.value})} placeholder="+33 6 XX XX XX XX" />
          <Input label="Chambres (ex: 101, 102)" value={form.chambres} onChange={e => setForm({...form, chambres: e.target.value})} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Arrivée" type="date" value={form.dateArrivee} onChange={e => setForm({...form, dateArrivee: e.target.value})} />
            <Input label="Départ" type="date" value={form.dateDepart} onChange={e => setForm({...form, dateDepart: e.target.value})} />
          </div>
          <Input label="Montant Total (€)" type="number" value={form.montantTotal} onChange={e => setForm({...form, montantTotal: Number(e.target.value)})} />
          <Select label="Statut" value={form.status} onChange={e => setForm({...form, status: e.target.value})} options={[
            { value: 'confirmee', label: 'Confirmée' },
            { value: 'en_cours', label: 'En cours' },
          ]} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)} className="flex-1">Annuler</Button>
            <Button onClick={handleAddReservation} className="flex-1">Enregistrer</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
