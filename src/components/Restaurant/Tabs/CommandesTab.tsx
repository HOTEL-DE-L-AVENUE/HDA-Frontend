import React from 'react';
import { Badge, Button, DataTable } from '../../UI';
import { formatCurrency, formatDate } from '../../../utils/data';
import { Plus, Trash2, XCircle, Pencil } from 'lucide-react';
import type { Order } from '../types';

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
  products: any[];
  onUpdateStatus: (orderId: number, status: Order['statut']) => void;
  onPayment: (orderId: number) => void;
  onCancel: (orderId: number) => void;
  onDelete: (orderId: number) => void;
  onNewOrder: () => void;
  onEditOrder: (order: Order) => void;
}

export const CommandesTab: React.FC<CommandesTabProps> = ({
  orders,
  products,
  onUpdateStatus,
  onPayment,
  onCancel,
  onDelete,
  onNewOrder,
  onEditOrder
}) => {
  const columns = [
    { key: 'table', label: 'Table', render: (order: Order) => (
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-accent)', boxShadow: 'var(--shadow-accent)' }}>
        <span className="text-black font-bold text-sm">
          {order.table?.numero || order.table_numero || order.table_id || 'N/A'}
        </span>
      </div>
    )},
    { key: 'items', label: 'Articles', render: (order: Order) => (
      <div>
        {!order.items || order.items.length === 0 ? (
          <span className="text-muted text-sm">—</span>
        ) : (
          <>
            {order.items.slice(0, 2).map((item, i) => (
              <p key={i} className="text-secondary text-sm">
                {item.product_nom || item.product?.nom || products.find(p => p.id === item.product_id)?.nom || `Article #${item.product_id}`} x{item.quantite}
              </p>
            ))}
            {order.items.length > 2 && <p className="text-subtle text-xs">+{order.items.length - 2} autres</p>}
          </>
        )}
      </div>
    )},
    { key: 'montant', label: 'Montant', render: (order: Order) => (
      <span className="text-accent font-bold">{formatCurrency(order.montant_total)}</span>
    )},
    { key: 'statut', label: 'Statut', render: (order: Order) => {
      const status = STATUTS_ORDER[order.statut] || STATUTS_ORDER.EN_ATTENTE;
      return <Badge variant={status.variant as any}>{status.label}</Badge>;
    }},
    { key: 'date', label: 'Heure', render: (order: Order) => (
      <span className="text-subtle text-xs">{formatDate(order.created_at)}</span>
    )},
    { key: 'actions', label: '', render: (order: Order) => (
      <div className="flex items-center gap-2">
        {(order.statut === 'EN_ATTENTE' || order.statut === 'EN_COURS') && (
          <Button size="sm" variant="secondary" onClick={() => onEditOrder(order)} title="Modifier">
            <Pencil size={14} />
          </Button>
        )}

        {order.statut === 'EN_ATTENTE' && (
          <Button size="sm" variant="secondary" onClick={() => onUpdateStatus(order.id, 'EN_COURS')}>Démarrer</Button>
        )}
        {order.statut === 'EN_COURS' && (
          <Button size="sm" variant="secondary" onClick={() => onUpdateStatus(order.id, 'SERVIE')}>Servir</Button>
        )}
        {order.statut === 'SERVIE' && (
          <Button size="sm" onClick={() => onPayment(order.id)}>Encaisser</Button>
        )}
        {(order.statut === 'EN_ATTENTE' || order.statut === 'EN_COURS') && (
          <Button size="sm" variant="danger" onClick={() => onCancel(order.id)}>
            <XCircle size={14} />
          </Button>
        )}
        <Button
          size="sm"
          variant="danger"
          title="Supprimer la commande"
          aria-label={`Supprimer la commande ${order.id}`}
          onClick={() => onDelete(order.id)}
        >
          <Trash2 size={14} />
        </Button>
      </div>
    )},
  ];

  // Tri des commandes : les plus récentes (plus grandes dates/IDs) en premier
  const sortedOrders = [...orders].sort((a, b) => {
    const timeA = new Date(a.created_at || 0).getTime();
    const timeB = new Date(b.created_at || 0).getTime();
    if (timeA !== timeB) return timeB - timeA; // Tri par date décroissante
    return Number(b.id) - Number(a.id); // Fallback par ID décroissant
  });

  const data = sortedOrders.map(order => ({ ...order, id: String(order.id) }));

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
      <div className="overflow-x-auto">
        <DataTable data={data} columns={columns as any} />
      </div>
    </div>
  );
};