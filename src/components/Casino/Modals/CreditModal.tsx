import React, { useState } from 'react';
import { Button } from '../../UI';
import { ModalShell, FormField, TextInput, SelectInput, ModalActions } from './ModalShell';
import { ClientPicker } from './ClientPicker';
import type { Client, CasinoSession } from '../types';

interface CreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: CasinoSession[];
  onSubmit: (data: { client_id: number; montant: number; echeance: string; session_id: number }) => Promise<void> | void;
}

export const CreditModal: React.FC<CreditModalProps> = ({ isOpen, onClose, sessions, onSubmit }) => {
  const openSessions = sessions.filter((s) => s.statut === 'OUVERTE');
  const [client, setClient] = useState<Client | null>(null);
  const [sessionId, setSessionId] = useState<number>(openSessions[0]?.id ?? 0);
  const [montant, setMontant] = useState<number>(0);
  const [echeance, setEcheance] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!client || !sessionId || montant <= 0 || !echeance) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit({ client_id: client.id, montant, echeance, session_id: sessionId });
      setMontant(0);
      setEcheance('');
      onClose();
    } catch (err: any) {
      // 409 si encours + montant > plafond
      setError(err?.message || 'Plafond de crédit dépassé.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="Accorder un crédit" subtitle="Vérifié contre le plafond de la carte du client">
      <ClientPicker
        clientId={client?.id ?? null}
        clientLibre=""
        onSelectClient={setClient}
        onChangeLibre={() => {}}
        allowFreeText={false}
      />
      <FormField label="Session de caisse (ouverte)">
        <SelectInput value={sessionId} onChange={(e) => setSessionId(Number(e.target.value))}>
          <option value={0}>Sélectionner…</option>
          {openSessions.map((s) => (
            <option key={s.id} value={s.id}>Session #{s.id}</option>
          ))}
        </SelectInput>
      </FormField>
      <FormField label="Montant (Ar)">
        <TextInput type="number" min={1} value={montant} onChange={(e) => setMontant(Number(e.target.value))} />
      </FormField>
      <FormField label="Échéance">
        <TextInput type="date" value={echeance} onChange={(e) => setEcheance(e.target.value)} />
      </FormField>
      {error && <p className="text-xs mb-2" style={{ color: 'var(--color-danger)' }}>{error}</p>}
      <ModalActions>
        <Button variant="secondary" onClick={onClose}>Annuler</Button>
        <Button onClick={handleSubmit} disabled={saving || !client || !sessionId || montant <= 0 || !echeance}>
          {saving ? 'Octroi…' : 'Accorder le crédit'}
        </Button>
      </ModalActions>
    </ModalShell>
  );
};
