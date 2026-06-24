import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Badge, Button, DataTable } from '../../../components/UI';
import { Room, RoomMaintenance } from '../../../types/hebergement.type';
import { STATUTS_MAINTENANCE } from '../../../data/Hebergement.data';

interface Props {
  maintenances: RoomMaintenance[];
  rooms: Room[];
  onNew:      () => void;
  onStart:    (id: number) => void;
  onComplete: (id: number) => void;
  onDelete:   (id: number) => void;
}

export const MaintenanceTab: React.FC<Props> = ({
  maintenances, rooms, onNew, onStart, onComplete, onDelete,
}) => {
  const columns = [
    {
      key: 'room', label: 'Chambre',
      render: (m: RoomMaintenance) => (
        <span className="text-primary font-medium">
          Chambre {rooms.find(r => r.id === m.room_id)?.numero ?? '-'}
        </span>
      ),
    },
    {
      key: 'description', label: 'Description',
      render: (m: RoomMaintenance) => (
        <div>
          <p className="text-primary text-sm">{m.description}</p>
          <p className="text-muted text-xs">{m.type_intervention}</p>
        </div>
      ),
    },
    {
      key: 'statut', label: 'Statut',
      render: (m: RoomMaintenance) => {
        const s = STATUTS_MAINTENANCE[m.statut] ?? STATUTS_MAINTENANCE.OUVERT;
        return <Badge variant={s.variant as any}>{s.label}</Badge>;
      },
    },
    {
      key: 'actions', label: '',
      render: (m: RoomMaintenance) => (
        <div className="flex gap-2">
          {m.statut === 'OUVERT'   && <Button size="sm" variant="secondary" onClick={() => onStart(m.id)}>Démarrer</Button>}
          {m.statut === 'EN_COURS' && <Button size="sm" variant="secondary" onClick={() => onComplete(m.id)}>Terminer</Button>}
          <Button size="sm" variant="danger" onClick={() => onDelete(m.id)}><Trash2 size={14} /></Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h3 className="text-primary font-semibold text-sm sm:text-base">Maintenance</h3>
        <Button icon={<Plus size={16} />} onClick={onNew} className="w-full sm:w-auto text-sm">
          Nouvelle intervention
        </Button>
      </div>
      <div
        className="rounded-2xl overflow-hidden w-full"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <div className="overflow-x-auto">
          <DataTable data={maintenances} columns={columns} />
        </div>
      </div>
    </div>
  );
};