import React, { useState } from 'react';
import { Button } from '../../UI';
import { ModalShell, FormField, TextInput, SelectInput, ModalActions } from './ModalShell';
import { ClientPicker } from './ClientPicker';
import type { CasinoRoom, Client } from '../types';

interface VisitCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: CasinoRoom[];
  onSubmit: (
    data: { room_id: number; qr_code: string } | { room_id: number; client_id: number; entree_via: 'MANUEL' }
  ) => Promise<void> | void;
}

export const VisitCheckInModal: React.FC<VisitCheckInModalProps> = ({ isOpen, onClose, rooms, onSubmit }) => {
  const [mode, setMode] = useState<'qr' | 'manuel'>('manuel');
  const [roomId, setRoomId] = useState<number>(rooms[0]?.id ?? 0);
  const [qrCode, setQrCode] = useState('');
  const [client, setClient] = useState<Client | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!roomId) return;
    if (mode === 'qr' && !qrCode.trim()) return;
    if (mode === 'manuel' && !client) return;
    setSaving(true);
    setError(null);
    try {
      if (mode === 'qr') {
        await onSubmit({ room_id: roomId, qr_code: qrCode.trim() });
      } else {
        await onSubmit({ room_id: roomId, client_id: client!.id, entree_via: 'MANUEL' });
      }
      setQrCode('');
      setClient(null);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Code QR inconnu ou entrée invalide.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="Enregistrer une entrée" subtitle="Check-in en salle">
      <FormField label="Salle">
        <SelectInput value={roomId} onChange={(e) => setRoomId(Number(e.target.value))}>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>{r.nom}</option>
          ))}
        </SelectInput>
      </FormField>
      <FormField label="Méthode">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode('manuel')}
            className="flex-1 h-9 rounded-lg text-xs font-medium"
            style={{
              backgroundColor: mode === 'manuel' ? 'var(--color-accent)' : 'var(--color-surface-2)',
              color: mode === 'manuel' ? '#000' : undefined,
              border: '1px solid var(--color-border)',
            }}
          >
            Sans carte
          </button>
          <button
            type="button"
            onClick={() => setMode('qr')}
            className="flex-1 h-9 rounded-lg text-xs font-medium"
            style={{
              backgroundColor: mode === 'qr' ? 'var(--color-accent)' : 'var(--color-surface-2)',
              color: mode === 'qr' ? '#000' : undefined,
              border: '1px solid var(--color-border)',
            }}
          >
            Scan QR
          </button>
        </div>
      </FormField>
      {mode === 'qr' ? (
        <FormField label="Code QR de la carte">
          <TextInput value={qrCode} onChange={(e) => setQrCode(e.target.value)} placeholder="QR-ABC123" />
        </FormField>
      ) : (
        <ClientPicker
          clientId={client?.id ?? null}
          clientLibre=""
          onSelectClient={setClient}
          onChangeLibre={() => {}}
          allowFreeText={false}
        />
      )}
      {error && <p className="text-xs mb-2" style={{ color: 'var(--color-danger)' }}>{error}</p>}
      <ModalActions>
        <Button variant="secondary" onClick={onClose}>Annuler</Button>
        <Button onClick={handleSubmit} disabled={saving || !roomId}>
          {saving ? 'Enregistrement…' : "Enregistrer l'entrée"}
        </Button>
      </ModalActions>
    </ModalShell>
  );
};
