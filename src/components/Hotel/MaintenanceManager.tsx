// components/Hotel/MaintenanceManager.tsx
import React, { useState } from 'react';
import { RoomMaintenance, Equipment, Room } from '../../types/hotel.types';
import { formatDate } from '../../utils/data';
import { Wrench, Plus, Check, Clock, AlertTriangle } from 'lucide-react';

interface MaintenanceManagerProps {
  tasks: RoomMaintenance[];
  equipments: Equipment[];
  rooms: Room[];
}

export const MaintenanceManager: React.FC<MaintenanceManagerProps> = ({
  tasks,
  equipments,
  rooms,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-primary font-semibold">Gestion des maintenances</h3>
        <button className="btn-primary px-4 py-2.5 rounded-xl flex items-center gap-2">
          <Plus size={18} />
          Nouvelle intervention
        </button>
      </div>

      <div className="space-y-3">
        {tasks.map(task => {
          const room = rooms.find(r => r.id === task.room_id);
          const equipment = task.equipment_id ? equipments.find(e => e.id === task.equipment_id) : null;
          
          return (
            <div key={task.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      task.statut === 'TERMINE' ? 'badge-success' :
                      task.statut === 'EN_COURS' ? 'badge-warning' :
                      'badge-danger'
                    }`}>
                      {task.statut}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      task.type_intervention === 'URGENCE' ? 'badge-danger' :
                      task.type_intervention === 'PREVENTIVE' ? 'badge-info' :
                      'badge-warning'
                    }`}>
                      {task.type_intervention}
                    </span>
                  </div>
                  <h4 className="text-primary font-semibold">
                    Chambre {room?.numero || 'N/A'}
                    {equipment && ` - ${equipment.nom}`}
                  </h4>
                  <p className="text-muted text-sm mt-1">{task.description}</p>
                  <div className="flex gap-4 mt-2 text-xs text-muted">
                    <span>📅 {formatDate(task.date_declaration)}</span>
                    {task.cout > 0 && <span>💰 {task.cout} Ar</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 rounded-lg hover:bg-surface-2 transition-colors">
                    <Check size={16} className="text-success" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};