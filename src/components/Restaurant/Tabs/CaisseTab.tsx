import React from 'react';
import { CaisseManager } from '../../StockManager';

interface CaisseTabProps {
  // Gardé pour compatibilité si le composant parent transmet ces props, 
  // même si CaisseManager gère ses propres appels/données en interne.
  orders?: any[];
  onPayment?: (orderId: number) => void;
}

export const CaisseTab: React.FC<CaisseTabProps> = () => {
  return (
    <div className="w-full">
      <CaisseManager
        module="restaurant"
        categories={['Ventes Restaurant', 'Stock', 'Personnel', 'Autre']}
        title="Caisse Restaurant"
        gradient="from-accent to-accent-2"
      />
    </div>
  );
};