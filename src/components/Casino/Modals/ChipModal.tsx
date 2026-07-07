import React, { useMemo, useState } from 'react';
import { Button } from '../../UI';
import { ModalShell, FormField, TextInput, SelectInput, ModalActions } from './ModalShell';
import { ClientPicker } from './ClientPicker';
import type { CasinoSession, ChipType, Client, MoyenPaiement, ChipMoveInput } from '../types';
import { formatCurrency } from '../../../utils/data';

export type ChipOperation = 'buy' | 'sell';

interface ChipModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: CasinoSession[];
  chipTypes: ChipType[];
  operation: ChipOperation;
  onSubmit: (operation: ChipOperation, data: ChipMoveInput) => Promise<void> | void;
}

const MOYENS: MoyenPaiement[] = ['ESPECES', 'CARTE', 'VIREMENT', 'MOBILE_MONEY', 'AUTRE'];

export const ChipModal: React.FC<ChipModalProps> = ({ isOpen, onClose, sessions, chipTypes, operation, onSubmit }) => {
  const openSessions = sessions.filter((s) => s.statut === 'OUVERTE');
  const activeChipTypes = chipTypes.filter((c) => c.statut === 'ACTIF');

  const [sessionId, setSessionId] = useState<number>(openSessions[0]?.id ?? 0);
  const [chipTypeId, setChipTypeId] = useState<number>(activeChipTypes[0]?.id ?? 0);
  const [quantite, setQuantite] = useState<number>(1);
  const [moyenPaiement, setMoyenPaiement] = useState<MoyenPaiement>('ESPECES');
  const [client, setClient] = useState<Client | null>(null);
  const [clientLibre, setClientLibre] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chipType = activeChipTypes.find((c) => c.id === chipTypeId);
  const montantTotal = useMemo(() => (chipType ? quantite * chipType.valeur_nominale : 0), [chipType, quantite]);

  const handleSubmit = async () => {
    if (!sessionId || !chipTypeId || quantite <= 0) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit(operation, {
        session_id: sessionId,
        chip_type_id: chipTypeId,
        quantite,
        moyen_paiement: moyenPaiement,
        client_id: client?.id,
        client_libre: !client ? (clientLibre.trim() || undefined) : undefined,
      });
      setQuantite(1);
      setClient(null);
      setClientLibre('');
      onClose();
    } catch (err: any) {
      setError(err?.message || "Échec de l'opération sur les jetons.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={operation === 'buy' ? 'Achat de jetons' : 'Reprise de jetons'}
      subtitle={operation === 'buy' ? 'Le client échange du cash contre des jetons' : 'Le client échange des jetons contre du cash'}
    >
      <FormField label="Session de caisse (ouverte)">
        <SelectInput value={sessionId} onChange={(e) => setSessionId(Number(e.target.value))}>
          <option value={0}>Sélectionner…</option>
          {openSessions.map((s) => (
            <option key={s.id} value={s.id}>Session #{s.id} (caisse {s.cashier_id})</option>
          ))}
        </SelectInput>
      </FormField>
      <FormField label="Type de jeton">
        <SelectInput value={chipTypeId} onChange={(e) => setChipTypeId(Number(e.target.value))}>
          <option value={0}>Sélectionner…</option>
          {activeChipTypes.map((c) => (
            <option key={c.id} value={c.id}>{c.nom} ({formatCurrency(c.valeur_nominale)})</option>
          ))}
        </SelectInput>
      </FormField>
      <FormField label="Quantité">
        <TextInput type="number" min={1} value={quantite} onChange={(e) => setQuantite(Number(e.target.value))} />
      </FormField>
      <p className="text-xs text-muted mb-3">Montant total : <span className="text-primary font-semibold">{formatCurrency(montantTotal)}</span></p>
      <ClientPicker
        clientId={client?.id ?? null}
        clientLibre={clientLibre}
        onSelectClient={setClient}
        onChangeLibre={setClientLibre}
      />
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
        <Button onClick={handleSubmit} disabled={saving || !sessionId || !chipTypeId || quantite <= 0}>
          {saving ? 'Enregistrement…' : 'Valider'}
        </Button>
      </ModalActions>
    </ModalShell>
  );
};
