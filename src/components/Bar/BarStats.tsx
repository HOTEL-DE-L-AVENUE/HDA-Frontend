import React from 'react';
import { formatCurrency } from '../../utils/data';
import type { BarCommande } from '../../types/bar.type';

interface Props {
  commandes: BarCommande[];
  stockMap: Record<number, { quantite: number; unite: string }>;
  compact?: boolean;
}

export const BarStats: React.FC<Props> = ({ commandes, stockMap, compact = false }) => {
  const revenu = commandes.reduce((total, commande) => total + Number(commande.total || 0), 0);
  const commandesActives = commandes.filter((commande) => commande.statut !== 'Servie').length;
  const stockFaible = Object.values(stockMap).filter((stock) => Number(stock.quantite) <= 5).length;
  const items = [
    { label: 'Revenu des commandes', value: formatCurrency(revenu), className: 'text-primary' },
    { label: 'Commandes actives', value: String(commandesActives), className: 'text-success' },
    { label: 'Produits à réapprovisionner', value: String(stockFaible), className: stockFaible > 0 ? 'text-danger' : 'text-success' },
  ];

  return (
    <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 ${compact ? 'sm:gap-2' : 'sm:gap-4'}`}>
      {items.map(item => (
        <div key={item.label} className={`border border-base bg-surface ${compact ? 'rounded-xl p-2 sm:p-2.5' : 'rounded-2xl p-4 sm:p-5'}`}>
          <p className={`text-muted mb-1 ${compact ? 'text-[10px] sm:text-[11px]' : 'text-xs'}`}>{item.label}</p>
          <p className={`${item.className} font-bold ${compact ? 'text-sm sm:text-base' : 'text-lg sm:text-xl'}`}>{item.value}</p>
        </div>
      ))}
    </div>
  );
};
