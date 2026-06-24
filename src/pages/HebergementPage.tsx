import React, { useState, useEffect } from 'react';
import { StockManager, CaisseManager } from '../components/StockManager';
import { useHDA } from '../context/HDAContext';
import { Badge, Modal, Input, Select, Button, DataTable, Tabs, Tab } from '../components/UI';
import { formatCurrency, formatDate } from '../utils/data';
import { 
  BedDouble, Plus, Calendar, Users, DoorOpen, Pencil, Trash2, X,
  Settings, Wrench, Sparkles, ClipboardList, Search, Filter,
  Package, DollarSign, TrendingUp, TrendingDown,
  AlertCircle, CheckCircle, Clock, MoreVertical
} from 'lucide-react';

// Types basés sur la base de données
interface RoomType {
  id: number;
  nom: string;
  description: string;
  prix_base?: number;
}

interface Room {
  id: number;
  room_type_id: number;
  numero: string;
  capacite: number;
  prix_nuit: number;
  statut: 'LIBRE' | 'OCCUPEE' | 'RESERVEE' | 'NETTOYAGE' | 'MAINTENANCE' | 'HORS_SERVICE';
  room_type?: RoomType;
}

interface Reservation {
  id: number;
  client_id: number;
  room_id: number;
  date_arrivee: string;
  date_depart: string;
  montant_total: number;
  statut: 'CONFIRMEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';
  client_nom?: string;
  client_prenom?: string;
  room_numero?: string;
}

interface Equipment {
  id: number;
  code: string;
  nom: string;
  categorie: string;
  description: string;
}

interface RoomEquipment {
  id: number;
  room_id: number;
  equipment_id: number;
  quantite: number;
  statut: 'BON' | 'EN_PANNE' | 'REMPLACE' | 'HORS_SERVICE';
  equipment?: Equipment;
}

interface HousekeepingTask {
  id: number;
  room_id: number;
  assigned_user_id: number;
  type_tache: 'NETTOYAGE' | 'DESINFECTION' | 'CHANGEMENT_DRAPS' | 'CONTROLE';
  statut: 'A_FAIRE' | 'EN_COURS' | 'TERMINE';
  commentaire: string;
  planned_at: string;
  completed_at: string;
}

interface RoomMaintenance {
  id: number;
  room_id: number;
  equipment_id: number;
  type_intervention: 'PREVENTIVE' | 'CORRECTIVE' | 'URGENCE';
  description: string;
  statut: 'OUVERT' | 'EN_COURS' | 'TERMINE' | 'ANNULE';
  date_declaration: string;
  date_resolution: string;
  cout: number;
}

interface Client {
  id: number;
  code_client: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  adresse: string;
}

// Types pour les formulaires
interface ReservationForm {
  client_id: number;
  room_id: number;
  date_arrivee: string;
  date_depart: string;
  montant_total: number;
  statut: 'CONFIRMEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';
}

interface RoomForm {
  room_type_id: number;
  numero: string;
  capacite: number;
  prix_nuit: number;
  statut: 'LIBRE' | 'OCCUPEE' | 'RESERVEE' | 'NETTOYAGE' | 'MAINTENANCE' | 'HORS_SERVICE';
}

const TABS = [
  { id: 'reservations', label: 'Réservations', icon: <Calendar size={16} /> },
  { id: 'chambres', label: 'Chambres', icon: <BedDouble size={16} /> },
  { id: 'equipements', label: 'Équipements', icon: <Settings size={16} /> },
  { id: 'housekeeping', label: 'Ménage', icon: <Settings size={16} /> },
  { id: 'maintenance', label: 'Maintenance', icon: <Wrench size={16} /> },
  { id: 'stock', label: 'Stock', icon: <Package size={16} /> },
  { id: 'caisse', label: 'Caisse', icon: <DollarSign size={16} /> },
];

const STATUTS_ROOM = {
  LIBRE: { label: 'Libre', variant: 'success' },
  OCCUPEE: { label: 'Occupée', variant: 'warning' },
  RESERVEE: { label: 'Réservée', variant: 'info' },
  NETTOYAGE: { label: 'Nettoyage', variant: 'secondary' },
  MAINTENANCE: { label: 'Maintenance', variant: 'danger' },
  HORS_SERVICE: { label: 'Hors service', variant: 'danger' },
};

const STATUTS_RESERVATION = {
  CONFIRMEE: { label: 'Confirmée', variant: 'success' },
  EN_COURS: { label: 'En cours', variant: 'warning' },
  TERMINEE: { label: 'Terminée', variant: 'secondary' },
  ANNULEE: { label: 'Annulée', variant: 'danger' },
};

const TYPES_EQUIPMENT_STATUT = {
  BON: { label: 'Bon', variant: 'success' },
  EN_PANNE: { label: 'En panne', variant: 'danger' },
  REMPLACE: { label: 'Remplacé', variant: 'warning' },
  HORS_SERVICE: { label: 'Hors service', variant: 'danger' },
};

export const HebergementPage: React.FC = () => {
  const { state, dispatch } = useHDA();
  const [activeTab, setActiveTab] = useState('reservations');
  
  // États pour les modales
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [showHousekeepingModal, setShowHousekeepingModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  
  // États pour l'édition
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  
  // États pour les formulaires
  const [reservationForm, setReservationForm] = useState<ReservationForm>({
    client_id: 0,
    room_id: 0,
    date_arrivee: '',
    date_depart: '',
    montant_total: 0,
    statut: 'CONFIRMEE'
  });

  const [roomForm, setRoomForm] = useState<RoomForm>({
    room_type_id: 0,
    numero: '',
    capacite: 2,
    prix_nuit: 0,
    statut: 'LIBRE'
  });

  const [equipmentForm, setEquipmentForm] = useState({
    room_id: 0,
    equipment_id: 0,
    quantite: 1,
    statut: 'BON' as 'BON' | 'EN_PANNE' | 'REMPLACE' | 'HORS_SERVICE'
  });

  const [housekeepingForm, setHousekeepingForm] = useState({
    room_id: 0,
    assigned_user_id: 0,
    type_tache: 'NETTOYAGE' as 'NETTOYAGE' | 'DESINFECTION' | 'CHANGEMENT_DRAPS' | 'CONTROLE',
    commentaire: '',
    planned_at: ''
  });

  const [maintenanceForm, setMaintenanceForm] = useState({
    room_id: 0,
    equipment_id: 0,
    type_intervention: 'CORRECTIVE' as 'PREVENTIVE' | 'CORRECTIVE' | 'URGENCE',
    description: '',
    cout: 0
  });

  const [clientForm, setClientForm] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    email: '',
    adresse: '',
    type_piece: '',
    numero_piece: ''
  });

  // États pour la recherche et les filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Données simulées (à remplacer par des appels API)
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([
    { id: 1, nom: 'Standard', description: 'Chambre standard confortable' },
    { id: 2, nom: 'Deluxe', description: 'Chambre deluxe avec vue' },
    { id: 3, nom: 'Suite', description: 'Suite luxueuse avec salon' },
    { id: 4, nom: 'VIP', description: 'Suite présidentielle' },
  ]);

  const [clients, setClients] = useState<Client[]>([
    { id: 1, code_client: 'CL001', nom: 'Rakoto', prenom: 'Jean', telephone: '+261 34 123 4567', email: 'jean@email.com', adresse: 'Antananarivo' },
    { id: 2, code_client: 'CL002', nom: 'Rabe', prenom: 'Marie', telephone: '+261 33 987 6543', email: 'marie@email.com', adresse: 'Antananarivo' },
  ]);

  const [equipments, setEquipments] = useState<Equipment[]>([
    { id: 1, code: 'EQ001', nom: 'Téléviseur LED 55"', categorie: 'Electronique', description: 'TV 4K Smart' },
    { id: 2, code: 'EQ002', nom: 'Climatisation', categorie: 'Climatisation', description: 'Réversible 12000 BTU' },
    { id: 3, code: 'EQ003', nom: 'Coffre-fort', categorie: 'Sécurité', description: 'Coffre électronique' },
    { id: 4, code: 'EQ004', nom: 'Réfrigérateur', categorie: 'Electroménager', description: 'Mini-bar' },
  ]);

  const [rooms, setRooms] = useState<Room[]>([
    { id: 1, room_type_id: 1, numero: '101', capacite: 2, prix_nuit: 150000, statut: 'LIBRE' },
    { id: 2, room_type_id: 1, numero: '102', capacite: 2, prix_nuit: 150000, statut: 'OCCUPEE' },
    { id: 3, room_type_id: 2, numero: '201', capacite: 3, prix_nuit: 250000, statut: 'LIBRE' },
    { id: 4, room_type_id: 3, numero: '301', capacite: 4, prix_nuit: 450000, statut: 'RESERVEE' },
  ]);

  const [reservations, setReservations] = useState<Reservation[]>([
    { id: 1, client_id: 1, room_id: 2, date_arrivee: '2026-06-25', date_depart: '2026-06-28', montant_total: 450000, statut: 'CONFIRMEE' },
    { id: 2, client_id: 2, room_id: 4, date_arrivee: '2026-06-26', date_depart: '2026-06-30', montant_total: 1800000, statut: 'CONFIRMEE' },
  ]);

  const [roomEquipments, setRoomEquipments] = useState<RoomEquipment[]>([
    { id: 1, room_id: 1, equipment_id: 1, quantite: 1, statut: 'BON' },
    { id: 2, room_id: 1, equipment_id: 2, quantite: 1, statut: 'BON' },
    { id: 3, room_id: 1, equipment_id: 3, quantite: 1, statut: 'BON' },
  ]);

  const [housekeepingTasks, setHousekeepingTasks] = useState<HousekeepingTask[]>([
    { id: 1, room_id: 1, assigned_user_id: 1, type_tache: 'NETTOYAGE', statut: 'A_FAIRE', commentaire: 'Nettoyage complet', planned_at: '2026-06-24 08:00', completed_at: '' },
    { id: 2, room_id: 2, assigned_user_id: 1, type_tache: 'CHANGEMENT_DRAPS', statut: 'TERMINE', commentaire: 'Draps changés', planned_at: '2026-06-23 10:00', completed_at: '2026-06-23 10:30' },
  ]);

  const [maintenances, setMaintenances] = useState<RoomMaintenance[]>([
    { id: 1, room_id: 1, equipment_id: 2, type_intervention: 'CORRECTIVE', description: 'Climatisation ne refroidit plus', statut: 'OUVERT', date_declaration: '2026-06-23 14:00', date_resolution: '', cout: 0 },
  ]);

  // Statistiques
  const stats = [
    { label: 'Total Réservations', value: reservations.length, icon: <Calendar size={20} className="text-black" /> },
    { label: 'En Cours', value: reservations.filter(r => r.statut === 'EN_COURS').length, icon: <Clock size={20} className="text-black" /> },
    { label: 'Chambres Occupées', value: rooms.filter(r => r.statut === 'OCCUPEE').length, icon: <DoorOpen size={20} className="text-black" /> },
    { label: 'Chambres Disponibles', value: rooms.filter(r => r.statut === 'LIBRE').length, icon: <BedDouble size={20} className="text-black" /> },
  ];

  // Colonnes pour les réservations
  const reservationColumns = [
    { key: 'client', label: 'Client', render: (r: Reservation) => (
      <div>
        <p className="text-primary font-medium">{r.client_prenom || 'Client'} {r.client_nom || ''}</p>
        <p className="text-muted text-xs">Chambre {r.room_numero || r.room_id}</p>
      </div>
    )},
    { key: 'dates', label: 'Dates', render: (r: Reservation) => (
      <div>
        <p className="text-primary text-sm">{formatDate(r.date_arrivee)} → {formatDate(r.date_depart)}</p>
        <p className="text-muted text-xs">
          {Math.ceil((new Date(r.date_depart).getTime() - new Date(r.date_arrivee).getTime()) / (1000 * 3600 * 24))} nuits
        </p>
      </div>
    )},
    { key: 'montant', label: 'Montant', render: (r: Reservation) => (
      <span className="text-accent font-bold">{formatCurrency(r.montant_total)}</span>
    )},
    { key: 'statut', label: 'Statut', render: (r: Reservation) => {
      const status = STATUTS_RESERVATION[r.statut] || STATUTS_RESERVATION.CONFIRMEE;
      return <Badge variant={status.variant as any}>{status.label}</Badge>;
    }},
    { key: 'actions', label: '', render: (r: Reservation) => (
      <div className="flex gap-2">
        {r.statut === 'CONFIRMEE' && (
          <Button size="sm" variant="secondary" onClick={() => handleCheckIn(r)}>
            Check-in
          </Button>
        )}
        {r.statut === 'EN_COURS' && (
          <Button size="sm" variant="secondary" onClick={() => handleCheckOut(r)}>
            Check-out
          </Button>
        )}
        <Button size="sm" variant="danger" onClick={() => handleCancelReservation(r.id)}>
          <X size={14} />
        </Button>
      </div>
    )},
  ];

  // Colonnes pour les chambres
  const roomColumns = [
    { key: 'numero', label: 'N°', render: (r: Room) => (
      <span className="text-primary font-medium">{r.numero}</span>
    )},
    { key: 'type', label: 'Type', render: (r: Room) => (
      <span className="text-secondary">{roomTypes.find(rt => rt.id === r.room_type_id)?.nom || '-'}</span>
    )},
    { key: 'capacite', label: 'Capacité', render: (r: Room) => (
      <span className="text-secondary">{r.capacite} pers.</span>
    )},
    { key: 'prix', label: 'Prix / Nuit', render: (r: Room) => (
      <span className="text-accent font-bold">{formatCurrency(r.prix_nuit)}</span>
    )},
    { key: 'statut', label: 'Statut', render: (r: Room) => {
      const status = STATUTS_ROOM[r.statut] || STATUTS_ROOM.LIBRE;
      return <Badge variant={status.variant as any}>{status.label}</Badge>;
    }},
    { key: 'actions', label: '', render: (r: Room) => (
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={() => handleEditRoom(r)}>
          <Pencil size={14} />
        </Button>
        <Button size="sm" variant="danger" onClick={() => handleDeleteRoom(r.id)}>
          <Trash2 size={14} />
        </Button>
      </div>
    )},
  ];

  // Colonnes pour les équipements
  const equipmentColumns = [
    { key: 'equipment', label: 'Équipement', render: (re: RoomEquipment) => (
      <div>
        <p className="text-primary font-medium">{re.equipment?.nom || '-'}</p>
        <p className="text-muted text-xs">{re.equipment?.categorie || '-'}</p>
      </div>
    )},
    { key: 'quantite', label: 'Qté', render: (re: RoomEquipment) => (
      <span className="text-secondary">{re.quantite}</span>
    )},
    { key: 'statut', label: 'Statut', render: (re: RoomEquipment) => {
      const status = TYPES_EQUIPMENT_STATUT[re.statut] || TYPES_EQUIPMENT_STATUT.BON;
      return <Badge variant={status.variant as any}>{status.label}</Badge>;
    }},
    { key: 'actions', label: '', render: (re: RoomEquipment) => (
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={() => handleEditRoomEquipment(re)}>
          <Pencil size={14} />
        </Button>
        <Button size="sm" variant="danger" onClick={() => handleDeleteRoomEquipment(re.id)}>
          <Trash2 size={14} />
        </Button>
      </div>
    )},
  ];

  // Colonnes pour le housekeeping
  const housekeepingColumns = [
    { key: 'room', label: 'Chambre', render: (t: HousekeepingTask) => (
      <span className="text-primary font-medium">Chambre {rooms.find(r => r.id === t.room_id)?.numero || '-'}</span>
    )},
    { key: 'type', label: 'Type', render: (t: HousekeepingTask) => {
      const types = {
        NETTOYAGE: 'Nettoyage',
        DESINFECTION: 'Désinfection',
        CHANGEMENT_DRAPS: 'Changement draps',
        CONTROLE: 'Contrôle'
      };
      return <span className="text-secondary">{types[t.type_tache] || t.type_tache}</span>;
    }},
    { key: 'statut', label: 'Statut', render: (t: HousekeepingTask) => {
      const statusMap = {
        A_FAIRE: { label: 'À faire', variant: 'warning' },
        EN_COURS: { label: 'En cours', variant: 'info' },
        TERMINE: { label: 'Terminé', variant: 'success' }
      };
      const status = statusMap[t.statut] || statusMap.A_FAIRE;
      return <Badge variant={status.variant as any}>{status.label}</Badge>;
    }},
    { key: 'actions', label: '', render: (t: HousekeepingTask) => (
      <div className="flex gap-2">
        {t.statut === 'A_FAIRE' && (
          <Button size="sm" variant="secondary" onClick={() => handleStartTask(t.id)}>Démarrer</Button>
        )}
        {t.statut === 'EN_COURS' && (
          <Button size="sm" variant="secondary" onClick={() => handleCompleteTask(t.id)}>Terminer</Button>
        )}
        <Button size="sm" variant="danger" onClick={() => handleDeleteTask(t.id)}>
          <Trash2 size={14} />
        </Button>
      </div>
    )},
  ];

  // Colonnes pour la maintenance
  const maintenanceColumns = [
    { key: 'room', label: 'Chambre', render: (m: RoomMaintenance) => (
      <span className="text-primary font-medium">Chambre {rooms.find(r => r.id === m.room_id)?.numero || '-'}</span>
    )},
    { key: 'description', label: 'Description', render: (m: RoomMaintenance) => (
      <div>
        <p className="text-primary text-sm">{m.description}</p>
        <p className="text-muted text-xs">{m.type_intervention}</p>
      </div>
    )},
    { key: 'statut', label: 'Statut', render: (m: RoomMaintenance) => {
      const statusMap = {
        OUVERT: { label: 'Ouvert', variant: 'danger' },
        EN_COURS: { label: 'En cours', variant: 'warning' },
        TERMINE: { label: 'Terminé', variant: 'success' },
        ANNULE: { label: 'Annulé', variant: 'secondary' }
      };
      const status = statusMap[m.statut] || statusMap.OUVERT;
      return <Badge variant={status.variant as any}>{status.label}</Badge>;
    }},
    { key: 'actions', label: '', render: (m: RoomMaintenance) => (
      <div className="flex gap-2">
        {m.statut === 'OUVERT' && (
          <Button size="sm" variant="secondary" onClick={() => handleStartMaintenance(m.id)}>Démarrer</Button>
        )}
        {m.statut === 'EN_COURS' && (
          <Button size="sm" variant="secondary" onClick={() => handleCompleteMaintenance(m.id)}>Terminer</Button>
        )}
        <Button size="sm" variant="danger" onClick={() => handleDeleteMaintenance(m.id)}>
          <Trash2 size={14} />
        </Button>
      </div>
    )},
  ];

  // Handlers
  const handleCheckIn = (reservation: Reservation) => {
    // Mettre à jour le statut de la réservation
    // Mettre à jour le statut de la chambre
    alert(`Check-in pour la réservation #${reservation.id}`);
  };

  const handleCheckOut = (reservation: Reservation) => {
    // Mettre à jour le statut de la réservation
    // Mettre à jour le statut de la chambre
    alert(`Check-out pour la réservation #${reservation.id}`);
  };

  const handleCancelReservation = (id: number) => {
    if (window.confirm('Annuler cette réservation ?')) {
      alert(`Réservation #${id} annulée`);
    }
  };

  const handleEditRoom = (room: Room) => {
    setEditingId(room.id);
    setRoomForm({
      room_type_id: room.room_type_id,
      numero: room.numero,
      capacite: room.capacite,
      prix_nuit: room.prix_nuit,
      statut: room.statut
    });
    setShowRoomModal(true);
  };

  const handleDeleteRoom = (id: number) => {
    if (window.confirm('Supprimer cette chambre ?')) {
      alert(`Chambre #${id} supprimée`);
    }
  };

  const handleEditRoomEquipment = (re: RoomEquipment) => {
    setEditingId(re.id);
    setEquipmentForm({
      room_id: re.room_id,
      equipment_id: re.equipment_id,
      quantite: re.quantite,
      statut: re.statut
    });
    setShowEquipmentModal(true);
  };

  const handleDeleteRoomEquipment = (id: number) => {
    if (window.confirm('Supprimer cet équipement de la chambre ?')) {
      alert(`Équipement #${id} supprimé`);
    }
  };

  const handleStartTask = (id: number) => {
    alert(`Tâche #${id} démarrée`);
  };

  const handleCompleteTask = (id: number) => {
    alert(`Tâche #${id} terminée`);
  };

  const handleDeleteTask = (id: number) => {
    if (window.confirm('Supprimer cette tâche ?')) {
      alert(`Tâche #${id} supprimée`);
    }
  };

  const handleStartMaintenance = (id: number) => {
    alert(`Maintenance #${id} démarrée`);
  };

  const handleCompleteMaintenance = (id: number) => {
    alert(`Maintenance #${id} terminée`);
  };

  const handleDeleteMaintenance = (id: number) => {
    if (window.confirm('Supprimer cette maintenance ?')) {
      alert(`Maintenance #${id} supprimée`);
    }
  };

  return (
    <div className="w-full max-w-full space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-primary text-xl md:text-2xl font-bold truncate" style={{ fontFamily: 'Playfair Display, serif' }}>
            Hébergement
          </h2>
          <p className="text-muted text-xs md:text-sm mt-1 truncate">Gestion complète des chambres, réservations et services</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button 
            icon={<Plus size={16} />} 
            onClick={() => setShowReservationModal(true)}
            className="text-sm"
          >
            Nouvelle réservation
          </Button>
          <div 
            className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'var(--color-accent)',
              boxShadow: 'var(--shadow-accent)',
            }}
          >
            <BedDouble size={20} className="text-black md:size-24" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 w-full">
        {stats.map(s => (
          <div 
            key={s.label} 
            className="rounded-2xl p-3 md:p-4 flex items-center gap-3 md:gap-4 min-w-0"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div 
              className="w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--color-accent)' }}
            >
              {s.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-muted text-[10px] md:text-xs truncate">{s.label}</p>
              <p className="text-primary font-bold text-base md:text-lg truncate">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-xl text-primary placeholder-subtle text-sm transition-all"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              outline: 'none',
            }}
          />
        </div>
        <Select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          options={[
            { value: '', label: 'Tous les statuts' },
            { value: 'LIBRE', label: 'Libre' },
            { value: 'OCCUPEE', label: 'Occupée' },
            { value: 'RESERVEE', label: 'Réservée' },
            { value: 'MAINTENANCE', label: 'Maintenance' },
          ]}
          className="w-full sm:w-48"
        />
        <Button variant="secondary" icon={<Filter size={16} />} className="flex-shrink-0">
          Filtrer
        </Button>
      </div>

      {/* Tabs */}
      <div 
        className="flex gap-1 rounded-2xl p-1 w-full overflow-x-auto hide-scrollbar"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
        }}
      >
        {TABS.map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 md:px-5 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 flex items-center gap-2 ${
              activeTab === tab.id 
                ? 'text-black' 
                : 'text-muted hover:text-secondary'
            }`}
            style={{
              backgroundColor: activeTab === tab.id ? 'var(--color-accent)' : 'transparent',
              boxShadow: activeTab === tab.id ? 'var(--shadow-accent)' : 'none',
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content - Réservations */}
      {activeTab === 'reservations' && (
        <div 
          className="rounded-2xl overflow-hidden w-full"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b gap-2 sm:gap-3" style={{ borderColor: 'var(--color-border)' }}>
            <h3 className="text-primary font-semibold text-sm sm:text-base">Réservations</h3>
            <Button icon={<Plus size={16} />} onClick={() => setShowReservationModal(true)} className="w-full sm:w-auto text-sm">
              Nouvelle réservation
            </Button>
          </div>
          <div className="overflow-x-auto">
            <DataTable data={reservations} columns={reservationColumns} />
          </div>
        </div>
      )}

      {/* Tab Content - Chambres */}
      {activeTab === 'chambres' && (
        <div 
          className="rounded-2xl overflow-hidden w-full"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b gap-2 sm:gap-3" style={{ borderColor: 'var(--color-border)' }}>
            <h3 className="text-primary font-semibold text-sm sm:text-base">Gestion des Chambres</h3>
            <Button icon={<Plus size={16} />} onClick={() => {
              setEditingId(null);
              setRoomForm({ room_type_id: 0, numero: '', capacite: 2, prix_nuit: 0, statut: 'LIBRE' });
              setShowRoomModal(true);
            }} className="w-full sm:w-auto text-sm">
              Ajouter une chambre
            </Button>
          </div>
          <div className="overflow-x-auto">
            <DataTable data={rooms} columns={roomColumns} />
          </div>
        </div>
      )}

      {/* Tab Content - Équipements */}
      {activeTab === 'equipements' && (
        <div className="space-y-4 w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h3 className="text-primary font-semibold text-sm sm:text-base">Équipements des Chambres</h3>
            <Button icon={<Plus size={16} />} onClick={() => {
              setEditingId(null);
              setEquipmentForm({ room_id: 0, equipment_id: 0, quantite: 1, statut: 'BON' });
              setShowEquipmentModal(true);
            }} className="w-full sm:w-auto text-sm">
              Ajouter un équipement
            </Button>
          </div>
          <div 
            className="rounded-2xl overflow-hidden w-full"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div className="overflow-x-auto">
              <DataTable data={roomEquipments} columns={equipmentColumns} />
            </div>
          </div>
        </div>
      )}

      {/* Tab Content - Housekeeping */}
      {activeTab === 'housekeeping' && (
        <div className="space-y-4 w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h3 className="text-primary font-semibold text-sm sm:text-base">Tâches de Ménage</h3>
            <Button icon={<Plus size={16} />} onClick={() => {
              setEditingId(null);
              setHousekeepingForm({ room_id: 0, assigned_user_id: 0, type_tache: 'NETTOYAGE', commentaire: '', planned_at: '' });
              setShowHousekeepingModal(true);
            }} className="w-full sm:w-auto text-sm">
              Nouvelle tâche
            </Button>
          </div>
          <div 
            className="rounded-2xl overflow-hidden w-full"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div className="overflow-x-auto">
              <DataTable data={housekeepingTasks} columns={housekeepingColumns} />
            </div>
          </div>
        </div>
      )}

      {/* Tab Content - Maintenance */}
      {activeTab === 'maintenance' && (
        <div className="space-y-4 w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h3 className="text-primary font-semibold text-sm sm:text-base">Maintenance</h3>
            <Button icon={<Plus size={16} />} onClick={() => {
              setEditingId(null);
              setMaintenanceForm({ room_id: 0, equipment_id: 0, type_intervention: 'CORRECTIVE', description: '', cout: 0 });
              setShowMaintenanceModal(true);
            }} className="w-full sm:w-auto text-sm">
              Nouvelle intervention
            </Button>
          </div>
          <div 
            className="rounded-2xl overflow-hidden w-full"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div className="overflow-x-auto">
              <DataTable data={maintenances} columns={maintenanceColumns} />
            </div>
          </div>
        </div>
      )}

      {/* Tab Content - Stock */}
      {activeTab === 'stock' && (
        <StockManager 
          module="hebergement" 
          categories={['Linge', 'Hygiène', 'Mobilier', 'Électronique', 'Nettoyage', 'Autre']} 
        />
      )}

      {/* Tab Content - Caisse */}
      {activeTab === 'caisse' && (
        <CaisseManager 
          module="hebergement" 
          categories={['Hébergement', 'Stock', 'Maintenance', 'Personnel', 'Autre']} 
          title="Caisse Hébergement" 
          gradient="from-accent to-accent-2" 
        />
      )}

      {/* Modal Réservation */}
      <Modal isOpen={showReservationModal} onClose={() => setShowReservationModal(false)} title="Nouvelle Réservation" size="lg">
        <div className="space-y-4">
          <Select 
            label="Client" 
            value={reservationForm.client_id.toString()} 
            onChange={(e) => setReservationForm({...reservationForm, client_id: Number(e.target.value)})}
            options={[
              { value: '0', label: 'Sélectionner un client' },
              ...clients.map(c => ({ value: c.id.toString(), label: `${c.prenom} ${c.nom} - ${c.telephone}` }))
            ]}
          />
          <Button variant="secondary" onClick={() => setShowClientModal(true)} className="w-full">
            <Plus size={14} className="mr-2" /> Nouveau client
          </Button>
          <Select 
            label="Chambre" 
            value={reservationForm.room_id.toString()} 
            onChange={(e) => setReservationForm({...reservationForm, room_id: Number(e.target.value)})}
            options={[
              { value: '0', label: 'Sélectionner une chambre' },
              ...rooms.filter(r => r.statut === 'LIBRE').map(r => ({ 
                value: r.id.toString(), 
                label: `Chambre ${r.numero} - ${formatCurrency(r.prix_nuit)}/nuit` 
              }))
            ]}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input 
              label="Arrivée" 
              type="date" 
              value={reservationForm.date_arrivee} 
              onChange={(e) => setReservationForm({...reservationForm, date_arrivee: e.target.value})} 
            />
            <Input 
              label="Départ" 
              type="date" 
              value={reservationForm.date_depart} 
              onChange={(e) => setReservationForm({...reservationForm, date_depart: e.target.value})} 
            />
          </div>
          <Input 
            label="Montant Total (Ar)" 
            type="number" 
            value={reservationForm.montant_total} 
            onChange={(e) => setReservationForm({...reservationForm, montant_total: Number(e.target.value)})} 
          />
          <Select 
            label="Statut" 
            value={reservationForm.statut} 
            onChange={(e) => setReservationForm({...reservationForm, statut: e.target.value as ReservationForm['statut']})}
            options={[
              { value: 'CONFIRMEE', label: 'Confirmée' },
              { value: 'EN_COURS', label: 'En cours' },
            ]}
          />
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowReservationModal(false)} className="flex-1">Annuler</Button>
            <Button onClick={() => {
              alert('Réservation créée !');
              setShowReservationModal(false);
            }} className="flex-1">Enregistrer</Button>
          </div>
        </div>
      </Modal>

      {/* Modal Chambre */}
      <Modal isOpen={showRoomModal} onClose={() => setShowRoomModal(false)} title={editingId ? "Modifier la chambre" : "Ajouter une chambre"} size="lg">
        <div className="space-y-4">
          <Input 
            label="Numéro de chambre" 
            value={roomForm.numero} 
            onChange={(e) => setRoomForm({...roomForm, numero: e.target.value})} 
            placeholder="Ex: 101" 
          />
          <Select 
            label="Type de chambre" 
            value={roomForm.room_type_id.toString()} 
            onChange={(e) => setRoomForm({...roomForm, room_type_id: Number(e.target.value)})}
            options={[
              { value: '0', label: 'Sélectionner un type' },
              ...roomTypes.map(rt => ({ value: rt.id.toString(), label: rt.nom }))
            ]}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input 
              label="Capacité" 
              type="number" 
              value={roomForm.capacite} 
              onChange={(e) => setRoomForm({...roomForm, capacite: Number(e.target.value)})} 
            />
            <Input 
              label="Prix par nuit (Ar)" 
              type="number" 
              value={roomForm.prix_nuit} 
              onChange={(e) => setRoomForm({...roomForm, prix_nuit: Number(e.target.value)})} 
            />
          </div>
          <Select 
            label="Statut" 
            value={roomForm.statut} 
            onChange={(e) => setRoomForm({...roomForm, statut: e.target.value as RoomForm['statut']})}
            options={[
              { value: 'LIBRE', label: 'Libre' },
              { value: 'OCCUPEE', label: 'Occupée' },
              { value: 'RESERVEE', label: 'Réservée' },
              { value: 'NETTOYAGE', label: 'Nettoyage' },
              { value: 'MAINTENANCE', label: 'Maintenance' },
              { value: 'HORS_SERVICE', label: 'Hors service' },
            ]}
          />
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowRoomModal(false)} className="flex-1">Annuler</Button>
            <Button onClick={() => {
              alert(editingId ? 'Chambre modifiée !' : 'Chambre ajoutée !');
              setShowRoomModal(false);
            }} className="flex-1">
              {editingId ? 'Modifier' : 'Ajouter'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Équipement */}
      <Modal isOpen={showEquipmentModal} onClose={() => setShowEquipmentModal(false)} title={editingId ? "Modifier l'équipement" : "Ajouter un équipement"} size="lg">
        <div className="space-y-4">
          <Select 
            label="Chambre" 
            value={equipmentForm.room_id.toString()} 
            onChange={(e) => setEquipmentForm({...equipmentForm, room_id: Number(e.target.value)})}
            options={[
              { value: '0', label: 'Sélectionner une chambre' },
              ...rooms.map(r => ({ value: r.id.toString(), label: `Chambre ${r.numero}` }))
            ]}
          />
          <Select 
            label="Équipement" 
            value={equipmentForm.equipment_id.toString()} 
            onChange={(e) => setEquipmentForm({...equipmentForm, equipment_id: Number(e.target.value)})}
            options={[
              { value: '0', label: 'Sélectionner un équipement' },
              ...equipments.map(e => ({ value: e.id.toString(), label: e.nom }))
            ]}
          />
          <Input 
            label="Quantité" 
            type="number" 
            value={equipmentForm.quantite} 
            onChange={(e) => setEquipmentForm({...equipmentForm, quantite: Number(e.target.value)})} 
          />
          <Select 
            label="Statut" 
            value={equipmentForm.statut} 
            onChange={(e) => setEquipmentForm({...equipmentForm, statut: e.target.value as 'BON' | 'EN_PANNE' | 'REMPLACE' | 'HORS_SERVICE'})}
            options={[
              { value: 'BON', label: 'Bon' },
              { value: 'EN_PANNE', label: 'En panne' },
              { value: 'REMPLACE', label: 'Remplacé' },
              { value: 'HORS_SERVICE', label: 'Hors service' },
            ]}
          />
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowEquipmentModal(false)} className="flex-1">Annuler</Button>
            <Button onClick={() => {
              alert(editingId ? 'Équipement modifié !' : 'Équipement ajouté !');
              setShowEquipmentModal(false);
            }} className="flex-1">
              {editingId ? 'Modifier' : 'Ajouter'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Housekeeping */}
      <Modal isOpen={showHousekeepingModal} onClose={() => setShowHousekeepingModal(false)} title="Nouvelle tâche de ménage" size="lg">
        <div className="space-y-4">
          <Select 
            label="Chambre" 
            value={housekeepingForm.room_id.toString()} 
            onChange={(e) => setHousekeepingForm({...housekeepingForm, room_id: Number(e.target.value)})}
            options={[
              { value: '0', label: 'Sélectionner une chambre' },
              ...rooms.map(r => ({ value: r.id.toString(), label: `Chambre ${r.numero}` }))
            ]}
          />
          <Select 
            label="Type de tâche" 
            value={housekeepingForm.type_tache} 
            onChange={(e) => setHousekeepingForm({...housekeepingForm, type_tache: e.target.value as 'NETTOYAGE' | 'DESINFECTION' | 'CHANGEMENT_DRAPS' | 'CONTROLE'})}
            options={[
              { value: 'NETTOYAGE', label: 'Nettoyage' },
              { value: 'DESINFECTION', label: 'Désinfection' },
              { value: 'CHANGEMENT_DRAPS', label: 'Changement draps' },
              { value: 'CONTROLE', label: 'Contrôle' },
            ]}
          />
          <Input 
            label="Date prévue" 
            type="datetime-local" 
            value={housekeepingForm.planned_at} 
            onChange={(e) => setHousekeepingForm({...housekeepingForm, planned_at: e.target.value})} 
          />
          <Input 
            label="Commentaire" 
            value={housekeepingForm.commentaire} 
            onChange={(e) => setHousekeepingForm({...housekeepingForm, commentaire: e.target.value})} 
            placeholder="Instructions particulières..." 
          />
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowHousekeepingModal(false)} className="flex-1">Annuler</Button>
            <Button onClick={() => {
              alert('Tâche créée !');
              setShowHousekeepingModal(false);
            }} className="flex-1">Enregistrer</Button>
          </div>
        </div>
      </Modal>

      {/* Modal Maintenance */}
      <Modal isOpen={showMaintenanceModal} onClose={() => setShowMaintenanceModal(false)} title="Nouvelle intervention" size="lg">
        <div className="space-y-4">
          <Select 
            label="Chambre" 
            value={maintenanceForm.room_id.toString()} 
            onChange={(e) => setMaintenanceForm({...maintenanceForm, room_id: Number(e.target.value)})}
            options={[
              { value: '0', label: 'Sélectionner une chambre' },
              ...rooms.map(r => ({ value: r.id.toString(), label: `Chambre ${r.numero}` }))
            ]}
          />
          <Select 
            label="Équipement concerné" 
            value={maintenanceForm.equipment_id.toString()} 
            onChange={(e) => setMaintenanceForm({...maintenanceForm, equipment_id: Number(e.target.value)})}
            options={[
              { value: '0', label: 'Non spécifié' },
              ...equipments.map(e => ({ value: e.id.toString(), label: e.nom }))
            ]}
          />
          <Select 
            label="Type d'intervention" 
            value={maintenanceForm.type_intervention} 
            onChange={(e) => setMaintenanceForm({...maintenanceForm, type_intervention: e.target.value as 'PREVENTIVE' | 'CORRECTIVE' | 'URGENCE'})}
            options={[
              { value: 'PREVENTIVE', label: 'Préventive' },
              { value: 'CORRECTIVE', label: 'Corrective' },
              { value: 'URGENCE', label: 'Urgence' },
            ]}
          />
          <Input 
            label="Description du problème" 
            value={maintenanceForm.description} 
            onChange={(e) => setMaintenanceForm({...maintenanceForm, description: e.target.value})} 
            placeholder="Décrivez le problème..." 
          />
          <Input 
            label="Coût estimé (Ar)" 
            type="number" 
            value={maintenanceForm.cout} 
            onChange={(e) => setMaintenanceForm({...maintenanceForm, cout: Number(e.target.value)})} 
          />
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowMaintenanceModal(false)} className="flex-1">Annuler</Button>
            <Button onClick={() => {
              alert('Intervention créée !');
              setShowMaintenanceModal(false);
            }} className="flex-1">Enregistrer</Button>
          </div>
        </div>
      </Modal>

      {/* Modal Client */}
      <Modal isOpen={showClientModal} onClose={() => setShowClientModal(false)} title="Nouveau Client" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input 
              label="Nom" 
              value={clientForm.nom} 
              onChange={(e) => setClientForm({...clientForm, nom: e.target.value})} 
              placeholder="Nom" 
            />
            <Input 
              label="Prénom" 
              value={clientForm.prenom} 
              onChange={(e) => setClientForm({...clientForm, prenom: e.target.value})} 
              placeholder="Prénom" 
            />
          </div>
          <Input 
            label="Téléphone" 
            value={clientForm.telephone} 
            onChange={(e) => setClientForm({...clientForm, telephone: e.target.value})} 
            placeholder="+261 34 12 345 67" 
          />
          <Input 
            label="Email" 
            type="email" 
            value={clientForm.email} 
            onChange={(e) => setClientForm({...clientForm, email: e.target.value})} 
            placeholder="email@exemple.com" 
          />
          <Input 
            label="Adresse" 
            value={clientForm.adresse} 
            onChange={(e) => setClientForm({...clientForm, adresse: e.target.value})} 
            placeholder="Adresse complète" 
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select 
              label="Type de pièce" 
              value={clientForm.type_piece} 
              onChange={(e) => setClientForm({...clientForm, type_piece: e.target.value})}
              options={[
                { value: '', label: 'Sélectionner' },
                { value: 'CNI', label: 'CNI' },
                { value: 'PASSEPORT', label: 'Passeport' },
                { value: 'PERMIS', label: 'Permis de conduire' },
              ]}
            />
            <Input 
              label="Numéro de pièce" 
              value={clientForm.numero_piece} 
              onChange={(e) => setClientForm({...clientForm, numero_piece: e.target.value})} 
              placeholder="Numéro" 
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowClientModal(false)} className="flex-1">Annuler</Button>
            <Button onClick={() => {
              alert('Client créé !');
              setShowClientModal(false);
            }} className="flex-1">Enregistrer</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};