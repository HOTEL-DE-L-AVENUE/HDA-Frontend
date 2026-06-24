import React from 'react';
import { BarProduct } from '../../types/bar.type';
import { formatCurrency } from '../../utils/data';

interface Props {
  cocktail: BarProduct;
  onAdd: (cocktail: BarProduct) => void;
}

export const CocktailCard: React.FC<Props> = ({ cocktail, onAdd }) => (
  <div className="bg-surface border border-base rounded-2xl p-5 hover:border-accent hover:shadow-accent transition-all group">
    <div className="flex items-start justify-between mb-3">
      <span className="badge-accent px-2.5 py-1 rounded-lg text-xs font-medium">
        {cocktail.categorie}
      </span>
      {!cocktail.alcool && (
        <span className="badge-success px-2 py-0.5 rounded-full text-xs border border-success">
          Sans alcool
        </span>
      )}
    </div>
    <h4 className="text-primary font-semibold mb-2">{cocktail.nom}</h4>
    <p className="text-muted text-xs mb-4 leading-relaxed">{cocktail.ingredients}</p>
    <div className="flex items-center justify-between">
      <span className="text-accent font-bold text-lg">{formatCurrency(cocktail.prix)}</span>
      <button
        onClick={() => onAdd(cocktail)}
        className="w-8 h-8 rounded-lg bg-accent-4 hover:bg-accent/20 flex items-center justify-center text-accent transition-all text-lg"
        aria-label={`Ajouter ${cocktail.nom}`}
      >
        +
      </button>
    </div>
  </div>
);