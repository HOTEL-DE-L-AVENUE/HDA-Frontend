import React from 'react';
import { StockManager, CaisseManager } from '../components/StockManager';

// ─── Layout & UI ──────────────────────────────────────────────────────────────
import { HebergementHeader } from '../components/Hebergement/HebergementHeader';
import { HebergementStats } from '../components/Hebergement/HebergementStats';
import { HebergementFilters } from '../components/Hebergement/HebergementFilters';
import { HebergementTabs } from '../components/Hebergement/HebergementTabs';

// ─── Tabs ─────────────────────────────────────────────────────────────────────
import { ReservationsTab } from '../components/Hebergement/tabs/ReservationsTab';
import { ChambresTab } from '../components/Hebergement/tabs/ChambresTab';
import { EquipementsTab } from '../components/Hebergement/tabs/EquipementsTab';
import { HousekeepingTab } from '../components/Hebergement/tabs/HousekeepingTab';
import { MaintenanceTab } from '../components/Hebergement/tabs/MaintenanceTab';

// ─── Modals ───────────────────────────────────────────────────────────────────
import { ReservationModal } from '../components/Hebergement/modals/ReservationModal';
import { RoomModal } from '../components/Hebergement/modals/RoomModal';
import { EquipementModal } from '../components/Hebergement/modals/EquipementModal';
import { HousekeepingModal } from '../components/Hebergement/modals/HousekeepingModal';
import { MaintenanceModal } from '../components/Hebergement/modals/MaintenanceModal';
import { ClientModal } from '../components/Hebergement/modals/ClientModal';

// ─── Logic ────────────────────────────────────────────────────────────────────
import { useHebergement } from '../hooks/useHebergement';

export const HebergementPage: React.FC = () => {
  const h = useHebergement();

  return (
    <div className="w-full max-w-full space-y-6 overflow-x-hidden">

      {/* Header */}
      <HebergementHeader onNewReservation={() => h.setShowReservationModal(true)} />

      {/* Stats */}
      <HebergementStats stats={h.stats} />

      {/* Filters */}
      <HebergementFilters
        searchQuery={h.searchQuery}
        filterStatus={h.filterStatus}
        onSearchChange={h.setSearchQuery}
        onFilterChange={h.setFilterStatus}
      />

      {/* Tab bar */}
      <HebergementTabs activeTab={h.activeTab} onTabChange={h.setActiveTab} />

      {/* Tab content */}
      {h.activeTab === 'reservations' && (
        <ReservationsTab
          reservations={h.reservations}
          onNew={() => h.setShowReservationModal(true)}
          onCheckIn={h.handleCheckIn}
          onCheckOut={h.handleCheckOut}
          onCancel={h.handleCancelReservation}
        />
      )}

      {h.activeTab === 'chambres' && (
        <ChambresTab
          rooms={h.rooms}
          roomTypes={h.roomTypes}
          onNew={h.openNewRoomModal}
          onEdit={h.handleEditRoom}
          onDelete={h.handleDeleteRoom}
        />
      )}

      {h.activeTab === 'equipements' && (
        <EquipementsTab
          roomEquipments={h.roomEquipments}
          onNew={h.openNewEquipmentModal}
          onEdit={h.handleEditRoomEquipment}
          onDelete={h.handleDeleteRoomEquipment}
        />
      )}

      {h.activeTab === 'housekeeping' && (
        <HousekeepingTab
          tasks={h.housekeepingTasks}
          rooms={h.rooms}
          onNew={h.openNewHousekeepingModal}
          onStart={h.handleStartTask}
          onComplete={h.handleCompleteTask}
          onDelete={h.handleDeleteTask}
        />
      )}

      {h.activeTab === 'maintenance' && (
        <MaintenanceTab
          maintenances={h.maintenances}
          rooms={h.rooms}
          onNew={h.openNewMaintenanceModal}
          onStart={h.handleStartMaintenance}
          onComplete={h.handleCompleteMaintenance}
          onDelete={h.handleDeleteMaintenance}
        />
      )}

      {h.activeTab === 'stock' && (
        <StockManager
          module="hebergement"
          categories={['Linge', 'Hygiène', 'Mobilier', 'Électronique', 'Nettoyage', 'Autre']}
        />
      )}

      {h.activeTab === 'caisse' && (
        <CaisseManager
          module="hebergement"
          categories={['Hébergement', 'Stock', 'Maintenance', 'Personnel', 'Autre']}
          title="Caisse Hébergement"
          gradient="from-accent to-accent-2"
        />
      )}

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      <ReservationModal
        isOpen={h.showReservationModal}
        onClose={() => h.setShowReservationModal(false)}
        form={h.reservationForm}
        onChange={h.setReservationForm}
        onSave={h.handleSaveReservation}
        onNewClient={() => h.setShowClientModal(true)}
        clients={h.clients}
        rooms={h.rooms}
      />

      <RoomModal
        isOpen={h.showRoomModal}
        onClose={() => h.setShowRoomModal(false)}
        form={h.roomForm}
        onChange={h.setRoomForm}
        onSave={h.handleSaveRoom}
        isEditing={h.editingId !== null}
        roomTypes={h.roomTypes}
      />

      <EquipementModal
        isOpen={h.showEquipmentModal}
        onClose={() => h.setShowEquipmentModal(false)}
        form={h.equipmentForm}
        onChange={h.setEquipmentForm}
        onSave={h.handleSaveEquipment}
        isEditing={h.editingId !== null}
        rooms={h.rooms}
        equipments={h.equipments}
      />

      <HousekeepingModal
        isOpen={h.showHousekeepingModal}
        onClose={() => h.setShowHousekeepingModal(false)}
        form={h.housekeepingForm}
        onChange={h.setHousekeepingForm}
        onSave={h.handleSaveHousekeeping}
        rooms={h.rooms}
      />

      <MaintenanceModal
        isOpen={h.showMaintenanceModal}
        onClose={() => h.setShowMaintenanceModal(false)}
        form={h.maintenanceForm}
        onChange={h.setMaintenanceForm}
        onSave={h.handleSaveMaintenance}
        rooms={h.rooms}
        equipments={h.equipments}
      />

      <ClientModal
        isOpen={h.showClientModal}
        onClose={() => h.setShowClientModal(false)}
        form={h.clientForm}
        onChange={h.setClientForm}
        onSave={h.handleSaveClient}
      />
    </div>
  );
};