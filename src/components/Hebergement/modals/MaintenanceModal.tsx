import React from 'react';
import { Modal, Select, Input, Button } from '../../../components/UI';
import { Equipment, MaintenanceForm, Room } from '../../../types/hebergement.type';

interface Props {
  isOpen:     boolean;
  onClose:    () => void;
  form:       MaintenanceForm;
  onChange:   (form: MaintenanceForm) => void;
  onSave:     () => void;
  rooms:      Room[];
  equipments: Equipment[];
}

export const MaintenanceModal: React.FC<Props> = ({
  isOpen, onClose, form, onChange, onSave, rooms, equipments,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Nouvelle intervention" size="lg">
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
        label="Équipement concerné"
        value={form.equipment_id.toString()}
        onChange={(e) => onChange({ ...form, equipment_id: Number(e.target.value) })}
        options={[
          { value: '0', label: 'Non spécifié' },
          ...equipments.map(eq => ({ value: eq.id.toString(), label: eq.nom })),
        ]}
      />
      <Select
        label="Type d'intervention"
        value={form.type_intervention}
        onChange={(e) => onChange({ ...form, type_intervention: e.target.value as MaintenanceForm['type_intervention'] })}
        options={[
          { value: 'PREVENTIVE', label: 'Préventive' },
          { value: 'CORRECTIVE', label: 'Corrective' },
          { value: 'URGENCE',    label: 'Urgence'    },
        ]}
      />
      <Input
        label="Description du problème"
        value={form.description}
        onChange={(e) => onChange({ ...form, description: e.target.value })}
        placeholder="Décrivez le problème..."
      />
      <Input
        label="Coût estimé (Ar)"
        type="number"
        value={form.cout}
        onChange={(e) => onChange({ ...form, cout: Number(e.target.value) })}
      />
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button variant="secondary" onClick={onClose} className="flex-1">Annuler</Button>
        <Button onClick={onSave} className="flex-1">Enregistrer</Button>
      </div>
    </div>
  </Modal>
);