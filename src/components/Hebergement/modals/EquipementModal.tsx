import React from 'react';
import { Modal, Select, Input, Button } from '../../../components/UI';
import { Equipment, EquipmentForm, Room } from '../../../types/hebergement.type';

interface Props {
  isOpen:     boolean;
  onClose:    () => void;
  form:       EquipmentForm;
  onChange:   (form: EquipmentForm) => void;
  onSave:     () => void;
  isEditing:  boolean;
  rooms:      Room[];
  equipments: Equipment[];
}

export const EquipementModal: React.FC<Props> = ({
  isOpen, onClose, form, onChange, onSave, isEditing, rooms, equipments,
}) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={isEditing ? "Modifier l'équipement" : 'Ajouter un équipement'}
    size="lg"
  >
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
        label="Équipement"
        value={form.equipment_id.toString()}
        onChange={(e) => onChange({ ...form, equipment_id: Number(e.target.value) })}
        options={[
          { value: '0', label: 'Sélectionner un équipement' },
          ...equipments.map(eq => ({ value: eq.id.toString(), label: eq.nom })),
        ]}
      />
      <Input
        label="Quantité"
        type="number"
        value={form.quantite}
        onChange={(e) => onChange({ ...form, quantite: Number(e.target.value) })}
      />
      <Select
        label="Statut"
        value={form.statut}
        onChange={(e) => onChange({ ...form, statut: e.target.value as EquipmentForm['statut'] })}
        options={[
          { value: 'BON',          label: 'Bon'          },
          { value: 'EN_PANNE',     label: 'En panne'     },
          { value: 'REMPLACE',     label: 'Remplacé'     },
          { value: 'HORS_SERVICE', label: 'Hors service' },
        ]}
      />
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button variant="secondary" onClick={onClose} className="flex-1">Annuler</Button>
        <Button onClick={onSave} className="flex-1">{isEditing ? 'Modifier' : 'Ajouter'}</Button>
      </div>
    </div>
  </Modal>
);