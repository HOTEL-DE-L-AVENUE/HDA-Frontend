import React from 'react';
import { Modal, Input, Select, Button } from '../../../components/UI';
import { ClientForm } from '../../../types/hebergement.type';

interface Props {
  isOpen:   boolean;
  onClose:  () => void;
  form:     ClientForm;
  onChange: (form: ClientForm) => void;
  onSave:   () => void;
}

export const ClientModal: React.FC<Props> = ({ isOpen, onClose, form, onChange, onSave }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Nouveau Client" size="lg">
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Nom"
          value={form.nom}
          onChange={(e) => onChange({ ...form, nom: e.target.value })}
          placeholder="Nom"
        />
        <Input
          label="Prénom"
          value={form.prenom}
          onChange={(e) => onChange({ ...form, prenom: e.target.value })}
          placeholder="Prénom"
        />
      </div>
      <Input
        label="Téléphone"
        value={form.telephone}
        onChange={(e) => onChange({ ...form, telephone: e.target.value })}
        placeholder="+261 34 12 345 67"
      />
      <Input
        label="Email"
        type="email"
        value={form.email}
        onChange={(e) => onChange({ ...form, email: e.target.value })}
        placeholder="email@exemple.com"
      />
      <Input
        label="Adresse"
        value={form.adresse}
        onChange={(e) => onChange({ ...form, adresse: e.target.value })}
        placeholder="Adresse complète"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Type de pièce"
          value={form.type_piece}
          onChange={(e) => onChange({ ...form, type_piece: e.target.value })}
          options={[
            { value: '',          label: 'Sélectionner'        },
            { value: 'CNI',       label: 'CNI'                 },
            { value: 'PASSEPORT', label: 'Passeport'           },
            { value: 'PERMIS',    label: 'Permis de conduire'  },
          ]}
        />
        <Input
          label="Numéro de pièce"
          value={form.numero_piece}
          onChange={(e) => onChange({ ...form, numero_piece: e.target.value })}
          placeholder="Numéro"
        />
      </div>
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button variant="secondary" onClick={onClose} className="flex-1">Annuler</Button>
        <Button onClick={onSave} className="flex-1">Enregistrer</Button>
      </div>
    </div>
  </Modal>
);