import React, { useState } from 'react';
import { useHDA } from '../context/HDAContext';
import { JeuCasino } from '../types';
import { formatCurrency, formatDate } from '../utils/data';
import { CaisseCard, Modal, Input, Button, Badge } from '../components/UI';
import { StockManager } from '../components/StockManager';
import { Dices, TrendingUp, TrendingDown, Plus, ArrowUpRight, ArrowDownRight, ChevronRight, Trophy, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const tabs = [
  { id: 'overview', label: 'Vue d\'ensemble' },
  { id: 'jeux', label: 'Jeux & Caisses' },
  { id: 'stock', label: 'Stock' },
  { id: 'caisse', label: 'Caisse Globale' },
];

const jeuTypeLabels: Record<string, string> = {
  roulette: 'Roulette',
  blackjack: 'Blackjack',
  poker: 'Poker',
  machines_sous: 'Machines à sous',
  baccara: 'Baccara',
  craps: 'Craps',
  keno: 'Keno',
  loterie: 'Loterie',
};

export const CasinoPage: React.FC = () => {
  const { state, dispatch, getCasinoTotalCaisse } = useHDA();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedJeu, setSelectedJeu] = useState<JeuCasino | null>(null);
  const [showTxModal, setShowTxModal] = useState(false);
  const [txForm, setTxForm] = useState({ type: 'entree', montant: 0, description: '' });

  const casinoTotal = getCasinoTotalCaisse();
  const jeuxActifs = state.jeux.filter(j => j.actif);
  const totalTables = state.jeux.reduce((sum, j) => sum + (j.actif ? j.tables : 0), 0);

  const barData = state.jeux.map(j => ({
    name: j.nom.split(' ')[0],
    solde: j.caisse.soldeTotal,
    entrees: j.caisse.totalEntrees,
    sorties: j.caisse.totalSorties,
    actif: j.actif,
  }));

  const handleAddJeuTransaction = () => {
    if (!selectedJeu || !txForm.montant || !txForm.description) return;
    dispatch({
      type: 'ADD_CASINO_TRANSACTION',
      payload: {
        jeuId: selectedJeu.id,
        transaction: {
          type: txForm.type as 'entree' | 'sortie',
          montant: txForm.montant,
          description: txForm.description,
          categorie: 'Jeux',
          userId: state.currentUser.id,
          userName: `${state.currentUser.prenom} ${state.currentUser.nom}`,
          module: 'casino',
          sousModule: selectedJeu.type,
        }
      }
    });
    setShowTxModal(false);
    setTxForm({ type: 'entree', montant: 0, description: '' });
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface border border-base rounded-xl p-3 text-xs">
          {payload.map((p: any) => (
            <div key={p.name} className="flex justify-between gap-3">
              <span className="text-muted">{p.name === 'entrees' ? 'Entrées' : p.name === 'sorties' ? 'Sorties' : 'Solde'}:</span>
              <span className="text-primary font-semibold">{formatCurrency(p.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-primary text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>
            Casino
          </h2>
          <p className="text-muted text-sm mt-1">Gestion des jeux, tables et caisses</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-success-bg border border-success/20">
            <Zap size={14} className="text-success" />
            <span className="text-success text-sm font-medium">{jeuxActifs.length} jeux actifs</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
            <Dices size={24} className="text-black" />
          </div>
        </div>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Solde Casino', value: formatCurrency(casinoTotal.solde), color: 'text-primary' },
          { label: 'Total Entrées', value: formatCurrency(casinoTotal.entrees), color: 'text-success' },
          { label: 'Total Sorties', value: formatCurrency(casinoTotal.sorties), color: 'text-danger' },
          { label: 'Tables Actives', value: totalTables, color: 'text-accent' },
        ].map(s => (
          <div key={s.label} className="bg-surface border border-base rounded-2xl p-5">
            <p className="text-muted text-xs mb-1">{s.label}</p>
            <p className={`${s.color} font-bold text-xl`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface border border-base rounded-2xl p-1 w-fit overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`tab px-5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'active' : ''
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Bar Chart */}
          <div className="bg-surface border border-base rounded-2xl p-6">
            <h3 className="text-primary font-semibold mb-6">Performance par Jeu</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#aaaaaa', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#aaaaaa', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k€`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="entrees" name="entrees" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, i) => (
                    <Cell key={i} fill={entry.actif ? '#4ade80' : '#2a2a2a'} fillOpacity={0.8} />
                  ))}
                </Bar>
                <Bar dataKey="sorties" name="sorties" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, i) => (
                    <Cell key={i} fill={entry.actif ? '#f87171' : '#2a2a2a'} fillOpacity={0.7} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Jeux Grid Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {state.jeux.map(jeu => (
              <div key={jeu.id} 
                className="bg-surface border border-base rounded-2xl p-5 cursor-pointer hover:border-accent hover:shadow-accent transition-all group"
                onClick={() => { setActiveTab('jeux'); setSelectedJeu(jeu); }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center text-2xl">
                    {jeu.icon}
                  </div>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    jeu.actif 
                      ? 'bg-success-bg text-success border border-success/30' 
                      : 'bg-surface-2 text-muted border border-base'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${jeu.actif ? 'bg-success animate-pulse' : 'bg-muted'}`} />
                    {jeu.actif ? 'Actif' : 'Fermé'}
                  </div>
                </div>
                <h4 className="text-primary font-semibold mb-1 text-sm">{jeu.nom}</h4>
                <p className="text-muted text-xs mb-3">{jeu.tables} table{jeu.tables > 1 ? 's' : ''} • Mise: {formatCurrency(jeu.mise_min)}-{formatCurrency(jeu.mise_max)}</p>
                <div className="pt-3 border-t border-base">
                  <p className="text-accent font-bold text-lg">{formatCurrency(jeu.caisse.soldeTotal)}</p>
                  <div className="flex gap-3 mt-1">
                    <span className="text-success text-xs">+{formatCurrency(jeu.caisse.totalEntrees)}</span>
                    <span className="text-danger text-xs">-{formatCurrency(jeu.caisse.totalSorties)}</span>
                  </div>
                </div>
                <div className="flex items-center text-subtle text-xs mt-2 group-hover:text-primary transition-colors">
                  <span>Voir détails</span>
                  <ChevronRight size={12} className="ml-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Jeux Detail Tab */}
      {activeTab === 'jeux' && (
        <div className="space-y-6">
          {/* Jeux Selection */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {state.jeux.map(jeu => (
              <button
                key={jeu.id}
                onClick={() => setSelectedJeu(jeu)}
                className={`p-3 rounded-xl border transition-all text-center ${
                  selectedJeu?.id === jeu.id 
                    ? 'border-accent bg-accent-4' 
                    : 'border-base bg-surface hover:border-accent'
                }`}
              >
                <div className="text-2xl mb-1">{jeu.icon}</div>
                <p className="text-xs text-muted truncate">{jeu.nom.split(' ')[0]}</p>
              </button>
            ))}
          </div>

          {/* Selected Jeu Detail */}
          {selectedJeu ? (
            <div className="space-y-6">
              {/* Jeu Header */}
              <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${selectedJeu.couleur} p-6`}>
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,white,transparent)]" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{selectedJeu.icon}</div>
                    <div>
                      <h3 className="text-primary font-bold text-xl">{selectedJeu.nom}</h3>
                      <p className="text-secondary/70 text-sm">{selectedJeu.tables} tables • Mise: {formatCurrency(selectedJeu.mise_min)} - {formatCurrency(selectedJeu.mise_max)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-secondary/70 text-sm">Solde Caisse</p>
                    <p className="text-primary font-black text-3xl">{formatCurrency(selectedJeu.caisse.soldeTotal)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/20">
                  <div>
                    <p className="text-secondary/60 text-xs">Total Entrées</p>
                    <p className="text-primary font-bold text-lg">{formatCurrency(selectedJeu.caisse.totalEntrees)}</p>
                  </div>
                  <div>
                    <p className="text-secondary/60 text-xs">Total Sorties</p>
                    <p className="text-primary font-bold text-lg">{formatCurrency(selectedJeu.caisse.totalSorties)}</p>
                  </div>
                </div>
              </div>

              {/* Transactions de ce jeu */}
              <div className="bg-surface border border-base rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-base">
                  <h3 className="text-primary font-semibold">Transactions — {selectedJeu.nom}</h3>
                  <Button icon={<Plus size={16} />} onClick={() => setShowTxModal(true)} size="sm">
                    Transaction
                  </Button>
                </div>
                <div className="divide-y divide-base max-h-64 overflow-y-auto">
                  {selectedJeu.caisse.transactions.length === 0 ? (
                    <div className="p-8 text-center text-muted">Aucune transaction</div>
                  ) : (
                    selectedJeu.caisse.transactions.map(tx => (
                      <div key={tx.id} className="flex items-center gap-4 px-6 py-3 hover:bg-surface-2">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${tx.type === 'entree' ? 'bg-success-bg' : 'bg-danger-bg'}`}>
                          {tx.type === 'entree' ? <ArrowUpRight size={16} className="text-success" /> : <ArrowDownRight size={16} className="text-danger" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-primary text-sm font-medium truncate">{tx.description}</p>
                          <p className="text-muted text-xs">{tx.userName} • {formatDate(tx.date)}</p>
                        </div>
                        <p className={`font-bold ${tx.type === 'entree' ? 'text-success' : 'text-danger'}`}>
                          {tx.type === 'entree' ? '+' : '-'}{formatCurrency(tx.montant)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-surface border border-base rounded-2xl p-12 text-center">
              <Dices size={48} className="text-muted mx-auto mb-4" />
              <p className="text-muted">Sélectionnez un jeu pour voir les détails</p>
            </div>
          )}
        </div>
      )}

      {/* Stock Tab */}
      {activeTab === 'stock' && <StockManager module="casino" categories={['Jeux', 'Jetons', 'Cartes', 'Équipement', 'Bar', 'Autre']} />}

      {/* Caisse Globale Tab */}
      {activeTab === 'caisse' && (
        <div className="space-y-6">
          <CaisseCard 
            solde={casinoTotal.solde} 
            entrees={casinoTotal.entrees} 
            sorties={casinoTotal.sorties} 
            title="Caisse Casino — Globale" 
            gradient="from-accent to-accent-2" 
          />
          
          {/* Per game breakdown */}
          <div className="bg-surface border border-base rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-base">
              <h3 className="text-primary font-semibold flex items-center gap-2">
                <Trophy size={16} className="text-accent" />
                Répartition par Jeu
              </h3>
            </div>
            <div className="divide-y divide-base">
              {state.jeux.map(jeu => {
                const pct = casinoTotal.entrees > 0 ? (jeu.caisse.totalEntrees / casinoTotal.entrees) * 100 : 0;
                return (
                  <div key={jeu.id} className="px-6 py-4 hover:bg-surface-2 transition-colors">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="w-9 h-9 rounded-xl bg-accent/20 flex items-center justify-center text-lg flex-shrink-0">
                        {jeu.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-primary font-medium text-sm">{jeu.nom}</span>
                          <span className="text-accent font-bold">{formatCurrency(jeu.caisse.soldeTotal)}</span>
                        </div>
                        <div className="progress-bar h-1.5">
                          <div className="progress-fill h-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <span className="text-muted text-xs w-12 text-right">{pct.toFixed(1)}%</span>
                    </div>
                    <div className="flex gap-4 ml-13 pl-13 text-xs">
                      <span className="text-success">+{formatCurrency(jeu.caisse.totalEntrees)}</span>
                      <span className="text-danger">-{formatCurrency(jeu.caisse.totalSorties)}</span>
                      <span className={`${jeu.actif ? 'text-success' : 'text-muted'}`}>{jeu.actif ? 'Actif' : 'Fermé'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* All Casino Transactions */}
          <div className="bg-surface border border-base rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-base">
              <h3 className="text-primary font-semibold">Toutes les Transactions Casino</h3>
            </div>
            <div className="divide-y divide-base max-h-80 overflow-y-auto">
              {state.transactions.filter(t => t.module === 'casino').map(tx => (
                <div key={tx.id} className="flex items-center gap-4 px-6 py-3 hover:bg-surface-2">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${tx.type === 'entree' ? 'bg-success-bg' : 'bg-danger-bg'}`}>
                    {tx.type === 'entree' ? <ArrowUpRight size={16} className="text-success" /> : <ArrowDownRight size={16} className="text-danger" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-primary text-sm font-medium truncate">{tx.description}</p>
                    <p className="text-muted text-xs capitalize">{tx.sousModule ? jeuTypeLabels[tx.sousModule] : ''} • {tx.userName}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${tx.type === 'entree' ? 'text-success' : 'text-danger'}`}>
                      {tx.type === 'entree' ? '+' : '-'}{formatCurrency(tx.montant)}
                    </p>
                    <p className="text-subtle text-xs">{formatDate(tx.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      <Modal isOpen={showTxModal} onClose={() => setShowTxModal(false)} title={`Transaction — ${selectedJeu?.nom || ''}`}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {['entree', 'sortie'].map(type => (
              <button key={type} onClick={() => setTxForm({...txForm, type})}
                className={`h-12 rounded-xl font-semibold text-sm transition-all ${
                  txForm.type === type 
                    ? type === 'entree' ? 'bg-success text-black' : 'bg-danger text-black'
                    : 'bg-surface-2 text-muted'
                }`}>
                {type === 'entree' ? '+ Gain Casino' : '- Paiement Jackpot'}
              </button>
            ))}
          </div>
          <Input label="Montant (€)" type="number" value={txForm.montant} onChange={e => setTxForm({...txForm, montant: Number(e.target.value)})} />
          <Input label="Description" value={txForm.description} onChange={e => setTxForm({...txForm, description: e.target.value})} placeholder="Ex: Tournoi poker - 8 joueurs" />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowTxModal(false)} className="flex-1">Annuler</Button>
            <Button onClick={handleAddJeuTransaction} className="flex-1">Enregistrer</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};