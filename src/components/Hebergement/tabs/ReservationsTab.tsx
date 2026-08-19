import React from 'react';
import { Plus, X } from 'lucide-react';
import { Badge, Button, DataTable } from '../../../components/UI';
import { STATUTS_RESERVATION } from '../../../data/Hebergement.data';
import { Reservation } from '../../../types/hebergement.type';
import { formatCurrency, formatDate } from '../../../utils/data';

interface Props {
  reservations: Reservation[];
  onNew: () => void;
  onCheckIn:  (r: Reservation) => void;
  onCheckOut: (r: Reservation) => void;
  onCancel:   (id: number) => void;
}

export const ReservationsTab: React.FC<Props> = ({
  reservations, onNew, onCheckIn, onCheckOut, onCancel,
}) => {
  const getClientName = (reservation: Reservation) => {
    const name = [reservation.client_prenom, reservation.client_nom]
      .filter(Boolean)
      .join(' ')
      .trim();

    return name || `Client #${reservation.client_id}`;
  };

  const columns: any[] = [
    {
      key: 'client', label: 'Client',
      render: (r: Reservation) => (
        <div>
          <p className="text-primary font-medium">{getClientName(r)}</p>
          <p className="text-muted text-xs">Chambre {r.room_numero || r.room_id}</p>
        </div>
      ),
    },
    {
      key: 'dates', label: 'Dates',
      render: (r: Reservation) => {
        const nights = Math.ceil(
          (new Date(r.date_depart).getTime() - new Date(r.date_arrivee).getTime()) / (1000 * 3600 * 24)
        );
        return (
          <div>
            <p className="text-primary text-sm">{formatDate(r.date_arrivee)} → {formatDate(r.date_depart)}</p>
            <p className="text-muted text-xs">{nights} nuits</p>
          </div>
        );
      },
    },
    {
      key: 'montant', label: 'Montant',
      render: (r: Reservation) => (
        <span className="text-accent font-bold">{formatCurrency(r.montant_total)}</span>
      ),
    },
    {
      key: 'statut', label: 'Statut',
      render: (r: Reservation) => {
        const rawStatus = r.statut || 'EN_COURS';
        const formattedKey = rawStatus.toUpperCase().replace(/\s+/g, '_');
        
        const s = STATUTS_RESERVATION[formattedKey] || STATUTS_RESERVATION[rawStatus] || { label: 'En cours', variant: 'warning' };
        return <Badge variant={s.variant as any}>{s.label}</Badge>;
      },
    },
    {
      key: 'actions', label: '',
      render: (r: Reservation) => {
        const statusNormalized = (r.statut || '').toUpperCase().replace(/\s+/g, '_');
        const isEnCours = statusNormalized === 'EN_COURS';
        const isConfirmee = statusNormalized === 'CONFIRMEE';

        return (
          <div className="flex gap-2">
            {/* Si CONFIRMEE -> Bouton Check-in */}
            {isConfirmee && (
              <Button size="sm" variant="secondary" onClick={() => onCheckIn(r)}>Check-in</Button>
            )}

            {/* Si EN_COURS -> Bouton Check-out */}
            {isEnCours && (
              <Button size="sm" variant="secondary" onClick={() => onCheckOut(r)}>Check-out</Button>
            )}

            <Button size="sm" variant="danger" onClick={() => onCancel(r.id)}>
              <X size={14} />
            </Button>
          </div>
        );
      },
    },
  ];

  const tableData = reservations.map((r) => ({
    ...r,
    id: String(r.id),
  }));

  return (
    <div
      className="rounded-2xl overflow-hidden w-full"
      style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      <div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b gap-2"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <h3 className="text-primary font-semibold text-sm sm:text-base">Réservations</h3>
        <Button icon={<Plus size={16} />} onClick={onNew} className="w-full sm:w-auto text-sm">
          Nouvelle réservation
        </Button>
      </div>
      <div className="overflow-x-auto">
        <DataTable data={tableData} columns={columns} />
      </div>
    </div>
  );
};