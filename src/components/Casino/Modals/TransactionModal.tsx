import React, { useState } from 'react';
import { Modal, Input, Select, Button } from '../../UI';
import { formatDate } from '../../../utils/data';
import type { TransactionFormData, Client, CasinoSession } from '../types';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  sessions: CasinoSession[];
  onSubmit: (data: TransactionFormData) => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({ 
  isOpen, 
  onClose, 
  clients, 
  sessions, 
  onSubmit 
}) => {
  const [form, setForm] = useState<TransactionFormData>({
    client_id: 0,
    session_id: 0,
    type_transaction: 'ACHAT_JETONS',
    montant: 0,
    moyen_paiement: 'ESPECES',
    description: ''
  });

  const handleSubmit = () => {
    if (!form.montant || !form.session_id) return;
    onSubmit(form);
    setForm({ client_id: 0, session_id: 0, type_transaction: 'ACHAT_JETONS', montant: 0, moyen_paiement: 'ESPECES', description: '' });
    onClose();
  };

  const activeSessions = sessions.filter(s => s.fermeture_at === null);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nouvelle Transaction" size="lg">
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
          label="Session" 
          value={form.session_id.toString()} 
          onChange={(e) => setForm({...form, session_id: Number(e.target.value)})}
          options={[
            { value: '0', label: 'Sélectionner une session' },
            ...activeSessions.map(s => ({ 
              value: s.id.toString(), 
              label: `Session #${s.id} - ${formatDate(s.ouverture_at)}` 
            }))
          ]}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select 
            label="Type de transaction" 
            value={form.type_transaction} 
            onChange={(e) => setForm({...form, type_transaction: e.target.value as any})}
            options={[
              { value: 'ACHAT_JETONS', label: 'Achat de jetons' },
              { value: 'RACHAT_JETONS', label: 'Rachat de jetons' },
              { value: 'GAIN', label: 'Gain' },
              { value: 'PERTE', label: 'Perte' },
              { value: 'DEPOT', label: 'Dépôt' },
              { value: 'RETRAIT', label: 'Retrait' },
            ]}
          />

          <Select 
            label="Moyen de paiement" 
            value={form.moyen_paiement} 
            onChange={(e) => setForm({...form, moyen_paiement: e.target.value as any})}
            options={[
              { value: 'ESPECES', label: 'Espèces' },
              { value: 'CARTE', label: 'Carte' },
              { value: 'MOBILE_MONEY', label: 'Mobile Money' },
              { value: 'VIREMENT', label: 'Virement' },
              { value: 'COMPTE', label: 'Compte client' },
            ]}
          />
        </div>

        <Input 
          label="Montant (€)" 
          type="number" 
          value={form.montant} 
          onChange={(e) => setForm({...form, montant: Number(e.target.value)})} 
          placeholder="0.00"
          min={0}
        />

        <Input 
          label="Description" 
          value={form.description} 
          onChange={(e) => setForm({...form, description: e.target.value})} 
          placeholder="Ex: Achat jetons pour tournoi poker" 
        />

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Annuler</Button>
          <Button onClick={handleSubmit} className="flex-1" disabled={!form.montant || !form.session_id}>
            Enregistrer
          </Button>
        </div>
      </div>
    </Modal>
  );
};