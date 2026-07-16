import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Modal, Field, TextInput, NumberInput, Select, Button, ErrorBanner } from '../common';
import { tablesJeuApi } from '../../../services/casinoTablesJeu.service';
import type { TableJeu, TypeJeu } from '../../../types/casinoTablesJeu.types';
import { TYPE_JEU_LABELS } from '../../../types/casinoTablesJeu.types';
import type { Room } from '../../../types/casino.types';

interface TableFormModalProps {
  room: Room;
  table?: TableJeu | null; // null/undefined = création
  onClose: () => void;
  onSuccess: () => void;
}

export const TableFormModal: React.FC<TableFormModalProps> = ({ room, table, onClose, onSuccess }) => {
  const isEdit = !!table;
  const [numero, setNumero] = useState(table?.numero || '');
  const [typeJeu, setTypeJeu] = useState<TypeJeu>(table?.type_jeu || 'POKER');
  const [caveMinimum, setCaveMinimum] = useState<string>(table ? String(table.cave_minimum) : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!numero.trim()) {
      setError('Le numéro/nom de la table est requis.');
      return;
    }
    const min = Number(caveMinimum);
    if (!min || min <= 0) {
      setError('La cave minimum doit être un montant positif.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = { room_id: room.id, numero: numero.trim(), type_jeu: typeJeu, cave_minimum: min };
      if (isEdit && table) {
        await tablesJeuApi.update(table.id, payload);
      } else {
        await tablesJeuApi.create(payload);
      }
      onSuccess();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Erreur lors de l'enregistrement de la table.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      title={isEdit ? 'Modifier la table' : 'Nouvelle table de jeu'}
      subtitle={`Salle : ${room.nom}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button icon={<CheckCircle2 size={16} />} onClick={handleSubmit} disabled={loading}>
            {loading ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error && <ErrorBanner message={error} />}

        <Field label="Numéro / nom de la table" required>
          <TextInput value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Table 1" />
        </Field>

        <Field label="Type de jeu" required>
          <Select value={typeJeu} onChange={(e) => setTypeJeu(e.target.value as TypeJeu)}>
            {(Object.keys(TYPE_JEU_LABELS) as TypeJeu[]).map((t) => (
              <option key={t} value={t}>
                {TYPE_JEU_LABELS[t]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Cave minimum (Ariary)" required>
          <NumberInput
            value={caveMinimum}
            onChange={(e) => setCaveMinimum(e.target.value)}
            placeholder="100000"
            min={1}
          />
          <p className="text-muted text-[11px] mt-1">
            Montant requis pour la cave initiale d'un joueur. Les recaves ne sont pas soumises à ce minimum.
          </p>
        </Field>
      </div>
    </Modal>
  );
};

export default TableFormModal;