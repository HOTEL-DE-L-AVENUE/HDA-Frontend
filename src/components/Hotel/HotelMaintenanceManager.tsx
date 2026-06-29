// components/Hotel/MaintenanceManager.tsx
import React, { useState, useEffect } from 'react';
import { RoomMaintenance, Equipment, Room } from '../../types/hotel.types';
import { formatDate } from '../../utils/data';
import { 
  Wrench, 
  Plus, 
  Check, 
  Clock, 
  AlertTriangle, 
  Loader, 
  AlertCircle, 
  Trash2,
  Edit,
  X,
  Eye
} from 'lucide-react';
import { useMaintenance } from '../../hooks/useMaintenance';
import { useRooms } from '../../hooks/useRooms';
import { useEquipment } from '../../hooks/useEquipment';

import { toast } from 'react-hot-toast';
import { MaintenanceFormModal } from './Modal/MaintenanceFormModal';

export const MaintenanceManager: React.FC = () => {
  const { 
    maintenances, 
    stats, 
    loading, 
    error,
    loadAll,
    createMaintenance,
    updateMaintenance,
    updateStatus,
    deleteMaintenance
  } = useMaintenance();

  const { rooms, loadRooms } = useRooms();
  const { equipments, loadEquipments } = useEquipment();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] = useState<RoomMaintenance | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [maintenanceToDelete, setMaintenanceToDelete] = useState<RoomMaintenance | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('TOUS');
  const [filterType, setFilterType] = useState<string>('TOUS');

  // Charger les données
  useEffect(() => {
    loadAll();
    loadRooms();
    loadEquipments();
  }, []);

  // Filtrer les maintenances
  const filteredMaintenances = maintenances.filter(m => {
    const matchesStatus = filterStatus === 'TOUS' || m.statut === filterStatus;
    const matchesType = filterType === 'TOUS' || m.type_intervention === filterType;
    return matchesStatus && matchesType;
  });

  // Gestion de la suppression
  const handleDeleteClick = (maintenance: RoomMaintenance) => {
    setMaintenanceToDelete(maintenance);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!maintenanceToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteMaintenance(maintenanceToDelete.id);
      toast.success('Maintenance supprimée avec succès');
      setIsDeleteModalOpen(false);
      setMaintenanceToDelete(null);
      await loadAll();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
  };

  // Gestion du statut
  const handleStatusChange = async (id: number, statut: string) => {
    try {
      await updateStatus(id, statut);
      toast.success(`Statut mis à jour: ${statut}`);
      await loadAll();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  };

  // Gestion de la sauvegarde
  const handleSave = async (data: any) => {
    try {
      if (selectedMaintenance) {
        await updateMaintenance(selectedMaintenance.id, data);
        toast.success('Maintenance modifiée avec succès');
      } else {
        await createMaintenance(data);
        toast.success('Maintenance créée avec succès');
      }
      setIsModalOpen(false);
      setSelectedMaintenance(null);
      await loadAll();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la sauvegarde');
    }
  };

  const getStatusBadge = (statut: string) => {
    const colors: Record<string, string> = {
      OUVERT: 'bg-red-500/20 text-red-400',
      EN_COURS: 'bg-yellow-500/20 text-yellow-400',
      TERMINE: 'bg-emerald-500/20 text-emerald-400',
      ANNULE: 'bg-gray-500/20 text-gray-400'
    };
    const labels: Record<string, string> = {
      OUVERT: '🔴 Ouvert',
      EN_COURS: '🟡 En cours',
      TERMINE: '✅ Terminé',
      ANNULE: '⛔ Annulé'
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${colors[statut] || colors.OUVERT}`}>
        {labels[statut] || statut}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      URGENCE: 'bg-red-500/20 text-red-400',
      CORRECTIVE: 'bg-yellow-500/20 text-yellow-400',
      PREVENTIVE: 'bg-blue-500/20 text-blue-400'
    };
    const labels: Record<string, string> = {
      URGENCE: '🚨 Urgence',
      CORRECTIVE: '🔧 Corrective',
      PREVENTIVE: '🛠️ Préventive'
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${colors[type] || colors.PREVENTIVE}`}>
        {labels[type] || type}
      </span>
    );
  };

  // Affichage du chargement
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader size={32} className="animate-spin text-accent" />
        <span className="ml-3 text-muted">Chargement des maintenances...</span>
      </div>
    );
  }

  // Affichage de l'erreur
  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-red-400 text-center">
        <AlertCircle size={40} className="mx-auto mb-3" />
        <p className="text-lg font-medium">{error}</p>
        <button 
          onClick={() => loadAll()}
          className="mt-3 px-4 py-2 bg-accent text-black rounded-lg hover:bg-accent-2 transition"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold text-lg">🔧 Gestion des maintenances</h3>
          <p className="text-gray-400 text-sm">
            {maintenances.length} intervention{maintenances.length > 1 ? 's' : ''} au total
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedMaintenance(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent text-black rounded-xl hover:bg-accent-2 transition font-medium"
        >
          <Plus size={18} />
          Nouvelle intervention
        </button>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 text-center">
            <p className="text-gray-400 text-xs">Total</p>
            <p className="text-white font-bold text-xl">{stats.total || 0}</p>
          </div>
          <div className="bg-red-900/20 border border-red-800/30 rounded-xl p-4 text-center">
            <p className="text-gray-400 text-xs">Ouvertes</p>
            <p className="text-red-400 font-bold text-xl">{stats.ouvert || 0}</p>
          </div>
          <div className="bg-yellow-900/20 border border-yellow-800/30 rounded-xl p-4 text-center">
            <p className="text-gray-400 text-xs">En cours</p>
            <p className="text-yellow-400 font-bold text-xl">{stats.en_cours || 0}</p>
          </div>
          <div className="bg-emerald-900/20 border border-emerald-800/30 rounded-xl p-4 text-center">
            <p className="text-gray-400 text-xs">Terminées</p>
            <p className="text-emerald-400 font-bold text-xl">{stats.termine || 0}</p>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-accent text-sm"
        >
          <option value="TOUS">Tous les statuts</option>
          <option value="OUVERT">Ouvert</option>
          <option value="EN_COURS">En cours</option>
          <option value="TERMINE">Terminé</option>
          <option value="ANNULE">Annulé</option>
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-accent text-sm"
        >
          <option value="TOUS">Tous les types</option>
          <option value="URGENCE">Urgence</option>
          <option value="CORRECTIVE">Corrective</option>
          <option value="PREVENTIVE">Préventive</option>
        </select>
        <button
          onClick={() => {
            setFilterStatus('TOUS');
            setFilterType('TOUS');
          }}
          className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-gray-400 hover:text-white transition text-sm"
        >
          Réinitialiser
        </button>
      </div>

      {/* Liste des maintenances */}
      {filteredMaintenances.length === 0 ? (
        <div className="text-center py-12 bg-gray-900/50 rounded-2xl border-2 border-gray-700">
          <Wrench size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">Aucune maintenance trouvée</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMaintenances.map(task => {
            const room = rooms.find(r => r.id === task.room_id);
            const equipment = task.equipment_id ? equipments.find(e => e.id === task.equipment_id) : null;
            
            return (
              <div key={task.id} className="bg-gray-900 border border-gray-700 rounded-xl p-5 hover:border-accent/30 transition-all">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {getStatusBadge(task.statut)}
                      {getTypeBadge(task.type_intervention)}
                      <span className="text-xs text-gray-500">ID: #{task.id}</span>
                    </div>
                    <h4 className="text-white font-semibold">
                      Chambre {room?.numero || 'N/A'}
                      {equipment && ` - ${equipment.nom}`}
                    </h4>
                    {task.description && (
                      <p className="text-gray-400 text-sm mt-1">{task.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
                      <span>📅 {formatDate(task.date_declaration)}</span>
                      {task.cout > 0 && <span>💰 {task.cout} Ar</span>}
                      {task.date_resolution && (
                        <span>✅ Résolu le {formatDate(task.date_resolution)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Boutons d'action rapide */}
                    {task.statut === 'OUVERT' && (
                      <button
                        onClick={() => handleStatusChange(task.id, 'EN_COURS')}
                        className="px-3 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded-lg text-xs font-medium transition"
                      >
                        Démarrer
                      </button>
                    )}
                    {task.statut === 'EN_COURS' && (
                      <button
                        onClick={() => handleStatusChange(task.id, 'TERMINE')}
                        className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium transition"
                      >
                        Terminer
                      </button>
                    )}
                    {(task.statut === 'OUVERT' || task.statut === 'EN_COURS') && (
                      <button
                        onClick={() => handleStatusChange(task.id, 'ANNULE')}
                        className="px-3 py-1.5 bg-gray-500/10 hover:bg-gray-500/20 text-gray-400 rounded-lg text-xs font-medium transition"
                      >
                        Annuler
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedMaintenance(task);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 hover:bg-blue-500/10 rounded-lg transition"
                      title="Modifier"
                    >
                      <Edit size={15} className="text-blue-400" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(task)}
                      className="p-1.5 hover:bg-red-500/10 rounded-lg transition"
                      title="Supprimer"
                    >
                      <Trash2 size={15} className="text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de création/modification */}
      <MaintenanceFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedMaintenance(null);
        }}
        initialData={selectedMaintenance}
        rooms={rooms}
        equipments={equipments}
        onSave={handleSave}
      />

      {/* Modal de confirmation de suppression */}
      {isDeleteModalOpen && maintenanceToDelete && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-sm w-full">
            <div className="text-center">
              <AlertCircle size={32} className="mx-auto text-red-400 mb-3" />
              <h3 className="text-white font-bold mb-2">Confirmer la suppression</h3>
              <p className="text-gray-400 text-sm">
                Supprimer la maintenance de la <br />
                <strong className="text-white">
                  Chambre {rooms.find(r => r.id === maintenanceToDelete.room_id)?.numero || 'N/A'}
                </strong>
              </p>
              <p className="text-red-400/80 text-xs mt-2">
                ⚠️ Cette action est irréversible
              </p>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setMaintenanceToDelete(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 transition text-sm"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm flex items-center justify-center gap-2"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      Suppression...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Supprimer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};