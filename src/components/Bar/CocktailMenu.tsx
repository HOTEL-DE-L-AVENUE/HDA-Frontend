import React from 'react';
import { CocktailCard } from './CocktailCard';
import { BarProduct } from '../../types/bar.type';

interface Props {
  cocktails: BarProduct[];
  stockMap?: Record<number, { quantite: number; unite: string }>;
  onStockUpdate?: () => void;
  onAddToOrder?: (cocktail: BarProduct) => boolean | void | Promise<void>;
}

export const CocktailMenu: React.FC<Props> = ({ cocktails, stockMap, onStockUpdate, onAddToOrder }) => {
  if (cocktails.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-primary font-semibold">Carte des Cocktails</h3>
        <div className="text-center py-12 text-slate-500">
          Aucun cocktail disponible pour le moment.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-primary font-semibold">Carte des Cocktails</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cocktails.map(cocktail => (
          <CocktailCard
            key={cocktail.id}
            cocktail={cocktail}
            stock={stockMap?.[cocktail.id]}
            onStockUpdate={onStockUpdate}
            onAddToOrder={onAddToOrder}
          />
        ))}
      </div>
    </div>
  );
};