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
  UserCheck,
  Loader,
  Plus,
  UserPlus
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../../utils/data';
import { Modal } from '../../Modal';
import { useRooms } from '../../../hooks/useRooms';
import { useClients } from '../../../hooks/useClients';
import { useReservations } from '../../../hooks/useReservations';
import { clientService } from '../../../services/client.service';
import { toast } from 'react-hot-toast';

interface ReservationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: Reservation | null;
  onSuccess?: () => void;
}

export const ReservationFormModal: React.FC<ReservationFormModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSuccess,
}) => {
  // Récupération des données
  const { rooms, loading: roomsLoading, error: roomsError, loadRooms } = useRooms();
  const { clients, loading: clientsLoading, error: clientsError, loadClients } = useClients();
  const { createReservation, updateReservation } = useReservations();
  
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
  const [apiError, setApiError] = useState<string | null>(null);

  // États pour le formulaire de création rapide de client
  const [showClientModal, setShowClientModal] = useState(false);
  const [quickClientData, setQuickClientData] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    email: '',
  });
  const [quickClientErrors, setQuickClientErrors] = useState<Record<string, string>>({});
  const [isSubmittingClient, setIsSubmittingClient] = useState(false);

  // Charger les données au montage et quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      loadRooms();
      loadClients();
    }
  }, [isOpen, loadRooms, loadClients]);

  // Initialiser le formulaire avec les données de la réservation
  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        client_id: initialData.client_id,
        room_id: initialData.room_id,
        date_arrivee: initialData.date_arrivee?.split('T')[0] || '',
        date_depart: initialData.date_depart?.split('T')[0] || '',
        montant_total: initialData.montant_total || 0,
        statut: initialData.statut || 'CONFIRMEE',
      });
      
      const room = rooms.find(r => r.id === initialData.room_id);
      setSelectedRoom(room || null);
      
      const client = clients.find(c => c.id === initialData.client_id);
      setSelectedClient(client || null);
    } else if (isOpen && !initialData) {
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
    setApiError(null);
  }, [initialData, isOpen, rooms, clients]);

  const handleRoomChange = (roomId: number) => {
    const room = rooms.find(r => r.id === roomId);
    setSelectedRoom(room || null);
    setFormData({ ...formData, room_id: roomId });
    
    calculateTotal(room, formData.date_arrivee, formData.date_depart);
  };

  const handleClientChange = (clientId: number) => {
    const client = clients.find(c => c.id === clientId);
    setSelectedClient(client || null);
    setFormData({ ...formData, client_id: clientId });
  };

  const calculateTotal = (room: Room | null, arrivee?: string, depart?: string) => {
    if (arrivee && depart && room?.prix_nuit) {
      const days = Math.ceil(
        (new Date(depart).getTime() - new Date(arrivee).getTime()) / 
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

  const handleDateChange = (field: 'date_arrivee' | 'date_depart', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'date_arrivee' || field === 'date_depart') {
      const arrivee = field === 'date_arrivee' ? value : formData.date_arrivee;
      const depart = field === 'date_depart' ? value : formData.date_depart;
      calculateTotal(selectedRoom, arrivee, depart);
    }
  };

  // Validation du formulaire client rapide
  const validateQuickClient = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!quickClientData.nom?.trim()) {
      errors.nom = 'Le nom est requis';
    }
    if (quickClientData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(quickClientData.email)) {
      errors.email = 'Email invalide';
    }
    
    setQuickClientErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Création rapide d'un client
  const handleQuickClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateQuickClient()) {
      toast.error('Veuillez corriger les erreurs');
      return;
    }

    setIsSubmittingClient(true);

    try {
      const newClient = await clientService.createClient({
        nom: quickClientData.nom.trim(),
        prenom: quickClientData.prenom.trim() || undefined,
        telephone: quickClientData.telephone.trim() || undefined,
        email: quickClientData.email.trim() || undefined,
        statut: 'ACTIF',
        is_casino_player: false,
      });

      toast.success('Client créé avec succès');
      
      // Recharger la liste des clients
      await loadClients();
      
      // Sélectionner automatiquement le nouveau client
      setSelectedClient(newClient);
      setFormData(prev => ({ ...prev, client_id: newClient.id }));
      
      // Fermer le modal de création
      setShowClientModal(false);
      setQuickClientData({ nom: '', prenom: '', telephone: '', email: '' });
      setQuickClientErrors({});
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erreur lors de la création du client';
      toast.error(errorMessage);
      setQuickClientErrors({ general: errorMessage });
    } finally {
      setIsSubmittingClient(false);
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
    if (formData.montant_total !== undefined && formData.montant_total < 0) {
      newErrors.montant_total = 'Le montant ne peut pas être négatif';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs du formulaire');
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      const submitData = {
        client_id: formData.client_id!,
        room_id: formData.room_id!,
        date_arrivee: formData.date_arrivee!,
        date_depart: formData.date_depart!,
        montant_total: formData.montant_total || 0,
        statut: formData.statut || 'CONFIRMEE',
      };

      if (initialData) {
        await updateReservation(initialData.id, submitData);
        toast.success('Réservation mise à jour avec succès');
      } else {
        await createReservation(submitData);
        toast.success('Réservation créée avec succès');
      }

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erreur lors de la sauvegarde';
      setApiError(errorMessage);
      toast.error(errorMessage);
      console.error('❌ Erreur:', error);
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

  // Affichage du chargement
  if (roomsLoading || clientsLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <div className="p-6 flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <Loader size={40} className="animate-spin text-accent mx-auto mb-4" />
            <p className="text-muted">Chargement des données...</p>
            <p className="text-muted text-sm">Clients et chambres</p>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <>
      {/* Modal principal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <div className="p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="relative mb-6">
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-gradient-to-br from-accent/10 to-transparent rounded-full blur-2xl" />
            <div className="flex items-center justify-between relative z-10">
              <div>
                <h3 className="text-2xl font-bold text-primary" style={{ fontFamily: 'Playfair Display, serif' }}>
                  {initialData ? '✏️ Modifier la réservation' : '📅 Nouvelle réservation'}
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
                disabled={isSubmitting}
              >
                <X size={22} className="text-muted" />
              </button>
            </div>
          </div>

          {/* Erreur API */}
          {apiError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{apiError}</span>
            </div>
          )}

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
                  disabled={isSubmitting}
                >
                  <X size={15} />
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Client avec bouton Ajouter */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-primary">
                  <User size={14} className="inline mr-1.5" />
                  Client *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowClientModal(true);
                    setQuickClientData({ nom: '', prenom: '', telephone: '', email: '' });
                    setQuickClientErrors({});
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 text-accent hover:bg-accent/20 rounded-lg text-xs font-medium transition-all"
                >
                  <UserPlus size={14} />
                  Nouveau client
                </button>
              </div>
              <div className="flex gap-2">
                <select
                  value={formData.client_id || ''}
                  onChange={(e) => handleClientChange(Number(e.target.value))}
                  className={`input-field flex-1 w-full text-sm py-2.5 px-3.5 rounded-lg ${
                    errors.client_id ? 'border-red-500 focus:border-red-500' : ''
                  }`}
                  required
                  disabled={isSubmitting}
                  style={{ minHeight: '42px' }}
                >
                  <option value="">Sélectionner un client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.prenom} {client.nom} {client.telephone ? `- ${client.telephone}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              {errors.client_id && (
                <p className="text-red-400 text-xs flex items-center gap-1">
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
                className={`input-field w-full text-sm py-2.5 px-3.5 rounded-lg ${
                  errors.room_id ? 'border-red-500 focus:border-red-500' : ''
                }`}
                required
                disabled={isSubmitting}
                style={{ minHeight: '42px' }}
              >
                <option value="">Sélectionner une chambre</option>
                {rooms
                  .filter(r => r.statut === 'LIBRE' || r.id === initialData?.room_id)
                  .map(room => (
                    <option key={room.id} value={room.id}>
                      Chambre {room.numero} - {room.room_type?.nom || 'Standard'} - {formatCurrency(room.prix_nuit || 0)}/nuit
                      {room.statut === 'OCCUPEE' && ' (Occupée)'}
                      {room.statut === 'RESERVEE' && ' (Réservée)'}
                    </option>
                  ))}
              </select>
              {errors.room_id && (
                <p className="text-red-400 text-xs flex items-center gap-1">
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
                  className={`input-field w-full text-sm py-2.5 px-3.5 rounded-lg ${
                    errors.date_arrivee ? 'border-red-500 focus:border-red-500' : ''
                  }`}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  disabled={isSubmitting}
                  style={{ minHeight: '42px' }}
                />
                {errors.date_arrivee && (
                  <p className="text-red-400 text-xs flex items-center gap-1">
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
                  className={`input-field w-full text-sm py-2.5 px-3.5 rounded-lg ${
                    errors.date_depart ? 'border-red-500 focus:border-red-500' : ''
                  }`}
                  required
                  min={formData.date_arrivee || new Date().toISOString().split('T')[0]}
                  disabled={isSubmitting}
                  style={{ minHeight: '42px' }}
                />
                {errors.date_depart && (
                  <p className="text-red-400 text-xs flex items-center gap-1">
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
                  className={`input-field w-full text-sm py-2.5 pl-9 pr-3.5 rounded-lg ${
                    errors.montant_total ? 'border-red-500 focus:border-red-500' : ''
                  }`}
                  min="0"
                  step="100"
                  disabled={isSubmitting}
                  style={{ minHeight: '42px' }}
                />
              </div>
              {selectedRoom && nights > 0 && (
                <p className="text-xs text-muted">
                  💡 Calculé automatiquement : {nights} nuit{nights > 1 ? 's' : ''} × {formatCurrency(selectedRoom.prix_nuit || 0)} = {formatCurrency((selectedRoom.prix_nuit || 0) * nights)}
                </p>
              )}
              {errors.montant_total && (
                <p className="text-red-400 text-xs flex items-center gap-1">
                  <AlertCircle size={11} /> {errors.montant_total}
                </p>
              )}
            </div>

            {/* Statut */}
            {initialData && (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-primary">
                  <CheckCircle size={14} className="inline mr-1.5" />
                  Statut
                </label>
                <select
                  value={formData.statut || 'CONFIRMEE'}
                  onChange={(e) => setFormData({ ...formData, statut: e.target.value as any })}
                  className="input-field w-full text-sm py-2.5 px-3.5 rounded-lg"
                  disabled={isSubmitting}
                  style={{ minHeight: '42px' }}
                >
                  <option value="CONFIRMEE">Confirmée</option>
                  <option value="EN_COURS">En cours</option>
                  <option value="TERMINEE">Terminée</option>
                  <option value="ANNULEE">Annulée</option>
                </select>
              </div>
            )}

            {/* Boutons */}
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
                className="flex-1 px-4 py-2.5 rounded-lg bg-accent text-black font-medium text-sm transition-all duration-300 hover:bg-accent-2 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
                style={{ minHeight: '44px' }}
              >
                {isSubmitting ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <UserCheck size={16} />
                    {initialData ? 'Mettre à jour' : 'Créer la réservation'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal de création rapide de client */}
      {showClientModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl border border-gray-700 animate-scaleIn">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                  <UserPlus size={20} className="text-accent" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Nouveau client</h3>
                  <p className="text-sm text-gray-400">Création rapide</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowClientModal(false);
                  setQuickClientData({ nom: '', prenom: '', telephone: '', email: '' });
                  setQuickClientErrors({});
                }}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleQuickClientSubmit} className="p-6 space-y-4">
              {/* Erreur générale */}
              {quickClientErrors.general && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{quickClientErrors.general}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Nom <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={quickClientData.nom}
                  onChange={(e) => setQuickClientData({ ...quickClientData, nom: e.target.value })}
                  className={`
                    w-full px-4 py-2.5 bg-gray-800 border-2 rounded-xl 
                    text-white placeholder-gray-500
                    focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/20
                    transition-all duration-200
                    ${quickClientErrors.nom ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-700'}
                  `}
                  placeholder="Dupont"
                  disabled={isSubmittingClient}
                  autoFocus
                />
                {quickClientErrors.nom && (
                  <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {quickClientErrors.nom}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Prénom</label>
                <input
                  type="text"
                  value={quickClientData.prenom}
                  onChange={(e) => setQuickClientData({ ...quickClientData, prenom: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-800 border-2 border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/20 transition-all duration-200"
                  placeholder="Jean"
                  disabled={isSubmittingClient}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Téléphone</label>
                <input
                  type="tel"
                  value={quickClientData.telephone}
                  onChange={(e) => setQuickClientData({ ...quickClientData, telephone: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-800 border-2 border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/20 transition-all duration-200"
                  placeholder="+33 6 12 34 56 78"
                  disabled={isSubmittingClient}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
                <input
                  type="email"
                  value={quickClientData.email}
                  onChange={(e) => setQuickClientData({ ...quickClientData, email: e.target.value })}
                  className={`
                    w-full px-4 py-2.5 bg-gray-800 border-2 rounded-xl 
                    text-white placeholder-gray-500
                    focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/20
                    transition-all duration-200
                    ${quickClientErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-700'}
                  `}
                  placeholder="jean.dupont@email.com"
                  disabled={isSubmittingClient}
                />
                {quickClientErrors.email && (
                  <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {quickClientErrors.email}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowClientModal(false);
                    setQuickClientData({ nom: '', prenom: '', telephone: '', email: '' });
                    setQuickClientErrors({});
                  }}
                  className="px-5 py-2.5 bg-gray-800 text-gray-300 font-medium rounded-xl hover:bg-gray-700 transition-all"
                  disabled={isSubmittingClient}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-accent text-white font-medium rounded-xl hover:bg-accent-2 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent/25"
                  disabled={isSubmittingClient}
                >
                  {isSubmittingClient ? (
                    <>
                      <Loader size={18} className="animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <UserPlus size={18} />
                      Créer le client
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scaleIn {
          from { 
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to { 
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-scaleIn {
          animation: scaleIn 0.25s ease-out;
        }
      `}</style>
    </>
  );
};  