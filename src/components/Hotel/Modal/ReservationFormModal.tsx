// hotel/modals/ReservationFormModal.tsx
import React, { useState, useEffect } from 'react';
import { Reservation, Room, Client } from '../../../types/hotel.types';
import { 
  X, 
  Calendar, 
  Users, 
  DollarSign, 
  User, 
  DoorOpen,
  CreditCard,
  Clock,
  CheckCircle,
  AlertCircle,
  UserCheck
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../../utils/data';
import { Modal } from '../../Modal';

interface ReservationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: Reservation | null;
  rooms: Room[];
  clients: Client[];
  onSave: (data: Partial<Reservation>) => void;
}

export const ReservationFormModal: React.FC<ReservationFormModalProps> = ({
  isOpen,
  onClose,
  initialData,
  rooms,
  clients,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<Reservation>>({
    client_id: undefined,
    room_id: undefined,
    date_arrivee: '',
    date_depart: '',
    montant_total: 0,
    statut: 'CONFIRMEE',
  });

  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      const room = rooms.find(r => r.id === initialData.room_id);
      setSelectedRoom(room || null);
      const client = clients.find(c => c.id === initialData.client_id);
      setSelectedClient(client || null);
    } else {
      setFormData({
        client_id: undefined,
        room_id: undefined,
        date_arrivee: '',
        date_depart: '',
        montant_total: 0,
        statut: 'CONFIRMEE',
      });
      setSelectedRoom(null);
      setSelectedClient(null);
    }
    setErrors({});
  }, [initialData, isOpen, rooms, clients]);

  const handleRoomChange = (roomId: number) => {
    const room = rooms.find(r => r.id === roomId);
    setSelectedRoom(room || null);
    setFormData({ ...formData, room_id: roomId });
    
    if (formData.date_arrivee && formData.date_depart && room?.prix_nuit) {
      const days = Math.ceil(
        (new Date(formData.date_depart).getTime() - new Date(formData.date_arrivee).getTime()) / 
        (1000 * 60 * 60 * 24)
      );
      if (days > 0) {
        setFormData(prev => ({
          ...prev,
          montant_total: days * (room.prix_nuit || 0)
        }));
      }
    }
  };

  const handleClientChange = (clientId: number) => {
    const client = clients.find(c => c.id === clientId);
    setSelectedClient(client || null);
    setFormData({ ...formData, client_id: clientId });
  };

  const handleDateChange = (field: 'date_arrivee' | 'date_depart', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'date_arrivee' || field === 'date_depart') {
      const arrivee = field === 'date_arrivee' ? value : formData.date_arrivee;
      const depart = field === 'date_depart' ? value : formData.date_depart;
      
      if (arrivee && depart && selectedRoom?.prix_nuit) {
        const days = Math.ceil(
          (new Date(depart).getTime() - new Date(arrivee).getTime()) / 
          (1000 * 60 * 60 * 24)
        );
        if (days > 0) {
          setFormData(prev => ({
            ...prev,
            montant_total: days * (selectedRoom.prix_nuit || 0)
          }));
        }
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.client_id) {
      newErrors.client_id = 'Veuillez sélectionner un client';
    }
    if (!formData.room_id) {
      newErrors.room_id = 'Veuillez sélectionner une chambre';
    }
    if (!formData.date_arrivee) {
      newErrors.date_arrivee = 'Veuillez sélectionner une date d\'arrivée';
    }
    if (!formData.date_depart) {
      newErrors.date_depart = 'Veuillez sélectionner une date de départ';
    }
    if (formData.date_arrivee && formData.date_depart) {
      const arrivee = new Date(formData.date_arrivee);
      const depart = new Date(formData.date_depart);
      if (depart <= arrivee) {
        newErrors.date_depart = 'La date de départ doit être après la date d\'arrivée';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getNightsCount = (): number => {
    if (formData.date_arrivee && formData.date_depart) {
      return Math.ceil(
        (new Date(formData.date_depart).getTime() - new Date(formData.date_arrivee).getTime()) / 
        (1000 * 60 * 60 * 24)
      );
    }
    return 0;
  };

  const nights = getNightsCount();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative mb-6">
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-gradient-to-br from-accent/10 to-transparent rounded-full blur-2xl" />
          <div className="flex items-center justify-between relative z-10">
            <div>
              <h3 className="text-2xl font-bold text-primary" style={{ fontFamily: 'Playfair Display, serif' }}>
                {initialData ? '✏️ Modifier la réservation' : ' Nouvelle réservation'}
              </h3>
              <p className="text-muted text-sm mt-1">
                {initialData 
                  ? 'Modifiez les détails de la réservation' 
                  : 'Créez une nouvelle réservation pour un client'}
              </p>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 rounded-xl hover:bg-surface-2 transition-all duration-300 hover:rotate-90"
            >
              <X size={22} className="text-muted" />
            </button>
          </div>
        </div>

        {/* Aperçu du client sélectionné */}
        {selectedClient && (
          <div className="mb-4 p-3.5 rounded-xl bg-gradient-to-r from-accent-4 to-accent-5 border border-accent/20">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-accent-600 flex items-center justify-center text-white font-bold text-base shadow-soft-sm">
                {selectedClient.prenom?.[0]}{selectedClient.nom[0]}
              </div>
              <div className="flex-1">
                <p className="text-primary font-semibold text-sm">
                  {selectedClient.prenom} {selectedClient.nom}
                </p>
                <div className="flex flex-wrap gap-2 text-xs text-muted">
                  {selectedClient.telephone && (
                    <span>📞 {selectedClient.telephone}</span>
                  )}
                  {selectedClient.email && (
                    <span>✉️ {selectedClient.email}</span>
                  )}
                  {selectedClient.is_casino_player && (
                    <span className="text-accent">🎰 Joueur Casino</span>
                  )}
                </div>
              </div>
              <button 
                onClick={() => {
                  setSelectedClient(null);
                  setFormData(prev => ({ ...prev, client_id: undefined }));
                }}
                className="text-muted hover:text-danger transition-colors p-1"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Aperçu de la chambre sélectionnée */}
        {selectedRoom && (
          <div className="mb-4 p-3.5 rounded-xl bg-gradient-to-r from-surface-2 to-surface-3 border border-base">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-4 to-accent-5 flex items-center justify-center">
                <DoorOpen size={18} className="text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-primary font-semibold text-sm">
                  Chambre {selectedRoom.numero}
                </p>
                <div className="flex flex-wrap gap-2 text-xs text-muted">
                  <span>{selectedRoom.room_type?.nom || 'Standard'}</span>
                  <span>• {selectedRoom.capacite} pers.</span>
                  <span>• {formatCurrency(selectedRoom.prix_nuit || 0)}/nuit</span>
                </div>
              </div>
              <button 
                onClick={() => {
                  setSelectedRoom(null);
                  setFormData(prev => ({ ...prev, room_id: undefined }));
                }}
                className="text-muted hover:text-danger transition-colors p-1"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-primary">
              <User size={14} className="inline mr-1.5" />
              Client *
            </label>
            <select
              value={formData.client_id || ''}
              onChange={(e) => handleClientChange(Number(e.target.value))}
              className={`input-field w-full text-sm py-2.5 px-3.5 rounded-lg ${errors.client_id ? 'border-danger focus:border-danger' : ''}`}
              required
              style={{ minHeight: '42px' }}
            >
              <option value=""> Sélectionner un client</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.prenom} {client.nom} {client.telephone ? `- ${client.telephone}` : ''}
                </option>
              ))}
            </select>
            {errors.client_id && (
              <p className="text-danger text-xs flex items-center gap-1">
                <AlertCircle size={11} /> {errors.client_id}
              </p>
            )}
          </div>

          {/* Chambre */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-primary">
              <DoorOpen size={14} className="inline mr-1.5" />
              Chambre *
            </label>
            <select
              value={formData.room_id || ''}
              onChange={(e) => handleRoomChange(Number(e.target.value))}
              className={`input-field w-full text-sm py-2.5 px-3.5 rounded-lg ${errors.room_id ? 'border-danger focus:border-danger' : ''}`}
              required
              style={{ minHeight: '42px' }}
            >
              <option value=""> Sélectionner une chambre</option>
              {rooms
                .filter(r => r.statut === 'LIBRE' || r.id === initialData?.room_id)
                .map(room => (
                  <option key={room.id} value={room.id}>
                    Chambre {room.numero} - {room.room_type?.nom || 'Standard'} - {formatCurrency(room.prix_nuit || 0)}/nuit
                    {room.statut === 'OCCUPEE' && ' (Occupée)'}
                  </option>
                ))}
            </select>
            {errors.room_id && (
              <p className="text-danger text-xs flex items-center gap-1">
                <AlertCircle size={11} /> {errors.room_id}
              </p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-primary">
                <Calendar size={14} className="inline mr-1.5" />
                Date d'arrivée *
              </label>
              <input
                type="date"
                value={formData.date_arrivee || ''}
                onChange={(e) => handleDateChange('date_arrivee', e.target.value)}
                className={`input-field w-full text-sm py-2.5 px-3.5 rounded-lg ${errors.date_arrivee ? 'border-danger focus:border-danger' : ''}`}
                required
                min={new Date().toISOString().split('T')[0]}
                style={{ minHeight: '42px' }}
              />
              {errors.date_arrivee && (
                <p className="text-danger text-xs flex items-center gap-1">
                  <AlertCircle size={11} /> {errors.date_arrivee}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-primary">
                <Calendar size={14} className="inline mr-1.5" />
                Date de départ *
              </label>
              <input
                type="date"
                value={formData.date_depart || ''}
                onChange={(e) => handleDateChange('date_depart', e.target.value)}
                className={`input-field w-full text-sm py-2.5 px-3.5 rounded-lg ${errors.date_depart ? 'border-danger focus:border-danger' : ''}`}
                required
                min={formData.date_arrivee || new Date().toISOString().split('T')[0]}
                style={{ minHeight: '42px' }}
              />
              {errors.date_depart && (
                <p className="text-danger text-xs flex items-center gap-1">
                  <AlertCircle size={11} /> {errors.date_depart}
                </p>
              )}
            </div>
          </div>

          {/* Résumé des nuits */}
          {nights > 0 && selectedRoom && (
            <div className="p-3.5 rounded-lg bg-surface-2 border border-base flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-accent-4 flex items-center justify-center">
                  <Clock size={15} className="text-accent" />
                </div>
                <div>
                  <p className="text-xs text-muted">Durée du séjour</p>
                  <p className="text-primary font-semibold text-sm">
                    {nights} nuit{nights > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted">Prix total</p>
                <p className="text-accent font-bold text-base">
                  {formatCurrency((selectedRoom.prix_nuit || 0) * nights)}
                </p>
              </div>
            </div>
          )}

          {/* Montant total */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-primary">
              <DollarSign size={14} className="inline mr-1.5" />
              Montant total (Ar)
            </label>
            <div className="relative">
              <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="number"
                value={formData.montant_total || 0}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  montant_total: Number(e.target.value) 
                })}
                className="input-field w-full text-sm py-2.5 pl-9 pr-3.5 rounded-lg"
                min="0"
                step="100"
                style={{ minHeight: '42px' }}
              />
            </div>
            {selectedRoom && nights > 0 && (
              <p className="text-xs text-muted">
                💡 Calculé automatiquement : {nights} nuit{nights > 1 ? 's' : ''} × {formatCurrency(selectedRoom.prix_nuit || 0)} = {formatCurrency((selectedRoom.prix_nuit || 0) * nights)}
              </p>
            )}
          </div>

      

          {/* Boutons - Version compacte */}
          <div className="flex gap-3 pt-3 border-t border-base">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-base text-primary font-medium text-sm hover:bg-surface-2 transition-all duration-300"
              disabled={isSubmitting}
              style={{ minHeight: '44px' }}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-lg btn-primary font-medium text-sm transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2"
              disabled={isSubmitting}
              style={{ minHeight: '44px' }}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <UserCheck size={16} />
                  {initialData ? 'Mettre à jour' : 'Créer'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};