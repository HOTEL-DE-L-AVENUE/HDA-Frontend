import React from 'react';
import { Modal, Input, Select, Button } from '../../../components/UI';
import { RoomForm, RoomType } from '../../../types/hebergement.type';

interface Props {
  isOpen:    boolean;
  onClose:   () => void;
  form:      RoomForm;
  onChange:  (form: RoomForm) => void;
  onSave:    () => void;
  isEditing: boolean;
  roomTypes: RoomType[];
}

export const RoomModal: React.FC<Props> = ({
  isOpen, onClose, form, onChange, onSave, isEditing, roomTypes,
}) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={isEditing ? 'Modifier la chambre' : 'Ajouter une chambre'}
    size="lg"
  >
    <div className="space-y-4">
      <Input
        label="Numéro de chambre"
        value={form.numero}
        onChange={(e) => onChange({ ...form, numero: e.target.value })}
        placeholder="Ex: 101"
      />
      <Select
        label="Type de chambre"
        value={form.room_type_id.toString()}
        onChange={(e) => onChange({ ...form, room_type_id: Number(e.target.value) })}
        options={[
          { value: '0', label: 'Sélectionner un type' },
          ...roomTypes.map(rt => ({ value: rt.id.toString(), label: rt.nom })),
        ]}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Capacité"
          type="number"
          value={form.capacite}
          onChange={(e) => onChange({ ...form, capacite: Number(e.target.value) })}
        />
        <Input
          label="Prix par nuit (Ar)"
          type="number"
          value={form.prix_nuit}
          onChange={(e) => onChange({ ...form, prix_nuit: Number(e.target.value) })}
        />
      </div>
      <Select
        label="Statut"
        value={form.statut}
        onChange={(e) => onChange({ ...form, statut: e.target.value as RoomForm['statut'] })}
        options={[
          { value: 'LIBRE',        label: 'Libre'        },
          { value: 'OCCUPEE',      label: 'Occupée'      },
          { value: 'RESERVEE',     label: 'Réservée'     },
          { value: 'NETTOYAGE',    label: 'Nettoyage'    },
          { value: 'MAINTENANCE',  label: 'Maintenance'  },
          { value: 'HORS_SERVICE', label: 'Hors service' },
        ]}
      />
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button variant="secondary" onClick={onClose}  className="flex-1">Annuler</Button>
        <Button onClick={onSave} className="flex-1">{isEditing ? 'Modifier' : 'Ajouter'}</Button>
      </div>
    </div>
  </Modal>
);