import React, { useState } from 'react';
import { Modal, Select, Button } from '../../UI';
import type { CardFormData, Client } from '../types';

interface CardModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  onSubmit: (data: CardFormData) => void;
}

export const CardModal: React.FC<CardModalProps> = ({ isOpen, onClose, clients, onSubmit }) => {
  const [form, setForm] = useState<CardFormData>({
    client_id: 0,
    niveau: 'BRONZE'
  });

  const handleSubmit = () => {
    if (!form.client_id) return;
    onSubmit(form);
    setForm({ client_id: 0, niveau: 'BRONZE' });
    onClose();
  };

  const joueurs = clients.filter(c => c.is_casino_player);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nouvelle Carte de Fidélité" size="lg">
      <div className="space-y-4">
        <Select 
          label="Client" 
          value={form.client_id.toString()} 
          onChange={(e) => setForm({...form, client_id: Number(e.target.value)})}
          options={[
            { value: '0', label: 'Sélectionner un client' },
            ...joueurs.map(c => ({ 
              value: c.id.toString(), 
              label: `${c.prenom} ${c.nom} - ${c.telephone}` 
            }))
          ]}
        />

        <Select 
          label="Niveau" 
          value={form.niveau} 
          onChange={(e) => setForm({...form, niveau: e.target.value})}
          options={[
            { value: 'BRONZE', label: '🥉 Bronze' },
            { value: 'ARGENT', label: '🥈 Argent' },
            { value: 'OR', label: '🥇 Or' },
            { value: 'PLATINE', label: '💎 Platine' },
            { value: 'DIAMANT', label: '💠 Diamant' },
          ]}
        />

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Annuler</Button>
          <Button onClick={handleSubmit} className="flex-1" disabled={!form.client_id}>Créer</Button>
        </div>
      </div>
    </Modal>
  );
};