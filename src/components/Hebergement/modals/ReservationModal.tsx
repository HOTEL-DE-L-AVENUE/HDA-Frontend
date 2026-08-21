import React, { useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Modal, Select, Input, Button } from '../../../components/UI';
import { Client, ReservationForm, Room } from '../../../types/hebergement.type';
import { formatCurrency } from '../../../utils/data';

interface Props {
  isOpen:   boolean;
  onClose:  () => void;
  form:     ReservationForm;
  onChange: (form: ReservationForm) => void;
  onSave:   () => void;
  onNewClient: () => void;
  clients:  Client[];
  rooms:    Room[];
}

export const ReservationModal: React.FC<Props> = ({
  isOpen, onClose, form, onChange, onSave, onNewClient, clients, rooms,
}) => {
  // Calculate total amount automatically when room or dates change
  useEffect(() => {
    if (form.room_id && form.date_arrivee && form.date_depart) {
      const room = rooms.find(r => r.id === form.room_id);
      if (room && room.prix_nuit) {
        const arrivee = new Date(form.date_arrivee);
        const depart = new Date(form.date_depart);
        const days = Math.ceil((depart.getTime() - arrivee.getTime()) / (1000 * 60 * 60 * 24));
        
        if (days > 0) {
          const total = days * room.prix_nuit;
          onChange({ ...form, montant_total: total });
        }
      }
    }
  }, [form.room_id, form.date_arrivee, form.date_depart, rooms]);

  const handleRoomChange = (roomId: number) => {
    onChange({ ...form, room_id: roomId });
  };

  const handleDateChange = (field: 'date_arrivee' | 'date_depart', value: string) => {
    onChange({ ...form, [field]: value });
  };

  return (
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
          onChange={(e) => handleRoomChange(Number(e.target.value))}
          options={[
            { value: '0', label: 'Sélectionner une chambre' },
            ...rooms
              .filter(r => r.statut === 'LIBRE')
              .map(r => ({ value: r.id.toString(), label: `Chambre ${r.numero} - ${formatCurrency(r.prix_nuit)}/nuit` })),
          ]}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input 
            label="Arrivée"  
            type="date" 
            value={form.date_arrivee} 
            onChange={(e) => handleDateChange('date_arrivee', e.target.value)} 
          />
          <Input 
            label="Départ"   
            type="date" 
            value={form.date_depart}  
            onChange={(e) => handleDateChange('date_depart', e.target.value)} 
          />
        </div>
        <Input
          label="Montant Total (Ar)"
          type="number"
          value={form.montant_total}
          onChange={(e) => onChange({ ...form, montant_total: Number(e.target.value) })}
          readOnly={!!(form.room_id && form.date_arrivee && form.date_depart)}
          className={!!(form.room_id && form.date_arrivee && form.date_depart) ? 'bg-slate-700/50' : ''}
        />
        {form.room_id && form.date_arrivee && form.date_depart && (
          <p className="text-xs text-slate-500">
            💡 Le montant est calculé automatiquement selon le nombre de nuits et le prix de la chambre
          </p>
        )}
        <Select
          label="Statut"
          value={form.statut}
          onChange={(e) => onChange({ ...form, statut: e.target.value as ReservationForm['statut'] })}
          options={[
            { value: 'EN_COURS',  label: 'En cours'  },
            { value: 'CONFIRMEE', label: 'Confirmée' },
          ]}
        />
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}  className="flex-1">Annuler</Button>
          <Button onClick={onSave} className="flex-1">Enregistrer</Button>
        </div>
      </div>
    </Modal>
  );
};