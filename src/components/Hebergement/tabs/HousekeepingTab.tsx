import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Badge, Button, DataTable } from '../../../components/UI';
import { HousekeepingTask, Room } from '../../../types/hebergement.type';
import { STATUTS_HOUSEKEEPING } from '../../../data/Hebergement.data';

const TYPE_LABELS: Record<HousekeepingTask['type_tache'], string> = {
  NETTOYAGE:        'Nettoyage',
  DESINFECTION:     'Désinfection',
  CHANGEMENT_DRAPS: 'Changement draps',
  CONTROLE:         'Contrôle',
};

interface Props {
  tasks: HousekeepingTask[];
  rooms: Room[];
  onNew:      () => void;
  onStart:    (id: number) => void;
  onComplete: (id: number) => void;
  onDelete:   (id: number) => void;
}

export const HousekeepingTab: React.FC<Props> = ({
  tasks, rooms, onNew, onStart, onComplete, onDelete,
}) => {
  const columns = [
    {
      key: 'room', label: 'Chambre',
      render: (t: HousekeepingTask) => (
        <span className="text-primary font-medium">
          Chambre {rooms.find(r => r.id === t.room_id)?.numero ?? '-'}
        </span>
      ),
    },
    {
      key: 'type', label: 'Type',
      render: (t: HousekeepingTask) => (
        <span className="text-secondary">{TYPE_LABELS[t.type_tache] ?? t.type_tache}</span>
      ),
    },
    {
      key: 'statut', label: 'Statut',
      render: (t: HousekeepingTask) => {
        const s = STATUTS_HOUSEKEEPING[t.statut] ?? STATUTS_HOUSEKEEPING.A_FAIRE;
        return <Badge variant={s.variant as any}>{s.label}</Badge>;
      },
    },
    {
      key: 'actions', label: '',
      render: (t: HousekeepingTask) => (
        <div className="flex gap-2">
          {t.statut === 'A_FAIRE'  && <Button size="sm" variant="secondary" onClick={() => onStart(t.id)}>Démarrer</Button>}
          {t.statut === 'EN_COURS' && <Button size="sm" variant="secondary" onClick={() => onComplete(t.id)}>Terminer</Button>}
          <Button size="sm" variant="danger" onClick={() => onDelete(t.id)}><Trash2 size={14} /></Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h3 className="text-primary font-semibold text-sm sm:text-base">Tâches de Ménage</h3>
        <Button icon={<Plus size={16} />} onClick={onNew} className="w-full sm:w-auto text-sm">
          Nouvelle tâche
        </Button>
      </div>
      <div
        className="rounded-2xl overflow-hidden w-full"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <div className="overflow-x-auto">
          <DataTable data={tasks} columns={columns} />
        </div>
      </div>
    </div>
  );
};