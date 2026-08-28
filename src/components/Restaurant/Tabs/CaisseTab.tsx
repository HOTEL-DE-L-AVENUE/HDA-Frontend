import React from 'react';
import { CaisseManager } from '../../StockManager';

interface CaisseTabProps {
  orders?: any[];
  allOrders?: any[];
  onPayment?: (orderId: number) => void;
  onCloseAllOrders?: (orderIds: number[]) => Promise<void>;
  onRefresh?: () => Promise<void>;
}

export const CaisseTab: React.FC<CaisseTabProps> = ({
  orders = [],
  allOrders = [],
  onPayment,
  onCloseAllOrders,
  onRefresh,
}) => {
  const pendingOrdersList = orders.filter((order) => order.statut !== 'PAYEE' && order.statut !== 'PAYE' && order.statut !== 'ANNULEE');
  const formattedPendingOrders = pendingOrdersList.map((order) => ({
    id: Number(order.id),
    client: order.client_nom || order.client?.nom || 'Client anonyme',
    table: order.table?.numero || order.table_numero || order.table_id,
    total: Number(order.montant_total || (order as any).total || (order.items ? order.items.reduce((s: number, i: any) => s + Number(i.prix_unitaire || i.prix || 0) * Number(i.quantite || 1), 0) : 0)),
    created_at: order.created_at,
    nombre_personnes: order.nombre_personnes,
    moyen_paiement: order.moyen_paiement,
    items: (order.items || []).map((i: any) => ({
      nom: i.product_nom || i.nom || i.name || `Produit #${i.product_id}`,
      quantite: Number(i.quantite || 1),
      prix: Number(i.prix_unitaire || i.prix || 0),
      categorie: i.category_nom || i.categorie || 'Restaurant',
    })),
  }));

  const fullOrdersList = allOrders.length > 0 ? allOrders : orders;
  const formattedAllOrders = fullOrdersList.map((order) => ({
    id: Number(order.id),
    client: order.client_nom || order.client?.nom || 'Client anonyme',
    table: order.table?.numero || order.table_numero || order.table_id,
    total: Number(order.montant_total || (order as any).total || (order.items ? order.items.reduce((s: number, i: any) => s + Number(i.prix_unitaire || i.prix || 0) * Number(i.quantite || 1), 0) : 0)),
    statut: (order.statut === 'PAYEE' || order.statut === 'PAYE') ? 'Encaissée' : order.statut,
    created_at: order.created_at,
    moyen_paiement: order.moyen_paiement || 'ESPECES',
    items: (order.items || []).map((i: any) => ({
      nom: i.product_nom || i.nom || i.name || `Produit #${i.product_id}`,
      quantite: Number(i.quantite || 1),
      prix: Number(i.prix_unitaire || i.prix || 0),
      categorie: i.category_nom || i.categorie || 'Restaurant',
    })),
  }));

  return (
    <div className="w-full">
      <CaisseManager
        module="restaurant"
        categories={['Ventes Restaurant', 'Stock', 'Personnel', 'Autre']}
        title="Caisse Restaurant"
        gradient="from-accent to-accent-2"
        pendingOrders={formattedPendingOrders}
        allOrders={formattedAllOrders}
        onEncaisserCommande={onPayment ? async (orderId) => { await onPayment(orderId); } : undefined}
        onCloseAllOrders={onCloseAllOrders}
        onRefresh={onRefresh}
      />
    </div>
  );
};