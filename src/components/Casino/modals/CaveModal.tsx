import React, { useState } from 'react';
import { CheckCircle2, Coins } from 'lucide-react';
import { Modal, Field, NumberInput, TextInput, Select, Button, ErrorBanner, Badge } from '../common';
import { PlayerSelector } from '../PlayerSelector';
import SignaturePad from '../../SignaturePad';
import { tablesJeuApi, tableCaveSignatureApi } from '../../../services/casinoTablesJeu.service';
import type { TableJeu, StatutPaiementCave } from '../../../types/casinoTablesJeu.types';
import type { MoyenPaiement, SelectedPlayer } from '../../../types/casino.types';

interface CaveModalProps {
  table: TableJeu;
  sessionId: number;
  /** true = recave (pas de minimum imposé), false = cave initiale (montant >= cave_minimum) */
  isRecave?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CaveModal: React.FC<CaveModalProps> = ({ table, sessionId, isRecave = false, onClose, onSuccess }) => {
  const [montant, setMontant] = useState<string>(isRecave ? '' : String(table.cave_minimum));
  const [player, setPlayer] = useState<SelectedPlayer | null>(null);
  const [clientLibre, setClientLibre] = useState('');
  const [numeroAdherent, setNumeroAdherent] = useState('');
  const [statutPaiement, setStatutPaiement] = useState<StatutPaiementCave>('PAYE');
  const [moyenPaiement, setMoyenPaiement] = useState<MoyenPaiement>('ESPECES');
  const [signature, setSignature] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    const amount = Number(montant);
    if (!amount || amount <= 0) {
      setError('Montant invalide.');
      return;
    }
    if (!isRecave && amount < table.cave_minimum) {
      setError(`La cave initiale doit être au moins de ${table.cave_minimum.toLocaleString('fr-FR')} Ar.`);
      return;
    }
    if (!player && !clientLibre.trim()) {
      setError('Sélectionnez un joueur ou saisissez un nom.');
      return;
    }
    if (!signature) {
      setError('Validez la signature du joueur avant d\'enregistrer la cave.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const cave = await tablesJeuApi.addCave(table.id, {
        session_id: sessionId,
        client_id: player?.client.id ?? null,
        client_libre: !player && clientLibre.trim() ? clientLibre.trim() : null,
        numero_adherent: numeroAdherent.trim() || null,
        montant: amount,
        statut_paiement: statutPaiement,
        moyen_paiement: statutPaiement === 'PAYE' ? moyenPaiement : null,
      });
      await tableCaveSignatureApi.sign(cave.id, signature);
      onSuccess();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Erreur lors de l'enregistrement de la cave.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      title={isRecave ? 'Recave' : 'Nouvelle cave'}
      subtitle={`${table.numero} · cave minimum ${table.cave_minimum.toLocaleString('fr-FR')} Ar`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button icon={<CheckCircle2 size={16} />} onClick={handleSubmit} disabled={loading}>
            {loading ? 'Enregistrement…' : 'Valider la ' + (isRecave ? 'recave' : 'cave')}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error && <ErrorBanner message={error} />}

        <div className="flex items-center gap-2">
          <Badge tone="info"><Coins size={12} className="inline mr-1" />{table.type_jeu}</Badge>
          {!isRecave && <Badge tone="warning">Cave initiale — minimum requis</Badge>}
        </div>

        <PlayerSelector
          value={player}
          onChange={setPlayer}
          allowFree
          freeLabel="Joueur sans fiche (nom libre)"
          freeValue={clientLibre}
          onFreeLabelChange={setClientLibre}
        />

        <Field label="N° d'adhérent (carte de fidélité)">
          <TextInput
            value={numeroAdherent}
            onChange={(e) => setNumeroAdherent(e.target.value)}
            placeholder="ADH-0231"
          />
        </Field>

        <Field label={isRecave ? 'Montant de la recave (Ariary)' : 'Montant de la cave (Ariary)'} required>
          <NumberInput value={montant} onChange={(e) => setMontant(e.target.value)} placeholder="100000" min={1} />
        </Field>

        <Field label="Statut du paiement" required>
          <Select value={statutPaiement} onChange={(e) => setStatutPaiement(e.target.value as StatutPaiementCave)}>
            <option value="PAYE">Payé</option>
            <option value="NON_PAYE">Non payé</option>
          </Select>
        </Field>

        {statutPaiement === 'PAYE' && (
          <Field label="Moyen de paiement" required>
            <Select value={moyenPaiement} onChange={(e) => setMoyenPaiement(e.target.value as MoyenPaiement)}>
              <option value="ESPECES">Espèces</option>
              <option value="CARTE">TPE / Carte bancaire</option>
              <option value="MOBILE_MONEY">Mobile Money</option>
              <option value="VIREMENT">Virement</option>
              <option value="AUTRE">Autre</option>
            </Select>
          </Field>
        )}

        {/* Composant générique réutilisé tel quel : mode "dessin" tant qu'aucune
            signature n'est validée, bascule en aperçu (avec "Refaire la signature")
            une fois confirmée. onChange ne se déclenche qu'au clic sur
            "Valider la signature", pas à chaque trait. */}
        <SignaturePad
          value={signature}
          onChange={setSignature}
          label="Signature du joueur"
          height={140}
          disabled={loading}
        />

        <p className="text-muted text-[11px]">
          Cette cave génère une écriture de caisse (buy-in) rattachée à la session en cours et une ligne dans la
          feuille de table de {table.numero}, avec horodatage et signature.
        </p>
      </div>
    </Modal>
  );
};

export default CaveModal;