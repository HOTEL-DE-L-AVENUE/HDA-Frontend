import React, { useState } from 'react';
import { Modal, Input, Select, Button } from '../../UI';
import type { CashierFormData, CasinoRoom } from '../types';

interface CashierModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: CasinoRoom[];
  onSubmit: (data: CashierFormData) => void;
}

export const CashierModal: React.FC<CashierModalProps> = ({ isOpen, onClose, rooms, onSubmit }) => {
  const [form, setForm] = useState<CashierFormData>({
    room_id: 0,
    nom: '',
    statut: 'OUVERTE'
  });

  const handleSubmit = () => {
    if (!form.nom || !form.room_id) return;
    onSubmit(form);
    setForm({ room_id: 0, nom: '', statut: 'OUVERTE' });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nouvelle Caisse" size="lg">
      <div className="space-y-4">
        <Select 
          label="Salle" 
          value={form.room_id.toString()} 
          onChange={(e) => setForm({...form, room_id: Number(e.target.value)})}
          options={[
            { value: '0', label: 'Sélectionner une salle' },
            ...rooms.map(r => ({ value: r.id.toString(), label: r.nom }))
          ]}
        />
        <Input 
          label="Nom de la caisse" 
          value={form.nom} 
          onChange={(e) => setForm({...form, nom: e.target.value})} 
          placeholder="Ex: Caisse 1" 
        />
        <Select 
          label="Statut" 
          value={form.statut} 
          onChange={(e) => setForm({...form, statut: e.target.value as any})}
          options={[
            { value: 'OUVERTE', label: 'Ouverte' },
            { value: 'FERMEE', label: 'Fermée' },
            { value: 'EN_PAUSE', label: 'En pause' },
          ]}
        />
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Annuler</Button>
          <Button onClick={handleSubmit} className="flex-1" disabled={!form.nom || !form.room_id}>Créer</Button>
        </div>
      </div>
    </Modal>
  );
};