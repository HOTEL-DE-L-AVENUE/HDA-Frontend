import React, { useState, useEffect, useCallback } from 'react';
import { formatCurrency, formatDate } from '../../utils/data';
import { ArrowUpRight, RefreshCw, Loader2, AlertCircle, Printer } from 'lucide-react';
import { getBarTransactions } from '../../services/bar.service';
import AuthService from '../../services/authService';
import { printOrderReceipt } from '../../utils/thermalPrint';

interface Transaction {
  id: number;
  order_id?: number | null;
  table_id?: number | null;
  client_name?: string;
  moyen_paiement?: string;
  order_total?: number;
  product_id: number;
  quantite: number;
  prix_unitaire: number;
  created_at: string;
  nom: string;
  categorie: string;
}

interface OrderTransaction {
  orderId: number;
  tableId?: number | null;
  client: string;
  paymentMethod?: string;
  total: number;
  createdAt: string;
  items: Transaction[];
}

interface BarTransactionsCardProps {
  title?: string;
  refreshTrigger?: number;
}

export default function BarTransactionsCard({ title = 'Transactions Caisse', refreshTrigger = 0 }: BarTransactionsCardProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getBarTransactions();
      const data = (response as any).data ?? response;
      setTransactions(data as Transaction[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions, refreshTrigger]);

  const totalVentes = transactions.reduce((sum, tx) => sum + (tx.quantite * tx.prix_unitaire), 0);
  const totalQuantite = transactions.reduce((sum, tx) => sum + tx.quantite, 0);

  const orderTransactions = transactions.reduce<OrderTransaction[]>((orders, transaction) => {
    const orderId = transaction.order_id ?? transaction.id;
    let order = orders.find((item) => item.orderId === orderId);
    if (!order) {
      order = {
        orderId,
        tableId: transaction.table_id,
        client: transaction.client_name || 'Client anonyme',
        paymentMethod: transaction.moyen_paiement,
        total: 0,
        createdAt: transaction.created_at,
        items: [],
      };
      orders.push(order);
    }
    order.total += transaction.quantite * transaction.prix_unitaire;
    order.items.push(transaction);
    if (transaction.created_at > order.createdAt) order.createdAt = transaction.created_at;
    return orders;
  }, []);

  const paymentLabels: Record<string, string> = {
    ESPECES: 'Espèces',
    CREDIT: 'Crédit',
    TPE: 'TPE',
    ORANGE_MONEY: 'Orange Money',
    MVOLA: 'MVola',
    GRATUIT: 'Gratuit',
  };

  const handlePrintTransaction = (transaction: OrderTransaction) => {
    const currentUser = AuthService.getCurrentUser();
    const cashier = [currentUser?.prenom, currentUser?.nom].filter(Boolean).join(' ') || currentUser?.email || 'Utilisateur connecté';
    printOrderReceipt({
      module: 'BAR',
      orderId: transaction.orderId,
      client: transaction.client,
      table: transaction.tableId ? `Table ${transaction.tableId}` : '—',
      date: transaction.createdAt,
      cashier,
      terminal: 'BAR-CAISSE',
      paymentMethod: transaction.paymentMethod,
      items: transaction.items.map((item) => ({
        name: item.nom,
        quantity: item.quantite,
        unitPrice: item.prix_unitaire,
      })),
      total: transaction.total,
    });
  };

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800/50 rounded-2xl p-8 flex items-center justify-center">
        <Loader2 className="animate-spin text-amber-400 mr-2" size={20} />
        <span className="text-slate-400 text-sm">Chargement des transactions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-sm flex items-center gap-2">
        <AlertCircle size={16} className="text-red-400" />
        <span className="text-red-400">{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800/50 rounded-xl p-4">
          <p className="text-slate-500 text-xs font-medium mb-1">Total Ventes</p>
          <p className="text-amber-400 font-bold text-lg">{formatCurrency(totalVentes)}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800/50 rounded-xl p-4">
          <p className="text-slate-500 text-xs font-medium mb-1">Commandes</p>
          <p className="text-white font-bold text-lg">{orderTransactions.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800/50 rounded-xl p-4">
          <p className="text-slate-500 text-xs font-medium mb-1">Qt&eacute; Totale</p>
          <p className="text-emerald-400 font-bold text-lg">{totalQuantite}</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800/50 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/50">
          <h3 className="text-white font-semibold flex items-center gap-2">
            {title}
          </h3>
          <button
            onClick={fetchTransactions}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all"
          >
            <RefreshCw size={14} />
          </button>
        </div>
        <div className="divide-y divide-slate-800/30 max-h-[500px] overflow-y-auto">
          {orderTransactions.length === 0 ? (
            <div className="p-8 text-center text-slate-600">Aucune transaction</div>
          ) : orderTransactions.map((transaction) => (
            <div key={transaction.orderId} className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-slate-800/20 sm:px-6">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <ArrowUpRight size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-white">Commande #{transaction.orderId} · {transaction.client}</p>
                <p className="text-xs text-slate-400">
                  Vente Bar{transaction.tableId ? ` · Table ${transaction.tableId}` : ''} · {formatDate(transaction.createdAt)}
                  {transaction.paymentMethod ? ` · ${paymentLabels[transaction.paymentMethod.toUpperCase()] || transaction.paymentMethod}` : ''}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold text-emerald-400">+ {formatCurrency(transaction.total)}</p>
              </div>
              <button
                onClick={() => handlePrintTransaction(transaction)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
                title="Imprimer le reçu de paiement"
                aria-label={`Imprimer le reçu de paiement de la commande ${transaction.orderId}`}
              >
                <Printer size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}