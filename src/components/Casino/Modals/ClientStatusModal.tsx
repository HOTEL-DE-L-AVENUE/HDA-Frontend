import React, { useState } from 'react';
import { Button } from '../../UI';
import { ModalShell, FormField, SelectInput, TextArea, ModalActions } from './ModalShell';
import type { Client, StatutSpecialClient } from '../types';

interface ClientStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onSubmit: (clientId: number, data: { statut_special: StatutSpecialClient; motif: string }) => Promise<void> | void;
}

const STATUTS: StatutSpecialClient[] = ['NORMAL', 'VIP', 'A_SURVEILLER', 'EXCLU', 'AUTO_EXCLU'];

export const ClientStatusModal: React.FC<ClientStatusModalProps> = ({ isOpen, onClose, client, onSubmit }) => {
  const [statutSpecial, setStatutSpecial] = useState<StatutSpecialClient>('NORMAL');
  const [motif, setMotif] = useState('');
  const [saving, setSaving] = useState(false);

  if (!client) return null;

  const handleSubmit = async () => {
    if (!motif.trim()) return;
    setSaving(true);
    try {
      await onSubmit(client.id, { statut_special: statutSpecial, motif: motif.trim() });
      setMotif('');
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Décision sur le statut du client"
      subtitle={`${client.nom} ${client.prenom || ''} — décision humaine explicite, jamais automatique`}
    >
      <FormField label="Nouveau statut">
        <SelectInput value={statutSpecial} onChange={(e) => setStatutSpecial(e.target.value as StatutSpecialClient)}>
          {STATUTS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </SelectInput>
      </FormField>
      <FormField label="Motif (obligatoire)">
        <TextArea rows={3} value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Comportement suspect le 05/07" />
      </FormField>
      <ModalActions>
        <Button variant="secondary" onClick={onClose}>Annuler</Button>
        <Button onClick={handleSubmit} disabled={saving || !motif.trim()}>
          {saving ? 'Enregistrement…' : 'Confirmer la décision'}
        </Button>
      </ModalActions>
    </ModalShell>
  );
};
