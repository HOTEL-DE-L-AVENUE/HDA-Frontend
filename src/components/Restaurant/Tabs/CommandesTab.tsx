import React, { useState } from 'react';
import { Badge, Button, DataTable, Modal, Select } from '../../UI';
import { formatCurrency, formatDate } from '../../../utils/data';
import { Plus, Trash2, XCircle, Pencil, CheckCircle2, MapPin, Printer, ChefHat, DollarSign } from 'lucide-react';
import type { Order } from '../types';
import type { TableRestaurant } from '../../../types/restaurant';
import AuthService from '../../../services/authService';
import { isAdmin, isCashier, isManager } from '../../../utils/permissions';
import { printOrderTicket } from '../../../utils/thermalPrint';

const STATUTS_ORDER: Record<string, { label: string; variant: string }> = {
  EN_ATTENTE: { label: 'En attente', variant: 'warning' },
  EN_COURS: { label: 'En cours', variant: 'info' },
  SERVIE: { label: 'Servie', variant: 'success' },
  PAYE: { label: 'Payée', variant: 'success' },
  PAYEE: { label: 'Payée', variant: 'success' },
  ANNULEE: { label: 'Annulée', variant: 'danger' },
};

interface CommandesTabProps {
  orders: Order[];
  tables: TableRestaurant[];
  products: any[];
  onUpdateStatus: (orderId: number, status: Order['statut']) => void;
  onPayment: (orderId: number, paymentMethod?: string) => void | Promise<void>;
  onCancel: (orderId: number) => void;
  onDelete: (orderId: number) => void;
  onNewOrder: () => void;
  onEditOrder: (order: Order) => void;
  onMoveOrder: (order: Order, tableId: number, locationType?: string) => void | Promise<void>;
}

export const CommandesTab: React.FC<CommandesTabProps> = ({
  orders,
  tables,
  products,
  onUpdateStatus,
  onPayment,
  onCancel,
  onDelete,
  onNewOrder,
  onEditOrder,
  onMoveOrder
}) => {
  const [paymentOrderId, setPaymentOrderId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('ESPECES');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [tableFilter, setTableFilter] = useState('');
  const [movingOrder, setMovingOrder] = useState<Order | null>(null);
  const currentUser = AuthService.getCurrentUser();
  const canEncaisser = isAdmin(currentUser) || isCashier(currentUser);
  const role = currentUser?.role?.toLowerCase();
  const canChangeOrderStatus =
    isAdmin(currentUser)
    || isManager(currentUser)
    || isCashier(currentUser)
    || role === 'hotesse'
    || role === 'serveur';
  const canDeleteCommande = isAdmin(currentUser);
  const handleChangeOrderStatus = async (orderId: number, status: Order['statut']) => {
    try {
      setStatusError(null);
      await onUpdateStatus(orderId, status);
    } catch (error: any) {
      setStatusError(error?.response?.data?.message || error?.message || 'Le statut de la commande n’a pas pu être mis à jour.');
    }
  };
  const getLocationLabel = (order: Order) => {
    const normalized = order.location_type?.trim().toUpperCase();
    if (normalized === 'POCKER' || normalized === 'POCKER GRATUIT' || normalized === 'GRATUIT POCKER') return 'Gratuit Pocker';
    if (normalized === 'GRATUIT') return 'Gratuit';
    if (normalized === 'CHAMBRE') return 'Chambre';
    return order.table?.numero || order.table_numero || order.table_id || 'N/A';
  };
  const handlePrintOrder = (order: Order) => {
    printOrderTicket({
      module: 'RESTAURANT',
      orderId: order.id,
      status: order.statut,
      client: [order.client_prenom, order.client_nom].filter(Boolean).join(' '),
      table: getLocationLabel(order),
      date: order.created_at,
      notes: order.notes,
      items: (order.items || []).map((item) => ({
        name: item.product_nom || item.product?.nom || products.find((product) => product.id === item.product_id)?.nom || `Article #${item.product_id}`,
        quantity: Number(item.quantite) || 0,
        unitPrice: Number(item.prix_unitaire) || 0,
      })),
      total: Number(order.montant_total) || 0,
    });
  };
  const columns = [
    { key: 'table', label: 'Table', render: (order: Order) => {
      const locationLabel = getLocationLabel(order);
      const isSpecialLocation = ['Gratuit', 'Gratuit Pocker', 'Chambre'].includes(String(locationLabel));
      return (
        <div className={`flex min-h-10 items-center justify-center rounded-xl px-3 py-2 text-center ${isSpecialLocation ? 'min-w-[92px]' : 'min-w-10'}`} style={{ background: 'var(--color-accent)', boxShadow: 'var(--shadow-accent)' }}>
          <span className="text-black text-sm font-bold leading-tight">
            {locationLabel}
          </span>
        </div>
      );
    }},
    { key: 'items', label: 'Articles', render: (order: Order) => (
      <div>
        {!order.items || order.items.length === 0 ? (
          <span className="text-muted text-sm">—</span>
        ) : (
          <>
            {order.items.slice(0, 2).map((item, i) => (
              <p key={i} className="text-secondary text-sm">
                {item.product_nom || item.product?.nom || products.find(p => p.id === item.product_id)?.nom || `Article #${item.product_id}`} x{item.quantite}
                {item.cuisson && <span className="ml-1 text-[10px] bg-accent/10 text-accent px-1 rounded">{item.cuisson}</span>}
              </p>
            ))}
            {order.items.length > 2 && <p className="text-subtle text-xs">+{order.items.length - 2} autres</p>}
          </>
        )}
        {order.notes && (
          <p className="text-subtle text-xs mt-1 italic truncate max-w-[200px]" title={order.notes}>
            📝 {order.notes}
          </p>
        )}
      </div>
    )},
    { key: 'montant', label: 'Montant', render: (order: Order) => (
      <span className="text-accent font-bold">{formatCurrency(order.montant_total)}</span>
    )},
    { key: 'creator', label: 'Pris par', render: (order: Order) => (
      <span className="text-secondary text-sm">
        {[order.creator_prenom, order.creator_nom].filter(Boolean).join(' ') || 'Non renseigné'}
      </span>
    )},
    { key: 'statut', label: 'Statut', render: (order: Order) => {
      const status = STATUTS_ORDER[order.statut] || STATUTS_ORDER.EN_ATTENTE;
      return <Badge variant={status.variant as any}>{status.label}</Badge>;
    }},
    { key: 'date', label: 'Heure', render: (order: Order) => (
      <span className="text-subtle text-xs">{formatDate(order.created_at)}</span>
    )},
    { key: 'actions', label: 'Actions', render: (order: Order) => (
      <div className="flex flex-wrap items-center justify-end gap-1">
        {(order.statut === 'EN_ATTENTE' || order.statut === 'EN_COURS') && (
          <Button size="sm" variant="secondary" icon={<Pencil size={14} />} onClick={() => onEditOrder(order)} title="Modifier" aria-label="Modifier la commande" />
        )}
        {(order.statut === 'EN_ATTENTE' || order.statut === 'EN_COURS') && (
          <Button size="sm" variant="secondary" icon={<MapPin size={14} />} onClick={() => setMovingOrder(order)} title="Changer d'emplacement" aria-label="Changer d'emplacement" />
        )}

        {canChangeOrderStatus && order.statut === 'EN_ATTENTE' && (
          <Button size="sm" variant="secondary" icon={<ChefHat size={14} />} onClick={() => void handleChangeOrderStatus(order.id, 'EN_COURS')}>Démarrer</Button>
        )}
        {canChangeOrderStatus && order.statut === 'EN_COURS' && (
          <Button size="sm" variant="secondary" icon={<CheckCircle2 size={14} />} onClick={() => void handleChangeOrderStatus(order.id, 'SERVIE')}>Servir</Button>
        )}
        {(order.statut === 'EN_ATTENTE' || order.statut === 'EN_COURS') && (
          <Button size="sm" variant="danger" icon={<XCircle size={14} />} onClick={() => onCancel(order.id)} title="Annuler la commande" aria-label="Annuler la commande" />
        )}
        {canEncaisser && order.statut === 'SERVIE' && (
          <Button size="sm" icon={<DollarSign size={14} />} onClick={() => {
            setPaymentOrderId(order.id);
            setPaymentMethod(order.moyen_paiement_prevu || order.moyen_paiement || 'ESPECES');
            setPaymentError(null);
          }}>Encaisser</Button>
        )}
        <Button size="sm" variant="secondary" icon={<Printer size={14} />} onClick={() => handlePrintOrder(order)} title="Imprimer le ticket de commande">
          Ticket
        </Button>
        {canDeleteCommande && <Button
          size="sm"
          variant="danger"
          title="Supprimer la commande"
          aria-label={`Supprimer la commande ${order.id}`}
          onClick={() => onDelete(order.id)}
        >
          <Trash2 size={14} />
        </Button>}
      </div>
    )},
  ];

  // Tri des commandes : les plus récentes (plus grandes dates/IDs) en premier
  const activeOrders = orders.filter((order) => {
    if (['PAYE', 'PAYEE'].includes(order.statut)) return false;
    return !tableFilter || String(order.table_id ?? order.table?.id ?? 0) === tableFilter;
  });
  const sortedOrders = [...activeOrders].sort((a, b) => {
    const timeA = new Date(a.created_at || 0).getTime();
    const timeB = new Date(b.created_at || 0).getTime();
    if (timeA !== timeB) return timeB - timeA; // Tri par date décroissante
    return Number(b.id) - Number(a.id); // Fallback par ID décroissant
  });

  const data = sortedOrders.map(order => ({ ...order, id: String(order.id) }));

  const handleConfirmPayment = async () => {
    if (paymentOrderId === null) return;
    try {
      setIsProcessingPayment(true);
      setPaymentError(null);
      await onPayment(paymentOrderId, paymentMethod);
      setPaymentOrderId(null);
    } catch (error: any) {
      setPaymentError(error?.response?.data?.error?.message || error?.response?.data?.message || error?.message || 'Le paiement n’a pas pu être confirmé.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="rounded-2xl overflow-hidden w-full" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <h3 className="text-primary font-semibold text-sm sm:text-base flex items-center gap-2">
          Commandes
        </h3>
        <Button icon={<Plus size={16} />} onClick={onNewOrder} className="w-full sm:w-auto text-sm">
          Nouvelle commande
        </Button>
      </div>
      {statusError && <p role="alert" className="mx-3 mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400 sm:mx-6">{statusError}</p>}
      <div className="px-3 sm:px-6 py-3">
        <Select label="Afficher les commandes de" value={tableFilter} onChange={(event) => setTableFilter(event.target.value)} options={[
          { value: '', label: 'Toutes les tables' },
          ...Array.from(new Map(tables.map((table) => [String(table.id), {
            value: String(table.id),
            label: `Table ${String(table.numero).toUpperCase().startsWith('T') ? table.numero : `T${table.numero}`}`,
          }])).values()),
          { value: '0', label: 'Autres emplacements' },
        ]} />
      </div>
      <div className="overflow-x-auto">
        <DataTable data={data} columns={columns as any} />
      </div>

      <Modal isOpen={movingOrder !== null} onClose={() => setMovingOrder(null)} title="Changer l'emplacement" size="sm">
        <div className="grid grid-cols-3 gap-2">
          {tables.map((table) => (
            <Button key={table.id} variant="secondary" onClick={async () => { if (movingOrder) await onMoveOrder(movingOrder, table.id); setMovingOrder(null); }}>
              {String(table.numero).toUpperCase().startsWith('T') ? table.numero : `T${table.numero}`}
            </Button>
          ))}
          {['GRATUIT', 'POCKER GRATUIT', 'CHAMBRE'].map((location) => (
            <Button key={location} variant="secondary" onClick={async () => { if (movingOrder) await onMoveOrder(movingOrder, 0, location); setMovingOrder(null); }}>
              {location === 'POCKER GRATUIT' ? 'Pocker gratuit' : location[0] + location.slice(1).toLowerCase()}
            </Button>
          ))}
        </div>
      </Modal>

      <Modal
        isOpen={paymentOrderId !== null}
        onClose={() => { if (!isProcessingPayment) setPaymentOrderId(null); }}
        title={`Encaisser la commande #${paymentOrderId ?? ''}`}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-secondary">Choisissez le mode de paiement pour confirmer cette commande.</p>
          {paymentError && <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-300">{paymentError}</div>}
          <Select
            label="Mode de paiement"
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value)}
            options={[
              { value: 'ESPECES', label: 'Espèces' },
              { value: 'CREDIT', label: 'Crédit' },
              { value: 'TPE', label: 'TPE' },
              { value: 'ORANGE_MONEY', label: 'Orange Money' },
              { value: 'MVOLA', label: 'MVola' },
              { value: 'GRATUIT', label: 'Gratuit' },
            ]}
          />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => { setPaymentOrderId(null); setPaymentError(null); }} disabled={isProcessingPayment} className="flex-1">Annuler</Button>
            <Button type="button" onClick={() => void handleConfirmPayment()} disabled={isProcessingPayment} className="flex-1">
              <CheckCircle2 size={16} />
              {isProcessingPayment ? 'Confirmation...' : 'Confirmer'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
