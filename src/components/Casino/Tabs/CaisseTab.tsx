import React, { useState } from 'react';
import { Plus, Lock, Eye } from 'lucide-react';
import type { CasinoSharedProps } from '../shared-props';
import { fetchSessionTransactions } from '../../../services/casino.service';
import type { SessionTransactionRow, CasinoSession } from '../types';
import { formatCurrency } from '../../../utils/data';

export const CaisseTab: React.FC<CasinoSharedProps> = ({
  sessions,
  cashiers,
  onNewSession,
  onCloseSession,
  onNewOperation,
  onNewChipOperation,
}) => {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [rows, setRows] = useState<Record<number, SessionTransactionRow[]>>({});

  const toggleExpand = async (session: CasinoSession) => {
    if (expandedId === session.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(session.id);
    if (!rows[session.id]) {
      try {
        const data = await fetchSessionTransactions(session.id);
        setRows((prev) => ({ ...prev, [session.id]: data }));
      } catch {
        setRows((prev) => ({ ...prev, [session.id]: [] }));
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h4 className="text-primary font-semibold text-sm">Sessions de caisse</h4>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => onNewOperation('buy-in')} className="text-xs px-3 py-1.5 rounded-lg text-muted hover:text-primary" style={{ border: '1px solid var(--color-border)' }}>Buy-in</button>
          <button onClick={() => onNewOperation('cash-out')} className="text-xs px-3 py-1.5 rounded-lg text-muted hover:text-primary" style={{ border: '1px solid var(--color-border)' }}>Cash-out</button>
          <button onClick={() => onNewOperation('deposit')} className="text-xs px-3 py-1.5 rounded-lg text-muted hover:text-primary" style={{ border: '1px solid var(--color-border)' }}>Dépôt</button>
          <button onClick={() => onNewChipOperation('buy')} className="text-xs px-3 py-1.5 rounded-lg text-muted hover:text-primary" style={{ border: '1px solid var(--color-border)' }}>Achat jetons</button>
          <button onClick={() => onNewChipOperation('sell')} className="text-xs px-3 py-1.5 rounded-lg text-muted hover:text-primary" style={{ border: '1px solid var(--color-border)' }}>Reprise jetons</button>
          <button onClick={onNewSession} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg text-black" style={{ backgroundColor: 'var(--color-accent)' }}>
            <Plus size={14} /> Ouvrir session
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {sessions.length === 0 && (
          <p className="text-muted text-xs text-center py-8">Aucune session pour le moment.</p>
        )}
        {sessions.map((session) => {
          const cashier = cashiers.find((c) => c.id === session.cashier_id);
          const isOpen = session.statut === 'OUVERTE';
          return (
            <div key={session.id} className="rounded-2xl p-4" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="text-primary font-semibold text-sm">Session #{session.id} — {cashier?.nom || `Caisse ${session.cashier_id}`}</p>
                  <p className="text-muted text-xs">
                    Ouverte le {session.ouverture_at}{session.fermeture_at ? ` · fermée le ${session.fermeture_at}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: isOpen ? 'var(--color-accent)' : 'var(--color-surface-2)', color: isOpen ? '#000' : undefined }}
                  >
                    {session.statut}
                  </span>
                  <button onClick={() => toggleExpand(session)} className="text-muted hover:text-primary">
                    <Eye size={16} />
                  </button>
                  {isOpen && (
                    <button onClick={() => onCloseSession(session)} className="text-muted hover:text-primary" title="Clôturer">
                      <Lock size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                <div><p className="text-muted">Fond initial</p><p className="text-primary font-medium">{formatCurrency(session.fond_initial)}</p></div>
                <div><p className="text-muted">Théorique</p><p className="text-primary font-medium">{session.fond_final_theorique != null ? formatCurrency(session.fond_final_theorique) : '—'}</p></div>
                <div><p className="text-muted">Écart</p><p className="text-primary font-medium" style={{ color: session.ecart ? 'var(--color-danger)' : undefined }}>{session.ecart != null ? formatCurrency(session.ecart) : '—'}</p></div>
              </div>

              {expandedId === session.id && (
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                  {!rows[session.id] ? (
                    <p className="text-muted text-xs">Chargement…</p>
                  ) : rows[session.id].length === 0 ? (
                    <p className="text-muted text-xs">Aucun mouvement enregistré.</p>
                  ) : (
                    <div className="space-y-1">
                      {rows[session.id].map((t) => (
                        <div key={`${t.source}-${t.id}`} className="flex items-center justify-between text-xs">
                          <span className="text-primary">{t.type_operation} · {t.client_libre || (t.client_id ? `Client #${t.client_id}` : 'Anonyme')}</span>
                          <span className="text-muted">{t.created_at}</span>
                          <span className="text-primary font-medium">{formatCurrency(t.montant)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
