// src/services/maintenance.service.ts
import api from '../lib/api';
import { RoomMaintenance } from '../types/hotel.types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
}

export interface MaintenanceFormData {
  room_id: number;
  equipment_id?: number | null;
  type_intervention: 'PREVENTIVE' | 'CORRECTIVE' | 'URGENCE';
  description?: string;
  statut?: 'OUVERT' | 'EN_COURS' | 'TERMINE' | 'ANNULE';
  date_declaration?: string;
  cout?: number;
  created_by?: number | null;
}

export const maintenanceService = {
  // Récupérer toutes les maintenances
  getMaintenances: async (filters?: {
    statut?: string;
    room_id?: number;
    type_intervention?: string;
  }): Promise<RoomMaintenance[]> => {
    try {
      const params = new URLSearchParams();
      if (filters?.statut) params.append('statut', filters.statut);
      if (filters?.room_id) params.append('room_id', String(filters.room_id));
      if (filters?.type_intervention) params.append('type_intervention', filters.type_intervention);
      
      const url = `/api/maintenances${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get<ApiResponse<RoomMaintenance[]>>(url);
      return response.data.data;
    } catch (error) {
      console.error('❌ Erreur getMaintenances:', error);
      throw error;
    }
  },

  // Récupérer une maintenance par ID
  getMaintenanceById: async (id: number): Promise<RoomMaintenance> => {
    try {
      const response = await api.get<ApiResponse<RoomMaintenance>>(`/api/maintenances/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`❌ Erreur getMaintenanceById ${id}:`, error);
      throw error;
    }
  },

  // Créer une maintenance
  createMaintenance: async (data: MaintenanceFormData): Promise<RoomMaintenance> => {
    try {
      const response = await api.post<ApiResponse<RoomMaintenance>>('/api/maintenances', data);
      return response.data.data;
    } catch (error) {
      console.error('❌ Erreur createMaintenance:', error);
      throw error;
    }
  },

  // Mettre à jour une maintenance
  updateMaintenance: async (id: number, data: Partial<MaintenanceFormData>): Promise<RoomMaintenance> => {
    try {
      const response = await api.put<ApiResponse<RoomMaintenance>>(`/api/maintenances/${id}`, data);
      return response.data.data;
    } catch (error) {
      console.error(`❌ Erreur updateMaintenance ${id}:`, error);
      throw error;
    }
  },

  // Mettre à jour le statut d'une maintenance
  updateMaintenanceStatus: async (id: number, statut: string): Promise<RoomMaintenance> => {
    try {
      const response = await api.put<ApiResponse<RoomMaintenance>>(`/api/maintenances/${id}/status`, { statut });
      return response.data.data;
    } catch (error) {
      console.error(`❌ Erreur updateMaintenanceStatus ${id}:`, error);
      throw error;
    }
  },

  // Supprimer une maintenance
  deleteMaintenance: async (id: number): Promise<void> => {
    try {
      await api.delete<ApiResponse<void>>(`/api/maintenances/${id}`);
    } catch (error) {
      console.error(`❌ Erreur deleteMaintenance ${id}:`, error);
      throw error;
    }
  },

  // Statistiques des maintenances
  getMaintenanceStats: async (): Promise<any> => {
    try {
      const response = await api.get<ApiResponse<any>>('/api/maintenances/stats');
      return response.data.data;
    } catch (error) {
      console.error('❌ Erreur getMaintenanceStats:', error);
      throw error;
    }
  }
};