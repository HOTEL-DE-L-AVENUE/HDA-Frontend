import React, { useState, useEffect } from 'react';
import { formatCurrency, formatDate } from '../utils/data';
import { ModuleType } from '../types';
import { DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Download, Filter, Plus, CreditCard } from 'lucide-react';
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import financeService, { FinancialTransaction, ModuleCaisseSolde, FinancialStats } from '../services/finance.service';
import { CreateInvoiceModal } from '../components/Finance/modals/CreateInvoiceModal';
import { RecordPaymentModal } from '../components/Finance/modals/RecordPaymentModal';

const moduleConfig: Record<string, { label: string; gradient: string; color: string }> = {
  hebergement: { label: 'Hébergement', gradient: 'from-blue-500 to-cyan-600', color: '#3b82f6' },
  hotel: { label: 'Hôtel', gradient: 'from-indigo-500 to-blue-600', color: '#6366f1' },
  restaurant: { label: 'Restaurant', gradient: 'from-orange-500 to-amber-600', color: '#f97316' },
  bar: { label: 'Bar & Lounge', gradient: 'from-rose-500 to-pink-600', color: '#f43f5e' },
  casino: { label: 'Casino', gradient: 'from-emerald-500 to-green-600', color: '#10b981' },
  general: { label: 'Général', gradient: 'from-gray-500 to-gray-600', color: '#6b7280' },
  facturation: { label: 'Facturation', gradient: 'from-purple-500 to-purple-600', color: '#8b5cf6' },
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
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [financialStats, setFinancialStats] = useState<FinancialStats>({
    totalRevenu: 0,
    totalDepenses: 0,
    soldeGlobal: 0
  });
  const [modulesSoldes, setModulesSoldes] = useState<Array<{ module: ModuleType } & ModuleCaisseSolde>>([]);
  
  // Modal states
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);

  // Fetch financial data on component mount
  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [transactionsData, statsData, hebergementSolde, hotelSolde, restaurantSolde, barSolde, casinoSolde] = await Promise.all([
        financeService.getTransactions(),
        financeService.getFinancialStats(),
        financeService.getModuleCaisseSolde('hebergement'),
        financeService.getModuleCaisseSolde('hotel'),
        financeService.getModuleCaisseSolde('restaurant'),
        financeService.getModuleCaisseSolde('bar'),
        financeService.getModuleCaisseSolde('casino'),
      ]);

      setTransactions(transactionsData);
      setFinancialStats(statsData);
      
      setModulesSoldes([
        { module: 'hebergement' as ModuleType, ...hebergementSolde },
        { module: 'hotel' as ModuleType, ...hotelSolde },
        { module: 'restaurant' as ModuleType, ...restaurantSolde },
        { module: 'bar' as ModuleType, ...barSolde },
        { module: 'casino' as ModuleType, ...casinoSolde },
      ]);
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    try {
      // Check if there is any data to export
      const hasTransactions = transactions.length > 0;
      const hasModuleData = modulesSoldes.length > 0;

      if (!hasTransactions && !hasModuleData) {
        alert('Aucune donnée financière à exporter. Veuillez vérifier que les données sont chargées.');
        return;
      }

      // Create CSV content
      const csvRows: string[][] = [];
      
      // Add header section with report metadata
      csvRows.push(['RAPPORT FINANCIER - HOTEL DE L\'AVENUE (HDA)']);
      csvRows.push(['Généré le:', new Date().toLocaleString('fr-FR')]);
      csvRows.push(['Nombre total de transactions:', transactions.length.toString()]);
      csvRows.push([]);
      
      // ── Section 1: Global statistics ──
      csvRows.push(['═══ STATISTIQUES GLOBALES ═══']);
      csvRows.push(['Indicateur', 'Montant (MGA)']);
      csvRows.push(['Solde Global', financialStats.soldeGlobal.toString()]);
      csvRows.push(['Total Revenus', financialStats.totalRevenu.toString()]);
      csvRows.push(['Total Dépenses', financialStats.totalDepenses.toString()]);
      csvRows.push([]);
      
      // ── Section 2: Module-specific caisse data ──
      csvRows.push(['═══ CAISSES PAR MODULE ═══']);
      csvRows.push(['Module', 'Solde (MGA)', 'Entrées (MGA)', 'Sorties (MGA)']);
      if (hasModuleData) {
        modulesSoldes.forEach(m => {
          csvRows.push([
            moduleConfig[m.module]?.label || m.module,
            m.solde.toString(),
            m.entrees.toString(),
            m.sorties.toString()
          ]);
        });
      } else {
        csvRows.push(['Aucune donnée de caisse disponible']);
      }
      csvRows.push([]);
      
      // ── Section 3: Full transaction history (ALL transactions, not filtered) ──
      csvRows.push(['═══ HISTORIQUE COMPLET DES TRANSACTIONS ═══']);
      csvRows.push(['ID', 'Date', 'Module', 'Type de Flux', 'Description', 'Montant (MGA)', 'Référence', 'Statut Sync']);
      
      if (hasTransactions) {
        // Use raw transactions from backend (not the filtered allTransactions)
        // Sort by date descending for the export
        const sortedTransactions = [...transactions].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        sortedTransactions.forEach(tx => {
          const moduleName = moduleConfig[tx.module?.toLowerCase()]?.label || tx.module || 'Inconnu';
          csvRows.push([
            tx.id.toString(),
            tx.created_at ? formatDate(tx.created_at) : 'N/A',
            moduleName,
            tx.type_flux?.toUpperCase().includes('ENTREE') ? 'ENTRÉE' : 'SORTIE',
            tx.description || 'Transaction',
            Number(tx.montant).toString(),
            tx.ref_flux_global || '',
            tx.statut_sync || ''
          ]);
        });
      } else {
        csvRows.push(['Aucune transaction enregistrée']);
      }
      
      // Convert to CSV string with proper escaping
      const csvContent = csvRows.map(row => 
        row.map(cell => {
          const cellStr = String(cell ?? '');
          // Wrap in quotes if contains comma, quote, newline, or semicolon
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n') || cellStr.includes(';')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        }).join(',')
      ).join('\n');
      
      // Create and trigger download with BOM for Excel UTF-8 compatibility
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      const filename = `rapport_financier_HDA_${new Date().toISOString().split('T')[0]}.csv`;
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup the object URL
      URL.revokeObjectURL(url);
      
      console.log(`✅ Export financier réussi: ${filename} (${transactions.length} transactions)`);
    } catch (error) {
      console.error('❌ Erreur lors de l\'export:', error);
      alert('Erreur lors de l\'export des données financières. Veuillez réessayer.');
    }
  };

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

  // All transactions - convert backend format to frontend format
  const allTransactions = transactions
    .filter(tx => activeFilter === 'all' || tx.module === activeFilter)
    .map(tx => {
      // Map backend module names to frontend ModuleType
      let module: ModuleType = 'hebergement'; // default
      const moduleLower = tx.module?.toLowerCase() || '';
      if (moduleLower.includes('hebergement')) module = 'hebergement';
      else if (moduleLower.includes('hotel')) module = 'hotel';
      else if (moduleLower.includes('restaurant')) module = 'restaurant';
      else if (moduleLower.includes('bar')) module = 'bar';
      else if (moduleLower.includes('casino')) module = 'casino';
      
      return {
        id: tx.id.toString(),
        type: tx.type_flux === 'ENTREE' ? 'entree' : 'sortie',
        montant: Number(tx.montant),
        description: tx.description || 'Transaction',
        categorie: tx.module || 'Général',
        userId: '0',
        userName: 'Système',
        module,
        date: tx.created_at || new Date().toISOString(),
      };
    })
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
          <button 
            onClick={() => setShowCreateInvoiceModal(true)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-2 border border-base text-muted hover:text-primary text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={16} />
            <span className="hidden md:inline">Facture</span>
          </button>
          <button 
            onClick={() => setShowRecordPaymentModal(true)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-2 border border-base text-muted hover:text-primary text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CreditCard size={16} />
            <span className="hidden md:inline">Paiement</span>
          </button>
          <button 
            onClick={handleExport}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-2 border border-base text-muted hover:text-primary text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={16} />
            <span className="hidden md:inline">Exporter</span>
          </button>
          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
            <DollarSign size={24} className="text-black" />
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted">Chargement des données financières...</div>
        </div>
      ) : (
        <>
      {/* Global KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative overflow-hidden bg-accent-4 border border-accent/20 rounded-2xl p-6">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl bg-accent/20" />
          <p className="text-muted text-sm mb-1">Solde Global</p>
          <p className="text-primary font-black text-4xl">{formatCurrency(financialStats.soldeGlobal)}</p>
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
            <span>{allTransactions.filter(t => t.type === 'entree').length} transactions</span>
          </div>
        </div>
        <div className="relative overflow-hidden bg-danger-bg border border-danger/20 rounded-2xl p-6">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl bg-danger/20" />
          <p className="text-muted text-sm mb-1">Total Dépenses</p>
          <p className="text-danger font-black text-4xl">{formatCurrency(totalSorties)}</p>
          <div className="flex items-center gap-1 text-danger text-sm mt-2">
            <ArrowDownRight size={14} />
            <span>{allTransactions.filter(t => t.type === 'sortie').length} transactions</span>
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
              <YAxis tick={{ fill: '#aaaaaa', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k MGA`} />
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
            {[{ value: 'all', label: 'Tout' }, ...Object.entries(moduleConfig).filter(([k]) => ['hebergement', 'hotel', 'restaurant', 'bar', 'casino'].includes(k)).map(([k, v]) => ({ value: k, label: v.label }))].map(f => (
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
          {allTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center mb-4">
                <DollarSign size={32} className="text-muted" />
              </div>
              <p className="text-muted text-sm">Aucune transaction trouvée</p>
              <p className="text-muted text-xs mt-1">Les transactions apparaîtront ici une fois les données disponibles</p>
            </div>
          ) : (
            allTransactions.map(tx => (
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
            ))
          )}
        </div>
      </div>
    </>
    )}
    
    {/* Modals */}
    <CreateInvoiceModal
      isOpen={showCreateInvoiceModal}
      onClose={() => setShowCreateInvoiceModal(false)}
      onSuccess={() => {
        fetchFinancialData();
        setShowCreateInvoiceModal(false);
      }}
    />
    
    <RecordPaymentModal
      isOpen={showRecordPaymentModal}
      onClose={() => setShowRecordPaymentModal(false)}
      onSuccess={() => {
        fetchFinancialData();
        setShowRecordPaymentModal(false);
      }}
    />
    </div>
  );
};