// components/Hotel/HousekeepingManager.tsx
import React from 'react';
import { HousekeepingTask, Room } from '../../types/hotel.types';
import { formatDate } from '../../utils/data';
import { Brush, Check, Clock, User } from 'lucide-react';

interface HousekeepingManagerProps {
  tasks: HousekeepingTask[];
  rooms: Room[];
}

export const HousekeepingManager: React.FC<HousekeepingManagerProps> = ({
  tasks,
  rooms,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-primary font-semibold">Gestion du ménage</h3>
        <button className="btn-primary px-4 py-2.5 rounded-xl flex items-center gap-2">
          <Brush size={18} />
          Planifier
        </button>
      </div>

      <div className="space-y-3">
        {tasks.map(task => {
          const room = rooms.find(r => r.id === task.room_id);
          
          return (
            <div key={task.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      task.statut === 'TERMINE' ? 'badge-success' :
                      task.statut === 'EN_COURS' ? 'badge-warning' :
                      'badge-info'
                    }`}>
                      {task.statut}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium badge-info">
                      {task.type_tache}
                    </span>
                  </div>
                  <h4 className="text-primary font-semibold">
                    Chambre {room?.numero || 'N/A'}
                  </h4>
                  {task.commentaire && (
                    <p className="text-muted text-sm mt-1">{task.commentaire}</p>
                  )}
                  <div className="flex gap-4 mt-2 text-xs text-muted">
                    {task.planned_at && <span>📅 Planifié: {formatDate(task.planned_at)}</span>}
                    {task.completed_at && <span>✅ Terminé: {formatDate(task.completed_at)}</span>}
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