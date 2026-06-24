import { useState } from 'react';
import { INITIAL_CLIENTS, INITIAL_EQUIPMENTS, INITIAL_HOUSEKEEPING, INITIAL_MAINTENANCES, INITIAL_RESERVATIONS, INITIAL_ROOM_EQUIPMENTS, INITIAL_ROOM_TYPES, INITIAL_ROOMS } from '../data/Hebergement.data';
import { Client, ClientForm, Equipment, EquipmentForm, HousekeepingForm, HousekeepingTask, MaintenanceForm, Reservation, ReservationForm, Room, RoomEquipment, RoomForm, RoomMaintenance, RoomType } from '../types/hebergement.type';

// ─── Valeurs par défaut des formulaires ──────────────────────────────────────

const DEFAULT_RESERVATION_FORM: ReservationForm = {
  client_id: 0, room_id: 0, date_arrivee: '', date_depart: '', montant_total: 0, statut: 'CONFIRMEE',
};
const DEFAULT_ROOM_FORM: RoomForm = {
  room_type_id: 0, numero: '', capacite: 2, prix_nuit: 0, statut: 'LIBRE',
};
const DEFAULT_EQUIPMENT_FORM: EquipmentForm = {
  room_id: 0, equipment_id: 0, quantite: 1, statut: 'BON',
};
const DEFAULT_HOUSEKEEPING_FORM: HousekeepingForm = {
  room_id: 0, assigned_user_id: 0, type_tache: 'NETTOYAGE', commentaire: '', planned_at: '',
};
const DEFAULT_MAINTENANCE_FORM: MaintenanceForm = {
  room_id: 0, equipment_id: 0, type_intervention: 'CORRECTIVE', description: '', cout: 0,
};
const DEFAULT_CLIENT_FORM: ClientForm = {
  nom: '', prenom: '', telephone: '', email: '', adresse: '', type_piece: '', numero_piece: '',
};

// ─── Hook principal ───────────────────────────────────────────────────────────

export function useHebergement() {
  // ── Données ──────────────────────────────────────────────────────────────
  const [roomTypes]    = useState<RoomType[]>(INITIAL_ROOM_TYPES);
  const [clients,       setClients]       = useState<Client[]>(INITIAL_CLIENTS);
  const [equipments]                      = useState<Equipment[]>(INITIAL_EQUIPMENTS);
  const [rooms,         setRooms]         = useState<Room[]>(INITIAL_ROOMS);
  const [reservations,  setReservations]  = useState<Reservation[]>(INITIAL_RESERVATIONS);
  const [roomEquipments,setRoomEquipments]= useState<RoomEquipment[]>(INITIAL_ROOM_EQUIPMENTS);
  const [housekeepingTasks, setHousekeepingTasks] = useState<HousekeepingTask[]>(INITIAL_HOUSEKEEPING);
  const [maintenances,  setMaintenances]  = useState<RoomMaintenance[]>(INITIAL_MAINTENANCES);

  // ── UI ───────────────────────────────────────────────────────────────────
  const [activeTab,   setActiveTab]   = useState('reservations');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus,setFilterStatus]= useState('');
  const [editingId,   setEditingId]   = useState<number | null>(null);

  // ── Modales ───────────────────────────────────────────────────────────────
  const [showReservationModal,  setShowReservationModal]  = useState(false);
  const [showRoomModal,         setShowRoomModal]         = useState(false);
  const [showEquipmentModal,    setShowEquipmentModal]    = useState(false);
  const [showHousekeepingModal, setShowHousekeepingModal] = useState(false);
  const [showMaintenanceModal,  setShowMaintenanceModal]  = useState(false);
  const [showClientModal,       setShowClientModal]       = useState(false);

  // ── Formulaires ───────────────────────────────────────────────────────────
  const [reservationForm,  setReservationForm]  = useState<ReservationForm>(DEFAULT_RESERVATION_FORM);
  const [roomForm,         setRoomForm]         = useState<RoomForm>(DEFAULT_ROOM_FORM);
  const [equipmentForm,    setEquipmentForm]    = useState<EquipmentForm>(DEFAULT_EQUIPMENT_FORM);
  const [housekeepingForm, setHousekeepingForm] = useState<HousekeepingForm>(DEFAULT_HOUSEKEEPING_FORM);
  const [maintenanceForm,  setMaintenanceForm]  = useState<MaintenanceForm>(DEFAULT_MAINTENANCE_FORM);
  const [clientForm,       setClientForm]       = useState<ClientForm>(DEFAULT_CLIENT_FORM);

  // ── Handlers : réservations ───────────────────────────────────────────────
  const handleCheckIn = (reservation: Reservation) => {
    setReservations(prev => prev.map(r =>
      r.id === reservation.id ? { ...r, statut: 'EN_COURS' } : r
    ));
    setRooms(prev => prev.map(r =>
      r.id === reservation.room_id ? { ...r, statut: 'OCCUPEE' } : r
    ));
  };

  const handleCheckOut = (reservation: Reservation) => {
    setReservations(prev => prev.map(r =>
      r.id === reservation.id ? { ...r, statut: 'TERMINEE' } : r
    ));
    setRooms(prev => prev.map(r =>
      r.id === reservation.room_id ? { ...r, statut: 'LIBRE' } : r
    ));
  };

  const handleCancelReservation = (id: number) => {
    if (window.confirm('Annuler cette réservation ?')) {
      setReservations(prev => prev.map(r =>
        r.id === id ? { ...r, statut: 'ANNULEE' } : r
      ));
    }
  };

  const handleSaveReservation = () => {
    const newReservation: Reservation = {
      ...reservationForm,
      id: Date.now(),
    };
    setReservations(prev => [...prev, newReservation]);
    setShowReservationModal(false);
    setReservationForm(DEFAULT_RESERVATION_FORM);
  };

  // ── Handlers : chambres ───────────────────────────────────────────────────
  const handleEditRoom = (room: Room) => {
    setEditingId(room.id);
    setRoomForm({
      room_type_id: room.room_type_id,
      numero: room.numero,
      capacite: room.capacite,
      prix_nuit: room.prix_nuit,
      statut: room.statut,
    });
    setShowRoomModal(true);
  };

  const handleDeleteRoom = (id: number) => {
    if (window.confirm('Supprimer cette chambre ?')) {
      setRooms(prev => prev.filter(r => r.id !== id));
    }
  };

  const handleSaveRoom = () => {
    if (editingId) {
      setRooms(prev => prev.map(r => r.id === editingId ? { ...r, ...roomForm } : r));
    } else {
      setRooms(prev => [...prev, { ...roomForm, id: Date.now() }]);
    }
    setShowRoomModal(false);
    setEditingId(null);
    setRoomForm(DEFAULT_ROOM_FORM);
  };

  const openNewRoomModal = () => {
    setEditingId(null);
    setRoomForm(DEFAULT_ROOM_FORM);
    setShowRoomModal(true);
  };

  // ── Handlers : équipements ────────────────────────────────────────────────
  const handleEditRoomEquipment = (re: RoomEquipment) => {
    setEditingId(re.id);
    setEquipmentForm({
      room_id: re.room_id,
      equipment_id: re.equipment_id,
      quantite: re.quantite,
      statut: re.statut,
    });
    setShowEquipmentModal(true);
  };

  const handleDeleteRoomEquipment = (id: number) => {
    if (window.confirm('Supprimer cet équipement de la chambre ?')) {
      setRoomEquipments(prev => prev.filter(re => re.id !== id));
    }
  };

  const handleSaveEquipment = () => {
    if (editingId) {
      setRoomEquipments(prev => prev.map(re => re.id === editingId ? { ...re, ...equipmentForm } : re));
    } else {
      setRoomEquipments(prev => [...prev, { ...equipmentForm, id: Date.now() }]);
    }
    setShowEquipmentModal(false);
    setEditingId(null);
    setEquipmentForm(DEFAULT_EQUIPMENT_FORM);
  };

  const openNewEquipmentModal = () => {
    setEditingId(null);
    setEquipmentForm(DEFAULT_EQUIPMENT_FORM);
    setShowEquipmentModal(true);
  };

  // ── Handlers : housekeeping ───────────────────────────────────────────────
  const handleStartTask = (id: number) => {
    setHousekeepingTasks(prev => prev.map(t => t.id === id ? { ...t, statut: 'EN_COURS' } : t));
  };

  const handleCompleteTask = (id: number) => {
    setHousekeepingTasks(prev => prev.map(t =>
      t.id === id ? { ...t, statut: 'TERMINE', completed_at: new Date().toISOString() } : t
    ));
  };

  const handleDeleteTask = (id: number) => {
    if (window.confirm('Supprimer cette tâche ?')) {
      setHousekeepingTasks(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleSaveHousekeeping = () => {
    const newTask: HousekeepingTask = {
      ...housekeepingForm,
      id: Date.now(),
      statut: 'A_FAIRE',
      completed_at: '',
    };
    setHousekeepingTasks(prev => [...prev, newTask]);
    setShowHousekeepingModal(false);
    setHousekeepingForm(DEFAULT_HOUSEKEEPING_FORM);
  };

  const openNewHousekeepingModal = () => {
    setHousekeepingForm(DEFAULT_HOUSEKEEPING_FORM);
    setShowHousekeepingModal(true);
  };

  // ── Handlers : maintenance ────────────────────────────────────────────────
  const handleStartMaintenance = (id: number) => {
    setMaintenances(prev => prev.map(m => m.id === id ? { ...m, statut: 'EN_COURS' } : m));
  };

  const handleCompleteMaintenance = (id: number) => {
    setMaintenances(prev => prev.map(m =>
      m.id === id ? { ...m, statut: 'TERMINE', date_resolution: new Date().toISOString() } : m
    ));
  };

  const handleDeleteMaintenance = (id: number) => {
    if (window.confirm('Supprimer cette maintenance ?')) {
      setMaintenances(prev => prev.filter(m => m.id !== id));
    }
  };

  const handleSaveMaintenance = () => {
    const newMaintenance: RoomMaintenance = {
      ...maintenanceForm,
      id: Date.now(),
      statut: 'OUVERT',
      date_declaration: new Date().toISOString(),
      date_resolution: '',
    };
    setMaintenances(prev => [...prev, newMaintenance]);
    setShowMaintenanceModal(false);
    setMaintenanceForm(DEFAULT_MAINTENANCE_FORM);
  };

  const openNewMaintenanceModal = () => {
    setMaintenanceForm(DEFAULT_MAINTENANCE_FORM);
    setShowMaintenanceModal(true);
  };

  // ── Handlers : client ─────────────────────────────────────────────────────
  const handleSaveClient = () => {
    const newClient: Client = {
      ...clientForm,
      id: Date.now(),
      code_client: `CL${String(clients.length + 1).padStart(3, '0')}`,
    };
    setClients(prev => [...prev, newClient]);
    setShowClientModal(false);
    setClientForm(DEFAULT_CLIENT_FORM);
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = {
    totalReservations: reservations.length,
    enCours:           reservations.filter(r => r.statut === 'EN_COURS').length,
    chambresOccupees:  rooms.filter(r => r.statut === 'OCCUPEE').length,
    chambresLibres:    rooms.filter(r => r.statut === 'LIBRE').length,
  };

  return {
    // données
    roomTypes, clients, equipments, rooms, reservations,
    roomEquipments, housekeepingTasks, maintenances,
    // UI
    activeTab, setActiveTab,
    searchQuery, setSearchQuery,
    filterStatus, setFilterStatus,
    editingId,
    stats,
    // modales
    showReservationModal,  setShowReservationModal,
    showRoomModal,         setShowRoomModal,
    showEquipmentModal,    setShowEquipmentModal,
    showHousekeepingModal, setShowHousekeepingModal,
    showMaintenanceModal,  setShowMaintenanceModal,
    showClientModal,       setShowClientModal,
    // formulaires
    reservationForm,  setReservationForm,
    roomForm,         setRoomForm,
    equipmentForm,    setEquipmentForm,
    housekeepingForm, setHousekeepingForm,
    maintenanceForm,  setMaintenanceForm,
    clientForm,       setClientForm,
    // handlers
    handleCheckIn, handleCheckOut, handleCancelReservation, handleSaveReservation,
    handleEditRoom, handleDeleteRoom, handleSaveRoom, openNewRoomModal,
    handleEditRoomEquipment, handleDeleteRoomEquipment, handleSaveEquipment, openNewEquipmentModal,
    handleStartTask, handleCompleteTask, handleDeleteTask, handleSaveHousekeeping, openNewHousekeepingModal,
    handleStartMaintenance, handleCompleteMaintenance, handleDeleteMaintenance, handleSaveMaintenance, openNewMaintenanceModal,
    handleSaveClient,
  };
}