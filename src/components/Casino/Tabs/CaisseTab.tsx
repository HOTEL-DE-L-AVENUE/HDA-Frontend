import React from 'react';
import { formatCurrency, formatDate } from '../../../utils/data';
import { Button } from '../../UI';
import { DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { CasinoRoom, CasinoCashier, CasinoSession, CasinoTransaction, Client } from '../types';

interface CaisseTabProps {
  transactions: CasinoTransaction[];
  clients: Client[];
  sessions: CasinoSession[];
  cashiers: CasinoCashier[];
  rooms: CasinoRoom[];
  casinoTotal: { solde: number; entrees: number; sorties: number };
}

export const CaisseTab: React.FC<CaisseTabProps> = ({
  transactions,
  clients,
  sessions,
  cashiers,
  rooms,
  casinoTotal
}) => {
  return (
    <div className="space-y-6">
      {/* Caisse Globale */}
      <div className="rounded-2xl overflow-hidden w-full" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <div className="p-6">
          <h3 className="text-primary font-semibold text-sm sm:text-base flex items-center gap-2 mb-4">
            <DollarSign size={18} className="text-accent" />
            Caisse Globale Casino
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-xl p-4 border" style={{ backgroundColor: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}>
              <p className="text-muted text-xs">Solde Total</p>
              <p className="text-accent font-bold text-xl">{formatCurrency(casinoTotal.solde)}</p>
            </div>
            <div className="rounded-xl p-4 border" style={{ backgroundColor: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}>
              <p className="text-muted text-xs">Total Entrées</p>
              <p className="text-success font-bold text-xl">{formatCurrency(casinoTotal.entrees)}</p>
            </div>
            <div className="rounded-xl p-4 border" style={{ backgroundColor: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}>
              <p className="text-muted text-xs">Total Sorties</p>
              <p className="text-danger font-bold text-xl">{formatCurrency(casinoTotal.sorties)}</p>
            </div>
            <div className="rounded-xl p-4 border" style={{ backgroundColor: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}>
              <p className="text-muted text-xs">Transactions</p>
              <p className="text-primary font-bold text-xl">{transactions.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toutes les transactions */}
      <div className="rounded-2xl overflow-hidden w-full" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h3 className="text-primary font-semibold">Toutes les Transactions</h3>
        </div>
        <div className="divide-y divide-base max-h-80 overflow-y-auto">
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-muted">Aucune transaction</div>
          ) : (
            transactions.map(tx => {
              const client = clients.find(c => c.id === tx.client_id);
              const session = sessions.find(s => s.id === tx.session_id);
              const cashier = cashiers.find(c => c.id === session?.cashier_id);
              const room = rooms.find(r => r.id === cashier?.room_id);
              
              return (
                <div key={tx.id} className="flex items-center gap-4 px-6 py-3 hover:bg-surface-2">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    tx.type_transaction === 'ACHAT_JETONS' || tx.type_transaction === 'GAIN' || tx.type_transaction === 'DEPOT'
                      ? 'bg-success-bg' 
                      : 'bg-danger-bg'
                  }`}>
                    {tx.type_transaction === 'ACHAT_JETONS' || tx.type_transaction === 'GAIN' || tx.type_transaction === 'DEPOT' 
                      ? <ArrowUpRight size={16} className="text-success" /> 
                      : <ArrowDownRight size={16} className="text-danger" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-primary text-sm font-medium truncate">
                      {tx.type_transaction === 'ACHAT_JETONS' ? 'Achat jetons' :
                       tx.type_transaction === 'RACHAT_JETONS' ? 'Rachat jetons' :
                       tx.type_transaction === 'GAIN' ? 'Gain' :
                       tx.type_transaction === 'PERTE' ? 'Perte' :
                       tx.type_transaction === 'DEPOT' ? 'Dépôt' : 'Retrait'}
                    </p>
                    <p className="text-muted text-xs">
                      {client?.prenom} {client?.nom} • {room?.nom || ''} • {formatDate(tx.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${
                      tx.type_transaction === 'ACHAT_JETONS' || tx.type_transaction === 'GAIN' || tx.type_transaction === 'DEPOT'
                        ? 'text-success' 
                        : 'text-danger'
                    }`}>
                      {tx.type_transaction === 'ACHAT_JETONS' || tx.type_transaction === 'GAIN' || tx.type_transaction === 'DEPOT' ? '+' : '-'}
                      {formatCurrency(tx.montant)}
                    </p>
                    <p className="text-subtle text-xs">{tx.moyen_paiement}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};