import React, { useEffect, useState, useCallback } from 'react';
import { formatCurrency } from '../utils/data';
import {
  fetchCasinoBundle,
  fetchSessions,
  createRoom as apiCreateRoom,
  createCashier as apiCreateCashier,
  openSession as apiOpenSession,
  closeSession as apiCloseSession,
  recordBuyIn,
  recordCashOut,
  recordDeposit,
  buyChips,
  sellChips,
  fetchChips,
  createChipType as apiCreateChipType,
  updateChipType as apiUpdateChipType,
  deleteChipType as apiDeleteChipType,
  quickAddClient as apiQuickAddClient,
  setClientStatus as apiSetClientStatus,
  createIncident as apiCreateIncident,
  createCard as apiCreateCard,
  grantCredit as apiGrantCredit,
  drawCredit as apiDrawCredit,
  repayCredit as apiRepayCredit,
  checkIn as apiCheckIn,
} from '../services/casino.service';
import {
  Dices,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from 'lucide-react';

// Composants
import { CasinoHeader } from '../components/Casino/Entete/CasinoHeader';
import { CasinoTabs } from '../components/Casino/Tabs/CasinoTabs';
import { OverviewTab } from '../components/Casino/Tabs/OverviewTab';
import { RoomsTab } from '../components/Casino/Tabs/RoomsTab';
import { CaisseTab } from '../components/Casino/Tabs/CaisseTab';
import { ChipsTab } from '../components/Casino/Tabs/ChipsTab';
import { CardsTab } from '../components/Casino/Tabs/CardsTab';
import { ClientsTab } from '../components/Casino/Tabs/ClientsTab';
import { VisitsTab } from '../components/Casino/Tabs/VisitsTab';

// Modales
import { RoomModal } from '../components/Casino/Modals/RoomModal';
import { CashierModal } from '../components/Casino/Modals/CashierModal';
import { SessionModal } from '../components/Casino/Modals/SessionModal';
import { CloseSessionModal } from '../components/Casino/Modals/CloseSessionModal';
import { OperationModal, OperationKind } from '../components/Casino/Modals/OperationModal';
import { ChipModal, ChipOperation } from '../components/Casino/Modals/ChipModal';
import { ChipTypeModal } from '../components/Casino/Modals/ChipTypeModal';
import { ClientQuickAddModal } from '../components/Casino/Modals/ClientQuickAddModal';
import { ClientStatusModal } from '../components/Casino/Modals/ClientStatusModal';
import { IncidentModal } from '../components/Casino/Modals/IncidentModal';
import { CardModal } from '../components/Casino/Modals/CardModal';
import { CreditModal } from '../components/Casino/Modals/CreditModal';
import { CreditActionModal, CreditAction } from '../components/Casino/Modals/CreditActionModal';
import { VisitCheckInModal } from '../components/Casino/Modals/VisitCheckInModal';

import type {
  CasinoRoom,
  CasinoCashier,
  CasinoSession,
  ChipType,
  ChipMovement,
  CasinoCard,
  CasinoCredit,
  DashboardStats,
  Client,
} from '../components/Casino/types';

export const CasinoPage: React.FC = () => {
  // États principaux
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Données
  const [dashboard, setDashboard] = useState<DashboardStats | null>(null);
  const [rooms, setRooms] = useState<CasinoRoom[]>([]);
  const [cashiers, setCashiers] = useState<CasinoCashier[]>([]);
  const [sessions, setSessions] = useState<CasinoSession[]>([]);
  const [chipTypes, setChipTypes] = useState<ChipType[]>([]);
  const [chips, setChips] = useState<ChipMovement[]>([]);
  const [cards, setCards] = useState<CasinoCard[]>([]);
  const [credits, setCredits] = useState<CasinoCredit[]>([]);

  // Modales
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showCashierModal, setShowCashierModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [closingSession, setClosingSession] = useState<CasinoSession | null>(null);
  const [operationKind, setOperationKind] = useState<OperationKind | null>(null);
  const [chipOperation, setChipOperation] = useState<ChipOperation | null>(null);
  const [chipTypeModal, setChipTypeModal] = useState<{ mode: 'create' | 'edit'; chipType: ChipType | null } | null>(
    null
  );
  const [showClientQuickAdd, setShowClientQuickAdd] = useState(false);
  const [statusClient, setStatusClient] = useState<{ id: number; nom: string; prenom?: string } | null>(null);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditAction, setCreditAction] = useState<{ credit: CasinoCredit; action: CreditAction } | null>(null);
  const [showVisitModal, setShowVisitModal] = useState(false);

  // Chargement des données
  const refreshAll = useCallback(() => {
    setLoadError(null);
    return Promise.all([fetchCasinoBundle(), fetchSessions(), fetchChips()])
      .then(([bundle, allSessions, allChips]) => {
        setDashboard(bundle.dashboard);
        setRooms(bundle.rooms);
        setCashiers(bundle.cashiers);
        setChipTypes(bundle.chipTypes);
        setCards(bundle.cards);
        setCredits(bundle.credits);
        setSessions(allSessions);
        setChips(allChips);
      })
      .catch((err) => {
        console.error('Erreur chargement module casino', err);
        setLoadError('Impossible de charger les données du casino. Réessayez.');
      });
  }, []);

  useEffect(() => {
    setLoading(true);
    refreshAll().finally(() => setLoading(false));
  }, [refreshAll]);

  // Statistiques d'en-tête (issues du dashboard temps réel)
  const stats = dashboard
    ? [
        { label: 'Salles ouvertes', value: `${dashboard.salles_ouvertes}/${dashboard.salles_total}`, icon: <Dices size={20} className="text-black" /> },
        { label: 'Sessions ouvertes', value: dashboard.sessions_ouvertes, icon: <TrendingUp size={20} className="text-black" /> },
        { label: 'Produit net (jour)', value: formatCurrency(dashboard.produit_net_jour), icon: <TrendingDown size={20} className="text-black" /> },
        { label: 'Incidents ouverts', value: dashboard.incidents_ouverts, icon: <AlertTriangle size={20} className="text-black" /> },
      ]
    : [];

  // --- Handlers -------------------------------------------------------------

  const handleAddRoom = async (data: Parameters<typeof apiCreateRoom>[0]) => {
    const room = await apiCreateRoom(data);
    setRooms((prev) => [...prev, room]);
    refreshAll();
  };

  const handleAddCashier = async (data: Parameters<typeof apiCreateCashier>[0]) => {
    console.log('handleAddCashier', data);
    const cashier = await apiCreateCashier(data);
    setCashiers((prev) => [...prev, cashier]);
  };

  const handleOpenSession = async (data: { cashier_id: number; fond_initial: number }) => {
    const session = await apiOpenSession(data);
    setSessions((prev) => [...prev, session]);
    refreshAll();
  };

  const handleCloseSession = async (id: number, data: { fond_final_declare: number; commentaire?: string }) => {
    const session = await apiCloseSession(id, data);
    setSessions((prev) => prev.map((s) => (s.id === id ? session : s)));
    refreshAll();
  };

  const handleOperation = async (kind: OperationKind, data: Parameters<typeof recordBuyIn>[0]) => {
    if (kind === 'buy-in') await recordBuyIn(data);
    else if (kind === 'cash-out') await recordCashOut(data);
    else await recordDeposit(data);
    refreshAll();
  };

  const handleChipOperation = async (op: ChipOperation, data: Parameters<typeof buyChips>[0]) => {
    if (op === 'buy') await buyChips(data);
    else await sellChips(data);
    refreshAll();
  };

  const handleCreateChipType = async (data: Pick<ChipType, 'code' | 'nom' | 'valeur_nominale' | 'couleur' | 'statut'>) => {
    const chipType = await apiCreateChipType(data);
    setChipTypes((prev) => [...prev, chipType]);
  };

  const handleUpdateChipType = async (
    id: number,
    data: Pick<ChipType, 'code' | 'nom' | 'valeur_nominale' | 'couleur' | 'statut'>
  ) => {
    const chipType = await apiUpdateChipType(id, data);
    setChipTypes((prev) => prev.map((ct) => (ct.id === id ? chipType : ct)));
  };

  const handleDeleteChipType = async (chipType: ChipType) => {
    await apiDeleteChipType(chipType.id);
    setChipTypes((prev) => prev.filter((ct) => ct.id !== chipType.id));
  };

  const handleQuickAddClient = async (data: { nom: string; prenom?: string; telephone?: string }) => {
    await apiQuickAddClient(data);
  };

  const handleSetClientStatus = async (clientId: number, data: { statut_special: string; motif: string }) => {
    await apiSetClientStatus(clientId, data as any);
  };

  const handleCreateIncident = async (data: Parameters<typeof apiCreateIncident>[0]) => {
    await apiCreateIncident(data);
    refreshAll();
  };

  const handleAddCard = async (data: Parameters<typeof apiCreateCard>[0]) => {
    const card = await apiCreateCard(data);
    setCards((prev) => [...prev, card]);
  };

  const handleGrantCredit = async (data: Parameters<typeof apiGrantCredit>[0]) => {
    const credit = await apiGrantCredit(data);
    setCredits((prev) => [...prev, credit]);
    refreshAll();
  };

  const handleCreditAction = async (
    creditId: number,
    action: CreditAction,
    data: { session_id?: number; montant: number; moyen_paiement: any }
  ) => {
    if (action === 'draw') {
      if (!data.session_id) throw new Error('Session requise pour un tirage.');
      await apiDrawCredit(creditId, { session_id: data.session_id, montant: data.montant, moyen_paiement: data.moyen_paiement });
    } else {
      await apiRepayCredit(creditId, { montant: data.montant, moyen_paiement: data.moyen_paiement, session_id: data.session_id });
    }
    refreshAll();
  };

  const handleCheckIn = async (data: Parameters<typeof apiCheckIn>[0]) => {
    await apiCheckIn(data);
  };

  // Props partagées transmises à chaque onglet
  const sharedProps = {
    dashboard,
    rooms,
    cashiers,
    sessions,
    chipTypes,
    chips,
    cards,
    credits,
    refreshAll,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    onNewRoom: () => setShowRoomModal(true),
    onNewCashier: () => setShowCashierModal(true),
    onNewSession: () => setShowSessionModal(true),
    onCloseSession: (session: CasinoSession) => setClosingSession(session),
    onNewOperation: (kind: OperationKind) => setOperationKind(kind),
    onNewChipOperation: (op: ChipOperation) => setChipOperation(op),
    onNewChipType: () => setChipTypeModal({ mode: 'create', chipType: null }),
    onEditChipType: (chipType: ChipType) => setChipTypeModal({ mode: 'edit', chipType }),
    onDeleteChipType: handleDeleteChipType,
    onNewClient: () => setShowClientQuickAdd(true),
    onNewCard: () => setShowCardModal(true),
    onNewCredit: () => setShowCreditModal(true),
    onCreditAction: (credit: CasinoCredit, action: CreditAction) => setCreditAction({ credit, action }),
    onNewIncident: () => setShowIncidentModal(true),
    onSetClientStatus: (client: { id: number; nom: string; prenom?: string }) => setStatusClient(client),
    onNewVisit: () => setShowVisitModal(true),
  };

  return (
    <div className="w-full max-w-full space-y-6 overflow-x-hidden p-6">
      {loadError && (
        <div className="rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: 'var(--color-danger-bg)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)' }}>
          {loadError}
        </div>
      )}
      {loading && rooms.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <p className="text-muted">Chargement du module casino…</p>
        </div>
      ) : (
        <>
          <CasinoHeader
            stats={stats}
            onNewRoom={() => setShowRoomModal(true)}
            onNewSession={() => setShowSessionModal(true)}
            onNewOperation={() => setOperationKind('buy-in')}
          />

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Rechercher une salle, un joueur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-4 pr-4 rounded-xl text-primary placeholder-subtle text-sm"
                style={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border)', outline: 'none' }}
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full sm:w-48 h-10 rounded-xl text-primary text-sm px-4"
              style={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border)', outline: 'none' }}
            >
              <option value="">Tous les statuts</option>
              <option value="OUVERTE">Ouverte</option>
              <option value="FERMEE">Fermée</option>
              <option value="EN_TRAVAUX">En travaux</option>
              <option value="MAINTENANCE">Maintenance</option>
            </select>
          </div>

          <CasinoTabs activeTab={activeTab} setActiveTab={setActiveTab} />

          <div className="w-full">
            {activeTab === 'overview' && <OverviewTab {...sharedProps} />}
            {activeTab === 'rooms' && <RoomsTab {...sharedProps} />}
            {activeTab === 'caisse' && <CaisseTab {...sharedProps} />}
            {activeTab === 'jetons' && <ChipsTab {...sharedProps} />}
            {activeTab === 'cards' && <CardsTab {...sharedProps} />}
            {activeTab === 'clients' && <ClientsTab {...sharedProps} />}
            {activeTab === 'visits' && <VisitsTab {...sharedProps} />}
          </div>

          {/* ========== MODALES ========== */}

          <RoomModal isOpen={showRoomModal} onClose={() => setShowRoomModal(false)} onSubmit={handleAddRoom} />

          <CashierModal
            isOpen={showCashierModal}
            onClose={() => setShowCashierModal(false)}
            rooms={rooms}
            onSubmit={handleAddCashier}
          />

          <SessionModal
            isOpen={showSessionModal}
            onClose={() => setShowSessionModal(false)}
            cashiers={cashiers}
            onSubmit={handleOpenSession}
          />

          <CloseSessionModal
            isOpen={!!closingSession}
            onClose={() => setClosingSession(null)}
            session={closingSession}
            onSubmit={handleCloseSession}
          />

          <OperationModal
            isOpen={!!operationKind}
            onClose={() => setOperationKind(null)}
            sessions={sessions}
            kind={operationKind || 'buy-in'}
            onSubmit={handleOperation}
          />

          <ChipModal
            isOpen={!!chipOperation}
            onClose={() => setChipOperation(null)}
            sessions={sessions}
            chipTypes={chipTypes}
            operation={chipOperation || 'buy'}
            onSubmit={handleChipOperation}
          />

          <ChipTypeModal
            isOpen={!!chipTypeModal}
            onClose={() => setChipTypeModal(null)}
            chipType={chipTypeModal?.chipType ?? null}
            onSubmit={(data) =>
              chipTypeModal?.mode === 'edit' && chipTypeModal.chipType
                ? handleUpdateChipType(chipTypeModal.chipType.id, data)
                : handleCreateChipType(data)
            }
          />

          <ClientQuickAddModal
            isOpen={showClientQuickAdd}
            onClose={() => setShowClientQuickAdd(false)}
            onSubmit={handleQuickAddClient}
          />

          <ClientStatusModal
            isOpen={!!statusClient}
            onClose={() => setStatusClient(null)}
            client={statusClient as Client | null}
            onSubmit={handleSetClientStatus}
          />

          <IncidentModal
            isOpen={showIncidentModal}
            onClose={() => setShowIncidentModal(false)}
            sessions={sessions}
            onSubmit={handleCreateIncident}
          />

          <CardModal isOpen={showCardModal} onClose={() => setShowCardModal(false)} onSubmit={handleAddCard} />

          <CreditModal
            isOpen={showCreditModal}
            onClose={() => setShowCreditModal(false)}
            sessions={sessions}
            onSubmit={handleGrantCredit}
          />

          <CreditActionModal
            isOpen={!!creditAction}
            onClose={() => setCreditAction(null)}
            credit={creditAction?.credit ?? null}
            sessions={sessions}
            action={creditAction?.action ?? 'draw'}
            onSubmit={handleCreditAction}
          />

          <VisitCheckInModal
            isOpen={showVisitModal}
            onClose={() => setShowVisitModal(false)}
            rooms={rooms}
            onSubmit={handleCheckIn}
          />
        </>
      )}
    </div>
  );
};