import React, { useState, useEffect, useCallback } from 'react';
import { formatCurrency, formatDate } from '../../utils/data';
import { ArrowUpRight, RefreshCw, Loader2, AlertCircle, Printer } from 'lucide-react';
import { getBarTransactions } from '../../services/bar.service';

interface Transaction {
  id: number;
  order_id?: number | null;
  table_id?: number | null;
  product_id: number;
  quantite: number;
  prix_unitaire: number;
  created_at: string;
  nom: string;
  categorie: string;
}

interface BarTransactionsCardProps {
  title?: string;
}

export default function BarTransactionsCard({ title = 'Transactions Caisse' }: BarTransactionsCardProps) {
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
  }, [fetchTransactions]);

  const totalVentes = transactions.reduce((sum, tx) => sum + (tx.quantite * tx.prix_unitaire), 0);
  const totalQuantite = transactions.reduce((sum, tx) => sum + tx.quantite, 0);

  const handlePrintTransaction = (tx: Transaction) => {
    const printWindow = window.open('', '_blank', 'width=620,height=500');
    if (!printWindow) {
      window.alert('Autorisez les pop-ups pour imprimer cette transaction.');
      return;
    }

    printWindow.document.write(`<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Transaction Bar #${tx.id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 28px; color: #111; }
            h1 { margin: 0 0 12px; font-size: 24px; }
            .meta { color: #444; font-size: 12px; margin-bottom: 18px; }
            .box { border: 1px solid #ddd; border-radius: 8px; padding: 14px; }
            .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #eee; }
            .label { color: #555; }
            .total { margin-top: 18px; font-size: 18px; font-weight: bold; text-align: right; }
          </style>
        </head>
        <body>
          <h1>Transaction Bar</h1>
          <div class="meta">Date : ${new Date(tx.created_at).toLocaleString('fr-FR')}</div>
          <div class="box">
            <div class="row"><span class="label">Produit</span><strong>${tx.nom}</strong></div>
            <div class="row"><span class="label">Catégorie</span><span>${tx.categorie}</span></div>
            <div class="row"><span class="label">Quantité</span><span>${tx.quantite}</span></div>
            <div class="row"><span class="label">Prix unitaire</span><span>${formatCurrency(tx.prix_unitaire)}</span></div>
            <div class="row"><span class="label">Commande</span><span>${tx.order_id ? `#${tx.order_id}` : '—'}</span></div>
            <div class="row"><span class="label">Table</span><span>${tx.table_id ? tx.table_id : '—'}</span></div>
            <div class="total">Total : ${formatCurrency(tx.quantite * tx.prix_unitaire)}</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handlePrintTransactions = () => {
    const printWindow = window.open('', '_blank', 'width=820,height=840');
    if (!printWindow) {
      window.alert('Autorisez les pop-ups pour imprimer le relevé de caisse.');
      return;
    }

    const rows = transactions.map((tx) => `
      <tr>
        <td>${tx.nom}</td>
        <td>${tx.categorie}</td>
        <td>${tx.quantite}</td>
        <td>${formatCurrency(tx.prix_unitaire)}</td>
        <td>${formatCurrency(tx.quantite * tx.prix_unitaire)}</td>
      </tr>
    `).join('');

    printWindow.document.write(`<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Transactions Bar</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 28px; color: #111; }
            h1 { margin: 0 0 10px; font-size: 22px; }
            .meta { color: #444; font-size: 12px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border-bottom: 1px solid #ddd; padding: 8px 6px; text-align: left; font-size: 12px; }
            th { background: #f5f5f5; }
            .right { text-align: right; }
            .total { margin-top: 18px; font-size: 18px; font-weight: bold; text-align: right; }
          </style>
        </head>
        <body>
          <h1>Transactions Bar</h1>
          <div class="meta">Date : ${new Date().toLocaleString('fr-FR')}</div>
          <table>
            <thead>
              <tr>
                <th>Produit</th>
                <th>Catégorie</th>
                <th>Qté</th>
                <th class="right">Prix U.</th>
                <th class="right">Total</th>
              </tr>
            </thead>
            <tbody>${rows || '<tr><td colspan="5">Aucune transaction</td></tr>'}</tbody>
          </table>
          <div class="total">Total ventes : ${formatCurrency(totalVentes)}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
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
          <p className="text-slate-500 text-xs font-medium mb-1">Transactions</p>
          <p className="text-white font-bold text-lg">{transactions.length}</p>
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
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintTransactions}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all"
              title="Imprimer les transactions"
              aria-label="Imprimer les transactions"
            >
              <Printer size={14} />
            </button>
            <button
              onClick={fetchTransactions}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all"
              title="Actualiser"
              aria-label="Actualiser les transactions"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
        <div className="divide-y divide-slate-800/30 max-h-[500px] overflow-y-auto">
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-slate-600">Aucune transaction</div>
          ) : transactions.map(tx => (
            <div key={tx.id} className="flex items-center gap-3 px-6 py-4 hover:bg-slate-800/20 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                <ArrowUpRight size={18} className="text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{tx.nom}</p>
                <p className="text-slate-500 text-xs">{tx.categorie}{tx.order_id ? ` • Commande #${tx.order_id}` : ''}{tx.table_id ? ` • Table ${tx.table_id}` : ''} • {formatDate(tx.created_at)}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-white text-sm font-semibold">x{tx.quantite}</p>
                <p className="text-amber-400 text-sm font-bold">{formatCurrency(tx.quantite * tx.prix_unitaire)}</p>
              </div>
              <button
                type="button"
                onClick={() => handlePrintTransaction(tx)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all"
                title="Imprimer cette transaction"
                aria-label={`Imprimer la transaction ${tx.nom}`}
              >
                <Printer size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}