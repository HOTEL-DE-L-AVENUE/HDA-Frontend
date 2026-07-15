// src/services/client.service.ts
import api from '../lib/api';

export interface Client {
  id: number;
  code_client: string | null;
  nom: string;
  prenom: string | null;
  telephone: string | null;
  email: string | null;
  adresse: string | null;
  date_naissance: string | null;
  type_piece: string | null;
  numero_piece: string | null;
  photo_url: string | null;
  is_casino_player: boolean;
  statut: 'ACTIF' | 'INACTIF' | 'BLOCKED';
  created_at?: string;
  updated_at?: string;
}

export interface ClientFormData {
  code_client?: string;
  nom: string;
  prenom?: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  date_naissance?: string;
  type_piece?: string;
  numero_piece?: string;
  photo_url?: string | null;
  is_casino_player?: boolean;
  statut?: 'ACTIF' | 'INACTIF' | 'BLOCKED';
}

export type NiveauRisque = 'FAIBLE' | 'MOYEN' | 'ELEVE';

// Fiche KYC (Know Your Customer) — conformité LBC/FT casino
export interface ClientKyc {
  id?: number;
  client_id?: number;
  // 1. Informations personnelles
  lieu_naissance: string | null;
  nationalite: string | null;
  profession: string | null;
  // 2. Vérification d'identité
  date_delivrance_piece: string | null;
  date_expiration_piece: string | null;
  autorite_delivrance: string | null;
  // 3. Informations financières
  source_revenus: string | null;
  revenu_mensuel_estime: number | null;
  mode_paiement: string | null;
  banque: string | null;
  // 4. Documents justificatifs
  doc_piece_identite: boolean;
  doc_justificatif_domicile: boolean;
  doc_photo_client: boolean;
  doc_autre: string | null;
  // 5. Évaluation du risque
  niveau_risque: NiveauRisque | null;
  commentaires_risque: string | null;
  // 6. Déclaration du client
  declaration_client: boolean;
  // 7. Validation du casino
  agent_verificateur?: number | null;
  date_verification: string | null;
  created_at?: string;
  updated_at?: string;
}

export type ClientKycFormData = Omit<ClientKyc, 'id' | 'client_id' | 'created_at' | 'updated_at'>;

export interface ClientWithDetails extends Client {
  solde: number | null;
  kyc: ClientKyc | null;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
}

export const clientService = {
  // Récupérer tous les clients
  getClients: async (filters?: { nom?: string; statut?: string; is_casino_player?: boolean }): Promise<Client[]> => {
    try {
      const params = new URLSearchParams();
      if (filters?.nom) params.append('nom', filters.nom);
      if (filters?.statut) params.append('statut', filters.statut);
      if (filters?.is_casino_player !== undefined) params.append('is_casino_player', String(filters.is_casino_player));
      
      const url = `/api/clients${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get<ApiResponse<Client[]>>(url);
      return response.data.data;
    } catch (error) {
      console.error('❌ Erreur getClients:', error);
      throw error;
    }
  },

  // Récupérer un client par ID
  getClientById: async (id: number): Promise<Client> => {
    try {
      const response = await api.get<ApiResponse<Client>>(`/api/clients/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`❌ Erreur getClientById ${id}:`, error);
      throw error;
    }
  },

  // Récupérer un client avec son solde et sa fiche KYC
  getClientWithDetails: async (id: number): Promise<ClientWithDetails> => {
    try {
      const response = await api.get<ApiResponse<ClientWithDetails>>(`/api/clients/${id}/full`);
      return response.data.data;
    } catch (error) {
      console.error(`❌ Erreur getClientWithDetails ${id}:`, error);
      throw error;
    }
  },

  // Créer un client
  createClient: async (data: ClientFormData): Promise<Client> => {
    try {
      const response = await api.post<ApiResponse<Client>>('/api/clients', data);
      return response.data.data;
    } catch (error) {
      console.error('❌ Erreur createClient:', error);
      throw error;
    }
  },

  // Mettre à jour un client
  updateClient: async (id: number, data: ClientFormData): Promise<Client> => {
    try {
      const response = await api.put<ApiResponse<Client>>(`/api/clients/${id}`, data);
      return response.data.data;
    } catch (error) {
      console.error(`❌ Erreur updateClient ${id}:`, error);
      throw error;
    }
  },

  // Supprimer un client
  deleteClient: async (id: number): Promise<void> => {
    try {
      await api.delete<ApiResponse<void>>(`/api/clients/${id}`);
    } catch (error) {
      console.error(`❌ Erreur deleteClient ${id}:`, error);
      throw error;
    }
  },

  // Récupérer la fiche KYC d'un client
  getClientKyc: async (id: number): Promise<ClientKyc | null> => {
    try {
      const response = await api.get<ApiResponse<ClientKyc | null>>(`/api/clients/${id}/kyc`);
      return response.data.data;
    } catch (error) {
      console.error(`❌ Erreur getClientKyc ${id}:`, error);
      throw error;
    }
  },

  // Créer ou mettre à jour la fiche KYC d'un client (upsert)
  saveClientKyc: async (id: number, data: ClientKycFormData): Promise<ClientKyc> => {
    try {
      const response = await api.put<ApiResponse<ClientKyc>>(`/api/clients/${id}/kyc`, data);
      return response.data.data;
    } catch (error) {
      console.error(`❌ Erreur saveClientKyc ${id}:`, error);
      throw error;
    }
  },

  // Dernière signature électronique liée à la déclaration KYC (ou null si aucune)
  getClientKycSignature: async (id: number): Promise<string | null> => {
    try {
      const response = await api.get<ApiResponse<{ signature_data: string } | null>>(`/api/clients/${id}/kyc/signature`);
      return response.data.data?.signature_data || null;
    } catch (error) {
      console.error(`❌ Erreur getClientKycSignature ${id}:`, error);
      throw error;
    }
  },

  // Historique complet des signatures KYC de ce client (du plus récent au plus ancien)
  getClientKycSignatureHistory: async (id: number): Promise<{ signature_data: string; signed_at: string }[]> => {
    try {
      const response = await api.get<ApiResponse<{ signature_data: string; signed_at: string }[]>>(`/api/clients/${id}/kyc/signature/history`);
      return response.data.data;
    } catch (error) {
      console.error(`❌ Erreur getClientKycSignatureHistory ${id}:`, error);
      throw error;
    }
  },

  // Enregistre une NOUVELLE signature (ne remplace jamais une signature précédente)
  createClientKycSignature: async (id: number, signatureData: string): Promise<void> => {
    try {
      await api.post<ApiResponse<unknown>>(`/api/clients/${id}/kyc/signature`, { signature_data: signatureData });
    } catch (error) {
      console.error(`❌ Erreur createClientKycSignature ${id}:`, error);
      throw error;
    }
  }
};