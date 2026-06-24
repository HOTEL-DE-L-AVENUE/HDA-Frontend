import React from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Badge, Button, DataTable } from '../../../components/UI';
import { Room, RoomType } from '../../../types/hebergement.type';
import { formatCurrency } from '../../../utils/data';
import { STATUTS_ROOM } from '../../../data/Hebergement.data';

interface Props {
  rooms:     Room[];
  roomTypes: RoomType[];
  onNew:    () => void;
  onEdit:   (room: Room) => void;
  onDelete: (id: number) => void;
}

export const ChambresTab: React.FC<Props> = ({ rooms, roomTypes, onNew, onEdit, onDelete }) => {
  const columns = [
    {
      key: 'numero', label: 'N°',
      render: (r: Room) => <span className="text-primary font-medium">{r.numero}</span>,
    },
    {
      key: 'type', label: 'Type',
      render: (r: Room) => (
        <span className="text-secondary">{roomTypes.find(rt => rt.id === r.room_type_id)?.nom ?? '-'}</span>
      ),
    },
    {
      key: 'capacite', label: 'Capacité',
      render: (r: Room) => <span className="text-secondary">{r.capacite} pers.</span>,
    },
    {
      key: 'prix', label: 'Prix / Nuit',
      render: (r: Room) => <span className="text-accent font-bold">{formatCurrency(r.prix_nuit)}</span>,
    },
    {
      key: 'statut', label: 'Statut',
      render: (r: Room) => {
        const s = STATUTS_ROOM[r.statut] ?? STATUTS_ROOM.LIBRE;
        return <Badge variant={s.variant as any}>{s.label}</Badge>;
      },
    },
    {
      key: 'actions', label: '',
      render: (r: Room) => (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => onEdit(r)}><Pencil size={14} /></Button>
          <Button size="sm" variant="danger"    onClick={() => onDelete(r.id)}><Trash2 size={14} /></Button>
        </div>
      ),
    },
  ];

  return (
    <div
      className="rounded-2xl overflow-hidden w-full"
      style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      <div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b gap-2"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <h3 className="text-primary font-semibold text-sm sm:text-base">Gestion des Chambres</h3>
        <Button icon={<Plus size={16} />} onClick={onNew} className="w-full sm:w-auto text-sm">
          Ajouter une chambre
        </Button>
      </div>
      <div className="overflow-x-auto">
        <DataTable data={rooms} columns={columns} />
      </div>
    </div>
  );
};