import React from 'react';
import { Star } from 'lucide-react';
import { BEST_SELLERS_MAX_VENTES } from '../../data/Bar.data';
import { BestSeller } from '../../types/bar.type';

interface Props {
  sellers: BestSeller[];
}

export const BestSellers: React.FC<Props> = ({ sellers }) => (
  <div className="bg-surface border border-base rounded-2xl p-6">
    <h3 className="text-primary font-semibold flex items-center gap-2 mb-4">
      <Star size={16} className="text-accent" />
      Meilleures Ventes
    </h3>
    <div className="space-y-3">
      {sellers.map((item, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="w-7 h-7 rounded-full bg-accent-4 flex items-center justify-center flex-shrink-0">
            <span className="text-accent font-bold text-xs">#{i + 1}</span>
          </div>
          <div className="flex-1">
            <div className="flex justify-between mb-1">
              <span className="text-primary text-sm font-medium">{item.nom}</span>
              <span className="text-accent font-semibold text-sm">{item.montant}</span>
            </div>
            <div className="progress-bar h-1.5">
              <div
                className="progress-fill h-full"
                style={{ width: `${(item.ventes / BEST_SELLERS_MAX_VENTES) * 100}%` }}
              />
            </div>
          </div>
          <span className="text-muted text-xs w-14 text-right">{item.ventes} ventes</span>
        </div>
      ))}
    </div>
  </div>
);