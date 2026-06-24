import React, { useState } from 'react';
import { Modal, Input, Select, Button } from '../../UI';
import { formatCurrency } from '../../../utils/data';
import type { ChipTransactionFormData, Client } from '../types';

interface ChipTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  onSubmit: (data: ChipTransactionFormData) => void;
}

export const ChipTransactionModal: React.FC<ChipTransactionModalProps> = ({ 
  isOpen, 
  onClose, 
  clients, 
  onSubmit 
}) => {
  const [form, setForm] = useState<ChipTransactionFormData>({
    client_id: 0,
    transaction_type: 'ACHAT',
    quantite: 0,
    valeur_unitaire: 0
  });

  const handleSubmit = () => {
    if (!form.client_id || !form.quantite || !form.valeur_unitaire) return;
    onSubmit(form);
    setForm({ client_id: 0, transaction_type: 'ACHAT', quantite: 0, valeur_unitaire: 0 });
    onClose();
  };

  const total = form.quantite * form.valeur_unitaire;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Transaction Jetons" size="lg">
      <div className="space-y-4">
        <Select 
          label="Client" 
          value={form.client_id.toString()} 
          onChange={(e) => setForm({...form, client_id: Number(e.target.value)})}
          options={[
            { value: '0', label: 'Sélectionner un client' },
            ...clients.map(c => ({ value: c.id.toString(), label: `${c.prenom} ${c.nom} - ${c.telephone}` }))
          ]}
        />

        <Select 
          label="Type" 
          value={form.transaction_type} 
          onChange={(e) => setForm({...form, transaction_type: e.target.value as any})}
          options={[
            { value: 'ACHAT', label: 'Achat' },
            { value: 'RACHAT', label: 'Rachat' },
            { value: 'GAIN', label: 'Gain' },
            { value: 'PERTE', label: 'Perte' },
          ]}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input 
            label="Quantité" 
            type="number" 
            value={form.quantite} 
            onChange={(e) => setForm({...form, quantite: Number(e.target.value)})} 
            min={1}
          />
          <Input 
            label="Valeur unitaire (€)" 
            type="number" 
            value={form.valeur_unitaire} 
            onChange={(e) => setForm({...form, valeur_unitaire: Number(e.target.value)})} 
            min={1}
          />
        </div>

        <div className="bg-accent-4 p-3 rounded-xl border border-accent/20">
          <p className="text-secondary text-sm">Total: <span className="text-accent font-bold">{formatCurrency(total)}</span></p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Annuler</Button>
          <Button onClick={handleSubmit} className="flex-1" disabled={!form.client_id || !form.quantite || !form.valeur_unitaire}>
            Enregistrer
          </Button>
        </div>
      </div>
    </Modal>
  );
};