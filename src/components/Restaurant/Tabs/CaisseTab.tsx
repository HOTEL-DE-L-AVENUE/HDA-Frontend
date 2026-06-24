import React from 'react';
import { Button } from '../../UI';
import { formatCurrency } from '../../../utils/data';
import { DollarSign } from 'lucide-react';
import type { Order } from '../types';

interface CaisseTabProps {
  orders: Order[];
  onPayment: (orderId: number) => void;
}

export const CaisseTab: React.FC<CaisseTabProps> = ({ orders, onPayment }) => {
  const totalCA = orders.filter(o => o.statut === 'PAYEE').reduce((sum, o) => sum + o.montant_total, 0);
  const ordersToCash = orders.filter(o => o.statut === 'SERVIE');

  return (
    <div className="rounded-2xl overflow-hidden w-full" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
      <div className="p-4">
        <h3 className="text-primary font-semibold text-sm sm:text-base flex items-center gap-2 mb-4">
          <DollarSign size={18} className="text-accent" />
          Caisse Restaurant
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl p-4 border" style={{ backgroundColor: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}>
            <p className="text-muted text-xs">Total commandes</p>
            <p className="text-primary font-bold text-xl">{orders.length}</p>
          </div>
          <div className="rounded-xl p-4 border" style={{ backgroundColor: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}>
            <p className="text-muted text-xs">Chiffre d'affaires</p>
            <p className="text-accent font-bold text-xl">{formatCurrency(totalCA)}</p>
          </div>
          <div className="rounded-xl p-4 border" style={{ backgroundColor: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}>
            <p className="text-muted text-xs">À encaisser</p>
            <p className="text-warning font-bold text-xl">{ordersToCash.length}</p>
          </div>
          <div className="rounded-xl p-4 border" style={{ backgroundColor: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}>
            <p className="text-muted text-xs">Moyenne / commande</p>
            <p className="text-secondary font-bold text-xl">
              {orders.length > 0 ? formatCurrency(totalCA / orders.length) : '0 €'}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <h4 className="text-secondary font-medium mb-2">Commandes à encaisser</h4>
          <div className="space-y-2">
            {ordersToCash.map((order) => (
              <div 
                key={order.id} 
                className="flex items-center justify-between p-3 rounded-xl border"
                style={{ backgroundColor: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}
              >
                <div>
                  <p className="text-secondary text-sm">Table {order.table?.numero || 'N/A'} - #{order.id}</p>
                  <p className="text-muted text-xs">{order.items?.length || 0} articles</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-accent font-bold">{formatCurrency(order.montant_total)}</span>
                  <Button size="sm" onClick={() => onPayment(order.id)}>Encaisser</Button>
                </div>
              </div>
            ))}
            {ordersToCash.length === 0 && (
              <p className="text-muted text-sm text-center py-4">Aucune commande à encaisser</p>
            )}
          </div>
        </div>

        <div 
          className="mt-4 p-4 rounded-xl border flex justify-between items-center"
          style={{ backgroundColor: 'var(--color-accent-4)', borderColor: 'rgba(212, 168, 71, 0.2)' }}
        >
          <span className="text-secondary text-sm">Total encaissé aujourd'hui</span>
          <span className="text-accent font-bold text-xl">{formatCurrency(totalCA)}</span>
        </div>
      </div>
    </div>
  );
};