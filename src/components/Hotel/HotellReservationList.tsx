// components/Hotel/ReservationList.tsx
import React, { useState, useEffect } from 'react';
import { Reservation } from '../../types/hotel.types';
import { formatCurrency, formatDate } from '../../utils/data';
import { 
  Calendar, 
  Edit, 
  X, 
  Loader, 
  AlertCircle, 
  Trash2,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  User,
  DoorOpen
} from 'lucide-react';
import { useReservations } from '../../hooks/useReservations';
import { useClients } from '../../hooks/useClients';
import { useRooms } from '../../hooks/useRooms';
import { toast } from 'react-hot-toast';

interface ReservationListProps {
  onEdit?: (reservation: Reservation) => void;
}

export const ReservationList: React.FC<ReservationListProps> = ({ onEdit }) => {
  const { 
    reservations, 
    loading: reservationsLoading, 
    error: reservationsError, 
    stats,
    loadReservations,
    cancelReservation,
    deleteReservation
  } = useReservations();

  const { clients, loading: clientsLoading, loadClients } = useClients();
  const { rooms, loading: roomsLoading, loadRooms } = useRooms();

  const [selectedStatus, setSelectedStatus] = useState<string>('TOUS');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [reservationToDelete, setReservationToDelete] = useState<Reservation | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [enrichedReservations, setEnrichedReservations] = useState<Reservation[]>([]);

  // Charger toutes les données
  useEffect(() => {
    const loadAllData = async () => {
      await Promise.all([loadReservations(), loadClients(), loadRooms()]);
    };
    loadAllData();
  }, []);

  // Enrichir les réservations
  useEffect(() => {
    if (reservations.length > 0 && clients.length > 0 && rooms.length > 0) {
      const enriched = reservations.map(res => ({
        ...res,
        client: clients.find(c => c.id === res.client_id),
        room: rooms.find(r => r.id === res.room_id)
      }));
      setEnrichedReservations(enriched);
    } else {
      setEnrichedReservations(reservations);
    }
  }, [reservations, clients, rooms]);

  // Filtrer
  const filteredReservations = enrichedReservations.filter(res => {
    const matchesStatus = selectedStatus === 'TOUS' || res.statut === selectedStatus;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      res.client?.nom?.toLowerCase().includes(searchLower) ||
      res.client?.prenom?.toLowerCase().includes(searchLower) ||
      res.room?.numero?.includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  const isLoading = reservationsLoading || clientsLoading || roomsLoading;

  const getStatusBadge = (statut: string) => {
    const colors: Record<string, string> = {
      CONFIRMEE: 'bg-emerald-500/20 text-emerald-400',
      EN_COURS: 'bg-blue-500/20 text-blue-400',
      TERMINEE: 'bg-gray-500/20 text-gray-400',
      ANNULEE: 'bg-red-500/20 text-red-400'
    };
    const labels: Record<string, string> = {
      CONFIRMEE: 'Confirmée',
      EN_COURS: 'En cours',
      TERMINEE: 'Terminée',
      ANNULEE: 'Annulée'
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[statut] || colors.CONFIRMEE}`}>
        {labels[statut] || statut}
      </span>
    );
  };

  // Gestion des actions
  const handleCancel = async (reservation: Reservation) => {
    if (window.confirm(`Annuler la réservation de ${reservation.client?.prenom} ${reservation.client?.nom} ?`)) {
      try {
        setIsProcessing(true);
        await cancelReservation(reservation.id);
        toast.success('Réservation annulée');
        await loadReservations();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Erreur');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleDeleteClick = (reservation: Reservation) => {
    setReservationToDelete(reservation);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!reservationToDelete) return;
    try {
      setIsProcessing(true);
      await deleteReservation(reservationToDelete.id);
      toast.success('Réservation supprimée');
      setIsDeleteModalOpen(false);
      setReservationToDelete(null);
      await loadReservations();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader size={32} className="animate-spin text-accent" />
        <span className="ml-3 text-gray-400 text-sm">Chargement...</span>
      </div>
    );
  }

  if (reservationsError) {
    return (
      <div className="text-center py-12">
        <AlertCircle size={40} className="mx-auto text-red-400 mb-3" />
        <p className="text-red-400">{reservationsError}</p>
        <button onClick={() => loadReservations()} className="mt-3 text-accent hover:underline text-sm">
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats compactes */}
      {stats && (
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-center">
            <p className="text-gray-500 text-xs">Total</p>
            <p className="text-white font-bold text-lg">{stats.total || 0}</p>
          </div>
          <div className="bg-emerald-900/20 border border-emerald-800/30 rounded-lg p-3 text-center">
            <p className="text-gray-500 text-xs">Confirmées</p>
            <p className="text-emerald-400 font-bold text-lg">{stats.confirmees || 0}</p>
          </div>
          <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-3 text-center">
            <p className="text-gray-500 text-xs">En cours</p>
            <p className="text-blue-400 font-bold text-lg">{stats.en_cours || 0}</p>
          </div>
          <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-3 text-center">
            <p className="text-gray-500 text-xs">Annulées</p>
            <p className="text-red-400 font-bold text-lg">{stats.annulees || 0}</p>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Rechercher..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-accent"
        />
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-accent"
        >
          <option value="TOUS">Tous</option>
          <option value="CONFIRMEE">Confirmées</option>
          <option value="EN_COURS">En cours</option>
          <option value="TERMINEE">Terminées</option>
          <option value="ANNULEE">Annulées</option>
        </select>
        <button
          onClick={() => Promise.all([loadReservations(), loadClients(), loadRooms()])}
          className="px-3 py-2 bg-accent text-black rounded-lg text-sm hover:bg-accent-2 transition"
        >
          🔄
        </button>
      </div>

      {/* Liste */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-gray-500 px-1">
          <span>{filteredReservations.length} réservation{filteredReservations.length > 1 ? 's' : ''}</span>
        </div>

        {filteredReservations.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            <Calendar size={32} className="mx-auto text-gray-600 mb-2" />
            Aucune réservation
          </div>
        ) : (
          filteredReservations.map((res) => (
            <div 
              key={res.id} 
              className={`bg-gray-900 border rounded-lg overflow-hidden transition-all
                ${res.statut === 'ANNULEE' ? 'border-red-800/30' : 'border-gray-700'}`}
            >
              {/* Ligne principale */}
              <div className="p-3">
                <div className="flex items-center justify-between gap-2">
                  {/* Info client */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-xs flex-shrink-0">
                      {res.client?.prenom?.[0] || '?'}{res.client?.nom?.[0] || '?'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium text-sm truncate">
                          {res.client?.prenom} {res.client?.nom || 'Inconnu'}
                        </span>
                        {getStatusBadge(res.statut)}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-0.5">
                          <DoorOpen size={12} />
                          {res.room?.numero || 'N/A'}
                        </span>
                        <span>{formatDate(res.date_arrivee)} → {formatDate(res.date_depart)}</span>
                        <span className="text-accent font-medium">{formatCurrency(res.montant_total || 0)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button
                      onClick={() => setExpandedId(expandedId === res.id ? null : res.id)}
                      className="p-1.5 hover:bg-gray-800 rounded"
                    >
                      {expandedId === res.id ? 
                        <ChevronUp size={14} className="text-gray-400" /> : 
                        <ChevronDown size={14} className="text-gray-400" />
                      }
                    </button>
                    {onEdit && (
                      <button onClick={() => onEdit(res)} className="p-1.5 hover:bg-gray-800 rounded">
                        <Edit size={14} className="text-gray-400" />
                      </button>
                    )}
                    {res.statut !== 'ANNULEE' && res.statut !== 'TERMINEE' && (
                      <button onClick={() => handleCancel(res)} className="p-1.5 hover:bg-red-500/10 rounded">
                        <X size={14} className="text-red-400" />
                      </button>
                    )}
                    <button onClick={() => handleDeleteClick(res)} className="p-1.5 hover:bg-red-500/10 rounded">
                      <Trash2 size={14} className="text-gray-500 hover:text-red-400" />
                    </button>
                  </div>
                </div>

                {/* Détails étendus (compact) */}
                {expandedId === res.id && (
                  <div className="mt-2 pt-2 border-t border-gray-800 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-gray-500">Client</p>
                      <p className="text-gray-300">{res.client?.prenom} {res.client?.nom}</p>
                      {res.client?.telephone && (
                        <p className="text-gray-400 flex items-center gap-1">
                          <Phone size={12} /> {res.client.telephone}
                        </p>
                      )}
                      {res.client?.email && (
                        <p className="text-gray-400 flex items-center gap-1 truncate">
                          <Mail size={12} /> {res.client.email}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-gray-500">Chambre</p>
                      <p className="text-gray-300">N° {res.room?.numero || 'N/A'}</p>
                      <p className="text-gray-400">{res.room?.room_type?.nom || 'Standard'}</p>
                      <p className="text-gray-400">{res.room?.capacite || 0} pers.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de suppression */}
      {isDeleteModalOpen && reservationToDelete && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-sm w-full">
            <div className="text-center">
              <AlertCircle size={32} className="mx-auto text-red-400 mb-3" />
              <h3 className="text-white font-bold mb-2">Confirmer la suppression</h3>
              <p className="text-gray-400 text-sm">
                Supprimer la réservation de <br />
                <strong className="text-white">
                  {reservationToDelete.client?.prenom} {reservationToDelete.client?.nom}
                </strong>
              </p>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 transition text-sm"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm flex items-center justify-center gap-2"
                  disabled={isProcessing}
                >
                  {isProcessing ? <Loader size={16} className="animate-spin" /> : 'Supprimer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};