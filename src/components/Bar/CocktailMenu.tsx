import React from 'react';
import { CocktailCard } from './CocktailCard';
import { BarProduct } from '../../types/bar.type';

interface Props {
  cocktails: BarProduct[];
  onAdd: (cocktail: BarProduct) => void;
}

export const CocktailMenu: React.FC<Props> = ({ cocktails, onAdd }) => (
  <div className="space-y-4">
    <h3 className="text-primary font-semibold">Carte des Cocktails</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cocktails.map(cocktail => (
        <CocktailCard key={cocktail.id} cocktail={cocktail} onAdd={onAdd} />
      ))}
    </div>
  </div>
);