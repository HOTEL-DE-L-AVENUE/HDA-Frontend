import React from 'react';
import { formatCurrency } from '../../utils/data';
import type { BarCommande } from '../../types/bar.type';
import { ShoppingCart, Clock, CheckCircle, TrendingUp } from 'lucide-react';

interface Props {
  commandes: BarCommande[];
  stockMap: Record<number, { quantite: number; unite: string }>;
  compact?: boolean;
}

export const BarStats: React.FC<Props> = ({ commandes, stockMap, compact = false }) => {
  const paidOrders = commandes.filter((commande) => ['Payée', 'PAYE', 'PAYEE', 'Encaissée'].includes(commande.statut));
  const currentOrders = commandes.filter((commande) => ['En attente', 'En préparation', 'Prête', 'Servie'].includes(commande.statut));
  const revenue = paidOrders.reduce((total, commande) => total + Number(commande.total || 0), 0);
  const items = [
    { label: 'Total Commandes', value: String(commandes.length), icon: <ShoppingCart size={20} className="text-black" /> },
    { label: 'En Cours', value: String(currentOrders.length), icon: <Clock size={20} className="text-black" /> },
    { label: 'Payées', value: String(paidOrders.length), icon: <CheckCircle size={20} className="text-black" /> },
    { label: 'CA Journée', value: formatCurrency(revenue), icon: <TrendingUp size={20} className="text-black" /> },
  ];

  return (
    <div className={`grid w-full grid-cols-2 gap-3 lg:grid-cols-4 ${compact ? 'sm:gap-2' : 'sm:gap-4'}`}>
      {items.map(item => (
        <div
          key={item.label}
          className={`flex min-w-0 items-center gap-3 border border-base bg-surface ${compact ? 'rounded-xl p-2.5' : 'rounded-2xl p-3 md:p-4 md:gap-4'}`}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent md:h-10 md:w-10">
            {item.icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className={`truncate text-muted ${compact ? 'text-[10px]' : 'text-[10px] md:text-xs'}`}>{item.label}</p>
            <p className={`truncate font-bold text-primary ${compact ? 'text-sm' : 'text-base md:text-lg'}`}>{item.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
