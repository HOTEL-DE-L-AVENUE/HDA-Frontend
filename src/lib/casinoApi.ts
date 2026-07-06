// src/lib/casinoApi.ts
//
// Couche d'accès à l'API pour le module Casino. Toutes les fonctions renvoient
// directement les données utiles (sans l'enveloppe { success, data, meta }).
// Absorbe ici les petits écarts de nommage entre les formulaires front et les
// routes backend, pour ne pas avoir à toucher aux composants Modal existants.

import api from './api';
import type {
  CasinoRoom,
  CasinoCashier,
  CasinoSession,
  CasinoCard,
  CasinoCredit,
  CasinoTransaction,
  CasinoChipTransaction,
  Client,
  RoomFormData,
  CashierFormData,
  SessionFormData,
  TransactionFormData,
  ChipTransactionFormData,
  CardFormData,
  CreditFormData,
} from '../components/Casino/types';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  meta?: { page: number; limit: number; total: number; totalPages?: number };
}

// Le backend plafonne actuellement la pagination à 100 lignes par requête
// (voir hda-backend/utils/queryHelpers.js -> maxLimit). Suffisant pour l'instant ;
// à revoir avec des endpoints dédiés si le volume de données du casino grandit.
const LIST_LIMIT = 100;

// ---------------------------------------------------------------------------
// Lecture — listes complètes
// ---------------------------------------------------------------------------

export const fetchClients = async (): Promise<Client[]> => {
  const { data } = await api.get<ApiEnvelope<Client[]>>('/api/clients', { params: { limit: LIST_LIMIT } });
  return data.data;
};

export const fetchRooms = async (): Promise<CasinoRoom[]> => {
  const { data } = await api.get<ApiEnvelope<CasinoRoom[]>>('/api/casino/rooms', { params: { limit: LIST_LIMIT } });
  return data.data;
};

export const fetchCashiers = async (): Promise<CasinoCashier[]> => {
  const { data } = await api.get<ApiEnvelope<CasinoCashier[]>>('/api/casino/cashiers', { params: { limit: LIST_LIMIT } });
  return data.data;
};

export const fetchSessions = async (): Promise<CasinoSession[]> => {
  const { data } = await api.get<ApiEnvelope<CasinoSession[]>>('/api/casino/sessions', { params: { limit: LIST_LIMIT } });
  return data.data;
};

export const fetchCards = async (): Promise<CasinoCard[]> => {
  const { data } = await api.get<ApiEnvelope<CasinoCard[]>>('/api/casino/cards', { params: { limit: LIST_LIMIT } });
  return data.data;
};

export const fetchCredits = async (): Promise<CasinoCredit[]> => {
  const { data } = await api.get<ApiEnvelope<CasinoCredit[]>>('/api/casino/credits', { params: { limit: LIST_LIMIT } });
  return data.data;
};

export const fetchTransactions = async (): Promise<CasinoTransaction[]> => {
  const { data } = await api.get<ApiEnvelope<CasinoTransaction[]>>('/api/casino/transactions', { params: { limit: LIST_LIMIT } });
  return data.data;
};

export const fetchChipTransactions = async (): Promise<CasinoChipTransaction[]> => {
  const { data } = await api.get<ApiEnvelope<CasinoChipTransaction[]>>('/api/casino/chips', { params: { limit: LIST_LIMIT } });
  return data.data;
};

// Charge tout le module en parallèle (un seul point d'appel pour CasinoPage)
export const fetchCasinoBundle = async () => {
  const [clients, rooms, cashiers, sessions, cards, credits, transactions, chipTransactions] = await Promise.all([
    fetchClients(),
    fetchRooms(),
    fetchCashiers(),
    fetchSessions(),
    fetchCards(),
    fetchCredits(),
    fetchTransactions(),
    fetchChipTransactions(),
  ]);
  return { clients, rooms, cashiers, sessions, cards, credits, transactions, chipTransactions };
};

// ---------------------------------------------------------------------------
// Écriture — créations et actions métier
// ---------------------------------------------------------------------------

export const createRoom = async (form: RoomFormData): Promise<CasinoRoom> => {
  const { data } = await api.post<ApiEnvelope<CasinoRoom>>('/api/casino/rooms', form);
  return data.data;
};

export const createCashier = async (form: CashierFormData): Promise<CasinoCashier> => {
  const { data } = await api.post<ApiEnvelope<CasinoCashier>>('/api/casino/cashiers', form);
  return data.data;
};

// L'agent qui ouvre la session (user_id) est déduit du token JWT côté backend :
// on n'envoie donc pas le user_id du formulaire, il ne serait pas pris en compte.
export const openSession = async (form: SessionFormData): Promise<CasinoSession> => {
  const { data } = await api.post<ApiEnvelope<CasinoSession>>('/api/casino/sessions/open', {
    cashier_id: form.cashier_id,
    fond_initial: form.fond_initial,
  });
  return data.data;
};

// Pas encore branché sur un écran (aucun CloseSessionModal fourni) mais prêt à l'emploi :
// l'écart de caisse est calculé automatiquement côté backend.
export const closeSession = async (sessionId: number, fondFinal: number): Promise<CasinoSession> => {
  const { data } = await api.post<ApiEnvelope<CasinoSession>>(`/api/casino/sessions/${sessionId}/close`, {
    fond_final: fondFinal,
  });
  return data.data;
};

export const recordTransaction = async (form: TransactionFormData): Promise<CasinoTransaction> => {
  const { data } = await api.post<ApiEnvelope<CasinoTransaction>>('/api/casino/transactions/record', form);
  return data.data;
};

// Le backend expose deux routes distinctes (achat / reprise de jetons) plutôt qu'un
// type libre : on route selon transaction_type. GAIN/PERTE n'existent pas côté jetons
// (voir note dans types.ts) et retombent par défaut sur un achat.
export const recordChipTransaction = async (form: ChipTransactionFormData): Promise<CasinoChipTransaction> => {
  const endpoint = form.transaction_type === 'RACHAT' ? '/api/casino/chips/sell' : '/api/casino/chips/buy';
  const { data } = await api.post<ApiEnvelope<CasinoChipTransaction>>(endpoint, {
    client_id: form.client_id,
    quantite: form.quantite,
    valeur_unitaire: form.valeur_unitaire,
  });
  return data.data;
};

// Le numéro de carte n'est pas généré par le backend (colonne libre) : on le
// construit ici de façon lisible et raisonnablement unique.
export const createCard = async (form: CardFormData): Promise<CasinoCard> => {
  const numero_carte = `CARD-${form.client_id}-${Date.now().toString(36).toUpperCase()}`;
  const { data } = await api.post<ApiEnvelope<CasinoCard>>('/api/casino/cards', {
    client_id: form.client_id,
    niveau: form.niveau,
    numero_carte,
    points: 0,
  });
  return data.data;
};

export const addCardPoints = async (cardId: number, points: number): Promise<CasinoCard> => {
  const { data } = await api.post<ApiEnvelope<CasinoCard>>(`/api/casino/cards/${cardId}/points`, { points });
  return data.data;
};

// Le formulaire utilise "montant_accorde" (nom de la colonne DB) alors que la route
// métier /credits/grant attend "montant" : conversion faite ici, pas dans le formulaire.
export const grantCredit = async (form: CreditFormData): Promise<CasinoCredit> => {
  const { data } = await api.post<ApiEnvelope<CasinoCredit>>('/api/casino/credits/grant', {
    client_id: form.client_id,
    montant: form.montant_accorde,
    echeance: form.echeance || undefined,
  });
  return data.data;
};

export const repayCredit = async (creditId: number, montant: number): Promise<CasinoCredit> => {
  const { data } = await api.post<ApiEnvelope<CasinoCredit>>(`/api/casino/credits/${creditId}/repay`, { montant });
  return data.data;
};

export const dashboardSummary = async (): Promise<{
  visiteurs_actifs: number;
  sessions_ouvertes: number;
  encours_credits_actifs: number;
  volume_jetons_aujourdhui: number;
}> => {
  const { data } = await api.get('/api/casino/dashboard');
  return data.data;
};