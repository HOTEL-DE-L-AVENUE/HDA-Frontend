// =========================================================================
// Casino — Tables de jeu, Caves/Recaves, Prolongations & Pourboires
// Remplace src/services/casinoTablesJeu.service.ts (version précédente + ajouts)
// =========================================================================

import api from '../lib/api';
import type { ID } from '../types/casino.types';
import type {
  TableJeu,
  TableCave,
  CaveMovementPayload,
  TableProlongation,
  ProlongationPayload,
  TablePourboire,
  PourboirePayload,
  FeuilleTable,
} from '../types/casinoTablesJeu.types';

const BASE_URL = '/api/casino';

function qs(params: Record<string, string | number | undefined | null>): string {
  const usable = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (!usable.length) return '';
  const search = new URLSearchParams(usable.map(([k, v]) => [k, String(v)]));
  return `?${search.toString()}`;
}

async function get<T>(path: string): Promise<T> {
  const response = await api.get<T>(`${BASE_URL}${path}`);
  return response.data;
}
async function post<T>(path: string, body?: unknown): Promise<T> {
  const response = await api.post<T>(`${BASE_URL}${path}`, body);
  return response.data;
}
async function put<T>(path: string, body?: unknown): Promise<T> {
  const response = await api.put<T>(`${BASE_URL}${path}`, body);
  return response.data;
}
async function del<T>(path: string): Promise<T> {
  const response = await api.delete<T>(`${BASE_URL}${path}`);
  return response.data;
}

export const tablesJeuApi = {
  list: (params?: { room_id?: ID }) => get<TableJeu[]>(`/tables-jeu${qs(params || {})}`),
  get: (id: ID) => get<TableJeu>(`/tables-jeu/${id}`),
  create: (payload: Partial<TableJeu>) => post<TableJeu>('/tables-jeu', payload),
  update: (id: ID, payload: Partial<TableJeu>) => put<TableJeu>(`/tables-jeu/${id}`, payload),
  remove: (id: ID) => del<void>(`/tables-jeu/${id}`),
  ouvrir: (id: ID) => post<TableJeu>(`/tables-jeu/${id}/ouvrir`),
  fermer: (id: ID) => post<TableJeu>(`/tables-jeu/${id}/fermer`),
  archiver: (id: ID) => post<TableJeu>(`/tables-jeu/${id}/archiver`),
  desarchiver: (id: ID) => post<TableJeu>(`/tables-jeu/${id}/desarchiver`),

  // Caves / recaves
  addCave: (tableId: ID, payload: CaveMovementPayload) =>
    post<TableCave>(`/tables-jeu/${tableId}/caves`, payload),
  listCaves: (tableId: ID, params?: { date?: string }) =>
    get<TableCave[]>(`/tables-jeu/${tableId}/caves${qs(params || {})}`),

  // Prolongations (salaire horaire croupier, à charge du joueur)
  addProlongation: (tableId: ID, payload: ProlongationPayload) =>
    post<TableProlongation>(`/tables-jeu/${tableId}/prolongations`, payload),
  listProlongations: (tableId: ID, params?: { date?: string }) =>
    get<TableProlongation[]>(`/tables-jeu/${tableId}/prolongations${qs(params || {})}`),

  // Pourboires (déclaratif, jetons ou espèces)
  addPourboire: (tableId: ID, payload: PourboirePayload) =>
    post<TablePourboire>(`/tables-jeu/${tableId}/pourboires`, payload),
  listPourboires: (tableId: ID, params?: { date?: string }) =>
    get<TablePourboire[]>(`/tables-jeu/${tableId}/pourboires${qs(params || {})}`),

  feuille: (tableId: ID, params?: { date?: string }) =>
    get<FeuilleTable>(`/tables-jeu/${tableId}/feuille${qs(params || {})}`),
};

export const tableCaveSignatureApi = {
  sign: (caveId: ID, signatureData: string) =>
    post<{ id: ID; signed_at: string }>(`/table-caves/${caveId}/signature`, { signature_data: signatureData }),
  get: (caveId: ID) => get<{ id: ID; signature_data: string; signed_at: string } | null>(`/table-caves/${caveId}/signature`),
};

export const tableProlongationSignatureApi = {
  sign: (prolongationId: ID, signatureData: string) =>
    post<{ id: ID; signed_at: string }>(`/table-prolongations/${prolongationId}/signature`, { signature_data: signatureData }),
};

export default tablesJeuApi;