import React from 'react';
import { Modal, Select, Input, Button } from '../../../components/UI';
import { HousekeepingForm, Room } from '../../../types/hebergement.type';

interface Props {
  isOpen:   boolean;
  onClose:  () => void;
  form:     HousekeepingForm;
  onChange: (form: HousekeepingForm) => void;
  onSave:   () => void;
  rooms:    Room[];
}

export const HousekeepingModal: React.FC<Props> = ({
  isOpen, onClose, form, onChange, onSave, rooms,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Nouvelle tâche de ménage" size="lg">
    <div className="space-y-4">
      <Select
        label="Chambre"
        value={form.room_id.toString()}
        onChange={(e) => onChange({ ...form, room_id: Number(e.target.value) })}
        options={[
          { value: '0', label: 'Sélectionner une chambre' },
          ...rooms.map(r => ({ value: r.id.toString(), label: `Chambre ${r.numero}` })),
        ]}
      />
      <Select
        label="Type de tâche"
        value={form.type_tache}
        onChange={(e) => onChange({ ...form, type_tache: e.target.value as HousekeepingForm['type_tache'] })}
        options={[
          { value: 'NETTOYAGE',        label: 'Nettoyage'         },
          { value: 'DESINFECTION',     label: 'Désinfection'      },
          { value: 'CHANGEMENT_DRAPS', label: 'Changement draps'  },
          { value: 'CONTROLE',         label: 'Contrôle'          },
        ]}
      />
      <Input
        label="Date prévue"
        type="datetime-local"
        value={form.planned_at}
        onChange={(e) => onChange({ ...form, planned_at: e.target.value })}
      />
      <Input
        label="Commentaire"
        value={form.commentaire}
        onChange={(e) => onChange({ ...form, commentaire: e.target.value })}
        placeholder="Instructions particulières..."
      />
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button variant="secondary" onClick={onClose} className="flex-1">Annuler</Button>
        <Button onClick={onSave} className="flex-1">Enregistrer</Button>
      </div>
    </div>
  </Modal>
);