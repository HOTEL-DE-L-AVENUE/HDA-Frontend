import React, { useState } from 'react';
import { Button } from '../../UI';
import { ModalShell, FormField, TextInput, SelectInput, ModalActions } from './ModalShell';
import type { CasinoRoom, TypeSalle, StatutSalle } from '../types';

interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Pick<CasinoRoom, 'code' | 'nom' | 'type_salle' | 'statut'>) => Promise<void> | void;
}

const TYPES_SALLE: TypeSalle[] = ['VIP', 'POKER', 'MACHINES', 'TABLE_JEUX', 'AUTRE'];
const STATUTS: StatutSalle[] = ['OUVERTE', 'FERMEE', 'EN_TRAVAUX'];

export const RoomModal: React.FC<RoomModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [code, setCode] = useState('');
  const [nom, setNom] = useState('');
  const [typeSalle, setTypeSalle] = useState<TypeSalle>('MACHINES');
  const [statut, setStatut] = useState<StatutSalle>('OUVERTE');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setCode('');
    setNom('');
    setTypeSalle('MACHINES');
    setStatut('OUVERTE');
  };

  const handleSubmit = async () => {
    if (!code.trim() || !nom.trim()) return;
    setSaving(true);
    try {
      await onSubmit({ code: code.trim(), nom: nom.trim(), type_salle: typeSalle, statut });
      reset();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="Nouvelle salle" subtitle="Créer une salle de casino">
      <FormField label="Code">
        <TextInput value={code} onChange={(e) => setCode(e.target.value)} placeholder="SALLE-01" />
      </FormField>
      <FormField label="Nom">
        <TextInput value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Salle VIP" />
      </FormField>
      <FormField label="Type de salle">
        <SelectInput value={typeSalle} onChange={(e) => setTypeSalle(e.target.value as TypeSalle)}>
          {TYPES_SALLE.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </SelectInput>
      </FormField>
      <FormField label="Statut">
        <SelectInput value={statut} onChange={(e) => setStatut(e.target.value as StatutSalle)}>
          {STATUTS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </SelectInput>
      </FormField>
      <ModalActions>
        <Button variant="secondary" onClick={onClose}>Annuler</Button>
        <Button onClick={handleSubmit} disabled={saving || !code.trim() || !nom.trim()}>
          {saving ? 'Création…' : 'Créer la salle'}
        </Button>
      </ModalActions>
    </ModalShell>
  );
};
