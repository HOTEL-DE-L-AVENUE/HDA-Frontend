import React from 'react';
import { CaisseManager } from '../../StockManager';
import { Button, Modal, Select } from '../../UI';
import { useState } from 'react';

interface CaisseTabProps {
  orders?: any[];
  onPayment?: (orderId: number, paymentMethod?: string) => void | Promise<void>;
  onCloseAllOrders?: (orderIds: number[]) => Promise<void> | void;
  onRefresh?: () => Promise<void> | void;
  onNewOrder?: () => void;
  onInvoice?: (orderId: number) => void;
}
   



export const CaisseTab: React.FC<CaisseTabProps> = ({ orders = [], onPayment, onCloseAllOrders, onRefresh, onNewOrder, onInvoice }) => {
  const [paymentOrderId, setPaymentOrderId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('ESPECES');
  const getOrderTotal = (order: any) => {
    const itemTotal = (order.items || []).reduce((sum: number, item: any) => (
      sum + Number(item.prix_unitaire || item.prix || 0) * Number(item.quantite || 0)
    ), 0);
    return itemTotal > 0 ? itemTotal : Number(order.montant_total || order.total || 0);
  };

  const allOrders = orders.filter((order) => order.statut !== 'ANNULEE').map((order) => ({
    id: Number(order.id),
    client: order.client_nom || order.client?.nom || 'Client anonyme',
    table: order.table?.numero || order.table_numero || order.table_id,
    total: getOrderTotal(order),
    statut: order.statut,
    created_at: order.created_at,
    moyen_paiement: order.moyen_paiement,
    items: (order.items || []).map((item: any) => ({
      nom: item.product_nom || item.product?.nom || `Article #${item.product_id}`,
      quantite: item.quantite,
      prix: item.prix_unitaire || item.prix || 0,
      categorie: 'Restaurant',
    })),
  }));

  return (
    <div className="w-full">
      <div className="mb-4 flex justify-end gap-2">
        {onNewOrder && <Button onClick={onNewOrder}>Nouvelle commande</Button>}
      </div>
      <CaisseManager
        module="restaurant"
        categories={['Ventes Restaurant', 'Stock', 'Personnel', 'Autre']}
        title="Caisse Restaurant"
        gradient="from-accent to-accent-2"
        allOrders={allOrders}
        pendingOrders={orders.filter((order) => order.statut === 'SERVIE').map((order) => ({
          id: Number(order.id),
          client: order.client_nom || order.client?.nom || 'Client anonyme',
          table: order.table?.numero || order.table_numero || order.table_id,
          total: getOrderTotal(order),
          created_at: order.created_at,
          nombre_personnes: order.nombre_personnes,
          moyen_paiement: order.moyen_paiement,
          items: order.items,
        }))}
        onEncaisserCommande={onPayment ? async (orderId) => {
          const order = orders.find((candidate) => Number(candidate.id) === Number(orderId));
          setPaymentMethod(order?.moyen_paiement_prevu || order?.moyen_paiement || 'ESPECES');
          setPaymentOrderId(orderId);
        } : undefined}
        onInvoiceOrder={onInvoice}
        onCloseAllOrders={onCloseAllOrders}
        onRefresh={onRefresh}
      />
      <Modal isOpen={paymentOrderId !== null} onClose={() => setPaymentOrderId(null)} title="Encaisser la commande" size="sm">
        <div className="space-y-4">
          <Select label="Mode de paiement" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} options={[
            { value: 'TPE', label: 'TPE' }, { value: 'ESPECES', label: 'Espèces' }, { value: 'ORANGE_MONEY', label: 'Mobile Money — Orange Money' }, { value: 'MVOLA', label: 'Mobile Money — MVola' }, { value: 'CREDIT', label: 'Crédit' }, { value: 'GRATUIT', label: 'Gratuit' },
          ]} />
          <div className="flex gap-2"><Button variant="secondary" onClick={() => setPaymentOrderId(null)}>Annuler</Button><Button onClick={async () => { if (paymentOrderId !== null) await onPayment?.(paymentOrderId, paymentMethod); setPaymentOrderId(null); }}>Confirmer l’encaissement</Button></div>
        </div>
      </Modal>
    </div>
  );
};
