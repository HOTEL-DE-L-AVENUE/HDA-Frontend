import React, { useState } from 'react';
import { Button } from '../../UI';
import { ModalShell, FormField, TextArea, SelectInput, ModalActions } from './ModalShell';
import { ClientPicker } from './ClientPicker';
import type { Client, CasinoSession, TypeIncident, GraviteIncident } from '../types';

interface IncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: CasinoSession[];
  presetClient?: Client | null;
  onSubmit: (data: {
    client_id: number;
    session_id: number | null;
    type: TypeIncident;
    gravite: GraviteIncident;
    description: string;
    statut: 'OUVERT';
  }) => Promise<void> | void;
}

const TYPES: TypeIncident[] = ['INCIDENT', 'LITIGE'];
const GRAVITES: GraviteIncident[] = ['FAIBLE', 'MOYENNE', 'ELEVEE'];

export const IncidentModal: React.FC<IncidentModalProps> = ({ isOpen, onClose, sessions, presetClient, onSubmit }) => {
  const [client, setClient] = useState<Client | null>(presetClient ?? null);
  const [sessionId, setSessionId] = useState<number>(0);
  const [type, setType] = useState<TypeIncident>('INCIDENT');
  const [gravite, setGravite] = useState<GraviteIncident>('FAIBLE');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!client || !description.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        client_id: client.id,
        session_id: sessionId || null,
        type,
        gravite,
        description: description.trim(),
        statut: 'OUVERT',
      });
      setDescription('');
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="Signaler un incident" subtitle="Incident ou litige lié à un client">
      <ClientPicker
        clientId={client?.id ?? null}
        clientLibre=""
        onSelectClient={setClient}
        onChangeLibre={() => {}}
        allowFreeText={false}
      />
      <FormField label="Session liée (optionnel)">
        <SelectInput value={sessionId} onChange={(e) => setSessionId(Number(e.target.value))}>
          <option value={0}>Aucune</option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>Session #{s.id}</option>
          ))}
        </SelectInput>
      </FormField>
      <FormField label="Type">
        <SelectInput value={type} onChange={(e) => setType(e.target.value as TypeIncident)}>
          {TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </SelectInput>
      </FormField>
      <FormField label="Gravité">
        <SelectInput value={gravite} onChange={(e) => setGravite(e.target.value as GraviteIncident)}>
          {GRAVITES.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </SelectInput>
      </FormField>
      <FormField label="Description">
        <TextArea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
      </FormField>
      <ModalActions>
        <Button variant="secondary" onClick={onClose}>Annuler</Button>
        <Button onClick={handleSubmit} disabled={saving || !client || !description.trim()}>
          {saving ? 'Enregistrement…' : 'Signaler'}
        </Button>
      </ModalActions>
    </ModalShell>
  );
};
