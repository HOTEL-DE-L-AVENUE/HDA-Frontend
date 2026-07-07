import React, { useState } from 'react';
import { Button } from '../../UI';
import { ModalShell, FormField, TextInput, SelectInput, ModalActions } from './ModalShell';
import type { CasinoCredit, CasinoSession, MoyenPaiement } from '../types';
import { formatCurrency } from '../../../utils/data';

export type CreditAction = 'draw' | 'repay';

interface CreditActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  credit: CasinoCredit | null;
  sessions: CasinoSession[];
  action: CreditAction;
  onSubmit: (
    creditId: number,
    action: CreditAction,
    data: { session_id?: number; montant: number; moyen_paiement: MoyenPaiement }
  ) => Promise<void> | void;
}

const MOYENS: MoyenPaiement[] = ['ESPECES', 'CARTE', 'VIREMENT', 'MOBILE_MONEY', 'AUTRE'];

export const CreditActionModal: React.FC<CreditActionModalProps> = ({
  isOpen,
  onClose,
  credit,
  sessions,
  action,
  onSubmit,
}) => {
  const openSessions = sessions.filter((s) => s.statut === 'OUVERTE');
  const [sessionId, setSessionId] = useState<number>(openSessions[0]?.id ?? 0);
  const [montant, setMontant] = useState<number>(0);
  const [moyenPaiement, setMoyenPaiement] = useState<MoyenPaiement>('ESPECES');
  const [saving, setSaving] = useState(false);

  if (!credit) return null;

  const handleSubmit = async () => {
    if (montant <= 0) return;
    if (action === 'draw' && !sessionId) return;
    setSaving(true);
    try {
      await onSubmit(credit.id, action, {
        session_id: sessionId || undefined,
        montant,
        moyen_paiement: moyenPaiement,
      });
      setMontant(0);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={action === 'draw' ? 'Tirage sur crédit' : 'Remboursement de crédit'}
      subtitle={`Crédit #${credit.id} — encours actuel ${formatCurrency(credit.encours)}`}
    >
      <FormField label={action === 'draw' ? 'Session de caisse (ouverte)' : 'Session de caisse (optionnel)'}>
        <SelectInput value={sessionId} onChange={(e) => setSessionId(Number(e.target.value))}>
          <option value={0}>{action === 'draw' ? 'Sélectionner…' : 'Aucune'}</option>
          {openSessions.map((s) => (
            <option key={s.id} value={s.id}>Session #{s.id}</option>
          ))}
        </SelectInput>
      </FormField>
      <FormField label="Montant (Ar)">
        <TextInput type="number" min={1} value={montant} onChange={(e) => setMontant(Number(e.target.value))} />
      </FormField>
      <FormField label="Moyen de paiement">
        <SelectInput value={moyenPaiement} onChange={(e) => setMoyenPaiement(e.target.value as MoyenPaiement)}>
          {MOYENS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </SelectInput>
      </FormField>
      <ModalActions>
        <Button variant="secondary" onClick={onClose}>Annuler</Button>
        <Button onClick={handleSubmit} disabled={saving || montant <= 0 || (action === 'draw' && !sessionId)}>
          {saving ? 'Enregistrement…' : action === 'draw' ? 'Effectuer le tirage' : 'Enregistrer le remboursement'}
        </Button>
      </ModalActions>
    </ModalShell>
  );
};
