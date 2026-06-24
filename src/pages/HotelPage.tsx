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
  BedDouble
} from 'lucide-react';
import { useHDA } from '../context/HDAContext';
import { formatCurrency, formatDate } from '../utils/data';
import { RoomList } from '../components/Hotel/RoomList';
import { ReservationList } from '../components/Hotel/ReservationList';
import { EquipmentManager } from '../components/Hotel/EquipmentManager';
import { MinibarManager } from '../components/Hotel/MinibarManager';
import { MaintenanceManager } from '../components/Hotel/MaintenanceManager';
import { HousekeepingManager } from '../components/Hotel/HousekeepingManager';
import { ClientSearch } from '../components/Hotel/ClientSearch';
import { RoomFormModal } from '../components/Hotel/Modal/RoomFormModal';
import { ReservationFormModal } from '../components/Hotel/Modal/ReservationFormModal';
import { Room, Reservation } from '../types/hotel.types';
import { Button } from '../components/UI';


interface Tab {
  id: string;
  label: string;
  icon: LucideIcon;
}

const tabs: Tab[] = [
  { id: 'chambres', label: 'Chambres', icon: DoorOpen },
  { id: 'reservations', label: 'Réservations', icon: Calendar },
  { id: 'clients', label: 'Clients', icon: Users },
  { id: 'equipements', label: 'Équipements', icon: Sparkles },
  { id: 'maintenance', label: 'Maintenance', icon: Hammer },
  { id: 'housekeeping', label: 'Ménage', icon: Brush },
  { id: 'minibar', label: 'Mini-bar', icon: GlassWater },
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

const HotelPage: React.FC = () => {
  const context = useHDA();
  
  // Vérifier si le contexte existe
  if (!context) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-danger">Erreur de chargement du contexte</p>
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
  
  // Utiliser les données du contexte ou les données mockées
  const rooms = contextRooms.length > 0 ? contextRooms : mockRooms;
  const reservations = contextReservations.length > 0 ? contextReservations : mockReservations;
  const clients = contextClients.length > 0 ? contextClients : mockClients;

  // Récupérer les données de caisse avec gestion d'erreur
  let caisseData = { solde: 0, entrees: 0, sorties: 0 };
  try {
    if (typeof getModuleCaisseSolde === 'function') {
      caisseData = getModuleCaisseSolde('hotel') || { solde: 0, entrees: 0, sorties: 0 };
    }
  } catch (err) {
    console.error('Erreur lors de la récupération des données de caisse:', err);
  }
  
  const { solde = 0, entrees = 0, sorties = 0 } = caisseData;

  // Charger les données au montage
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Vérifier si loadHotelData est une fonction
        if (typeof loadHotelData === 'function') {
          await loadHotelData();
        } else {
          console.warn('loadHotelData n\'est pas une fonction, utilisation des données mockées');
          // Simuler un chargement réussi avec les données mockées
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setError('Impossible de charger les données. Veuillez réessayer.');
        // En cas d'erreur, on utilise les données mockées
        setIsLoading(false);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [loadHotelData]);

  // Statistiques avec valeurs par défaut et vérification des tableaux
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

  // Afficher un loader pendant le chargement
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted">Chargement des données...</p>
        </div>
      </div>
    );
  }

  // Afficher une erreur si nécessaire
  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-danger text-4xl mb-4">⚠️</div>
          <p className="text-danger font-medium">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 rounded-xl font-medium text-white"
            style={{
              background: 'var(--color-accent)',
              boxShadow: 'var(--shadow-accent)',
            }}
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-primary text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>
            Hôtel
          </h2>
          <p className="text-muted text-sm mt-1">Gestion complète de l'hôtel</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button 
            icon={<Plus size={16} />} 
            onClick={() => setIsReservationModalOpen(true)}
            className="text-sm"
            style={{
              background: 'var(--color-accent)',
              boxShadow: 'var(--shadow-accent)',
            }}
          >
            Nouvelle Réservation
          </Button>
          <Button 
            icon={<Plus size={16} />} 
            onClick={() => setIsRoomModalOpen(true)}
            className="text-sm"
            style={{
              background: 'var(--color-accent)',
              boxShadow: 'var(--shadow-accent)',
            }}
          >
            Nouvelle Chambre
          </Button>
 
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card card-accent p-5">
          <p className="text-muted text-xs mb-1">Revenu Hôtel</p>
          <p className="text-primary font-bold text-xl">{formatCurrency(solde)}</p>
        </div>
        <div className="card p-5">
          <p className="text-muted text-xs mb-1">Chambres</p>
          <p className="text-primary font-bold text-xl">
            {occupiedRooms}/{totalRooms}
            <span className="text-xs text-muted font-normal ml-1">occupées</span>
          </p>
        </div>
        <div className="card p-5">
          <p className="text-muted text-xs mb-1">Disponibles</p>
          <p className="text-success font-bold text-xl">{availableRooms}</p>
        </div>
        <div className="card p-5">
          <p className="text-muted text-xs mb-1">Réservations actives</p>
          <p className="text-accent font-bold text-xl">{activeReservations}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-surface border border-base rounded-2xl p-1 shadow-soft-sm">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-accent-4 text-accent'
                  : 'text-muted hover:text-primary'
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === 'chambres' && (
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
        )}
        {activeTab === 'reservations' && (
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
        )}
        {activeTab === 'clients' && (
          <div className="card p-6">
            <ClientSearch 
              onSelect={(client) => {
                console.log('Client sélectionné:', client);
              }}
            />
          </div>
        )}
        {activeTab === 'equipements' && (
          <EquipmentManager 
            equipments={safeEquipments}
            roomEquipments={safeRoomEquipments}
            rooms={safeRooms}
          />
        )}
        {activeTab === 'maintenance' && (
          <MaintenanceManager 
            tasks={safeMaintenanceTasks}
            equipments={safeEquipments}
            rooms={safeRooms}
          />
        )}
        {activeTab === 'housekeeping' && (
          <HousekeepingManager 
            tasks={safeHousekeepingTasks}
            rooms={safeRooms}
          />
        )}
        {activeTab === 'minibar' && (
          <MinibarManager 
            items={safeMinibarItems}
            rooms={safeRooms}
            products={safeProducts}
          />
        )}
      </div>

      {/* Modals */}
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