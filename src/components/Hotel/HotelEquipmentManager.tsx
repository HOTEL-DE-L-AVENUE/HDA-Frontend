// hotel/EquipmentManager.tsx
import React, { useState, useEffect } from 'react';
import { Equipment, RoomEquipment, Room } from '../../types/hotel.types';
import { Plus, Edit, Trash2, Check, X, Wrench, Loader, AlertCircle } from 'lucide-react';
import { AssignEquipmentModal } from './Modal/AssignEquipmentModal';

import { useEquipment } from '../../hooks/useEquipment';
import { useRooms } from '../../hooks/useRooms';
import { toast } from 'react-hot-toast';
import { EquipmentFormModal } from './Modal/EquipmentFormModal';

export const EquipmentManager: React.FC = () => {
  const { 
    equipments, 
    roomEquipments, 
    loading, 
    error,
    loadAll,
    createEquipment,
    updateEquipment,
    deleteEquipment,
    assignEquipment,
    deleteRoomEquipment
  } = useEquipment();

  const { rooms, loadRooms } = useRooms();

  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [equipmentToDelete, setEquipmentToDelete] = useState<Equipment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [stats, setStats] = useState<any>(null);

  // Charger les données
  useEffect(() => {
    loadAll();
    loadRooms();
  }, []);

  // Charger les stats
  useEffect(() => {
    if (equipments.length > 0) {
      const total = equipments.length;
      const assigned = roomEquipments.length;
      setStats({ total, assigned });
    }
  }, [equipments, roomEquipments]);

  // Gestion de la suppression
  const handleDeleteClick = (equipment: Equipment) => {
    setEquipmentToDelete(equipment);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!equipmentToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteEquipment(equipmentToDelete.id);
      toast.success('Équipement supprimé avec succès');
      setIsDeleteModalOpen(false);
      setEquipmentToDelete(null);
      await loadAll();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
  };

  // Gestion de l'assignation
  const handleAssign = async (roomId: number, quantity: number) => {
    if (!selectedEquipment) return;
    
    try {
      await assignEquipment({
        room_id: roomId,
        equipment_id: selectedEquipment.id,
        quantite: quantity,
        statut: 'BON'
      });
      toast.success('Équipement assigné avec succès');
      setIsAssignModalOpen(false);
      setSelectedEquipment(null);
      await loadAll();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'assignation');
    }
  };

  // Gestion de la création/modification
  const handleSaveEquipment = async (data: any) => {
    try {
      if (editingEquipment) {
        await updateEquipment(editingEquipment.id, data);
        toast.success('Équipement modifié avec succès');
      } else {
        await createEquipment(data);
        toast.success('Équipement créé avec succès');
      }
      setIsEquipmentModalOpen(false);
      setEditingEquipment(null);
      await loadAll();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la sauvegarde');
    }
  };

  // Affichage du chargement
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader size={32} className="animate-spin text-accent" />
        <span className="ml-3 text-muted">Chargement des équipements...</span>
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
          <h3 className="text-white font-semibold text-lg">🔧 Gestion des équipements</h3>
          <p className="text-gray-400 text-sm">
            {equipments.length} équipement{equipments.length > 1 ? 's' : ''} au total
          </p>
        </div>
        <button
          onClick={() => {
            setEditingEquipment(null);
            setIsEquipmentModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent text-black rounded-xl hover:bg-accent-2 transition font-medium"
        >
          <Plus size={18} />
          Nouvel équipement
        </button>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 text-center">
            <p className="text-gray-400 text-xs">Total équipements</p>
            <p className="text-white font-bold text-xl">{stats.total || 0}</p>
          </div>
          <div className="bg-blue-900/20 border border-blue-800/30 rounded-xl p-4 text-center">
            <p className="text-gray-400 text-xs">Assignés</p>
            <p className="text-blue-400 font-bold text-xl">{stats.assigned || 0}</p>
          </div>
          <div className="bg-emerald-900/20 border border-emerald-800/30 rounded-xl p-4 text-center">
            <p className="text-gray-400 text-xs">En bon état</p>
            <p className="text-emerald-400 font-bold text-xl">
              {roomEquipments.filter(re => re.statut === 'BON').length || 0}
            </p>
          </div>
          <div className="bg-red-900/20 border border-red-800/30 rounded-xl p-4 text-center">
            <p className="text-gray-400 text-xs">En panne</p>
            <p className="text-red-400 font-bold text-xl">
              {roomEquipments.filter(re => re.statut === 'EN_PANNE').length || 0}
            </p>
          </div>
        </div>
      )}

      {/* Liste des équipements */}
      {equipments.length === 0 ? (
        <div className="text-center py-12 bg-gray-900/50 rounded-2xl border-2 border-gray-700">
          <Wrench size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">Aucun équipement trouvé</p>
          <button
            onClick={() => {
              setEditingEquipment(null);
              setIsEquipmentModalOpen(true);
            }}
            className="mt-3 text-accent text-sm hover:underline"
          >
            Ajouter votre premier équipement
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {equipments.map(eq => {
            const assigned = roomEquipments.filter(re => re.equipment_id === eq.id);
            const assignedCount = assigned.length;
            
            return (
              <div key={eq.id} className="bg-gray-900 border border-gray-700 rounded-xl p-5 hover:border-accent/30 transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-white font-semibold">{eq.nom}</h4>
                      {eq.code && (
                        <span className="text-xs font-mono text-gray-500">#{eq.code}</span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm">
                      {eq.categorie || 'Non catégorisé'}
                    </p>
                    {eq.description && (
                      <p className="text-gray-500 text-xs mt-1">{eq.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setSelectedEquipment(eq);
                        setIsAssignModalOpen(true);
                      }}
                      className="p-1.5 hover:bg-green-500/10 rounded-lg transition"
                      title="Assigner à une chambre"
                    >
                      <Plus size={15} className="text-green-400" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingEquipment(eq);
                        setIsEquipmentModalOpen(true);
                      }}
                      className="p-1.5 hover:bg-blue-500/10 rounded-lg transition"
                      title="Modifier"
                    >
                      <Edit size={15} className="text-blue-400" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(eq)}
                      className="p-1.5 hover:bg-red-500/10 rounded-lg transition"
                      title="Supprimer"
                    >
                      <Trash2 size={15} className="text-red-400" />
                    </button>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-800">
                  <p className="text-xs text-gray-500">
                    Assigné à {assignedCount} chambre{assignedCount > 1 ? 's' : ''}
                  </p>
                  {assignedCount > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {assigned.slice(0, 3).map(re => {
                        const room = rooms.find(r => r.id === re.room_id);
                        return (
                          <span 
                            key={re.id} 
                            className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              re.statut === 'BON' ? 'bg-emerald-500/20 text-emerald-400' :
                              re.statut === 'EN_PANNE' ? 'bg-red-500/20 text-red-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}
                          >
                            {room?.numero || `#${re.room_id}`}
                          </span>
                        );
                      })}
                      {assignedCount > 3 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-800 text-gray-400">
                          +{assignedCount - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal d'assignation */}
      <AssignEquipmentModal
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          setSelectedEquipment(null);
        }}
        equipment={selectedEquipment}
        rooms={rooms}
        onAssign={handleAssign}
      />

      {/* Modal de création/modification */}
      <EquipmentFormModal
        isOpen={isEquipmentModalOpen}
        onClose={() => {
          setIsEquipmentModalOpen(false);
          setEditingEquipment(null);
        }}
        initialData={editingEquipment}
        categories={[]}
        onSave={handleSaveEquipment}
      />

      {/* Modal de confirmation de suppression */}
      {isDeleteModalOpen && equipmentToDelete && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-sm w-full">
            <div className="text-center">
              <AlertCircle size={32} className="mx-auto text-red-400 mb-3" />
              <h3 className="text-white font-bold mb-2">Confirmer la suppression</h3>
              <p className="text-gray-400 text-sm">
                Supprimer l'équipement <br />
                <strong className="text-white">
                  {equipmentToDelete.nom}
                </strong>
              </p>
              <p className="text-red-400/80 text-xs mt-2">
                ⚠️ Cette action est irréversible
              </p>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setEquipmentToDelete(null);
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