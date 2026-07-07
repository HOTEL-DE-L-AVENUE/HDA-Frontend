import type {
  CasinoRoom,
  CasinoCashier,
  CasinoSession,
  ChipType,
  CasinoCard,
  CasinoCredit,
  DashboardStats,
} from './types';

// Données et callbacks communs, transmis à chaque onglet du module Casino.
export interface CasinoSharedProps {
  dashboard: DashboardStats | null;
  rooms: CasinoRoom[];
  cashiers: CasinoCashier[];
  sessions: CasinoSession[];
  chipTypes: ChipType[];
  cards: CasinoCard[];
  credits: CasinoCredit[];
  refreshAll: () => void;

  searchQuery: string;
  setSearchQuery: (v: string) => void;
  filterStatus: string;
  setFilterStatus: (v: string) => void;

  onNewRoom: () => void;
  onNewCashier: () => void;
  onNewSession: () => void;
  onCloseSession: (session: CasinoSession) => void;
  onNewOperation: (kind: 'buy-in' | 'cash-out' | 'deposit') => void;
  onNewChipOperation: (op: 'buy' | 'sell') => void;
  onNewClient: () => void;
  onNewCard: () => void;
  onNewCredit: () => void;
  onCreditAction: (credit: CasinoCredit, action: 'draw' | 'repay') => void;
  onNewIncident: () => void;
  onSetClientStatus: (client: { id: number; nom: string; prenom?: string }) => void;
  onNewVisit: () => void;
}
