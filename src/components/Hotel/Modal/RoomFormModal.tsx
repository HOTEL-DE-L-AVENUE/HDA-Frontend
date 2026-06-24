// hotel/modals/RoomFormModal.tsx
import React, { useState, useEffect } from 'react';
import { Room, RoomType } from '../../../types/hotel.types';
import { 
  X, 
  DoorOpen, 
  Users, 
  DollarSign, 
  Home,
  Bed,
  AlertCircle,
  CheckCircle,
  Clock,
  Wrench,
  Brush,
  Ban
} from 'lucide-react';
import { Modal } from '../../Modal';
import { formatCurrency } from '../../../utils/data';

interface RoomFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: Room | null;
  onSave: (data: Partial<Room>) => void;
}

const roomTypes: RoomType[] = [
  { id: 1, nom: 'Standard', description: 'Chambre standard confortable' },
  { id: 2, nom: 'Deluxe', description: 'Chambre deluxe avec vue' },
  { id: 3, nom: 'Suite', description: 'Suite spacieuse' },
  { id: 4, nom: 'VIP', description: 'Suite présidentielle' },
];

const statusOptions = [
  { value: 'LIBRE', label: 'Libre', icon: CheckCircle, color: 'success' },
  { value: 'OCCUPEE', label: 'Occupée', icon: Users, color: 'accent' },
  { value: 'RESERVEE', label: 'Réservée', icon: Clock, color: 'warning' },
  { value: 'NETTOYAGE', label: 'En nettoyage', icon: Brush, color: 'info' },
  { value: 'MAINTENANCE', label: 'En maintenance', icon: Wrench, color: 'danger' },
  { value: 'HORS_SERVICE', label: 'Hors service', icon: Ban, color: 'muted' },
];

export const RoomFormModal: React.FC<RoomFormModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<Room>>({
    numero: '',
    room_type_id: undefined,
    capacite: 1,
    prix_nuit: 0,
    statut: 'LIBRE',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        numero: '',
        room_type_id: undefined,
        capacite: 1,
        prix_nuit: 0,
        statut: 'LIBRE',
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.numero || formData.numero.trim() === '') {
      newErrors.numero = 'Veuillez saisir un numéro de chambre';
    }
    if (formData.prix_nuit !== undefined && formData.prix_nuit < 0) {
      newErrors.prix_nuit = 'Le prix ne peut pas être négatif';
    }
    if (formData.capacite !== undefined && formData.capacite < 1) {
      newErrors.capacite = 'La capacité doit être au moins 1';
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="p-6 max-w-lg w-full">
        {/* Header */}
        <div className="relative mb-6">
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-gradient-to-br from-accent/10 to-transparent rounded-full blur-2xl" />
          <div className="flex items-center justify-between relative z-10">
            <div>
              <h3 className="text-2xl font-bold text-primary" style={{ fontFamily: 'Playfair Display, serif' }}>
                {initialData ? '✏️ Modifier la chambre' : '🆕 Nouvelle chambre'}
              </h3>
              <p className="text-muted text-sm mt-1">
                {initialData 
                  ? 'Modifiez les détails de la chambre' 
                  : 'Créez une nouvelle chambre'}
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Numéro */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-primary">
              <DoorOpen size={14} className="inline mr-1.5" />
              Numéro de chambre *
            </label>
            <div className="relative">
              <DoorOpen size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={formData.numero || ''}
                onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                className={`input-field w-full text-sm py-2.5 pl-9 pr-3.5 rounded-lg ${errors.numero ? 'border-danger focus:border-danger' : ''}`}
                placeholder="Ex: 101, 205..."
                style={{ minHeight: '42px' }}
                required
              />
            </div>
            {errors.numero && (
              <p className="text-danger text-xs flex items-center gap-1">
                <AlertCircle size={11} /> {errors.numero}
              </p>
            )}
          </div>

          {/* Type de chambre */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-primary">
              <Bed size={14} className="inline mr-1.5" />
              Type de chambre
            </label>
            <div className="relative">
              <Bed size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <select
                value={formData.room_type_id || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  room_type_id: e.target.value ? Number(e.target.value) : undefined 
                })}
                className="input-field w-full text-sm py-2.5 pl-9 pr-3.5 rounded-lg"
                style={{ minHeight: '42px' }}
              >
                <option value="">Sélectionner un type</option>
                {roomTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Capacité */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-primary">
              <Users size={14} className="inline mr-1.5" />
              Capacité (personnes)
            </label>
            <div className="relative">
              <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="number"
                value={formData.capacite || 1}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  capacite: Number(e.target.value) 
                })}
                className={`input-field w-full text-sm py-2.5 pl-9 pr-3.5 rounded-lg ${errors.capacite ? 'border-danger focus:border-danger' : ''}`}
                min="1"
                max="10"
                style={{ minHeight: '42px' }}
              />
            </div>
            {errors.capacite && (
              <p className="text-danger text-xs flex items-center gap-1">
                <AlertCircle size={11} /> {errors.capacite}
              </p>
            )}
          </div>

          {/* Prix */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-primary">
              <DollarSign size={14} className="inline mr-1.5" />
              Prix par nuit (Ar)
            </label>
            <div className="relative">
              <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="number"
                value={formData.prix_nuit || 0}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  prix_nuit: Number(e.target.value) 
                })}
                className={`input-field w-full text-sm py-2.5 pl-9 pr-3.5 rounded-lg ${errors.prix_nuit ? 'border-danger focus:border-danger' : ''}`}
                min="0"
                step="1000"
                style={{ minHeight: '42px' }}
              />
            </div>
            {errors.prix_nuit && (
              <p className="text-danger text-xs flex items-center gap-1">
                <AlertCircle size={11} /> {errors.prix_nuit}
              </p>
            )}
          </div>

          {/* Statut - Version compacte avec icônes */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-primary">
              <Home size={14} className="inline mr-1.5" />
              Statut
            </label>
            <div className="grid grid-cols-3 gap-2">
              {statusOptions.map((status) => {
                const Icon = status.icon;
                const isSelected = formData.statut === status.value;
                return (
                  <button
                    key={status.value}
                    type="button"
                    onClick={() => setFormData({ 
                      ...formData, 
                      statut: status.value as Room['statut']
                    })}
                    className={`p-2.5 rounded-lg border-2 transition-all text-center ${
                      isSelected
                        ? `border-${status.color} bg-${status.color}/10`
                        : 'border-base hover:border-accent/30'
                    }`}
                    style={{ minHeight: '48px' }}
                  >
                    <Icon size={15} className={`mx-auto mb-0.5 text-${status.color}`} />
                    <span className={`text-[11px] font-medium ${isSelected ? `text-${status.color}` : 'text-muted'}`}>
                      {status.label}
                    </span>
                  </button>
                );
              })}
            </div>
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
                  <Home size={16} />
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