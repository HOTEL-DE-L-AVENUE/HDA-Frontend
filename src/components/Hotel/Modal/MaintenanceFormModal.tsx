// components/Hotel/Modal/MaintenanceFormModal.tsx
import React, { useState, useEffect } from 'react';
import { RoomMaintenance, Room, Equipment } from '../../../types/hotel.types';
import { X, Loader, AlertCircle } from 'lucide-react';
import { Modal } from '../../Modal';

interface MaintenanceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: RoomMaintenance | null;
  rooms: Room[];
  equipments: Equipment[];
  onSave: (data: any) => void;
}

export const MaintenanceFormModal: React.FC<MaintenanceFormModalProps> = ({
  isOpen,
  onClose,
  initialData,
  rooms,
  equipments,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    room_id: 0,
    equipment_id: null as number | null,
    type_intervention: 'CORRECTIVE' as 'PREVENTIVE' | 'CORRECTIVE' | 'URGENCE',
    description: '',
    statut: 'OUVERT' as 'OUVERT' | 'EN_COURS' | 'TERMINE' | 'ANNULE',
    cout: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        room_id: initialData.room_id,
        equipment_id: initialData.equipment_id || null,
        type_intervention: initialData.type_intervention,
        description: initialData.description || '',
        statut: initialData.statut,
        cout: initialData.cout || 0,
      });
    } else {
      setFormData({
        room_id: 0,
        equipment_id: null,
        type_intervention: 'CORRECTIVE',
        description: '',
        statut: 'OUVERT',
        cout: 0,
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
            {initialData ? '✏️ Modifier la maintenance' : '➕ Nouvelle maintenance'}
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

          {/* Équipement */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Équipement</label>
            <select
              value={formData.equipment_id || ''}
              onChange={(e) => setFormData({ ...formData, equipment_id: e.target.value ? Number(e.target.value) : null })}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
              disabled={isSubmitting}
            >
              <option value="">Aucun équipement</option>
              {equipments.map(eq => (
                <option key={eq.id} value={eq.id}>
                  {eq.nom} {eq.code ? `(${eq.code})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Type d'intervention */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Type d'intervention <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.type_intervention}
              onChange={(e) => setFormData({ ...formData, type_intervention: e.target.value as any })}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
              disabled={isSubmitting}
            >
              <option value="PREVENTIVE">🛠️ Préventive</option>
              <option value="CORRECTIVE">🔧 Corrective</option>
              <option value="URGENCE">🚨 Urgence</option>
            </select>
          </div>

          {/* Statut */}
          {initialData && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Statut</label>
              <select
                value={formData.statut}
                onChange={(e) => setFormData({ ...formData, statut: e.target.value as any })}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
                disabled={isSubmitting}
              >
                <option value="OUVERT">🔴 Ouvert</option>
                <option value="EN_COURS">🟡 En cours</option>
                <option value="TERMINE">✅ Terminé</option>
                <option value="ANNULE">⛔ Annulé</option>
              </select>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent resize-none"
              rows={3}
              placeholder="Décrivez l'intervention..."
              disabled={isSubmitting}
            />
          </div>

          {/* Coût */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Coût (Ar)</label>
            <input
              type="number"
              value={formData.cout}
              onChange={(e) => setFormData({ ...formData, cout: Number(e.target.value) })}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent"
              min="0"
              step="100"
              placeholder="0"
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