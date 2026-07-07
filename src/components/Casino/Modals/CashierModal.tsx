import React, { useState } from 'react';
import { Button } from '../../UI';
import { ModalShell, FormField, TextInput, SelectInput, ModalActions } from './ModalShell';
import type { CasinoCashier, CasinoRoom, StatutCaisse } from '../types';

interface CashierModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: CasinoRoom[];
  onSubmit: (data: Pick<CasinoCashier, 'room_id' | 'code' | 'nom' | 'statut'>) => Promise<void> | void;
}

const STATUTS: StatutCaisse[] = ['OUVERTE', 'FERMEE', 'MAINTENANCE'];

export const CashierModal: React.FC<CashierModalProps> = ({ isOpen, onClose, rooms, onSubmit }) => {
  const [roomId, setRoomId] = useState<number>(rooms[0]?.id ?? 0);
  const [code, setCode] = useState('');
  const [nom, setNom] = useState('');
  const [statut, setStatut] = useState<StatutCaisse>('OUVERTE');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!roomId || !code.trim() || !nom.trim()) return;
    setSaving(true);
    try {
      await onSubmit({ room_id: roomId, code: code.trim(), nom: nom.trim(), statut });
      setCode('');
      setNom('');
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="Nouvelle caisse" subtitle="Rattacher une caisse à une salle">
      <FormField label="Salle">
        <SelectInput value={roomId} onChange={(e) => setRoomId(Number(e.target.value))}>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>{r.nom}</option>
          ))}
        </SelectInput>
      </FormField>
      <FormField label="Code">
        <TextInput value={code} onChange={(e) => setCode(e.target.value)} placeholder="CAISSE-01" />
      </FormField>
      <FormField label="Nom">
        <TextInput value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Caisse principale" />
      </FormField>
      <FormField label="Statut">
        <SelectInput value={statut} onChange={(e) => setStatut(e.target.value as StatutCaisse)}>
          {STATUTS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </SelectInput>
      </FormField>
      <ModalActions>
        <Button variant="secondary" onClick={onClose}>Annuler</Button>
        <Button onClick={handleSubmit} disabled={saving || !roomId || !code.trim() || !nom.trim()}>
          {saving ? 'Création…' : 'Créer la caisse'}
        </Button>
      </ModalActions>
    </ModalShell>
  );
};
