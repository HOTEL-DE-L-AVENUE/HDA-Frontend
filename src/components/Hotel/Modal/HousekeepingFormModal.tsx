// components/Hotel/Modal/HousekeepingFormModal.tsx
import React, { useState, useEffect } from 'react';
import { HousekeepingTask, Room } from '../../../types/hotel.types';
import { X, Loader, AlertCircle } from 'lucide-react';
import { Modal } from '../../Modal';

interface HousekeepingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: HousekeepingTask | null;
  rooms: Room[];
  onSave: (data: any) => void;
}

export const HousekeepingFormModal: React.FC<HousekeepingFormModalProps> = ({
  isOpen,
  onClose,
  initialData,
  rooms,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    room_id: 0,
    type_tache: 'NETTOYAGE' as 'NETTOYAGE' | 'DESINFECTION' | 'CHANGEMENT_DRAPS' | 'CONTROLE',
    statut: 'A_FAIRE' as 'A_FAIRE' | 'EN_COURS' | 'TERMINE',
    commentaire: '',
    planned_at: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        room_id: initialData.room_id,
        type_tache: initialData.type_tache,
        statut: initialData.statut,
        commentaire: initialData.commentaire || '',
        planned_at: initialData.planned_at?.split('T')[0] || '',
      });
    } else {
      setFormData({
        room_id: 0,
        type_tache: 'NETTOYAGE',
        statut: 'A_FAIRE',
        commentaire: '',
        planned_at: new Date().toISOString().split('T')[0],
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.room_id) {
      newErrors.room_id = 'Veuillez sélectionner une chambre';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white font-bold text-lg">
            {initialData ? '✏️ Modifier la tâche' : '➕ Nouvelle tâche de ménage'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-300 transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Chambre */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Chambre <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.room_id}
              onChange={(e) => setFormData({ ...formData, room_id: Number(e.target.value) })}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
              disabled={isSubmitting}
            >
              <option value={0}>Sélectionner une chambre</option>
              {rooms.map(room => (
                <option key={room.id} value={room.id}>
                  Chambre {room.numero} - {room.room_type?.nom || 'Standard'}
                </option>
              ))}
            </select>
            {errors.room_id && (
              <p className="text-red-400 text-xs mt-1">{errors.room_id}</p>
            )}
          </div>

          {/* Type de tâche */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Type de tâche <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.type_tache}
              onChange={(e) => setFormData({ ...formData, type_tache: e.target.value as any })}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
              disabled={isSubmitting}
            >
              <option value="NETTOYAGE">🧹 Nettoyage</option>
              <option value="DESINFECTION">🧪 Désinfection</option>
              <option value="CHANGEMENT_DRAPS">🛏️ Changement draps</option>
              <option value="CONTROLE">🔍 Contrôle</option>
            </select>
          </div>

          {/* Statut (visible uniquement en modification) */}
          {initialData && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Statut</label>
              <select
                value={formData.statut}
                onChange={(e) => setFormData({ ...formData, statut: e.target.value as any })}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
                disabled={isSubmitting}
              >
                <option value="A_FAIRE">📋 À faire</option>
                <option value="EN_COURS">🔄 En cours</option>
                <option value="TERMINE">✅ Terminé</option>
              </select>
            </div>
          )}

          {/* Date planifiée */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Date planifiée
            </label>
            <input
              type="date"
              value={formData.planned_at}
              onChange={(e) => setFormData({ ...formData, planned_at: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
              disabled={isSubmitting}
            />
          </div>

          {/* Commentaire */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Commentaire</label>
            <textarea
              value={formData.commentaire}
              onChange={(e) => setFormData({ ...formData, commentaire: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent resize-none"
              rows={3}
              placeholder="Informations supplémentaires..."
              disabled={isSubmitting}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 transition text-sm"
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-accent text-black rounded-lg hover:bg-accent-2 transition text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                initialData ? 'Modifier' : 'Créer'
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};