import React from 'react';
import { Button } from '../../UI';
import { Package } from 'lucide-react';

export const StockTab: React.FC = () => {
  const categories = ['Jetons', 'Cartes à jouer', 'Équipement', 'Bar', 'Sécurité', 'Fournitures', 'Autre'];

  return (
    <div className="rounded-2xl overflow-hidden w-full" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
      <div className="p-4">
        <h3 className="text-primary font-semibold text-sm sm:text-base flex items-center gap-2 mb-4">
          <Package size={18} className="text-accent" />
          Gestion des Stocks Casino
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {categories.map((cat, index) => (
            <div 
              key={index} 
              className="rounded-xl p-4 border transition-all"
              style={{ backgroundColor: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}
            >
              <div className="flex items-start justify-between mb-2">
                <p className="text-secondary text-sm font-medium">{cat}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-accent font-bold">0 unités</p>
                <Button size="sm" variant="secondary">+ Ajouter</Button>
              </div>
            </div>
          ))}
        </div>

        <div 
          className="mt-4 p-4 rounded-xl border flex justify-between items-center"
          style={{ backgroundColor: 'var(--color-accent-4)', borderColor: 'rgba(212, 168, 71, 0.2)' }}
        >
          <p className="text-accent text-sm">📦 Total produits en stock : 0</p>
          <Button size="sm" variant="secondary">Voir l'historique</Button>
        </div>
      </div>
    </div>
  );
};