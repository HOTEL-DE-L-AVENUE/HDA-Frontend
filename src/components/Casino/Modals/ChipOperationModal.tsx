import React, { useEffect, useMemo, useState } from 'react';
import { Coins, CheckCircle2 } from 'lucide-react';
import { Modal, Field, NumberInput, Select, Button, ErrorBanner, Spinner, formatAriary } from '../common';
import { PlayerSelector } from '../PlayerSelector';
import { chipTypesApi, chipsApi } from '../../../services/casino.service';
import type { ChipType, ChipTransaction, MoyenPaiement, SelectedPlayer } from '../../../types/casino.types';

interface ChipOperationModalProps {
  sessionId: number;
  defaultMovement?: 'BUY' | 'SELL';
  onClose: () => void;
  onSuccess: (tx: ChipTransaction) => void;
}

export const ChipOperationModal: React.FC<ChipOperationModalProps> = ({
  sessionId,
  defaultMovement = 'BUY',
  onClose,
  onSuccess,
}) => {
  const [movement, setMovement] = useState<'BUY' | 'SELL'>(defaultMovement);
  const [chipTypes, setChipTypes] = useState<ChipType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [chipTypeId, setChipTypeId] = useState<number | ''>('');
  const [quantite, setQuantite] = useState('');
  const [moyenPaiement, setMoyenPaiement] = useState<MoyenPaiement>('ESPECES');
  const [player, setPlayer] = useState<SelectedPlayer | null>(null);
  const [clientLibre, setClientLibre] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await chipTypesApi.list();
        const actifs = data.filter((c) => c.statut === 'ACTIF');
        setChipTypes(actifs);
        if (actifs.length) setChipTypeId(actifs[0].id);
      } catch (e: any) {
        setError(e?.message || 'Erreur de chargement des types de jetons.');
      } finally {
        setLoadingTypes(false);
      }
    })();
  }, []);

  const selectedType = useMemo(() => chipTypes.find((c) => c.id === chipTypeId), [chipTypes, chipTypeId]);
  const total = selectedType && quantite ? selectedType.valeur_nominale * Number(quantite) : 0;

  async function handleSubmit() {
    const qty = Number(quantite);
    if (!chipTypeId) {
      setError('Sélectionnez un type de jeton.');
      return;
    }
    if (!qty || qty <= 0) {
      setError('Quantité invalide.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = {
        session_id: sessionId,
        chip_type_id: Number(chipTypeId),
        quantite: qty,
        moyen_paiement: moyenPaiement,
        client_id: player?.client.id ?? null,
        client_libre: !player && clientLibre.trim() ? clientLibre.trim() : null,
      };
      const tx = await (movement === 'BUY' ? chipsApi.buy(payload) : chipsApi.sell(payload));
      onSuccess(tx);
    } catch (e: any) {
      setError(e?.message || "Erreur lors de l'enregistrement du mouvement de jetons.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      title="Mouvement de jetons"
      subtitle="Achat (cash → jetons) ou reprise (jetons → cash)"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button icon={<CheckCircle2 size={16} />} onClick={handleSubmit} disabled={loading}>
            {loading ? 'Enregistrement…' : 'Valider'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error && <ErrorBanner message={error} />}

        <Field label="Sens du mouvement">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMovement('BUY')}
              className="flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium"
              style={{
                backgroundColor: movement === 'BUY' ? 'var(--color-accent)' : 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                color: movement === 'BUY' ? '#000' : 'inherit',
              }}
            >
              <Coins size={16} /> Achat (cash → jetons)
            </button>
            <button
              onClick={() => setMovement('SELL')}
              className="flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium"
              style={{
                backgroundColor: movement === 'SELL' ? 'var(--color-accent)' : 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                color: movement === 'SELL' ? '#000' : 'inherit',
              }}
            >
              <Coins size={16} /> Reprise (jetons → cash)
            </button>
          </div>
        </Field>

        {loadingTypes ? (
          <Spinner label="Chargement des jetons…" />
        ) : (
          <Field label="Type de jeton" required>
            <Select value={chipTypeId} onChange={(e) => setChipTypeId(Number(e.target.value))}>
              {chipTypes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom} — {formatAriary(c.valeur_nominale)}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <Field label="Quantité" required>
          <NumberInput value={quantite} onChange={(e) => setQuantite(e.target.value)} placeholder="20" min={1} />
        </Field>

        {!!total && (
          <p className="text-sm text-primary font-semibold">
            Montant total : <span style={{ color: 'var(--color-accent)' }}>{formatAriary(total)}</span>
          </p>
        )}

        <Field label="Moyen de paiement" required>
          <Select value={moyenPaiement} onChange={(e) => setMoyenPaiement(e.target.value as MoyenPaiement)}>
            <option value="ESPECES">Espèces</option>
            <option value="MOBILE_MONEY">Mobile Money</option>
            <option value="CARTE">Carte bancaire</option>
            <option value="VIREMENT">Virement</option>
            <option value="AUTRE">Autre</option>
          </Select>
        </Field>

        <PlayerSelector
          value={player}
          onChange={setPlayer}
          allowFree
          freeLabel="Client de passage (nom libre, optionnel)"
          freeValue={clientLibre}
          onFreeLabelChange={setClientLibre}
        />
      </div>
    </Modal>
  );
};

export default ChipOperationModal;
