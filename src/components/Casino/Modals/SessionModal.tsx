import React, { useState } from 'react';
import { Button } from '../../UI';
import { ModalShell, FormField, TextInput, SelectInput, ModalActions } from './ModalShell';
import type { CasinoCashier } from '../types';

interface SessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  cashiers: CasinoCashier[];
  onSubmit: (data: { cashier_id: number; fond_initial: number }) => Promise<void> | void;
}

export const SessionModal: React.FC<SessionModalProps> = ({ isOpen, onClose, cashiers, onSubmit }) => {
  const [cashierId, setCashierId] = useState<number>(cashiers[0]?.id ?? 0);
  const [fondInitial, setFondInitial] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!cashierId || fondInitial < 0) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit({ cashier_id: cashierId, fond_initial: fondInitial });
      setFondInitial(0);
      onClose();
    } catch (err: any) {
      // 409 si une session est déjà ouverte pour cette caisse
      setError(err?.message || "Impossible d'ouvrir la session.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="Ouvrir une session" subtitle="Démarrer une session de caisse">
      <FormField label="Caisse">
        <SelectInput value={cashierId} onChange={(e) => setCashierId(Number(e.target.value))}>
          {cashiers.map((c) => (
            <option key={c.id} value={c.id}>{c.nom} ({c.code})</option>
          ))}
        </SelectInput>
      </FormField>
      <FormField label="Fond initial (Ar)" hint="Montant en caisse au démarrage de la session">
        <TextInput
          type="number"
          min={0}
          value={fondInitial}
          onChange={(e) => setFondInitial(Number(e.target.value))}
        />
      </FormField>
      {error && (
        <p className="text-xs mb-2" style={{ color: 'var(--color-danger)' }}>{error}</p>
      )}
      <ModalActions>
        <Button variant="secondary" onClick={onClose}>Annuler</Button>
        <Button onClick={handleSubmit} disabled={saving || !cashierId}>
          {saving ? 'Ouverture…' : 'Ouvrir la session'}
        </Button>
      </ModalActions>
    </ModalShell>
  );
};
