// src/services/reservation.service.ts
import api from '../lib/api';
import { Reservation } from '../types/hotel.types';

export interface ReservationFormData {
  client_id: number;
  room_id: number;
  date_arrivee: string;
  date_depart: string;
  montant_total: number;
  statut?: 'CONFIRMEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
}

export const reservationService = {
  // Récupérer toutes les réservations
  getReservations: async (filters?: {
    statut?: string;
    client_id?: number;
    room_id?: number;
    date_arrivee?: string;
    date_depart?: string;
  }): Promise<Reservation[]> => {
    try {
      const params = new URLSearchParams();
      if (filters?.statut) params.append('statut', filters.statut);
      if (filters?.client_id) params.append('client_id', String(filters.client_id));
      if (filters?.room_id) params.append('room_id', String(filters.room_id));
      if (filters?.date_arrivee) params.append('date_arrivee', filters.date_arrivee);
      if (filters?.date_depart) params.append('date_depart', filters.date_depart);
      
      const url = `/api/reservations${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get<ApiResponse<Reservation[]>>(url);
      return response.data.data;
    } catch (error) {
      console.error('❌ Erreur getReservations:', error);
      throw error;
    }
  },

  // Récupérer une réservation par ID
  getReservationById: async (id: number): Promise<Reservation> => {
    try {
      const response = await api.get<ApiResponse<Reservation>>(`/api/reservations/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`❌ Erreur getReservationById ${id}:`, error);
      throw error;
    }
  },

  // Créer une réservation
  createReservation: async (data: ReservationFormData): Promise<Reservation> => {
    try {
      const response = await api.post<ApiResponse<Reservation>>('/api/reservations', data);
      return response.data.data;
    } catch (error) {
      console.error('❌ Erreur createReservation:', error);
      throw error;
    }
  },

  // Mettre à jour une réservation
  updateReservation: async (id: number, data: Partial<ReservationFormData>): Promise<Reservation> => {
    try {
      const response = await api.put<ApiResponse<Reservation>>(`/api/reservations/${id}`, data);
      return response.data.data;
    } catch (error) {
      console.error(`❌ Erreur updateReservation ${id}:`, error);
      throw error;
    }
  },

  // Mettre à jour le statut d'une réservation
  updateReservationStatus: async (id: number, statut: string): Promise<Reservation> => {
    try {
      const response = await api.put<ApiResponse<Reservation>>(`/api/reservations/${id}/status`, { statut });
      return response.data.data;
    } catch (error) {
      console.error(`❌ Erreur updateReservationStatus ${id}:`, error);
      throw error;
    }
  },

  // Supprimer une réservation
  deleteReservation: async (id: number): Promise<void> => {
    try {
      await api.delete<ApiResponse<void>>(`/api/reservations/${id}`);
    } catch (error) {
      console.error(`❌ Erreur deleteReservation ${id}:`, error);
      throw error;
    }
  },

  // Statistiques des réservations
  getReservationStats: async (): Promise<any> => {
    try {
      const response = await api.get<ApiResponse<any>>('/api/reservations/stats');
      return response.data.data;
    } catch (error) {
      console.error('❌ Erreur getReservationStats:', error);
      throw error;
    }
  }
};