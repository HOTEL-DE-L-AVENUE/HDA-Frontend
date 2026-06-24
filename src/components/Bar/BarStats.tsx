import React from 'react';
import { formatCurrency } from '../../utils/data';
import { BarCaisseStats } from '../../types/bar.type';

interface Props {
  stats: BarCaisseStats;
}

export const BarStats: React.FC<Props> = ({ stats }) => {
  const items = [
    { label: 'Revenu Bar', value: formatCurrency(stats.solde),    className: 'text-primary' },
    { label: 'Entrées',    value: formatCurrency(stats.entrees),  className: 'text-success' },
    { label: 'Sorties',    value: formatCurrency(stats.sorties),  className: 'text-danger'  },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {items.map(item => (
        <div key={item.label} className="bg-surface border border-base rounded-2xl p-5">
          <p className="text-muted text-xs mb-1">{item.label}</p>
          <p className={`${item.className} font-bold text-xl`}>{item.value}</p>
        </div>
      ))}
    </div>
  );
};