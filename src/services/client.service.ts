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

export interface ClientWithDetails extends Client {
  solde: number | null;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    message: string;
  };
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

  // Recherche multi-critères (nom, prénom, code_client, téléphone, email)
  searchClients: async (term: string, limit?: number): Promise<Client[]> => {
    try {
      const params = new URLSearchParams({ q: term });
      if (limit) params.append('limit', String(limit));
      const response = await api.get<ApiResponse<Client[]>>(`/api/clients/search?${params.toString()}`);
      return response.data.data;
    } catch (error) {
      console.error('❌ Erreur searchClients:', error);
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

  // Récupérer un client avec son solde
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
  deleteClient: async (id: number): Promise<{ 
    success: boolean; 
    message: string; 
    deleted: boolean; 
    deactivated: boolean; 
    relatedCount?: number 
  }> => {
    try {
      const response = await api.delete<ApiResponse<{ 
        success: boolean; 
        message: string; 
        deleted: boolean; 
        deactivated: boolean; 
        relatedCount?: number 
      }>>(`/api/clients/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`❌ Erreur deleteClient ${id}:`, error);
      throw error;
    }
  },

};