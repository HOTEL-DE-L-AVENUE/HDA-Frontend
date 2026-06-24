// components/Hotel/ReservationList.tsx
import React from 'react';
import { Reservation } from '../../types/hotel.types';
import { formatCurrency, formatDate } from '../../utils/data';
import { Calendar, Edit, X, Check } from 'lucide-react';

interface ReservationListProps {
  reservations: Reservation[];
  onEdit: (reservation: Reservation) => void;
  onCancel: (reservationId: number) => void;
}

export const ReservationList: React.FC<ReservationListProps> = ({
  reservations,
  onEdit,
  onCancel,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-primary font-semibold">Liste des réservations</h3>
        <span className="text-muted text-sm">{reservations.length} réservations</span>
      </div>

      <div className="space-y-3">
        {reservations.map(res => (
          <div key={res.id} className="card p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="text-primary font-semibold">
                    {res.client?.prenom} {res.client?.nom}
                  </h4>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    res.statut === 'CONFIRMEE' ? 'badge-success' :
                    res.statut === 'ANNULEE' ? 'badge-danger' :
                    'badge-warning'
                  }`}>
                    {res.statut}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p className="text-muted">
                    <span className="font-medium">Chambre:</span> {res.room?.numero || 'N/A'}
                  </p>
                  <p className="text-muted">
                    <span className="font-medium">Arrivée:</span> {formatDate(res.date_arrivee)}
                  </p>
                  <p className="text-muted">
                    <span className="font-medium">Départ:</span> {formatDate(res.date_depart)}
                  </p>
                  <p className="text-muted">
                    <span className="font-medium">Montant:</span> {formatCurrency(res.montant_total || 0)}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(res)}
                  className="p-2 rounded-lg hover:bg-surface-2 transition-colors"
                  title="Modifier"
                >
                  <Edit size={16} className="text-muted" />
                </button>
                {res.statut !== 'ANNULEE' && (
                  <button
                    onClick={() => onCancel(res.id)}
                    className="p-2 rounded-lg hover:bg-danger/10 transition-colors"
                    title="Annuler"
                  >
                    <X size={16} className="text-danger" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};