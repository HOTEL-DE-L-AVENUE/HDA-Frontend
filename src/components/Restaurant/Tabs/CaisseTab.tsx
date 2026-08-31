import React from 'react';
import { CaisseManager } from '../../StockManager';

interface CaisseTabProps {
  // Gardé pour compatibilité si le composant parent transmet ces props, 
  // même si CaisseManager gère ses propres appels/données en interne.
  orders?: any[];
  onPayment?: (orderId: number) => void;
}

export const CaisseTab: React.FC<CaisseTabProps> = ({ orders = [], onPayment }) => {
  return (
    <div className="w-full">
      <CaisseManager
        module="restaurant"
        categories={['Ventes Restaurant', 'Stock', 'Personnel', 'Autre']}
        title="Caisse Restaurant"
        gradient="from-accent to-accent-2"
        pendingOrders={orders.filter((order) => order.statut !== 'PAYEE' && order.statut !== 'PAYE' && order.statut !== 'ANNULEE').map((order) => ({
          id: Number(order.id),
          client: order.client_nom || order.client?.nom || 'Client anonyme',
          table: order.table?.numero || order.table_numero || order.table_id,
          total: Number(order.montant_total || (order as any).total || (order.items ? order.items.reduce((s: number, i: any) => s + Number(i.prix_unitaire || i.prix || 0) * Number(i.quantite || 1), 0) : 0)),
          created_at: order.created_at,
          nombre_personnes: order.nombre_personnes,
          moyen_paiement: order.moyen_paiement,
          items: order.items,
        }))}
        onEncaisserCommande={onPayment ? async (orderId) => { await onPayment(orderId); } : undefined}
      />
    </div>
  );
};