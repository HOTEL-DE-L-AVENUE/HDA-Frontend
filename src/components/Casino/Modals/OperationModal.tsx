import React, { useState } from 'react';
import { Button } from '../../UI';
import { ModalShell, FormField, TextInput, SelectInput, ModalActions } from './ModalShell';
import { ClientPicker } from './ClientPicker';
import type { CasinoSession, Client, MoyenPaiement, CashOperationInput } from '../types';

export type OperationKind = 'buy-in' | 'cash-out' | 'deposit';

interface OperationModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: CasinoSession[];
  kind: OperationKind;
  onSubmit: (kind: OperationKind, data: CashOperationInput) => Promise<void> | void;
}

const LABELS: Record<OperationKind, { title: string; subtitle: string }> = {
  'buy-in': { title: 'Buy-in', subtitle: 'Entrée de cash en caisse (achat de jetons/mise)' },
  'cash-out': { title: 'Cash-out', subtitle: 'Sortie de cash en caisse' },
  deposit: { title: 'Dépôt', subtitle: 'Dépôt du client en caisse (entrée)' },
};

const MOYENS: MoyenPaiement[] = ['ESPECES', 'CARTE', 'VIREMENT', 'MOBILE_MONEY', 'AUTRE'];

export const OperationModal: React.FC<OperationModalProps> = ({ isOpen, onClose, sessions, kind, onSubmit }) => {
  const openSessions = sessions.filter((s) => s.statut === 'OUVERTE');
  const [sessionId, setSessionId] = useState<number>(openSessions[0]?.id ?? 0);
  const [montant, setMontant] = useState<number>(0);
  const [moyenPaiement, setMoyenPaiement] = useState<MoyenPaiement>('ESPECES');
  const [client, setClient] = useState<Client | null>(null);
  const [clientLibre, setClientLibre] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!sessionId || montant <= 0) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit(kind, {
        session_id: sessionId,
        montant,
        moyen_paiement: moyenPaiement,
        client_id: client?.id,
        client_libre: !client ? (clientLibre.trim() || undefined) : undefined,
      });
      setMontant(0);
      setClient(null);
      setClientLibre('');
      onClose();
    } catch (err: any) {
      setError(err?.message || "Session fermée ou introuvable.");
    } finally {
      setSaving(false);
    }
  };

  const { title, subtitle } = LABELS[kind];

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title={title} subtitle={subtitle}>
      <FormField label="Session de caisse (ouverte)">
        <SelectInput value={sessionId} onChange={(e) => setSessionId(Number(e.target.value))}>
          <option value={0}>Sélectionner…</option>
          {openSessions.map((s) => (
            <option key={s.id} value={s.id}>Session #{s.id} (caisse {s.cashier_id})</option>
          ))}
        </SelectInput>
      </FormField>
      <ClientPicker
        clientId={client?.id ?? null}
        clientLibre={clientLibre}
        onSelectClient={setClient}
        onChangeLibre={setClientLibre}
      />
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
      {error && <p className="text-xs mb-2" style={{ color: 'var(--color-danger)' }}>{error}</p>}
      <ModalActions>
        <Button variant="secondary" onClick={onClose}>Annuler</Button>
        <Button onClick={handleSubmit} disabled={saving || !sessionId || montant <= 0}>
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </ModalActions>
    </ModalShell>
  );
};
