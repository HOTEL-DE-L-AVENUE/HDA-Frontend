import React, { useState, useEffect } from 'react';
import { 
  Hotel, 
  Wifi, 
  Coffee, 
  Car, 
  Sparkles,
  DoorOpen,
  Calendar,
  Users,
  ClipboardList,
  Hammer,
  Brush,
  GlassWater,
  LucideIcon,
  Plus,
  BedDouble,
  Menu,
  X,
  ChevronDown,
  Home,
  BarChart3,
  Settings,
  LogOut,
  User,
  Bell,
  Search,
  Moon,
  Sun
} from 'lucide-react';
import { useHDA } from '../context/HDAContext';
import { formatCurrency, formatDate } from '../utils/data';
import { RoomList } from '../components/Hotel/HotelRoomList';
import { ReservationList } from '../components/Hotel/HotellReservationList';
import { EquipmentManager } from '../components/Hotel/HotelEquipmentManager';
import { MinibarManager } from '../components/Hotel/HotelMinibarManager';
import { MaintenanceManager } from '../components/Hotel/HotelMaintenanceManager';
import { HousekeepingManager } from '../components/Hotel/HotelHousekeepingManager';
import { ClientSearch } from '../components/Hotel/ClientSearch';
import { RoomFormModal } from '../components/Hotel/Modal/RoomFormModal';
import { ReservationFormModal } from '../components/Hotel/Modal/ReservationFormModal';
import { Room, Reservation } from '../types/hotel.types';
import { Button } from '../components/UI';

interface Tab {
  id: string;
  label: string;
  icon: LucideIcon;
  mobileLabel?: string;
}

const tabs: Tab[] = [
  { id: 'chambres', label: 'Chambres', icon: DoorOpen, mobileLabel: 'Chambres' },
  { id: 'reservations', label: 'Réservations', icon: Calendar, mobileLabel: 'Réserv.' },
  { id: 'clients', label: 'Clients', icon: Users, mobileLabel: 'Clients' },
  { id: 'equipements', label: 'Équipements', icon: Sparkles, mobileLabel: 'Équip.' },
  { id: 'maintenance', label: 'Maintenance', icon: Hammer, mobileLabel: 'Mainten.' },
  { id: 'housekeeping', label: 'Ménage', icon: Brush, mobileLabel: 'Ménage' },
  { id: 'minibar', label: 'Mini-bar', icon: GlassWater, mobileLabel: 'Mini-bar' },
];

// Données mockées pour le développement
const mockRooms: Room[] = [
  { id: 1, room_type_id: 1, numero: '101', capacite: 2, prix_nuit: 250000, statut: 'LIBRE' },
  { id: 2, room_type_id: 1, numero: '102', capacite: 2, prix_nuit: 250000, statut: 'OCCUPEE' },
  { id: 3, room_type_id: 2, numero: '103', capacite: 3, prix_nuit: 350000, statut: 'RESERVEE' },
  { id: 4, room_type_id: 2, numero: '104', capacite: 3, prix_nuit: 350000, statut: 'LIBRE' },
  { id: 5, room_type_id: 3, numero: '105', capacite: 4, prix_nuit: 500000, statut: 'OCCUPEE' },
];

const mockReservations: Reservation[] = [
  { id: 1, client_id: 1, room_id: 1, date_arrivee: '2026-06-25', date_depart: '2026-06-28', montant_total: 750000, statut: 'CONFIRMEE' },
  { id: 2, client_id: 2, room_id: 3, date_arrivee: '2026-06-26', date_depart: '2026-06-30', montant_total: 1400000, statut: 'EN_ATTENTE' },
];

const mockClients = [
  { id: 1, code_client: 'CLT001', nom: 'Rakoto', prenom: 'Jean', telephone: '0321234567', email: 'jean@email.com', statut: 'ACTIF', is_casino_player: false },
  { id: 2, code_client: 'CLT002', nom: 'Rabe', prenom: 'Marie', telephone: '0337654321', email: 'marie@email.com', statut: 'ACTIF', is_casino_player: true },
];

// Composant pour les statistiques responsive
const StatsCard: React.FC<{
  label: string;
  value: string | number;
  subValue?: string;
  icon?: LucideIcon;
  color?: string;
  className?: string;
}> = ({ label, value, subValue, icon: Icon, color = 'accent', className = '' }) => {
  return (
    <div className={`bg-surface border border-base rounded-2xl p-4 md:p-5 hover:border-accent/30 transition-all ${className}`}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-muted text-[10px] md:text-xs uppercase tracking-wider font-medium mb-1 truncate">
            {label}
          </p>
          <p className="text-primary font-bold text-lg md:text-xl lg:text-2xl truncate">
            {value}
          </p>
          {subValue && (
            <p className="text-muted text-[10px] md:text-xs mt-0.5 truncate">{subValue}</p>
          )}
        </div>
        {Icon && (
          <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-${color}/10`}>
            <Icon size={16} className={`md:w-5 md:h-5 text-${color}`} />
          </div>
        )}
      </div>
    </div>
  );
};

// Composant pour les tabs responsive
const TabButton: React.FC<{
  tab: Tab;
  isActive: boolean;
  onClick: () => void;
}> = ({ tab, isActive, onClick }) => {
  const Icon = tab.icon;
  return (
    <button
      onClick={onClick}
      className={`
        flex-1 md:flex-none px-3 py-2.5 md:px-5 md:py-2.5 
        rounded-xl text-xs md:text-sm font-medium transition-all 
        flex items-center justify-center md:justify-start gap-1.5 md:gap-2
        min-w-[45px] md:min-w-[120px]
        ${isActive
          ? 'bg-accent-4 text-accent shadow-soft-sm'
          : 'text-muted hover:text-primary hover:bg-surface-2'
        }
      `}
    >
      <Icon size={16} className="md:w-[18px] md:h-[18px] flex-shrink-0" />
      <span className="hidden sm:inline">{tab.label}</span>
      <span className="sm:hidden">{tab.mobileLabel || tab.label}</span>
    </button>
  );
};

// Composant principal
const HotelPage: React.FC = () => {
  const context = useHDA();
  
  if (!context) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] p-4">
        <div className="text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-danger font-medium">Erreur de chargement du contexte</p>
          <p className="text-muted text-sm mt-2">Veuillez réessayer</p>
        </div>
      </div>
    );
  }

  const { 
    getModuleCaisseSolde, 
    rooms: contextRooms = [], 
    reservations: contextReservations = [], 
    clients: contextClients = [], 
    equipments = [], 
    roomEquipments = [], 
    maintenanceTasks = [], 
    housekeepingTasks = [], 
    minibarItems = [], 
    products = [], 
    loadHotelData 
  } = context;
  
  const [activeTab, setActiveTab] = useState('chambres');
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Utiliser les données du contexte ou les données mockées
  const rooms = contextRooms.length > 0 ? contextRooms : mockRooms;
  const reservations = contextReservations.length > 0 ? contextReservations : mockReservations;
  const clients = contextClients.length > 0 ? contextClients : mockClients;

  // Récupérer les données de caisse
  let caisseData = { solde: 0, entrees: 0, sorties: 0 };
  try {
    if (typeof getModuleCaisseSolde === 'function') {
      caisseData = getModuleCaisseSolde('hotel') || { solde: 0, entrees: 0, sorties: 0 };
    }
  } catch (err) {
    console.error('Erreur lors de la récupération des données de caisse:', err);
  }
  
  const { solde = 0, entrees = 0, sorties = 0 } = caisseData;

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (typeof loadHotelData === 'function') {
          await loadHotelData();
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setError('Impossible de charger les données. Veuillez réessayer.');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [loadHotelData]);

  // Statistiques sécurisées
  const safeRooms = Array.isArray(rooms) ? rooms : [];
  const safeReservations = Array.isArray(reservations) ? reservations : [];
  const safeClients = Array.isArray(clients) ? clients : [];
  const safeEquipments = Array.isArray(equipments) ? equipments : [];
  const safeRoomEquipments = Array.isArray(roomEquipments) ? roomEquipments : [];
  const safeMaintenanceTasks = Array.isArray(maintenanceTasks) ? maintenanceTasks : [];
  const safeHousekeepingTasks = Array.isArray(housekeepingTasks) ? housekeepingTasks : [];
  const safeMinibarItems = Array.isArray(minibarItems) ? minibarItems : [];
  const safeProducts = Array.isArray(products) ? products : [];

  const totalRooms = safeRooms.length;
  const occupiedRooms = safeRooms.filter(r => r?.statut === 'OCCUPEE').length;
  const availableRooms = safeRooms.filter(r => r?.statut === 'LIBRE').length;
  const activeReservations = safeReservations.filter(r => r?.statut === 'CONFIRMEE').length;
  const maintenanceCount = safeMaintenanceTasks.filter(t => t?.statut === 'OUVERT').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] p-4">
        <div className="text-center">
          <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted text-sm md:text-base">Chargement des données...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] p-4">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">⚠️</div>
          <p className="text-danger font-medium text-base md:text-lg">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2.5 rounded-xl font-medium text-white bg-accent hover:bg-accent/90 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 p-3 md:p-6 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-primary text-xl md:text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>
            Hôtel
          </h2>
          <p className="text-muted text-xs md:text-sm mt-0.5">Gestion complète de l'hôtel</p>
        </div>
        
        {/* Actions - Mobile Friendly */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsReservationModalOpen(true)}
            className="flex-1 sm:flex-none px-3 py-2 md:px-4 md:py-2.5 rounded-xl text-xs md:text-sm font-medium text-black bg-accent hover:bg-accent/90 transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus size={14} className="md:w-4 md:h-4" />
            <span>Réservation</span>
          </button>
          <button
            onClick={() => setIsRoomModalOpen(true)}
            className="flex-1 sm:flex-none px-3 py-2 md:px-4 md:py-2.5 rounded-xl text-xs md:text-sm font-medium text-black bg-accent hover:bg-accent/90 transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus size={14} className="md:w-4 md:h-4" />
            <span>Chambre</span>
          </button>
        </div>
      </div>

      {/* Quick Stats - Responsive Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatsCard
          label="Revenu Hôtel"
          value={formatCurrency(solde)}
          icon={Hotel}
          color="accent"
        />
        <StatsCard
          label="Chambres"
          value={`${occupiedRooms}/${totalRooms}`}
          subValue={`${availableRooms} disponibles`}
          icon={DoorOpen}
          color="blue"
        />
        <StatsCard
          label="Réservations"
          value={activeReservations}
          subValue="actives"
          icon={Calendar}
          color="green"
        />
        <StatsCard
          label="Maintenance"
          value={maintenanceCount}
          subValue="en cours"
          icon={Hammer}
          color="orange"
        />
      </div>

      {/* Tabs - Scrollable on Mobile */}
      <div className="relative">
        <div className="flex overflow-x-auto gap-1 bg-surface border border-base rounded-2xl p-1 shadow-soft-sm scrollbar-hide">
          {tabs.map(tab => (
            <TabButton
              key={tab.id}
              tab={tab}
              isActive={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
        </div>
        {/* Gradient fade on edges for mobile */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-surface to-transparent pointer-events-none md:hidden" />
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-surface to-transparent pointer-events-none md:hidden" />
      </div>

      {/* Tab Content */}
      <div className="mt-4 md:mt-6">
        {activeTab === 'chambres' && (
          <div className="overflow-x-auto">
            <RoomList 
              rooms={safeRooms}
              onEdit={(room) => {
                setSelectedRoom(room);
                setIsRoomModalOpen(true);
              }}
              onStatusChange={(roomId, newStatus) => {
                console.log(`Changer statut de la chambre ${roomId} vers ${newStatus}`);
              }}
            />
          </div>
        )}
        {activeTab === 'reservations' && (
          <div className="overflow-x-auto">
            <ReservationList 
              reservations={safeReservations}
              onEdit={(res) => {
                setSelectedReservation(res);
                setIsReservationModalOpen(true);
              }}
              onCancel={(resId) => {
                console.log(`Annuler la réservation ${resId}`);
              }}
            />
          </div>
        )}
        {activeTab === 'clients' && (
          <div className="bg-surface border border-base rounded-2xl p-4 md:p-6">
            <ClientSearch 
              onSelect={(client) => {
                console.log('Client sélectionné:', client);
              }}
            />
          </div>
        )}
        {activeTab === 'equipements' && (
          <div className="overflow-x-auto">
            <EquipmentManager 
              equipments={safeEquipments}
              roomEquipments={safeRoomEquipments}
              rooms={safeRooms}
            />
          </div>
        )}
        {activeTab === 'maintenance' && (
          <div className="overflow-x-auto">
            <MaintenanceManager 
              tasks={safeMaintenanceTasks}
              equipments={safeEquipments}
              rooms={safeRooms}
            />
          </div>
        )}
        {activeTab === 'housekeeping' && (
          <div className="overflow-x-auto">
            <HousekeepingManager 
              tasks={safeHousekeepingTasks}
              rooms={safeRooms}
            />
          </div>
        )}
        {activeTab === 'minibar' && (
          <div className="overflow-x-auto">
            <MinibarManager 
              items={safeMinibarItems}
              rooms={safeRooms}
              products={safeProducts}
            />
          </div>
        )}
      </div>

      {/* Modals - Responsive */}
      <RoomFormModal
        isOpen={isRoomModalOpen}
        onClose={() => {
          setIsRoomModalOpen(false);
          setSelectedRoom(null);
        }}
        initialData={selectedRoom}
        onSave={(data) => {
          console.log('Sauvegarder la chambre:', data);
          setIsRoomModalOpen(false);
          setSelectedRoom(null);
        }}
      />

      <ReservationFormModal
        isOpen={isReservationModalOpen}
        onClose={() => {
          setIsReservationModalOpen(false);
          setSelectedReservation(null);
        }}
        initialData={selectedReservation}
        rooms={safeRooms}
        clients={safeClients}
        onSave={(data) => {
          console.log('Sauvegarder la réservation:', data);
          setIsReservationModalOpen(false);
          setSelectedReservation(null);
        }}
      />
    </div>
  );
};

export default HotelPage;