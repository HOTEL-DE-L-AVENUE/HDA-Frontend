import React, { useState } from 'react';
import { Modal, Input, Select, Button } from '../../UI';
import type { CreditFormData, Client } from '../types';

interface CreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  onSubmit: (data: CreditFormData) => void;
}

export const CreditModal: React.FC<CreditModalProps> = ({ isOpen, onClose, clients, onSubmit }) => {
  const [form, setForm] = useState<CreditFormData>({
    client_id: 0,
    montant_accorde: 0,
    echeance: ''
  });

  const handleSubmit = () => {
    if (!form.client_id || !form.montant_accorde || !form.echeance) return;
    onSubmit(form);
    setForm({ client_id: 0, montant_accorde: 0, echeance: '' });
    onClose();
  };

  const joueurs = clients.filter(c => c.is_casino_player);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Accorder un Crédit" size="lg">
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

        <Input 
          label="Montant accordé (€)" 
          type="number" 
          value={form.montant_accorde} 
          onChange={(e) => setForm({...form, montant_accorde: Number(e.target.value)})} 
          placeholder="0.00"
          min={0}
        />

        <Input 
          label="Date d'échéance" 
          type="date" 
          value={form.echeance} 
          onChange={(e) => setForm({...form, echeance: e.target.value})} 
        />

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Annuler</Button>
          <Button onClick={handleSubmit} className="flex-1" disabled={!form.client_id || !form.montant_accorde || !form.echeance}>
            Accorder
          </Button>
        </div>
      </div>
    </Modal>
  );
};