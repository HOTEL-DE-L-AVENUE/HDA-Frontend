import React, { useState } from 'react';
import { Modal, Input, Select, Button } from '../../UI';
import type { SessionFormData, CasinoCashier } from '../types';

interface SessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  cashiers: CasinoCashier[];
  onSubmit: (data: SessionFormData) => void;
}

export const SessionModal: React.FC<SessionModalProps> = ({ isOpen, onClose, cashiers, onSubmit }) => {
  const [form, setForm] = useState<SessionFormData>({
    cashier_id: 0,
    user_id: 0,
    fond_initial: 0
  });

  const handleSubmit = () => {
    if (!form.cashier_id || !form.fond_initial) return;
    onSubmit(form);
    setForm({ cashier_id: 0, user_id: 0, fond_initial: 0 });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ouvrir une Session" size="lg">
      <div className="space-y-4">
        <Select 
          label="Caisse" 
          value={form.cashier_id.toString()} 
          onChange={(e) => setForm({...form, cashier_id: Number(e.target.value)})}
          options={[
            { value: '0', label: 'Sélectionner une caisse' },
            ...cashiers.filter(c => c.statut === 'OUVERTE').map(c => ({ 
              value: c.id.toString(), 
              label: c.nom 
            }))
          ]}
        />
        <Input 
          label="Fond initial (€)" 
          type="number" 
          value={form.fond_initial} 
          onChange={(e) => setForm({...form, fond_initial: Number(e.target.value)})} 
          placeholder="0.00"
          min={0}
        />
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Annuler</Button>
          <Button onClick={handleSubmit} className="flex-1" disabled={!form.cashier_id || !form.fond_initial}>
            Ouvrir
          </Button>
        </div>
      </div>
    </Modal>
  );
};