import React, { useEffect, useState } from 'react';
import { DoorOpen, LogOut } from 'lucide-react';
import type { CasinoSharedProps } from '../shared-props';
import { fetchVisitsInRoom, checkOut } from '../../../services/casino.service';
import type { Visit } from '../types';

export const VisitsTab: React.FC<CasinoSharedProps> = ({ rooms, onNewVisit }) => {
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(rooms[0]?.id ?? null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async (roomId: number) => {
    setLoading(true);
    try {
      setVisits(await fetchVisitsInRoom(roomId));
    } catch {
      setVisits([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedRoomId) load(selectedRoomId);
  }, [selectedRoomId]);

  const handleCheckOut = async (visitId: number) => {
    try {
      await checkOut(visitId);
      if (selectedRoomId) load(selectedRoomId);
    } catch {
      // l'échec (déjà clôturée) rafraîchit simplement la liste
      if (selectedRoomId) load(selectedRoomId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h4 className="text-primary font-semibold text-sm">Visites en cours</h4>
        <button onClick={onNewVisit} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg text-black" style={{ backgroundColor: 'var(--color-accent)' }}>
          <DoorOpen size={14} /> Enregistrer une entrée
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto hide-scrollbar">
        {rooms.map((room) => (
          <button
            key={room.id}
            onClick={() => setSelectedRoomId(room.id)}
            className="px-3 py-1.5 rounded-xl text-xs whitespace-nowrap flex-shrink-0"
            style={{
              backgroundColor: selectedRoomId === room.id ? 'var(--color-accent)' : 'var(--color-surface-2)',
              color: selectedRoomId === room.id ? '#000' : undefined,
              border: '1px solid var(--color-border)',
            }}
          >
            {room.nom}
          </button>
        ))}
      </div>

      <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        {loading ? (
          <p className="text-muted text-xs">Chargement…</p>
        ) : visits.length === 0 ? (
          <p className="text-muted text-xs text-center py-6">Personne actuellement dans cette salle.</p>
        ) : (
          <div className="space-y-2">
            {visits.map((v) => (
              <div key={v.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="text-primary">{v.nom} {v.prenom || ''}</p>
                  <p className="text-muted text-xs">Entrée {v.entree_at} · {v.entree_via}</p>
                </div>
                <button
                  onClick={() => handleCheckOut(v.id)}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg text-muted hover:text-primary"
                  style={{ border: '1px solid var(--color-border)' }}
                >
                  <LogOut size={13} /> Sortie
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
