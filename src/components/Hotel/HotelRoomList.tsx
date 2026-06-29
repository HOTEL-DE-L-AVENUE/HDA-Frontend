// hotel/RoomList.tsx
import React, { useState, useEffect } from 'react';
import { Room, RoomType } from '../../types/hotel.types';
import {
  DoorOpen,
  Edit,
  Wrench,
  Brush,
  Loader,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Ban,
  Users,
  Home,
  Search,
  Filter,
  XCircle
} from 'lucide-react';
import { formatCurrency } from '../../utils/data';
import { RoomStatusModal } from './Modal/RoomStatusModal';
import { useRooms } from '../../hooks/useRooms';
import { roomTypeService } from '../../services/room.service';

interface RoomListProps {
  onEdit?: (room: Room) => void;
  onDelete?: (roomId: number) => void;
}

export const RoomList: React.FC<RoomListProps> = ({ onEdit, onDelete }) => {
  const {
    rooms,
    loading,
    error,
    updateRoomStatus,
    updateRoom,
    deleteRoom,
    refresh
  } = useRooms();

  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  // États pour la recherche et le filtrage
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('TOUS');
  const [filterType, setFilterType] = useState<string>('TOUS');

  // Charger les types de chambres
  useEffect(() => {
    const loadRoomTypes = async () => {
      try {
        const types = await roomTypeService.getRoomTypes();
        setRoomTypes(types);
      } catch (err) {
        console.error('❌ Erreur chargement types:', err);
      } finally {
        setLoadingTypes(false);
      }
    };
    loadRoomTypes();
  }, []);

  // Fonction pour obtenir le nom du type
  const getRoomTypeName = (room: Room) => {
    if (room.room_type?.nom) {
      return room.room_type.nom;
    }
    const type = roomTypes.find(t => t.id === room.room_type_id);
    return type?.nom || 'Type non défini';
  };

  // Filtrer les chambres
  const filteredRooms = rooms.filter(room => {
    // Recherche par numéro ou type
    const matchesSearch =
      room.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getRoomTypeName(room).toLowerCase().includes(searchTerm.toLowerCase());

    // Filtre par statut
    const matchesStatus = filterStatus === 'TOUS' || room.statut === filterStatus;

    // Filtre par type
    const matchesType = filterType === 'TOUS' || room.room_type_id === Number(filterType);

    return matchesSearch && matchesStatus && matchesType;
  });

  // Statistiques des chambres
  const stats = {
    total: rooms.length,
    libre: rooms.filter(r => r.statut === 'LIBRE').length,
    occupee: rooms.filter(r => r.statut === 'OCCUPEE').length,
    reservee: rooms.filter(r => r.statut === 'RESERVEE').length,
    maintenance: rooms.filter(r => r.statut === 'MAINTENANCE').length,
  };

  // Gestion du changement de statut
  const handleStatusChange = async (roomId: number, newStatus: string) => {
    try {
      setProcessingId(roomId);
      await updateRoomStatus(roomId, newStatus);
    } catch (error) {
      console.error('❌ Erreur changement statut:', error);
    } finally {
      setProcessingId(null);
    }
  };

  // Gestion de l'édition
  const handleEdit = (room: Room) => {
    if (onEdit) {
      onEdit(room);
    } else {
      setSelectedRoom(room);
      setIsStatusModalOpen(true);
    }
  };

  // Gestion de la suppression
  const handleDeleteClick = (room: Room) => {
    setRoomToDelete(room);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!roomToDelete) return;

    try {
      setProcessingId(roomToDelete.id);
      await deleteRoom(roomToDelete.id);

      if (onDelete) {
        onDelete(roomToDelete.id);
      }

      setIsDeleteModalOpen(false);
      setRoomToDelete(null);
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
    } finally {
      setProcessingId(null);
    }
  };

  // Gestion du statut via modal
  const handleModalStatusChange = async (newStatus: string) => {
    if (!selectedRoom) return;
    try {
      await updateRoomStatus(selectedRoom.id, newStatus);
      setIsStatusModalOpen(false);
      setSelectedRoom(null);
    } catch (error) {
      console.error('❌ Erreur changement statut via modal:', error);
    }
  };

  // Réinitialiser les filtres
  const resetFilters = () => {
    setSearchTerm('');
    setFilterStatus('TOUS');
    setFilterType('TOUS');
  };

  // Affichage du chargement
  if (loading || loadingTypes) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader size={32} className="animate-spin text-accent" />
        <span className="ml-3 text-muted">Chargement des chambres...</span>
      </div>
    );
  }

  // Affichage de l'erreur
  if (error) {
    return (
      <div className="bg-danger/10 border border-danger/20 rounded-lg p-4 text-danger">
        <p>❌ {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-sm underline hover:no-underline"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-surface rounded-lg p-3 text-center border border-base">
          <div className="text-2xl font-bold text-primary">{stats.total}</div>
          <div className="text-xs text-muted">Total</div>
        </div>
        <div className="bg-success/10 rounded-lg p-3 text-center border border-success/20">
          <div className="text-2xl font-bold text-success">{stats.libre}</div>
          <div className="text-xs text-muted">Libres</div>
        </div>
        <div className="bg-accent/10 rounded-lg p-3 text-center border border-accent/20">
          <div className="text-2xl font-bold text-accent">{stats.occupee}</div>
          <div className="text-xs text-muted">Occupées</div>
        </div>
        <div className="bg-warning/10 rounded-lg p-3 text-center border border-warning/20">
          <div className="text-2xl font-bold text-warning">{stats.reservee}</div>
          <div className="text-xs text-muted">Réservées</div>
        </div>
        <div className="bg-danger/10 rounded-lg p-3 text-center border border-danger/20">
          <div className="text-2xl font-bold text-danger">{stats.maintenance}</div>
          <div className="text-xs text-muted">Maintenance</div>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Rechercher par numéro ou type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-base bg-surface text-primary placeholder-muted focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-base bg-surface text-primary focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
        >
          <option value="TOUS">Tous les statuts</option>
          <option value="LIBRE">Libre</option>
          <option value="OCCUPEE">Occupée</option>
          <option value="RESERVEE">Réservée</option>
          <option value="NETTOYAGE">En nettoyage</option>
          <option value="MAINTENANCE">En maintenance</option>
          <option value="HORS_SERVICE">Hors service</option>
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-base bg-surface text-primary focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
        >
          <option value="TOUS">Tous les types</option>
          {roomTypes.map(type => (
            <option key={type.id} value={type.id}>{type.nom}</option>
          ))}
        </select>

        {(searchTerm || filterStatus !== 'TOUS' || filterType !== 'TOUS') && (
          <button
            onClick={resetFilters}
            className="px-4 py-2.5 rounded-lg border border-base hover:bg-surface-2 transition-colors flex items-center gap-2"
          >
            <XCircle size={18} />
            Réinitialiser
          </button>
        )}

        <button
          onClick={refresh}
          className="px-4 py-2.5 rounded-lg btn-primary flex items-center gap-2"
        >
          <Loader size={18} className={loading ? 'animate-spin' : ''} />
          Actualiser
        </button>
      </div>

      {/* Liste des chambres */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-primary font-semibold">Liste des chambres</h3>
          <span className="text-muted text-sm">
            {filteredRooms.length} chambre{filteredRooms.length > 1 ? 's' : ''}
            {rooms.length !== filteredRooms.length && ` (sur ${rooms.length})`}
          </span>
        </div>

        {filteredRooms.length === 0 ? (
          <div className="text-center py-12 bg-surface rounded-lg border border-base">
            <Home size={48} className="mx-auto text-muted/30 mb-3" />
            <p className="text-muted">Aucune chambre trouvée</p>
            {(searchTerm || filterStatus !== 'TOUS' || filterType !== 'TOUS') && (
              <button
                onClick={resetFilters}
                className="mt-2 text-accent text-sm underline hover:no-underline"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredRooms.map(room => {
              const typeName = getRoomTypeName(room);
              const isProcessing = processingId === room.id;

              return (
                <div key={room.id} className="card card-gold-hover p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-primary font-semibold text-lg">
                        Chambre {room.numero}
                      </h4>
                      <p className="text-muted text-sm">
                        {typeName}
                        {room.capacite && ` • ${room.capacite} pers.`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[room.statut] || ''}`}>
                        {room.statut}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-base">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-accent font-bold text-lg">
                          {formatCurrency(room.prix_nuit || 0)}
                        </span>
                        <span className="text-muted text-sm font-normal ml-1">/nuit</span>
                      </div>
                      <div className="flex gap-1">
                        {/* Bouton Ménage */}
                        <button
                          onClick={() => handleStatusChange(room.id, 'NETTOYAGE')}
                          className="p-2 rounded-lg hover:bg-info/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Ménage"
                          disabled={isProcessing}
                        >
                          {isProcessing ? (
                            <Loader size={16} className="animate-spin text-muted" />
                          ) : (
                            <Brush size={16} className="text-info" />
                          )}
                        </button>

                        {/* Bouton Maintenance */}
                        <button
                          onClick={() => handleStatusChange(room.id, 'MAINTENANCE')}
                          className="p-2 rounded-lg hover:bg-danger/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Maintenance"
                          disabled={isProcessing}
                        >
                          {isProcessing ? (
                            <Loader size={16} className="animate-spin text-muted" />
                          ) : (
                            <Wrench size={16} className="text-danger" />
                          )}
                        </button>

                        {/* Bouton Modifier */}
                        <button
                          onClick={() => handleEdit(room)}
                          className="p-2 rounded-lg hover:bg-accent/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Modifier"
                          disabled={isProcessing}
                        >
                          <Edit size={16} className="text-accent" />
                        </button>

                        {/* Bouton Supprimer */}
                        <button
                          onClick={() => handleDeleteClick(room)}
                          className="p-2 rounded-lg hover:bg-danger/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Supprimer"
                          disabled={isProcessing}
                        >
                          <Trash2 size={16} className="text-danger" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
          onStatusChange={handleModalStatusChange}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && roomToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black backdrop-blur-sm animate-fade-in">
          <div className="bg dark:bg-surface-2 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-base-light dark:border-base-dark animate-scale-in">
            <div className="text-center">
              {/* Icône d'avertissement */}
              <div className="w-16 h-16 rounded-full bg-danger/10 dark:bg-danger/20 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} className="text-danger" />
              </div>

              <h3 className="text-xl font-bold text-primary-dark dark:text-primary-light mb-2">
                Confirmer la suppression
              </h3>

              <p className="text-muted dark:text-muted-light text-sm mb-2">
                Êtes-vous sûr de vouloir supprimer la <strong className="text-primary-dark dark:text-primary-light">Chambre {roomToDelete.numero}</strong> ?
              </p>
              <p className="text-danger/80 dark:text-danger/70 text-xs">
                ⚠️ Cette action est irréversible et supprimera toutes les données associées.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                {/* Bouton Annuler */}
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setRoomToDelete(null);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-base-light dark:border-base-dark text-primary-dark dark:text-primary-light font-medium text-sm hover:bg-surface-2 dark:hover:bg-surface-3 transition-all duration-300"
                  disabled={processingId === roomToDelete.id}
                >
                  Annuler
                </button>

                {/* Bouton Supprimer */}
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-danger hover:bg-danger/90 dark:bg-danger-dark dark:hover:bg-danger-dark/90 text-white font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={processingId === roomToDelete.id}
                >
                  {processingId === roomToDelete.id ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      Suppression...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Supprimer définitivement
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Styles CSS pour les animations */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { 
            opacity: 0;
            transform: scale(0.95);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

// Status colors
const statusColors: Record<string, string> = {
  LIBRE: 'bg-success/10 text-success border-success/20',
  OCCUPEE: 'bg-accent/10 text-accent border-accent/20',
  RESERVEE: 'bg-warning/10 text-warning border-warning/20',
  NETTOYAGE: 'bg-info/10 text-info border-info/20',
  MAINTENANCE: 'bg-danger/10 text-danger border-danger/20',
  HORS_SERVICE: 'bg-muted/10 text-muted border-muted/20',
};