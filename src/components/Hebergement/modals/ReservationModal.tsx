import React from 'react';
import { Plus } from 'lucide-react';
import { Modal, Select, Input, Button } from '../../../components/UI';
import { Client, ReservationForm, Room } from '../../../types/hebergement.type';
import { formatCurrency } from '../../../utils/data';

interface Props {
  isOpen:  boolean;
  onClose: () => void;
  form:    ReservationForm;
  onChange: (form: ReservationForm) => void;
  onSave:  () => void;
  onNewClient: () => void;
  clients: Client[];
  rooms:   Room[];
}

export const ReservationModal: React.FC<Props> = ({
  isOpen, onClose, form, onChange, onSave, onNewClient, clients, rooms,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Nouvelle Réservation" size="lg">
    <div className="space-y-4">
      <Select
        label="Client"
        value={form.client_id.toString()}
        onChange={(e) => onChange({ ...form, client_id: Number(e.target.value) })}
        options={[
          { value: '0', label: 'Sélectionner un client' },
          ...clients.map(c => ({ value: c.id.toString(), label: `${c.prenom} ${c.nom} - ${c.telephone}` })),
        ]}
      />
      <Button variant="secondary" onClick={onNewClient} className="w-full">
        <Plus size={14} className="mr-2" /> Nouveau client
      </Button>
      <Select
        label="Chambre"
        value={form.room_id.toString()}
        onChange={(e) => onChange({ ...form, room_id: Number(e.target.value) })}
        options={[
          { value: '0', label: 'Sélectionner une chambre' },
          ...rooms
            .filter(r => r.statut === 'LIBRE')
            .map(r => ({ value: r.id.toString(), label: `Chambre ${r.numero} - ${formatCurrency(r.prix_nuit)}/nuit` })),
        ]}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Arrivée"  type="date" value={form.date_arrivee} onChange={(e) => onChange({ ...form, date_arrivee: e.target.value })} />
        <Input label="Départ"   type="date" value={form.date_depart}  onChange={(e) => onChange({ ...form, date_depart:  e.target.value })} />
      </div>
      <Input
        label="Montant Total (Ar)"
        type="number"
        value={form.montant_total}
        onChange={(e) => onChange({ ...form, montant_total: Number(e.target.value) })}
      />
      <Select
        label="Statut"
        value={form.statut}
        onChange={(e) => onChange({ ...form, statut: e.target.value as ReservationForm['statut'] })}
        options={[
          { value: 'CONFIRMEE', label: 'Confirmée' },
          { value: 'EN_COURS',  label: 'En cours'  },
        ]}
      />
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button variant="secondary" onClick={onClose}  className="flex-1">Annuler</Button>
        <Button onClick={onSave} className="flex-1">Enregistrer</Button>
      </div>
    </div>
  </Modal>
);