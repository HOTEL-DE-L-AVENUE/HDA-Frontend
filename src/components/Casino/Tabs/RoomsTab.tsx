import React from 'react';
import { formatCurrency, formatDate } from '../../../utils/data';
import { Button, Badge } from '../../UI';
import { Plus, ArrowUpRight, ArrowDownRight, DollarSign } from 'lucide-react';
import type { CasinoRoom, CasinoCashier, CasinoSession, CasinoTransaction, Client } from '../types';

interface RoomsTabProps {
  rooms: CasinoRoom[];
  cashiers: CasinoCashier[];
  sessions: CasinoSession[];
  transactions: CasinoTransaction[];
  clients: Client[];
  selectedRoom: CasinoRoom | null;
  setSelectedRoom: (room: CasinoRoom) => void;
  onNewRoom: () => void;
  onNewCashier: () => void;
  onNewSession: () => void;
  onNewTransaction: () => void;
}

export const RoomsTab: React.FC<RoomsTabProps> = ({
  rooms,
  cashiers,
  sessions,
  transactions,
  clients,
  selectedRoom,
  setSelectedRoom,
  onNewRoom,
  onNewCashier,
  onNewSession,
  onNewTransaction
}) => {
  return (
    <div className="space-y-6">
      {/* Actions rapides */}
      <div className="flex flex-wrap gap-2">
        <Button icon={<Plus size={16} />} onClick={onNewRoom} className="text-sm">
          Nouvelle salle
        </Button>
        <Button icon={<Plus size={16} />} variant="secondary" onClick={onNewCashier} className="text-sm">
          Nouvelle caisse
        </Button>
        <Button icon={<Plus size={16} />} variant="secondary" onClick={onNewSession} className="text-sm">
          Ouvrir session
        </Button>
        <Button icon={<Plus size={16} />} variant="secondary" onClick={onNewTransaction} className="text-sm">
          Transaction
        </Button>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {rooms.map(room => {
          const roomCashiers = cashiers.filter(c => c.room_id === room.id);
          return (
            <button
              key={room.id}
              onClick={() => setSelectedRoom(room)}
              className={`p-3 rounded-xl border transition-all text-center ${
                selectedRoom?.id === room.id 
                  ? 'border-accent' 
                  : 'border-base hover:border-accent'
              }`}
              style={{
                backgroundColor: selectedRoom?.id === room.id ? 'var(--color-accent-4)' : 'var(--color-surface)',
              }}
            >
              <div className="text-2xl mb-1">🎰</div>
              <p className="text-xs text-primary font-medium truncate">{room.nom}</p>
              <p className="text-xs text-muted">{roomCashiers.length} caisses</p>
            </button>
          );
        })}
      </div>

      {/* Selected Room Detail */}
      {selectedRoom ? (
        <div className="space-y-6">
          {/* Room Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-purple-800 p-6">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,white,transparent)]" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-4xl">🎰</div>
                <div>
                  <h3 className="text-primary font-bold text-xl">{selectedRoom.nom}</h3>
                  <p className="text-secondary/70 text-sm">{selectedRoom.type_salle} • {cashiers.filter(c => c.room_id === selectedRoom.id).length} caisses</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-secondary/70 text-sm">Statut</p>
                <p className={`font-bold text-lg ${
                  selectedRoom.statut === 'OUVERTE' ? 'text-success' : 
                  selectedRoom.statut === 'EN_TRAVAUX' ? 'text-warning' : 'text-muted'
                }`}>
                  {selectedRoom.statut === 'OUVERTE' ? '✅ Ouverte' : selectedRoom.statut === 'EN_TRAVAUX' ? '🔧 En travaux' : '❌ Fermée'}
                </p>
              </div>
            </div>
          </div>

          {/* Cashiers */}
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <h3 className="text-primary font-semibold flex items-center gap-2">
                <DollarSign size={16} className="text-accent" />
                Caisses - {selectedRoom.nom}
              </h3>
            </div>
            <div className="divide-y divide-base max-h-48 overflow-y-auto">
              {cashiers.filter(c => c.room_id === selectedRoom.id).map(cashier => {
                const cashierSessions = sessions.filter(s => s.cashier_id === cashier.id);
                const activeSession = cashierSessions.find(s => s.fermeture_at === null);
                return (
                  <div key={cashier.id} className="flex items-center justify-between px-6 py-3 hover:bg-surface-2">
                    <div>
                      <p className="text-primary text-sm font-medium">{cashier.nom}</p>
                      <p className="text-muted text-xs">{cashierSessions.length} sessions • {activeSession ? 'Session en cours' : 'Fermée'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={cashier.statut === 'OUVERTE' ? 'success' : 'danger'}>
                        {cashier.statut === 'OUVERTE' ? 'Ouverte' : 'Fermée'}
                      </Badge>
                      {activeSession && (
                        <span className="text-accent text-sm font-bold">
                          {formatCurrency(activeSession.fond_initial)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Transactions */}
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <h3 className="text-primary font-semibold">Transactions — {selectedRoom.nom}</h3>
              <Button icon={<Plus size={16} />} onClick={onNewTransaction} size="sm">
                Transaction
              </Button>
            </div>
            <div className="divide-y divide-base max-h-64 overflow-y-auto">
              {transactions.filter(t => {
                const session = sessions.find(s => s.id === t.session_id);
                const cashier = cashiers.find(c => c.id === session?.cashier_id);
                return cashier?.room_id === selectedRoom.id;
              }).length === 0 ? (
                <div className="p-8 text-center text-muted">Aucune transaction pour cette salle</div>
              ) : (
                transactions.filter(t => {
                  const session = sessions.find(s => s.id === t.session_id);
                  const cashier = cashiers.find(c => c.id === session?.cashier_id);
                  return cashier?.room_id === selectedRoom.id;
                }).map(tx => {
                  const client = clients.find(c => c.id === tx.client_id);
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
                        <p className="text-muted text-xs">{client?.prenom} {client?.nom} • {formatDate(tx.created_at)}</p>
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
      ) : (
        <div className="rounded-2xl p-12 text-center" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <Dices size={48} className="text-muted mx-auto mb-4" />
          <p className="text-muted">Sélectionnez une salle pour voir les détails</p>
        </div>
      )}
    </div>
  );
};