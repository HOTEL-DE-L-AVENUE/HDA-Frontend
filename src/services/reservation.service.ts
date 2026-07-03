// src/services/reservation.service.ts
//
// Les réservations vivent sous le domaine "hébergement" côté backend
// (routes/hebergementRoutes.js, montées sous /api/hebergement), pas sous
// /api/reservations à la racine. Toutes les URLs ci-dessous ont été
// corrigées en conséquence.
import api from '../lib/api';
import { Reservation } from '../types/hotel.types';

const BASE_URL = '/api/hebergement/reservations';

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

      const url = `${BASE_URL}${params.toString() ? `?${params.toString()}` : ''}`;
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
      const response = await api.get<ApiResponse<Reservation>>(`${BASE_URL}/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`❌ Erreur getReservationById ${id}:`, error);
      throw error;
    }
  },

  // Créer une réservation
  // Note backend : la route vérifie la disponibilité de la chambre et peut aussi
  // accepter des accompagnants (reservation_guests) dans le même payload — non
  // exposés ici tant qu'aucun formulaire ne les utilise.
  createReservation: async (data: ReservationFormData): Promise<Reservation> => {
    try {
      const response = await api.post<ApiResponse<Reservation>>(BASE_URL, data);
      return response.data.data;
    } catch (error) {
      console.error('❌ Erreur createReservation:', error);
      throw error;
    }
  },

  // Mettre à jour une réservation
  updateReservation: async (id: number, data: Partial<ReservationFormData>): Promise<Reservation> => {
    try {
      const response = await api.put<ApiResponse<Reservation>>(`${BASE_URL}/${id}`, data);
      return response.data.data;
    } catch (error) {
      console.error(`❌ Erreur updateReservation ${id}:`, error);
      throw error;
    }
  },

  // Mettre à jour le statut d'une réservation.
  // Il n'existe pas de route dédiée PUT /:id/status côté backend (seule la route
  // CRUD générique PUT /:id est exposée) : on passe donc par updateReservation.
  // Si une route dédiée est ajoutée côté backend, il suffira de changer l'URL ici.
  updateReservationStatus: async (id: number, statut: string): Promise<Reservation> => {
    try {
      const response = await api.put<ApiResponse<Reservation>>(`${BASE_URL}/${id}`, { statut });
      return response.data.data;
    } catch (error) {
      console.error(`❌ Erreur updateReservationStatus ${id}:`, error);
      throw error;
    }
  },

  // Supprimer une réservation
  deleteReservation: async (id: number): Promise<void> => {
    try {
      await api.delete<ApiResponse<void>>(`${BASE_URL}/${id}`);
    } catch (error) {
      console.error(`❌ Erreur deleteReservation ${id}:`, error);
      throw error;
    }
  },

  // Statistiques des réservations.
  // ⚠️ Route non documentée / probablement inexistante côté backend
  // (GET /api/hebergement/reservations/stats). À créer si besoin — voir note
  // ci-dessous. En attendant, l'appel échouera en 404 plutôt que silencieusement.
  getReservationStats: async (): Promise<any> => {
    try {
      const response = await api.get<ApiResponse<any>>(`${BASE_URL}/stats`);
      return response.data.data;
    } catch (error) {
      console.error('❌ Erreur getReservationStats:', error);
      throw error;
    }
  }
};