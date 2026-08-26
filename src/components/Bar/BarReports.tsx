import React from 'react';
import type { BarCommande, BarStockItem } from '../../types/bar.type';
import { formatCurrency } from '../../utils/data';

interface Props {
  commandes: BarCommande[];
  stock: BarStockItem[];
}

export const BarReports: React.FC<Props> = ({ commandes, stock }) => {
  const ventes = commandes.filter((commande) => commande.statut === 'Encaissée');
  const chiffreAffaires = ventes.reduce((total, commande) => total + commande.total, 0);
  const articlesVendus = ventes.reduce((total, commande) => total + commande.items.reduce((sum, item) => sum + item.quantite, 0), 0);
  const statuses: Array<{ label: string; value: BarCommande['statut'] }> = [
    { label: 'En attente', value: 'En attente' },
    { label: 'En cours', value: 'En préparation' },
    { label: 'Prête', value: 'Prête' },
    { label: 'Servie', value: 'Servie' },
    { label: 'Encaissée', value: 'Encaissée' },
  ];

  return (
    <section className="space-y-4">
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-accent font-semibold">Bar & Lounge</p>
        <h2 className="text-2xl font-bold text-primary">Rapports</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-base bg-surface p-4"><p className="text-xs text-muted">Ventes encaissées</p><p className="mt-2 text-2xl font-bold text-accent">{formatCurrency(chiffreAffaires)}</p></div>
        <div className="rounded-xl border border-base bg-surface p-4"><p className="text-xs text-muted">Articles vendus</p><p className="mt-2 text-2xl font-bold text-primary">{articlesVendus}</p></div>
        <div className="rounded-xl border border-base bg-surface p-4"><p className="text-xs text-muted">Produits en stock</p><p className="mt-2 text-2xl font-bold text-emerald-400">{stock.length}</p></div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-base bg-surface p-4">
          <h3 className="mb-3 font-semibold text-primary">Commandes par étape</h3>
          <div className="space-y-2">{statuses.map((status) => <div key={status.value} className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2 text-sm"><span className="text-secondary">{status.label}</span><strong className="text-accent">{commandes.filter((commande) => commande.statut === status.value).length}</strong></div>)}</div>
        </div>
        <div className="rounded-xl border border-base bg-surface p-4">
          <h3 className="mb-3 font-semibold text-primary">État du stock</h3>
          <div className="space-y-2">{stock.slice(0, 8).map((item) => <div key={item.id} className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2 text-sm"><span className="truncate text-secondary">{item.product_nom}</span><strong className={item.quantite <= 5 ? 'text-amber-400' : 'text-emerald-400'}>{item.quantite} {item.unite}</strong></div>)}</div>
        </div>
      </div>
    </section>
  );
};
