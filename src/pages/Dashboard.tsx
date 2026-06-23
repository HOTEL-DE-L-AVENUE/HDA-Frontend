import React from 'react';
import { useHDA } from '../context/HDAContext';
import { StatCard } from '../components/UI';
import { formatCurrency } from '../utils/data';
import { 
  DollarSign, TrendingUp, TrendingDown, Package, 
  AlertTriangle, Activity, BedDouble, Hotel, 
  UtensilsCrossed, Wine, Dices, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend 
} from 'recharts';

const revenueData = [
  { mois: 'Jan', hebergement: 42000, hotel: 38000, restaurant: 28000, bar: 18000, casino: 95000 },
  { mois: 'Fév', hebergement: 38000, hotel: 42000, restaurant: 31000, bar: 22000, casino: 88000 },
  { mois: 'Mar', hebergement: 55000, hotel: 48000, restaurant: 35000, bar: 25000, casino: 112000 },
  { mois: 'Avr', hebergement: 62000, hotel: 55000, restaurant: 40000, bar: 28000, casino: 125000 },
  { mois: 'Mai', hebergement: 58000, hotel: 52000, restaurant: 38000, bar: 26000, casino: 108000 },
  { mois: 'Jun', hebergement: 75000, hotel: 68000, restaurant: 48000, bar: 34000, casino: 145000 },
];

const COLORS = ['#6366f1', '#3b82f6', '#f97316', '#f43f5e', '#10b981'];

export const Dashboard: React.FC = () => {
  const { state, getModuleCaisseSolde, getCasinoTotalCaisse, getGlobalStats } = useHDA();
  
  const globalStats = getGlobalStats();
  const hebergement = getModuleCaisseSolde('hebergement');
  const hotel = getModuleCaisseSolde('hotel');
  const restaurant = getModuleCaisseSolde('restaurant');
  const bar = getModuleCaisseSolde('bar');
  const casino = getCasinoTotalCaisse();

  const stockAlerts = state.stockItems.filter(s => s.status !== 'disponible').length;
  const totalStockValue = state.stockItems.reduce((sum, s) => sum + (s.quantite * s.prixUnitaire), 0);

  const pieData = [
    { name: 'Hébergement', value: hebergement.entrees },
    { name: 'Hôtel', value: hotel.entrees },
    { name: 'Restaurant', value: restaurant.entrees },
    { name: 'Bar', value: bar.entrees },
    { name: 'Casino', value: casino.entrees },
  ];

  const moduleCards = [
    { label: 'Hébergement', solde: hebergement.solde, entrees: hebergement.entrees, sorties: hebergement.sorties, icon: <BedDouble size={16} className="text-white" />, gradient: 'from-blue-600 to-cyan-500', trend: 12.4 },
    { label: 'Hôtel', solde: hotel.solde, entrees: hotel.entrees, sorties: hotel.sorties, icon: <Hotel size={16} className="text-white" />, gradient: 'from-indigo-600 to-blue-500', trend: 8.2 },
    { label: 'Restaurant', solde: restaurant.solde, entrees: restaurant.entrees, sorties: restaurant.sorties, icon: <UtensilsCrossed size={16} className="text-white" />, gradient: 'from-orange-600 to-amber-500', trend: -2.1 },
    { label: 'Bar & Lounge', solde: bar.solde, entrees: bar.entrees, sorties: bar.sorties, icon: <Wine size={16} className="text-white" />, gradient: 'from-rose-600 to-pink-500', trend: 21.5 },
    { label: 'Casino', solde: casino.solde, entrees: casino.entrees, sorties: casino.sorties, icon: <Dices size={16} className="text-white" />, gradient: 'from-emerald-600 to-green-500', trend: 34.8 },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-4 shadow-2xl">
          <p className="text-slate-400 text-xs font-semibold mb-2">{label}</p>
          {payload.map((entry: any) => (
            <div key={entry.name} className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-300">{entry.name}:</span>
              <span className="text-white font-semibold">{formatCurrency(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Hero Stats */}
      <div>
        <div className="mb-6">
          <h2 className="text-white text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>
            Vue d'ensemble
          </h2>
          <p className="text-slate-500 text-sm mt-1">Performance globale de la plateforme HDA</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Solde Global"
            value={globalStats.soldeGlobal}
            icon={<DollarSign size={20} className="text-white" />}
            gradient="from-amber-500 to-orange-600"
            trend={18.4}
            subtitle="Tous modules confondus"
            isCurrency
          />
          <StatCard
            title="Revenus Totaux"
            value={globalStats.totalRevenu}
            icon={<TrendingUp size={20} className="text-white" />}
            gradient="from-emerald-500 to-green-600"
            trend={24.1}
            subtitle={`${state.transactions.filter(t => t.type === 'entree').length} transactions`}
            isCurrency
          />
          <StatCard
            title="Dépenses Totales"
            value={globalStats.totalDepenses}
            icon={<TrendingDown size={20} className="text-white" />}
            gradient="from-red-500 to-rose-600"
            trend={-5.3}
            subtitle={`${state.transactions.filter(t => t.type === 'sortie').length} transactions`}
            isCurrency
          />
          <StatCard
            title="Valeur du Stock"
            value={totalStockValue}
            icon={<Package size={20} className="text-white" />}
            gradient="from-violet-500 to-purple-600"
            trend={3.2}
            subtitle={`${stockAlerts} alertes stock`}
            isCurrency
          />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-white font-semibold">Évolution des Revenus</h3>
              <p className="text-slate-500 text-sm">6 derniers mois par module</p>
            </div>
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
              <TrendingUp size={16} />
              <span>+18.4%</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenueData}>
              <defs>
                {['hebergement', 'hotel', 'restaurant', 'bar', 'casino'].map((key, i) => (
                  <linearGradient key={key} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS[i]} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS[i]} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="mois" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k€`} />
              <Tooltip content={<CustomTooltip />} />
              {['hebergement', 'hotel', 'restaurant', 'bar', 'casino'].map((key, i) => (
                <Area key={key} type="monotone" dataKey={key} stroke={COLORS[i]} strokeWidth={2} fill={`url(#gradient-${key})`} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-slate-900 border border-slate-800/50 rounded-2xl p-6">
          <div className="mb-6">
            <h3 className="text-white font-semibold">Répartition Revenus</h3>
            <p className="text-slate-500 text-sm">Par module</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [formatCurrency(value), '']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-4">
            {pieData.map((entry, i) => (
              <div key={entry.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-slate-400">{entry.name}</span>
                </div>
                <span className="text-white font-medium">{formatCurrency(entry.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Module Cards */}
      <div>
        <h3 className="text-white font-semibold mb-4">Performance par Module</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {moduleCards.map((mod) => (
            <div key={mod.label} className="bg-slate-900 border border-slate-800/50 rounded-2xl p-5 hover:border-slate-700/50 transition-all group relative overflow-hidden">
              <div className={`absolute inset-0 bg-gradient-to-br ${mod.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${mod.gradient} flex items-center justify-center`}>
                  {mod.icon}
                </div>
                <div className={`flex items-center gap-1 text-xs font-semibold ${mod.trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {mod.trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {Math.abs(mod.trend)}%
                </div>
              </div>
              <p className="text-slate-500 text-xs font-medium mb-1">{mod.label}</p>
              <p className="text-white font-bold text-xl">{formatCurrency(mod.solde)}</p>
              <div className="flex gap-3 mt-3 pt-3 border-t border-slate-800/50">
                <div className="flex-1">
                  <p className="text-xs text-slate-600">Entrées</p>
                  <p className="text-xs text-emerald-400 font-semibold">{formatCurrency(mod.entrees)}</p>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-600">Sorties</p>
                  <p className="text-xs text-red-400 font-semibold">{formatCurrency(mod.sorties)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-slate-900 border border-slate-800/50 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/50">
            <h3 className="text-white font-semibold">Dernières Transactions</h3>
            <button className="text-amber-400 text-sm hover:text-amber-300 transition-colors">Tout voir</button>
          </div>
          <div className="divide-y divide-slate-800/30">
            {state.transactions.slice(0, 6).map(tx => (
              <div key={tx.id} className="flex items-center gap-4 px-6 py-3 hover:bg-slate-800/20 transition-colors">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  tx.type === 'entree' ? 'bg-emerald-500/15' : 'bg-red-500/15'
                }`}>
                  {tx.type === 'entree' 
                    ? <ArrowUpRight size={16} className="text-emerald-400" />
                    : <ArrowDownRight size={16} className="text-red-400" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{tx.description}</p>
                  <p className="text-slate-500 text-xs capitalize">{tx.module} • {tx.userName}</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-sm ${tx.type === 'entree' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {tx.type === 'entree' ? '+' : '-'}{formatCurrency(tx.montant)}
                  </p>
                  <p className="text-slate-600 text-xs">
                    {new Date(tx.date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stock Alerts */}
        <div className="bg-slate-900 border border-slate-800/50 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/50">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-400" />
              Alertes Stock
            </h3>
            <span className="text-xs bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-medium">
              {stockAlerts} alertes
            </span>
          </div>
          <div className="divide-y divide-slate-800/30">
            {state.stockItems.filter(s => s.status !== 'disponible').slice(0, 6).map(item => (
              <div key={item.id} className="flex items-center gap-4 px-6 py-3 hover:bg-slate-800/20 transition-colors">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  item.status === 'epuise' ? 'bg-red-500/15' : 'bg-amber-500/15'
                }`}>
                  <Package size={16} className={item.status === 'epuise' ? 'text-red-400' : 'text-amber-400'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{item.nom}</p>
                  <p className="text-slate-500 text-xs capitalize">{item.module} • {item.categorie}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    item.status === 'epuise' 
                      ? 'bg-red-500/15 text-red-400 border border-red-500/30' 
                      : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  }`}>
                    {item.status === 'epuise' ? 'Épuisé' : `Faible: ${item.quantite} ${item.unite}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
