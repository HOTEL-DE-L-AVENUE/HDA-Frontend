import React, { useState } from 'react';
import { useHDA } from '../context/HDAContext';
import { formatCurrency, formatDate } from '../utils/data';
import { ModuleType } from '../types';
import { DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Download, Filter } from 'lucide-react';
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const moduleConfig: Record<string, { label: string; gradient: string; color: string }> = {
  hebergement: { label: 'Hébergement', gradient: 'from-blue-500 to-cyan-600', color: '#3b82f6' },
  hotel: { label: 'Hôtel', gradient: 'from-indigo-500 to-blue-600', color: '#6366f1' },
  restaurant: { label: 'Restaurant', gradient: 'from-orange-500 to-amber-600', color: '#f97316' },
  bar: { label: 'Bar & Lounge', gradient: 'from-rose-500 to-pink-600', color: '#f43f5e' },
  casino: { label: 'Casino', gradient: 'from-emerald-500 to-green-600', color: '#10b981' },
};

const mockMonthlyData = [
  { mois: 'Jan', total: 221000 },
  { mois: 'Fév', total: 221000 },
  { mois: 'Mar', total: 275000 },
  { mois: 'Avr', total: 310000 },
  { mois: 'Mai', total: 302000 },
  { mois: 'Jun', total: 370000 },
];

export const FinancesPage: React.FC = () => {
  const { state, getModuleCaisseSolde, getCasinoTotalCaisse, getGlobalStats, getModuleTransactions } = useHDA();
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const globalStats = getGlobalStats();
  const casinoTotal = getCasinoTotalCaisse();

  const modulesSoldes = [
    { module: 'hebergement' as ModuleType, ...getModuleCaisseSolde('hebergement') },
    { module: 'hotel' as ModuleType, ...getModuleCaisseSolde('hotel') },
    { module: 'restaurant' as ModuleType, ...getModuleCaisseSolde('restaurant') },
    { module: 'bar' as ModuleType, ...getModuleCaisseSolde('bar') },
    { module: 'casino' as ModuleType, solde: casinoTotal.solde, entrees: casinoTotal.entrees, sorties: casinoTotal.sorties },
  ];

  const pieData = modulesSoldes.map(m => ({
    name: moduleConfig[m.module].label,
    value: m.entrees,
    color: moduleConfig[m.module].color,
  }));

  const barData = modulesSoldes.map(m => ({
    name: moduleConfig[m.module].label,
    entrees: m.entrees,
    sorties: m.sorties,
    solde: m.solde,
  }));

  // All transactions
  const allTransactions = state.transactions
    .filter(tx => activeFilter === 'all' || tx.module === activeFilter)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalEntrees = modulesSoldes.reduce((sum, m) => sum + m.entrees, 0);
  const totalSorties = modulesSoldes.reduce((sum, m) => sum + m.sorties, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-surface border border-base rounded-xl p-3">
          {payload.map((p: any) => (
            <div key={p.name} className="flex justify-between gap-4 text-sm">
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-primary text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>Finances</h2>
          <p className="text-muted text-sm mt-1">Vue consolidée de toutes les caisses</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-2 border border-base text-muted hover:text-primary text-sm transition-all">
            <Download size={16} />
            <span className="hidden md:inline">Exporter</span>
          </button>
          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
            <DollarSign size={24} className="text-black" />
          </div>
        </div>
      </div>

      {/* Global KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative overflow-hidden bg-accent-4 border border-accent/20 rounded-2xl p-6">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl bg-accent/20" />
          <p className="text-muted text-sm mb-1">Solde Global</p>
          <p className="text-primary font-black text-4xl">{formatCurrency(globalStats.soldeGlobal)}</p>
          <div className="flex items-center gap-1 text-accent text-sm mt-2">
            <TrendingUp size={14} />
            <span>+18.4% vs mois dernier</span>
          </div>
        </div>
        <div className="relative overflow-hidden bg-success-bg border border-success/20 rounded-2xl p-6">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl bg-success/20" />
          <p className="text-muted text-sm mb-1">Total Revenus</p>
          <p className="text-success font-black text-4xl">{formatCurrency(totalEntrees)}</p>
          <div className="flex items-center gap-1 text-success text-sm mt-2">
            <ArrowUpRight size={14} />
            <span>{state.transactions.filter(t => t.type === 'entree').length} transactions</span>
          </div>
        </div>
        <div className="relative overflow-hidden bg-danger-bg border border-danger/20 rounded-2xl p-6">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl bg-danger/20" />
          <p className="text-muted text-sm mb-1">Total Dépenses</p>
          <p className="text-danger font-black text-4xl">{formatCurrency(totalSorties)}</p>
          <div className="flex items-center gap-1 text-danger text-sm mt-2">
            <ArrowDownRight size={14} />
            <span>{state.transactions.filter(t => t.type === 'sortie').length} transactions</span>
          </div>
        </div>
      </div>

      {/* Caisses par Module */}
      <div>
        <h3 className="text-primary font-semibold mb-4">Caisses par Module</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {modulesSoldes.map(m => {
            const config = moduleConfig[m.module];
            const pct = totalEntrees > 0 ? (m.entrees / totalEntrees) * 100 : 0;
            return (
              <div key={m.module} className="bg-surface border border-base rounded-2xl overflow-hidden hover:border-accent transition-all">
                <div className={`p-4 bg-gradient-to-r ${config.gradient}`}>
                  <p className="text-white/80 text-xs font-medium uppercase tracking-wide">{config.label}</p>
                  <p className="text-white font-black text-2xl mt-1">{formatCurrency(m.solde)}</p>
                  <p className="text-white/60 text-xs mt-0.5">{pct.toFixed(1)}% du total</p>
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted">Entrées</span>
                    <span className="text-success font-semibold">{formatCurrency(m.entrees)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted">Sorties</span>
                    <span className="text-danger font-semibold">{formatCurrency(m.sorties)}</span>
                  </div>
                  <div className="progress-bar h-1.5 mt-2">
                    <div className={`progress-fill h-full bg-gradient-to-r ${config.gradient}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface border border-base rounded-2xl p-6">
          <h3 className="text-primary font-semibold mb-6">Entrées vs Sorties par Module</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#aaaaaa', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#aaaaaa', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k€`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="entrees" fill="#4ade80" radius={[3, 3, 0, 0]} name="entrees" />
              <Bar dataKey="sorties" fill="#f87171" radius={[3, 3, 0, 0]} name="sorties" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-surface border border-base rounded-2xl p-6">
          <h3 className="text-primary font-semibold mb-4">Répartition des Revenus</h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [formatCurrency(v), '']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-1 gap-2 mt-2">
            {pieData.map(entry => (
              <div key={entry.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-muted">{entry.name}</span>
                </div>
                <span className="text-primary font-medium">{formatCurrency(entry.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* All Transactions */}
      <div className="bg-surface border border-base rounded-2xl overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-4 border-b border-base">
          <h3 className="text-primary font-semibold">Historique des Transactions</h3>
          <div className="flex flex-wrap gap-2">
            {[{ value: 'all', label: 'Tout' }, ...Object.entries(moduleConfig).map(([k, v]) => ({ value: k, label: v.label }))].map(f => (
              <button
                key={f.value}
                onClick={() => setActiveFilter(f.value)}
                className={`tab px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeFilter === f.value ? 'active' : ''
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="divide-y divide-base max-h-96 overflow-y-auto">
          {allTransactions.map(tx => (
            <div key={tx.id} className="flex items-center gap-4 px-6 py-4 hover:bg-surface-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tx.type === 'entree' ? 'bg-success-bg' : 'bg-danger-bg'}`}>
                {tx.type === 'entree' ? <ArrowUpRight size={18} className="text-success" /> : <ArrowDownRight size={18} className="text-danger" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-primary text-sm font-medium truncate">{tx.description}</p>
                <p className="text-muted text-xs">
                  <span className="capitalize" style={{ color: moduleConfig[tx.module]?.color }}>{moduleConfig[tx.module]?.label}</span>
                  {' • '}{tx.categorie} • {tx.userName} • {formatDate(tx.date)}
                </p>
              </div>
              <div className={`font-bold whitespace-nowrap ${tx.type === 'entree' ? 'text-success' : 'text-danger'}`}>
                {tx.type === 'entree' ? '+' : '-'}{formatCurrency(tx.montant)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};