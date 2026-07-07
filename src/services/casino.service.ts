// ============================================================================
// casino.service.ts — client HTTP pour /api/casino/*
// Toutes les routes sont protégées par requireAuth (Authorization: Bearer <token>)
// Utilise l'instance axios centralisée (src/lib/api.ts) : token, refresh 401,
// timeout et gestion d'erreurs communs à toute l'application.
// ============================================================================

import api from '../lib/api';

import type {
  CasinoRoom,
  CasinoCashier,
  CasinoSession,
  SessionSummary,
  SessionTransactionRow,
  Client,
  ClientProfileBundle,
  ClientHistory,
  ClientConsumption,
  CasinoCard,
  CasinoClientProfile,
  CasinoIncident,
  ChipType,
  ChipMovement,
  CashOperation,
  CasinoCredit,
  CreditRepayment,
  ScoringConfigItem,
  CasinoScore,
  Visit,
  DashboardStats,
  ProduitNetRow,
  EcartCaisseRow,
  EncoursCreditRow,
  FluxASynchroniserRow,
  MoyenPaiement,
} from '../components/Casino/types';

const BASE_URL = '/api/casino';

async function request<T>(path: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', data?: unknown): Promise<T> {
  try {
    const response = await api.request<T>({
      url: `${BASE_URL}${path}`,
      method,
      data,
    });
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      `Erreur API (${error?.response?.status ?? '??'})`;
    throw new Error(message);
  }
}

const get = <T>(path: string) => request<T>(path, 'GET');
const post = <T>(path: string, data?: unknown) => request<T>(path, 'POST', data);
const put = <T>(path: string, data?: unknown) => request<T>(path, 'PUT', data);
const del = <T>(path: string) => request<T>(path, 'DELETE');

const qs = (params: Record<string, string | number | undefined | null>) => {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (!entries.length) return '';
  return '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&');
};

// ---------------------------------------------------------------------------
// Tableau de bord & rapports
// ---------------------------------------------------------------------------

export const fetchDashboard = () => get<DashboardStats>('/dashboard');

export const fetchProduitNet = (params: { salle?: string; du?: string; au?: string } = {}) =>
  get<ProduitNetRow[]>(`/reports/produit-net${qs(params)}`);

export const fetchEcartsCaisse = (params: { salle?: string; session_id?: number } = {}) =>
  get<EcartCaisseRow[]>(`/reports/ecarts-caisse${qs(params)}`);

export const fetchEncoursCredit = () => get<EncoursCreditRow[]>('/reports/encours-credit');

export const fetchFluxASynchroniser = () => get<FluxASynchroniserRow[]>('/reports/flux-a-synchroniser');

// ---------------------------------------------------------------------------
// Salles
// ---------------------------------------------------------------------------

export const fetchRooms = () => get<CasinoRoom[]>('/rooms');
export const fetchRoom = (id: number) => get<CasinoRoom>(`/rooms/${id}`);
export const createRoom = (data: Pick<CasinoRoom, 'code' | 'nom' | 'type_salle' | 'statut'>) =>
  post<CasinoRoom>('/rooms', data);
export const updateRoom = (id: number, data: Partial<CasinoRoom>) => put<CasinoRoom>(`/rooms/${id}`, data);
export const deleteRoom = (id: number) => del<void>(`/rooms/${id}`);

// ---------------------------------------------------------------------------
// Caisses
// ---------------------------------------------------------------------------

export const fetchCashiers = () => get<CasinoCashier[]>('/cashiers');
export const createCashier = (data: Pick<CasinoCashier, 'room_id' | 'code' | 'nom' | 'statut'>) =>
  post<CasinoCashier>('/cashiers', data);
export const updateCashier = (id: number, data: Partial<CasinoCashier>) =>
  put<CasinoCashier>(`/cashiers/${id}`, data);
export const deleteCashier = (id: number) => del<void>(`/cashiers/${id}`);

// ---------------------------------------------------------------------------
// Sessions de caisse
// ---------------------------------------------------------------------------

export const fetchActiveSessions = (cashierId?: number) =>
  get<CasinoSession[]>(`/sessions/active${qs({ cashier_id: cashierId })}`);

export const fetchSessions = () => get<CasinoSession[]>('/sessions');

export const openSession = (data: { cashier_id: number; fond_initial: number }) =>
  post<CasinoSession>('/sessions/open', data);

export const closeSession = (id: number, data: { fond_final_declare: number; commentaire?: string }) =>
  post<CasinoSession>(`/sessions/${id}/close`, data);

export const fetchSessionSummary = (id: number) => get<SessionSummary>(`/sessions/${id}/summary`);

export const fetchSessionTransactions = (id: number) =>
  get<SessionTransactionRow[]>(`/sessions/${id}/transactions`);

// ---------------------------------------------------------------------------
// Clients (sélection simple en caisse)
// ---------------------------------------------------------------------------

export const searchClients = (query: string) => get<Client[]>(`/clients/search${qs({ q: query })}`);

export const quickAddClient = (data: { nom: string; prenom?: string; telephone?: string }) =>
  post<Client>('/clients/quick-add', data);

export const fetchClientProfileBundle = (clientId: number) =>
  get<ClientProfileBundle>(`/clients/${clientId}/profile`);

export const fetchClientHistory = (clientId: number) => get<ClientHistory>(`/clients/${clientId}/history`);

export const fetchClientConsumption = (clientId: number) =>
  get<ClientConsumption>(`/clients/${clientId}/consumption`);

export const fetchClientIncidents = (clientId: number) =>
  get<CasinoIncident[]>(`/clients/${clientId}/incidents`);

// ---------------------------------------------------------------------------
// Cartes de fidélité
// ---------------------------------------------------------------------------

export const scanCard = (qrCode: string) =>
  get<{ card: CasinoCard; client: Client; profile: CasinoClientProfile | null }>(
    `/cards/scan/${encodeURIComponent(qrCode)}`
  );

export const fetchCardByClient = (clientId: number) => get<CasinoCard>(`/cards/by-client/${clientId}`);

export const adjustCardPoints = (cardId: number, points: number) =>
  post<CasinoCard>(`/cards/${cardId}/points`, { points });

export const fetchCards = () => get<CasinoCard[]>('/cards');
export const createCard = (
  data: Pick<CasinoCard, 'client_id' | 'numero_carte' | 'qr_code' | 'niveau' | 'plafond_credit' | 'statut' | 'date_emission'>
) => post<CasinoCard>('/cards', data);
export const updateCard = (id: number, data: Partial<CasinoCard>) => put<CasinoCard>(`/cards/${id}`, data);
export const deleteCard = (id: number) => del<void>(`/cards/${id}`);

// ---------------------------------------------------------------------------
// Antécédents client (statut spécial & incidents)
// ---------------------------------------------------------------------------

export const setClientStatus = (clientId: number, data: { statut_special: string; motif: string }) =>
  post<CasinoClientProfile>(`/client-profiles/${clientId}/statut`, data);

export const fetchClientProfiles = () => get<CasinoClientProfile[]>('/client-profiles');

export const fetchIncidents = () => get<CasinoIncident[]>('/incidents');
export const createIncident = (
  data: Pick<CasinoIncident, 'client_id' | 'session_id' | 'type' | 'gravite' | 'description' | 'statut'>
) => post<CasinoIncident>('/incidents', data);
export const updateIncident = (id: number, data: Partial<CasinoIncident>) =>
  put<CasinoIncident>(`/incidents/${id}`, data);
export const deleteIncident = (id: number) => del<void>(`/incidents/${id}`);

// ---------------------------------------------------------------------------
// Types de jetons
// ---------------------------------------------------------------------------

export const fetchChipTypes = () => get<ChipType[]>('/chip-types');
export const createChipType = (data: Pick<ChipType, 'code' | 'nom' | 'valeur_nominale' | 'couleur' | 'statut'>) =>
  post<ChipType>('/chip-types', data);
export const updateChipType = (id: number, data: Partial<ChipType>) => put<ChipType>(`/chip-types/${id}`, data);
export const deleteChipType = (id: number) => del<void>(`/chip-types/${id}`);

// ---------------------------------------------------------------------------
// Jetons — achat / reprise
// ---------------------------------------------------------------------------

export interface ChipMoveInput {
  session_id: number;
  chip_type_id: number;
  quantite: number;
  client_id?: number;
  client_libre?: string;
  moyen_paiement: MoyenPaiement;
}

export const buyChips = (data: ChipMoveInput) => post<ChipMovement>('/chips/buy', data);
export const sellChips = (data: ChipMoveInput) => post<ChipMovement>('/chips/sell', data);
export const fetchChipsByClient = (clientId: number) => get<ChipMovement[]>(`/chips/by-client/${clientId}`);
export const fetchChips = () => get<ChipMovement[]>('/chips');

// ---------------------------------------------------------------------------
// Opérations de caisse (buy-in / cash-out / dépôt)
// ---------------------------------------------------------------------------

export interface CashOperationInput {
  session_id: number;
  montant: number;
  moyen_paiement: MoyenPaiement;
  client_id?: number;
  client_libre?: string;
}

export const recordBuyIn = (data: CashOperationInput) => post<CashOperation>('/operations/buy-in', data);
export const recordCashOut = (data: CashOperationInput) => post<CashOperation>('/operations/cash-out', data);
export const recordDeposit = (data: CashOperationInput) => post<CashOperation>('/operations/deposit', data);
export const fetchOperations = () => get<CashOperation[]>('/operations');

// ---------------------------------------------------------------------------
// Crédits joueur
// ---------------------------------------------------------------------------

export const grantCredit = (data: { client_id: number; montant: number; echeance: string; session_id: number }) =>
  post<CasinoCredit>('/credits/grant', data);

export const drawCredit = (
  creditId: number,
  data: { session_id: number; montant: number; moyen_paiement: MoyenPaiement }
) => post<CashOperation>(`/credits/${creditId}/draw`, data);

export const repayCredit = (
  creditId: number,
  data: { montant: number; moyen_paiement: MoyenPaiement; session_id?: number }
) => post<CreditRepayment>(`/credits/${creditId}/repay`, data);

export const fetchActiveCreditsByClient = (clientId: number) =>
  get<CasinoCredit[]>(`/credits/by-client/${clientId}/active`);

export const fetchCredits = () => get<CasinoCredit[]>('/credits');

// ---------------------------------------------------------------------------
// Scoring de crédit joueur
// ---------------------------------------------------------------------------

export const fetchScoringConfig = () => get<ScoringConfigItem[]>('/scoring/config');
export const updateScoringConfig = (data: { cle: string; valeur: string }) =>
  put<ScoringConfigItem>('/scoring/config', data);

export const computeScore = (clientId: number) => post<CasinoScore>(`/scoring/${clientId}/compute`);
export const fetchScoreHistory = (clientId: number) => get<CasinoScore[]>(`/scoring/${clientId}/history`);
export const decideScore = (
  scoreId: number,
  data: { decision: 'VALIDEE' | 'CONTESTEE' | 'ANNULEE'; commentaire?: string }
) => post<CasinoScore>(`/scoring/${scoreId}/decision`, data);

// ---------------------------------------------------------------------------
// Visites de salle
// ---------------------------------------------------------------------------

export const checkIn = (
  data: { room_id: number; qr_code: string } | { room_id: number; client_id: number; entree_via: 'MANUEL' }
) => post<Visit>('/visits/check-in', data);

export const checkOut = (visitId: number) => post<Visit>(`/visits/${visitId}/check-out`);

export const fetchVisitsInRoom = (roomId: number) => get<Visit[]>(`/visits/in-room/${roomId}`);

export const fetchVisits = () => get<Visit[]>('/visits');

// ---------------------------------------------------------------------------
// Chargement groupé pour l'initialisation de la page
// ---------------------------------------------------------------------------

export interface CasinoBundle {
  dashboard: DashboardStats;
  rooms: CasinoRoom[];
  cashiers: CasinoCashier[];
  activeSessions: CasinoSession[];
  chipTypes: ChipType[];
  cards: CasinoCard[];
  credits: CasinoCredit[];
}

export async function fetchCasinoBundle(): Promise<CasinoBundle> {
  const [dashboard, rooms, cashiers, activeSessions, chipTypes, cards, credits] = await Promise.all([
    fetchDashboard(),
    fetchRooms(),
    fetchCashiers(),
    fetchActiveSessions(),
    fetchChipTypes(),
    fetchCards(),
    fetchCredits(),
  ]);
  return { dashboard, rooms, cashiers, activeSessions, chipTypes, cards, credits };
}