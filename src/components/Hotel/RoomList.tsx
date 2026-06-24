// hotel/RoomList.tsx
import React, { useState } from 'react';
import { Room } from '../../types/hotel.types';
import { DoorOpen, Edit, MoreVertical, Check, X, Wrench, Brush } from 'lucide-react';
import { formatCurrency } from '../../utils/data';
import { RoomStatusModal } from './Modal/RoomStatusModal';


interface RoomListProps {
  rooms: Room[];
  onEdit: (room: Room) => void;
  onStatusChange: (roomId: number, newStatus: string) => void;
}

const statusColors: Record<string, string> = {
  LIBRE: 'bg-success/10 text-success border-success/20',
  OCCUPEE: 'bg-accent/10 text-accent border-accent/20',
  RESERVEE: 'bg-warning/10 text-warning border-warning/20',
  NETTOYAGE: 'bg-info/10 text-info border-info/20',
  MAINTENANCE: 'bg-danger/10 text-danger border-danger/20',
  HORS_SERVICE: 'bg-muted/10 text-muted border-muted/20',
};

export const RoomList: React.FC<RoomListProps> = ({ rooms, onEdit, onStatusChange }) => {
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-primary font-semibold">Liste des chambres</h3>
        <span className="text-muted text-sm">{rooms.length} chambres</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map(room => (
          <div key={room.id} className="card card-gold-hover p-5">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-primary font-semibold text-lg">
                  Chambre {room.numero}
                </h4>
                <p className="text-muted text-sm">
                  {room.room_type?.nom || 'Type non défini'}
                  {room.capacite && ` • ${room.capacite} pers.`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[room.statut] || ''}`}>
                  {room.statut}
                </span>
                <button
                  onClick={() => {
                    setSelectedRoom(room);
                    setIsStatusModalOpen(true);
                  }}
                  className="p-1.5 rounded-lg hover:bg-surface-2 transition-colors"
                >
                  <Edit size={16} className="text-muted" />
                </button>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-base">
              <div className="flex items-center justify-between">
                <span className="text-accent font-bold text-lg">
                  {formatCurrency(room.prix_nuit || 0)}
                  <span className="text-muted text-sm font-normal ml-1">/nuit</span>
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => onStatusChange(room.id, 'NETTOYAGE')}
                    className="p-2 rounded-lg hover:bg-surface-2 transition-colors"
                    title="Ménage"
                  >
                    <Brush size={16} className="text-muted" />
                  </button>
                  <button 
                    onClick={() => onStatusChange(room.id, 'MAINTENANCE')}
                    className="p-2 rounded-lg hover:bg-surface-2 transition-colors"
                    title="Maintenance"
                  >
                    <Wrench size={16} className="text-muted" />
                  </button>
                  <button 
                    onClick={() => onEdit(room)}
                    className="p-2 rounded-lg hover:bg-surface-2 transition-colors"
                    title="Modifier"
                  >
                    <Edit size={16} className="text-muted" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Status Modal */}
      {selectedRoom && (
        <RoomStatusModal
          isOpen={isStatusModalOpen}
          onClose={() => {
            setIsStatusModalOpen(false);
            setSelectedRoom(null);
          }}
          room={selectedRoom}
          onStatusChange={(newStatus) => {
            onStatusChange(selectedRoom.id, newStatus);
            setIsStatusModalOpen(false);
          }}
        />
      )}
    </div>
  );
};