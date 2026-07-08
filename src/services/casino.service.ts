// =========================================================================
// Casino — Service API
// Toutes les routes sont montées sous /api/casino et protégées par
// requireAuth (Bearer token). Voir CASINO_README.md pour le détail.
// =========================================================================

import type {
  Room,
  Cashier,
  CashSession,
  SessionSummary,
  SessionTransaction,
  Client,
  ClientFullProfile,
  ClientHistory,
  ClientConsumption,
  Incident,
  ChipType,
  ChipTransaction,
  CashOperation,
  PlayerCredit,
  CreditRepayment,
  ScoringConfigItem,
  Score,
  Visit,
  LoyaltyCard,
  ClientProfile,
  CasinoDashboard,
  ProduitNetRow,
  EcartCaisseRow,
  EncoursCreditRow,
  FluxASynchroniserRow,
  OpenSessionPayload,
  CloseSessionPayload,
  QuickAddClientPayload,
  CashOperationPayload,
  ChipMovementPayload,
  CreditGrantPayload,
  CreditDrawPayload,
  CreditRepayPayload,
  ClientStatutPayload,
  ScoreDecisionPayload,
  CheckInPayload,
  ID,
} from '../types/casino.types';

import api from '../lib/api';
import type { AxiosError } from 'axios';

// Base relative à l'instance axios partagée (`api.ts`), qui porte déjà
// baseURL (VITE_API_URL), le header Authorization (clé 'auth-token') et
// la logique de refresh automatique sur 401.
const BASE_URL = '/api/casino';

export class ApiError extends Error {
  status: number;
  payload: unknown;
  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

async function request<T>(
  path: string,
  options: { method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; body?: unknown } = {}
): Promise<T> {
  try {
    const res = await api.request<T>({
      url: `${BASE_URL}${path}`,
      method: options.method || 'GET',
      data: options.body,
    });

    // axios renvoie déjà `undefined`/vide pour un 204, rien à gérer en plus.
    return res.data;
  } catch (err) {
    const axiosErr = err as AxiosError<any>;
    const status = axiosErr.response?.status ?? 0;
    const data = axiosErr.response?.data ?? null;
    const message =
      (data && (data.message || data.error)) || axiosErr.message || `Erreur API (${status})`;
    throw new ApiError(status, message, data);
  }
}

const get = <T>(path: string) => request<T>(path, { method: 'GET' });
const post = <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body });
const put = <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body });
const del = <T>(path: string) => request<T>(path, { method: 'DELETE' });

function qs(params: Record<string, string | number | undefined | null>): string {
  const usable = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (!usable.length) return '';
  const search = new URLSearchParams(usable.map(([k, v]) => [k, String(v)]));
  return `?${search.toString()}`;
}

// -------------------------------------------------------------------------
// Dashboard & consolidation
// -------------------------------------------------------------------------

export const dashboardApi = {
  get: () => get<CasinoDashboard>('/dashboard'),
};

export const reportsApi = {
  produitNet: (params?: { salle?: string; du?: string; au?: string }) =>
    get<ProduitNetRow[]>(`/reports/produit-net${qs(params || {})}`),
  ecartsCaisse: (params?: { salle?: string; session_id?: ID }) =>
    get<EcartCaisseRow[]>(`/reports/ecarts-caisse${qs(params || {})}`),
  encoursCredit: () => get<EncoursCreditRow[]>('/reports/encours-credit'),
  fluxASynchroniser: () => get<FluxASynchroniserRow[]>('/reports/flux-a-synchroniser'),
};

// -------------------------------------------------------------------------
// Salles & caisses
// -------------------------------------------------------------------------

export const roomsApi = {
  list: () => get<Room[]>('/rooms'),
  get: (id: ID) => get<Room>(`/rooms/${id}`),
  create: (payload: Partial<Room>) => post<Room>('/rooms', payload),
  update: (id: ID, payload: Partial<Room>) => put<Room>(`/rooms/${id}`, payload),
  remove: (id: ID) => del<void>(`/rooms/${id}`),
};

export const cashiersApi = {
  list: (params?: { room_id?: ID }) => get<Cashier[]>(`/cashiers${qs(params || {})}`),
  get: (id: ID) => get<Cashier>(`/cashiers/${id}`),
  create: (payload: Partial<Cashier>) => post<Cashier>('/cashiers', payload),
  update: (id: ID, payload: Partial<Cashier>) => put<Cashier>(`/cashiers/${id}`, payload),
  remove: (id: ID) => del<void>(`/cashiers/${id}`),
};

// -------------------------------------------------------------------------
// Sessions de caisse
// -------------------------------------------------------------------------

export const sessionsApi = {
  active: (cashierId?: ID) => get<CashSession[]>(`/sessions/active${qs({ cashier_id: cashierId })}`),
  open: (payload: OpenSessionPayload) => post<CashSession>('/sessions/open', payload),
  close: (id: ID, payload: CloseSessionPayload) => post<CashSession>(`/sessions/${id}/close`, payload),
  summary: (id: ID) => get<SessionSummary>(`/sessions/${id}/summary`),
  transactions: (id: ID) => get<SessionTransaction[]>(`/sessions/${id}/transactions`),
  list: () => get<CashSession[]>('/sessions'),
  get: (id: ID) => get<CashSession>(`/sessions/${id}`),
};

// -------------------------------------------------------------------------
// Clients en caisse (sans carte)
// -------------------------------------------------------------------------

export const clientsApi = {
  search: (q: string) => get<Client[]>(`/clients/search${qs({ q })}`),
  quickAdd: (payload: QuickAddClientPayload) => post<Client>('/clients/quick-add', payload),
  profile: (id: ID) => get<ClientFullProfile>(`/clients/${id}/profile`),
  history: (id: ID) => get<ClientHistory>(`/clients/${id}/history`),
  consumption: (id: ID) => get<ClientConsumption>(`/clients/${id}/consumption`),
  incidents: (id: ID) => get<Incident[]>(`/clients/${id}/incidents`),
};

// -------------------------------------------------------------------------
// Cartes de fidélité + scan QR
// -------------------------------------------------------------------------

export const cardsApi = {
  scan: (qrCode: string) =>
    get<{ card: LoyaltyCard; client: Client; profile: ClientProfile | null }>(
      `/cards/scan/${encodeURIComponent(qrCode)}`
    ),
  byClient: (clientId: ID) => get<LoyaltyCard>(`/cards/by-client/${clientId}`),
  addPoints: (cardId: ID, points: number) => post<LoyaltyCard>(`/cards/${cardId}/points`, { points }),
  list: () => get<LoyaltyCard[]>('/cards'),
  get: (id: ID) => get<LoyaltyCard>(`/cards/${id}`),
  create: (payload: Partial<LoyaltyCard>) => post<LoyaltyCard>('/cards', payload),
  update: (id: ID, payload: Partial<LoyaltyCard>) => put<LoyaltyCard>(`/cards/${id}`, payload),
  remove: (id: ID) => del<void>(`/cards/${id}`),
};

// -------------------------------------------------------------------------
// Antécédents client (statut & incidents)
// -------------------------------------------------------------------------

export const clientProfilesApi = {
  setStatut: (clientId: ID, payload: ClientStatutPayload) =>
    post<ClientProfile>(`/client-profiles/${clientId}/statut`, payload),
  list: () => get<ClientProfile[]>('/client-profiles'),
  create: (payload: Partial<ClientProfile>) => post<ClientProfile>('/client-profiles', payload),
  update: (id: ID, payload: Partial<ClientProfile>) => put<ClientProfile>(`/client-profiles/${id}`, payload),
  remove: (id: ID) => del<void>(`/client-profiles/${id}`),
};

export const incidentsApi = {
  list: (params?: { client_id?: ID; statut?: string }) => get<Incident[]>(`/incidents${qs(params || {})}`),
  get: (id: ID) => get<Incident>(`/incidents/${id}`),
  create: (payload: Partial<Incident>) => post<Incident>('/incidents', payload),
  update: (id: ID, payload: Partial<Incident>) => put<Incident>(`/incidents/${id}`, payload),
  remove: (id: ID) => del<void>(`/incidents/${id}`),
};

// -------------------------------------------------------------------------
// Jetons
// -------------------------------------------------------------------------

export const chipTypesApi = {
  list: () => get<ChipType[]>('/chip-types'),
  get: (id: ID) => get<ChipType>(`/chip-types/${id}`),
  create: (payload: Partial<ChipType>) => post<ChipType>('/chip-types', payload),
  update: (id: ID, payload: Partial<ChipType>) => put<ChipType>(`/chip-types/${id}`, payload),
  remove: (id: ID) => del<void>(`/chip-types/${id}`),
};

export const chipsApi = {
  buy: (payload: ChipMovementPayload) => post<ChipTransaction>('/chips/buy', payload),
  sell: (payload: ChipMovementPayload) => post<ChipTransaction>('/chips/sell', payload),
  byClient: (clientId: ID) => get<ChipTransaction[]>(`/chips/by-client/${clientId}`),
  list: () => get<ChipTransaction[]>('/chips'),
};

// -------------------------------------------------------------------------
// Opérations de caisse
// -------------------------------------------------------------------------

export const operationsApi = {
  buyIn: (payload: CashOperationPayload) => post<CashOperation>('/operations/buy-in', payload),
  cashOut: (payload: CashOperationPayload) => post<CashOperation>('/operations/cash-out', payload),
  deposit: (payload: CashOperationPayload) => post<CashOperation>('/operations/deposit', payload),
  list: () => get<CashOperation[]>('/operations'),
};

// -------------------------------------------------------------------------
// Crédits joueur
// -------------------------------------------------------------------------

export const creditsApi = {
  grant: (payload: CreditGrantPayload) => post<PlayerCredit>('/credits/grant', payload),
  draw: (id: ID, payload: CreditDrawPayload) => post<CashOperation>(`/credits/${id}/draw`, payload),
  repay: (id: ID, payload: CreditRepayPayload) => post<CreditRepayment>(`/credits/${id}/repay`, payload),
  activeByClient: (clientId: ID) => get<PlayerCredit[]>(`/credits/by-client/${clientId}/active`),
  list: () => get<PlayerCredit[]>('/credits'),
  get: (id: ID) => get<PlayerCredit>(`/credits/${id}`),
};

// -------------------------------------------------------------------------
// Scoring de crédit joueur
// -------------------------------------------------------------------------

export const scoringApi = {
  getConfig: () => get<ScoringConfigItem[]>('/scoring/config'),
  updateConfig: (cle: string, valeur: string) => put<ScoringConfigItem>('/scoring/config', { cle, valeur }),
  compute: (clientId: ID) => post<Score>(`/scoring/${clientId}/compute`),
  history: (clientId: ID) => get<Score[]>(`/scoring/${clientId}/history`),
  decide: (scoreId: ID, payload: ScoreDecisionPayload) => post<Score>(`/scoring/${scoreId}/decision`, payload),
  list: () => get<Score[]>('/scoring'),
};

// -------------------------------------------------------------------------
// Visites de salle
// -------------------------------------------------------------------------

export const visitsApi = {
  checkIn: (payload: CheckInPayload) => post<Visit>('/visits/check-in', payload),
  checkOut: (id: ID) => post<Visit>(`/visits/${id}/check-out`),
  inRoom: (roomId: ID) => get<Visit[]>(`/visits/in-room/${roomId}`),
  list: () => get<Visit[]>('/visits'),
};

// -------------------------------------------------------------------------
// Export groupé (facilite l'import : `import { casinoApi } from './casino.service'`)
// -------------------------------------------------------------------------

export const casinoApi = {
  dashboard: dashboardApi,
  reports: reportsApi,
  rooms: roomsApi,
  cashiers: cashiersApi,
  sessions: sessionsApi,
  clients: clientsApi,
  cards: cardsApi,
  clientProfiles: clientProfilesApi,
  incidents: incidentsApi,
  chipTypes: chipTypesApi,
  chips: chipsApi,
  operations: operationsApi,
  credits: creditsApi,
  scoring: scoringApi,
  visits: visitsApi,
};

export default casinoApi;