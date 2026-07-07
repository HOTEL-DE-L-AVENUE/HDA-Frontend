import React from 'react';
import { Plus, DoorOpen } from 'lucide-react';
import type { CasinoSharedProps } from '../shared-props';

const statutColor = (statut: string) => {
  if (statut === 'OUVERTE') return 'var(--color-accent)';
  if (statut === 'MAINTENANCE' || statut === 'EN_TRAVAUX') return '#f59e0b';
  return 'var(--color-danger)';
};

export const RoomsTab: React.FC<CasinoSharedProps> = ({
  rooms,
  cashiers,
  searchQuery,
  filterStatus,
  onNewRoom,
  onNewCashier,
  onNewVisit,
}) => {
  const filteredRooms = rooms.filter((r) => {
    const matchesSearch = !searchQuery || r.nom.toLowerCase().includes(searchQuery.toLowerCase()) || r.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !filterStatus || r.statut === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-primary font-semibold text-sm">Salles</h4>
        <div className="flex gap-2">
          <button
            onClick={onNewVisit}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg text-muted hover:text-primary"
            style={{ border: '1px solid var(--color-border)' }}
          >
            <DoorOpen size={14} /> Check-in
          </button>
          <button
            onClick={onNewCashier}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg text-muted hover:text-primary"
            style={{ border: '1px solid var(--color-border)' }}
          >
            <Plus size={14} /> Caisse
          </button>
          <button
            onClick={onNewRoom}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg text-black"
            style={{ backgroundColor: 'var(--color-accent)' }}
          >
            <Plus size={14} /> Salle
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredRooms.map((room) => {
          const roomCashiers = cashiers.filter((c) => c.room_id === room.id);
          return (
            <div key={room.id} className="rounded-2xl p-4" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-primary font-semibold text-sm">{room.nom}</p>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: statutColor(room.statut), color: '#000' }}
                >
                  {room.statut}
                </span>
              </div>
              <p className="text-muted text-xs mb-3">{room.code} · {room.type_salle}</p>
              <p className="text-muted text-xs mb-1">Caisses ({roomCashiers.length})</p>
              <div className="space-y-1">
                {roomCashiers.length === 0 && <p className="text-muted text-xs">Aucune caisse rattachée.</p>}
                {roomCashiers.map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-xs">
                    <span className="text-primary">{c.nom} ({c.code})</span>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: statutColor(c.statut), color: '#000' }}
                    >
                      {c.statut}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {filteredRooms.length === 0 && (
          <p className="text-muted text-xs col-span-full text-center py-8">Aucune salle ne correspond à la recherche.</p>
        )}
      </div>
    </div>
  );
};
