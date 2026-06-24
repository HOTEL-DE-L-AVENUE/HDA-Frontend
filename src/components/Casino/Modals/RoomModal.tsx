import React, { useState } from 'react';
import { Modal, Input, Select, Button } from '../../UI';
import type { RoomFormData } from '../types';

interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RoomFormData) => void;
}

export const RoomModal: React.FC<RoomModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [form, setForm] = useState<RoomFormData>({
    nom: '',
    type_salle: 'PRINCIPALE',
    statut: 'OUVERTE'
  });

  const handleSubmit = () => {
    if (!form.nom) return;
    onSubmit(form);
    setForm({ nom: '', type_salle: 'PRINCIPALE', statut: 'OUVERTE' });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nouvelle Salle" size="lg">
      <div className="space-y-4">
        <Input 
          label="Nom de la salle" 
          value={form.nom} 
          onChange={(e) => setForm({...form, nom: e.target.value})} 
          placeholder="Ex: Salle VIP" 
        />
        <Select 
          label="Type de salle" 
          value={form.type_salle} 
          onChange={(e) => setForm({...form, type_salle: e.target.value})}
          options={[
            { value: 'PRINCIPALE', label: 'Principale' },
            { value: 'VIP', label: 'VIP' },
            { value: 'POKER', label: 'Poker' },
            { value: 'MACHINES', label: 'Machines à sous' },
          ]}
        />
        <Select 
          label="Statut" 
          value={form.statut} 
          onChange={(e) => setForm({...form, statut: e.target.value as any})}
          options={[
            { value: 'OUVERTE', label: 'Ouverte' },
            { value: 'FERMEE', label: 'Fermée' },
            { value: 'EN_TRAVAUX', label: 'En travaux' },
          ]}
        />
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Annuler</Button>
          <Button onClick={handleSubmit} className="flex-1" disabled={!form.nom}>Créer</Button>
        </div>
      </div>
    </Modal>
  );
};