import React, { useState } from 'react';
import { Button } from '../../UI';
import { ModalShell, FormField, TextInput, SelectInput, ModalActions } from './ModalShell';
import { ClientPicker } from './ClientPicker';
import type { Client, NiveauCarte, StatutCarte } from '../types';

interface CardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    client_id: number;
    numero_carte: string;
    qr_code: string;
    niveau: NiveauCarte;
    plafond_credit: number;
    statut: StatutCarte;
    date_emission: string;
  }) => Promise<void> | void;
}

const NIVEAUX: NiveauCarte[] = ['STANDARD', 'SILVER', 'GOLD', 'VIP'];
const STATUTS: StatutCarte[] = ['ACTIVE', 'SUSPENDUE', 'PERDUE'];

const todayISO = () => new Date().toISOString().slice(0, 10);

export const CardModal: React.FC<CardModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [client, setClient] = useState<Client | null>(null);
  const [numeroCarte, setNumeroCarte] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [niveau, setNiveau] = useState<NiveauCarte>('STANDARD');
  const [plafondCredit, setPlafondCredit] = useState<number>(0);
  const [statut, setStatut] = useState<StatutCarte>('ACTIVE');
  const [dateEmission, setDateEmission] = useState(todayISO());
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!client || !numeroCarte.trim() || !qrCode.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        client_id: client.id,
        numero_carte: numeroCarte.trim(),
        qr_code: qrCode.trim(),
        niveau,
        plafond_credit: plafondCredit,
        statut,
        date_emission: dateEmission,
      });
      setNumeroCarte('');
      setQrCode('');
      setPlafondCredit(0);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="Nouvelle carte de fidélité">
      <ClientPicker
        clientId={client?.id ?? null}
        clientLibre=""
        onSelectClient={setClient}
        onChangeLibre={() => {}}
        allowFreeText={false}
      />
      <FormField label="Numéro de carte">
        <TextInput value={numeroCarte} onChange={(e) => setNumeroCarte(e.target.value)} placeholder="CARD-000123" />
      </FormField>
      <FormField label="Code QR">
        <TextInput value={qrCode} onChange={(e) => setQrCode(e.target.value)} placeholder="QR-ABC123" />
      </FormField>
      <FormField label="Niveau">
        <SelectInput value={niveau} onChange={(e) => setNiveau(e.target.value as NiveauCarte)}>
          {NIVEAUX.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </SelectInput>
      </FormField>
      <FormField label="Plafond de crédit (Ar)">
        <TextInput type="number" min={0} value={plafondCredit} onChange={(e) => setPlafondCredit(Number(e.target.value))} />
      </FormField>
      <FormField label="Statut">
        <SelectInput value={statut} onChange={(e) => setStatut(e.target.value as StatutCarte)}>
          {STATUTS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </SelectInput>
      </FormField>
      <FormField label="Date d'émission">
        <TextInput type="date" value={dateEmission} onChange={(e) => setDateEmission(e.target.value)} />
      </FormField>
      <ModalActions>
        <Button variant="secondary" onClick={onClose}>Annuler</Button>
        <Button onClick={handleSubmit} disabled={saving || !client || !numeroCarte.trim() || !qrCode.trim()}>
          {saving ? 'Création…' : 'Créer la carte'}
        </Button>
      </ModalActions>
    </ModalShell>
  );
};
