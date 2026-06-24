// hotel/EquipmentManager.tsx
import React, { useState } from 'react';
import { Equipment, RoomEquipment, Room } from '../../types/hotel.types';
import { Plus, Edit, Trash2, Check, X, Wrench } from 'lucide-react';
import { AssignEquipmentModal } from './Modal/AssignEquipmentModal';


interface EquipmentManagerProps {
  equipments: Equipment[];
  roomEquipments: RoomEquipment[];
  rooms: Room[];
}

export const EquipmentManager: React.FC<EquipmentManagerProps> = ({
  equipments,
  roomEquipments,
  rooms,
}) => {
  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-primary font-semibold">Gestion des équipements</h3>
        <button
          onClick={() => setIsEquipmentModalOpen(true)}
          className="btn-primary px-4 py-2.5 rounded-xl flex items-center gap-2"
        >
          <Plus size={18} />
          Nouvel équipement
        </button>
      </div>

      {/* Liste des équipements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {equipments.map(eq => {
          const assignedCount = roomEquipments.filter(re => re.equipment_id === eq.id).length;
          
          return (
            <div key={eq.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-primary font-semibold">{eq.nom}</h4>
                  <p className="text-muted text-sm">
                    {eq.categorie || 'Non catégorisé'}
                    {eq.code && ` • Code: ${eq.code}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedEquipment(eq);
                      setIsAssignModalOpen(true);
                    }}
                    className="p-2 rounded-lg hover:bg-surface-2 transition-colors"
                    title="Assigner à une chambre"
                  >
                    <Plus size={16} className="text-muted" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedEquipment(eq);
                      setIsEquipmentModalOpen(true);
                    }}
                    className="p-2 rounded-lg hover:bg-surface-2 transition-colors"
                    title="Modifier"
                  >
                    <Edit size={16} className="text-muted" />
                  </button>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-base">
                <p className="text-xs text-muted">
                  Assigné à {assignedCount} chambre{assignedCount > 1 ? 's' : ''}
                </p>
                {assignedCount > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {roomEquipments
                      .filter(re => re.equipment_id === eq.id)
                      .slice(0, 3)
                      .map(re => {
                        const room = rooms.find(r => r.id === re.room_id);
                        return (
                          <span key={re.id} className="badge text-xs">
                            {room?.numero || `#${re.room_id}`}
                          </span>
                        );
                      })}
                    {assignedCount > 3 && (
                      <span className="badge text-xs">+{assignedCount - 3}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
   

      <AssignEquipmentModal
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          setSelectedEquipment(null);
        }}
        equipment={selectedEquipment}
        rooms={rooms}
        onAssign={(roomId, quantity) => {
          // Assigner l'équipement à une chambre
          setIsAssignModalOpen(false);
          setSelectedEquipment(null);
        }}
      />
    </div>
  );
};