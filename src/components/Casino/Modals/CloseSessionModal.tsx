import React, { useEffect, useState } from 'react';
import { Button } from '../../UI';
import { ModalShell, FormField, TextInput, TextArea, ModalActions } from './ModalShell';
import { fetchSessionSummary } from '../../../services/casino.service';
import type { CasinoSession, SessionSummary } from '../types';
import { formatCurrency } from '../../../utils/data';

interface CloseSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: CasinoSession | null;
  onSubmit: (id: number, data: { fond_final_declare: number; commentaire?: string }) => Promise<void> | void;
}

export const CloseSessionModal: React.FC<CloseSessionModalProps> = ({ isOpen, onClose, session, onSubmit }) => {
  const [fondDeclare, setFondDeclare] = useState<number>(0);
  const [commentaire, setCommentaire] = useState('');
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && session) {
      setFondDeclare(0);
      setCommentaire('');
      setSummary(null);
      fetchSessionSummary(session.id).then(setSummary).catch(() => setSummary(null));
    }
  }, [isOpen, session]);

  if (!session) return null;

  const ecartPrevisionnel = summary ? fondDeclare - summary.solde_theorique : null;

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onSubmit(session.id, { fond_final_declare: fondDeclare, commentaire: commentaire.trim() || undefined });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Clôturer la session"
      subtitle={`Session #${session.id} — ouverte le ${session.ouverture_at}`}
    >
      {summary && (
        <div
          className="rounded-xl p-3 mb-4 text-xs space-y-1"
          style={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
        >
          <div className="flex justify-between"><span className="text-muted">Fond initial</span><span className="text-primary">{formatCurrency(session.fond_initial)}</span></div>
          <div className="flex justify-between"><span className="text-muted">Total entrées</span><span className="text-primary">{formatCurrency(summary.total_entrees)}</span></div>
          <div className="flex justify-between"><span className="text-muted">Total sorties</span><span className="text-primary">{formatCurrency(summary.total_sorties)}</span></div>
          <div className="flex justify-between font-semibold"><span className="text-muted">Solde théorique</span><span className="text-primary">{formatCurrency(summary.solde_theorique)}</span></div>
        </div>
      )}
      <FormField label="Fond final déclaré (Ar)">
        <TextInput type="number" min={0} value={fondDeclare} onChange={(e) => setFondDeclare(Number(e.target.value))} />
      </FormField>
      {ecartPrevisionnel !== null && (
        <p className="text-xs mb-3" style={{ color: ecartPrevisionnel === 0 ? 'var(--color-success, #4ade80)' : 'var(--color-danger)' }}>
          Écart prévisionnel : {ecartPrevisionnel > 0 ? '+' : ''}{formatCurrency(ecartPrevisionnel)}
        </p>
      )}
      <FormField label="Commentaire (optionnel)">
        <TextArea rows={3} value={commentaire} onChange={(e) => setCommentaire(e.target.value)} placeholder="RAS" />
      </FormField>
      <ModalActions>
        <Button variant="secondary" onClick={onClose}>Annuler</Button>
        <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Clôture…' : 'Clôturer'}</Button>
      </ModalActions>
    </ModalShell>
  );
};
