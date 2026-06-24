import React from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Badge, Button, DataTable } from '../../../components/UI';
import { RoomEquipment } from '../../../types/hebergement.type';
import { STATUTS_EQUIPMENT } from '../../../data/Hebergement.data';

interface Props {
  roomEquipments: RoomEquipment[];
  onNew:    () => void;
  onEdit:   (re: RoomEquipment) => void;
  onDelete: (id: number) => void;
}

export const EquipementsTab: React.FC<Props> = ({ roomEquipments, onNew, onEdit, onDelete }) => {
  const columns = [
    {
      key: 'equipment', label: 'Équipement',
      render: (re: RoomEquipment) => (
        <div>
          <p className="text-primary font-medium">{re.equipment?.nom ?? '-'}</p>
          <p className="text-muted text-xs">{re.equipment?.categorie ?? '-'}</p>
        </div>
      ),
    },
    {
      key: 'quantite', label: 'Qté',
      render: (re: RoomEquipment) => <span className="text-secondary">{re.quantite}</span>,
    },
    {
      key: 'statut', label: 'Statut',
      render: (re: RoomEquipment) => {
        const s = STATUTS_EQUIPMENT[re.statut] ?? STATUTS_EQUIPMENT.BON;
        return <Badge variant={s.variant as any}>{s.label}</Badge>;
      },
    },
    {
      key: 'actions', label: '',
      render: (re: RoomEquipment) => (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => onEdit(re)}><Pencil size={14} /></Button>
          <Button size="sm" variant="danger"    onClick={() => onDelete(re.id)}><Trash2 size={14} /></Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h3 className="text-primary font-semibold text-sm sm:text-base">Équipements des Chambres</h3>
        <Button icon={<Plus size={16} />} onClick={onNew} className="w-full sm:w-auto text-sm">
          Ajouter un équipement
        </Button>
      </div>
      <div
        className="rounded-2xl overflow-hidden w-full"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <div className="overflow-x-auto">
          <DataTable data={roomEquipments} columns={columns} />
        </div>
      </div>
    </div>
  );
};