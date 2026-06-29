// src/services/hotel.service.ts
import api from '../lib/api';

export interface Chambre {
  id: number;
  numero: string;
  type: string;
  prix: number;
  status: string;
  etage: number;
  capacite: number;
  created_at?: string;
  updated_at?: string;
}

export interface Reservation {
  id: number;
  chambre_id: number;
  client_id: number;
  date_arrivee: string;
  date_depart: string;
  montant_total: number;
  statut: string;
  created_at?: string;
  updated_at?: string;
}

export const hotelService = {
  // Chambres
  async getChambres(): Promise<Chambre[]> {
    try {
      const response = await api.get('/api/rooms');
      return response.data.data || [];
    } catch (error) {
      console.error('❌ Erreur getChambres:', error);
      throw error;
    }
  },

  async createChambre(data: Partial<Chambre>): Promise<Chambre> {
    const response = await api.post('/api/rooms', data);
    return response.data.data;
  },

  async updateChambre(id: number, data: Partial<Chambre>): Promise<Chambre> {
    const response = await api.put(`/api/rooms/${id}`, data);
    return response.data.data;
  },

  async deleteChambre(id: number): Promise<void> {
    await api.delete(`/api/rooms/${id}`);
  },

  // Réservations
  async getReservations(): Promise<Reservation[]> {
    try {
      const response = await api.get('/api/reservations');
      return response.data.data || [];
    } catch (error) {
      console.error('❌ Erreur getReservations:', error);
      throw error;
    }
  },

  async createReservation(data: Partial<Reservation>): Promise<Reservation> {
    const response = await api.post('/api/reservations', data);
    return response.data.data;
  },

  async updateReservation(id: number, data: Partial<Reservation>): Promise<Reservation> {
    const response = await api.put(`/api/reservations/${id}`, data);
    return response.data.data;
  },

  async deleteReservation(id: number): Promise<void> {
    await api.delete(`/api/reservations/${id}`);
  },

  // Statistiques
  async getHotelStats(): Promise<any> {
    try {
      const response = await api.get('/api/rooms/stats');
      return response.data.data;
    } catch (error) {
      console.error('❌ Erreur getHotelStats:', error);
      throw error;
    }
  }
};